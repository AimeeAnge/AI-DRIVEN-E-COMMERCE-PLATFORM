from .cart_validators import ValidationError, validate_uuid


USER_ROLES = {"customer", "merchant", "admin"}
USER_STATUSES = {"active", "pending", "suspended", "disabled"}
ADMIN_UPDATE_STATUSES = {"active", "suspended", "disabled"}
SELF_BLOCKED_STATUSES = {"suspended", "disabled"}


def validate_user_id(user_id):
    return validate_uuid(user_id, "user_id")


def validate_user_status(status):
    status = (status or "").strip().lower()
    if status not in ADMIN_UPDATE_STATUSES:
        raise ValidationError("User status is not supported.", code="invalid_status")
    return status


def validate_role_filter(role):
    role = (role or "").strip().lower()
    if not role:
        return None
    if role not in USER_ROLES:
        raise ValidationError("User role is not supported.", code="invalid_role")
    return role


def validate_status_filter(status):
    status = (status or "").strip().lower()
    if not status:
        return None
    if status not in USER_STATUSES:
        raise ValidationError("User status is not supported.", code="invalid_status")
    return status
