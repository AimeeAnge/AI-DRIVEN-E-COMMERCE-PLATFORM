from .cart_validators import ValidationError, validate_uuid


def validate_wishlist_payload(payload):
    return {"product_id": validate_uuid(payload.get("product_id"), "product_id")}


def validate_wishlist_item_id(item_id):
    return validate_uuid(item_id, "item_id")
