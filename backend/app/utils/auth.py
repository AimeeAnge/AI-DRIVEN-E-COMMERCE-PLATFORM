from functools import wraps

import jwt
from flask import g, request

from ..services.auth_service import AuthError, get_user_by_id
from .responses import error_response
from .security import decode_access_token


def _bearer_token():
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None
    return header.removeprefix("Bearer ").strip()


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        token = _bearer_token()
        if not token:
            return error_response("Please sign in to continue.", status_code=401, code="missing_token")

        try:
            payload = decode_access_token(token)
            g.current_user = get_user_by_id(payload["sub"])
        except jwt.ExpiredSignatureError:
            return error_response("Your session has expired. Please sign in again.", status_code=401, code="token_expired")
        except jwt.InvalidTokenError:
            return error_response("Please sign in again.", status_code=401, code="invalid_token")
        except AuthError as exc:
            return error_response(exc.message, status_code=exc.status_code, code=exc.code, data=exc.data)

        return view(*args, **kwargs)

    return wrapped


def load_optional_user():
    token = _bearer_token()
    g.current_user = None
    if not token:
        return None

    try:
        payload = decode_access_token(token)
        g.current_user = get_user_by_id(payload["sub"])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, AuthError):
        g.current_user = None
    return g.current_user


def optional_auth(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        load_optional_user()
        return view(*args, **kwargs)

    return wrapped


def roles_required(*roles):
    allowed_roles = set(roles)

    def decorator(view):
        @login_required
        @wraps(view)
        def wrapped(*args, **kwargs):
            if g.current_user["role"] not in allowed_roles:
                return error_response(
                    "You do not have permission to access this resource.",
                    status_code=403,
                    code="permission_denied",
                )
            return view(*args, **kwargs)

        return wrapped

    return decorator
