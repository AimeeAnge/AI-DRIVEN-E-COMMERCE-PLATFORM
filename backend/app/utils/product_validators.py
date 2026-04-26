import re
from decimal import Decimal, InvalidOperation
from urllib.parse import urlparse


PRODUCT_STATUSES = {"draft", "active", "inactive", "archived"}
PUBLIC_PRODUCT_STATUS = "active"
SORT_OPTIONS = {"newest", "price_asc", "price_desc", "name_asc"}
SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
COUNTRY_PATTERN = re.compile(r"^[A-Z]{2}$")
CURRENCY_PATTERN = re.compile(r"^[A-Z]{3}$")
ALLOWED_IMAGE_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}


def slugify(value):
    value = str(value or "").strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


class ValidationError(Exception):
    def __init__(self, message, code="validation_error", data=None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.data = data or {}


def _text(value):
    if value is None:
        return None
    return str(value).strip()


def _optional_text(value):
    value = _text(value)
    return value or None


def _decimal(value, field):
    try:
        amount = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError) as exc:
        raise ValidationError(f"{field} must be a valid number.", code=f"invalid_{field}") from exc
    if amount < 0:
        raise ValidationError(f"{field} cannot be negative.", code=f"invalid_{field}")
    return amount


def _integer(value, field):
    try:
        number = int(value)
    except (TypeError, ValueError) as exc:
        raise ValidationError(f"{field} must be a valid integer.", code=f"invalid_{field}") from exc
    if number < 0:
        raise ValidationError(f"{field} cannot be negative.", code=f"invalid_{field}")
    return number


def _country_code(value, field):
    value = _optional_text(value)
    if value is None:
        return None
    value = value.upper()
    if not COUNTRY_PATTERN.match(value):
        raise ValidationError(f"{field} must be a two-letter country code.", code=f"invalid_{field}")
    return value


def _currency_code(value):
    value = (_text(value) or "USD").upper()
    if not CURRENCY_PATTERN.match(value):
        raise ValidationError("currency_code must be a three-letter currency code.", code="invalid_currency_code")
    return value


def _status(value, default="draft"):
    value = (_text(value) or default).lower()
    if value not in PRODUCT_STATUSES:
        raise ValidationError("Product status is not supported.", code="invalid_status")
    return value


def _validate_url(value):
    value = _text(value)
    if not value:
        raise ValidationError("Each image requires an image_url.", code="image_url_required")
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValidationError("Image URL must be a valid web URL.", code="invalid_image_url")
    return value


def validate_product_payload(payload, require_core_fields=True):
    cleaned = {}

    if require_core_fields or "name" in payload:
        name = _text(payload.get("name"))
        if not name or len(name) < 2 or len(name) > 255:
            raise ValidationError("Product name must be between 2 and 255 characters.", code="invalid_name")
        cleaned["name"] = name

    if require_core_fields or "slug" in payload:
        slug = _text(payload.get("slug")) or slugify(cleaned.get("name") or payload.get("name"))
        if not slug or not SLUG_PATTERN.match(slug):
            raise ValidationError("Product slug must use lowercase letters, numbers, and hyphens.", code="invalid_slug")
        cleaned["slug"] = slug

    if require_core_fields or "price" in payload:
        if payload.get("price") is None:
            raise ValidationError("Product price is required.", code="price_required")
        cleaned["price"] = _decimal(payload.get("price"), "price")

    if "description" in payload:
        cleaned["description"] = _optional_text(payload.get("description"))
    elif require_core_fields:
        cleaned["description"] = None

    if "category_id" in payload:
        cleaned["category_id"] = _optional_text(payload.get("category_id"))
    elif require_core_fields:
        cleaned["category_id"] = None

    if "currency_code" in payload or require_core_fields:
        cleaned["currency_code"] = _currency_code(payload.get("currency_code"))

    if "stock_quantity" in payload or require_core_fields:
        cleaned["stock_quantity"] = _integer(payload.get("stock_quantity", 0), "stock_quantity")

    if "status" in payload or require_core_fields:
        cleaned["status"] = _status(payload.get("status"))

    if "country_of_origin" in payload:
        cleaned["country_of_origin"] = _country_code(payload.get("country_of_origin"), "country_of_origin")
    elif require_core_fields:
        cleaned["country_of_origin"] = None

    if "available_country_codes" in payload:
        country_codes = payload.get("available_country_codes")
        if country_codes in (None, ""):
            cleaned["available_country_codes"] = None
        elif not isinstance(country_codes, list):
            raise ValidationError("available_country_codes must be a list.", code="invalid_available_country_codes")
        else:
            cleaned["available_country_codes"] = [
                _country_code(code, "available_country_codes") for code in country_codes
            ]
    elif require_core_fields:
        cleaned["available_country_codes"] = None

    if "images" in payload:
        cleaned["images"] = validate_images(payload.get("images"))

    return cleaned


def validate_images(images):
    if images in (None, ""):
        return []
    if not isinstance(images, list):
        raise ValidationError("images must be a list of image metadata.", code="invalid_images")

    cleaned = []
    primary_count = 0
    for index, image in enumerate(images):
        if not isinstance(image, dict):
            raise ValidationError("Each image must be an object.", code="invalid_image")

        is_primary = bool(image.get("is_primary", False))
        primary_count += 1 if is_primary else 0
        size_bytes = image.get("size_bytes")
        if size_bytes is not None:
            size_bytes = _integer(size_bytes, "size_bytes")

        cleaned.append(
            {
                "image_data": image.get("image_data"),
                "image_url": _validate_url(image.get("image_url")) if image.get("image_url") else None,
                "image_key": _optional_text(image.get("image_key")),
                "bucket_name": _optional_text(image.get("bucket_name")),
                "file_name": _optional_text(image.get("file_name")),
                "mime_type": _optional_text(image.get("mime_type")),
                "size_bytes": size_bytes,
                "alt_text": _optional_text(image.get("alt_text")),
                "sort_order": _integer(image.get("sort_order", index), "sort_order"),
                "is_primary": is_primary,
            }
        )

        if not cleaned[-1]["image_data"] and not cleaned[-1]["image_url"]:
            raise ValidationError("Each image requires image data or an image URL.", code="image_source_required")
        if cleaned[-1]["mime_type"] and cleaned[-1]["mime_type"] not in ALLOWED_IMAGE_MIME_TYPES:
            raise ValidationError("Image must be JPEG, PNG, or WebP.", code="invalid_image_type")

    if primary_count > 1:
        raise ValidationError("Only one image can be marked as primary.", code="multiple_primary_images")

    return cleaned


def validate_uploaded_image(file_storage, max_bytes):
    if not file_storage or not file_storage.filename:
        return None

    mime_type = (file_storage.mimetype or "").lower()
    if mime_type not in ALLOWED_IMAGE_MIME_TYPES:
        raise ValidationError("Image must be JPEG, PNG, or WebP.", code="invalid_image_type")

    image_data = file_storage.read()
    size_bytes = len(image_data)
    if size_bytes <= 0:
        raise ValidationError("Image file is empty.", code="empty_image")
    if size_bytes > max_bytes:
        raise ValidationError("Image file is too large.", code="image_too_large")

    return {
        "image_data": image_data,
        "image_url": None,
        "image_key": None,
        "bucket_name": None,
        "file_name": file_storage.filename,
        "mime_type": mime_type,
        "size_bytes": size_bytes,
        "alt_text": None,
        "sort_order": 0,
        "is_primary": True,
    }
