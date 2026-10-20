import json

from flask import Blueprint, request, jsonify
from database import get_db_connection


notification_bp = Blueprint(
    "notification",
    __name__
)


@notification_bp.route(
    "/save-notification-token",
    methods=["POST"]
)
def save_notification_token():

    connection = None
    cursor = None

    try:

        # -----------------------------------------
        # Read request body
        # -----------------------------------------

        raw_data = request.get_data(
            as_text=True
        )

        if not raw_data:
            return jsonify({
                "status": "error",
                "message": "Request data is empty"
            }), 400

        data = json.loads(raw_data)

        customer_id = data.get(
            "customer_id"
        )

        token = data.get(
            "token"
        )


        # -----------------------------------------
        # Validate customer
        # -----------------------------------------

        if not customer_id:
            return jsonify({
                "status": "error",
                "message":
                    "Customer ID is required"
            }), 400


        # -----------------------------------------
        # Validate token
        # -----------------------------------------

        if not token:
            return jsonify({
                "status": "error",
                "message":
                    "FCM token is required"
            }), 400


        # -----------------------------------------
        # Database
        # -----------------------------------------

        connection = get_db_connection()

        cursor = connection.cursor(
            dictionary=True
        )


        # -----------------------------------------
        # Check customer
        # -----------------------------------------

        cursor.execute(
            """
            SELECT customer_id
            FROM customer_login
            WHERE customer_id = %s
            """,
            (customer_id,)
        )

        customer = cursor.fetchone()


        if not customer:

            return jsonify({
                "status": "error",
                "message":
                    "Customer not found"
            }), 404


        # -----------------------------------------
        # Check existing token
        # -----------------------------------------

        cursor.execute(
            """
            SELECT id
            FROM notification_tokens
            WHERE customer_id = %s
            AND token = %s
            """,
            (
                customer_id,
                token
            )
        )

        existing_token = cursor.fetchone()


        # -----------------------------------------
        # Update existing token
        # -----------------------------------------

        if existing_token:

            cursor.execute(
                """
                UPDATE notification_tokens
                SET updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                """,
                (
                    existing_token["id"],
                )
            )


        # -----------------------------------------
        # Insert new token
        # -----------------------------------------

        else:

            cursor.execute(
                """
                INSERT INTO notification_tokens
                (
                    customer_id,
                    token
                )
                VALUES
                (
                    %s,
                    %s
                )
                """,
                (
                    customer_id,
                    token
                )
            )


        connection.commit()


        print(
            "FCM token saved for customer:",
            customer_id
        )


        return jsonify({
            "status": "success",
            "message":
                "Notification token saved successfully"
        }), 200


    except json.JSONDecodeError:

        return jsonify({
            "status": "error",
            "message":
                "Invalid notification data"
        }), 400


    except Exception as e:

        if connection:
            connection.rollback()

        print(
            "Notification token error:",
            e
        )

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()