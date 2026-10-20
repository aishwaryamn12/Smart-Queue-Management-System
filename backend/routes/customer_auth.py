from flask import Blueprint, request, jsonify
from database import get_db_connection

customer_auth = Blueprint("customer_auth", __name__)


# =========================================================
# Customer Registration
# Email + Password + Confirm Password
# =========================================================
@customer_auth.route("/register", methods=["POST"])
def register():

    try:

        data = request.get_json()

        email = data.get("email", "").strip()
        password = data.get("password", "")
        confirm_password = data.get("confirm_password", "")

        # Check required fields
        if not email or not password or not confirm_password:
            return jsonify({
                "message": "Email, Password and Confirm Password are required"
            }), 400

        # Check password match
        if password != confirm_password:
            return jsonify({
                "message": "Passwords do not match"
            }), 400

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Check email
        cursor.execute(
            """
            SELECT customer_id
            FROM customer_login
            WHERE email=%s
            """,
            (email,)
        )

        existing_customer = cursor.fetchone()

        if existing_customer:

            cursor.close()
            conn.close()

            return jsonify({
                "message": "Email already registered"
            }), 400

        # Create login account
        cursor.execute(
            """
            INSERT INTO customer_login
            (
                email,
                password
            )
            VALUES
            (
                %s,
                %s
            )
            """,
            (
                email,
                password
            )
        )

        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            "message": "Registration Successful"
        }), 201

    except Exception as e:

        return jsonify({
            "message": "Registration failed",
            "error": str(e)
        }), 500


# =========================================================
# Customer Login
# Email + Password
# =========================================================
@customer_auth.route("/customer-login", methods=["POST"])
def customer_login():

    try:

        data = request.get_json()

        email = data.get("email", "").strip()
        password = data.get("password", "")

        if not email or not password:

            return jsonify({
                "message": "Email and Password are required"
            }), 400

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                customer_id,
                email
            FROM customer_login
            WHERE email=%s
            AND password=%s
            """,
            (
                email,
                password
            )
        )

        customer = cursor.fetchone()

        cursor.close()
        conn.close()

        if customer:

            return jsonify({
                "message": "Login Successful",
                "customer_id": customer["customer_id"],
                "email": customer["email"]
            })

        return jsonify({
            "message": "Invalid Email or Password"
        }), 401

    except Exception as e:

        return jsonify({
            "message": "Login failed",
            "error": str(e)
        }), 500


# =========================================================
# Forgot Password
# Email Only
# =========================================================
@customer_auth.route("/forgot-password", methods=["POST"])
def forgot_password():

    try:

        data = request.get_json()

        email = data.get("email", "").strip()
        new_password = data.get("password", "")
        confirm_password = data.get("confirm_password", "")

        if not email or not new_password or not confirm_password:

            return jsonify({
                "message": "Email, Password and Confirm Password are required"
            }), 400

        if new_password != confirm_password:

            return jsonify({
                "message": "Passwords do not match"
            }), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            UPDATE customer_login
            SET password=%s
            WHERE email=%s
            """,
            (
                new_password,
                email
            )
        )

        conn.commit()

        if cursor.rowcount == 0:

            cursor.close()
            conn.close()

            return jsonify({
                "message": "Email not registered"
            }), 404

        cursor.close()
        conn.close()

        return jsonify({
            "message": "Password Updated Successfully"
        })

    except Exception as e:

        return jsonify({
            "message": "Password update failed",
            "error": str(e)
        }), 500