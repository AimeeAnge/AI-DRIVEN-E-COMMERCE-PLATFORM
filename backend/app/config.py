import os
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env")


def _csv(value):
    return [item.strip() for item in value.split(",") if item.strip()]


def _required_env(name):
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"{name} must be set in backend/.env")
    return value


class Config:
    SECRET_KEY = _required_env("SECRET_KEY")
    DATABASE_URL = os.getenv("DATABASE_URL", "")
    JWT_SECRET_KEY = _required_env("JWT_SECRET_KEY")
    JWT_EXPIRES_MINUTES = int(os.getenv("JWT_EXPIRES_MINUTES", "60"))
    MAX_PRODUCT_IMAGE_BYTES = int(os.getenv("MAX_PRODUCT_IMAGE_BYTES", str(5 * 1024 * 1024)))
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", str(6 * 1024 * 1024)))
    CORS_ORIGINS = _csv(
        os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    )
    JSON_SORT_KEYS = False
