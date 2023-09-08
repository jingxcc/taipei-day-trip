import json
import re, unicodedata
import mysql.connector


def get_image_urls(text):
    REGEXP_IMG = r"https?://[^\s]*\.(?:jpg|JPG)\b"
    image_urls = []

    urls = re.split(r"(?=http)", text)
    for url in urls:
        if re.match(REGEXP_IMG, url):
            image_urls.append(url)
    return image_urls


with open("taipei-attractions.json", mode="r", encoding="utf-8") as file:
    data = json.load(file)


# db connect
my_conn = mysql.connector.connect(
    host="localhost", user="root", password="okok", database="taipei_trip"
)
my_cursor = my_conn.cursor(dictionary=True)

columns_input_db = {
    "name": {"table": "attraction", "column": "name"},
    "description": {"table": "attraction", "column": "description"},
    "CAT_ID": {"table": "attraction", "column": "category_id"},
    "address": {"table": "attraction", "column": "address"},
    "direction": {"table": "attraction", "column": "transport"},
    "latitude": {"table": "attraction", "column": "latitude"},
    "longitude": {"table": "attraction", "column": "longitude"},
    "MRT": {"table": "mrt", "column": "name"},
    "CAT": {"table": "category", "column": "name"},
    "file": {"table": "image_url", "column": "url"},
}


# category
target_table = "category"
category_set = set()
for attraction in data["result"]["results"]:
    for column in attraction:
        if column in columns_input_db and attraction[column] is not None:
            if columns_input_db[column]["table"] == target_table:
                category_set.add(attraction[column])

insert_rowcount = 0
for item in category_set:
    sql = f"INSERT INTO {target_table} (name) \
        VALUES (%s)"
    val = (item,)
    my_cursor.execute(sql, val)
    insert_rowcount += my_cursor.rowcount

my_conn.commit()
print(f"{insert_rowcount} was inserted in {target_table}")


# mrt
target_table = "mrt"
mrt_set = set()
for attraction in data["result"]["results"]:
    for column in attraction:
        if column in columns_input_db and attraction[column] is not None:
            if columns_input_db[column]["table"] == target_table:
                mrt_set.add(attraction[column])

mrt_set = [unicodedata.normalize("NFKC", item) for item in mrt_set]

process_list = list(mrt_set)
remove_idx = []
items_add = []
for i in range(len(process_list)):
    if "/" in process_list[i]:
        remove_idx.append(i)
        items_add += process_list[i].split("/")

for idx in remove_idx:
    process_list.pop(idx)

process_list += items_add
mrt_set = set(process_list)


insert_rowcount = 0
for item in mrt_set:
    sql = f"INSERT INTO {target_table} (name) \
        VALUES (%s)"
    val = (item,)
    my_cursor.execute(sql, val)
    insert_rowcount += my_cursor.rowcount

my_conn.commit()
print(f"{insert_rowcount} was inserted in {target_table}")


# add category id into data
sql = "SELECT * FROM category"
my_cursor.execute(sql)
result = my_cursor.fetchall()

for attraction in data["result"]["results"]:
    for r in result:
        if attraction["CAT"] == r["name"]:
            attraction["CAT_ID"] = r["id"]
            break
# attraction
target_table = "attraction"
data_attraction = []
for attraction in data["result"]["results"]:
    row = {}
    for column in attraction:
        if column in columns_input_db:
            if columns_input_db[column]["table"] == target_table:
                row[column] = attraction[column]

    data_attraction.append(row)

insert_rowcount = 0
for attr in data_attraction:
    sql = f"INSERT INTO {target_table} (name, description, category_id, address, transport, latitude, longitude) \
        VALUES (%s, %s, %s, %s, %s, %s, %s)"
    val = (
        attr["name"],
        attr["description"],
        attr["CAT_ID"],
        attr["address"],
        attr["direction"],
        attr["latitude"],
        attr["longitude"],
    )
    my_cursor.execute(sql, val)
    insert_rowcount += my_cursor.rowcount

my_conn.commit()
print(f"{insert_rowcount} was inserted in {target_table}")


# add attraction id into data
sql = "SELECT * FROM attraction"
my_cursor.execute(sql)
result = my_cursor.fetchall()
for attraction in data["result"]["results"]:
    for r in result:
        if r["name"] == attraction["name"]:
            attraction["name_ID"] = r["id"]
            break

# attraction_mrt
target_table = "attraction_mrt"
data_attraction_mrt = []

sql = "SELECT * FROM mrt"
my_cursor.execute(sql)
result = my_cursor.fetchall()

for attraction in data["result"]["results"]:
    if attraction["MRT"] is not None:
        mrt_normal = unicodedata.normalize("NFKC", attraction["MRT"])
        if "/" not in mrt_normal:
            for r in result:
                if r["name"] == mrt_normal:
                    data_attraction_mrt.append((attraction["name_ID"], r["id"]))
        else:
            mrt_list = mrt_normal.split("/")
            for mrt in mrt_list:
                for r in result:
                    if r["name"] == mrt:
                        data_attraction_mrt.append((attraction["name_ID"], r["id"]))
    else:
        data_attraction_mrt.append((attraction["name_ID"], None))

insert_rowcount = 0
for item in data_attraction_mrt:
    sql = f"INSERT INTO {target_table} (attraction_id, mrt_id)  \
        VALUES (%s, %s)"
    my_cursor.execute(sql, item)
    insert_rowcount += my_cursor.rowcount

my_conn.commit()
print(f"{insert_rowcount} was inserted in {target_table}")


# image_url
target_table = "image_url"
data_image_url = []
for attraction in data["result"]["results"]:
    for column in attraction:
        if column in columns_input_db:
            if columns_input_db[column]["table"] == target_table:
                urls_list = get_image_urls(attraction[column])
                for url in urls_list:
                    data_image_url.append((attraction["name_ID"], url))

insert_rowcount = 0
for item in data_image_url:
    sql = f"INSERT INTO {target_table} (attraction_id, url)  \
        VALUES (%s, %s)"
    my_cursor.execute(sql, item)
    insert_rowcount += my_cursor.rowcount

my_conn.commit()
print(f"{insert_rowcount} was inserted in {target_table}")


my_conn.close()
