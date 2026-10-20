import { useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./HomePage.css";

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home-page">

      {/* Background Decorations */}
      <div className="background-circle circle-one"></div>
      <div className="background-circle circle-two"></div>
      <div className="background-circle circle-three"></div>

      <div className="home-container">

        {/* ================= HEADER ================= */}

        <div className="home-header">

          <div className="bank-icon">
            <i className="bi bi-bank2"></i>
          </div>

          <div>
            <h1>Smart Queue</h1>
            <h2>Management System</h2>
          </div>

        </div>

        <p className="home-subtitle">
          Smart banking. Less waiting. Better service.
        </p>


        {/* ================= MAIN CONTENT ================= */}

        <div className="portal-section">

          {/* CUSTOMER CARD */}

          <div className="portal-card customer-card">

            <div className="portal-icon customer-icon">
              <i className="bi bi-person"></i>
            </div>

            <span className="portal-label">
              CUSTOMER PORTAL
            </span>

            <h3>
              Welcome, Customer
            </h3>

            <p>
              Join the queue digitally, generate your token,
              and track your waiting time in real time.
            </p>


            <div className="feature-list">

              <div>
                <i className="bi bi-ticket-perforated"></i>
                <span>Digital Token</span>
              </div>

              <div>
                <i className="bi bi-clock-history"></i>
                <span>Live Waiting Time</span>
              </div>

              <div>
                <i className="bi bi-bell"></i>
                <span>Turn Notification</span>
              </div>

            </div>


            <button
              className="main-button customer-button"
              onClick={() => navigate("/customer-login")}
            >
              Customer Login

              <i className="bi bi-arrow-right"></i>
            </button>


            <button
              className="secondary-button customer-secondary"
              onClick={() => navigate("/register")}
            >
              Create New Account
            </button>

          </div>


          {/* ADMIN CARD */}

          <div className="portal-card admin-card">

            <div className="portal-icon admin-icon">
              <i className="bi bi-person-workspace"></i>
            </div>

            <span className="portal-label admin-label">
              ADMIN PORTAL
            </span>

            <h3>
              Administration
            </h3>

            <p>
              Monitor your assigned counter, manage customers,
              and oversee the queue efficiently.
            </p>


            <div className="feature-list">

              <div>
                <i className="bi bi-speedometer2"></i>
                <span>Live Dashboard</span>
              </div>

              <div>
                <i className="bi bi-people"></i>
                <span>Queue Monitoring</span>
              </div>

              <div>
                <i className="bi bi-bar-chart"></i>
                <span>Queue Statistics</span>
              </div>

            </div>


            <button
              className="main-button admin-button"
              onClick={() => navigate("/admin-login")}
            >
              Admin Login

              <i className="bi bi-arrow-right"></i>
            </button>


            <div className="admin-note">

              <i className="bi bi-shield-check"></i>

              <span>
                Authorized administrators only
              </span>

            </div>

          </div>

        </div>


        {/* ================= SYSTEM FEATURES ================= */}

        <div className="system-features">

          <div className="system-feature">

            <div className="small-feature-icon">
              <i className="bi bi-lightning-charge"></i>
            </div>

            <div>
              <strong>Fast</strong>
              <span>Digital queue</span>
            </div>

          </div>


          <div className="feature-divider"></div>


          <div className="system-feature">

            <div className="small-feature-icon">
              <i className="bi bi-clock"></i>
            </div>

            <div>
              <strong>Real-Time</strong>
              <span>Queue tracking</span>
            </div>

          </div>


          <div className="feature-divider"></div>


          <div className="system-feature">

            <div className="small-feature-icon">
              <i className="bi bi-bell"></i>
            </div>

            <div>
              <strong>Smart</strong>
              <span>Turn alerts</span>
            </div>

          </div>

        </div>


        {/* ================= FOOTER ================= */}

        <div className="home-footer">

          <div className="footer-line"></div>

          <p>
            <i className="bi bi-bank2"></i>
            Smart Queue Management System
          </p>

          <span>
            © 2026 • Smart Banking Experience
          </span>

        </div>

      </div>

    </div>
  );
}

export default HomePage;