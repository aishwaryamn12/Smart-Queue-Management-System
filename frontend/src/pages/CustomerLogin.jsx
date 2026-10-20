import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./CustomerLogin.css";

const API_URL = "http://127.0.0.1:5000";

function CustomerLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!email.trim()) {
      alert("Please enter your email address.");
      return;
    }

    if (!password) {
      alert("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${API_URL}/customer-login`,
        {
          email: email.trim(),
          password: password
        }
      );

      if (response.data.status === "success") {

        localStorage.setItem(
          "customer_id",
          String(response.data.customer_id)
        );

        localStorage.setItem(
          "customer_email",
          response.data.email
        );

        localStorage.removeItem("queue_token");

        alert("Login successful");

        navigate("/customer");

      } else {
        alert(
          response.data.message ||
          "Login failed."
        );
      }

    } catch (error) {

      console.error("Login error:", error);

      if (error.response) {
        alert(
          error.response.data?.message ||
          "Invalid email or password."
        );
      } else {
        alert(
          "Cannot connect to backend. Make sure Flask is running."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="customer-login-page">

      {/* Background decoration */}
      <div className="login-glow login-glow-one"></div>
      <div className="login-glow login-glow-two"></div>

      <div className="customer-login-wrapper">

        {/* Left information section */}
        <div className="login-info">

          <div className="login-bank-icon">
            <i className="bi bi-bank2"></i>
          </div>

          <span className="login-small-title">
            SMART BANKING
          </span>

          <h1>
            Welcome Back
          </h1>

          <p>
            Login to your account and manage your
            banking queue without standing in a long line.
          </p>

          <div className="login-features">

            <div className="login-feature">
              <div className="login-feature-icon">
                <i className="bi bi-ticket-perforated"></i>
              </div>

              <div>
                <strong>Digital Token</strong>
                <span>Generate your queue token easily</span>
              </div>
            </div>

            <div className="login-feature">
              <div className="login-feature-icon">
                <i className="bi bi-clock-history"></i>
              </div>

              <div>
                <strong>Live Queue Tracking</strong>
                <span>Track your waiting time in real time</span>
              </div>
            </div>

            <div className="login-feature">
              <div className="login-feature-icon">
                <i className="bi bi-bell"></i>
              </div>

              <div>
                <strong>Turn Notification</strong>
                <span>Get notified when your turn arrives</span>
              </div>
            </div>

          </div>

        </div>


        {/* Login card */}
        <div className="customer-login-card">

          <div className="login-card-header">

            <div className="customer-login-icon">
              <i className="bi bi-person"></i>
            </div>

            <span className="login-card-label">
              CUSTOMER PORTAL
            </span>

            <h2>
              Customer Login
            </h2>

            <p>
              Sign in to continue
            </p>

          </div>


          {/* Email */}
          <div className="login-input-group">

            <label>
              <i className="bi bi-envelope-fill"></i>
              Email ID
            </label>

            <div className="login-input-wrapper">

              <i className="bi bi-envelope login-input-icon"></i>

              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />

            </div>

          </div>


          {/* Password */}
          <div className="login-input-group">

            <label>
              <i className="bi bi-lock-fill"></i>
              Password
            </label>

            <div className="login-input-wrapper">

              <i className="bi bi-lock login-input-icon"></i>

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
              />

            </div>

          </div>


          <div className="forgot-password">

            <Link to="/forgot-password">
              Forgot Password?
            </Link>

          </div>


          {/* Login button */}
          <button
            className="customer-login-button"
            onClick={login}
            disabled={loading}
          >

            {loading ? (
              <>
                <span className="login-spinner"></span>
                Logging in...
              </>
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right"></i>
                Login
                <i className="bi bi-arrow-right login-arrow"></i>
              </>
            )}

          </button>


          <div className="create-account">

            <span>
              Don't have an account?
            </span>

            <Link to="/register">
              Create Account
            </Link>

          </div>


          <div className="back-home">

            <Link to="/">
              <i className="bi bi-arrow-left"></i>
              Back to Home
            </Link>

          </div>


          <div className="secure-login">

            <i className="bi bi-shield-check"></i>

            <span>
              Secure customer login
            </span>

          </div>

        </div>

      </div>

    </div>
  );
}

export default CustomerLogin;