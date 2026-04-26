import psycopg
from flask import current_app


REQUIRED_TABLES = (
    "users",
    "products",
    "product_images",
    "carts",
    "cart_items",
    "orders",
    "order_items",
    "wishlist_items",
    "chatbot_conversations",
    "chatbot_messages",
    "recommendation_events",
)


def _missing_tables(connection):
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = ANY(%s)
            """,
            (list(REQUIRED_TABLES),),
        )
        existing = {row[0] for row in cursor.fetchall()}
    return [table for table in REQUIRED_TABLES if table not in existing]


def check_database_ready():
    database_url = current_app.config.get("DATABASE_URL")
    if not database_url:
        return (
            {
                "ok": False,
                "code": "database_url_missing",
                "message": "Database is not configured. Set DATABASE_URL in your environment.",
                "data": {},
            },
            503,
        )

    try:
        with psycopg.connect(database_url, connect_timeout=5) as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()

            missing = _missing_tables(connection)
            if missing:
                return (
                    {
                        "ok": False,
                        "code": "database_schema_missing",
                        "message": "Database connected, but setup is incomplete. Import backend/schema.sql into PostgreSQL.",
                        "data": {"missing_tables": missing},
                    },
                    503,
                )

        return (
            {
                "ok": True,
                "message": "Database connection is ready.",
                "data": {"required_tables": list(REQUIRED_TABLES)},
            },
            200,
        )
    except psycopg.Error as exc:
        current_app.logger.exception("Database connection check failed: %s", exc)
        return (
            {
                "ok": False,
                "code": "database_connection_failed",
                "message": "We could not connect to PostgreSQL. Check DATABASE_URL and make sure the database is running.",
                "data": {},
            },
            503,
        )
