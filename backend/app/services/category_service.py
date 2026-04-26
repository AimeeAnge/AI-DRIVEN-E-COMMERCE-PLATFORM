import psycopg
from flask import current_app
from psycopg.rows import dict_row

from .product_service import CatalogError


def _connect():
    database_url = current_app.config.get("DATABASE_URL")
    if not database_url:
        raise CatalogError(
            "Categories are not available right now. Please try again later.",
            code="database_not_configured",
            status_code=503,
        )
    return psycopg.connect(database_url, row_factory=dict_row)


def _category_dict(row):
    return {
        "id": str(row["id"]),
        "parent_id": str(row["parent_id"]) if row.get("parent_id") else None,
        "name": row["name"],
        "slug": row["slug"],
        "description": row.get("description"),
        "is_active": row["is_active"],
        "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
        "updated_at": row["updated_at"].isoformat() if row.get("updated_at") else None,
    }


def list_public_categories():
    try:
        with _connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT id, parent_id, name, slug, description, is_active,
                           created_at, updated_at
                    FROM categories
                    WHERE is_active = TRUE
                    ORDER BY name ASC
                    """
                )
                rows = cursor.fetchall()
    except psycopg.errors.UndefinedTable as exc:
        raise CatalogError(
            "Category setup is incomplete. Import backend/schema.sql into PostgreSQL.",
            code="database_schema_missing",
            status_code=503,
        ) from exc
    except psycopg.Error as exc:
        current_app.logger.exception("Category list failed: %s", exc)
        raise CatalogError(
            "We could not load categories right now. Please try again later.",
            code="categories_load_failed",
            status_code=503,
        ) from exc

    return {"items": [_category_dict(row) for row in rows]}
