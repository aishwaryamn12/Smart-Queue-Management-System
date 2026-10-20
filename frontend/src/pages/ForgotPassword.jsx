import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap-icons/font/bootstrap-icons.css";

function ForgotPassword() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const resetPassword = async () => {

    if (email === "" || phone === "" || newPassword === "") {
      alert("Please fill all fields");
      return;
    }

    try {

      const res = await axios.post(
        " https://gusto-glider-shrouded.ngrok-free.dev/forgot-password",
        {
          email,
          phone,
          password: newPassword,
        }
      );

      alert(res.data.message);

      navigate("/customer-login");

    } catch (err) {

      if (err.response) {
        alert(err.response.data.message);
      } else {
        alert("Password Reset Failed");
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
            className="bi bi-key-fill"
            style={{
              fontSize: "60px",
              color: "#ffc107",
            }}
          ></i>

          <h2 className="mt-3">
            Forgot Password
          </h2>

          <p className="text-muted">
            Reset your account password
          </p>

        </div>

        <div className="mb-3">

          <label className="form-label">
            <i className="bi bi-envelope-fill"></i> Email
          </label>

          <input
            type="email"
            className="form-control"
            placeholder="Enter Gmail"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
          />

        </div>

        <div className="mb-3">

          <label className="form-label">
            <i className="bi bi-telephone-fill"></i> Phone Number
          </label>

          <input
            type="text"
            className="form-control"
            placeholder="Enter Phone Number"
            value={phone}
            onChange={(e)=>setPhone(e.target.value)}
          />

        </div>

        <div className="mb-4">

          <label className="form-label">
            <i className="bi bi-lock-fill"></i> New Password
          </label>

          <input
            type="password"
            className="form-control"
            placeholder="Enter New Password"
            value={newPassword}
            onChange={(e)=>setNewPassword(e.target.value)}
          />

        </div>

        <button
          className="btn btn-warning w-100"
          onClick={resetPassword}
        >
          Reset Password
        </button>

        <div className="text-center mt-4">

          <Link to="/customer-login">
            Back to Login
          </Link>

          <br /><br />

          <Link to="/">
            ⬅ Back to Home
          </Link>

        </div>

      </div>

    </div>

  );

}

export default ForgotPassword;