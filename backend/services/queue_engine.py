import threading
import time
import math
from datetime import datetime, timedelta

from database import get_db_connection
from services.firebase_service import send_push_notification


ENGINE_INTERVAL = 1

_engine_started = False
_engine_lock = threading.Lock()


SERVICE_COUNTERS = {
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5
}


SERVICE_DOCUMENTS = {
    1: "Passbook, Valid ID, Deposit Slip",
    2: "Passbook, Valid ID, Withdrawal Slip",
    3: "Valid ID, Address Proof, Passport Photo",
    4: "Valid ID, Income Proof, Loan Documents",
    5: "Passbook, Valid ID"
}


# ---------------------------------------------------------
# START ENGINE
# ---------------------------------------------------------

def start_queue_engine():

    global _engine_started

    with _engine_lock:

        if _engine_started:
            return

        _engine_started = True

    print("==============================================")
    print("SMART QUEUE AUTOMATIC ENGINE STARTED")
    print("==============================================")

    thread = threading.Thread(
        target=queue_engine_loop,
        daemon=True
    )

    thread.start()


# ---------------------------------------------------------
# MAIN LOOP
# ---------------------------------------------------------

def queue_engine_loop():

    while True:

        try:
            process_all_services()

        except Exception as e:
            print("Queue Engine Error:", e)

        time.sleep(ENGINE_INTERVAL)


# ---------------------------------------------------------
# PROCESS ALL SERVICES
# ---------------------------------------------------------

def process_all_services():

    connection = None
    cursor = None

    try:

        connection = get_db_connection()

        cursor = connection.cursor(
            dictionary=True
        )

        cursor.execute("""
            SELECT
                service_id,
                service_name,
                average_time
            FROM services
            ORDER BY service_id
        """)

        services = cursor.fetchall()

        for service in services:

            process_service(
                connection,
                cursor,
                service
            )

        connection.commit()

    except Exception as e:

        if connection:
            connection.rollback()

        print(
            "Process services error:",
            e
        )

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ---------------------------------------------------------
# PROCESS ONE SERVICE
# ---------------------------------------------------------

def process_service(
    connection,
    cursor,
    service
):

    service_id = int(
        service["service_id"]
    )

    cursor.execute("""
        SELECT
            queue_id,
            token_no,
            customer_id,
            started_at,
            estimated_end_at,
            turn_notification_sent
        FROM queue

        WHERE service_id = %s
        AND queue_status = 'Serving'

        ORDER BY started_at ASC

        LIMIT 1
    """, (service_id,))

    serving = cursor.fetchone()

    if serving:

        process_serving_customer(
            connection,
            cursor,
            service,
            serving
        )

    else:

        start_next_customer(
            connection,
            cursor,
            service
        )

    update_waiting_times(
        cursor,
        service
    )


# ---------------------------------------------------------
# PROCESS SERVING CUSTOMER
# ---------------------------------------------------------

def process_serving_customer(
    connection,
    cursor,
    service,
    serving
):

    queue_id = serving["queue_id"]

    token_no = serving["token_no"]

    now = datetime.now()


    # -----------------------------------------------------
    # SAFETY TIME SETUP
    # -----------------------------------------------------

    if (
        serving["started_at"] is None
        or serving["estimated_end_at"] is None
    ):

        started_at = (
            serving["started_at"]
            or now
        )

        estimated_end_at = (
            started_at
            + timedelta(
                minutes=int(
                    service["average_time"]
                )
            )
        )

        cursor.execute("""
            UPDATE queue

            SET
                started_at = %s,
                estimated_end_at = %s

            WHERE queue_id = %s
        """, (
            started_at,
            estimated_end_at,
            queue_id
        ))

        return


    # -----------------------------------------------------
    # TIMER REACHED 00:00
    # -----------------------------------------------------

    if now >= serving["estimated_end_at"]:

        # -------------------------------------------------
        # NOTIFY THIS SAME CUSTOMER AT 00:00
        # -------------------------------------------------

        counter_no = SERVICE_COUNTERS.get(
            int(service["service_id"]),
            int(service["service_id"])
        )

        send_customer_notification(
            cursor=cursor,
            customer_id=serving["customer_id"],
            title="🔔 Your Turn Has Come",
            body=(
                f"Token {token_no}. "
                f"Your turn has come. Please come to the bank. "
                f"Please proceed to Counter {counter_no}."
            ),
            data={
                "type": "turn",
                "token_no": token_no,
                "counter_no": str(counter_no)
            }
        )

        cursor.execute("""
            UPDATE queue

            SET
                queue_status = 'Completed',
                waiting_time = 0,
                completed_at = %s,
                turn_notification_sent = TRUE

            WHERE queue_id = %s
        """, (
            now,
            queue_id
        ))

        print(
            f"Token {token_no} completed "
            f"for {service['service_name']}"
        )

        # -------------------------------------------------
        # AUTOMATICALLY START NEXT CUSTOMER
        # -------------------------------------------------

        start_next_customer(
            connection,
            cursor,
            service
        )

        return


    # -----------------------------------------------------
    # UPDATE SERVING COUNTDOWN
    # -----------------------------------------------------

    remaining_seconds = (
        serving["estimated_end_at"]
        - now
    ).total_seconds()

    remaining_minutes = max(
        0,
        math.ceil(
            remaining_seconds / 60
        )
    )

    cursor.execute("""
        UPDATE queue

        SET waiting_time = %s

        WHERE queue_id = %s
    """, (
        remaining_minutes,
        queue_id
    ))


