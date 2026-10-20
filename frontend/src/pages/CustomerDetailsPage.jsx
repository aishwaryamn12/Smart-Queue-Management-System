import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap-icons/font/bootstrap-icons.css";

function CustomerDetailsPage() {
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [services, setServices] = useState([]);

  // Load banking services
  useEffect(() => {
    const loadServices = async () => {
      try {
        const res = await axios.get(
          "http://127.0.0.1:5000/services"
        );

        setServices(res.data.services);

      } catch (error) {
        console.error("Service loading error:", error);

        alert(
          "Unable to load banking services. Please check the backend."
        );
      }
    };

    loadServices();
  }, []);

  // Save customer details
  const handleContinue = async () => {

    // Customer name validation
    if (customerName.trim() === "") {
      alert("Please enter your name.");
      return;
    }

    // Phone validation
    const phonePattern = /^[0-9]{10}$/;

    if (!phonePattern.test(phone)) {
      alert("Phone number must be exactly 10 digits.");
      return;
    }

    // Service validation
    if (serviceId === "") {
      alert("Please select a banking service.");
      return;
    }

    // Get logged-in customer
    const customerId = localStorage.getItem("customer_id");
    const email = localStorage.getItem("customer_email");

    if (!customerId) {
      alert("Please login again.");
      navigate("/customer-login");
      return;
    }

    try {

      const res = await axios.post(
        "http://127.0.0.1:5000/save-customer-details",
        {
          customer_id: customerId,
          customer_name: customerName.trim(),
          phone: phone,
          email: email,
        }
      );

      if (res.data.status === "success") {

        alert("Customer details saved successfully.");

        // Go to token generation page
        navigate("/customer", {
          state: {
            customerId: customerId,
            customerName: customerName.trim(),
            phone: phone,
            serviceId: serviceId,
          },
        });

      } else {

        alert(
          res.data.message ||
          "Unable to save customer details."
        );

      }

    } catch (error) {

      console.error("Customer details error:", error);

      if (error.response) {

        alert(
          error.response.data.message ||
          "Unable to save customer details."
        );

      } else {

        alert(
          "Backend connection failed. Please check the backend."
        );

      }
    }
  };

  return (
    <div
      className="container-fluid"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg,#0d6efd,#20c997)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >

      <div
        className="card shadow-lg p-5"
        style={{
          width: "500px",
          borderRadius: "20px",
        }}
      >

        {/* Header */}
        <div className="text-center mb-4">

          <i
            className="bi bi-person-vcard-fill"
            style={{
              fontSize: "60px",
              color: "#0d6efd",
            }}
          ></i>

          <h2 className="mt-3">
            Customer Details
          </h2>

          <p className="text-muted">
            Enter your details to generate your queue token.
          </p>

        </div>

        {/* Customer Name */}
        <div className="mb-3">

          <label className="form-label fw-bold">

            <i className="bi bi-person-fill"></i>{" "}
            Customer Name

          </label>

          <input
            type="text"
            className="form-control"
            placeholder="Enter your full name"
            value={customerName}
            onChange={(e) =>
              setCustomerName(e.target.value)
            }
          />

        </div>

        {/* Phone Number */}
        <div className="mb-3">

          <label className="form-label fw-bold">

            <i className="bi bi-telephone-fill"></i>{" "}
            Phone Number

          </label>

          <input
            type="text"
            className="form-control"
            placeholder="Enter 10-digit phone number"
            value={phone}
            maxLength="10"
            inputMode="numeric"
            onChange={(e) => {

              const value = e.target.value;

              if (/^[0-9]*$/.test(value)) {
                setPhone(value);
              }

            }}
          />

          <small className="text-muted">
            Enter exactly 10 digits.
          </small>

        </div>

        {/* Banking Service */}
        <div className="mb-4">

          <label className="form-label fw-bold">

            <i className="bi bi-bank2"></i>{" "}
            Banking Service

          </label>

          <select
            className="form-select"
            value={serviceId}
            onChange={(e) =>
              setServiceId(e.target.value)
            }
          >

            <option value="">
              Select Banking Service
            </option>

            {services.map((service) => (

              <option
                key={service.service_id}
                value={service.service_id}
              >
                {service.service_name}
              </option>

            ))}

          </select>

        </div>

        {/* Continue Button */}
        <button
          className="btn btn-primary w-100"
          onClick={handleContinue}
        >

          <i className="bi bi-arrow-right-circle-fill"></i>{" "}
          Continue to Generate Token

        </button>

        {/* Logout */}
        <div className="text-center mt-4">

          <button
            className="btn btn-link text-danger"
            onClick={() => {

              localStorage.removeItem("customer_id");
              localStorage.removeItem("customer_email");

              navigate("/customer-login");

            }}
          >
            Logout
          </button>

        </div>

      </div>

    </div>
  );
}

export default CustomerDetailsPage;