from flask import Blueprint, request, jsonify
from db import my_pool
from .user import login_required

# tmp
booking_bp = Blueprint("booking_bp", __name__)

TMP_BOOKING_NUM = 1


@booking_bp.route("/api/booking", methods=["GET"])
@login_required
def get_booking(login_data):
    response_data = {"data": None}
    try:
        my_conn = my_pool.get_connection()
        my_cursor = my_conn.cursor(dictionary=True)

        sql = "SELECT a.id, a.attraction_name, a.address,  \
                    DATE_FORMAT(b.booking_date,'%Y-%m-%d') booking_date, bp.time, bp.price, \
                    i.id AS image_id, i.url AS image_url \
                FROM booking b \
                LEFT JOIN attraction a ON b.attraction_id = a.id \
                LEFT JOIN booking_price bp ON b.booking_price_id = bp.id \
                LEFT JOIN image_url i ON a.id = i.attraction_id \
                WHERE b.user_id = %s \
                ORDER BY i.id \
                LIMIT 1"
        val = (login_data["data"]["id"],)
        my_cursor.execute(sql, val)
        result = my_cursor.fetchall()

        if len(result) > 0:
            print(result)
            response_data = {"data": {}}
            response_data["data"] = {
                "attraction": {
                    "id": result[0]["id"],
                    "name": result[0]["attraction_name"],
                    "address": result[0]["address"],
                    "image": result[0]["image_url"],
                },
                "date": result[0]["booking_date"],
                "time": result[0]["time"],
                "price": int(result[0]["price"]),
            }

    except Exception as err:
        print(f"ERROR: {err}")
    finally:
        if "my_conn" in locals():
            my_conn.close()
    return jsonify(response_data)


@booking_bp.route("/api/booking", methods=["POST"])
@login_required
def add_booking(login_data):
    try:
        my_conn = my_pool.get_connection()
        my_cursor = my_conn.cursor(dictionary=True)

        request_data = request.get_json()
        # print(request_data)
        sql = "SELECT * FROM booking_price \
                WHERE time=%s and start_date <= current_date() \
	            and (end_date Is Null OR end_date >= current_date())"
        val = (request_data["time"],)
        my_cursor.execute(sql, val)
        booking_price_data = my_cursor.fetchall()
        # [{'id': 2, 'time': 'afternoon', 'price': Decimal('2500.00'), 'start_date': datetime.date(2023, 9, 1), 'end_date': None}]
        # print(booking_price_data)

        if len(booking_price_data) > 0:
            columns_mapping = {
                "user_id": login_data["data"]["id"],
                "attraction_id": request_data["attractionId"],
                "booking_price_id": booking_price_data[0]["id"],
                "booking_date": request_data["date"],
                "booking_num": TMP_BOOKING_NUM,
            }

            sql = "SELECT * FROM booking \
                    WHERE user_id=%s"
            val = (columns_mapping["user_id"],)
            my_cursor.execute(sql, val)
            result = my_cursor.fetchall()

            if my_cursor.rowcount > 0:
                # tmp
                sql = "DELETE FROM booking \
                    WHERE user_id=%s"
                my_cursor.execute(sql, val)
                my_conn.commit()
                print(f"{my_cursor.rowcount} record(s) was deleted")

            sql = "INSERT INTO booking (user_id, attraction_id, booking_price_id, booking_date, booking_num) \
                    VALUES(%s, %s, %s, %s, %s);"
            val = tuple(columns_mapping.values())
            my_cursor.execute(sql, val)
            my_conn.commit()
            print(f"{my_cursor.rowcount} record(s) was inserted")

            # {'data': {'id': 7, 'name': 'aaa', 'email': 'aaa@aaa.com'}}
            # {'attractionId': 10, 'date': '2023-09-30', 'time': 'afternoon', 'price': 2500}
            print(login_data)
            print(request_data)

            return jsonify({"ok": True})

        message = "Booking Failed. Incorrect input or other reasons."
        return jsonify({"error": True, "message": message}), 400

    except Exception as err:
        print(f"ERROR: {err}")
        message = "Internal Server Error"
        return jsonify({"error": True, "message": message}), 500

    finally:
        if "my_conn" in locals():
            my_conn.close()


@booking_bp.route("/api/booking", methods=["DELETE"])
@login_required
def delete_booking(login_data):
    try:
        my_conn = my_pool.get_connection()
        my_cursor = my_conn.cursor(dictionary=True)

        # tmp: delete only by searching user_id
        val = (login_data["data"]["id"],)
        sql = "DELETE FROM booking \
                    WHERE user_id=%s"
        my_cursor.execute(sql, val)
        my_conn.commit()
        print(f"{my_cursor.rowcount} record(s) was deleted")

        if my_cursor.rowcount >= 0:
            return jsonify({"ok": True})

    except Exception as err:
        print(f"ERROR: {err}")

    finally:
        if "my_conn" in locals():
            my_conn.close()

    return jsonify({"error": True}), 500  # add (tmp)
