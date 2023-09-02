from flask import *
import mysql.connector

app = Flask(__name__)
app.json.ensure_ascii = False
app.json.sort_keys = False
app.config["TEMPLATES_AUTO_RELOAD"] = True

db_config = {
    "host": "localhost",
    "user": "root",
    "password": "okok",
    "database": "taipei_trip",
    "pool_name": "my_pool",
    "pool_size": 3,
}
my_pool = mysql.connector.pooling.MySQLConnectionPool(**db_config)


# Pages
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/attraction/<id>")
def attraction(id):
    return render_template("attraction.html")


@app.route("/booking")
def booking():
    return render_template("booking.html")


@app.route("/thankyou")
def thankyou():
    return render_template("thankyou.html")


# APIs
@app.route("/api/attractions")
def api_attractions():
    records_per_page = 12

    page = request.args.get("page")
    keyword = request.args.get("keyword")
    
    if not page:
        return jsonify({"error": True, "message": "'page' is required"}), 500
    if not page.isdigit():
        return jsonify({"error": True, "message": "'page' type error"}), 500

    try:
        my_conn = my_pool.get_connection()
        my_cursor = my_conn.cursor(dictionary=True)

        where_sql = ""
        if keyword is not None: 
            where_sql = f" WHERE m.name='{keyword}' or a.name LIKE '%{keyword}%'"

        page = int(page)
        records_offset = records_per_page * page
        limit_sql = f" LIMIT {records_per_page} OFFSET {records_offset}"

        sql = f"SELECT a.id, a.name, c.name as category, a.description, a.address, a.transport \
                    , GROUP_CONCAT(DISTINCT m.name SEPARATOR ', ') as mrt, a.latitude as lat, a.longitude as lng \
                    , GROUP_CONCAT(DISTINCT iu.url SEPARATOR ', ') as images \
                FROM attraction a \
                LEFT JOIN attraction_mrt am ON a.id = am.attraction_id \
                LEFT JOIN mrt m ON m.id = am.mrt_id \
                LEFT JOIN category c ON c.id = a.category_id \
                LEFT JOIN image_url iu ON iu.attraction_id = a.id \
                {where_sql} \
                GROUP BY a.id, a.name, c.name, a.description, a.address, a.transport, a.latitude, a.longitude \
                ORDER BY a.id"
        my_cursor.execute(sql)
        result = my_cursor.fetchall()
        total_rowcount = my_cursor.rowcount
        
        if int(total_rowcount/records_per_page) >= page + 1:
            next_page_num = page + 1
        else:
            next_page_num = None
        

        sql += limit_sql
        my_cursor.execute(sql)
        result = my_cursor.fetchall()

        # concat concatenate data to list
        columns_convert = ["mrt", "images"]
        for col in columns_convert:
            for r in result:
                if r[col] is not None:
                    r[col] = r[col].split(", ")

        return jsonify({"nextPage": next_page_num, "data": result})

    except Exception as err:
        print(f"ERROR: {err}")
        return jsonify({"error": True, "message": "Internal Server Error"}), 500

    finally:
        if "my_conn" in locals():
            my_conn.close()


@app.route("/api/attraction/<int:attractionId>")
def api_attraction_id(attractionId):

    try:
        my_conn = my_pool.get_connection()
        my_cursor = my_conn.cursor(dictionary=True)

        where_sql = f"WHERE a.id = {attractionId}"
        sql = f"SELECT a.id, a.name, c.name as category, a.description, a.address, a.transport \
                    , GROUP_CONCAT(DISTINCT m.name SEPARATOR ', ') as mrt, a.latitude as lat, a.longitude as lng \
                    , GROUP_CONCAT(DISTINCT iu.url SEPARATOR ', ') as images \
                FROM attraction a \
                LEFT JOIN attraction_mrt am ON a.id = am.attraction_id \
                LEFT JOIN mrt m ON m.id = am.mrt_id \
                LEFT JOIN category c ON c.id = a.category_id \
                LEFT JOIN image_url iu ON iu.attraction_id = a.id \
                {where_sql} \
                GROUP BY a.id, a.name, c.name, a.description, a.address, a.transport, a.latitude, a.longitude \
                ORDER BY a.id"
        my_cursor.execute(sql)
        result = my_cursor.fetchall()

        if len(result) == 0:
            return jsonify({"error": True, "message": "Incorrect Attraction Number"}), 400
        
        # concat concatenate data to list
        columns_convert = ["mrt", "images"]
        for col in columns_convert:
            for r in result:
                if r[col] is not None:
                    r[col] = r[col].split(", ")

        return jsonify({"data": result})

    except Exception as err:
        print(f"ERROR: {err}")
        return jsonify({"error": True, "message": "Internal Server Error"}), 500
    
    finally:
        if "my_conn" in locals():
            my_conn.close()


@app.route("/api/mrts")
def api_mrts():
    try:
        my_conn = my_pool.get_connection()
        my_cursor = my_conn.cursor(dictionary=True)

        sql = "SELECT m.name \
                FROM mrt m \
                LEFT JOIN attraction_mrt am ON am.mrt_id = m.id \
                LEFT JOIN attraction a ON a.id = am.attraction_id \
                GROUP BY m.name \
                ORDER BY count(*) DESC"
        my_cursor.execute(sql)
        result = my_cursor.fetchall()

        result_list = []
        for r in result:
            result_list.append(r['name'])

        return jsonify({"data": result_list})

    except Exception as err:
        print(f"ERROR: {err}")
        return jsonify({"error": True, "message": "Internal Server Error"}), 500
    
    finally:
        if "my_conn" in locals():
            my_conn.close()



app.run(host="0.0.0.0", port=3000)
