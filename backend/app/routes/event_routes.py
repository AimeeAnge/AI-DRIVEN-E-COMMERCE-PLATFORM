from flask import Blueprint, g, request

from ..services.event_service import EventError, record_event
from ..utils.auth import optional_auth
from ..utils.responses import error_response, success_response


event_bp = Blueprint("events", __name__)


def _event_error(exc):
    return error_response(exc.message, status_code=exc.status_code, code=exc.code, data=exc.data)


@event_bp.post("")
@optional_auth
def events():
    user = getattr(g, "current_user", None)
    try:
        result = record_event(user["id"] if user else None, request.get_json(silent=True) or {})
    except EventError as exc:
        return _event_error(exc)
    return success_response(message="Event recorded.", data=result, status_code=201)
