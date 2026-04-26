from decimal import Decimal, InvalidOperation
from uuid import UUID

import psycopg
from flask import current_app
from psycopg.rows import dict_row

from ..utils.pagination import pagination_meta
from ..utils.product_validators import (
    COUNTRY_PATTERN,
    CURRENCY_PATTERN,
    PUBLIC_PRODUCT_STATUS,
    PRODUCT_STATUSES,
    SORT_OPTIONS,
    ValidationError,
    validate_product_payload,
    validate_uploaded_image,
)


class CatalogError(Exception):
    def __init__(self, message, code="catalog_error", status_code=400, data=None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.data = data or {}


SORT_SQL = {
    "newest": "p.created_at DESC",
    "price_asc": "p.price ASC, p.created_at DESC",
    "price_desc": "p.price DESC, p.created_at DESC",
    "name_asc": "p.name ASC",
}


def _validate_uuid(value, field="id"):
    try:
        return str(UUID(str(value)))
    except (TypeError, ValueError) as exc:
        raise CatalogError(f"{field} must be a valid UUID.", code=f"invalid_{field}") from exc


def _connect():
    database_url = current_app.config.get("DATABASE_URL")
    if not database_url:
        raise CatalogError(
            "Product catalog is not available right now. Please try again later.",
            code="database_not_configured",
            status_code=503,
        )
    return psycopg.connect(database_url, row_factory=dict_row)


def _iso(value):
    return value.isoformat() if value else None


def _amount(value):
    if isinstance(value, Decimal):
        return str(value)
    return value


def _product_dict(row, images=None):
    return {
        "id": str(row["id"]),
        "merchant_id": str(row["merchant_id"]),
        "category": {
            "id": str(row["category_id"]),
            "name": row["category_name"],
            "slug": row["category_slug"],
        }
        if row.get("category_id")
        else None,
        "name": row["name"],
        "slug": row["slug"],
        "description": row.get("description"),
        "price": _amount(row["price"]),
        "currency_code": row["currency_code"],
        "stock_quantity": row["stock_quantity"],
        "status": row["status"],
        "country_of_origin": row.get("country_of_origin"),
        "available_country_codes": row.get("available_country_codes") or [],
        "images": images or [],
        "created_at": _iso(row.get("created_at")),
        "updated_at": _iso(row.get("updated_at")),
    }


def _image_dict(row):
    has_binary = bool(row.get("has_image_data"))
    stream_url = f"/api/v1/products/images/{row['id']}" if has_binary else None
    display_url = stream_url or row.get("image_url")
    return {
        "id": str(row["id"]),
        "product_id": str(row["product_id"]),
        "image_url": display_url,
        "url": display_url,
        "image_endpoint": stream_url,
        "has_binary": has_binary,
        "image_key": row.get("image_key"),
        "bucket_name": row.get("bucket_name"),
        "file_name": row.get("file_name"),
        "mime_type": row.get("mime_type"),
        "size_bytes": row.get("size_bytes"),
        "alt_text": row.get("alt_text"),
        "sort_order": row["sort_order"],
        "is_primary": row["is_primary"],
        "created_at": _iso(row.get("created_at")),
        "updated_at": _iso(row.get("updated_at")),
    }


def _product_select():
    return """
        SELECT p.id, p.merchant_id, p.category_id, p.name, p.slug, p.description,
               p.price, p.currency_code, p.stock_quantity, p.status,
               p.country_of_origin, p.available_country_codes,
               p.created_at, p.updated_at,
               c.name AS category_name, c.slug AS category_slug
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
    """


def _fetch_images(cursor, product_ids):
    if not product_ids:
        return {}
    cursor.execute(
        """
        SELECT id, product_id, image_url, image_key, bucket_name, file_name,
               image_data IS NOT NULL AS has_image_data,
               mime_type, size_bytes, alt_text, sort_order, is_primary,
               created_at, updated_at
        FROM product_images
        WHERE product_id = ANY(%s::uuid[])
        ORDER BY is_primary DESC, sort_order ASC, created_at ASC
        """,
        ([str(product_id) for product_id in product_ids],),
    )
    images = {}
    for row in cursor.fetchall():
        images.setdefault(str(row["product_id"]), []).append(_image_dict(row))
    return images


def _category_exists(cursor, category_id):
    if not category_id:
        return True
    category_id = _validate_uuid(category_id, "category_id")
    cursor.execute("SELECT 1 FROM categories WHERE id = %s", (category_id,))
    return bool(cursor.fetchone())


def _insert_images(cursor, product_id, images):
    for image in images:
        cursor.execute(
            """
            INSERT INTO product_images (
                product_id, image_data, image_url, image_key, bucket_name, file_name,
                mime_type, size_bytes, alt_text, sort_order, is_primary
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                product_id,
                image.get("image_data"),
                image["image_url"],
                image["image_key"],
                image["bucket_name"],
                image["file_name"],
                image["mime_type"],
                image["size_bytes"],
                image["alt_text"],
                image["sort_order"],
                image["is_primary"],
            ),
        )


def _filters_from_args(args, public_only=True):
    filters = []
    values = []

    if public_only:
        filters.append("p.status = %s")
        values.append(PUBLIC_PRODUCT_STATUS)
    elif args.get("status"):
        status = args.get("status").lower()
        if status not in PRODUCT_STATUSES:
            raise CatalogError("Product status is not supported.", code="invalid_status")
        filters.append("p.status = %s")
        values.append(status)

    q = (args.get("q") or "").strip()
    if q:
        filters.append("(p.name ILIKE %s OR p.description ILIKE %s OR c.name ILIKE %s)")
        pattern = f"%{q}%"
        values.extend([pattern, pattern, pattern])

    if args.get("category_id"):
        category_id = _validate_uuid(args.get("category_id"), "category_id")
        filters.append("p.category_id = %s")
        values.append(category_id)

    if args.get("category"):
        filters.append("c.slug = %s")
        values.append(args.get("category"))

    if args.get("currency_code"):
        currency_code = args.get("currency_code").upper()
        if not CURRENCY_PATTERN.match(currency_code):
            raise CatalogError("currency_code must be a three-letter currency code.", code="invalid_currency_code")
        filters.append("p.currency_code = %s")
        values.append(currency_code)

    if args.get("country"):
        country = args.get("country").upper()
        if not COUNTRY_PATTERN.match(country):
            raise CatalogError("country must be a two-letter country code.", code="invalid_country")
        filters.append("(p.country_of_origin = %s OR %s = ANY(p.available_country_codes))")
        values.extend([country, country])

    if args.get("min_price"):
        try:
            min_price = Decimal(args.get("min_price"))
        except (InvalidOperation, ValueError) as exc:
            raise CatalogError("min_price must be a valid number.", code="invalid_min_price") from exc
        if min_price < 0:
            raise CatalogError("min_price cannot be negative.", code="invalid_min_price")
        filters.append("p.price >= %s")
        values.append(min_price)

    if args.get("max_price"):
        try:
            max_price = Decimal(args.get("max_price"))
        except (InvalidOperation, ValueError) as exc:
            raise CatalogError("max_price must be a valid number.", code="invalid_max_price") from exc
        if max_price < 0:
            raise CatalogError("max_price cannot be negative.", code="invalid_max_price")
        filters.append("p.price <= %s")
        values.append(max_price)

    where_sql = " WHERE " + " AND ".join(filters) if filters else ""
    return where_sql, values


def list_public_products(args, page, page_size, offset):
    sort = args.get("sort", "newest")
    if sort not in SORT_OPTIONS:
        sort = "newest"
    where_sql, values = _filters_from_args(args, public_only=True)

    try:
        with _connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(f"SELECT COUNT(*) AS total FROM products p LEFT JOIN categories c ON c.id = p.category_id{where_sql}", values)
                total = cursor.fetchone()["total"]

                cursor.execute(
                    f"""
                    {_product_select()}
                    {where_sql}
                    ORDER BY {SORT_SQL[sort]}
                    LIMIT %s OFFSET %s
                    """,
                    [*values, page_size, offset],
                )
                rows = cursor.fetchall()
                images = _fetch_images(cursor, [row["id"] for row in rows])
    except (psycopg.errors.UndefinedTable, psycopg.errors.UndefinedColumn) as exc:
        raise CatalogError(
            "Product catalog setup is incomplete. Import backend/schema.sql or run the documented ALTER TABLE commands.",
            code="database_schema_missing",
            status_code=503,
        ) from exc
    except psycopg.Error as exc:
        current_app.logger.exception("Public product list failed: %s", exc)
        raise CatalogError(
            "We could not load products right now. Please try again later.",
            code="products_load_failed",
            status_code=503,
        ) from exc

    return {
        "items": [_product_dict(row, images.get(str(row["id"]), [])) for row in rows],
        "pagination": pagination_meta(page, page_size, total),
    }


def get_public_product(product_id):
    product_id = _validate_uuid(product_id, "product_id")
    try:
        with _connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    f"{_product_select()} WHERE p.id = %s AND p.status = %s",
                    (product_id, PUBLIC_PRODUCT_STATUS),
                )
                row = cursor.fetchone()
                if not row:
                    raise CatalogError("Product was not found.", code="product_not_found", status_code=404)
                images = _fetch_images(cursor, [row["id"]])
    except CatalogError:
        raise
    except (psycopg.errors.UndefinedTable, psycopg.errors.UndefinedColumn) as exc:
        raise CatalogError(
            "Product catalog setup is incomplete. Import backend/schema.sql or run the documented ALTER TABLE commands.",
            code="database_schema_missing",
            status_code=503,
        ) from exc
    except psycopg.Error as exc:
        current_app.logger.exception("Public product detail failed: %s", exc)
        raise CatalogError(
            "We could not load this product right now. Please try again later.",
            code="product_load_failed",
            status_code=503,
        ) from exc

    return {"product": _product_dict(row, images.get(str(row["id"]), []))}


def list_merchant_products(merchant_id, args, page, page_size, offset):
    filters = ["p.merchant_id = %s"]
    values = [merchant_id]
    if args.get("status"):
        filters.append("p.status = %s")
        values.append(args.get("status"))
    where_sql = " WHERE " + " AND ".join(filters)

    try:
        with _connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(f"SELECT COUNT(*) AS total FROM products p{where_sql}", values)
                total = cursor.fetchone()["total"]
                cursor.execute(
                    f"""
                    {_product_select()}
                    {where_sql}
                    ORDER BY p.created_at DESC
                    LIMIT %s OFFSET %s
                    """,
                    [*values, page_size, offset],
                )
                rows = cursor.fetchall()
                images = _fetch_images(cursor, [row["id"] for row in rows])
    except (psycopg.errors.UndefinedTable, psycopg.errors.UndefinedColumn) as exc:
        raise CatalogError(
            "Product catalog setup is incomplete. Import backend/schema.sql or run the documented ALTER TABLE commands.",
            code="database_schema_missing",
            status_code=503,
        ) from exc
    except psycopg.Error as exc:
        current_app.logger.exception("Merchant product list failed: %s", exc)
        raise CatalogError(
            "We could not load merchant products right now. Please try again later.",
            code="merchant_products_load_failed",
            status_code=503,
        ) from exc

    return {
        "items": [_product_dict(row, images.get(str(row["id"]), [])) for row in rows],
        "pagination": pagination_meta(page, page_size, total),
    }


def create_merchant_product(merchant_id, payload, image_file=None):
    try:
        cleaned = validate_product_payload(payload, require_core_fields=True)
        uploaded_image = validate_uploaded_image(
            image_file,
            current_app.config.get("MAX_PRODUCT_IMAGE_BYTES", 5 * 1024 * 1024),
        )
    except ValidationError as exc:
        raise CatalogError(exc.message, code=exc.code, data=exc.data) from exc

    if cleaned["status"] == "archived":
        raise CatalogError("Create products as draft, active, or inactive.", code="invalid_status")

    images = cleaned.pop("images", [])
    if uploaded_image:
        uploaded_image["alt_text"] = cleaned["name"]
        images = [uploaded_image, *images]

    try:
        with _connect() as connection:
            with connection.cursor() as cursor:
                if not _category_exists(cursor, cleaned["category_id"]):
                    raise CatalogError("Category was not found.", code="category_not_found", status_code=404)

                cursor.execute(
                    """
                    INSERT INTO products (
                        merchant_id, category_id, name, slug, description, price,
                        currency_code, stock_quantity, status, country_of_origin,
                        available_country_codes
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                    """,
                    (
                        merchant_id,
                        cleaned["category_id"],
                        cleaned["name"],
                        cleaned["slug"],
                        cleaned["description"],
                        cleaned["price"],
                        cleaned["currency_code"],
                        cleaned["stock_quantity"],
                        cleaned["status"],
                        cleaned["country_of_origin"],
                        cleaned["available_country_codes"],
                    ),
                )
                product_id = cursor.fetchone()["id"]
                _insert_images(cursor, product_id, images)

                cursor.execute(f"{_product_select()} WHERE p.id = %s", (product_id,))
                row = cursor.fetchone()
                product_images = _fetch_images(cursor, [product_id])
    except CatalogError:
        raise
    except psycopg.errors.UniqueViolation as exc:
        raise CatalogError("A product with this slug already exists.", code="slug_already_exists", status_code=409) from exc
    except (psycopg.errors.UndefinedTable, psycopg.errors.UndefinedColumn) as exc:
        raise CatalogError(
            "Product catalog setup is incomplete. Import backend/schema.sql or run the documented ALTER TABLE commands.",
            code="database_schema_missing",
            status_code=503,
        ) from exc
    except psycopg.Error as exc:
        current_app.logger.exception("Merchant product create failed: %s", exc)
        raise CatalogError(
            "We could not create the product right now. Please try again later.",
            code="product_create_failed",
            status_code=503,
        ) from exc

    return {"product": _product_dict(row, product_images.get(str(row["id"]), []))}


def get_product_image(image_id):
    image_id = _validate_uuid(image_id, "image_id")
    try:
        with _connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT id, image_data, file_name, mime_type, size_bytes
                    FROM product_images
                    WHERE id = %s AND image_data IS NOT NULL
                    """,
                    (image_id,),
                )
                row = cursor.fetchone()
                if not row:
                    raise CatalogError("Image was not found.", code="image_not_found", status_code=404)
    except CatalogError:
        raise
    except psycopg.errors.UndefinedColumn as exc:
        raise CatalogError(
            "Product image setup is incomplete. Add image_data BYTEA to product_images.",
            code="database_schema_missing",
            status_code=503,
        ) from exc
    except (psycopg.errors.UndefinedTable, psycopg.errors.UndefinedColumn) as exc:
        raise CatalogError(
            "Product catalog setup is incomplete. Import backend/schema.sql or run the documented ALTER TABLE commands.",
            code="database_schema_missing",
            status_code=503,
        ) from exc
    except psycopg.Error as exc:
        current_app.logger.exception("Product image load failed: %s", exc)
        raise CatalogError(
            "We could not load this product image right now. Please try again later.",
            code="product_image_load_failed",
            status_code=503,
        ) from exc

    return {
        "data": bytes(row["image_data"]),
        "file_name": row.get("file_name") or f"{image_id}.jpg",
        "mime_type": row.get("mime_type") or "application/octet-stream",
        "size_bytes": row.get("size_bytes"),
    }


def update_merchant_product(merchant_id, product_id, payload):
    product_id = _validate_uuid(product_id, "product_id")
    try:
        cleaned = validate_product_payload(payload, require_core_fields=False)
    except ValidationError as exc:
        raise CatalogError(exc.message, code=exc.code, data=exc.data) from exc

    images = cleaned.pop("images", None)
    product_fields = cleaned

    try:
        with _connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT id FROM products WHERE id = %s AND merchant_id = %s", (product_id, merchant_id))
                if not cursor.fetchone():
                    raise CatalogError("Product was not found.", code="product_not_found", status_code=404)

                if product_fields.get("category_id") and not _category_exists(cursor, product_fields["category_id"]):
                    raise CatalogError("Category was not found.", code="category_not_found", status_code=404)

                if product_fields:
                    assignments = ", ".join(f"{field} = %s" for field in product_fields)
                    cursor.execute(
                        f"UPDATE products SET {assignments} WHERE id = %s AND merchant_id = %s",
                        [*product_fields.values(), product_id, merchant_id],
                    )

                if images is not None:
                    cursor.execute("DELETE FROM product_images WHERE product_id = %s", (product_id,))
                    _insert_images(cursor, product_id, images)

                cursor.execute(f"{_product_select()} WHERE p.id = %s AND p.merchant_id = %s", (product_id, merchant_id))
                row = cursor.fetchone()
                product_images = _fetch_images(cursor, [row["id"]])
    except CatalogError:
        raise
    except psycopg.errors.UniqueViolation as exc:
        raise CatalogError("A product with this slug already exists.", code="slug_already_exists", status_code=409) from exc
    except (psycopg.errors.UndefinedTable, psycopg.errors.UndefinedColumn) as exc:
        raise CatalogError(
            "Product catalog setup is incomplete. Import backend/schema.sql or run the documented ALTER TABLE commands.",
            code="database_schema_missing",
            status_code=503,
        ) from exc
    except psycopg.Error as exc:
        current_app.logger.exception("Merchant product update failed: %s", exc)
        raise CatalogError(
            "We could not update the product right now. Please try again later.",
            code="product_update_failed",
            status_code=503,
        ) from exc

    return {"product": _product_dict(row, product_images.get(str(row["id"]), []))}


def update_merchant_product_status(merchant_id, product_id, status):
    product_id = _validate_uuid(product_id, "product_id")
    try:
        cleaned = validate_product_payload({"status": status}, require_core_fields=False)
    except ValidationError as exc:
        raise CatalogError(exc.message, code=exc.code, data=exc.data) from exc

    try:
        with _connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    UPDATE products
                    SET status = %s
                    WHERE id = %s AND merchant_id = %s
                    RETURNING id
                    """,
                    (cleaned["status"], product_id, merchant_id),
                )
                row = cursor.fetchone()
                if not row:
                    raise CatalogError("Product was not found.", code="product_not_found", status_code=404)

                cursor.execute(f"{_product_select()} WHERE p.id = %s AND p.merchant_id = %s", (product_id, merchant_id))
                product = cursor.fetchone()
                images = _fetch_images(cursor, [product["id"]])
    except CatalogError:
        raise
    except (psycopg.errors.UndefinedTable, psycopg.errors.UndefinedColumn) as exc:
        raise CatalogError(
            "Product catalog setup is incomplete. Import backend/schema.sql or run the documented ALTER TABLE commands.",
            code="database_schema_missing",
            status_code=503,
        ) from exc
    except psycopg.Error as exc:
        current_app.logger.exception("Merchant product status update failed: %s", exc)
        raise CatalogError(
            "We could not update the product status right now. Please try again later.",
            code="product_status_update_failed",
            status_code=503,
        ) from exc

    return {"product": _product_dict(product, images.get(str(product["id"]), []))}
