import firebase_admin
from firebase_admin import messaging
from database import get_db_connection


def send_notification(token_no, title, body, data=None):
    """
    Send an FCM push notification to the customer
    using the FCM token stored in MySQL.
    """

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Get FCM token for this queue token
        cursor.execute("""
            SELECT fcm_token
            FROM notification_tokens
            WHERE token_no = %s
            LIMIT 1
        """, (token_no,))

        result = cursor.fetchone()

        cursor.close()
        conn.close()

        if not result:
            print(f"No FCM token found for {token_no}")
            return False

        fcm_token = result["fcm_token"]

        # Create notification message
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body
            ),
            data=data or {},
            token=fcm_token
        )

        # Send notification
        response = messaging.send(message)

        print(
            f"Notification sent successfully to {token_no}: {response}"
        )

        return True

    except Exception as e:
        print(
            f"Notification error for {token_no}: {str(e)}"
        )
        return False