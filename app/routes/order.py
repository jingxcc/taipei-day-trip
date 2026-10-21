import os
import secrets
from datetime import datetime
from decimal import Decimal
from zoneinfo import ZoneInfo

import requests
from dotenv import load_dotenv
from flask import Blueprint, jsonify, request
from mysql.connector import IntegrityError, errorcode

from db import my_pool
from .user import login_required


load_dotenv()
TP_PARTNER_KEY = os.getenv("TP_PARTNER_KEY")
TP_MERCHANT_ID = os.getenv("TP_MERCHANT_ID")
TP_TEST_URL = "https://sandbox.tappaysdk.com/tpc/payment/pay-by-prime"
BUSINESS_TIMEZONE = ZoneInfo("Asia/Taipei")
ORDER_NO_RANDOM_BYTES = 5
BANK_TRANSACTION_ID_RANDOM_BYTES = 8
UNIQUE_ID_MAX_ATTEMPTS = 3
order_bp = Blueprint("order_bp", __name__)

MESSAGES = {
    "orders_list_failed": "訂單資料取得失敗，請稍後再試",
    "invalid_request": "請提供正確的付款資料",
    "booking_not_found": "找不到這筆預訂",
    "payment_blocked": "這筆預訂已有處理中的付款或已付款訂單",
    "payment_pending": "付款結果尚未確認，請勿重新付款",
    "payment_succeeded": "付款成功",
    "payment_failed": "付款失敗，請重新付款",
    "order_preparation_failed": "付款請求失敗，請稍後再試",
    "payment_result_save_failed": "訂單處理發生問題，請勿重新付款",
}


def generate_order_no():
    date = datetime.now(BUSINESS_TIMEZONE).strftime("%Y%m%d")
    return f"ORD-{date}-{secrets.token_hex(ORDER_NO_RANDOM_BYTES).upper()}"

def generate_bank_transaction_id():
    random_part = secrets.token_hex(
        BANK_TRANSACTION_ID_RANDOM_BYTES
    ).upper()

    return f"TXN{random_part}"


def validate_checkout_request(data):
    if not isinstance(data, dict) or set(data) != {"bookingId", "prime", "contact"}:
        return None
    booking_id, prime, contact = data["bookingId"], data["prime"], data["contact"]
    if isinstance(booking_id, bool) or not isinstance(booking_id, int) or booking_id <= 0:
        return None
    if not isinstance(prime, str) or not prime.strip():
        return None
    if not isinstance(contact, dict) or set(contact) != {"name", "email", "phone"}:
        return None
    contact_field_max_lengths = {"name": 50, "email": 255, "phone": 20}
    normalized_contact = {}
    for field, max_length in contact_field_max_lengths.items():
        value = contact[field]
        if not isinstance(value, str) or not value.strip() or len(value.strip()) > max_length:
            return None
        normalized_contact[field] = value.strip()
    return booking_id, prime, normalized_contact


def to_tappay_amount(price: Decimal) -> int:
    if price <= 0 or price != price.to_integral_value():
        raise ValueError("TapPay requires a positive whole-TWD number.")
    return int(price)


def pending_response(order_no, status_code=502):
    return jsonify({
        "error": True,
        "message": MESSAGES["payment_pending"],
        "data": {"number": order_no},
    }), status_code


@order_bp.route("/api/orders", methods=["GET"])
@login_required
def get_orders(login_data):
    my_conn = None
    my_cursor = None
    try:
        my_conn = my_pool.get_connection()
        my_cursor = my_conn.cursor(dictionary=True)
        my_cursor.execute("""
            SELECT o.order_no, o.order_status, o.order_price,
                DATE_FORMAT(o.visit_date, '%Y-%m-%d') AS visit_date,
                o.visit_time, o.guest_count,
                a.id AS attraction_id, a.attraction_name,
                o.booking_id
            FROM `order` o
            JOIN attraction a ON a.id = o.attraction_id
            WHERE o.user_id = %s
            ORDER BY o.create_date DESC, o.id DESC
        """, (login_data["data"]["id"],))

        orders = []
        for row in my_cursor.fetchall():
            orders.append({
                "number": row["order_no"],
                "bookingId": row["booking_id"],
                "status": row["order_status"],
                "price": row["order_price"],
                "guestCount": row["guest_count"],
                "trip": {
                    "attraction": {
                        "id": row["attraction_id"],
                        "name": row["attraction_name"],
                    },
                    "date": row["visit_date"],
                    "time": row["visit_time"],
                },
            })
        return jsonify({"data": orders}), 200
    except Exception as err:
        print(f"ERROR: {err}")
        return jsonify({"error": True, "message": MESSAGES["orders_list_failed"]}), 500
    finally:
        if my_cursor is not None:
            my_cursor.close()
        if my_conn is not None:
            my_conn.close()


