import mysql.connector


def get_db_connection():

    connection = mysql.connector.connect(
        host="localhost",
        user="root",
        password="@Aishwaryamn12",
        database="smart_queue_db_new"
    )

    return connection