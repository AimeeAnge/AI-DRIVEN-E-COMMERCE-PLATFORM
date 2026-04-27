from .cart_validators import ValidationError, validate_uuid


EVENT_TYPES = {"impression", "click", "add_to_cart", "purchase", "dismiss"}
SOURCE_CONTEXTS = {"home", "product", "cart", "dashboard", "recommendation", "checkout", "search"}


def _optional_text(value, max_length=255):
    if value is None:
        return None
    value = str(value).strip()
    if not value:
        return None
    if len(value) > max_length:
        raise ValidationError("Event field is too long.", code="invalid_event_field")
    return value


def validate_event_payload(payload):
    event_type = _optional_text(payload.get("event_type"), max_length=40)
    if event_type not in EVENT_TYPES:
        raise ValidationError("Event type is not supported.", code="invalid_event_type")

    source_context = _optional_text(payload.get("source_context"), max_length=80)
    if not source_context:
        raise ValidationError("source_context is required.", code="source_context_required")

    product_id = payload.get("product_id")
    if product_id:
        product_id = validate_uuid(product_id, "product_id")
    else:
        product_id = None

    metadata = payload.get("metadata") or {}
    if not isinstance(metadata, dict):
        raise ValidationError("metadata must be an object.", code="invalid_metadata")

    return {
        "product_id": product_id,
        "source_context": source_context,
        "event_type": event_type,
        "metadata": metadata,
    }
