from flask import Blueprint, request, jsonify
from database import get_db_connection

customer_bp = Blueprint("customer", __name__)


@customer_bp.route("/save-customer-details", methods=["POST"])
def save_customer_details():

    try:
        data = request.get_json()

        customer_id = data.get("customer_id")
        customer_name = data.get("customer_name", "").strip()
        phone = data.get("phone", "").strip()
        email = data.get("email", "").strip()

        # Check required fields
        if not customer_id or not customer_name or not phone or not email:
            return jsonify({
                "status": "error",
                "message": "All fields are required"
            }), 400

        # Phone must contain exactly 10 digits
        if not phone.isdigit() or len(phone) != 10:
            return jsonify({
                "status": "error",
                "message": "Phone number must be exactly 10 digits"
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor()

        # Insert customer details
        # If details already exist, update them
        cursor.execute(
            """
            INSERT INTO customers
            (customer_id, customer_name, phone, email)
            VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                customer_name = VALUES(customer_name),
                phone = VALUES(phone),
                email = VALUES(email)
            """,
            (customer_id, customer_name, phone, email)
        )

        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({
            "status": "success",
            "message": "Customer details saved successfully",
            "customer_id": customer_id
        }), 200

    except Exception as e:

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500