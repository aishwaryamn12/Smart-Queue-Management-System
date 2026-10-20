from database import get_db_connection

class AdminModel:

    @staticmethod
    def login(username, password):

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT * FROM admin WHERE username=%s AND password=%s",
            (username, password)
        )

        admin = cursor.fetchone()

        cursor.close()
        conn.close()

        return admin