# ---------------------------------------------------------
# START NEXT CUSTOMER
# ---------------------------------------------------------

def start_next_customer(
    connection,
    cursor,
    service
):

    service_id = int(
        service["service_id"]
    )

    average_time = int(
        service["average_time"]
    )

    now = datetime.now()


    # -----------------------------------------------------
    # FIND NEXT WAITING CUSTOMER
    # -----------------------------------------------------

    cursor.execute("""
        SELECT
            queue_id,
            token_no,
            customer_id

        FROM queue

        WHERE service_id = %s
        AND queue_status = 'Waiting'

        ORDER BY
            created_at ASC,
            queue_id ASC

        LIMIT 1
    """, (service_id,))

    next_customer = cursor.fetchone()


    if not next_customer:

        return


    queue_id = next_customer["queue_id"]

    token_no = next_customer["token_no"]

    customer_id = next_customer["customer_id"]


    estimated_end = (
        now
        + timedelta(
            minutes=average_time
        )
    )


    # -----------------------------------------------------
    # WAITING → SERVING
    # -----------------------------------------------------

    cursor.execute("""
        UPDATE queue

        SET
            queue_status = 'Serving',
            started_at = %s,
            estimated_end_at = %s,
            waiting_time = %s

        WHERE queue_id = %s
    """, (
        now,
        estimated_end,
        average_time,
        queue_id
    ))


    counter_no = SERVICE_COUNTERS.get(
        service_id,
        service_id
    )

    print(
        f"Token {token_no} is now SERVING "
        f"at Counter {counter_no}"
    )


# ---------------------------------------------------------
# UPDATE WAITING CUSTOMERS
# ---------------------------------------------------------

def update_waiting_times(
    cursor,
    service
):

    service_id = int(
        service["service_id"]
    )

    average_time = int(
        service["average_time"]
    )

    now = datetime.now()


    # -----------------------------------------------------
    # CURRENT SERVING CUSTOMER
    # -----------------------------------------------------

    cursor.execute("""
        SELECT
            estimated_end_at

        FROM queue

        WHERE service_id = %s
        AND queue_status = 'Serving'

        ORDER BY started_at ASC

        LIMIT 1
    """, (service_id,))

    serving = cursor.fetchone()


    serving_remaining_seconds = 0


    if (
        serving
        and serving["estimated_end_at"]
    ):

        serving_remaining_seconds = max(
            0,
            math.ceil(
                (
                    serving["estimated_end_at"]
                    - now
                ).total_seconds()
            )
        )


    # -----------------------------------------------------
    # WAITING CUSTOMERS
    # -----------------------------------------------------

    cursor.execute("""
        SELECT
            queue_id,
            customer_id

        FROM queue

        WHERE service_id = %s
        AND queue_status = 'Waiting'

        ORDER BY
            created_at ASC,
            queue_id ASC
    """, (service_id,))

    waiting_customers = cursor.fetchall()


    position = 0


    for customer in waiting_customers:

        position += 1


        waiting_seconds = (
            serving_remaining_seconds
            + (
                (position - 1)
                * average_time
                * 60
            )
        )


        waiting_seconds = max(
            0,
            waiting_seconds
        )


        waiting_minutes = math.ceil(
            waiting_seconds / 60
        )


        cursor.execute("""
            UPDATE queue

            SET waiting_time = %s

            WHERE queue_id = %s
        """, (
            waiting_minutes,
            customer["queue_id"]
        ))


# ---------------------------------------------------------
# SEND FCM NOTIFICATION
# ---------------------------------------------------------

def send_customer_notification(
    cursor,
    customer_id,
    title,
    body,
    data=None
):

    try:

        cursor.execute("""
            SELECT
                id,
                token

            FROM notification_tokens

            WHERE customer_id = %s
        """, (
            customer_id,
        ))

        tokens = cursor.fetchall()


        if not tokens:

            print(
                f"No FCM token found "
                f"for customer {customer_id}"
            )

            return


        for token_data in tokens:

            token = token_data["token"]

            try:

                send_push_notification(
                    token=token,
                    title=title,
                    body=body,
                    data=data or {}
                )

                print(
                    f"✅ Turn notification sent "
                    f"to customer {customer_id}"
                )

            except Exception as e:

                print(
                    f"❌ Notification failed "
                    f"for customer {customer_id}:",
                    e
                )


    except Exception as e:

        print(
            "Customer notification error:",
            e
        )


# ---------------------------------------------------------
# MANUAL ENGINE TEST
# ---------------------------------------------------------

def run_queue_engine_once():

    print(
        "Running queue engine test..."
    )

    process_all_services()

    print(
        "Queue engine test completed."
    )