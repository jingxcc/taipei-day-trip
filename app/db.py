import mysql.connector
from dotenv import load_dotenv
import os

load_dotenv()
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")

db_config = {
    "host": "localhost",
    "user": "root",
    "password": MYSQL_PASSWORD,
    "database": "taipei_trip",
    "pool_name": "my_pool",
    "pool_size": 3,
}
my_pool = mysql.connector.pooling.MySQLConnectionPool(**db_config)
