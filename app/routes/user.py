from flask import Blueprint, request, jsonify
from db import my_pool
from datetime import datetime, timedelta, timezone
import jwt

user_bp = Blueprint("user_bp", __name__)


@user_bp.route("/api/user", methods=["POST"])
def api_signup():
    request_data = request.get_json()
    user_name = request_data["name"]
    email = request_data["email"]
    password = request_data["password"]

    try:
        my_conn = my_pool.get_connection()
        my_cursor = my_conn.cursor(dictionary=True)

        sql = "SELECT email FROM user \
                WHERE email = %s"
        val = (email,)
        my_cursor.execute(sql, val)
        result = my_cursor.fetchall()

        if len(result) == 0:
            sql = "INSERT INTO user (user_name, email, password) \
                    VALUES (%s, %s, %s)"
            val = (user_name, email, password)
            my_cursor.execute(sql, val)
            my_conn.commit()
            print(f"{my_cursor.rowcount} record(s) was inserted")

            return jsonify({"ok": True})
        else:
            message = "Sign-up failed. Duplicate email or other reasons"
            return (
                jsonify(
                    {
                        "error": True,
                        "message": message,
                    }
                ),
                400,
            )

    except Exception as err:
        print(f"ERROR: {err}")
        message = "Internal Server Error"
        return jsonify({"error": True, "message": message}), 500

    finally:
        if "my_conn" in locals():
            my_conn.close()


@user_bp.route("/api/user/auth", methods=["GET", "PUT"])
def api_user_auth():
    JWT_KEY = "secret"
    JWT_ALGORITHM = "HS256"

    if request.method == "GET":
        reponse_columns = ["id", "name", "email"]
        try:
            if "Authorization" in request.headers:
                bearer = request.headers["Authorization"]
                token = bearer.split()[1]
                response_data = {"data": None}

                try:
                    decode_result = jwt.decode(token, JWT_KEY, JWT_ALGORITHM)

                    response_data = {"data": {}}
                    for key in decode_result:
                        if key in reponse_columns:
                            response_data["data"][key] = decode_result[key]

                    return jsonify(response_data)

                except jwt.ExpiredSignatureError:
                    message = "Log-in token expires"
                    print(f"ERROR: {message}")

        except Exception as err:
            print(f"ERROR: {err}")

        return jsonify(response_data)

    elif request.method == "PUT":
        request_data = request.get_json()
        email = request_data["email"]
        password = request_data["password"]
        try:
            my_conn = my_pool.get_connection()
            my_curosr = my_conn.cursor(dictionary=True)

            sql = "SELECT id, user_name as name, email FROM user \
                WHERE email = %s AND password = %s"
            val = (email, password)
            my_curosr.execute(sql, val)
            result = my_curosr.fetchall()

            if len(result) == 0:
                message = "Log-in failed. Incorrect account, password or other reasons"
                return (
                    jsonify(
                        {
                            "error": True,
                            "message": message,
                        }
                    ),
                    400,
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
            message = "Internal Server Error"
            return jsonify({"error": True, "message": message}), 500

        finally:
            if "my_conn" in locals():
                my_conn.close()
