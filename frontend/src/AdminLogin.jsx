import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./AdminLogin.css";

const API_URL = "http://127.0.0.1:5000";

function AdminLogin() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();

        setError("");

        if (!email || !password) {
            setError("Please enter email and password");
            return;
        }

        try {
            setLoading(true);

            const response = await axios.post(
                `${API_URL}/admin-login`,
                {
                    email: email,
                    password: password
                }
            );

            if (response.data.status === "success") {

                localStorage.setItem(
                    "admin",
                    JSON.stringify(response.data.admin)
                );

                navigate("/admin-dashboard");
            }

        } catch (error) {

            if (error.response) {
                setError(
                    error.response.data.message ||
                    "Invalid admin email or password"
                );
            } else {
                setError(
                    "Cannot connect to the backend"
                );
            }

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-page">

            {/* LEFT PANEL */}

            <div className="admin-login-left">

                <div className="admin-login-brand">

                    <div className="admin-brand-logo">
                        <i className="bi bi-bank2"></i>
                    </div>

                    <div>
                        <h3>Smart Queue</h3>
                        <span>Management System</span>
                    </div>

                </div>


                <div className="admin-welcome">

                    <div className="admin-shield">
                        <i className="bi bi-shield-lock-fill"></i>
                    </div>

                    <span className="admin-label">
                        ADMINISTRATOR ACCESS
                    </span>

                    <h1>
                        Manage the queue.
                        <br />
                        <strong>Serve smarter.</strong>
                    </h1>

                    <p>
                        Access the administration dashboard to monitor
                        customers, manage the queue and keep banking
                        services running smoothly.
                    </p>


                    <div className="admin-features">

                        <div className="admin-feature">
                            <div className="feature-icon">
                                <i className="bi bi-activity"></i>
                            </div>

                            <div>
                                <strong>Real-time Monitoring</strong>
                                <span>
                                    Track the queue as it changes
                                </span>
                            </div>
                        </div>


                        <div className="admin-feature">
                            <div className="feature-icon">
                                <i className="bi bi-people-fill"></i>
                            </div>

                            <div>
                                <strong>Customer Management</strong>
                                <span>
                                    Manage customer service efficiently
                                </span>
                            </div>
                        </div>


                        <div className="admin-feature">
                            <div className="feature-icon">
                                <i className="bi bi-bar-chart-fill"></i>
                            </div>

                            <div>
                                <strong>Queue Analytics</strong>
                                <span>
                                    View queue statistics and insights
                                </span>
                            </div>
                        </div>

                    </div>

                </div>


                <div className="admin-left-footer">
                    <i className="bi bi-shield-check"></i>
                    Secure Administration Portal
                </div>

            </div>


            {/* RIGHT PANEL */}

            <div className="admin-login-right">

                <div className="admin-login-card">

                    {/* TOP ICON */}

                    <div className="login-icon-wrapper">
                        <div className="login-icon">
                            <i className="bi bi-person-lock"></i>
                        </div>
                    </div>


                    {/* TITLE */}

                    <div className="login-heading">

                        <span>WELCOME BACK</span>

                        <h2>Admin Login</h2>

                        <p>
                            Sign in to access your administration dashboard.
                        </p>

                    </div>


                    {/* ERROR */}

                    {error && (
                        <div className="admin-error">

                            <i className="bi bi-exclamation-circle-fill"></i>

                            <span>{error}</span>

                        </div>
                    )}


                    {/* FORM */}

                    <form onSubmit={handleLogin}>

                        {/* EMAIL */}

                        <div className="admin-input-group">

                            <label>
                                Admin Email
                            </label>

                            <div className="admin-input-wrapper">

                                <i className="bi bi-envelope"></i>

                                <input
                                    type="email"
                                    placeholder="Enter admin email"
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(e.target.value)
                                    }
                                />

                            </div>

                        </div>


                        {/* PASSWORD */}

                        <div className="admin-input-group">

                            <div className="password-label-row">

                                <label>
                                    Password
                                </label>

                                <span>
                                    Secure access
                                </span>

                            </div>

                            <div className="admin-input-wrapper">

                                <i className="bi bi-lock"></i>

                                <input
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    placeholder="Enter password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                />

                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                >
                                    <i
                                        className={
                                            showPassword
                                                ? "bi bi-eye-slash"
                                                : "bi bi-eye"
                                        }
                                    ></i>
                                </button>

                            </div>

                        </div>


                        {/* LOGIN BUTTON */}

                        <button
                            type="submit"
                            className="admin-login-button"
                            disabled={loading}
                        >

                            {loading ? (
                                <>
                                    <span className="login-spinner"></span>
                                    Logging in...
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <i className="bi bi-arrow-right"></i>
                                </>
                            )}

                        </button>

                    </form>


                    {/* SECURITY */}

                    <div className="security-box">

                        <div className="security-icon">
                            <i className="bi bi-shield-check"></i>
                        </div>

                        <div>
                            <strong>Secure Login</strong>

                            <p>
                                Your administrator credentials are
                                protected by the system.
                            </p>
                        </div>

                    </div>


                    {/* BACK HOME */}

                    <button
                        className="back-home-button"
                        onClick={() => navigate("/")}
                    >
                        <i className="bi bi-arrow-left"></i>
                        Back to Home
                    </button>


                    <div className="login-copyright">
                        © 2026 Smart Queue Management System
                    </div>

                </div>

            </div>

        </div>
    );
}

export default AdminLogin;