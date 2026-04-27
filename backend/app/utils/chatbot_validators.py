from .cart_validators import ValidationError, validate_uuid


def _text(value, max_length=2000):
    value = str(value or "").strip()
    if not value:
        raise ValidationError("Message is required.", code="message_required")
    if len(value) > max_length:
        raise ValidationError("Message is too long.", code="message_too_long")
    return value


def validate_chat_message_payload(payload):
    conversation_id = payload.get("conversation_id")
    if conversation_id:
        conversation_id = validate_uuid(conversation_id, "conversation_id")

    return {
        "conversation_id": conversation_id,
        "message": _text(payload.get("message")),
    }
