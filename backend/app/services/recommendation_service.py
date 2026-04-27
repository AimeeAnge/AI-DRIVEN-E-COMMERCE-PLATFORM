from decimal import Decimal

import psycopg
from flask import current_app
from psycopg.rows import dict_row

from ..utils.cart_validators import ValidationError
from ..utils.recommendation_validators import validate_limit, validate_product_id


class RecommendationError(Exception):
    def __init__(self, message, code="recommendation_error", status_code=400, data=None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.data = data or {}


def _connect():
    database_url = current_app.config.get("DATABASE_URL")
    if not database_url:
        raise RecommendationError(
            "Recommendations are not available right now.",
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


def _product_dict(row):
    image_endpoint = f"/api/v1/products/images/{row['image_id']}" if row.get("has_image_data") and row.get("image_id") else None
    image_url = image_endpoint or row.get("image_url")
    return {
        "id": str(row["id"]),
        "name": row["name"],
        "slug": row["slug"],
        "description": row.get("description"),
        "price": _amount(row["price"]),
        "currency_code": row["currency_code"],
        "stock_quantity": row["stock_quantity"],
        "status": row["status"],
        "category": {
            "id": str(row["category_id"]),
            "name": row["category_name"],
            "slug": row["category_slug"],
        }
        if row.get("category_id")
        else None,
        "images": [
            {
                "id": str(row["image_id"]) if row.get("image_id") else None,
                "image_url": image_url,
                "url": image_url,
                "image_endpoint": image_endpoint,
                "has_binary": bool(row.get("has_image_data")),
                "alt_text": row.get("alt_text"),
                "is_primary": True,
            }
        ]
        if image_url
        else [],
        "created_at": _iso(row.get("created_at")),
        "updated_at": _iso(row.get("updated_at")),
    }


def _product_query(where_sql="", order_sql="p.created_at DESC", limit=8, values=None):
    return (
        f"""
        SELECT p.id, p.category_id, p.name, p.slug, p.description, p.price,
               p.currency_code, p.stock_quantity, p.status, p.created_at, p.updated_at,
               c.name AS category_name, c.slug AS category_slug,
               pi.id AS image_id, pi.image_url, pi.has_image_data, pi.alt_text
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        LEFT JOIN LATERAL (
            SELECT id, image_url, image_data IS NOT NULL AS has_image_data, alt_text
            FROM product_images
            WHERE product_id = p.id
            ORDER BY is_primary DESC, sort_order ASC, created_at ASC
            LIMIT 1
        ) pi ON TRUE
        WHERE p.status = 'active'
        {where_sql}
        ORDER BY {order_sql}
        LIMIT %s
        """,
        [*(values or []), limit],
    )


def _fetch_products(cursor, where_sql="", order_sql="p.created_at DESC", limit=8, values=None):
    query, params = _product_query(where_sql=where_sql, order_sql=order_sql, limit=limit, values=values)
    cursor.execute(query, params)
    return [_product_dict(row) for row in cursor.fetchall()]


def _recent_user_category_ids(cursor, user_id, limit=5):
    if not user_id:
        return []
    cursor.execute(
        """
        SELECT DISTINCT p.category_id
        FROM recommendation_events re
        JOIN products p ON p.id = re.product_id
        WHERE re.user_id = %s
          AND p.category_id IS NOT NULL
        ORDER BY p.category_id
        LIMIT %s
        """,
        (user_id, limit),
    )
    return [row["category_id"] for row in cursor.fetchall()]


def generic_recommendations(limit=8):
    try:
        limit = validate_limit(limit)
    except ValidationError as exc:
        raise RecommendationError(exc.message, code=exc.code, data=exc.data) from exc

    try:
        with _connect() as connection:
            with connection.cursor() as cursor:
                items = _fetch_products(cursor, limit=limit)
    except psycopg.errors.UndefinedTable as exc:
        raise RecommendationError(
            "Recommendation setup is incomplete. Import backend/schema.sql into PostgreSQL.",
            code="database_schema_missing",
            status_code=503,
        ) from exc
    except psycopg.Error as exc:
        current_app.logger.exception("Generic recommendations failed: %s", exc)
        raise RecommendationError(
            "We could not load recommendations right now. Please try again later.",
            code="recommendations_load_failed",
            status_code=503,
        ) from exc

    return {"items": items, "context": "generic", "strategy": "rule_based_v1"}


def home_recommendations(user_id=None, limit=8):
    try:
        limit = validate_limit(limit)
    except ValidationError as exc:
        raise RecommendationError(exc.message, code=exc.code, data=exc.data) from exc

    try:
        with _connect() as connection:
            with connection.cursor() as cursor:
                category_ids = _recent_user_category_ids(cursor, user_id, limit=5)
                if category_ids:
                    items = _fetch_products(
                        cursor,
                        where_sql="AND p.category_id = ANY(%s::uuid[])",
                        order_sql="p.created_at DESC",
                        values=([str(category_id) for category_id in category_ids],),
                        limit=limit,
                    )
                else:
                    items = _fetch_products(cursor, limit=limit)
    except psycopg.errors.UndefinedTable as exc:
        raise RecommendationError(
            "Recommendation setup is incomplete. Import backend/schema.sql into PostgreSQL.",
            code="database_schema_missing",
            status_code=503,
        ) from exc
    except psycopg.Error as exc:
        current_app.logger.exception("Home recommendations failed: %s", exc)
        raise RecommendationError(
            "We could not load recommendations right now. Please try again later.",
            code="recommendations_load_failed",
            status_code=503,
        ) from exc

    return {
        "items": items,
        "context": "home",
        "strategy": "rule_based_v1",
        "personalized": bool(user_id),
    }


def product_recommendations(product_id, user_id=None, limit=8):
    try:
        product_id = validate_product_id(product_id)
        limit = validate_limit(limit)
    except ValidationError as exc:
        raise RecommendationError(exc.message, code=exc.code, data=exc.data) from exc

    try:
        with _connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT category_id
                    FROM products
                    WHERE id = %s AND status = 'active'
                    LIMIT 1
                    """,
                    (product_id,),
                )
                product = cursor.fetchone()
                if not product:
                    raise RecommendationError("Product was not found.", code="product_not_found", status_code=404)
                if product.get("category_id"):
                    items = _fetch_products(
                        cursor,
                        where_sql="AND p.category_id = %s AND p.id <> %s",
                        values=(product["category_id"], product_id),
                        limit=limit,
                    )
                else:
                    items = _fetch_products(cursor, where_sql="AND p.id <> %s", values=(product_id,), limit=limit)
    except RecommendationError:
        raise
    except psycopg.errors.UndefinedTable as exc:
        raise RecommendationError(
            "Recommendation setup is incomplete. Import backend/schema.sql into PostgreSQL.",
            code="database_schema_missing",
            status_code=503,
        ) from exc
    except psycopg.Error as exc:
        current_app.logger.exception("Product recommendations failed: %s", exc)
        raise RecommendationError(
            "We could not load recommendations right now. Please try again later.",
            code="recommendations_load_failed",
            status_code=503,
        ) from exc

    return {
        "items": items,
        "context": "product",
        "strategy": "rule_based_v1",
        "personalized": bool(user_id),
    }


def cart_recommendations(user_id=None, limit=8):
    try:
        limit = validate_limit(limit)
    except ValidationError as exc:
        raise RecommendationError(exc.message, code=exc.code, data=exc.data) from exc

    if not user_id:
        return generic_recommendations(limit)

    try:
        with _connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT DISTINCT p.category_id
                    FROM carts c
                    JOIN cart_items ci ON ci.cart_id = c.id
                    JOIN products p ON p.id = ci.product_id
                    WHERE c.user_id = %s AND p.category_id IS NOT NULL
                    LIMIT 5
                    """,
                    (user_id,),
                )
                category_ids = [row["category_id"] for row in cursor.fetchall()]
                cursor.execute(
                    """
                    SELECT ci.product_id
                    FROM carts c
                    JOIN cart_items ci ON ci.cart_id = c.id
                    WHERE c.user_id = %s
                    LIMIT 50
                    """,
                    (user_id,),
                )
                cart_product_ids = [str(row["product_id"]) for row in cursor.fetchall()]
                if category_ids:
                    items = _fetch_products(
                        cursor,
                        where_sql="AND p.category_id = ANY(%s::uuid[]) AND NOT (p.id = ANY(%s::uuid[]))",
                        values=([str(category_id) for category_id in category_ids], cart_product_ids),
                        limit=limit,
                    )
                else:
                    items = _fetch_products(cursor, limit=limit)
    except psycopg.errors.UndefinedTable as exc:
        raise RecommendationError(
            "Recommendation setup is incomplete. Import backend/schema.sql into PostgreSQL.",
            code="database_schema_missing",
            status_code=503,
        ) from exc
    except psycopg.Error as exc:
        current_app.logger.exception("Cart recommendations failed: %s", exc)
        raise RecommendationError(
            "We could not load recommendations right now. Please try again later.",
            code="recommendations_load_failed",
            status_code=503,
        ) from exc

    return {"items": items, "context": "cart", "strategy": "rule_based_v1", "personalized": True}


def user_recommendations(user_id=None, limit=8):
    if not user_id:
        return generic_recommendations(limit)
    result = home_recommendations(user_id=user_id, limit=limit)
    result["context"] = "user"
    result["personalized"] = True
    return result
