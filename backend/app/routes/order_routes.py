from flask import Blueprint, g, request

from ..services.order_service import OrderError, create_order, get_order, list_orders
from ..utils.auth import roles_required
from ..utils.pagination import pagination_params
from ..utils.responses import error_response, success_response


order_bp = Blueprint("orders", __name__)


def _order_error(exc):
    return error_response(exc.message, status_code=exc.status_code, code=exc.code, data=exc.data)


@order_bp.post("")
@roles_required("customer")
def checkout():
    try:
        result = create_order(g.current_user["id"], request.get_json(silent=True) or {})
    except OrderError as exc:
        return _order_error(exc)
    return success_response(message="Order created.", data=result, status_code=201)


@order_bp.get("")
@roles_required("customer")
def orders():
    page, page_size, offset = pagination_params(request.args)
    try:
        result = list_orders(g.current_user["id"], page, page_size, offset)
    except OrderError as exc:
        return _order_error(exc)
    return success_response(message="Orders loaded.", data=result)


@order_bp.get("/<order_id>")
@roles_required("customer")
def order_detail(order_id):
    try:
        result = get_order(g.current_user["id"], order_id)
    except OrderError as exc:
        return _order_error(exc)
    return success_response(message="Order loaded.", data=result)