@order_bp.route("/api/orders", methods=["POST"])
@login_required
def create_order_and_pay(login_data):
    validated_payment_input = validate_checkout_request(request.get_json(silent=True))
    if validated_payment_input is None:
        return jsonify({"error": True, "message": MESSAGES["invalid_request"]}), 400

    booking_id, prime, contact = validated_payment_input
    user_id = login_data["data"]["id"]
    my_conn = None
    my_cursor = None
    # 無論流程成功、失敗或提前 return，最後都由 finally 關閉 cursor 並歸還資料庫連線。
    try:
        # 第一段：查詢本人 booking，建立或重開 PENDING 訂單，並將訂單與聯絡資訊保存到資料庫。
        try:
            my_conn = my_pool.get_connection()
            my_cursor = my_conn.cursor(dictionary=True)
            # Lock this booking so only one checkout request can process it at a time.
            my_cursor.execute("""
                SELECT b.id, b.attraction_id, b.visit_date, b.guest_count,
                        bp.time AS visit_time, bp.price AS order_price
                FROM booking b
                JOIN booking_price bp ON bp.id = b.booking_price_id
                WHERE b.id = %s AND b.user_id = %s
                    AND bp.start_date <= b.visit_date
                    AND (bp.end_date IS NULL OR bp.end_date >= b.visit_date)
                FOR UPDATE
            """, (booking_id, user_id))
            booking = my_cursor.fetchone()
            if booking is None:
                my_conn.rollback()
                return jsonify({"error": True, "message": MESSAGES["booking_not_found"]}), 404
            amount = to_tappay_amount(booking["order_price"])

            my_cursor.execute(
                "SELECT id, order_no, order_status FROM `order` "
                "WHERE booking_id = %s AND user_id = %s FOR UPDATE",
                (booking_id, user_id),
            )
            existing = my_cursor.fetchone()

            ## 1. No existing order: create a PENDING order and proceed with payment.
            if existing is None:
                val = (
                    booking_id, user_id, booking["attraction_id"],
                    booking["visit_date"], booking["visit_time"],
                    booking["guest_count"], booking["order_price"],
                )
                for _ in range(UNIQUE_ID_MAX_ATTEMPTS):
                    order_no = generate_order_no()
                    bank_transaction_id = generate_bank_transaction_id()
                    try:
                        my_cursor.execute("""
                            INSERT INTO `order`
                                (order_no, booking_id, user_id, attraction_id,
                                visit_date, visit_time, guest_count, order_price,
                                bank_transaction_id, order_status)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'PENDING')
                        """, (order_no,) + val + (bank_transaction_id,))
                        break
                    except IntegrityError as err:
                        if err.errno != errorcode.ER_DUP_ENTRY:
                            raise
                else:
                    raise RuntimeError("Unable to generate unique order number and transaction ID.")

                order_id = my_cursor.lastrowid
                my_cursor.execute("""
                    INSERT INTO order_contact
                        (order_id, user_id, contact_name, contact_email, contact_phone)
                    VALUES (%s, %s, %s, %s, %s)
                """, (order_id, user_id, contact["name"], contact["email"], contact["phone"]))

            ## 2. Existing FAILED order: reopen it as PENDING and retry payment.
            elif existing["order_status"] == "FAILED":
                order_id = existing["id"]
                order_no = existing["order_no"]
                val = (
                    booking["attraction_id"],
                    booking["visit_date"], booking["visit_time"],
                    booking["guest_count"], booking["order_price"],
                )
                for _ in range(UNIQUE_ID_MAX_ATTEMPTS):
                    bank_transaction_id = generate_bank_transaction_id()
                    try:
                        my_cursor.execute("""
                            UPDATE `order`
                            SET order_status = 'PENDING', attraction_id = %s, visit_date = %s,
                                visit_time = %s, guest_count = %s, order_price = %s,
                                bank_transaction_id = %s, rec_trade_id = NULL, paid_at = NULL
                            WHERE id = %s AND order_status = 'FAILED'
                        """, val + (bank_transaction_id, order_id))
                        break
                    except IntegrityError as err:
                        if err.errno != errorcode.ER_DUP_ENTRY:
                            raise
                else:
                    raise RuntimeError("Unable to generate a unique bank transaction ID.")

                if my_cursor.rowcount != 1:
                    raise RuntimeError("Failed to reopen order.")
                my_cursor.execute("""
                    UPDATE order_contact
                    SET contact_name = %s, contact_email = %s, contact_phone = %s
                    WHERE order_id = %s AND user_id = %s
                """, (contact["name"], contact["email"], contact["phone"], order_id, user_id))

            ## 3. Existing order is not FAILED: do not send another payment request.
            else:
                my_conn.rollback()
                return jsonify({
                    "error": True,
                    "message": MESSAGES["payment_blocked"],
                    "data": {"number": existing["order_no"]},
                }), 409

            tappay_body = {
                "prime": prime,
                "partner_key": TP_PARTNER_KEY,
                "merchant_id": TP_MERCHANT_ID,
                "details": "Taipei Trip",
                "amount": amount,
                "currency": "TWD",
                "order_number": order_no,
                "bank_transaction_id": bank_transaction_id,
                "cardholder": {
                    "phone_number": contact["phone"],
                    "name": contact["name"],
                    "email": contact["email"],
                },
                "remember": True,
            }

            my_conn.commit()
        except Exception as err:
            if my_conn is not None:
                my_conn.rollback()
            print(f"Order preparation failed: {err}")
            return jsonify({
                "error": True,
                "message": MESSAGES["order_preparation_failed"],
            }), 500

        # 第二段：向 TapPay 發送付款請求並驗證回覆；無法確認結果時保留 PENDING，取得明確結果才進入第三段。
        try:
            tappay_response = requests.post(
                TP_TEST_URL,
                headers={"Content-Type": "application/json", "x-api-key": TP_PARTNER_KEY},
                json=tappay_body,
                timeout=20,
            )
            # Until non-200 responses are classified, leave the order PENDING.
            if tappay_response.status_code != 200:
                return pending_response(order_no)

            payment_result = tappay_response.json()
            if (not isinstance(payment_result, dict)
                    or isinstance(payment_result.get("status"), bool)
                    or not isinstance(payment_result.get("status"), int)):
                return pending_response(order_no)
        except requests.Timeout as err:
            print(f"TapPay timed out for order {order_no}: {err}")
            return pending_response(order_no, status_code=504)
        except (requests.RequestException, ValueError) as err:
            print(
                f"Payment result unconfirmed while calling TapPay "
                f"for order {order_no}: {err}"
            )
            return pending_response(order_no)
        except Exception as err:
            print(
                f"Unexpected error while processing payment "
                f"for order {order_no}: {err}"
            )
            return pending_response(order_no, status_code=500)

        # 第三段：將付款結果更新為 PAID 或 FAILED；付款成功時一併刪除 booking，再提交資料庫變更。
        payment_succeeded = payment_result["status"] == 0
        try:
            if payment_succeeded:
                my_cursor.execute("""
                    UPDATE `order`
                    SET order_status = 'PAID', paid_at = CURRENT_TIMESTAMP,
                        rec_trade_id = %s
                    WHERE id = %s AND order_status = 'PENDING'
                """, (payment_result.get("rec_trade_id"), order_id))
            else:
                my_cursor.execute(
                    "UPDATE `order` SET order_status = 'FAILED' "
                    "WHERE id = %s AND order_status = 'PENDING'",
                    (order_id,),
                )

            if my_cursor.rowcount != 1:
                raise RuntimeError("Failed to update payment status.")

            if payment_succeeded:
                my_cursor.execute(
                    "DELETE FROM booking WHERE id = %s AND user_id = %s",
                    (booking_id, user_id),
                )
                if my_cursor.rowcount != 1:
                    raise RuntimeError("Failed to remove paid booking.")

            my_conn.commit()
        except Exception as err:
            my_conn.rollback()
            print(
                f"Payment result save failed for order {order_no} "
                f"(TapPay status: {payment_result['status']}): {err}"
            )
            return jsonify({
                "error": True,
                "message": MESSAGES["payment_result_save_failed"],
                "data": {"number": order_no},
            }), 500

        return jsonify({
            "data": {
                "number": order_no,
                "payment": {
                    "status": payment_result["status"],
                    "message": MESSAGES[
                        "payment_succeeded" if payment_succeeded else "payment_failed"
                    ],
                },
            }
        }), 200

    finally:
        if my_cursor is not None:
            my_cursor.close()
        if my_conn is not None:
            my_conn.close()
