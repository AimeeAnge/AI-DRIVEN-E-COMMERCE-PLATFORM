from .cart_validators import ValidationError, validate_uuid


def validate_product_id(product_id):
    return validate_uuid(product_id, "product_id")


def validate_limit(value, default=8, maximum=12):
    if value in (None, ""):
        return default
    try:
        limit = int(value)
    except (TypeError, ValueError) as exc:
        raise ValidationError("limit must be a valid integer.", code="invalid_limit") from exc
    if limit <= 0:
        raise ValidationError("limit must be greater than zero.", code="invalid_limit")
    return min(limit, maximum)
