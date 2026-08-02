from flask import Blueprint, request, jsonify
from dotenv import load_dotenv
import os
from datetime import datetime, timedelta, timezone
from functools import wraps
import jwt
from mysql.connector import IntegrityError, errorcode
from db import my_pool


user_bp = Blueprint("user_bp", __name__)

load_dotenv()
JWT_KEY = os.getenv("JWT_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM")

error_msg = {
    "unauthorized": "未登入系統，拒絕存取",

    "invalid_signup_data": "請提供正確的註冊資料",
    "duplicate_email": "此 Email 已被註冊",
    "signup_failed": "註冊失敗，請稍後再試",

    "invalid_login_data": "登入資料格式不正確",
    "invalid_credentials": "Email 或密碼錯誤",
    "login_failed": "登入失敗，請稍後再試",
}


def login_required(func):
    @wraps(func)
    def wrapper(*arg, **kwargs):
        current_user = get_current_user()

        if current_user is None:
            message = error_msg["unauthorized"]
            return jsonify({"error": True, "message": message}), 401

        login_data = {"data": current_user}
        return func(login_data=login_data, *arg, **kwargs)

    return wrapper


# sign up
@user_bp.route("/api/user", methods=["POST"])
def api_signup():
    request_data = request.get_json(silent=True)
    required_fields = ("name", "email", "password")

    if not request_data or not all(
        request_data.get(field) for field in required_fields
    ):
        message = error_msg["invalid_signup_data"]
        return jsonify({"error": True, "message": message}), 400

    try:
        my_conn = my_pool.get_connection()
        my_cursor = my_conn.cursor()

        sql = "INSERT INTO user (user_name, email, password) \
                VALUES (%s, %s, %s)"
        val = (
            request_data["name"],
            request_data["email"],
            request_data["password"],
        )
        my_cursor.execute(sql, val)
        my_conn.commit()

        return jsonify({"ok": True}), 201

    except IntegrityError as err:
        if "my_conn" in locals():
            my_conn.rollback()

        if err.errno == errorcode.ER_DUP_ENTRY:
            message = error_msg["duplicate_email"]
            return jsonify({"error": True, "message": message}), 409

        print(f"ERROR: {err}")
        message = error_msg["signup_failed"]
        return jsonify({"error": True, "message": message}), 500

    except Exception as err:
        if "my_conn" in locals():
            my_conn.rollback()

        print(f"ERROR: {err}")
        message = error_msg["signup_failed"]
        return jsonify({"error": True, "message": message}), 500

    finally:
        if "my_conn" in locals():
            my_conn.close()


# check log in status, log in
@user_bp.route("/api/user/auth", methods=["GET", "POST"])
def api_user_auth():
    # check log in status
    if request.method == "GET":
        current_user = get_current_user()
        return jsonify({"data": current_user})

    # log in
    elif request.method == "POST":
        request_data = request.get_json(silent=True)
        required_fields = ("email", "password")

        if not request_data or not all(
            request_data.get(field) for field in required_fields
        ):
            message = error_msg["invalid_login_data"]
            return jsonify({"error": True, "message": message}), 400

        email = request_data["email"]
        password = request_data["password"]
        try:
            my_conn = my_pool.get_connection()
            my_cursor = my_conn.cursor(dictionary=True)

            sql = "SELECT id, user_name as name, email FROM user \
                WHERE email = %s AND password = %s"
            val = (email, password)
            my_cursor.execute(sql, val)
            result = my_cursor.fetchall()

            if len(result) == 0:
                message = error_msg["invalid_credentials"]
                return (
                    jsonify(
                        {
                            "error": True,
                            "message": message,
                        }
                    ),
                    401,
                )

            else:
                token_expiration = datetime.now(tz=timezone.utc) + timedelta(days=7)
                token_payload = result[0]
                token_payload["exp"] = token_expiration
                encoded_result = jwt.encode(
                    token_payload, JWT_KEY, algorithm=JWT_ALGORITHM
                )

                return jsonify({"token": encoded_result})

        except Exception as err:
            print(f"ERROR: {err}")
            message = error_msg["login_failed"]
            return jsonify({"error": True, "message": message}), 500

        finally:
            if "my_conn" in locals():
                my_conn.close()


def get_current_user():
    auth_header = request.headers.get("Authorization", "")
    parts = auth_header.split()

    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None

    token = parts[1]

    try:
        payload = jwt.decode(
            token,
            JWT_KEY,
            algorithms=[JWT_ALGORITHM],
            options={
                "require": ["id", "name", "email", "exp"],
            },
        )
    except jwt.InvalidTokenError as err:
        print(f"ERROR: {err}")
        return None

    return {
        "id": payload["id"],
        "name": payload["name"],
        "email": payload["email"],
    }
