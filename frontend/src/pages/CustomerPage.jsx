import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap-icons/font/bootstrap-icons.css";
import { requestNotificationPermission } from "../firebaseNotifications";
import "./CustomerPage.css";

const API_URL = "http://127.0.0.1:5000";

function CustomerPage() {
  const navigate = useNavigate();

  const [services, setServices] = useState([]);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceId, setServiceId] = useState("");

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    loadServices();

    requestNotificationPermission();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/services`
      );

      if (response.data.status === "success") {
        setServices(
          response.data.services || []
        );
      } else {
        setError(
          "Unable to load banking services."
        );
      }

    } catch (error) {
      console.error(
        "Services error:",
        error
      );

      setError(
        "Backend connection failed."
      );

    } finally {
      setLoading(false);
    }
  };


  const handlePhone = (e) => {
    const value = e.target.value;

    if (
      /^\d*$/.test(value) &&
      value.length <= 10
    ) {
      setPhone(value);
    }
  };


  const generateToken = async () => {
    setError("");

    const customerId =
      localStorage.getItem("customer_id");

    const customerEmail =
      localStorage.getItem("customer_email");

    if (!customerId || !customerEmail) {
      alert(
        "Login session not found. Please login again."
      );

      navigate("/customer-login");

      return;
    }

    if (!customerName.trim()) {
      setError(
        "Please enter customer name."
      );

      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setError(
        "Phone number must be exactly 10 digits."
      );

      return;
    }

    if (!serviceId) {
      setError(
        "Please select a banking service."
      );

      return;
    }

    try {
      setGenerating(true);

      const response = await axios.post(
        `${API_URL}/generate-token`,
        {
          customer_id: Number(customerId),

          customer_name:
            customerName.trim(),

          phone: phone,

          email: customerEmail,

          service_id: Number(serviceId)
        }
      );

      if (
        response.data.status ===
        "success"
      ) {
        const token =
          response.data.token_no;

        localStorage.setItem(
          "queue_token",
          token
        );

        navigate(
          `/status/${token}`
        );

      } else {
        setError(
          response.data.message ||
          "Token generation failed."
        );
      }

    } catch (error) {
      console.error(
        "Token generation error:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Unable to generate token."
      );

    } finally {
      setGenerating(false);
    }
  };


  const logout = () => {
    localStorage.removeItem(
      "customer_id"
    );

    localStorage.removeItem(
      "customer_email"
    );

    localStorage.removeItem(
      "queue_token"
    );

    navigate("/customer-login");
  };


  return (
    <div className="customer-page">

      {/* Background decoration */}

      <div className="customer-bg-circle customer-bg-one"></div>
      <div className="customer-bg-circle customer-bg-two"></div>


      {/* Header */}

      <header className="customer-header">

        <div className="customer-brand">

          <div className="customer-brand-icon">
            <i className="bi bi-bank2"></i>
          </div>

          <div>
            <h1>
              Smart Queue
            </h1>

            <span>
              Management System
            </span>
          </div>

        </div>


        <button
          className="customer-logout"
          onClick={logout}
        >
          <i className="bi bi-box-arrow-right"></i>

          Logout
        </button>

      </header>


      {/* Main */}

      <main className="customer-main">

        <div className="customer-content">


          {/* Left information */}

          <section className="customer-intro">

            <span className="customer-badge">
              <i className="bi bi-stars"></i>
              SMART BANKING EXPERIENCE
            </span>

            <h2>
              Skip the queue.
              <br />

              <span>
                Save your time.
              </span>
            </h2>

            <p>
              Enter your details, choose the banking
              service you need, and get your digital
              queue token instantly.
            </p>


            <div className="customer-benefits">

              <div className="customer-benefit">

                <div className="benefit-icon">
                  <i className="bi bi-ticket-perforated"></i>
                </div>

                <div>
                  <strong>
                    Digital Token
                  </strong>

                  <span>
                    No need to stand in a physical queue
                  </span>
                </div>

              </div>


              <div className="customer-benefit">

                <div className="benefit-icon">
                  <i className="bi bi-clock-history"></i>
                </div>

                <div>
                  <strong>
                    Live Waiting Time
                  </strong>

                  <span>
                    Track your queue position in real time
                  </span>
                </div>

              </div>


              <div className="customer-benefit">

                <div className="benefit-icon">
                  <i className="bi bi-bell"></i>
                </div>

                <div>
                  <strong>
                    Turn Notification
                  </strong>

                  <span>
                    Get notified when your turn arrives
                  </span>
                </div>

              </div>

            </div>

          </section>


          {/* Form */}

          <section className="customer-form-card">

            <div className="form-card-top">

              <div className="form-title-icon">
                <i className="bi bi-person-vcard"></i>
              </div>

              <div>

                <span>
                  CUSTOMER DETAILS
                </span>

                <h3>
                  Get Your Queue Token
                </h3>

              </div>

            </div>


            <p className="form-description">
              Fill in your details and select the
              service you require.
            </p>


            {/* Error */}

            {error && (

              <div className="customer-error">

                <i className="bi bi-exclamation-triangle-fill"></i>

                <span>
                  {error}
                </span>

              </div>

            )}


            {/* Customer Name */}

            <div className="customer-field">

              <label>
                <i className="bi bi-person"></i>

                Customer Name
              </label>

              <div className="customer-input">

                <i className="bi bi-person-fill"></i>

                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={customerName}
                  onChange={(e) =>
                    setCustomerName(
                      e.target.value
                    )
                  }
                />

              </div>

            </div>


            {/* Phone */}

            <div className="customer-field">

              <label>
                <i className="bi bi-phone"></i>

                Phone Number
              </label>

              <div className="customer-input">

                <i className="bi bi-telephone-fill"></i>

                <input
                  type="text"
                  placeholder="Enter 10-digit phone number"
                  value={phone}
                  onChange={handlePhone}
                  maxLength={10}
                />

              </div>

              <div className="phone-counter">
                {phone.length}/10 digits
              </div>

            </div>


            {/* Service */}

            <div className="customer-field">

              <label>
                <i className="bi bi-building"></i>

                Banking Service
              </label>

              <div className="customer-input service-input">

                <i className="bi bi-list-check"></i>

                <select
                  value={serviceId}
                  onChange={(e) =>
                    setServiceId(
                      e.target.value
                    )
                  }
                  disabled={loading}
                >

                  <option value="">
                    {loading
                      ? "Loading services..."
                      : "Select Banking Service"}
                  </option>

                  {services.map(
                    (service) => (

                      <option
                        key={
                          service.service_id
                        }
                        value={
                          service.service_id
                        }
                      >
                        {service.service_name}
                        {" - "}
                        {service.average_time}
                        {" minutes"}
                      </option>

                    )
                  )}

                </select>

              </div>

            </div>


            {/* Generate */}

            <button
              className="generate-token-button"
              onClick={generateToken}
              disabled={generating}
            >

              {generating ? (
                <>
                  <span className="token-spinner"></span>

                  Generating Token...
                </>
              ) : (
                <>
                  <i className="bi bi-ticket-perforated-fill"></i>

                  Generate My Token

                  <i className="bi bi-arrow-right token-arrow"></i>
                </>
              )}

            </button>


            <div className="secure-note">

              <i className="bi bi-shield-check"></i>

              Your information is securely processed

            </div>

          </section>

        </div>

      </main>


      {/* Footer */}

      <footer className="customer-footer">

        <i className="bi bi-bank2"></i>

        Smart Queue Management System

        <span>
          • Smart Banking Experience
        </span>

      </footer>

    </div>
  );
}

export default CustomerPage;