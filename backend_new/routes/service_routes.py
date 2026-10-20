from flask import Blueprint, jsonify
from database import get_db_connection

service_bp = Blueprint("service", __name__)


@service_bp.route("/services", methods=["GET"])
def get_services():

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                service_id,
                service_name,
                average_time
            FROM services
            ORDER BY service_id
        """)

        services = cursor.fetchall()

        cursor.close()
        connection.close()

        return jsonify({
            "status": "success",
            "services": services
        }), 200

    except Exception as e:

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500