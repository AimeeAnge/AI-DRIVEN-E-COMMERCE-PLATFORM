from flask import jsonify


def success_response(message, data=None, status_code=200):
    payload = {
        "success": True,
        "message": message,
        "data": data or {},
    }
    return jsonify(payload), status_code


def error_response(message, status_code=400, code="error", data=None):
    payload = {
        "success": False,
        "error": {
            "code": code,
            "message": message,
        },
        "data": data or {},
    }
    return jsonify(payload), status_code
