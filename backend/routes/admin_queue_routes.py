from flask import Blueprint, request, jsonify
from database import get_db_connection

admin_queue_bp = Blueprint("admin_queue", __name__)


# =========================================================
# GET QUEUE FOR ADMIN COUNTER
# =========================================================

@admin_queue_bp.route("/admin/queue", methods=["GET"])
def get_admin_queue():

    try:
        counter_no = request.args.get("counter_no")

        if not counter_no:
            return jsonify({
                "status": "error",
                "message": "Counter number is required"
            }), 400

        counter_no = int(counter_no)

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                q.queue_id,
                q.token_no,
                q.customer_id,
                c.customer_name,
                c.phone,
                c.email,
                s.service_name,
                q.counter_no,
                q.queue_status,
                q.waiting_time,
                q.started_at,
                q.completed_at,
                q.estimated_end_at,
                q.created_at,
                q.admin_called
            FROM queue q

            JOIN customers c
                ON q.customer_id = c.customer_id

            JOIN services s
                ON q.service_id = s.service_id

            WHERE q.counter_no = %s

            ORDER BY
                CASE
                    WHEN q.queue_status = 'Serving' THEN 1
                    WHEN q.queue_status = 'Waiting' THEN 2
                    WHEN q.queue_status = 'Completed' THEN 3
                END,

                q.created_at ASC
        """, (counter_no,))

        queue_data = cursor.fetchall()

        cursor.close()
        connection.close()

        return jsonify({
            "status": "success",
            "counter_no": counter_no,
            "queue": queue_data
        }), 200

    except ValueError:

        return jsonify({
            "status": "error",
            "message": "Invalid counter number"
        }), 400

    except Exception as e:

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


# =========================================================
# ADMIN CALL CUSTOMER
# =========================================================

@admin_queue_bp.route("/admin/call-customer", methods=["POST"])
def call_customer():

    try:

        data = request.get_json()

        queue_id = data.get("queue_id")
        counter_no = data.get("counter_no")

        if not queue_id or not counter_no:

            return jsonify({
                "status": "error",
                "message": "Queue ID and counter number are required"
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # -------------------------------------------------
        # FIND CUSTOMER
        # -------------------------------------------------

        cursor.execute("""
            SELECT
                q.queue_id,
                q.token_no,
                q.service_id,
                q.queue_status
            FROM queue q

            WHERE q.queue_id = %s
            AND q.counter_no = %s
        """, (
            queue_id,
            counter_no
        ))

        customer = cursor.fetchone()

        if not customer:

            cursor.close()
            connection.close()

            return jsonify({
                "status": "error",
                "message": "Customer not found for this counter"
            }), 404

        # -------------------------------------------------
        # CHECK COMPLETED
        # -------------------------------------------------

        if customer["queue_status"] == "Completed":

            cursor.close()
            connection.close()

            return jsonify({
                "status": "error",
                "message": "Customer is already completed"
            }), 400

        # -------------------------------------------------
        # COMPLETE CURRENT SERVING CUSTOMER
        # ONLY FOR MANUAL ADMIN CALL
        # -------------------------------------------------

        cursor.execute("""
            UPDATE queue

            SET
                queue_status = 'Completed',
                waiting_time = 0,
                completed_at = NOW()

            WHERE counter_no = %s

            AND queue_status = 'Serving'

            AND queue_id != %s
        """, (
            counter_no,
            queue_id
        ))

        # -------------------------------------------------
        # GET SERVICE TIME
        # -------------------------------------------------

        cursor.execute("""
            SELECT average_time

            FROM services

            WHERE service_id = %s
        """, (
            customer["service_id"],
        ))

        service = cursor.fetchone()

        average_time = 5

        if service:

            average_time = service["average_time"]

        # -------------------------------------------------
        # START CUSTOMER
        #
        # admin_called = TRUE
        #
        # This tells StatusPage:
        # SHOW POPUP IMMEDIATELY
        # -------------------------------------------------

        cursor.execute("""
            UPDATE queue

            SET
                queue_status = 'Serving',

                started_at = NOW(),

                completed_at = NULL,

                estimated_end_at = DATE_ADD(
                    NOW(),
                    INTERVAL %s MINUTE
                ),

                waiting_time = %s,

                admin_called = TRUE,

                turn_notification_sent = FALSE

            WHERE queue_id = %s
        """, (
            average_time,
            average_time * 60,
            queue_id
        ))

        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({

            "status": "success",

            "message": "Customer called successfully",

            "token_no": customer["token_no"],

            "counter_no": counter_no

        }), 200

    except Exception as e:

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


# =========================================================
# ADMIN COMPLETE CUSTOMER
# =========================================================

@admin_queue_bp.route("/admin/complete-customer", methods=["POST"])
def complete_customer():

    try:

        data = request.get_json()

        queue_id = data.get("queue_id")
        counter_no = data.get("counter_no")

        if not queue_id or not counter_no:

            return jsonify({
                "status": "error",
                "message": "Queue ID and counter number are required"
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # -------------------------------------------------
        # FIND CUSTOMER
        # -------------------------------------------------

        cursor.execute("""
            SELECT
                queue_id,
                token_no,
                queue_status

            FROM queue

            WHERE queue_id = %s

            AND counter_no = %s
        """, (
            queue_id,
            counter_no
        ))

        customer = cursor.fetchone()

        if not customer:

            cursor.close()
            connection.close()

            return jsonify({
                "status": "error",
                "message": "Customer not found"
            }), 404

        # -------------------------------------------------
        # COMPLETE CUSTOMER
        # -------------------------------------------------

        cursor.execute("""
            UPDATE queue

            SET
                queue_status = 'Completed',

                waiting_time = 0,

                completed_at = NOW(),

                admin_called = FALSE

            WHERE queue_id = %s

            AND counter_no = %s
        """, (
            queue_id,
            counter_no
        ))

        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({

            "status": "success",

            "message": "Customer completed successfully",

            "token_no": customer["token_no"]

        }), 200

    except Exception as e:

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500