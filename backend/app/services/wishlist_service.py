from decimal import Decimal

import psycopg
from flask import current_app
from psycopg.rows import dict_row

from ..utils.cart_validators import ValidationError
from ..utils.wishlist_validators import validate_wishlist_item_id, validate_wishlist_payload


class WishlistError(Exception):
    def __init__(self, message, code="wishlist_error", status_code=400, data=None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.data = data or {}


def _connect():
    database_url = current_app.config.get("DATABASE_URL")
    if not database_url:
        raise WishlistError(
            "Wishlist is not available right now. Please try again later.",
            code="database_not_configured",
            status_code=503,
        )
    return psycopg.connect(database_url, row_factory=dict_row)


def _amount(value):
    if isinstance(value, Decimal):
        return str(value.quantize(Decimal("0.01")))
    return value


def _iso(value):
    return value.isoformat() if value else None


def _wishlist_item(row):
    primary_image = None
    image_endpoint = f"/api/v1/products/images/{row['image_id']}" if row.get("has_image_data") and row.get("image_id") else None
    image_url = image_endpoint or row.get("image_url")
    if image_url:
        primary_image = {
            "id": str(row["image_id"]) if row.get("image_id") else None,
            "image_url": image_url,
            "url": image_url,
            "image_endpoint": image_endpoint,
            "has_binary": bool(row.get("has_image_data")),
            "alt_text": row.get("alt_text"),
        }

    return {
        "id": str(row["id"]),
        "product_id": str(row["product_id"]),
        "created_at": _iso(row.get("created_at")),
        "product": {
            "id": str(row["product_id"]),
            "name": row["name"],
            "slug": row["slug"],
            "price": _amount(row["price"]),
            "currency_code": row["currency_code"],
            "status": row["status"],
            "primary_image": primary_image,
        },
    }


def list_wishlist(user_id):
    try:
        with _connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT wi.id, wi.product_id, wi.created_at,
                           p.name, p.slug, p.price, p.currency_code, p.status,
                           pi.id AS image_id, pi.image_url, pi.has_image_data, pi.alt_text
                    FROM wishlist_items wi
                    JOIN products p ON p.id = wi.product_id
                    LEFT JOIN LATERAL (
                        SELECT id, image_url, image_data IS NOT NULL AS has_image_data, alt_text
                        FROM product_images
                        WHERE product_id = p.id
                        ORDER BY is_primary DESC, sort_order ASC, created_at ASC
                        LIMIT 1
                    ) pi ON TRUE
                    WHERE wi.user_id = %s
                    ORDER BY wi.created_at DESC
                    """,
                    (user_id,),
                )
                rows = cursor.fetchall()
    except psycopg.errors.UndefinedTable as exc:
        raise WishlistError(
            "Wishlist setup is incomplete. Import backend/schema.sql into PostgreSQL.",
            code="database_schema_missing",
            status_code=503,
        ) from exc
    except psycopg.Error as exc:
        current_app.logger.exception("Wishlist load failed: %s", exc)
        raise WishlistError(
            "We could not load your wishlist right now. Please try again later.",
            code="wishlist_load_failed",
            status_code=503,
        ) from exc

    return {"items": [_wishlist_item(row) for row in rows]}


def add_wishlist_item(user_id, payload):
    try:
        cleaned = validate_wishlist_payload(payload)
    except ValidationError as exc:
        raise WishlistError(exc.message, code=exc.code, data=exc.data) from exc

    try:
        with _connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT id, status FROM products WHERE id = %s",
                    (cleaned["product_id"],),
                )
                product = cursor.fetchone()
                if not product or product["status"] != "active":
                    raise WishlistError("This product is not available.", code="product_unavailable", status_code=404)

                cursor.execute(
                    """
                    INSERT INTO wishlist_items (user_id, product_id)
                    VALUES (%s, %s)
                    ON CONFLICT (user_id, product_id) DO UPDATE
                    SET product_id = EXCLUDED.product_id
                    RETURNING id, product_id, created_at
                    """,
                    (user_id, cleaned["product_id"]),
                )
                item = cursor.fetchone()
    except WishlistError:
        raise
    except psycopg.errors.UndefinedTable as exc:
        raise WishlistError(
            "Wishlist setup is incomplete. Import backend/schema.sql into PostgreSQL.",
            code="database_schema_missing",
            status_code=503,
        ) from exc
    except psycopg.Error as exc:
        current_app.logger.exception("Wishlist add failed: %s", exc)
        raise WishlistError(
            "We could not add this product to your wishlist right now.",
            code="wishlist_add_failed",
            status_code=503,
        ) from exc

    return {
        "item": {
            "id": str(item["id"]),
            "product_id": str(item["product_id"]),
            "created_at": _iso(item.get("created_at")),
        }
    }


def remove_wishlist_item(user_id, item_id):
    try:
        item_id = validate_wishlist_item_id(item_id)
    except ValidationError as exc:
        raise WishlistError(exc.message, code=exc.code, data=exc.data) from exc

    try:
        with _connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    DELETE FROM wishlist_items
                    WHERE id = %s AND user_id = %s
                    RETURNING id
                    """,
                    (item_id, user_id),
                )
                if not cursor.fetchone():
                    raise WishlistError("Wishlist item was not found.", code="wishlist_item_not_found", status_code=404)
    except WishlistError:
        raise
    except psycopg.errors.UndefinedTable as exc:
        raise WishlistError(
            "Wishlist setup is incomplete. Import backend/schema.sql into PostgreSQL.",
            code="database_schema_missing",
            status_code=503,
        ) from exc
    except psycopg.Error as exc:
        current_app.logger.exception("Wishlist remove failed: %s", exc)
        raise WishlistError(
            "We could not remove this wishlist item right now.",
            code="wishlist_remove_failed",
            status_code=503,
        ) from exc

    return {}
