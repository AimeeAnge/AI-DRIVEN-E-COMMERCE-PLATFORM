from decimal import Decimal

import psycopg
from flask import current_app
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

from ..utils.cart_validators import ValidationError
from ..utils.chatbot_validators import validate_chat_message_payload


PRODUCT_LIMIT = 5
CHAT_STOPWORDS = {
    "can",
    "you",
    "help",
    "with",
    "find",
    "show",
    "product",
    "products",
    "recommend",
    "looking",
    "search",
    "please",
    "what",
    "that",
    "this",
    "the",
    "and",
    "for",
    "are",
    "how",
    "order",
}


class ChatbotError(Exception):
    def __init__(self, message, code="chatbot_error", status_code=400, data=None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.data = data or {}


def _connect():
    database_url = current_app.config.get("DATABASE_URL")
    if not database_url:
        raise ChatbotError(
            "Chat support is not available right now.",
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


def _message_dict(row):
    return {
        "id": str(row["id"]),
        "conversation_id": str(row["conversation_id"]),
        "sender_role": row["sender_role"],
        "message_text": row["message_text"],
        "metadata": row.get("metadata") or {},
        "created_at": _iso(row.get("created_at")),
    }


def _conversation_dict(row, messages=None):
    data = {
        "id": str(row["id"]),
        "user_id": str(row["user_id"]) if row.get("user_id") else None,
        "status": row["status"],
        "channel": row["channel"],
        "created_at": _iso(row.get("created_at")),
        "updated_at": _iso(row.get("updated_at")),
    }
    if messages is not None:
        data["messages"] = messages
    if row.get("last_message"):
        data["last_message"] = row["last_message"]
    return data


def _get_or_create_conversation(cursor, user_id, conversation_id):
    if conversation_id:
        cursor.execute(
            """
            SELECT id, user_id, status, channel, created_at, updated_at
            FROM chatbot_conversations
            WHERE id = %s AND user_id = %s
            """,
            (conversation_id, user_id),
        )
        conversation = cursor.fetchone()
        if not conversation:
            raise ChatbotError("Conversation was not found.", code="conversation_not_found", status_code=404)
        return conversation

    cursor.execute(
        """
        INSERT INTO chatbot_conversations (user_id, channel)
        VALUES (%s, %s)
        RETURNING id, user_id, status, channel, created_at, updated_at
        """,
        (user_id, "web"),
    )
    return cursor.fetchone()


def _insert_message(cursor, conversation_id, sender_role, message_text, metadata=None):
    cursor.execute(
        """
        INSERT INTO chatbot_messages (conversation_id, sender_role, message_text, metadata)
        VALUES (%s, %s, %s, %s)
        RETURNING id, conversation_id, sender_role, message_text, metadata, created_at
        """,
        (conversation_id, sender_role, message_text, Jsonb(metadata or {})),
    )
    return cursor.fetchone()


def _search_products(cursor, message_text):
    words = [word.strip(".,?!:;()[]{}").lower() for word in message_text.split()]
    keywords = [word for word in words if len(word) >= 3 and word not in CHAT_STOPWORDS]
    pattern = f"%{' '.join(keywords[:4]) or message_text[:80]}%"

    cursor.execute(
        """
        SELECT p.id, p.name, p.slug, p.description, p.price, p.currency_code,
               c.name AS category_name
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.status = 'active'
          AND (
              p.name ILIKE %s
              OR p.description ILIKE %s
              OR c.name ILIKE %s
          )
        ORDER BY p.created_at DESC
        LIMIT %s
        """,
        (pattern, pattern, pattern, PRODUCT_LIMIT),
    )
    return [
        {
            "id": str(row["id"]),
            "name": row["name"],
            "slug": row["slug"],
            "description": row.get("description"),
            "price": _amount(row["price"]),
            "currency_code": row["currency_code"],
            "category_name": row.get("category_name"),
        }
        for row in cursor.fetchall()
    ]


def _assistant_response(cursor, message_text, user_role):
    lowered = message_text.lower()

    if any(term in lowered for term in ["track", "order", "delivery", "shipping"]):
        return (
            "You can check your order status in your order history. I can also help you find products while you shop.",
            {"response_type": "order_help", "transparent_mode": "rule_based"},
        )

    if any(term in lowered for term in ["find", "search", "recommend", "product", "products", "buy", "shop"]):
        products = _search_products(cursor, message_text)
        if products:
            return (
                f"I can help with that. I found {len(products)} product(s) that may match what you are looking for.",
                {
                    "response_type": "product_search",
                    "transparent_mode": "rule_based",
                    "products": products,
                },
            )
        return (
            "I couldn't find matching products right now. Try another product name or category.",
            {"response_type": "product_search", "transparent_mode": "rule_based", "products": []},
        )

    return (
        "I can help you find products or show you where to check your orders. What would you like to do?",
        {"response_type": "general_help", "transparent_mode": "rule_based", "user_role": user_role},
    )


def handle_message(user, payload):
    try:
        cleaned = validate_chat_message_payload(payload)
    except ValidationError as exc:
        raise ChatbotError(exc.message, code=exc.code, data=exc.data) from exc

    try:
        with _connect() as connection:
            with connection.cursor() as cursor:
                conversation = _get_or_create_conversation(cursor, user["id"], cleaned["conversation_id"])
                user_message = _insert_message(
                    cursor,
                    conversation["id"],
                    user["role"],
                    cleaned["message"],
                    {"source": "web"},
                )
                assistant_text, assistant_metadata = _assistant_response(cursor, cleaned["message"], user["role"])
                assistant_message = _insert_message(
                    cursor,
                    conversation["id"],
                    "assistant",
                    assistant_text,
                    assistant_metadata,
                )
                cursor.execute(
                    """
                    SELECT id, user_id, status, channel, created_at, updated_at
                    FROM chatbot_conversations
                    WHERE id = %s
                    """,
                    (conversation["id"],),
                )
                conversation = cursor.fetchone()
    except ChatbotError:
        raise
    except psycopg.errors.UndefinedTable as exc:
        raise ChatbotError(
            "Chat support setup is incomplete. Import backend/schema.sql into PostgreSQL.",
            code="database_schema_missing",
            status_code=503,
        ) from exc
    except psycopg.Error as exc:
        current_app.logger.exception("Chatbot message failed: %s", exc)
        raise ChatbotError(
            "We could not send this message right now. Please try again later.",
            code="chatbot_message_failed",
            status_code=503,
        ) from exc

    return {
        "conversation": _conversation_dict(conversation),
        "user_message": _message_dict(user_message),
        "assistant_message": _message_dict(assistant_message),
    }


def list_conversations(user_id, page, page_size, offset):
    try:
        with _connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT COUNT(*) AS total FROM chatbot_conversations WHERE user_id = %s", (user_id,))
                total = cursor.fetchone()["total"]
                cursor.execute(
                    """
                    SELECT cc.id, cc.user_id, cc.status, cc.channel, cc.created_at, cc.updated_at,
                           lm.message_text AS last_message
                    FROM chatbot_conversations cc
                    LEFT JOIN LATERAL (
                        SELECT message_text
                        FROM chatbot_messages
                        WHERE conversation_id = cc.id
                        ORDER BY created_at DESC
                        LIMIT 1
                    ) lm ON TRUE
                    WHERE cc.user_id = %s
                    ORDER BY cc.updated_at DESC
                    LIMIT %s OFFSET %s
                    """,
                    (user_id, page_size, offset),
                )
                rows = cursor.fetchall()
    except psycopg.errors.UndefinedTable as exc:
        raise ChatbotError(
            "Chat support setup is incomplete. Import backend/schema.sql into PostgreSQL.",
            code="database_schema_missing",
            status_code=503,
        ) from exc
    except psycopg.Error as exc:
        current_app.logger.exception("Chatbot conversations failed: %s", exc)
        raise ChatbotError(
            "We could not load conversations right now. Please try again later.",
            code="chatbot_conversations_failed",
            status_code=503,
        ) from exc

    return {
        "items": [_conversation_dict(row) for row in rows],
        "pagination": {"page": page, "page_size": page_size, "total": total},
    }


def get_conversation(user_id, conversation_id):
    try:
        with _connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT id, user_id, status, channel, created_at, updated_at
                    FROM chatbot_conversations
                    WHERE id = %s AND user_id = %s
                    """,
                    (conversation_id, user_id),
                )
                conversation = cursor.fetchone()
                if not conversation:
                    raise ChatbotError("Conversation was not found.", code="conversation_not_found", status_code=404)
                cursor.execute(
                    """
                    SELECT id, conversation_id, sender_role, message_text, metadata, created_at
                    FROM chatbot_messages
                    WHERE conversation_id = %s
                    ORDER BY created_at ASC
                    """,
                    (conversation_id,),
                )
                messages = [_message_dict(row) for row in cursor.fetchall()]
    except ChatbotError:
        raise
    except psycopg.errors.UndefinedTable as exc:
        raise ChatbotError(
            "Chat support setup is incomplete. Import backend/schema.sql into PostgreSQL.",
            code="database_schema_missing",
            status_code=503,
        ) from exc
    except psycopg.Error as exc:
        current_app.logger.exception("Chatbot conversation detail failed: %s", exc)
        raise ChatbotError(
            "We could not load this conversation right now. Please try again later.",
            code="chatbot_conversation_failed",
            status_code=503,
        ) from exc

    return {"conversation": _conversation_dict(conversation, messages)}
