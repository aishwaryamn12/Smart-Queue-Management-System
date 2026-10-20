import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap-icons/font/bootstrap-icons.css";

function RegisterPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const register = async () => {
    const emailValue = email.trim();

    // Check that email is entered
    if (emailValue === "") {
      alert("Please enter your email address.");
      return;
    }

    // Accept Gmail, Yahoo, Outlook, college email, etc.
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(emailValue)) {
      alert("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      const res = await axios.post(
        "http://127.0.0.1:5000/register",
        {
          email: emailValue,
          password: password,
          confirm_password: confirmPassword,
        }
      );

      alert(res.data.message);

      navigate("/customer-login");

    } catch (err) {
      if (err.response) {
        alert(
          err.response.data.message ||
          "Registration Failed"
        );
      } else {
        alert(
          "Registration Failed. Please check the backend connection."
        );
      }
    }
  };

  return (
    <div
      className="container-fluid"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#0d6efd,#20c997)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        className="card shadow-lg p-5"
        style={{
          width: "450px",
          borderRadius: "20px",
        }}
      >

        <div className="text-center mb-4">

          <i
            className="bi bi-person-plus-fill"
            style={{
              fontSize: "60px",
              color: "#0d6efd",
            }}
          ></i>

          <h2 className="mt-3">
            Customer Registration
          </h2>

          <p className="text-muted">
            Create your account to generate queue tokens.
          </p>

        </div>

        {/* Email */}
        <div className="mb-3">

          <label className="form-label">
            <i className="bi bi-envelope-fill"></i>{" "}
            Email
          </label>

          <input
            type="email"
            className="form-control"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

        </div>

        {/* Password */}
        <div className="mb-3">

          <label className="form-label">
            <i className="bi bi-lock-fill"></i>{" "}
            Password
          </label>

          <input
            type="password"
            className="form-control"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

        </div>

        {/* Confirm Password */}
        <div className="mb-4">

          <label className="form-label">
            <i className="bi bi-lock-fill"></i>{" "}
            Confirm Password
          </label>

          <input
            type="password"
            className="form-control"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
          />

        </div>

        {/* Register */}
        <button
          className="btn btn-primary w-100"
          onClick={register}
        >
          Register
        </button>

        <div className="text-center mt-4">

          Already have an account?

          <br />

          <Link to="/customer-login">
            Login
          </Link>

          <br />
          <br />

          <Link to="/">
            ⬅ Back to Home
          </Link>

        </div>

      </div>
    </div>
  );
}

export default RegisterPage;