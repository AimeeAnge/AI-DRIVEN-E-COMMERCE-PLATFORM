from flask import Blueprint, g, request

from ..services.merchant_dashboard_service import (
    MerchantDashboardError,
    get_merchant_analytics,
    get_merchant_orders,
)
from ..utils.auth import roles_required
from ..utils.pagination import pagination_params
from ..utils.responses import error_response, success_response


merchant_dashboard_bp = Blueprint("merchant_dashboard", __name__)


def _merchant_error(exc):
    return error_response(exc.message, status_code=exc.status_code, code=exc.code, data=exc.data)


@merchant_dashboard_bp.get("/analytics")
@roles_required("merchant")
def analytics():
    try:
        result = get_merchant_analytics(g.current_user["id"], request.args)
    except MerchantDashboardError as exc:
        return _merchant_error(exc)
    return success_response(message="Merchant analytics loaded.", data=result)


@merchant_dashboard_bp.get("/orders")
@roles_required("merchant")
def orders():
    page, page_size, offset = pagination_params(request.args)
    try:
        result = get_merchant_orders(g.current_user["id"], page, page_size, offset)
    except MerchantDashboardError as exc:
        return _merchant_error(exc)
    return success_response(message="Merchant orders loaded.", data=result)
