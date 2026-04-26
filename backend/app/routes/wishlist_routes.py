from flask import Blueprint, g, request

from ..services.wishlist_service import WishlistError, add_wishlist_item, list_wishlist, remove_wishlist_item
from ..utils.auth import roles_required
from ..utils.responses import error_response, success_response


wishlist_bp = Blueprint("wishlist", __name__)


def _wishlist_error(exc):
    return error_response(exc.message, status_code=exc.status_code, code=exc.code, data=exc.data)


@wishlist_bp.get("")
@roles_required("customer")
def wishlist():
    try:
        result = list_wishlist(g.current_user["id"])
    except WishlistError as exc:
        return _wishlist_error(exc)
    return success_response(message="Wishlist loaded.", data=result)


@wishlist_bp.post("/items")
@roles_required("customer")
def add_item():
    try:
        result = add_wishlist_item(g.current_user["id"], request.get_json(silent=True) or {})
    except WishlistError as exc:
        return _wishlist_error(exc)
    return success_response(message="Product added to wishlist.", data=result, status_code=201)


@wishlist_bp.delete("/items/<item_id>")
@roles_required("customer")
def remove_item(item_id):
    try:
        result = remove_wishlist_item(g.current_user["id"], item_id)
    except WishlistError as exc:
        return _wishlist_error(exc)
    return success_response(message="Product removed from wishlist.", data=result)
