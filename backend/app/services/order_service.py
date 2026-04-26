from datetime import datetime, timezone
from decimal import Decimal
from secrets import token_hex

import psycopg
from flask import current_app
from psycopg.rows import dict_row

from ..utils.cart_validators import ValidationError as CartValidationError
from ..utils.cart_validators import validate_uuid
from ..utils.order_validators import ORDER_STATUSES, ValidationError, validate_order_payload
from ..utils.pagination import pagination_meta


class OrderError(Exception):
    def __init__(self, message, code="order_error", status_code=400, data=None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.data = data or {}


def _connect():
    database_url = current_app.config.get("DATABASE_URL")
    if not database_url:
        raise OrderError(
            "Orders are not available right now. Please try again later.",
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


def _order_number():
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d")
    return f"AIDEP-{stamp}-{token_hex(4).upper()}"


def _order_dict(row, items=None):
    return {
        "id": str(row["id"]),
        "order_number": row["order_number"],
        "status": row["status"],
        "subtotal_amount": _amount(row["subtotal_amount"]),
        "shipping_amount": _amount(row["shipping_amount"]),
        "tax_amount": _amount(row["tax_amount"]),
        "total_amount": _amount(row["total_amount"]),
        "currency_code": row["currency_code"],
        "shipping_country_code": row.get("shipping_country_code"),
        "shipping_region": row.get("shipping_region"),
        "shipping_city": row.get("shipping_city"),
        "shipping_address_line1": row.get("shipping_address_line1"),
        "shipping_address_line2": row.get("shipping_address_line2"),
        "items": items or [],
        "created_at": _iso(row.get("created_at")),
        "updated_at": _iso(row.get("updated_at")),
    }


def _order_item_dict(row):
    return {
        "id": str(row["id"]),
        "product_id": str(row["product_id"]),
        "merchant_id": str(row["merchant_id"]),
        "product_name": row["product_name"],
        "unit_price": _amount(row["unit_price"]),
        "quantity": row["quantity"],
        "total_price": _amount(row["total_price"]),
        "created_at": _iso(row.get("created_at")),
        "updated_at": _iso(row.get("updated_at")),
    }


def _fetch_order_items(cursor, order_id):
    cursor.execute(
        """
        SELECT id, order_id, product_id, merchant_id, product_name,
               unit_price, quantity, total_price, created_at, updated_at
        FROM order_items
        WHERE order_id = %s
        ORDER BY created_at ASC
        """,
        (order_id,),
    )
    return [_order_item_dict(row) for row in cursor.fetchall()]


def _fetch_cart_checkout_items(cursor, user_id):
    cursor.execute(
        """
        SELECT c.id AS cart_id, ci.id AS cart_item_id, ci.product_id, ci.quantity,
               p.merchant_id, p.name, p.price, p.currency_code, p.stock_quantity,
               p.status
        FROM carts c
        JOIN cart_items ci ON ci.cart_id = c.id
        JOIN products p ON p.id = ci.product_id
        WHERE c.user_id = %s
        ORDER BY ci.created_at ASC
        FOR UPDATE OF p
        """,
        (user_id,),
    )
    return cursor.fetchall()


def create_order(user_id, payload):
    try:
        shipping = validate_order_payload(payload)
    except ValidationError as exc:
        raise OrderError(exc.message, code=exc.code, data=exc.data) from exc

    try:
        with _connect() as connection:
            with connection.cursor() as cursor:
                items = _fetch_cart_checkout_items(cursor, user_id)
                if not items:
                    raise OrderError("Your cart is empty.", code="empty_cart")

                currency_codes = {item["currency_code"] for item in items}
                if len(currency_codes) != 1:
                    raise OrderError("Cart items must use the same currency.", code="mixed_cart_currency")

                subtotal = Decimal("0.00")
                for item in items:
                    if item["status"] != "active":
                        raise OrderError(
                            f"{item['name']} is no longer available.",
                            code="product_unavailable",
                        )
                    if item["quantity"] > item["stock_quantity"]:
                        raise OrderError(
                            f"{item['name']} does not have enough stock.",
                            code="insufficient_stock",
                        )
                    subtotal += item["price"] * item["quantity"]

                shipping_amount = Decimal("0.00")
                tax_amount = Decimal("0.00")
                total_amount = subtotal + shipping_amount + tax_amount
                currency_code = next(iter(currency_codes))

                cursor.execute(
                    """
                    INSERT INTO orders (
                        user_id, order_number, status, subtotal_amount,
                        shipping_amount, tax_amount, total_amount, currency_code,
                        shipping_country_code, shipping_region, shipping_city,
                        shipping_address_line1, shipping_address_line2
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id, order_number, status, subtotal_amount,
                              shipping_amount, tax_amount, total_amount, currency_code,
                              shipping_country_code, shipping_region, shipping_city,
                              shipping_address_line1, shipping_address_line2,
                              created_at, updated_at
                    """,
                    (
                        user_id,
                        _order_number(),
                        "pending",
                        subtotal,
                        shipping_amount,
                        tax_amount,
                        total_amount,
                        currency_code,
                        shipping["shipping_country_code"],
                        shipping["shipping_region"],
                        shipping["shipping_city"],
                        shipping["shipping_address_line1"],
                        shipping["shipping_address_line2"],
                    ),
                )
                order = cursor.fetchone()

                for item in items:
                    line_total = item["price"] * item["quantity"]
                    cursor.execute(
                        """
                        INSERT INTO order_items (
                            order_id, product_id, merchant_id, product_name,
                            unit_price, quantity, total_price
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                        """,
                        (
                            order["id"],
                            item["product_id"],
                            item["merchant_id"],
                            item["name"],
                            item["price"],
                            item["quantity"],
                            line_total,
                        ),
                    )
                    cursor.execute(
                        """
                        UPDATE products
                        SET stock_quantity = stock_quantity - %s
                        WHERE id = %s
                        """,
                        (item["quantity"], item["product_id"]),
                    )

                cursor.execute("DELETE FROM cart_items WHERE cart_id = %s", (items[0]["cart_id"],))
                order_items = _fetch_order_items(cursor, order["id"])
    except OrderError:
        raise
    except psycopg.errors.UniqueViolation as exc:
        raise OrderError(
            "We could not create the order number. Please try again.",
            code="order_number_conflict",
            status_code=409,
        ) from exc
    except psycopg.errors.UndefinedTable as exc:
        raise OrderError(
            "Order setup is incomplete. Import backend/schema.sql into PostgreSQL.",
            code="database_schema_missing",
            status_code=503,
        ) from exc
    except psycopg.Error as exc:
        current_app.logger.exception("Order create failed: %s", exc)
        raise OrderError(
            "We could not create your order right now. Please try again later.",
            code="order_create_failed",
            status_code=503,
        ) from exc

    return {"order": _order_dict(order, order_items)}


def list_orders(user_id, page, page_size, offset):
    try:
        with _connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT COUNT(*) AS total FROM orders WHERE user_id = %s", (user_id,))
                total = cursor.fetchone()["total"]
                cursor.execute(
                    """
                    SELECT id, order_number, status, subtotal_amount, shipping_amount,
                           tax_amount, total_amount, currency_code,
                           shipping_country_code, shipping_region, shipping_city,
                           shipping_address_line1, shipping_address_line2,
                           created_at, updated_at
                    FROM orders
                    WHERE user_id = %s
                    ORDER BY created_at DESC
                    LIMIT %s OFFSET %s
                    """,
                    (user_id, page_size, offset),
                )
                rows = cursor.fetchall()
    except psycopg.errors.UndefinedTable as exc:
        raise OrderError(
            "Order setup is incomplete. Import backend/schema.sql into PostgreSQL.",
            code="database_schema_missing",
            status_code=503,
        ) from exc
    except psycopg.Error as exc:
        current_app.logger.exception("Order list failed: %s", exc)
        raise OrderError(
            "We could not load your orders right now. Please try again later.",
            code="orders_load_failed",
            status_code=503,
        ) from exc

    return {
        "items": [_order_dict(row) for row in rows],
        "pagination": pagination_meta(page, page_size, total),
    }


def get_order(user_id, order_id):
    try:
        order_id = validate_uuid(order_id, "order_id")
    except CartValidationError as exc:
        raise OrderError(exc.message, code=exc.code, data=exc.data) from exc

    try:
        with _connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT id, order_number, status, subtotal_amount, shipping_amount,
                           tax_amount, total_amount, currency_code,
                           shipping_country_code, shipping_region, shipping_city,
                           shipping_address_line1, shipping_address_line2,
                           created_at, updated_at
                    FROM orders
                    WHERE id = %s AND user_id = %s
                    """,
                    (order_id, user_id),
                )
                order = cursor.fetchone()
                if not order:
                    raise OrderError("Order was not found.", code="order_not_found", status_code=404)
                items = _fetch_order_items(cursor, order["id"])
    except OrderError:
        raise
    except psycopg.errors.UndefinedTable as exc:
        raise OrderError(
            "Order setup is incomplete. Import backend/schema.sql into PostgreSQL.",
            code="database_schema_missing",
            status_code=503,
        ) from exc
    except psycopg.Error as exc:
        current_app.logger.exception("Order detail failed: %s", exc)
        raise OrderError(
            "We could not load this order right now. Please try again later.",
            code="order_load_failed",
            status_code=503,
        ) from exc

    return {"order": _order_dict(order, items)}
