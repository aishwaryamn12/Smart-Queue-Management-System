from database import get_db_connection


try:
    connection = get_db_connection()

    if connection.is_connected():
        print("✅ MySQL connection successful!")
        print("✅ Connected to smart_queue_db_new")

    connection.close()

except Exception as e:
    print("❌ MySQL connection failed!")
    print("Error:", e)