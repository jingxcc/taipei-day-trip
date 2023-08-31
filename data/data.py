import json
import re, unicodedata
import mysql.connector

# db
conn = mysql.connector.connect(
    host="localhost", user="root", password="okok", database="website"
)
my_cursor = conn.cursor(dictionary=True)


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

# columns_input_db = {
#     "name": "name",
#     "description": "description",
#     "address": "address",
#     "direction": "transport",
#     "latitude": "latitude",
#     "longitude": "longitude",
#     "MRT": "name",
#     "CAT": "name",
#     "file": "url",
# }

columns_input_db = {
    "name": {"table": "attraction", "column": "name"},
    "description": {"table": "attraction", "column": "description"},
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
        if column in columns_input_db and attraction[column] != None:
            if columns_input_db[column]["table"] == target_table:
                category_set.add(attraction[column])

category_set = [
    unicodedata.normalize("NFKC", item).replace(" ", "") for item in category_set
]

print(category_set)


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

# print(data_attraction)

# mrt
target_table = "mrt"
mrt_set = set()
for attraction in data["result"]["results"]:
    for column in attraction:
        if column in columns_input_db and attraction[column] != None:
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

print(mrt_set)


not finished

# image_url
target_table = "image_url"
data_attraction = []
for attraction in data["result"]["results"]:
    row = {}
    for column in attraction:
        if column in columns_input_db:
            if columns_input_db[column]["table"] == target_table:
                pass
