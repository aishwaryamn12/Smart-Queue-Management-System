import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const API_URL = "http://127.0.0.1:5000";

function CustomerPage() {
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceId, setServiceId] = useState("");

  const [loadingServices, setLoadingServices] = useState(true);
  const [generatingToken, setGeneratingToken] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [notificationStatus, setNotificationStatus] = useState(
    "Notifications will be enabled when available."
  );

  // --------------------------------------------------
  // Load banking services
  // --------------------------------------------------
  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoadingServices(true);
      setErrorMessage("");

      const response = await axios.get(
        `${API_URL}/services`
      );

      if (
        response.data &&
        response.data.status === "success"
      ) {
        setServices(response.data.services || []);
      } else {
        setServices([]);
        setErrorMessage("Unable to load banking services.");
      }
    } catch (error) {
      console.error("Services error:", error);

      setServices([]);

      setErrorMessage(
        "Unable to connect to backend. Please make sure Flask is running."
      );
    } finally {
      setLoadingServices(false);
    }
  };

  // --------------------------------------------------
  // Generate token
  // --------------------------------------------------
  const generateToken = async () => {
    setErrorMessage("");

    const customerId =
      localStorage.getItem("customer_id");

    const customerEmail =
      localStorage.getItem("customer_email");

    // Check login
    if (!customerId || !customerEmail) {
      alert("Please login again.");
      navigate("/customer-login");
      return;
    }

    // Validate name
    if (customerName.trim() === "") {
      setErrorMessage("Please enter your name.");
      return;
    }

    // Validate phone
    if (!/^\d{10}$/.test(phone)) {
      setErrorMessage(
        "Phone number must be exactly 10 digits."
      );
      return;
    }

    // Validate service
    if (!serviceId) {
      setErrorMessage(
        "Please select a banking service."
      );
      return;
    }

    try {
      setGeneratingToken(true);

      const response = await axios.post(
        `${API_URL}/generate-token`,
        {
          customer_id: Number(customerId),
          customer_name: customerName.trim(),
          phone: phone,
          email: customerEmail,
          service_id: Number(serviceId),
        }
      );

      if (
        response.data &&
        response.data.status === "success"
      ) {
        const tokenNo =
          response.data.token_no;

        // Store token information
        localStorage.setItem(
          "queue_token",
          tokenNo
        );

        localStorage.setItem(
          "queue_service",
          response.data.service_name
        );

        localStorage.setItem(
          "queue_counter",
          response.data.counter_no
        );

        // Go to status page
        navigate(`/status/${tokenNo}`);
      } else {
        setErrorMessage(
          response.data?.message ||
          "Token generation failed."
        );
      }
    } catch (error) {
      console.error(
        "Generate token error:",
        error
      );

      if (error.response) {
        setErrorMessage(
          error.response.data?.message ||
          "Token generation failed."
        );
      } else {
        setErrorMessage(
          "Backend connection failed. Please check Flask."
        );
      }
    } finally {
      setGeneratingToken(false);
    }
  };

  // --------------------------------------------------
  // Logout
  // --------------------------------------------------
  const logout = () => {
    localStorage.removeItem("customer_id");
    localStorage.removeItem("customer_email");
    localStorage.removeItem("queue_token");
    localStorage.removeItem("queue_service");
    localStorage.removeItem("queue_counter");

    navigate("/customer-login");
  };

  // --------------------------------------------------
  // Phone input
  // --------------------------------------------------
  const handlePhoneChange = (event) => {
    const value = event.target.value;

    if (/^\d*$/.test(value) && value.length <= 10) {
      setPhone(value);
    }
  };

  return (
    <div
      className="container-fluid"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #eef5ff, #e8fff7)",
        padding: "30px 15px",
      }}
    >
      {/* Header */}
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold text-primary mb-1">
              <i className="bi bi-bank2"></i>{" "}
              Smart Queue Management
            </h2>

            <p className="text-muted mb-0">
              Generate your banking service token
            </p>
          </div>

          <button
            className="btn btn-outline-danger"
            onClick={logout}
          >
            <i className="bi bi-box-arrow-right"></i>{" "}
            Logout
          </button>
        </div>

        {/* Main Card */}
        <div className="row justify-content-center">
          <div className="col-lg-7 col-md-9">
            <div
              className="card shadow-lg border-0"
              style={{
                borderRadius: "20px",
              }}
            >
              <div className="card-body p-4 p-md-5">

                {/* Title */}
                <div className="text-center mb-4">
                  <div
                    className="rounded-circle bg-primary bg-opacity-10 d-inline-flex align-items-center justify-content-center"
                    style={{
                      width: "80px",
                      height: "80px",
                    }}
                  >
                    <i
                      className="bi bi-person-vcard text-primary"
                      style={{
                        fontSize: "40px",
                      }}
                    ></i>
                  </div>

                  <h3 className="fw-bold mt-3">
                    Customer Details
                  </h3>

                  <p className="text-muted">
                    Enter your details and select the
                    banking service.
                  </p>
                </div>

                {/* Error */}
                {errorMessage && (
                  <div
                    className="alert alert-danger"
                    role="alert"
                  >
                    <i className="bi bi-exclamation-triangle-fill"></i>{" "}
                    {errorMessage}
                  </div>
                )}

                {/* Customer Name */}
                <div className="mb-3">
                  <label className="form-label fw-bold">
                    <i className="bi bi-person-fill"></i>{" "}
                    Customer Name
                  </label>

                  <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="Enter your full name"
                    value={customerName}
                    onChange={(event) =>
                      setCustomerName(
                        event.target.value
                      )
                    }
                  />
                </div>

                {/* Phone */}
                <div className="mb-3">
                  <label className="form-label fw-bold">
                    <i className="bi bi-telephone-fill"></i>{" "}
                    Phone Number
                  </label>

                  <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="Enter 10 digit phone number"
                    value={phone}
                    onChange={handlePhoneChange}
                    maxLength={10}
                  />

                  <small className="text-muted">
                    {phone.length}/10 digits
                  </small>
                </div>

                {/* Service */}
                <div className="mb-4">
                  <label className="form-label fw-bold">
                    <i className="bi bi-list-check"></i>{" "}
                    Banking Service
                  </label>

                  <select
                    className="form-select form-select-lg"
                    value={serviceId}
                    onChange={(event) =>
                      setServiceId(
                        event.target.value
                      )
                    }
                    disabled={loadingServices}
                  >
                    <option value="">
                      {loadingServices
                        ? "Loading services..."
                        : "Choose Banking Service"}
                    </option>

                    {services.map((service) => (
                      <option
                        key={service.service_id}
                        value={service.service_id}
                      >
                        {service.service_name}{" "}
                        ({service.average_time} min)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Service Information */}
                {serviceId && (
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle-fill"></i>{" "}
                    <strong>
                      Selected Service:
                    </strong>{" "}
                    {
                      services.find(
                        (service) =>
                          String(
                            service.service_id
                          ) === String(serviceId)
                      )?.service_name
                    }
                  </div>
                )}

                {/* Generate Button */}
                <button
                  className="btn btn-primary btn-lg w-100"
                  onClick={generateToken}
                  disabled={generatingToken}
                >
                  {generatingToken ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      ></span>
                      Generating Token...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-ticket-perforated-fill"></i>{" "}
                      Generate Token
                    </>
                  )}
                </button>

                {/* Notification Status */}
                <div className="text-center mt-4">
                  <small className="text-muted">
                    <i className="bi bi-bell-fill"></i>{" "}
                    {notificationStatus}
                  </small>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Information */}
        <div className="row justify-content-center mt-4">
          <div className="col-lg-7 col-md-9">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h5 className="fw-bold">
                  <i className="bi bi-lightbulb-fill text-warning"></i>{" "}
                  How it works
                </h5>

                <div className="row text-center mt-3">

                  <div className="col-md-4 mb-3">
                    <i
                      className="bi bi-ticket-perforated text-primary"
                      style={{ fontSize: "30px" }}
                    ></i>

                    <p className="fw-bold mt-2 mb-1">
                      1. Generate Token
                    </p>

                    <small className="text-muted">
                      Select the required banking
                      service.
                    </small>
                  </div>

                  <div className="col-md-4 mb-3">
                    <i
                      className="bi bi-clock-history text-success"
                      style={{ fontSize: "30px" }}
                    ></i>

                    <p className="fw-bold mt-2 mb-1">
                      2. Track Waiting Time
                    </p>

                    <small className="text-muted">
                      See your live queue status.
                    </small>
                  </div>

                  <div className="col-md-4 mb-3">
                    <i
                      className="bi bi-bell text-danger"
                      style={{ fontSize: "30px" }}
                    ></i>

                    <p className="fw-bold mt-2 mb-1">
                      3. Get Notification
                    </p>

                    <small className="text-muted">
                      Receive a notification when
                      your turn approaches.
                    </small>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default CustomerPage;