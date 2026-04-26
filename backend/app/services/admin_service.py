import psycopg
from flask import current_app
from psycopg.rows import dict_row

from ..utils.admin_validators import (
    SELF_BLOCKED_STATUSES,
    ValidationError,
    validate_role_filter,
    validate_status_filter,
    validate_user_id,
    validate_user_status,
)
from ..utils.pagination import pagination_meta


class AdminError(Exception):
    def __init__(self, message, code="admin_error", status_code=400, data=None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.data = data or {}


def _connect():
    database_url = current_app.config.get("DATABASE_URL")
    if not database_url:
        raise AdminError(
            "Admin tools are not available right now. Please try again later.",
            code="database_not_configured",
            status_code=503,
        )
    return psycopg.connect(database_url, row_factory=dict_row)


def _iso(value):
    return value.isoformat() if value else None


def _safe_user(row):
    return {
        "id": str(row["id"]),
        "email": row["email"],
        "full_name": row.get("full_name"),
        "phone_number": row.get("phone_number"),
        "phone_country_code": row.get("phone_country_code"),
        "role": row["role"],
        "status": row["status"],
        "country_code": row.get("country_code"),
        "region": row.get("region"),
        "city": row.get("city"),
        "created_at": _iso(row.get("created_at")),
        "updated_at": _iso(row.get("updated_at")),
    }


def list_users(args, page, page_size, offset):
    try:
        role = validate_role_filter(args.get("role"))
        status = validate_status_filter(args.get("status"))
    except ValidationError as exc:
        raise AdminError(exc.message, code=exc.code, data=exc.data) from exc

    filters = []
    values = []
    if role:
        filters.append("role = %s")
        values.append(role)
    if status:
        filters.append("status = %s")
        values.append(status)

    q = (args.get("q") or "").strip()
    if q:
        filters.append("(email ILIKE %s OR full_name ILIKE %s)")
        pattern = f"%{q}%"
        values.extend([pattern, pattern])

    where_sql = " WHERE " + " AND ".join(filters) if filters else ""

    try:
        with _connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(f"SELECT COUNT(*) AS total FROM users{where_sql}", values)
                total = cursor.fetchone()["total"]
                cursor.execute(
                    f"""
                    SELECT id, email, full_name, phone_number, phone_country_code,
                           role, status, country_code, region, city,
                           created_at, updated_at
                    FROM users
                    {where_sql}
                    ORDER BY created_at DESC
                    LIMIT %s OFFSET %s
                    """,
                    [*values, page_size, offset],
                )
                rows = cursor.fetchall()
    except psycopg.errors.UndefinedTable as exc:
        raise AdminError(
            "Admin setup is incomplete. Import backend/schema.sql into PostgreSQL.",
            code="database_schema_missing",
            status_code=503,
        ) from exc
    except psycopg.Error as exc:
        current_app.logger.exception("Admin user list failed: %s", exc)
        raise AdminError(
            "We could not load users right now. Please try again later.",
            code="users_load_failed",
            status_code=503,
        ) from exc

    return {
        "items": [_safe_user(row) for row in rows],
        "pagination": pagination_meta(page, page_size, total),
    }


def update_user_status(current_admin_id, user_id, payload):
    try:
        user_id = validate_user_id(user_id)
        status = validate_user_status(payload.get("status"))
    except ValidationError as exc:
        raise AdminError(exc.message, code=exc.code, data=exc.data) from exc

    if str(current_admin_id) == str(user_id) and status in SELF_BLOCKED_STATUSES:
        raise AdminError(
            "You cannot suspend or disable your own admin account.",
            code="self_status_change_blocked",
            status_code=403,
        )

    try:
        with _connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    UPDATE users
                    SET status = %s
                    WHERE id = %s
                    RETURNING id, email, full_name, phone_number, phone_country_code,
                              role, status, country_code, region, city,
                              created_at, updated_at
                    """,
                    (status, user_id),
                )
                row = cursor.fetchone()
                if not row:
                    raise AdminError("User was not found.", code="user_not_found", status_code=404)
    except AdminError:
        raise
    except psycopg.errors.UndefinedTable as exc:
        raise AdminError(
            "Admin setup is incomplete. Import backend/schema.sql into PostgreSQL.",
            code="database_schema_missing",
            status_code=503,
        ) from exc
    except psycopg.Error as exc:
        current_app.logger.exception("Admin status update failed: %s", exc)
        raise AdminError(
            "We could not update this user right now. Please try again later.",
            code="user_status_update_failed",
            status_code=503,
        ) from exc

    return {"user": _safe_user(row)}
