import firebase_config
from notification_service import send_notification


token_no = "D004"

success = send_notification(
    token_no,
    "🏦 Smart Queue Management",
    "🔔 Test notification: Your queue notification system is working!",
    {
        "token_no": token_no,
        "type": "test"
    }
)

if success:
    print("✅ Test notification sent successfully!")
else:
    print("❌ Test notification failed!")