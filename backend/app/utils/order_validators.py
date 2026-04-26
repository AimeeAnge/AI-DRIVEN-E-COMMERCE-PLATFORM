import re


ORDER_STATUSES = {"pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"}
COUNTRY_PATTERN = re.compile(r"^[A-Z]{2}$")


class ValidationError(Exception):
    def __init__(self, message, code="validation_error", data=None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.data = data or {}


def _optional_text(value, max_length=None):
    if value is None:
        return None
    value = str(value).strip()
    if not value:
        return None
    if max_length and len(value) > max_length:
        raise ValidationError("Shipping field is too long.", code="invalid_shipping_field")
    return value


def _country_code(value):
    value = _optional_text(value)
    if value is None:
        return None
    value = value.upper()
    if not COUNTRY_PATTERN.match(value):
        raise ValidationError("shipping_country_code must be a two-letter country code.", code="invalid_shipping_country_code")
    return value


def validate_order_payload(payload):
    return {
        "shipping_country_code": _country_code(payload.get("shipping_country_code")),
        "shipping_region": _optional_text(payload.get("shipping_region"), max_length=120),
        "shipping_city": _optional_text(payload.get("shipping_city"), max_length=120),
        "shipping_address_line1": _optional_text(payload.get("shipping_address_line1")),
        "shipping_address_line2": _optional_text(payload.get("shipping_address_line2")),
    }
