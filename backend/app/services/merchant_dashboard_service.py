from decimal import Decimal

import psycopg
from flask import current_app
from psycopg.rows import dict_row

from ..utils.pagination import pagination_meta


class MerchantDashboardError(Exception):
    def __init__(self, message, code="merchant_dashboard_error", status_code=400, data=None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.data = data or {}


def _connect():
    database_url = current_app.config.get("DATABASE_URL")
    if not database_url:
        raise MerchantDashboardError(
            "Merchant dashboard is not available right now. Please try again later.",
            code="database_not_configured",
            status_code=503,
        )
    return psycopg.connect(database_url, row_factory=dict_row)


def _amount(value):
    if value is None:
        value = Decimal("0.00")
    if isinstance(value, Decimal):
        return str(value.quantize(Decimal("0.01")))
    return value


def _iso(value):
    return value.isoformat() if value else None


def _date_filters(args, column="o.created_at"):
    filters = []
    values = []
    if args.get("date_from"):
        filters.append(f"{column} >= %s")
        values.append(args.get("date_from"))
    if args.get("date_to"):
        filters.append(f"{column} <= %s")
        values.append(args.get("date_to"))
    return filters, values


def get_merchant_analytics(merchant_id, args):
    order_filters, order_values = _date_filters(args)
    order_where = " AND " + " AND ".join(order_filters) if order_filters else ""

    try:
        with _connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT
                        COUNT(*) AS total_products,
                        COUNT(*) FILTER (WHERE status = 'active') AS active_products,
                        COUNT(*) FILTER (WHERE status = 'draft') AS draft_products,
                        COUNT(*) FILTER (WHERE status = 'archived') AS archived_products
                    FROM products
                    WHERE merchant_id = %s
                    """,
                    (merchant_id,),
                )
                product_counts = cursor.fetchone()

                cursor.execute(
                    f"""
                    SELECT COUNT(DISTINCT o.id) AS total_orders,
                           COALESCE(SUM(oi.quantity), 0) AS total_units_sold,
                           COALESCE(SUM(oi.total_price), 0) AS gross_sales
                    FROM order_items oi
                    JOIN orders o ON o.id = oi.order_id
                    WHERE oi.merchant_id = %s{order_where}
                    """,
                    [merchant_id, *order_values],
                )
                sales = cursor.fetchone()

                cursor.execute(
                    f"""
                    SELECT o.status, COUNT(DISTINCT o.id) AS count
                    FROM order_items oi
                    JOIN orders o ON o.id = oi.order_id
                    WHERE oi.merchant_id = %s{order_where}
                    GROUP BY o.status
                    ORDER BY o.status ASC
                    """,
                    [merchant_id, *order_values],
                )
                order_status_counts = [
                    {"status": row["status"], "count": row["count"]} for row in cursor.fetchall()
                ]

                cursor.execute(
                    f"""
                    SELECT oi.product_id, oi.product_name,
                           COALESCE(SUM(oi.quantity), 0) AS units_sold,
                           COALESCE(SUM(oi.total_price), 0) AS gross_sales
                    FROM order_items oi
                    JOIN orders o ON o.id = oi.order_id
                    WHERE oi.merchant_id = %s{order_where}
                    GROUP BY oi.product_id, oi.product_name
                    ORDER BY units_sold DESC, gross_sales DESC
                    LIMIT 5
                    """,
                    [merchant_id, *order_values],
                )
                top_products = [
                    {
                        "product_id": str(row["product_id"]),
                        "product_name": row["product_name"],
                        "units_sold": row["units_sold"],
                        "gross_sales": _amount(row["gross_sales"]),
                    }
                    for row in cursor.fetchall()
                ]
    except psycopg.errors.UndefinedTable as exc:
        raise MerchantDashboardError(
            "Merchant dashboard setup is incomplete. Import backend/schema.sql into PostgreSQL.",
            code="database_schema_missing",
            status_code=503,
        ) from exc
    except psycopg.Error as exc:
        current_app.logger.exception("Merchant analytics failed: %s", exc)
        raise MerchantDashboardError(
            "We could not load merchant analytics right now. Please try again later.",
            code="merchant_analytics_failed",
            status_code=503,
        ) from exc

    return {
        "summary": {
            "total_products": product_counts["total_products"],
            "active_products": product_counts["active_products"],
            "draft_products": product_counts["draft_products"],
            "archived_products": product_counts["archived_products"],
            "total_orders": sales["total_orders"],
            "total_units_sold": sales["total_units_sold"],
            "gross_sales": _amount(sales["gross_sales"]),
        },
        "order_status_counts": order_status_counts,
        "top_products": top_products,
    }


def get_merchant_orders(merchant_id, page, page_size, offset):
    try:
        with _connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT COUNT(*) AS total
                    FROM (
                        SELECT DISTINCT o.id
                        FROM orders o
                        JOIN order_items oi ON oi.order_id = o.id
                        WHERE oi.merchant_id = %s
                    ) merchant_orders
                    """,
                    (merchant_id,),
                )
                total = cursor.fetchone()["total"]

                cursor.execute(
                    """
                    SELECT DISTINCT o.id, o.order_number, o.status, o.created_at,
                           u.id AS customer_id, u.full_name, u.email
                    FROM orders o
                    JOIN order_items oi ON oi.order_id = o.id
                    JOIN users u ON u.id = o.user_id
                    WHERE oi.merchant_id = %s
                    ORDER BY o.created_at DESC
                    LIMIT %s OFFSET %s
                    """,
                    (merchant_id, page_size, offset),
                )
                orders = cursor.fetchall()

                order_ids = [str(row["id"]) for row in orders]
                items_by_order = {}
                if order_ids:
                    cursor.execute(
                        """
                        SELECT id, order_id, product_id, product_name,
                               unit_price, quantity, total_price
                        FROM order_items
                        WHERE merchant_id = %s
                          AND order_id = ANY(%s::uuid[])
                        ORDER BY created_at ASC
                        """,
                        (merchant_id, order_ids),
                    )
                    for row in cursor.fetchall():
                        items_by_order.setdefault(str(row["order_id"]), []).append(
                            {
                                "order_item_id": str(row["id"]),
                                "product_id": str(row["product_id"]),
                                "product_name": row["product_name"],
                                "unit_price": _amount(row["unit_price"]),
                                "quantity": row["quantity"],
                                "total_price": _amount(row["total_price"]),
                            }
                        )
    except psycopg.errors.UndefinedTable as exc:
        raise MerchantDashboardError(
            "Merchant orders setup is incomplete. Import backend/schema.sql into PostgreSQL.",
            code="database_schema_missing",
            status_code=503,
        ) from exc
    except psycopg.Error as exc:
        current_app.logger.exception("Merchant orders failed: %s", exc)
        raise MerchantDashboardError(
            "We could not load merchant orders right now. Please try again later.",
            code="merchant_orders_failed",
            status_code=503,
        ) from exc

    items = []
    for order in orders:
        order_items = items_by_order.get(str(order["id"]), [])
        merchant_total = sum(Decimal(item["total_price"]) for item in order_items)
        items.append(
            {
                "order_id": str(order["id"]),
                "order_number": order["order_number"],
                "order_status": order["status"],
                "customer": {
                    "id": str(order["customer_id"]),
                    "full_name": order.get("full_name"),
                    "email": order["email"],
                },
                "items": order_items,
                "merchant_total": _amount(merchant_total),
                "created_at": _iso(order.get("created_at")),
            }
        )

    return {
        "items": items,
        "pagination": pagination_meta(page, page_size, total),
    }
