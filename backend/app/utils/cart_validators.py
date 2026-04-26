from uuid import UUID


class ValidationError(Exception):
    def __init__(self, message, code="validation_error", data=None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.data = data or {}


def validate_uuid(value, field):
    try:
        return str(UUID(str(value)))
    except (TypeError, ValueError) as exc:
        raise ValidationError(f"{field} must be a valid UUID.", code=f"invalid_{field}") from exc


def validate_quantity(value):
    try:
        quantity = int(value)
    except (TypeError, ValueError) as exc:
        raise ValidationError("Quantity must be a valid integer.", code="invalid_quantity") from exc
    if quantity <= 0:
        raise ValidationError("Quantity must be greater than zero.", code="invalid_quantity")
    return quantity


def validate_cart_item_payload(payload, require_product=True):
    cleaned = {"quantity": validate_quantity(payload.get("quantity", 1))}
    if require_product:
        cleaned["product_id"] = validate_uuid(payload.get("product_id"), "product_id")
    return cleaned
