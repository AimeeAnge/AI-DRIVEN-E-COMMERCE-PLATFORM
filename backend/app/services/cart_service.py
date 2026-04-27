from decimal import Decimal

import psycopg
from flask import current_app
from psycopg.rows import dict_row

from ..utils.cart_validators import ValidationError, validate_cart_item_payload, validate_uuid


class CartError(Exception):
    def __init__(self, message, code="cart_error", status_code=400, data=None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.data = data or {}


def _connect():
    database_url = current_app.config.get("DATABASE_URL")
    if not database_url:
        raise CartError(
            "Cart is not available right now. Please try again later.",
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


def _get_or_create_cart(cursor, user_id):
    cursor.execute(
        """
        INSERT INTO carts (user_id)
        VALUES (%s)
        ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
        RETURNING id, user_id, currency_code, created_at, updated_at
        """,
        (user_id,),
    )
    return cursor.fetchone()


def _primary_image_select():
    return """
        LEFT JOIN LATERAL (
            SELECT id, image_url, image_data IS NOT NULL AS has_image_data, alt_text
            FROM product_images
            WHERE product_id = p.id
            ORDER BY is_primary DESC, sort_order ASC, created_at ASC
            LIMIT 1
        ) pi ON TRUE
    """


def _fetch_cart_items(cursor, cart_id):
    cursor.execute(
        f"""
        SELECT ci.id, ci.cart_id, ci.product_id, ci.quantity, ci.created_at, ci.updated_at,
               p.name, p.slug, p.price, p.currency_code, p.stock_quantity, p.status,
               pi.id AS image_id, pi.image_url, pi.has_image_data, pi.alt_text
        FROM cart_items ci
        JOIN products p ON p.id = ci.product_id
        {_primary_image_select()}
        WHERE ci.cart_id = %s
        ORDER BY ci.created_at ASC
        """,
        (cart_id,),
    )
    return cursor.fetchall()


def _cart_response(cart, items):
    subtotal = Decimal("0.00")
    item_count = 0
    response_items = []

    for item in items:
        line_total = item["price"] * item["quantity"]
        subtotal += line_total
        item_count += item["quantity"]
        image_endpoint = f"/api/v1/products/images/{item['image_id']}" if item.get("has_image_data") and item.get("image_id") else None
        image_url = image_endpoint or item.get("image_url")
        response_items.append(
            {
                "id": str(item["id"]),
                "product_id": str(item["product_id"]),
                "quantity": item["quantity"],
                "product": {
                    "id": str(item["product_id"]),
                    "name": item["name"],
                    "slug": item["slug"],
                    "price": _amount(item["price"]),
                    "currency_code": item["currency_code"],
                    "stock_quantity": item["stock_quantity"],
                    "status": item["status"],
                    "primary_image": {
                        "id": str(item["image_id"]) if item.get("image_id") else None,
                        "image_url": image_url,
                        "url": image_url,
                        "image_endpoint": image_endpoint,
                        "has_binary": bool(item.get("has_image_data")),
                        "alt_text": item.get("alt_text"),
                    }
                    if image_url
                    else None,
                },
                "line_total": _amount(line_total),
                "created_at": _iso(item.get("created_at")),
                "updated_at": _iso(item.get("updated_at")),
            }
        )

    return {
        "cart": {
            "id": str(cart["id"]),
            "currency_code": cart["currency_code"],
            "items": response_items,
            "summary": {
                "subtotal_amount": _amount(subtotal),
                "item_count": item_count,
            },
            "created_at": _iso(cart.get("created_at")),
            "updated_at": _iso(cart.get("updated_at")),
        }
    }


def _load_active_product(cursor, product_id):
    cursor.execute(
        """
        SELECT id, price, currency_code, stock_quantity, status
        FROM products
        WHERE id = %s
        """,
        (product_id,),
    )
    product = cursor.fetchone()
    if not product or product["status"] != "active":
        raise CartError("This product is not available.", code="product_unavailable", status_code=404)
    return product


def _ensure_cart_currency(cursor, cart, product_currency):
    cursor.execute("SELECT COUNT(*) AS count FROM cart_items WHERE cart_id = %s", (cart["id"],))
    item_count = cursor.fetchone()["count"]
    if item_count == 0 and cart["currency_code"] != product_currency:
        cursor.execute(
            "UPDATE carts SET currency_code = %s WHERE id = %s RETURNING id, user_id, currency_code, created_at, updated_at",
            (product_currency, cart["id"]),
        )
        return cursor.fetchone()
    if item_count > 0 and cart["currency_code"] != product_currency:
        raise CartError(
            "Cart items must use the same currency.",
            code="mixed_cart_currency",
        )
    return cart


def get_cart(user_id):
    try:
        with _connect() as connection:
            with connection.cursor() as cursor:
                cart = _get_or_create_cart(cursor, user_id)
                items = _fetch_cart_items(cursor, cart["id"])
    except psycopg.errors.UndefinedTable as exc:
        raise CartError(
            "Cart setup is incomplete. Import backend/schema.sql into PostgreSQL.",
            code="database_schema_missing",
            status_code=503,
        ) from exc
    except psycopg.Error as exc:
        current_app.logger.exception("Cart load failed: %s", exc)
        raise CartError(
            "We could not load your cart right now. Please try again later.",
            code="cart_load_failed",
            status_code=503,
        ) from exc

    return _cart_response(cart, items)


def add_cart_item(user_id, payload):
    try:
        cleaned = validate_cart_item_payload(payload, require_product=True)
    except ValidationError as exc:
        raise CartError(exc.message, code=exc.code, data=exc.data) from exc

    try:
        with _connect() as connection:
            with connection.cursor() as cursor:
                cart = _get_or_create_cart(cursor, user_id)
                product = _load_active_product(cursor, cleaned["product_id"])
                cart = _ensure_cart_currency(cursor, cart, product["currency_code"])

                cursor.execute(
                    """
                    SELECT id, quantity
                    FROM cart_items
                    WHERE cart_id = %s AND product_id = %s
                    """,
                    (cart["id"], product["id"]),
                )
                existing = cursor.fetchone()
                next_quantity = cleaned["quantity"] + (existing["quantity"] if existing else 0)
                if next_quantity > product["stock_quantity"]:
                    raise CartError("Requested quantity is not available.", code="insufficient_stock")

                if existing:
                    cursor.execute(
                        "UPDATE cart_items SET quantity = %s WHERE id = %s",
                        (next_quantity, existing["id"]),
                    )
                else:
                    cursor.execute(
                        """
                        INSERT INTO cart_items (cart_id, product_id, quantity)
                        VALUES (%s, %s, %s)
                        """,
                        (cart["id"], product["id"], cleaned["quantity"]),
                    )

                items = _fetch_cart_items(cursor, cart["id"])
    except CartError:
        raise
    except psycopg.errors.UndefinedTable as exc:
        raise CartError(
            "Cart setup is incomplete. Import backend/schema.sql into PostgreSQL.",
            code="database_schema_missing",
            status_code=503,
        ) from exc
    except psycopg.Error as exc:
        current_app.logger.exception("Cart item add failed: %s", exc)
        raise CartError(
            "We could not add this item right now. Please try again later.",
            code="cart_item_add_failed",
            status_code=503,
        ) from exc

    return _cart_response(cart, items)


def update_cart_item(user_id, item_id, payload):
    try:
        item_id = validate_uuid(item_id, "item_id")
        cleaned = validate_cart_item_payload(payload, require_product=False)
    except ValidationError as exc:
        raise CartError(exc.message, code=exc.code, data=exc.data) from exc

    try:
        with _connect() as connection:
            with connection.cursor() as cursor:
                cart = _get_or_create_cart(cursor, user_id)
                cursor.execute(
                    """
                    SELECT ci.id, ci.product_id, p.stock_quantity, p.status
                    FROM cart_items ci
                    JOIN carts c ON c.id = ci.cart_id
                    JOIN products p ON p.id = ci.product_id
                    WHERE ci.id = %s AND c.user_id = %s
                    """,
                    (item_id, user_id),
                )
                item = cursor.fetchone()
                if not item:
                    raise CartError("Cart item was not found.", code="cart_item_not_found", status_code=404)
                if item["status"] != "active":
                    raise CartError("This product is no longer available.", code="product_unavailable")
                if cleaned["quantity"] > item["stock_quantity"]:
                    raise CartError("Requested quantity is not available.", code="insufficient_stock")

                cursor.execute(
                    "UPDATE cart_items SET quantity = %s WHERE id = %s",
                    (cleaned["quantity"], item_id),
                )
                items = _fetch_cart_items(cursor, cart["id"])
    except CartError:
        raise
    except psycopg.errors.UndefinedTable as exc:
        raise CartError(
            "Cart setup is incomplete. Import backend/schema.sql into PostgreSQL.",
            code="database_schema_missing",
            status_code=503,
        ) from exc
    except psycopg.Error as exc:
        current_app.logger.exception("Cart item update failed: %s", exc)
        raise CartError(
            "We could not update this item right now. Please try again later.",
            code="cart_item_update_failed",
            status_code=503,
        ) from exc

    return _cart_response(cart, items)


def remove_cart_item(user_id, item_id):
    try:
        item_id = validate_uuid(item_id, "item_id")
    except ValidationError as exc:
        raise CartError(exc.message, code=exc.code, data=exc.data) from exc

    try:
        with _connect() as connection:
            with connection.cursor() as cursor:
                cart = _get_or_create_cart(cursor, user_id)
                cursor.execute(
                    """
                    DELETE FROM cart_items ci
                    USING carts c
                    WHERE ci.cart_id = c.id
                      AND ci.id = %s
                      AND c.user_id = %s
                    RETURNING ci.id
                    """,
                    (item_id, user_id),
                )
                if not cursor.fetchone():
                    raise CartError("Cart item was not found.", code="cart_item_not_found", status_code=404)
                items = _fetch_cart_items(cursor, cart["id"])
    except CartError:
        raise
    except psycopg.errors.UndefinedTable as exc:
        raise CartError(
            "Cart setup is incomplete. Import backend/schema.sql into PostgreSQL.",
            code="database_schema_missing",
            status_code=503,
        ) from exc
    except psycopg.Error as exc:
        current_app.logger.exception("Cart item remove failed: %s", exc)
        raise CartError(
            "We could not remove this item right now. Please try again later.",
            code="cart_item_remove_failed",
            status_code=503,
        ) from exc

    return _cart_response(cart, items)
