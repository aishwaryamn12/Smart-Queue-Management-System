from flask import Blueprint, request, jsonify
from database import get_db_connection

queue_bp = Blueprint("queue", __name__)


# =========================================================
# SERVICE COUNTER MAPPING
# =========================================================

SERVICE_COUNTERS = {
    1: 1,  # Cash Deposit
    2: 2,  # Cash Withdrawal
    3: 3,  # Account Opening
    4: 4,  # Loan Inquiry
    5: 5,  # Passbook Update
}


# =========================================================
# TOKEN PREFIX MAPPING
# =========================================================

SERVICE_PREFIXES = {
    1: "D",  # Cash Deposit
    2: "W",  # Cash Withdrawal
    3: "A",  # Account Opening
    4: "L",  # Loan Inquiry
    5: "P",  # Passbook Update
}


# =========================================================
# REQUIRED DOCUMENTS
# =========================================================

SERVICE_DOCUMENTS = {
    1: "Passbook, Valid ID, Deposit Slip",
    2: "Passbook, Valid ID, Withdrawal Slip",
    3: "Valid ID, Address Proof, Passport Photo",
    4: "Valid ID, Income Proof, Loan Documents",
    5: "Passbook, Valid ID",
}


# =========================================================
# GENERATE TOKEN
# =========================================================

@queue_bp.route("/generate-token", methods=["POST"])
def generate_token():

    connection = None
    cursor = None

    try:

        data = request.get_json()

        customer_id = data.get("customer_id")
        customer_name = data.get("customer_name", "").strip()
        phone = data.get("phone", "").strip()
        email = data.get("email", "").strip()
        service_id = data.get("service_id")

        # -------------------------------------------------
        # Validation
        # -------------------------------------------------

        if not customer_id:
            return jsonify({
                "status": "error",
                "message": "Customer ID is required"
            }), 400

        if not customer_name:
            return jsonify({
                "status": "error",
                "message": "Customer name is required"
            }), 400

        if not phone or not phone.isdigit() or len(phone) != 10:
            return jsonify({
                "status": "error",
                "message": "Phone number must be exactly 10 digits"
            }), 400

        if not email:
            return jsonify({
                "status": "error",
                "message": "Email is required"
            }), 400

        if not service_id:
            return jsonify({
                "status": "error",
                "message": "Please select a service"
            }), 400

        service_id = int(service_id)

        if service_id not in SERVICE_COUNTERS:
            return jsonify({
                "status": "error",
                "message": "Invalid banking service"
            }), 400

        # -------------------------------------------------
        # Database connection
        # -------------------------------------------------

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # -------------------------------------------------
        # Check customer login exists
        # -------------------------------------------------

        cursor.execute(
            """
            SELECT customer_id, email
            FROM customer_login
            WHERE customer_id = %s
            """,
            (customer_id,)
        )

        login_customer = cursor.fetchone()

        if not login_customer:
            return jsonify({
                "status": "error",
                "message": "Customer account not found. Please login again."
            }), 404

        # -------------------------------------------------
        # Save / update customer details
        # -------------------------------------------------

        cursor.execute(
            """
            SELECT customer_id
            FROM customers
            WHERE customer_id = %s
            """,
            (customer_id,)
        )

        existing_customer = cursor.fetchone()

        if existing_customer:

            cursor.execute(
                """
                UPDATE customers
                SET customer_name = %s,
                    phone = %s,
                    email = %s
                WHERE customer_id = %s
                """,
                (
                    customer_name,
                    phone,
                    email,
                    customer_id
                )
            )

        else:

            cursor.execute(
                """
                INSERT INTO customers
                (
                    customer_id,
                    customer_name,
                    phone,
                    email
                )
                VALUES (%s, %s, %s, %s)
                """,
                (
                    customer_id,
                    customer_name,
                    phone,
                    email
                )
            )

        # -------------------------------------------------
        # Get service information
        # -------------------------------------------------

        cursor.execute(
            """
            SELECT
                service_id,
                service_name,
                average_time
            FROM services
            WHERE service_id = %s
            """,
            (service_id,)
        )

        service = cursor.fetchone()

        if not service:
            connection.rollback()

            return jsonify({
                "status": "error",
                "message": "Banking service not found"
            }), 404

        average_time = int(service["average_time"])

        # -------------------------------------------------
        # Generate next token number
        # -------------------------------------------------

        prefix = SERVICE_PREFIXES[service_id]

        cursor.execute(
            """
            SELECT
                COALESCE(
                    MAX(
                        CAST(
                            SUBSTRING(token_no, 2)
                            AS UNSIGNED
                        )
                    ),
                    0
                ) AS last_number
            FROM queue
            WHERE service_id = %s
            """,
            (service_id,)
        )

        token_data = cursor.fetchone()

        last_number = int(token_data["last_number"] or 0)

        next_number = last_number + 1

        token_no = f"{prefix}{next_number:03d}"

        # -------------------------------------------------
        # Find current active customers
        # -------------------------------------------------

        cursor.execute(
            """
            SELECT COUNT(*) AS active_count
            FROM queue
            WHERE service_id = %s
            AND queue_status IN ('Waiting', 'Serving')
            """,
            (service_id,)
        )

        active_data = cursor.fetchone()

        active_count = int(
            active_data["active_count"] or 0
        )

        # -------------------------------------------------
        # Calculate estimated waiting time
        # -------------------------------------------------

        waiting_time = active_count * average_time

        # -------------------------------------------------
        # Get counter
        # -------------------------------------------------

        counter_no = SERVICE_COUNTERS[service_id]

        # -------------------------------------------------
        # Insert queue record
        # -------------------------------------------------

        cursor.execute(
            """
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
            (
                %s,
                %s,
                %s,
                %s,
                'Waiting',
                %s
            )
            """,
            (
                token_no,
                customer_id,
                service_id,
                counter_no,
                waiting_time
            )
        )

        connection.commit()

        # -------------------------------------------------
        # Response
        # -------------------------------------------------

        return jsonify({
            "status": "success",
            "message": "Token generated successfully",
            "token_no": token_no,
            "customer_id": customer_id,
            "customer_name": customer_name,
            "phone": phone,
            "email": email,
            "service_id": service_id,
            "service_name": service["service_name"],
            "counter_no": counter_no,
            "queue_status": "Waiting",
            "waiting_time": waiting_time,
            "required_documents": SERVICE_DOCUMENTS[service_id]
        }), 201

    except Exception as e:

        if connection:
            connection.rollback()

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =========================================================
# GET TOKEN STATUS
# =========================================================

