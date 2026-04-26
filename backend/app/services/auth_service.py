import psycopg
from flask import current_app
from psycopg.rows import dict_row

from ..utils.security import create_access_token, hash_password, verify_password
from ..utils.validators import (
    LOGIN_ROLES,
    PUBLIC_REGISTRATION_ROLES,
    normalize_email,
    normalize_role,
    validate_email,
    validate_password,
)


class AuthError(Exception):
    def __init__(self, message, code="auth_error", status_code=400, data=None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.data = data or {}


def _connect():
    database_url = current_app.config.get("DATABASE_URL")
    if not database_url:
        raise AuthError(
            "Authentication is not available right now. Please try again later.",
            code="database_not_configured",
            status_code=503,
        )
    return psycopg.connect(database_url, row_factory=dict_row)


def _public_user(user):
    return {
        "id": str(user["id"]),
        "email": user["email"],
        "full_name": user.get("full_name"),
        "phone_number": user.get("phone_number"),
        "phone_country_code": user.get("phone_country_code"),
        "role": user["role"],
        "status": user["status"],
        "country_code": user.get("country_code"),
        "region": user.get("region"),
        "city": user.get("city"),
    }


def _fetch_user_by_email(cursor, email):
    cursor.execute(
        """
        SELECT id, email, password_hash, full_name, phone_number, phone_country_code,
               role, status, country_code, region, city
        FROM users
        WHERE email = %s
        """,
        (email,),
    )
    return cursor.fetchone()


def _fetch_user_by_id(cursor, user_id):
    cursor.execute(
        """
        SELECT id, email, full_name, phone_number, phone_country_code,
               role, status, country_code, region, city
        FROM users
        WHERE id = %s
        """,
        (user_id,),
    )
    return cursor.fetchone()


def register_user(payload):
    email = normalize_email(payload.get("email"))
    password = payload.get("password")
    role = normalize_role(payload.get("role"))
    full_name = (payload.get("full_name") or payload.get("name") or "").strip() or None
    phone_number = (payload.get("phone_number") or payload.get("phone") or "").strip() or None
    phone_country_code = (payload.get("phone_country_code") or "").strip() or None
    country_code = (payload.get("country_code") or "").strip().upper() or None
    region = (payload.get("region") or "").strip() or None
    city = (payload.get("city") or "").strip() or None
    store_name = (payload.get("store_name") or payload.get("storeName") or "").strip()

    if not validate_email(email):
        raise AuthError("Enter a valid email address.", code="invalid_email")
    if not validate_password(password):
        raise AuthError(
            "Password must be at least 8 characters.",
            code="weak_password",
        )
    if role not in PUBLIC_REGISTRATION_ROLES:
        raise AuthError(
            "This account type cannot be created here.",
            code="role_not_allowed",
            status_code=403,
        )
    if role == "merchant" and not store_name:
        raise AuthError("Store name is required for merchant accounts.", code="store_name_required")

    try:
        with _connect() as connection:
            with connection.cursor() as cursor:
                if _fetch_user_by_email(cursor, email):
                    raise AuthError(
                        "An account with this email already exists.",
                        code="email_already_registered",
                        status_code=409,
                    )

                cursor.execute(
                    """
                    INSERT INTO users (
                        email, password_hash, full_name, phone_number, phone_country_code,
                        role, country_code, region, city
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id, email, full_name, phone_number, phone_country_code,
                              role, status, country_code, region, city
                    """,
                    (
                        email,
                        hash_password(password),
                        full_name,
                        phone_number,
                        phone_country_code,
                        role,
                        country_code,
                        region,
                        city,
                    ),
                )
                user = cursor.fetchone()

                if role == "merchant":
                    cursor.execute(
                        """
                        INSERT INTO merchant_profiles (
                            user_id, store_name, country_code, region, city
                        )
                        VALUES (%s, %s, %s, %s, %s)
                        """,
                        (user["id"], store_name, country_code, region, city),
                    )

        return {
            "user": _public_user(user),
            "access_token": create_access_token(user),
        }
    except psycopg.errors.UndefinedTable as exc:
        raise AuthError(
            "Authentication setup is incomplete. Import backend/schema.sql into PostgreSQL.",
            code="database_schema_missing",
            status_code=503,
        ) from exc
    except psycopg.Error as exc:
        current_app.logger.exception("Registration failed: %s", exc)
        raise AuthError(
            "We could not create your account right now. Please try again later.",
            code="registration_failed",
            status_code=503,
        ) from exc


def login_user(payload):
    email = normalize_email(payload.get("email"))
    password = payload.get("password")
    requested_role = normalize_role(payload.get("role"), default="")

    if not validate_email(email) or not password:
        raise AuthError("Email or password is incorrect.", code="invalid_credentials", status_code=401)
    if requested_role and requested_role not in LOGIN_ROLES:
        raise AuthError("This account role is not supported.", code="role_not_supported")

    try:
        with _connect() as connection:
            with connection.cursor() as cursor:
                user = _fetch_user_by_email(cursor, email)
    except psycopg.errors.UndefinedTable as exc:
        raise AuthError(
            "Authentication setup is incomplete. Import backend/schema.sql into PostgreSQL.",
            code="database_schema_missing",
            status_code=503,
        ) from exc
    except psycopg.Error as exc:
        current_app.logger.exception("Login failed: %s", exc)
        raise AuthError(
            "We could not sign you in right now. Please try again later.",
            code="login_failed",
            status_code=503,
        ) from exc

    if not user or not verify_password(user["password_hash"], password):
        raise AuthError("Email or password is incorrect.", code="invalid_credentials", status_code=401)
    if user["status"] == "disabled":
        raise AuthError(
            "This account has been disabled. Please contact support.",
            code="account_disabled",
            status_code=403,
        )
    if user["status"] != "active":
        raise AuthError(
            "This account is not active. Please contact support.",
            code="account_not_active",
            status_code=403,
        )
    if requested_role and requested_role != user["role"]:
        raise AuthError(
            "This account does not match the selected role.",
            code="role_mismatch",
            status_code=403,
        )

    return {
        "user": _public_user(user),
        "access_token": create_access_token(user),
    }


def get_user_by_id(user_id):
    try:
        with _connect() as connection:
            with connection.cursor() as cursor:
                user = _fetch_user_by_id(cursor, user_id)
    except psycopg.errors.UndefinedTable as exc:
        raise AuthError(
            "Authentication setup is incomplete. Import backend/schema.sql into PostgreSQL.",
            code="database_schema_missing",
            status_code=503,
        ) from exc
    except psycopg.Error as exc:
        current_app.logger.exception("Current user lookup failed: %s", exc)
        raise AuthError(
            "We could not load your account right now. Please try again later.",
            code="current_user_failed",
            status_code=503,
        ) from exc

    if not user:
        raise AuthError("Please sign in again.", code="user_not_found", status_code=401)
    if user["status"] != "active":
        raise AuthError(
            "This account is not active. Please contact support.",
            code="account_not_active",
            status_code=403,
        )
    return _public_user(user)
