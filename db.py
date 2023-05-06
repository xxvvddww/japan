import pymysql

def connect():
    conn = pymysql.connect(
        host="localhost",
        user="xander",
        password="root",
        database="japanmap"
    )
    return conn
