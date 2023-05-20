import pymysql

def connect():
    conn = pymysql.connect(
        host="db-mysql-syd1-64777-do-user-14114114-0.b.db.ondigitalocean.com",
        user="japanmap",
        password="AVNS_1zXQFHUvxih-c9HOr9L",
        database="japanmap",
        port=25060,
        ssl={"sslmode": "REQUIRED"}
    )
    return conn
