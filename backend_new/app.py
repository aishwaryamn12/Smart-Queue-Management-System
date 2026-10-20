from flask import Flask, jsonify
from flask_cors import CORS

from routes.admin_routes import admin_bp
from routes.admin_queue_routes import admin_queue_bp
from routes.auth_routes import auth_bp
from routes.customer_routes import customer_bp
from routes.service_routes import service_bp
from routes.queue_routes import queue_bp
from routes.notification_routes import notification_bp

from services.queue_engine import start_queue_engine


app = Flask(__name__)


CORS(
    app,
    resources={
        r"/*": {
            "origins": [
                "http://localhost:5174",
                "http://127.0.0.1:5174",
                "http://localhost:5173",
                "http://127.0.0.1:5173"
            ]
        }
    },
    methods=[
        "GET",
        "POST",
        "PUT",
        "DELETE",
        "OPTIONS"
    ],
    allow_headers=[
        "Content-Type",
        "Authorization"
    ]
)


@app.route("/")
def home():
    return jsonify({
        "status": "success",
        "message": "Smart Queue Management System Backend is Running!"
    })


@app.route("/health")
def health():
    return jsonify({
        "status": "success",
        "message": "Backend is healthy"
    })


app.register_blueprint(admin_bp)
app.register_blueprint(admin_queue_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(customer_bp)
app.register_blueprint(service_bp)
app.register_blueprint(queue_bp)
app.register_blueprint(notification_bp)


if __name__ == "__main__":

    start_queue_engine()

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False,
        use_reloader=False
    )
