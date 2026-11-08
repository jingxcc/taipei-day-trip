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
    "invalid_request": "請提供正確的付款資料",
    "booking_not_found": "找不到這筆預訂",
    "payment_blocked": "這筆預訂已有處理中的付款或已付款訂單",
    "payment_pending": "付款結果尚未確認，請勿重新付款",
    "payment_succeeded": "付款成功",
    "payment_failed": "付款失敗，請重新付款",
    "server_error": "伺服器內部錯誤",
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


def pending_response(order_no):
    return jsonify({
        "error": True,
        "message": MESSAGES["payment_pending"],
        "data": {"number": order_no},
    }), 502


@order_bp.route("/api/orders", methods=["POST"])
@login_required
def create_order_paid(login_data):
    validated_payment_input = validate_checkout_request(request.get_json(silent=True))
    if validated_payment_input is None:
        return jsonify({"error": True, "message": MESSAGES["invalid_request"]}), 400

    booking_id, prime, contact = validated_payment_input
    user_id = login_data["data"]["id"]
    my_conn = None
    my_cursor = None
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

        # 1. No existing order: create a PENDING order and proceed with payment.
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

        # 2. Existing FAILED order: reopen it as PENDING and retry payment.
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

        # 3. Existing order is not FAILED: do not send another payment request.
        else:
            my_conn.rollback()
            return jsonify({
                "error": True,
                "message": MESSAGES["payment_blocked"],
                "data": {"number": existing["order_no"]},
            }), 409

        # Commit the PENDING order and database price before sending the payment request to TapPay.
        my_conn.commit()
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

        try:
            tappay_response = requests.post(
                TP_TEST_URL,
                headers={"Content-Type": "application/json", "x-api-key": TP_PARTNER_KEY},
                json=tappay_body,
                timeout=20,
            )
            payment_result = tappay_response.json()
        except (requests.RequestException, ValueError) as err:
            print(f"TapPay result unconfirmed for order {order_no}: {err}")
            return pending_response(order_no)

        if (tappay_response.status_code != 200
                or not isinstance(payment_result, dict)
                or isinstance(payment_result.get("status"), bool)
                or not isinstance(payment_result.get("status"), int)):
            return pending_response(order_no)

        payment_succeeded = payment_result["status"] == 0
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
    except Exception as err:
        if my_conn is not None:
            my_conn.rollback()
        print(f"ERROR: {err}")
        return jsonify({"error": True, "message": MESSAGES["server_error"]}), 500
    finally:
        if my_cursor is not None:
            my_cursor.close()
        if my_conn is not None:
            my_conn.close()
