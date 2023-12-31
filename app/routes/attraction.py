from flask import Blueprint, request, jsonify
from db import my_pool

attraction_bp = Blueprint("attraction_bp", __name__)

error_msg = {"500": "伺服器內部錯誤", "attraction_400": "景點編號不正確"}


@attraction_bp.route("/api/attractions")
def api_attractions():
    RECORDS_PER_PAGE = 12

    page = request.args.get("page")
    keyword = request.args.get("keyword")

    if not page:
        message = error_msg["500"]
        # message = "'page' is required"
        return jsonify({"error": True, "message": message}), 500
    if not page.isdigit():
        message = error_msg["500"]
        # message = "'page' type error"
        return jsonify({"error": True, "message": message}), 500

    try:
        my_conn = my_pool.get_connection()
        my_cursor = my_conn.cursor(dictionary=True)

        where_sql = ""
        val = ()
        val_list = []
        if keyword is not None:
            where_sql = f" WHERE m.mrt_name=%s or a.attraction_name LIKE %s"
            val_list = [keyword, f"%{keyword}%"]

        page = int(page)
        records_offset = RECORDS_PER_PAGE * page
        # add one more record for checking next page number
        limit_sql = f" LIMIT {RECORDS_PER_PAGE + 1} OFFSET %s"
        val_list += [records_offset]
        val = tuple(val_list)

        sql = f"SELECT a.id, a.attraction_name, c.category_name as category, a.description, a.address, a.transport \
                    , GROUP_CONCAT(DISTINCT m.mrt_name SEPARATOR ', ') as mrt, a.latitude as lat, a.longitude as lng \
                    , GROUP_CONCAT(DISTINCT iu.url ORDER BY iu.id SEPARATOR ', ') as images \
                FROM attraction a \
                LEFT JOIN attraction_mrt am ON a.id = am.attraction_id \
                LEFT JOIN mrt m ON m.id = am.mrt_id \
                LEFT JOIN category c ON c.id = a.category_id \
                LEFT JOIN image_url iu ON iu.attraction_id = a.id \
                {where_sql} \
                GROUP BY a.id, a.attraction_name, c.category_name, a.description, a.address, a.transport, a.latitude, a.longitude \
                ORDER BY a.id \
                {limit_sql} "

        my_cursor.execute(sql, val)
        result = my_cursor.fetchall()
        result_rows = my_cursor.rowcount

        # checking next page number
        if result_rows > RECORDS_PER_PAGE:
            next_page_num = page + 1
            result.pop()  # remove one record of data
        else:
            next_page_num = None

        # concat concatenate data to list
        columns_convert = ["mrt", "images"]
        for col in columns_convert:
            for r in result:
                print(r)
                if r[col] is not None:
                    r[col] = r[col].split(", ")

        return jsonify({"nextPage": next_page_num, "data": result})

    except Exception as err:
        print(f"ERROR: {err}")
        message = error_msg["500"]
        return jsonify({"error": True, "message": message}), 500

    finally:
        if "my_conn" in locals():
            my_conn.close()


@attraction_bp.route("/api/attraction/<int:attractionId>")
def api_attraction_id(attractionId):
    try:
        my_conn = my_pool.get_connection()
        my_cursor = my_conn.cursor(dictionary=True)

        # where_sql = f"WHERE a.id = {attractionId}"
        sql = "SELECT a.id, a.attraction_name, c.category_name as category, a.description, a.address, a.transport \
                    , GROUP_CONCAT(DISTINCT m.mrt_name SEPARATOR ', ') as mrt, a.latitude as lat, a.longitude as lng \
                    , GROUP_CONCAT(DISTINCT iu.url ORDER BY iu.id SEPARATOR ', ') as images \
                FROM attraction a \
                LEFT JOIN attraction_mrt am ON a.id = am.attraction_id \
                LEFT JOIN mrt m ON m.id = am.mrt_id \
                LEFT JOIN category c ON c.id = a.category_id \
                LEFT JOIN image_url iu ON iu.attraction_id = a.id \
                WHERE a.id = %s \
                GROUP BY a.id, a.attraction_name, c.category_name, a.description, a.address, a.transport, a.latitude, a.longitude \
                ORDER BY a.id"
        my_cursor.execute(sql, (attractionId,))
        result = my_cursor.fetchall()

        if len(result) == 0:
            message = error_msg["attraction_400"]
            # message ="Incorrect Attraction Number"
            return (
                jsonify({"error": True, "message": "Incorrect Attraction Number"}),
                400,
            )

        # concat concatenate data to list
        columns_convert = ["mrt", "images"]
        for col in columns_convert:
            for r in result:
                if r[col] is not None:
                    r[col] = r[col].split(", ")

        return jsonify({"data": result})

    except Exception as err:
        print(f"ERROR: {err}")
        # message = "Internal Server Error"
        message = error_msg["500"]
        return jsonify({"error": True, "message": message}), 500

    finally:
        if "my_conn" in locals():
            my_conn.close()


@attraction_bp.route("/api/mrts")
def api_mrts():
    try:
        my_conn = my_pool.get_connection()
        my_cursor = my_conn.cursor(dictionary=True)

        sql = "SELECT m.mrt_name \
                FROM mrt m \
                LEFT JOIN attraction_mrt am ON am.mrt_id = m.id \
                LEFT JOIN attraction a ON a.id = am.attraction_id \
                GROUP BY m.mrt_name \
                ORDER BY count(*) DESC"
        my_cursor.execute(sql)
        result = my_cursor.fetchall()

        result_list = []
        for r in result:
            result_list.append(r["mrt_name"])

        return jsonify({"data": result_list})

    except Exception as err:
        print(f"ERROR: {err}")
        message = error_msg["500"]
        # message = "Internal Server Error"
        return jsonify({"error": True, "message": message}), 500

    finally:
        if "my_conn" in locals():
            my_conn.close()
