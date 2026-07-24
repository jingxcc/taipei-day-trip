from flask import Blueprint, request, jsonify
from db import my_pool
from .user import login_required

booking_bp = Blueprint("booking_bp", __name__)

DEFAULT_BOOKING_GUEST_COUNT = 1

ERROR_MESSAGES = {
    "not_found": "找不到預訂資料",

    "get_list_failed": "購物車資料取得失敗，請稍後再試",
    "get_one_failed": "預訂資料取得失敗，請稍後再試",

    "add_invalid_request": "請提供預訂資料",
    "add_invalid_price": "找不到對應價格，請確認是否為有效價格",
    "add_failed": "加入購物車失敗，請稍後再試",

    "delete_failed": "刪除購物車資料失敗，請稍後再試",
}

# cart page
@booking_bp.route("/api/bookings", methods=["GET"])
@login_required
def get_booking(login_data):
    response_data = {"data": []}
    try:
        my_conn = my_pool.get_connection()
        my_cursor = my_conn.cursor(dictionary=True)

        sql = "SELECT b.id AS booking_id, a.id, a.attraction_name, a.address,  \
                    DATE_FORMAT(b.visit_date,'%Y-%m-%d') visit_date, bp.time, bp.price, \
                    i.id AS image_id, i.url AS image_url \
                FROM booking b \
                LEFT JOIN attraction a ON b.attraction_id = a.id \
                LEFT JOIN booking_price bp ON b.booking_price_id = bp.id \
                LEFT JOIN ( \
                    SELECT attraction_id, MIN(id) AS image_id \
                    FROM image_url \
                    GROUP BY attraction_id \
                ) first_image \
                    ON first_image.attraction_id = a.id \
                LEFT JOIN image_url i \
                    ON i.id = first_image.image_id \
                WHERE b.user_id = %s \
                ORDER BY b.id DESC"
        val = (login_data["data"]["id"],)
        my_cursor.execute(sql, val)
        result = my_cursor.fetchall()

        for booking in result:
            booking_data = {
                "id": booking["booking_id"],
                "attraction": {
                    "id": booking["id"],
                    "name": booking["attraction_name"],
                    "address": booking["address"],
                    "image": booking["image_url"],
                },
                "date": booking["visit_date"],
                "time": booking["time"],
                "price": int(booking["price"]),
            }
            response_data["data"].append(booking_data)

        return jsonify(response_data), 200

    except Exception as err:
        print(f"ERROR: {err}")
        return jsonify(
            {"error": True, "message": ERROR_MESSAGES["get_list_failed"]}
        ), 500
    finally:
        if "my_conn" in locals():
            my_conn.close()
    

# booking page
@booking_bp.route("/api/booking/<int:booking_id>", methods=["GET"])
@login_required
def get_booking_by_id(login_data, booking_id):
    try:
        my_conn = my_pool.get_connection()
        my_cursor = my_conn.cursor(dictionary=True)
        sql = "SELECT b.id AS booking_id, a.id AS attraction_id, \
                    a.attraction_name, a.address, \
                    DATE_FORMAT(b.visit_date, '%Y-%m-%d') AS visit_date, \
                    bp.time, bp.price, i.url AS image_url \
                FROM booking b \
                LEFT JOIN attraction a ON b.attraction_id = a.id \
                LEFT JOIN booking_price bp ON b.booking_price_id = bp.id \
                LEFT JOIN ( \
                    SELECT attraction_id, MIN(id) AS image_id \
                    FROM image_url \
                    GROUP BY attraction_id \
                ) first_image \
                    ON first_image.attraction_id = a.id \
                LEFT JOIN image_url i \
                    ON i.id = first_image.image_id \
                WHERE b.id = %s AND b.user_id = %s"
        my_cursor.execute(sql, (booking_id, login_data["data"]["id"]))
        result = my_cursor.fetchone()
        
        if result is None:
            return jsonify({
                "error": True,
                "message": ERROR_MESSAGES["not_found"],
            }), 404

        return jsonify({"data": {
            "id": result["booking_id"],
            "attraction": {
                "id": result["attraction_id"],
                "name": result["attraction_name"],
                "address": result["address"],
                "image": result["image_url"],
            },
            "date": result["visit_date"],
            "time": result["time"],
            "price": int(result["price"]),
        }}), 200
    
    except Exception as err:
        print(f"ERROR: {err}")
        return jsonify({
            "error": True, 
            "message": ERROR_MESSAGES["get_one_failed"],
        }), 500
    finally:
        if "my_conn" in locals():
            my_conn.close()


@booking_bp.route("/api/booking", methods=["POST"])
@login_required
def add_booking(login_data):
    try:
        my_conn = my_pool.get_connection()
        my_cursor = my_conn.cursor(dictionary=True)

        request_data = request.get_json()
        if not request_data:
            return jsonify({
                "error": True,
                "message": ERROR_MESSAGES["add_invalid_request"],
            }), 400
        
        sql = "SELECT * FROM booking_price \
                WHERE time=%s and start_date <= %s \
	            and (end_date Is Null OR end_date >= %s)"
        val = (request_data["time"], request_data["date"], request_data["date"])
        my_cursor.execute(sql, val)
        booking_price_data = my_cursor.fetchall()

        if booking_price_data is None:
            return jsonify({
                "error": True,
                "message": ERROR_MESSAGES["add_invalid_price"],
            }), 400

        columns_mapping = {
            "user_id": login_data["data"]["id"],
            "attraction_id": request_data["attractionId"],
            "booking_price_id": booking_price_data[0]["id"],
            "visit_date": request_data["date"],
            "guest_count": DEFAULT_BOOKING_GUEST_COUNT,
        }

        sql = "INSERT INTO booking (user_id, attraction_id, booking_price_id, visit_date, guest_count) \
                VALUES(%s, %s, %s, %s, %s);"
        val = tuple(columns_mapping.values())
        my_cursor.execute(sql, val)
        my_conn.commit()
        print(f"{my_cursor.rowcount} record(s) was inserted")

        return jsonify({"ok": True}), 201

    except Exception as err:
        if "my_conn" in locals():
            my_conn.rollback()
            
        print(f"ERROR: {err}")
        return jsonify({
            "error": True,
            "message": ERROR_MESSAGES["add_failed"]
        }), 500

    finally:
        if "my_conn" in locals():
            my_conn.close()


@booking_bp.route("/api/booking/<int:booking_id>", methods=["DELETE"])
@login_required
def delete_booking(login_data, booking_id):
    try:
        my_conn = my_pool.get_connection()
        my_cursor = my_conn.cursor(dictionary=True)

        sql = "DELETE FROM booking \
                    WHERE id=%s AND user_id=%s"
        my_cursor.execute(sql, (booking_id, login_data["data"]["id"]))

        if my_cursor.rowcount == 0:
            return jsonify({
                "error": True,
                "message": ERROR_MESSAGES["not_found"],
            }), 404

        my_conn.commit()
        print(f"{my_cursor.rowcount} record(s) was deleted")

        return jsonify({"ok": True}), 200

    except Exception as err:
        if "my_conn" in locals():
            my_conn.rollback()

        print(f"ERROR: {err}")
        return jsonify({
            "error": True,
            "message": ERROR_MESSAGES["delete_failed"],
        }), 500
    
    finally:
        if "my_conn" in locals():
            my_conn.close()