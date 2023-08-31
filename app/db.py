import mysql.connector


def hello():
    print("hello")


def connect_db():
    conn = mysql.connector.connect(
        host="localhost", user="root", password="okok", database="website"
    )
    my_cursor = conn.cursor(dictionary=True)
    return conn, my_cursor


def close_db(conn):
    if conn is not None:
        print("Close Connection: ", conn)
        conn.close
