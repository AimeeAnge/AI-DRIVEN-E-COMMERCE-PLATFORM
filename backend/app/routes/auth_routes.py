from flask import Blueprint, g, request

from ..services.auth_service import AuthError, login_user, register_user
from ..utils.auth import login_required
from ..utils.responses import error_response, success_response


auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/register")
def register():
    try:
        result = register_user(request.get_json(silent=True) or {})
    except AuthError as exc:
        return error_response(exc.message, status_code=exc.status_code, code=exc.code, data=exc.data)

    return success_response(
        message="Account created successfully.",
        data=result,
        status_code=201,
    )


@auth_bp.post("/login")
def login():
    try:
        result = login_user(request.get_json(silent=True) or {})
    except AuthError as exc:
        return error_response(exc.message, status_code=exc.status_code, code=exc.code, data=exc.data)

    return success_response(message="Signed in successfully.", data=result)


@auth_bp.get("/me")
@login_required
def me():
    return success_response(message="Account loaded.", data={"user": g.current_user})
