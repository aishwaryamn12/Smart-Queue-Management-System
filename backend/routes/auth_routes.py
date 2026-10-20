from flask import Blueprint, request, jsonify
from database import get_db_connection

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():

    try:
        data = request.get_json()

        email = data.get("email", "").strip()
        password = data.get("password", "")
        confirm_password = data.get("confirm_password", "")

        # Check empty fields
        if not email or not password or not confirm_password:
            return jsonify({
                "status": "error",
                "message": "All fields are required"
            }), 400

        # Check password
        if password != confirm_password:
            return jsonify({
                "status": "error",
                "message": "Passwords do not match"
            }), 400

        # Connect database
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Check existing email
        cursor.execute(
            """
            SELECT customer_id
            FROM customer_login
            WHERE email = %s
            """,
            (email,)
        )

        existing_user = cursor.fetchone()

        if existing_user:

            cursor.close()
            connection.close()

            return jsonify({
                "status": "error",
                "message": "Email already registered"
            }), 400

        # Insert customer
        cursor.execute(
            """
            INSERT INTO customer_login
            (email, password)
            VALUES (%s, %s)
            """,
            (email, password)
        )

        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({
            "status": "success",
            "message": "Registration successful"
        }), 201

    except Exception as e:

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500