@queue_bp.route("/queue-status/<token_no>", methods=["GET"])
def queue_status(token_no):

    connection = None
    cursor = None

    try:

        connection = get_db_connection()

        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                q.token_no,
                q.customer_id,
                c.customer_name,
                c.phone,
                c.email,
                q.service_id,
                s.service_name,
                q.counter_no,
                q.queue_status,
                q.waiting_time,
                q.created_at
            FROM queue q

            INNER JOIN customers c
                ON q.customer_id = c.customer_id

            INNER JOIN services s
                ON q.service_id = s.service_id

            WHERE q.token_no = %s
            """,
            (token_no.upper(),)
        )

        queue_data = cursor.fetchone()

        if not queue_data:

            return jsonify({
                "status": "error",
                "message": "Token not found"
            }), 404

        service_id = int(queue_data["service_id"])

        return jsonify({
            "status": "success",
            "token_no": queue_data["token_no"],
            "customer_id": queue_data["customer_id"],
            "customer_name": queue_data["customer_name"],
            "phone": queue_data["phone"],
            "email": queue_data["email"],
            "service_id": service_id,
            "service_name": queue_data["service_name"],
            "counter_no": queue_data["counter_no"],
            "queue_status": queue_data["queue_status"],
            "waiting_time": queue_data["waiting_time"],
            "required_documents": SERVICE_DOCUMENTS.get(
                service_id,
                "Valid ID"
            ),
            "created_at": queue_data["created_at"].isoformat()
            if queue_data["created_at"]
            else None
        }), 200

    except Exception as e:

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()