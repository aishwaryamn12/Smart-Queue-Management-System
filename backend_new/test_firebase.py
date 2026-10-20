from services.firebase_service import send_push_notification
from database import get_db_connection


connection = get_db_connection()
cursor = connection.cursor(dictionary=True)

cursor.execute("""
    SELECT customer_id, token
    FROM notification_tokens
    ORDER BY updated_at DESC
    LIMIT 1
""")

result = cursor.fetchone()

cursor.close()
connection.close()


if not result:
    print("❌ No FCM token found in database.")
    exit()


print("Customer ID:", result["customer_id"])
print("FCM token found.")

try:
    send_push_notification(
        token=result["token"],
        title="🔔 Smart Queue Test",
        body="Firebase notification is working successfully!",
        data={
            "type": "test"
        }
    )

    print("✅ Test notification sent successfully!")

except Exception as e:
    print("❌ Notification failed:")
    print(e)