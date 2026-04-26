from flask import Flask

from .config import Config
from .extensions import cors
from .routes.admin_routes import admin_bp
from .routes.auth_routes import auth_bp
from .routes.cart_routes import cart_bp
from .routes.category_routes import category_bp
from .routes.health_routes import health_bp
from .routes.merchant_dashboard_routes import merchant_dashboard_bp
from .routes.merchant_product_routes import merchant_product_bp
from .routes.order_routes import order_bp
from .routes.product_routes import product_bp
from .routes.wishlist_routes import wishlist_bp


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    cors.init_app(app, resources={r"/api/v1/*": {"origins": app.config["CORS_ORIGINS"]}})

    app.register_blueprint(health_bp, url_prefix="/api/v1/health")
    app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")
    app.register_blueprint(product_bp, url_prefix="/api/v1/products")
    app.register_blueprint(category_bp, url_prefix="/api/v1/categories")
    app.register_blueprint(merchant_product_bp, url_prefix="/api/v1/merchant/products")
    app.register_blueprint(cart_bp, url_prefix="/api/v1/cart")
    app.register_blueprint(order_bp, url_prefix="/api/v1/orders")
    app.register_blueprint(wishlist_bp, url_prefix="/api/v1/wishlist")
    app.register_blueprint(merchant_dashboard_bp, url_prefix="/api/v1/merchant")
    app.register_blueprint(admin_bp, url_prefix="/api/v1/admin")

    return app
