// AdminPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import { Bar, Pie } from "react-chartjs-2";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./AdminPage.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function AdminPage() {
  const navigate = useNavigate();

  const [queue, setQueue] = useState([]);
  const [search, setSearch] = useState("");

  const [stats, setStats] = useState({
    total: 0,
    waiting: 0,
    serving: 0,
    completed: 0,
  });

  const loadQueue = async () => {
    try {
      const res = await axios.get(
        " https://gusto-glider-shrouded.ngrok-free.dev/queue"
      );

      setQueue(res.data);
    } catch (e) {
      console.log(e);
    }
  };

  const loadStats = async () => {
    try {
      const res = await axios.get(
        " https://gusto-glider-shrouded.ngrok-free.dev/dashboard-stats"
      );

      setStats(res.data);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    loadQueue();
    loadStats();

    const t = setInterval(() => {
      loadQueue();
      loadStats();
    }, 5000);

    return () => clearInterval(t);
  }, []);

  const callNextCustomer = async () => {
    const res = await axios.post(
      " https://gusto-glider-shrouded.ngrok-free.dev/call-next"
    );

    alert(res.data.message);

    loadQueue();
    loadStats();
  };

  const completeCustomer = async () => {
    const res = await axios.post(
      " https://gusto-glider-shrouded.ngrok-free.dev/complete-customer"
    );

    alert(res.data.message);

    loadQueue();
    loadStats();
  };

  const filtered = useMemo(
    () =>
      queue.filter(
        (q) =>
          q.customer_name
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          q.phone.includes(search) ||
          String(q.token_no).includes(search)
      ),
    [queue, search]
  );

  const barData = {
    labels: ["Waiting", "Serving", "Completed"],
    datasets: [
      {
        label: "Customers",
        data: [
          stats.waiting,
          stats.serving,
          stats.completed,
        ],
        backgroundColor: ["#f6b73c", "#18a875", "#3478f6"],
        borderRadius: 8,
        barThickness: 42,
      },
    ],
  };

  const pieData = {
    labels: ["Waiting", "Serving", "Completed"],
    datasets: [
      {
        data: [
          stats.waiting,
          stats.serving,
          stats.completed,
        ],
        backgroundColor: ["#f6b73c", "#18a875", "#3478f6"],
        borderWidth: 0,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "#edf1f7",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "bottom",
      },
    },
  };

  return (
    <div className="admin-page">

      {/* ================= HEADER ================= */}

      <header className="admin-header">

        <div className="admin-brand">

          <div className="admin-brand-icon">
            <i className="bi bi-bank2"></i>
          </div>

          <div>
            <h4>Smart Queue</h4>
            <span>Management System</span>
          </div>

        </div>

        <div className="admin-header-right">

          <div className="admin-status">
            <span className="online-dot"></span>
            System Online
          </div>

          <button
            className="admin-home-btn"
            onClick={() => navigate("/")}
          >
            <i className="bi bi-house"></i>
            Home
          </button>

          <button
            className="admin-logout-btn"
            onClick={() => navigate("/login")}
          >
            <i className="bi bi-box-arrow-right"></i>
            Logout
          </button>

        </div>

      </header>


      {/* ================= MAIN CONTENT ================= */}

      <main className="admin-container">

        {/* PAGE TITLE */}

        <div className="admin-title-section">

          <div>
            <span className="admin-small-title">
              ADMINISTRATION
            </span>

            <h1>Queue Dashboard</h1>

            <p>
              Monitor customers and manage the bank queue in real time.
            </p>
          </div>

          <div className="live-indicator">
            <span></span>
            Live Updates
          </div>

        </div>


        {/* ================= STATISTICS ================= */}

        <div className="admin-stats-grid">

          <div className="stat-card stat-blue">

            <div className="stat-icon">
              <i className="bi bi-people-fill"></i>
            </div>

            <div>
              <span>Total Customers</span>
              <h2>{stats.total}</h2>
              <small>All queue customers</small>
            </div>

          </div>


          <div className="stat-card stat-yellow">

            <div className="stat-icon">
              <i className="bi bi-hourglass-split"></i>
            </div>

            <div>
              <span>Waiting</span>
              <h2>{stats.waiting}</h2>
              <small>Customers in queue</small>
            </div>

          </div>


          <div className="stat-card stat-green">

            <div className="stat-icon">
              <i className="bi bi-person-check-fill"></i>
            </div>

            <div>
              <span>Serving</span>
              <h2>{stats.serving}</h2>
              <small>Currently being served</small>
            </div>

          </div>


          <div className="stat-card stat-purple">

            <div className="stat-icon">
              <i className="bi bi-check2-circle"></i>
            </div>

            <div>
              <span>Completed</span>
              <h2>{stats.completed}</h2>
              <small>Successfully completed</small>
            </div>

          </div>

        </div>


        {/* ================= CHARTS ================= */}

        <div className="charts-grid">

          <div className="dashboard-card">

            <div className="card-heading">

              <div>
                <h3>Queue Overview</h3>
                <p>Current customer status</p>
              </div>

              <div className="heading-icon blue-icon">
                <i className="bi bi-bar-chart-fill"></i>
              </div>

            </div>

            <div className="chart-area">
              <Bar data={barData} options={barOptions} />
            </div>

          </div>


          <div className="dashboard-card">

            <div className="card-heading">

              <div>
                <h3>Queue Distribution</h3>
                <p>Customer status breakdown</p>
              </div>

              <div className="heading-icon purple-icon">
                <i className="bi bi-pie-chart-fill"></i>
              </div>

            </div>

            <div className="pie-area">
              <Pie data={pieData} options={pieOptions} />
            </div>

          </div>

        </div>


        {/* ================= QUEUE CONTROL ================= */}

        <div className="queue-control-card">

          <div className="search-container">

            <i className="bi bi-search"></i>

            <input
              type="text"
              placeholder="Search by token, phone or customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {search && (
              <button
                className="clear-search"
                onClick={() => setSearch("")}
              >
                <i className="bi bi-x"></i>
              </button>
            )}

          </div>


          <div className="queue-actions">

            <button
              className="call-next-btn"
              onClick={callNextCustomer}
            >
              <i className="bi bi-megaphone-fill"></i>
              Call Next
            </button>

            <button
              className="complete-btn"
              onClick={completeCustomer}
            >
              <i className="bi bi-check-circle-fill"></i>
              Complete
            </button>

          </div>

        </div>


        {/* ================= QUEUE TABLE ================= */}

        <div className="dashboard-card queue-table-card">

          <div className="queue-table-header">

            <div>
              <h3>Customer Queue</h3>

              <p>
                <span className="table-live-dot"></span>
                Live queue information
              </p>
            </div>

            <div className="customer-count">
              {filtered.length} Customers
            </div>

          </div>


          <div className="table-responsive">

            <table className="admin-table">

              <thead>

                <tr>
                  <th>Token</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Service</th>
                  <th>Waiting Time</th>
                  <th>Status</th>
                </tr>

              </thead>

              <tbody>

                {filtered.length > 0 ? (

                  filtered.map((item) => (

                    <tr key={item.queue_id}>

                      <td>

                        <span className="token-badge">
                          {item.token_no}
                        </span>

                      </td>

                      <td>

                        <div className="customer-cell">

                          <div className="customer-avatar">
                            {item.customer_name
                              ? item.customer_name
                                  .charAt(0)
                                  .toUpperCase()
                              : "C"}
                          </div>

                          <span>
                            {item.customer_name}
                          </span>

                        </div>

                      </td>

                      <td>
                        <span className="phone-text">
                          <i className="bi bi-telephone"></i>
                          {item.phone}
                        </span>
                      </td>

                      <td>
                        <span className="service-text">
                          {item.service_name}
                        </span>
                      </td>

                      <td>

                        <span className="waiting-time">
                          <i className="bi bi-clock"></i>
                          {item.waiting_time} min
                        </span>

                      </td>

                      <td>

                        <span
                          className={`status-badge ${
                            item.queue_status === "Waiting"
                              ? "status-waiting"
                              : item.queue_status === "Serving"
                              ? "status-serving"
                              : "status-completed"
                          }`}
                        >

                          <span></span>

                          {item.queue_status}

                        </span>

                      </td>

                    </tr>

                  ))

                ) : (

                  <tr>

                    <td
                      colSpan="6"
                      className="empty-queue"
                    >

                      <div className="empty-icon">
                        <i className="bi bi-inbox"></i>
                      </div>

                      <h4>No customers found</h4>

                      <p>
                        There are no matching customers in the queue.
                      </p>

                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

        </div>


        {/* ================= FOOTER ================= */}

        <div className="admin-footer">

          <span>
            <i className="bi bi-shield-check"></i>
            Smart Queue Management System
          </span>

          <span>
            Admin Dashboard • 2026
          </span>

        </div>

      </main>

    </div>
  );
}