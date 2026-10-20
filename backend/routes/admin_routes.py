from flask import Blueprint, request, jsonify
from database import get_db_connection


admin_bp = Blueprint("admin", __name__)


@admin_bp.route("/admin-login", methods=["POST"])
def admin_login():

    try:

        data = request.get_json()

        email = data.get("email", "").strip()
        password = data.get("password", "")

        if not email or not password:

            return jsonify({
                "status": "error",
                "message": "Email and password are required"
            }), 400

        connection = get_db_connection()

        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                admin_id,
                admin_name,
                email,
                counter_no,
                service_id
            FROM admins
            WHERE email = %s
            AND password = %s
        """, (email, password))

        admin = cursor.fetchone()

        cursor.close()
        connection.close()

        if not admin:

            return jsonify({
                "status": "error",
                "message": "Invalid admin email or password"
            }), 401

        return jsonify({
            "status": "success",
            "message": "Admin login successful",
            "admin": admin
        }), 200

    except Exception as e:

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500