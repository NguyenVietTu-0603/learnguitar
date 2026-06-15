from flask import jsonify


def success_response(data=None, message: str = "Success", status_code: int = 200):
    payload = {
        "success": True,
        "message": message,
        "data": data or {},
    }
    return jsonify(payload), status_code


def error_response(message: str = "Error", details=None, status_code: int = 400):
    payload = {
        "success": False,
        "error": message,
        "details": details or "",
    }
    return jsonify(payload), status_code
