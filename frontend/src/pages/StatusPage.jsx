import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./StatusPage.css";

const API_URL = "http://127.0.0.1:5000";

function StatusPage() {

  const { tokenNo } = useParams();

  const navigate = useNavigate();

  const [queueData, setQueueData] = useState(null);

  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const endTimeRef = useRef(null);

  const statusRef = useRef(null);

  const queueDataRef = useRef(null);

  const notificationShownRef = useRef(false);


  // FORMAT TIME

  const formatTime = (seconds) => {

    const totalSeconds = Math.max(
      0,
      Math.floor(Number(seconds) || 0)
    );

    const minutes = Math.floor(
      totalSeconds / 60
    );

    const secs =
      totalSeconds % 60;

    return (
      String(minutes).padStart(2, "0") +
      ":" +
      String(secs).padStart(2, "0")
    );
  };


  // BROWSER POPUP

  const showTurnNotification = (customer) => {

    if (
      !customer ||
      !("Notification" in window)
    ) {
      return;
    }

    const show = () => {

      try {

        new Notification(
          "🔔 Your Turn Has Come",
          {
            body:
              `Token: ${customer.token_no}\n` +
              `Your turn has come. Please come to the bank.\n` +
              `Please proceed to Counter ${customer.counter_no}.`,

            tag:
              `smart-queue-${customer.token_no}`,

            requireInteraction: true
          }
        );

      } catch (error) {

        console.error(
          "Browser notification error:",
          error
        );

      }
    };


    if (
      Notification.permission ===
      "granted"
    ) {

      show();

    }

    else if (
      Notification.permission !==
      "denied"
    ) {

      Notification
        .requestPermission()
        .then((permission) => {

          if (
            permission ===
            "granted"
          ) {

            show();

          }

        })
        .catch((error) => {

          console.error(
            "Notification permission error:",
            error
          );

        });

    }

  };


  // LOAD QUEUE STATUS

  const loadStatus = async () => {

    try {

      const response =
        await axios.get(
          `${API_URL}/queue-status/${tokenNo}`
        );


      if (
        response.data.status !==
        "success"
      ) {

        setError(
          response.data.message ||
          "Unable to load queue status."
        );

        return;

      }


      const data =
        response.data;


      const previousStatus =
        statusRef.current;


      setQueueData(data);

      queueDataRef.current =
        data;

      setError("");


      // COMPLETED

      if (
        data.queue_status ===
        "Completed"
      ) {

        endTimeRef.current =
          null;

        statusRef.current =
          "Completed";

        setRemainingSeconds(0);

        return;

      }


      // SERVING

      if (
        data.queue_status ===
        "Serving"
      ) {

        const serverEndTime =
          data.estimated_end_at
            ? new Date(
                data.estimated_end_at
              ).getTime()
            : null;


        if (serverEndTime) {

          if (
            previousStatus !==
              "Serving" ||
            endTimeRef.current ===
              null
          ) {

            endTimeRef.current =
              serverEndTime;

          }

        }

        else {

          endTimeRef.current =
            null;

          setRemainingSeconds(
            Number(
              data.waiting_seconds ||
              0
            )
          );

        }


        // ADMIN MANUAL CALL

        if (
          data.admin_called === true &&
          !notificationShownRef.current
        ) {

          notificationShownRef.current =
            true;

          showTurnNotification(
            data
          );

        }


        statusRef.current =
          "Serving";

        return;

      }


      // WAITING

      if (
        data.queue_status ===
        "Waiting"
      ) {

        const backendSeconds =
          Number(
            data.waiting_seconds ||
            0
          );


        if (
          previousStatus !==
            "Waiting" ||
          endTimeRef.current ===
            null
        ) {

          endTimeRef.current =
            Date.now() +
            backendSeconds *
            1000;

        }


        statusRef.current =
          "Waiting";

      }


    }

    catch (error) {

      console.error(
        "Queue status error:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Unable to connect to backend."
      );

    }

    finally {

      setLoading(false);

    }

  };


  // BACKEND SYNCHRONIZATION

  useEffect(() => {

    if (!tokenNo) {
      return;
    }


    notificationShownRef.current =
      false;


    loadStatus();


    const backendInterval =
      setInterval(() => {

        loadStatus();

      }, 1000);


    return () => {

      clearInterval(
        backendInterval
      );

    };

  }, [tokenNo]);


  // REAL-TIME COUNTDOWN

  useEffect(() => {

    const countdownInterval =
      setInterval(() => {

        if (
          endTimeRef.current ===
          null
        ) {

          return;

        }


        const now =
          Date.now();


        const difference =
          endTimeRef.current -
          now;


        const secondsLeft =
          Math.max(
            0,
            Math.ceil(
              difference /
              1000
            )
          );


        setRemainingSeconds(
          secondsLeft
        );


        // AUTOMATIC 00:00 NOTIFICATION

        const currentCustomer =
          queueDataRef.current;


        if (
          secondsLeft === 0 &&
          currentCustomer &&
          currentCustomer.queue_status ===
            "Serving" &&
          currentCustomer.admin_called !==
            true &&
          !notificationShownRef.current
        ) {

          notificationShownRef.current =
            true;

          showTurnNotification(
            currentCustomer
          );

        }

      }, 1000);


    return () => {

      clearInterval(
        countdownInterval
      );

    };

  }, []);


  // STATUS INFORMATION

  const getStatusInfo = () => {

    if (!queueData) {
      return {
        label: "Loading",
        icon: "bi-hourglass-split",
        className: "status-waiting"
      };
    }


    if (
      queueData.queue_status ===
      "Serving"
    ) {

      return {
        label: "Now Serving",
        icon: "bi-person-check-fill",
        className: "status-serving"
      };

    }


    if (
      queueData.queue_status ===
      "Completed"
    ) {

      return {
        label: "Completed",
        icon: "bi-check-circle-fill",
        className: "status-completed"
      };

    }


    return {
      label: "Waiting",
      icon: "bi-hourglass-split",
      className: "status-waiting"
    };

  };


  // LOGOUT

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

    navigate(
      "/customer-login"
    );

  };


  // LOADING

  if (
    loading &&
    !queueData
  ) {

    return (

      <div className="status-loading-page">

        <div className="loading-card">

          <div className="loading-icon">
            <i className="bi bi-bank2"></i>
          </div>

          <div className="loading-spinner"></div>

          <h3>
            Loading Your Queue
          </h3>

          <p>
            Please wait while we fetch your
            latest queue status.
          </p>

        </div>

      </div>

    );

  }


  const statusInfo =
    getStatusInfo();


  return (

    <div className="status-page">

      {/* Decorative background */}

      <div className="status-circle status-circle-one"></div>

      <div className="status-circle status-circle-two"></div>


      {/* Header */}

      <header className="status-header">

        <div className="status-brand">

          <div className="status-brand-icon">
            <i className="bi bi-bank2"></i>
          </div>

          <div>

            <h1>
              Smart Queue
            </h1>

            <span>
              Live Queue Tracking
            </span>

          </div>

        </div>


        <button
          className="status-logout"
          onClick={logout}
        >

          <i className="bi bi-box-arrow-right"></i>

          Logout

        </button>

      </header>


      {/* Main */}

      <main className="status-main">

        <div className="status-container">


          {/* Page heading */}

          <div className="status-heading">

            <span>
              <i className="bi bi-broadcast"></i>
              LIVE QUEUE
            </span>

            <h2>
              Your Queue Status
            </h2>

            <p>
              Track your token and waiting time
              in real time.
            </p>

          </div>


          {/* Error */}

          {error && (

            <div className="status-error">

              <i className="bi bi-exclamation-triangle-fill"></i>

              {error}

            </div>

          )}


          {queueData && (

            <div className="status-layout">


              {/* Main Token Card */}

              <section className="token-status-card">

                <div className="token-card-header">

                  <div>

                    <span>
                      YOUR QUEUE TOKEN
                    </span>

                    <h3>
                      {queueData.token_no}
                    </h3>

                  </div>


                  <div
                    className={`status-pill ${statusInfo.className}`}
                  >

                    <i
                      className={`bi ${statusInfo.icon}`}
                    ></i>

                    {statusInfo.label}

                  </div>

                </div>


                {/* Countdown */}

                <div
                  className={`queue-timer ${
                    queueData.queue_status ===
                    "Serving"
                      ? "timer-serving"
                      : queueData.queue_status ===
                        "Completed"
                        ? "timer-completed"
                        : "timer-waiting"
                  }`}
                >

                  <div className="timer-icon">

                    <i
                      className={
                        queueData.queue_status ===
                        "Completed"
                          ? "bi bi-check-lg"
                          : queueData.queue_status ===
                            "Serving"
                            ? "bi bi-stopwatch"
                            : "bi bi-clock"
                      }
                    ></i>

                  </div>


                  {queueData.queue_status ===
                  "Completed" ? (

                    <>

                      <span className="timer-label">
                        SERVICE COMPLETED
                      </span>

                      <strong>
                        00:00
                      </strong>

                      <p className="timer-message completed-message">
                        Your banking service has been
                        completed successfully.
                      </p>

                    </>

                  ) : queueData.queue_status ===
                    "Serving" ? (

                    <>

                      <span className="timer-label">
                        YOUR SERVICE TIME REMAINING
                      </span>

                      <strong>
                        {formatTime(
                          remainingSeconds
                        )}
                      </strong>

                      <p className="timer-message serving-message">

                        <i className="bi bi-person-check-fill"></i>

                        Please proceed to Counter{" "}
                        {queueData.counter_no}

                      </p>

                    </>

                  ) : (

                    <>

                      <span className="timer-label">
                        ESTIMATED WAITING TIME
                      </span>

                      <strong>
                        {formatTime(
                          remainingSeconds
                        )}
                      </strong>

                      <p className="timer-message">
                        <i className="bi bi-hourglass-split"></i>

                        Your turn is approaching.
                        Please wait.

                      </p>

                    </>

                  )}

                </div>


                {/* Information cards */}

                <div className="status-info-grid">


                  <div className="status-info-item">

                    <div className="info-icon blue">
                      <i className="bi bi-person-fill"></i>
                    </div>

                    <div>

                      <span>
                        CUSTOMER
                      </span>

                      <strong>
                        {queueData.customer_name}
                      </strong>

                    </div>

                  </div>


                  <div className="status-info-item">

                    <div className="info-icon green">
                      <i className="bi bi-building"></i>
                    </div>

                    <div>

                      <span>
                        BANKING SERVICE
                      </span>

                      <strong>
                        {queueData.service_name}
                      </strong>

                    </div>

                  </div>


                  <div className="status-info-item">

                    <div className="info-icon purple">
                      <i className="bi bi-signpost-2-fill"></i>
                    </div>

                    <div>

                      <span>
                        COUNTER
                      </span>

                      <strong>
                        Counter {queueData.counter_no}
                      </strong>

                    </div>

                  </div>


                  <div className="status-info-item">

                    <div className="info-icon orange">
                      <i className="bi bi-telephone-fill"></i>
                    </div>

                    <div>

                      <span>
                        PHONE NUMBER
                      </span>

                      <strong>
                        {queueData.phone}
                      </strong>

                    </div>

                  </div>

                </div>

              </section>


              {/* Side panel */}

              <aside className="status-side-panel">


                {/* Notification */}

                <div className="status-side-card notification-card">

                  <div className="side-card-icon">
                    <i className="bi bi-bell-fill"></i>
                  </div>

                  <h4>
                    Turn Notification
                  </h4>

                  <p>
                    You will receive a browser
                    notification when your turn
                    arrives.
                  </p>

                  <div className="notification-active">

                    <span className="notification-dot"></span>

                    Live notifications enabled

                  </div>

                </div>


                {/* Documents */}

                <div className="status-side-card documents-card">

                  <div className="documents-title">

                    <div className="side-card-icon document-icon">
                      <i className="bi bi-file-earmark-text-fill"></i>
                    </div>

                    <h4>
                      Required Documents
                    </h4>

                  </div>

                  <p>
                    Please keep these documents
                    ready before your turn.
                  </p>

                  <div className="document-box">

                    {queueData.required_documents}

                  </div>

                </div>


                {/* Refresh */}

                <button
                  className="refresh-status-button"
                  onClick={loadStatus}
                >

                  <i className="bi bi-arrow-clockwise"></i>

                  Refresh Status

                </button>

              </aside>

            </div>

          )}

        </div>

      </main>


      {/* Footer */}

      <footer className="status-footer">

        <i className="bi bi-bank2"></i>

        Smart Queue Management System

        <span>
          • Live queue tracking
        </span>

      </footer>

    </div>

  );
}

export default StatusPage;