from apscheduler.schedulers.background import BackgroundScheduler

from database import get_db_connection
from notification_service import send_notification


def notification_already_sent(queue_id, notification_type):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT id
        FROM notification_log
        WHERE queue_id = %s
        AND notification_type = %s
        LIMIT 1
    """, (queue_id, notification_type))

    result = cursor.fetchone()

    cursor.close()
    conn.close()

    return result is not None


def save_notification_log(queue_id, notification_type):

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT IGNORE INTO notification_log
        (
            queue_id,
            notification_type
        )
        VALUES
        (
            %s,
            %s
        )
    """, (queue_id, notification_type))

    conn.commit()

    cursor.close()
    conn.close()


def get_required_documents(service_name):

    documents = {
        "Cash Deposit": [
            "Bank account/passbook",
            "Valid ID proof",
            "Deposit slip"
        ],

        "Cash Withdrawal": [
            "Bank account/passbook",
            "Valid ID proof",
            "Withdrawal slip"
        ],

        "Account Opening": [
            "Aadhaar/Valid ID proof",
            "PAN Card",
            "Address proof",
            "Passport-size photograph"
        ],

        "Loan Inquiry": [
            "Valid ID proof",
            "Bank documents",
            "Loan-related documents"
        ],

        "Passbook Update": [
            "Passbook",
            "Valid ID proof"
        ]
    }

    return documents.get(
        service_name,
        [
            "Valid ID proof",
            "Relevant bank documents"
        ]
    )


def check_queue_notifications():

    try:

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                q.queue_id,
                q.token_no,
                q.service_id,
                q.queue_status,
                q.waiting_time,
                s.service_name,
                s.average_time
            FROM queue q
            JOIN services s
                ON q.service_id = s.service_id
            WHERE q.queue_status IN ('Waiting', 'Serving')
            ORDER BY q.service_id, q.created_at
        """)

        customers = cursor.fetchall()

        cursor.close()
        conn.close()

        print(
            "🔍 Checking queue:",
            [
                (
                    c["token_no"],
                    c["queue_status"],
                    c["waiting_time"]
                )
                for c in customers
            ]
        )

        for customer in customers:

            queue_id = customer["queue_id"]
            token_no = customer["token_no"]
            status = customer["queue_status"]
            waiting_time = customer["waiting_time"]
            service_name = customer["service_name"]

            # -------------------------
            # CUSTOMER IS SERVING
            # -------------------------

            if status == "Serving":

                if not notification_already_sent(
                    queue_id,
                    "TURN"
                ):

                    documents = get_required_documents(
                        service_name
                    )

                    document_text = ", ".join(documents)

                    success = send_notification(
                        token_no,
                        "🟢 Your Turn Has Come",
                        (
                            f"Token {token_no}: "
                            f"Your turn has come. "
                            f"Please proceed to the counter. "
                            f"Bring: {document_text}"
                        ),
                        {
                            "token_no": token_no,
                            "type": "TURN",
                            "service": service_name,
                            "documents": document_text
                        }
                    )

                    if success:

                        save_notification_log(
                            queue_id,
                            "TURN"
                        )

                        print(
                            f"✅ TURN notification sent to {token_no}"
                        )

            # -------------------------
            # CUSTOMER IS WAITING
            # -------------------------

            elif status == "Waiting":

                # 10 MINUTE NOTIFICATION
                if (
                    waiting_time <= 10
                    and waiting_time > 5
                ):

                    if not notification_already_sent(
                        queue_id,
                        "10_MINUTES"
                    ):

                        success = send_notification(
                            token_no,
                            "⏰ Your Turn is Approaching",
                            (
                                f"Token {token_no}: "
                                f"Your turn is approximately "
                                f"10 minutes away. "
                                f"Please get ready."
                            ),
                            {
                                "token_no": token_no,
                                "type": "10_MINUTES",
                                "service": service_name
                            }
                        )

                        if success:

                            save_notification_log(
                                queue_id,
                                "10_MINUTES"
                            )

                            print(
                                f"✅ 10-MINUTE notification "
                                f"sent to {token_no}"
                            )

                # 5 MINUTE NOTIFICATION
                elif waiting_time <= 5:

                    if not notification_already_sent(
                        queue_id,
                        "5_MINUTES"
                    ):

                        success = send_notification(
                            token_no,
                            "⏰ Your Turn is Near",
                            (
                                f"Token {token_no}: "
                                f"Your turn is approximately "
                                f"5 minutes away. "
                                f"Please proceed towards "
                                f"the bank."
                            ),
                            {
                                "token_no": token_no,
                                "type": "5_MINUTES",
                                "service": service_name
                            }
                        )

                        if success:

                            save_notification_log(
                                queue_id,
                                "5_MINUTES"
                            )

                            print(
                                f"✅ 5-MINUTE notification "
                                f"sent to {token_no}"
                            )

    except Exception as e:

        print(
            "❌ Scheduler error:",
            str(e)
        )


def start_notification_scheduler():

    scheduler = BackgroundScheduler()

    scheduler.add_job(
        check_queue_notifications,
        "interval",
        seconds=30,
        id="queue_notification_job",
        replace_existing=True
    )

    scheduler.start()

    print(
        "🔔 Queue notification scheduler started!"
    )

    return scheduler