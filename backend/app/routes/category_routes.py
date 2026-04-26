from flask import Blueprint

from ..services.category_service import list_public_categories
from ..services.product_service import CatalogError
from ..utils.responses import error_response, success_response


category_bp = Blueprint("categories", __name__)


@category_bp.get("")
def categories():
    try:
        result = list_public_categories()
    except CatalogError as exc:
        return error_response(exc.message, status_code=exc.status_code, code=exc.code, data=exc.data)
    return success_response(message="Categories loaded.", data=result)
