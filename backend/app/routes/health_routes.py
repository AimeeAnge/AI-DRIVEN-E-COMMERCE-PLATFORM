from flask import Blueprint

from ..utils.database_check import check_database_ready
from ..utils.responses import error_response, success_response


health_bp = Blueprint("health", __name__)


@health_bp.get("")
def health():
    return success_response(
        message="AIDEP backend is running.",
        data={"service": "aidep-backend", "status": "healthy"},
    )


@health_bp.get("/db")
def health_db():
    result, status_code = check_database_ready()
    if result["ok"]:
        return success_response(message=result["message"], data=result["data"], status_code=status_code)
    return error_response(
        message=result["message"],
        status_code=status_code,
        code=result["code"],
        data=result.get("data"),
    )
