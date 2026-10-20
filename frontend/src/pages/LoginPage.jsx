import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    alert("Login button clicked");

    try {
      const response = await axios.post(
        " https://gusto-glider-shrouded.ngrok-free.dev/login",
        {
          username: username,
          password: password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      alert("Response: " + JSON.stringify(response.data));

      if (response.data.status === "success") {
        alert("Login Successful");
        navigate("/admin");
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.log("Full Error:", error);
      console.log("Response:", error.response);
      console.log("Message:", error.message);

      if (error.response) {
        alert("Status : " + error.response.status);
      } else {
        alert("Message : " + error.message);
      }
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "500px" }}>
      <h2 className="text-center mb-4">Admin Login</h2>

      <input
        type="text"
        className="form-control mb-3"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <input
        type="password"
        className="form-control mb-3"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        type="button"
        className="btn btn-primary w-100"
        onClick={login}
      >
        Login
      </button>
    </div>
  );
}

export default LoginPage;