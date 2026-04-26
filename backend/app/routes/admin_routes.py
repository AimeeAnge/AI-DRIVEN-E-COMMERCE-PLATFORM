from flask import Blueprint, g, request

from ..services.admin_service import AdminError, list_users, update_user_status
from ..utils.auth import roles_required
from ..utils.pagination import pagination_params
from ..utils.responses import error_response, success_response


admin_bp = Blueprint("admin", __name__)


def _admin_error(exc):
    return error_response(exc.message, status_code=exc.status_code, code=exc.code, data=exc.data)


@admin_bp.get("/users")
@roles_required("admin")
def users():
    page, page_size, offset = pagination_params(request.args)
    try:
        result = list_users(request.args, page, page_size, offset)
    except AdminError as exc:
        return _admin_error(exc)
    return success_response(message="Users loaded.", data=result)


@admin_bp.patch("/users/<user_id>/status")
@roles_required("admin")
def user_status(user_id):
    try:
        result = update_user_status(g.current_user["id"], user_id, request.get_json(silent=True) or {})
    except AdminError as exc:
        return _admin_error(exc)
    return success_response(message="User status updated.", data=result)
