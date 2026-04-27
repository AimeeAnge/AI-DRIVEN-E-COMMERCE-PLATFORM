import psycopg
from flask import current_app
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

from ..utils.cart_validators import ValidationError
from ..utils.event_validators import validate_event_payload


class EventError(Exception):
    def __init__(self, message, code="event_error", status_code=400, data=None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.data = data or {}


def _connect():
    database_url = current_app.config.get("DATABASE_URL")
    if not database_url:
        raise EventError(
            "Event tracking is not available right now.",
            code="database_not_configured",
            status_code=503,
        )
    return psycopg.connect(database_url, row_factory=dict_row)


def record_event(user_id, payload):
    try:
        cleaned = validate_event_payload(payload)
    except ValidationError as exc:
        raise EventError(exc.message, code=exc.code, data=exc.data) from exc

    try:
        with _connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO recommendation_events (
                        user_id, product_id, source_context, event_type, model_version, metadata
                    )
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id, created_at
                    """,
                    (
                        user_id,
                        cleaned["product_id"],
                        cleaned["source_context"],
                        cleaned["event_type"],
                        "rule_based_v1",
                        Jsonb(cleaned["metadata"]),
                    ),
                )
                row = cursor.fetchone()
    except psycopg.errors.ForeignKeyViolation as exc:
        raise EventError("Referenced product was not found.", code="product_not_found", status_code=404) from exc
    except psycopg.errors.UndefinedTable as exc:
        raise EventError(
            "Event tracking setup is incomplete. Import backend/schema.sql into PostgreSQL.",
            code="database_schema_missing",
            status_code=503,
        ) from exc
    except psycopg.Error as exc:
        current_app.logger.exception("Event tracking failed: %s", exc)
        raise EventError(
            "We could not record this event right now.",
            code="event_record_failed",
            status_code=503,
        ) from exc

    return {"event_id": str(row["id"]), "created_at": row["created_at"].isoformat()}
