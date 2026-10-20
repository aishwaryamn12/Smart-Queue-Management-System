import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap-icons/font/bootstrap-icons.css";

const API_URL = "http://127.0.0.1:5000";

function AdminDashboard() {
    const navigate = useNavigate();

    const adminData = JSON.parse(
        localStorage.getItem("admin") || "{}"
    );

    const adminName = adminData.admin_name || "Admin";
    const counterNo = adminData.counter_no || "-";
    const serviceId = adminData.service_id || "-";
    const email = adminData.email || "-";

    const serviceNames = {
        1: "Cash Deposit",
        2: "Cash Withdrawal",
        3: "Account Opening",
        4: "Loan Inquiry",
        5: "Passbook Update"
    };

    const serviceName =
        serviceNames[serviceId] || "Unknown Service";

    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);

    // =====================================================
    // LOGOUT
    // =====================================================

    const handleLogout = () => {
        localStorage.removeItem("admin");
        navigate("/admin-login");
    };


    // =====================================================
    // LOAD QUEUE
    // =====================================================

    const fetchQueue = async () => {
        try {
            const response = await axios.get(
                `${API_URL}/admin/queue?counter_no=${counterNo}`
            );

            if (response.data.status === "success") {
                setQueue(response.data.queue || []);
            }

        } catch (error) {
            console.error(
                "Queue loading error:",
                error
            );
        } finally {
            setLoading(false);
        }
    };


    // =====================================================
    // LOAD QUEUE EVERY SECOND
    // =====================================================

    useEffect(() => {
        if (!counterNo || counterNo === "-") {
            return;
        }

        fetchQueue();

        const interval = setInterval(() => {
            fetchQueue();
        }, 1000);

        return () => {
            clearInterval(interval);
        };
    }, [counterNo]);


    // =====================================================
    // SHOW IMMEDIATE POPUP
    // =====================================================

    const showImmediateNotification = (customer) => {

        const message =
            `🔔 Your Turn Has Come\n\n` +
            `Token: ${customer.token_no}\n\n` +
            `Your turn has come. Please come to the bank.\n\n` +
            `Please proceed to Counter ${counterNo}.`;

        if ("Notification" in window) {

            if (Notification.permission === "granted") {

                new Notification(
                    "🔔 Your Turn Has Come",
                    {
                        body:
                            `Token: ${customer.token_no}\n` +
                            `Your turn has come.\n` +
                            `Please proceed to Counter ${counterNo}.`,
                        requireInteraction: true
                    }
                );

            }

            else if (
                Notification.permission === "default"
            ) {

                Notification
                    .requestPermission()
                    .then((permission) => {

                        if (
                            permission === "granted"
                        ) {

                            new Notification(
                                "🔔 Your Turn Has Come",
                                {
                                    body:
                                        `Token: ${customer.token_no}\n` +
                                        `Your turn has come.\n` +
                                        `Please proceed to Counter ${counterNo}.`,
                                    requireInteraction: true
                                }
                            );

                        }

                        else {
                            alert(message);
                        }

                    })
                    .catch(() => {
                        alert(message);
                    });

            }

            else {
                alert(message);
            }

        }

        else {
            alert(message);
        }
    };


    // =====================================================
    // CALL CUSTOMER
    // =====================================================

    const callCustomer = async (customer) => {

        try {

            const response = await axios.post(
                `${API_URL}/admin/call-customer`,
                {
                    queue_id: customer.queue_id,
                    counter_no: counterNo
                }
            );

            if (
                response.data.status ===
                "success"
            ) {

                showImmediateNotification(
                    customer
                );

                fetchQueue();

            }

            else {

                alert(
                    response.data.message ||
                    "Unable to call customer."
                );

            }

        }

        catch (error) {

            console.error(
                "Call customer error:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Unable to call customer."
            );

        }

    };


    // =====================================================
    // COMPLETE CUSTOMER
    // =====================================================

    const completeCustomer = async (customer) => {

        try {

            const response = await axios.post(
                `${API_URL}/admin/complete-customer`,
                {
                    queue_id: customer.queue_id,
                    counter_no: counterNo
                }
            );

            if (
                response.data.status ===
                "success"
            ) {

                alert(
                    `Customer ${customer.token_no} completed successfully.`
                );

                fetchQueue();

            }

            else {

                alert(
                    response.data.message ||
                    "Unable to complete customer."
                );

            }

        }

        catch (error) {

            console.error(
                "Complete customer error:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Unable to complete customer."
            );

        }

    };


    // =====================================================
    // CURRENT SERVING CUSTOMER
    // =====================================================

    const currentCustomer =
        queue.find(
            (customer) =>
                customer.queue_status ===
                "Serving"
        );


    // =====================================================
    // STATISTICS
    // =====================================================

    const completedCount =
        queue.filter(
            (customer) =>
                customer.queue_status ===
                "Completed"
        ).length;

    const waitingCount =
        queue.filter(
            (customer) =>
                customer.queue_status ===
                "Waiting"
        ).length;

    const totalCustomers = queue.length;


    // =====================================================
    // MAIN UI
    // =====================================================

    return (

        <div className="admin-dashboard">

            <style>{`

                * {
                    box-sizing: border-box;
                }

                .admin-dashboard {
                    min-height: 100vh;
                    background:
                        linear-gradient(
                            135deg,
                            #f5f8ff 0%,
                            #eef8f7 100%
                        );
                    color: #17263a;
                    font-family:
                        Inter,
                        -apple-system,
                        BlinkMacSystemFont,
                        "Segoe UI",
                        sans-serif;
                }


                /* =========================
                   TOP NAVBAR
                   ========================= */

                .dashboard-navbar {
                    min-height: 76px;
                    background:
                        linear-gradient(
                            110deg,
                            #082b63,
                            #075ca8,
                            #078879
                        );
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 38px;
                    color: white;
                    box-shadow:
                        0 8px 25px
                        rgba(12, 58, 105, 0.16);
                }

                .dashboard-brand {
                    display: flex;
                    align-items: center;
                    gap: 13px;
                }

                .brand-icon {
                    width: 45px;
                    height: 45px;
                    border-radius: 13px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    background:
                        rgba(255,255,255,0.14);
                    border:
                        1px solid
                        rgba(255,255,255,0.2);
                    font-size: 20px;
                }

                .brand-title {
                    font-size: 17px;
                    font-weight: 750;
                    margin: 0;
                }

                .brand-subtitle {
                    display: block;
                    font-size: 10px;
                    opacity: 0.65;
                    margin-top: 2px;
                }

                .navbar-right {
                    display: flex;
                    align-items: center;
                    gap: 18px;
                }

                .live-indicator {
                    display: flex;
                    align-items: center;
                    gap: 7px;
                    font-size: 11px;
                    font-weight: 650;
                    opacity: 0.9;
                }

                .live-dot {
                    width: 8px;
                    height: 8px;
                    background: #5ff0c4;
                    border-radius: 50%;
                    box-shadow:
                        0 0 0 5px
                        rgba(95,240,196,0.13);
                }

                .logout-button {
                    border: 1px solid
                        rgba(255,255,255,0.25);
                    background:
                        rgba(255,255,255,0.1);
                    color: white;
                    border-radius: 9px;
                    padding: 9px 15px;
                    font-size: 11px;
                    font-weight: 650;
                    cursor: pointer;
                    transition: 0.2s;
                }

                .logout-button:hover {
                    background:
                        rgba(255,255,255,0.2);
                }


                /* =========================
                   MAIN
                   ========================= */

                .dashboard-container {
                    max-width: 1450px;
                    margin: auto;
                    padding: 32px 35px 50px;
                }


                /* =========================
                   WELCOME
                   ========================= */

                .welcome-section {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-bottom: 25px;
                }

                .welcome-label {
                    color: #5080bd;
                    font-size: 10px;
                    font-weight: 800;
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                }

                .welcome-section h1 {
                    margin: 5px 0 5px;
                    font-size: 29px;
                    font-weight: 760;
                }

                .welcome-section p {
                    margin: 0;
                    color: #8795a7;
                    font-size: 12px;
                }

                .counter-badge {
                    display: flex;
                    align-items: center;
                    gap: 9px;
                    padding: 11px 15px;
                    border-radius: 12px;
                    background: white;
                    border: 1px solid #e3eaf2;
                    box-shadow:
                        0 5px 18px
                        rgba(35,58,90,0.06);
                }

                .counter-badge i {
                    color: #1771dc;
                }

                .counter-badge span {
                    color: #718096;
                    font-size: 10px;
                }

                .counter-badge strong {
                    color: #17263a;
                    font-size: 13px;
                }


                /* =========================
                   INFORMATION CARDS
                   ========================= */

                .info-grid {
                    display: grid;
                    grid-template-columns:
                        repeat(4, 1fr);
                    gap: 15px;
                    margin-bottom: 20px;
                }

                .info-card {
                    background: white;
                    border: 1px solid #e5ebf3;
                    border-radius: 15px;
                    padding: 19px;
                    min-height: 120px;
                    position: relative;
                    overflow: hidden;
                    box-shadow:
                        0 7px 25px
                        rgba(35,58,90,0.05);
                }

                .info-card::after {
                    content: "";
                    position: absolute;
                    width: 90px;
                    height: 90px;
                    border-radius: 50%;
                    right: -35px;
                    bottom: -45px;
                    background: #edf5ff;
                }

                .info-icon {
                    width: 37px;
                    height: 37px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #edf5ff;
                    color: #2675d9;
                    margin-bottom: 12px;
                }

                .info-card.green .info-icon {
                    background: #e9f8f2;
                    color: #15946b;
                }

                .info-card.orange .info-icon {
                    background: #fff4df;
                    color: #d58b15;
                }

                .info-card.purple .info-icon {
                    background: #f1edff;
                    color: #7357d6;
                }

                .info-label {
                    color: #91a0b1;
                    font-size: 9px;
                    font-weight: 750;
                    text-transform: uppercase;
                    letter-spacing: 0.8px;
                }

                .info-value {
                    margin-top: 3px;
                    color: #26374c;
                    font-size: 16px;
                    font-weight: 750;
                }

                .info-small {
                    color: #94a1b0;
                    font-size: 9px;
                    margin-top: 3px;
                }


                /* =========================
                   CURRENT CUSTOMER
                   ========================= */

                .current-card {
                    background: white;
                    border-radius: 18px;
                    border: 1px solid #e3eaf2;
                    overflow: hidden;
                    box-shadow:
                        0 9px 30px
                        rgba(35,58,90,0.07);
                    margin-bottom: 20px;
                }

                .current-header {
                    padding: 16px 21px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-bottom: 1px solid #edf1f5;
                }

                .current-title {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .current-title-icon {
                    width: 35px;
                    height: 35px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 9px;
                    background: #e9f8f2;
                    color: #15946b;
                }

                .current-title h3 {
                    margin: 0;
                    font-size: 14px;
                    font-weight: 750;
                }

                .current-title span {
                    display: block;
                    color: #9aa6b5;
                    font-size: 9px;
                    margin-top: 2px;
                }

                .serving-badge {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 10px;
                    border-radius: 20px;
                    background: #e9f8f2;
                    color: #168a65;
                    font-size: 9px;
                    font-weight: 750;
                }

                .serving-badge i {
                    font-size: 7px;
                }


                .current-body {
                    padding: 23px;
                }

                .customer-main {
                    display: grid;
                    grid-template-columns:
                        1.1fr 2fr 1fr;
                    gap: 20px;
                    align-items: center;
                }

                .token-box {
                    background:
                        linear-gradient(
                            135deg,
                            #edf5ff,
                            #eefaf7
                        );
                    border-radius: 15px;
                    padding: 19px;
                    text-align: center;
                    border: 1px solid #e2ebf5;
                }

                .token-label {
                    color: #8b9aab;
                    font-size: 9px;
                    font-weight: 750;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                }

                .token-number {
                    margin-top: 4px;
                    color: #176bd3;
                    font-size: 31px;
                    font-weight: 850;
                    letter-spacing: 1px;
                }

                .customer-details {
                    display: grid;
                    grid-template-columns:
                        repeat(2, 1fr);
                    gap: 15px;
                }

                .detail-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .detail-icon {
                    width: 34px;
                    height: 34px;
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 9px;
                    background: #f3f6fa;
                    color: #6380a1;
                }

                .detail-label {
                    color: #9aa7b6;
                    display: block;
                    font-size: 8px;
                    text-transform: uppercase;
                    font-weight: 700;
                }

                .detail-value {
                    display: block;
                    margin-top: 2px;
                    color: #293b51;
                    font-size: 11px;
                    font-weight: 700;
                }

                .customer-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 9px;
                }

                .action-button {
                    border: none;
                    border-radius: 9px;
                    padding: 11px 12px;
                    font-size: 10px;
                    font-weight: 750;
                    cursor: pointer;
                    transition: 0.2s;
                }

                .call-button {
                    color: white;
                    background:
                        linear-gradient(
                            135deg,
                            #2577e3,
                            #1762c5
                        );
                    box-shadow:
                        0 7px 16px
                        rgba(37,119,227,0.18);
                }

                .complete-button {
                    color: #168660;
                    background: #eaf8f3;
                }

                .action-button:hover {
                    transform: translateY(-1px);
                }


                .no-customer {
                    text-align: center;
                    padding: 35px 20px;
                    color: #9aa7b5;
                }

                .no-customer i {
                    display: block;
                    font-size: 32px;
                    margin-bottom: 10px;
                    color: #b7c2cf;
                }

                .no-customer strong {
                    display: block;
                    color: #68788b;
                    font-size: 13px;
                    margin-bottom: 4px;
                }

                .no-customer span {
                    font-size: 10px;
                }


                /* =========================
                   QUEUE SECTION
                   ========================= */

                .queue-card {
                    background: white;
                    border-radius: 18px;
                    border: 1px solid #e3eaf2;
                    overflow: hidden;
                    box-shadow:
                        0 9px 30px
                        rgba(35,58,90,0.06);
                }

                .queue-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 18px 21px;
                    border-bottom: 1px solid #edf1f5;
                }

                .queue-heading {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .queue-heading-icon {
                    width: 35px;
                    height: 35px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 9px;
                    background: #edf5ff;
                    color: #2675d9;
                }

                .queue-heading h3 {
                    margin: 0;
                    font-size: 14px;
                    font-weight: 750;
                }

                .queue-heading span {
                    display: block;
                    color: #9aa6b5;
                    font-size: 9px;
                    margin-top: 2px;
                }

                .queue-count {
                    padding: 7px 11px;
                    border-radius: 8px;
                    background: #f1f5f9;
                    color: #63748a;
                    font-size: 9px;
                    font-weight: 750;
                }


                .service-banner {
                    margin: 18px 21px;
                    padding: 11px 14px;
                    border-radius: 9px;
                    background: #f4f8fc;
                    border: 1px solid #e7edf4;
                    color: #75869a;
                    font-size: 10px;
                }

                .service-banner strong {
                    color: #315d91;
                }


                /* TABLE */

                .table-container {
                    overflow-x: auto;
                }

                .queue-table {
                    width: 100%;
                    border-collapse: collapse;
                    min-width: 850px;
                }

                .queue-table th {
                    padding: 12px 16px;
                    text-align: left;
                    background: #f8fafc;
                    color: #8796a8;
                    font-size: 8px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.7px;
                    border-bottom: 1px solid #e8edf3;
                }

                .queue-table td {
                    padding: 14px 16px;
                    color: #506176;
                    font-size: 10px;
                    border-bottom: 1px solid #edf1f5;
                }

                .queue-table tr:hover td {
                    background: #fafcff;
                }

                .token-cell {
                    color: #216dcc !important;
                    font-weight: 800;
                    font-size: 11px !important;
                }

                .customer-cell {
                    color: #26394f !important;
                    font-weight: 700;
                }

                .status-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    padding: 5px 9px;
                    border-radius: 20px;
                    font-size: 8px;
                    font-weight: 750;
                }

                .status-pill.waiting {
                    background: #fff5df;
                    color: #b87a0e;
                }

                .status-pill.serving {
                    background: #e7f8f0;
                    color: #13825f;
                }

                .status-pill.completed {
                    background: #eef1f5;
                    color: #758397;
                }

                .mini-action {
                    border: none;
                    border-radius: 7px;
                    padding: 7px 10px;
                    font-size: 8px;
                    font-weight: 750;
                    cursor: pointer;
                    transition: 0.2s;
                }

                .mini-call {
                    color: white;
                    background: #2374dc;
                }

                .mini-complete {
                    color: #158360;
                    background: #e8f8f1;
                }

                .mini-action:hover {
                    transform: translateY(-1px);
                }

                .completed-text {
                    color: #a1acb9;
                    font-size: 8px;
                }


                /* LOADING */

                .loading-box {
                    text-align: center;
                    padding: 55px 20px;
                    color: #8796a7;
                }

                .loading-spinner {
                    width: 30px;
                    height: 30px;
                    border: 3px solid #e2eaf3;
                    border-top-color: #2374dc;
                    border-radius: 50%;
                    animation:
                        dashboardSpin
                        0.8s linear infinite;
                    margin: 0 auto 12px;
                }

                @keyframes dashboardSpin {
                    to {
                        transform: rotate(360deg);
                    }
                }


                .empty-queue {
                    text-align: center;
                    padding: 55px 20px;
                    color: #9aa7b5;
                }

                .empty-queue i {
                    font-size: 35px;
                    color: #c3ccd7;
                    display: block;
                    margin-bottom: 10px;
                }

                .empty-queue strong {
                    display: block;
                    color: #66778b;
                    font-size: 12px;
                }

                .empty-queue span {
                    display: block;
                    margin-top: 4px;
                    font-size: 9px;
                }


                /* =========================
                   STATISTICS
                   ========================= */

                .statistics-grid {
                    display: grid;
                    grid-template-columns:
                        repeat(3, 1fr);
                    gap: 15px;
                    margin-top: 20px;
                }

                .stat-card {
                    background: white;
                    border: 1px solid #e3eaf2;
                    border-radius: 14px;
                    padding: 17px;
                    display: flex;
                    align-items: center;
                    gap: 13px;
                    box-shadow:
                        0 6px 20px
                        rgba(35,58,90,0.04);
                }

                .stat-icon {
                    width: 42px;
                    height: 42px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    border-radius: 11px;
                    background: #edf5ff;
                    color: #2675d9;
                    font-size: 17px;
                }

                .stat-card.waiting .stat-icon {
                    background: #fff5df;
                    color: #d28a12;
                }

                .stat-card.counter .stat-icon {
                    background: #e9f8f2;
                    color: #16936b;
                }

                .stat-label {
                    color: #94a2b2;
                    font-size: 8px;
                    text-transform: uppercase;
                    font-weight: 750;
                    letter-spacing: 0.6px;
                }

                .stat-value {
                    color: #26394f;
                    font-size: 22px;
                    font-weight: 800;
                    margin-top: 2px;
                }


                /* =========================
                   RESPONSIVE
                   ========================= */

                @media (max-width: 1050px) {

                    .info-grid {
                        grid-template-columns:
                            repeat(2, 1fr);
                    }

                    .customer-main {
                        grid-template-columns: 1fr 2fr;
                    }

                    .customer-actions {
                        grid-column: 1 / -1;
                        flex-direction: row;
                    }

                    .action-button {
                        flex: 1;
                    }
                }


                @media (max-width: 750px) {

                    .dashboard-navbar {
                        padding: 0 18px;
                    }

                    .live-indicator {
                        display: none;
                    }

                    .dashboard-container {
                        padding: 22px 15px 40px;
                    }

                    .welcome-section {
                        display: block;
                    }

                    .counter-badge {
                        margin-top: 15px;
                        width: fit-content;
                    }

                    .info-grid {
                        grid-template-columns: 1fr;
                    }

                    .customer-main {
                        grid-template-columns: 1fr;
                    }

                    .customer-details {
                        grid-template-columns: 1fr;
                    }

                    .statistics-grid {
                        grid-template-columns: 1fr;
                    }
                }


                @media (max-width: 480px) {

                    .brand-subtitle {
                        display: none;
                    }

                    .brand-title {
                        font-size: 14px;
                    }

                    .logout-button {
                        padding: 8px 10px;
                    }

                    .welcome-section h1 {
                        font-size: 24px;
                    }

                    .current-body {
                        padding: 15px;
                    }

                    .customer-actions {
                        flex-direction: column;
                    }
                }

            `}</style>


            {/* =====================================================
                NAVBAR
            ===================================================== */}

            <nav className="dashboard-navbar">

                <div className="dashboard-brand">

                    <div className="brand-icon">
                        <i className="bi bi-bank2"></i>
                    </div>

                    <div>
                        <h2 className="brand-title">
                            Smart Queue
                        </h2>

                        <span className="brand-subtitle">
                            Administration Portal
                        </span>
                    </div>

                </div>


                <div className="navbar-right">

                    <div className="live-indicator">
                        <span className="live-dot"></span>
                        LIVE MONITORING
                    </div>

                    <button
                        className="logout-button"
                        onClick={handleLogout}
                    >
                        <i className="bi bi-box-arrow-right"></i>
                        &nbsp; Logout
                    </button>

                </div>

            </nav>


            {/* =====================================================
                MAIN CONTAINER
            ===================================================== */}

            <main className="dashboard-container">


                {/* WELCOME */}

                <section className="welcome-section">

                    <div>

                        <span className="welcome-label">
                            Administrator Dashboard
                        </span>

                        <h1>
                            Welcome, {adminName}
                        </h1>

                        <p>
                            Monitor your counter and manage today's
                            customer queue in real time.
                        </p>

                    </div>


                    <div className="counter-badge">

                        <i className="bi bi-display"></i>

                        <div>
                            <span>Assigned Counter</span>
                            <br />
                            <strong>
                                Counter {counterNo}
                            </strong>
                        </div>

                    </div>

                </section>


                {/* =====================================================
                    INFORMATION CARDS
                ===================================================== */}

                <section className="info-grid">


                    <div className="info-card">

                        <div className="info-icon">
                            <i className="bi bi-person-badge"></i>
                        </div>

                        <div className="info-label">
                            Administrator
                        </div>

                        <div className="info-value">
                            {adminName}
                        </div>

                        <div className="info-small">
                            {email}
                        </div>

                    </div>


                    <div className="info-card green">

                        <div className="info-icon">
                            <i className="bi bi-bank"></i>
                        </div>

                        <div className="info-label">
                            Assigned Service
                        </div>

                        <div className="info-value">
                            {serviceName}
                        </div>

                        <div className="info-small">
                            Counter {counterNo}
                        </div>

                    </div>


                    <div className="info-card orange">

                        <div className="info-icon">
                            <i className="bi bi-people"></i>
                        </div>

                        <div className="info-label">
                            Customers Waiting
                        </div>

                        <div className="info-value">
                            {waitingCount}
                        </div>

                        <div className="info-small">
                            In your service queue
                        </div>

                    </div>


                    <div className="info-card purple">

                        <div className="info-icon">
                            <i className="bi bi-activity"></i>
                        </div>

                        <div className="info-label">
                            Counter Status
                        </div>

                        <div className="info-value">
                            Active
                        </div>

                        <div className="info-small">
                            Automatic monitoring enabled
                        </div>

                    </div>

                </section>


                {/* =====================================================
                    CURRENT CUSTOMER
                ===================================================== */}

                <section className="current-card">

                    <div className="current-header">

                        <div className="current-title">

                            <div className="current-title-icon">
                                <i className="bi bi-person-check-fill"></i>
                            </div>

                            <div>

                                <h3>
                                    Current Customer
                                </h3>

                                <span>
                                    Customer currently being served
                                </span>

                            </div>

                        </div>


                        {currentCustomer && (

                            <div className="serving-badge">

                                <i className="bi bi-circle-fill"></i>

                                SERVING NOW

                            </div>

                        )}

                    </div>


                    <div className="current-body">

                        {currentCustomer ? (

                            <div className="customer-main">


                                {/* TOKEN */}

                                <div className="token-box">

                                    <div className="token-label">
                                        Current Token
                                    </div>

                                    <div className="token-number">
                                        {currentCustomer.token_no}
                                    </div>

                                </div>


                                {/* DETAILS */}

                                <div className="customer-details">


                                    <div className="detail-item">

                                        <div className="detail-icon">
                                            <i className="bi bi-person"></i>
                                        </div>

                                        <div>
                                            <span className="detail-label">
                                                Customer
                                            </span>

                                            <span className="detail-value">
                                                {currentCustomer.customer_name}
                                            </span>
                                        </div>

                                    </div>


                                    <div className="detail-item">

                                        <div className="detail-icon">
                                            <i className="bi bi-telephone"></i>
                                        </div>

                                        <div>
                                            <span className="detail-label">
                                                Phone
                                            </span>

                                            <span className="detail-value">
                                                {currentCustomer.phone}
                                            </span>
                                        </div>

                                    </div>


                                    <div className="detail-item">

                                        <div className="detail-icon">
                                            <i className="bi bi-briefcase"></i>
                                        </div>

                                        <div>
                                            <span className="detail-label">
                                                Service
                                            </span>

                                            <span className="detail-value">
                                                {currentCustomer.service_name}
                                            </span>
                                        </div>

                                    </div>


                                    <div className="detail-item">

                                        <div className="detail-icon">
                                            <i className="bi bi-clock"></i>
                                        </div>

                                        <div>
                                            <span className="detail-label">
                                                Status
                                            </span>

                                            <span className="detail-value">
                                                Serving
                                            </span>
                                        </div>

                                    </div>

                                </div>


                                {/* ACTIONS */}

                                <div className="customer-actions">

                                    <button
                                        className="action-button call-button"
                                        onClick={() =>
                                            showImmediateNotification(
                                                currentCustomer
                                            )
                                        }
                                    >
                                        <i className="bi bi-bell-fill"></i>
                                        &nbsp; Call Customer
                                    </button>


                                    <button
                                        className="action-button complete-button"
                                        onClick={() =>
                                            completeCustomer(
                                                currentCustomer
                                            )
                                        }
                                    >
                                        <i className="bi bi-check-circle-fill"></i>
                                        &nbsp; Complete
                                    </button>

                                </div>

                            </div>

                        ) : (

                            <div className="no-customer">

                                <i className="bi bi-person-x"></i>

                                <strong>
                                    No Customer Currently Serving
                                </strong>

                                <span>
                                    The next customer will appear here
                                    automatically.
                                </span>

                            </div>

                        )}

                    </div>

                </section>


                {/* =====================================================
                    QUEUE
                ===================================================== */}

                <section className="queue-card">

                    <div className="queue-header">

                        <div className="queue-heading">

                            <div className="queue-heading-icon">
                                <i className="bi bi-list-ol"></i>
                            </div>

                            <div>

                                <h3>
                                    Queue Management
                                </h3>

                                <span>
                                    Live customer queue for your counter
                                </span>

                            </div>

                        </div>


                        <div className="queue-count">
                            {totalCustomers} CUSTOMER
                            {totalCustomers !== 1 ? "S" : ""}
                        </div>

                    </div>


                    <div className="service-banner">

                        <i className="bi bi-info-circle"></i>
                        &nbsp;

                        <strong>
                            Counter {counterNo}
                        </strong>

                        {" "}is assigned to{" "}

                        <strong>
                            {serviceName}
                        </strong>

                        . Queue data updates automatically.

                    </div>


                    {loading ? (

                        <div className="loading-box">

                            <div className="loading-spinner"></div>

                            Loading live queue...

                        </div>

                    ) : queue.length === 0 ? (

                        <div className="empty-queue">

                            <i className="bi bi-inbox"></i>

                            <strong>
                                No queue data available
                            </strong>

                            <span>
                                Customers will appear here
                                when they generate tokens.
                            </span>

                        </div>

                    ) : (

                        <div className="table-container">

                            <table className="queue-table">

                                <thead>

                                    <tr>

                                        <th>Token</th>

                                        <th>Customer</th>

                                        <th>Phone</th>

                                        <th>Service</th>

                                        <th>Status</th>

                                        <th>Waiting Time</th>

                                        <th>Action</th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {queue.map(
                                        (customer) => (

                                            <tr
                                                key={
                                                    customer.queue_id
                                                }
                                            >

                                                <td className="token-cell">
                                                    {
                                                        customer.token_no
                                                    }
                                                </td>


                                                <td className="customer-cell">
                                                    {
                                                        customer.customer_name
                                                    }
                                                </td>


                                                <td>
                                                    {
                                                        customer.phone
                                                    }
                                                </td>


                                                <td>
                                                    {
                                                        customer.service_name
                                                    }
                                                </td>


                                                <td>

                                                    {customer.queue_status ===
                                                    "Serving" ? (

                                                        <span className="status-pill serving">

                                                            <i className="bi bi-circle-fill"></i>

                                                            Serving

                                                        </span>

                                                    ) : customer.queue_status ===
                                                    "Waiting" ? (

                                                        <span className="status-pill waiting">

                                                            <i className="bi bi-clock-fill"></i>

                                                            Waiting

                                                        </span>

                                                    ) : (

                                                        <span className="status-pill completed">

                                                            <i className="bi bi-check-circle-fill"></i>

                                                            Completed

                                                        </span>

                                                    )}

                                                </td>


                                                <td>

                                                    {
                                                        customer.queue_status ===
                                                        "Completed"
                                                            ? "0 sec"
                                                            : `${customer.waiting_time || 0} sec`
                                                    }

                                                </td>


                                                <td>

                                                    {customer.queue_status ===
                                                    "Waiting" ? (

                                                        <button
                                                            className="mini-action mini-call"
                                                            onClick={() =>
                                                                callCustomer(
                                                                    customer
                                                                )
                                                            }
                                                        >
                                                            <i className="bi bi-bell-fill"></i>
                                                            &nbsp;
                                                            Call Customer
                                                        </button>

                                                    ) : customer.queue_status ===
                                                    "Serving" ? (

                                                        <button
                                                            className="mini-action mini-complete"
                                                            onClick={() =>
                                                                completeCustomer(
                                                                    customer
                                                                )
                                                            }
                                                        >
                                                            <i className="bi bi-check-lg"></i>
                                                            &nbsp;
                                                            Complete
                                                        </button>

                                                    ) : (

                                                        <span className="completed-text">
                                                            Completed
                                                        </span>

                                                    )}

                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </section>


                {/* =====================================================
                    STATISTICS
                ===================================================== */}

                <section className="statistics-grid">


                    <div className="stat-card">

                        <div className="stat-icon">
                            <i className="bi bi-check2-circle"></i>
                        </div>

                        <div>

                            <div className="stat-label">
                                Customers Served
                            </div>

                            <div className="stat-value">
                                {completedCount}
                            </div>

                        </div>

                    </div>


                    <div className="stat-card waiting">

                        <div className="stat-icon">
                            <i className="bi bi-hourglass-split"></i>
                        </div>

                        <div>

                            <div className="stat-label">
                                Customers Waiting
                            </div>

                            <div className="stat-value">
                                {waitingCount}
                            </div>

                        </div>

                    </div>


                    <div className="stat-card counter">

                        <div className="stat-icon">
                            <i className="bi bi-display"></i>
                        </div>

                        <div>

                            <div className="stat-label">
                                Active Counter
                            </div>

                            <div className="stat-value">
                                {counterNo}
                            </div>

                        </div>

                    </div>

                </section>

            </main>

        </div>
    );
}

export default AdminDashboard;