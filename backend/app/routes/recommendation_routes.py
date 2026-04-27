from flask import Blueprint, g, request

from ..services.recommendation_service import (
    RecommendationError,
    cart_recommendations,
    home_recommendations,
    product_recommendations,
    user_recommendations,
)
from ..utils.auth import optional_auth
from ..utils.responses import error_response, success_response


recommendation_bp = Blueprint("recommendations", __name__)


def _recommendation_error(exc):
    return error_response(exc.message, status_code=exc.status_code, code=exc.code, data=exc.data)


def _user_id():
    user = getattr(g, "current_user", None)
    return user["id"] if user else None


@recommendation_bp.get("/home")
@optional_auth
def home():
    try:
        result = home_recommendations(user_id=_user_id(), limit=request.args.get("limit"))
    except RecommendationError as exc:
        return _recommendation_error(exc)
    return success_response(message="Home recommendations loaded.", data=result)


@recommendation_bp.get("/product/<product_id>")
@optional_auth
def product(product_id):
    try:
        result = product_recommendations(product_id, user_id=_user_id(), limit=request.args.get("limit"))
    except RecommendationError as exc:
        return _recommendation_error(exc)
    return success_response(message="Product recommendations loaded.", data=result)


@recommendation_bp.get("/cart")
@optional_auth
def cart():
    user = getattr(g, "current_user", None)
    user_id = user["id"] if user and user["role"] == "customer" else None
    try:
        result = cart_recommendations(user_id=user_id, limit=request.args.get("limit"))
    except RecommendationError as exc:
        return _recommendation_error(exc)
    return success_response(message="Cart recommendations loaded.", data=result)


@recommendation_bp.get("/user")
@optional_auth
def user():
    user = getattr(g, "current_user", None)
    user_id = user["id"] if user and user["role"] == "customer" else None
    try:
        result = user_recommendations(user_id=user_id, limit=request.args.get("limit"))
    except RecommendationError as exc:
        return _recommendation_error(exc)
    return success_response(message="User recommendations loaded.", data=result)
