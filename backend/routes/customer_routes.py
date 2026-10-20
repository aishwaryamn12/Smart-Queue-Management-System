from flask import Blueprint, request, jsonify
from database import get_db_connection

customer_bp = Blueprint("customer_bp", __name__)


# ---------------------------------------
# Service Configuration
# ---------------------------------------
SERVICE_CONFIG = {
    1: {
        "prefix": "D",
        "counter": 1
    },
    2: {
        "prefix": "W",
        "counter": 2
    },
    3: {
        "prefix": "A",
        "counter": 3
    },
    4: {
        "prefix": "L",
        "counter": 4
    },
    5: {
        "prefix": "P",
        "counter": 5
    }
}


# ---------------------------------------
# Generate Token
# ---------------------------------------
@customer_bp.route("/generate-token", methods=["POST"])
def generate_token():

    try:
        data = request.get_json()

        customer_name = data["customer_name"]
        phone = data["phone"]
        service_id = int(data["service_id"])

        # Check service configuration
        if service_id not in SERVICE_CONFIG:
            return jsonify({
                "message": "Invalid service selected"
            }), 400

        prefix = SERVICE_CONFIG[service_id]["prefix"]
        counter_no = SERVICE_CONFIG[service_id]["counter"]

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # ---------------------------------------
        # Insert Customer
        # ---------------------------------------
        cursor.execute("""
            INSERT INTO customers
            (customer_name, phone)
            VALUES (%s, %s)
        """, (
            customer_name,
            phone
        ))

        customer_id = cursor.lastrowid

        # ---------------------------------------
        # Get Service Information
        # ---------------------------------------
        cursor.execute("""
            SELECT
                service_name,
                average_time
            FROM services
            WHERE service_id=%s
        """, (service_id,))

        service = cursor.fetchone()

        if not service:

            cursor.close()
            conn.close()

            return jsonify({
                "message": "Service not found"
            }), 404

        service_name = service["service_name"]
        average_time = service["average_time"]

        # ---------------------------------------
        # Generate Separate Token
        # ---------------------------------------
        cursor.execute("""
            SELECT MAX(
                CAST(
                    SUBSTRING(token_no, 2)
                    AS UNSIGNED
                )
            ) AS last_number
            FROM queue
            WHERE service_id=%s
            AND token_no LIKE %s
        """, (
            service_id,
            prefix + "%"
        ))

        result = cursor.fetchone()

        last_number = result["last_number"]

        if last_number is None:
            next_number = 1
        else:
            next_number = last_number + 1

        token_no = f"{prefix}{next_number:03d}"

        # ---------------------------------------
        # Count Active Customers
        # ONLY SAME SERVICE
        # ---------------------------------------
        cursor.execute("""
            SELECT COUNT(*) AS active_count
            FROM queue
            WHERE service_id=%s
            AND queue_status IN ('Waiting', 'Serving')
        """, (service_id,))

        active_result = cursor.fetchone()

        active_count = active_result["active_count"]

        # ---------------------------------------
        # Calculate Waiting Time
        # ---------------------------------------
        waiting_time = active_count * average_time

        # ---------------------------------------
        # First Customer of This Service
        # Gets Serving Status
        # ---------------------------------------
        if active_count == 0:
            queue_status = "Serving"
        else:
            queue_status = "Waiting"

        # ---------------------------------------
        # Insert Queue Record
        # ---------------------------------------
        cursor.execute("""
            INSERT INTO queue
            (
                token_no,
                customer_id,
                service_id,
                counter_no,
                queue_status,
                waiting_time
            )
            VALUES
            (%s, %s, %s, %s, %s, %s)
        """, (
            token_no,
            customer_id,
            service_id,
            counter_no,
            queue_status,
            waiting_time
        ))

        conn.commit()

        cursor.close()
        conn.close()

        # ---------------------------------------
        # Response
        # ---------------------------------------
        return jsonify({

            "token_no": token_no,

            "waiting_time": waiting_time,

            "queue_status": queue_status,

            "service_id": service_id,

            "service_name": service_name,

            "counter_no": counter_no

        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


# ---------------------------------------
# Check Token Status
# ---------------------------------------
@customer_bp.route("/check-status/<token_no>", methods=["GET"])
def check_status(token_no):

    try:

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # ---------------------------------------
        # Get Customer Status
        # ---------------------------------------
        query = """
        SELECT
            q.token_no,
            c.customer_name,
            c.phone,
            s.service_name,
            q.service_id,
            q.counter_no,
            q.waiting_time,
            q.queue_status
        FROM queue q
        JOIN customers c
            ON q.customer_id = c.customer_id
        JOIN services s
            ON q.service_id = s.service_id
        WHERE q.token_no=%s
        ORDER BY q.queue_id DESC
        LIMIT 1
        """

        cursor.execute(query, (token_no,))

        customer = cursor.fetchone()

        if not customer:

            cursor.close()
            conn.close()

            return jsonify({
                "message": "Token Not Found"
            }), 404

        # ---------------------------------------
        # Count People Ahead
        # ONLY SAME SERVICE
        # ---------------------------------------
        cursor.execute("""
            SELECT COUNT(*) AS people_ahead
            FROM queue
            WHERE service_id=%s
            AND queue_status IN ('Waiting', 'Serving')
            AND queue_id < (
                SELECT queue_id
                FROM queue
                WHERE token_no=%s
                ORDER BY queue_id DESC
                LIMIT 1
            )
        """, (
            customer["service_id"],
            token_no
        ))

        result = cursor.fetchone()

        people_ahead = result["people_ahead"]

        cursor.close()
        conn.close()

        # ---------------------------------------
        # Return Status
        # ---------------------------------------
        return jsonify({

            "token_no": customer["token_no"],

            "customer_name": customer["customer_name"],

            "phone": customer["phone"],

            "service_name": customer["service_name"],

            "service_id": customer["service_id"],

            "counter_no": customer["counter_no"],

            "waiting_time": customer["waiting_time"],

            "queue_status": customer["queue_status"],

            "people_ahead": people_ahead

        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


# ---------------------------------------
# Save Firebase Notification Token
# ---------------------------------------
@customer_bp.route("/save-fcm-token", methods=["POST"])
def save_fcm_token():

    try:

        data = request.get_json()

        token_no = data["token_no"]
        fcm_token = data["fcm_token"]

        conn = get_db_connection()
        cursor = conn.cursor()

        # ---------------------------------------
        # Check Existing Firebase Token
        # ---------------------------------------
        cursor.execute("""
            SELECT id
            FROM notification_tokens
            WHERE fcm_token=%s
        """, (fcm_token,))

        existing = cursor.fetchone()

        # ---------------------------------------
        # Update Existing Token
        # ---------------------------------------
        if existing:

            cursor.execute("""
                UPDATE notification_tokens
                SET token_no=%s
                WHERE fcm_token=%s
            """, (
                token_no,
                fcm_token
            ))

        # ---------------------------------------
        # Insert New Token
        # ---------------------------------------
        else:

            cursor.execute("""
                INSERT INTO notification_tokens
                (
                    token_no,
                    fcm_token
                )
                VALUES
                (
                    %s,
                    %s
                )
            """, (
                token_no,
                fcm_token
            ))

        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            "status": "success",
            "message": "Notification token saved successfully"
        })

    except Exception as e:

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
    # =========================================================
# Save Customer Details
# =========================================================
@customer_bp.route("/save-customer-details", methods=["POST"])
def save_customer_details():

    try:

        data = request.get_json()

        customer_id = data.get("customer_id")
        customer_name = data.get("customer_name", "").strip()
        phone = data.get("phone", "").strip()

        # Validate customer ID
        if not customer_id:
            return jsonify({
                "status": "error",
                "message": "Customer ID is required"
            }), 400

        # Validate name
        if not customer_name:
            return jsonify({
                "status": "error",
                "message": "Customer name is required"
            }), 400

        # Validate phone
        if not phone.isdigit() or len(phone) != 10:
            return jsonify({
                "status": "error",
                "message": "Phone number must be exactly 10 digits"
            }), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Check whether customer details already exist
        cursor.execute(
            """
            SELECT customer_id
            FROM customers
            WHERE customer_id=%s
            """,
            (customer_id,)
        )

        existing_customer = cursor.fetchone()

        if existing_customer:

            # Update existing customer
            cursor.execute(
                """
                UPDATE customers
                SET customer_name=%s,
                    phone=%s
                WHERE customer_id=%s
                """,
                (
                    customer_name,
                    phone,
                    customer_id
                )
            )

        else:

            # Insert new customer
            cursor.execute(
                """
                INSERT INTO customers
                (
                    customer_id,
                    customer_name,
                    phone
                )
                VALUES
                (
                    %s,
                    %s,
                    %s
                )
                """,
                (
                    customer_id,
                    customer_name,
                    phone
                )
            )

        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            "status": "success",
            "message": "Customer details saved successfully"
        })

    except Exception as e:

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500