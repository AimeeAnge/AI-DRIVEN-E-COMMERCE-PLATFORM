from flask import Blueprint, g, request

from ..services.cart_service import CartError, add_cart_item, get_cart, remove_cart_item, update_cart_item
from ..utils.auth import roles_required
from ..utils.responses import error_response, success_response


cart_bp = Blueprint("cart", __name__)


def _cart_error(exc):
    return error_response(exc.message, status_code=exc.status_code, code=exc.code, data=exc.data)


@cart_bp.get("")
@roles_required("customer")
def cart():
    try:
        result = get_cart(g.current_user["id"])
    except CartError as exc:
        return _cart_error(exc)
    return success_response(message="Cart loaded.", data=result)


@cart_bp.post("/items")
@roles_required("customer")
def add_item():
    try:
        result = add_cart_item(g.current_user["id"], request.get_json(silent=True) or {})
    except CartError as exc:
        return _cart_error(exc)
    return success_response(message="Cart item added.", data=result, status_code=201)


@cart_bp.put("/items/<item_id>")
@roles_required("customer")
def update_item(item_id):
    try:
        result = update_cart_item(g.current_user["id"], item_id, request.get_json(silent=True) or {})
    except CartError as exc:
        return _cart_error(exc)
    return success_response(message="Cart item updated.", data=result)


@cart_bp.delete("/items/<item_id>")
@roles_required("customer")
def remove_item(item_id):
    try:
        result = remove_cart_item(g.current_user["id"], item_id)
    except CartError as exc:
        return _cart_error(exc)
    return success_response(message="Cart item removed.", data=result)
