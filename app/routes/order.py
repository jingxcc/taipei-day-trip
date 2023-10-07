from flask import Blueprint, request, jsonify
from dotenv import load_dotenv
import os
from datetime import datetime
import requests
from db import my_pool
from .user import login_required

TP_PARTNER_KEY = "partner_lpC6yZbdJonQAzIXaZPgqKIWTblxIKV7bKVKgCK50fFbBcYdKGtR4jS5"
TP_MRECHANT_ID = "veralala_CTBC"


load_dotenv()
TP_PARTNER_KEY = os.getenv("TP_PARTNER_KEY")
TP_MRECHANT_ID = os.getenv("TP_MRECHANT_ID")

order_bp = Blueprint("order_bp", __name__)


@order_bp.route("/api/orders", methods=["POST"])
@login_required
def create_order_paid(login_data):
    TP_PROD_URL = "https://prod.tappaysdk.com/tpc/payment/pay-by-prime"
    TP_TEST_URL = "https://sandbox.tappaysdk.com/tpc/payment/pay-by-prime"
    order_no = ""
    try:
        my_conn = my_pool.get_connection()
        my_cursor = my_conn.cursor(dictionary=True)

        request_data = request.get_json()
        print(request_data)
        print(login_data)

        def send_prime(request_data):
            sql = "SELECT * FROM booking \
                    WHERE user_id = %s AND attraction_id = %s"
            val = (
                login_data["data"]["id"],
                request_data["order"]["trip"]["attraction"]["id"],
            )
            my_cursor.execute(sql, val)
            result = my_cursor.fetchall()

            if len(result) > 0:
                sql = "INSERT INTO `order` \
                        (user_id, attraction_id, order_date, order_time, order_price) \
                        VALUES (%s, %s, %s, %s, %s);"
                val = (
                    login_data["data"]["id"],
                    request_data["order"]["trip"]["attraction"]["id"],
                    request_data["order"]["trip"]["date"],
                    request_data["order"]["trip"]["time"],
                    request_data["order"]["price"],
                )
                print(val)
                my_cursor.execute(sql, val)
                print(f"{my_cursor.rowcount} record(s) was inserted")

                sql = "SELECT id FROM `order` \
                        WHERE user_id = %s \
                        ORDER BY create_date DESC \
                        LIMIT 1"
                my_cursor.execute(sql, (login_data["data"]["id"],))
                result = my_cursor.fetchall()

                order_id = result[0]["id"]
                order_no = str(datetime.now().strftime("%Y%m%d%H%M%S")) + str(
                    order_id
                ).zfill(5)
                sql = "UPDATE `order` \
                        SET order_no = %s \
                        WHERE id = %s"
                val = (order_no, order_id)
                my_cursor.execute(sql, val)
                print(f"{my_cursor.rowcount} record(s) was updated")
                if my_cursor.rowcount == 0:
                    raise Exception("Database Update Failed.")

                sql = "INSERT INTO `order_contact` (user_id, contact_name, contact_email, contact_phone) \
                        VALUES (%s, %s, %s, %s) "
                val = (
                    login_data["data"]["id"],
                    request_data["order"]["contact"]["name"],
                    request_data["order"]["contact"]["email"],
                    request_data["order"]["contact"]["phone"],
                )
                my_cursor.execute(sql, val)
                print(f"{my_cursor.rowcount} record(s) was inserted")
                my_conn.commit()

                response_data = {
                    "data": {
                        "number": order_no,
                        "payment": {},
                    }
                }
                return response_data

            return False

        def pay_by_prime(request_data, order_no):
            api_url = TP_TEST_URL
            reqest_headers = {
                "Content-Type": "application/json",
                "x-api-key": TP_PARTNER_KEY,
            }
            request_data_pay_by_prime = {
                "prime": request_data["prime"],
                "partner_key": TP_PARTNER_KEY,
                "merchant_id": TP_MRECHANT_ID,
                "details": "TapPay Test",
                "amount": request_data["order"]["price"],
                "currency": "TWD",
                "order_number": order_no,
                "bank_transaction_id": order_no,
                "details": "Taipei Trip",
                "cardholder": {
                    "phone_number": request_data["order"]["contact"]["phone"],
                    "name": request_data["order"]["contact"]["name"],
                    "email": request_data["order"]["contact"]["email"],
                },
                "remember": True,
            }
            print(request_data_pay_by_prime)
            response = requests.post(
                api_url, headers=reqest_headers, json=request_data_pay_by_prime
            )
            response_data = response.json()

            if response.status_code == 200:
                return response_data
            else:
                return False

        # send prime to server
        response_send_prime = send_prime(request_data)

        if response_send_prime == False:
            message = "Order Creation Failed. Incorrect input or other reasons."
            return jsonify({"error": True, "message": message}), 400

        # pay by prime
        order_no = response_send_prime["data"]["number"]
        response_pay_by_prime = pay_by_prime(request_data, order_no)

        if response_pay_by_prime == False:
            message = "Order Creation Failed. Incorrect input or other reasons."
            return jsonify({"error": True, "message": message}), 400

        response_data = {
            "data": {
                "number": order_no,
                "payment": None,
            }
        }

        if response_pay_by_prime["status"] == 0:
            sql = "UPDATE `order` \
                    SET order_status = 1 \
                    WHERE order_no = %s"
            val = (order_no,)
            my_cursor.execute(sql, val)
            print(f"{my_cursor.rowcount} record(s) was updated")

            if my_cursor.rowcount == 0:
                raise Exception("Database Update Failed.")

            sql = "DELETE FROM booking \
                    WHERE user_id = %s"
            val = (login_data["data"]["id"],)
            my_cursor.execute(sql, val)
            print(f"{my_cursor.rowcount} record(s) was deleted")

            my_conn.commit()
            response_data["data"]["payment"] = {
                "status": response_pay_by_prime["status"],
                "message": "付款成功",
            }
        else:
            response_data["data"]["payment"] = {
                "status": response_pay_by_prime["status"],
                "message": "付款失敗",
            }

        return jsonify(response_data), 200

    except Exception as err:
        print(f"ERROR: {err}")
        message = "Internal Server Error"
        return jsonify({"error": True, "message": message}), 500

    finally:
        if "my_conn" in locals():
            my_conn.close()
