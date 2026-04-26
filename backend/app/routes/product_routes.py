from flask import Blueprint, Response, request

from ..services.product_service import CatalogError, get_product_image, get_public_product, list_public_products
from ..utils.pagination import pagination_params
from ..utils.responses import error_response, success_response


product_bp = Blueprint("products", __name__)


def _catalog_error(exc):
    return error_response(exc.message, status_code=exc.status_code, code=exc.code, data=exc.data)


@product_bp.get("")
def products():
    page, page_size, offset = pagination_params(request.args)
    try:
        result = list_public_products(request.args, page, page_size, offset)
    except CatalogError as exc:
        return _catalog_error(exc)
    return success_response(message="Products loaded.", data=result)


@product_bp.get("/search")
def search_products():
    page, page_size, offset = pagination_params(request.args)
    try:
        result = list_public_products(request.args, page, page_size, offset)
    except CatalogError as exc:
        return _catalog_error(exc)
    return success_response(message="Product search loaded.", data=result)


@product_bp.get("/images/<image_id>")
def product_image(image_id):
    try:
        image = get_product_image(image_id)
    except CatalogError as exc:
        return _catalog_error(exc)

    response = Response(image["data"], mimetype=image["mime_type"])
    response.headers["Cache-Control"] = "public, max-age=3600"
    response.headers["Content-Length"] = str(image.get("size_bytes") or len(image["data"]))
    response.headers["Content-Disposition"] = f'inline; filename="{image["file_name"]}"'
    return response


@product_bp.get("/<product_id>")
def product_detail(product_id):
    try:
        result = get_public_product(product_id)
    except CatalogError as exc:
        return _catalog_error(exc)
    return success_response(message="Product loaded.", data=result)
