import threading
import time
import math
from datetime import datetime, timedelta

from database import get_db_connection


ENGINE_INTERVAL = 1

_engine_started = False
_engine_lock = threading.Lock()


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


def queue_engine_loop():

    while True:

        try:
            process_all_services()

        except Exception as e:
            print("Queue Engine Error:", e)

        time.sleep(ENGINE_INTERVAL)


def process_all_services():

    connection = None
    cursor = None

    try:

        connection = get_db_connection()

        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                service_id,
                service_name,
                average_time
            FROM services
            ORDER BY service_id
            """
        )

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

        print("Process services error:", e)

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


def process_service(
    connection,
    cursor,
    service
):

    service_id = int(service["service_id"])

    cursor.execute(
        """
        SELECT
            queue_id,
            token_no,
            started_at,
            estimated_end_at
        FROM queue
        WHERE service_id = %s
        AND queue_status = 'Serving'
        ORDER BY started_at ASC
        LIMIT 1
        """,
        (service_id,)
    )

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


def process_serving_customer(
    connection,
    cursor,
    service,
    serving
):

    queue_id = serving["queue_id"]
    token_no = serving["token_no"]

    now = datetime.now()

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

        cursor.execute(
            """
            UPDATE queue
            SET
                started_at = %s,
                estimated_end_at = %s
            WHERE queue_id = %s
            """,
            (
                started_at,
                estimated_end_at,
                queue_id
            )
        )

        return

    if now >= serving["estimated_end_at"]:

        cursor.execute(
            """
            UPDATE queue
            SET
                queue_status = 'Completed',
                waiting_time = 0,
                completed_at = %s
            WHERE queue_id = %s
            """,
            (
                now,
                queue_id
            )
        )

        print(
            f"Token {token_no} completed "
            f"for {service['service_name']}"
        )

        start_next_customer(
            connection,
            cursor,
            service
        )

        return

    remaining_seconds = (
        serving["estimated_end_at"] - now
    ).total_seconds()

    remaining_minutes = max(
        0,
        math.ceil(
            remaining_seconds / 60
        )
    )

    cursor.execute(
        """
        UPDATE queue
        SET waiting_time = %s
        WHERE queue_id = %s
        """,
        (
            remaining_minutes,
            queue_id
        )
    )


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

    cursor.execute(
        """
        SELECT
            queue_id,
            token_no,
            customer_id
        FROM queue
        WHERE service_id = %s
        AND queue_status = 'Waiting'
        ORDER BY created_at ASC, queue_id ASC
        LIMIT 1
        """,
        (service_id,)
    )

    next_customer = cursor.fetchone()

    if not next_customer:
        return

    queue_id = next_customer["queue_id"]
    token_no = next_customer["token_no"]

    estimated_end = (
        now
        + timedelta(
            minutes=average_time
        )
    )

    cursor.execute(
        """
        UPDATE queue
        SET
            queue_status = 'Serving',
            started_at = %s,
            estimated_end_at = %s,
            waiting_time = %s
        WHERE queue_id = %s
        """,
        (
            now,
            estimated_end,
            average_time,
            queue_id
        )
    )

    print(
        f"Token {token_no} is now SERVING "
        f"at Counter {service_id}"
    )


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

    cursor.execute(
        """
        SELECT
            estimated_end_at
        FROM queue
        WHERE service_id = %s
        AND queue_status = 'Serving'
        ORDER BY started_at ASC
        LIMIT 1
        """,
        (service_id,)
    )

    serving = cursor.fetchone()

    if (
        serving
        and serving["estimated_end_at"]
    ):

        remaining_seconds = (
            serving["estimated_end_at"] - now
        ).total_seconds()

        remaining_minutes = max(
            0,
            math.ceil(
                remaining_seconds / 60
            )
        )

    else:

        remaining_minutes = 0

    cursor.execute(
        """
        SELECT
            queue_id
        FROM queue
        WHERE service_id = %s
        AND queue_status = 'Waiting'
        ORDER BY created_at ASC, queue_id ASC
        """,
        (service_id,)
    )

    waiting_customers = cursor.fetchall()

    position = 0

    for customer in waiting_customers:

        position += 1

        estimated_wait = (
            remaining_minutes
            + (
                (position - 1)
                * average_time
            )
        )

        cursor.execute(
            """
            UPDATE queue
            SET waiting_time = %s
            WHERE queue_id = %s
            """,
            (
                estimated_wait,
                customer["queue_id"]
            )
        )


def run_queue_engine_once():

    print("Running queue engine test...")

    process_all_services()

    print("Queue engine test completed.")
