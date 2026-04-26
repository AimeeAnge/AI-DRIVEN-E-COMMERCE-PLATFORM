import re


EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PUBLIC_REGISTRATION_ROLES = {"customer", "merchant"}
LOGIN_ROLES = {"customer", "merchant", "admin"}


def normalize_email(email):
    return (email or "").strip().lower()


def validate_email(email):
    return bool(EMAIL_PATTERN.match(email or ""))


def validate_password(password):
    return isinstance(password, str) and len(password) >= 8


def normalize_role(role, default="customer"):
    return (role or default).strip().lower()
