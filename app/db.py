import mysql.connector

db_config = {
    "host": "localhost",
    "user": "root",
    "password": "okok",
    "database": "taipei_trip",
    "pool_name": "my_pool",
    "pool_size": 3,
}
my_pool = mysql.connector.pooling.MySQLConnectionPool(**db_config)
