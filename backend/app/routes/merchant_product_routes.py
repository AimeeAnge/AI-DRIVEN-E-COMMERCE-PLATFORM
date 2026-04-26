from flask import Blueprint, g, request

from ..services.product_service import (
    CatalogError,
    create_merchant_product,
    list_merchant_products,
    update_merchant_product,
    update_merchant_product_status,
)
from ..utils.auth import roles_required
from ..utils.pagination import pagination_params
from ..utils.responses import error_response, success_response


merchant_product_bp = Blueprint("merchant_products", __name__)


def _catalog_error(exc):
    return error_response(exc.message, status_code=exc.status_code, code=exc.code, data=exc.data)


@merchant_product_bp.get("")
@roles_required("merchant")
def merchant_products():
    page, page_size, offset = pagination_params(request.args)
    try:
        result = list_merchant_products(g.current_user["id"], request.args, page, page_size, offset)
    except CatalogError as exc:
        return _catalog_error(exc)
    return success_response(message="Merchant products loaded.", data=result)


@merchant_product_bp.post("")
@roles_required("merchant")
def create_product():
    payload = request.form.to_dict(flat=True) if request.form else request.get_json(silent=True) or {}
    image_file = request.files.get("image") if request.files else None
    try:
        result = create_merchant_product(g.current_user["id"], payload, image_file=image_file)
    except CatalogError as exc:
        return _catalog_error(exc)
    return success_response(message="Product created.", data=result, status_code=201)


@merchant_product_bp.put("/<product_id>")
@roles_required("merchant")
def update_product(product_id):
    try:
        result = update_merchant_product(g.current_user["id"], product_id, request.get_json(silent=True) or {})
    except CatalogError as exc:
        return _catalog_error(exc)
    return success_response(message="Product updated.", data=result)


@merchant_product_bp.patch("/<product_id>/status")
@roles_required("merchant")
def update_product_status(product_id):
    payload = request.get_json(silent=True) or {}
    try:
        result = update_merchant_product_status(g.current_user["id"], product_id, payload.get("status"))
    except CatalogError as exc:
        return _catalog_error(exc)
    return success_response(message="Product status updated.", data=result)
