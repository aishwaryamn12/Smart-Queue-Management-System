import { getToken } from "firebase/messaging";
import { messaging } from "./firebase";

const API_URL = "http://127.0.0.1:5000";

const VAPID_KEY =
  "BHshzGG7XRF6z-uM0iR9nX_uIuy_rrTnZzeZsmK_M74AONYhD_QDN9CxKaI7t0prSU19GvJoxBGGq1PTV5I623o";


export async function requestNotificationPermission() {

  try {

    // -----------------------------------------
    // Check notification support
    // -----------------------------------------

    if (!("Notification" in window)) {

      console.log(
        "This browser does not support notifications."
      );

      return null;
    }


    // -----------------------------------------
    // Permission
    // -----------------------------------------

    const permission =
      await Notification.requestPermission();


    console.log(
      "Notification permission:",
      permission
    );


    if (permission !== "granted") {

      console.log(
        "Notification permission was not granted."
      );

      return null;
    }


    console.log(
      "Notification permission granted."
    );


    // -----------------------------------------
    // Service worker
    // -----------------------------------------

    const serviceWorkerRegistration =
      await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
      );


    console.log(
      "Firebase service worker registered."
    );


    // -----------------------------------------
    // FCM token
    // -----------------------------------------

    const token = await getToken(
      messaging,
      {
        vapidKey: VAPID_KEY,

        serviceWorkerRegistration:
          serviceWorkerRegistration
      }
    );


    if (!token) {

      console.log(
        "FCM token was not generated."
      );

      return null;
    }


    console.log(
      "FCM token generated successfully."
    );


    console.log(
      "FCM TOKEN:",
      token
    );


    // -----------------------------------------
    // Customer ID
    // -----------------------------------------

    const customerId =
      localStorage.getItem(
        "customer_id"
      );


    if (!customerId) {

      console.log(
        "Customer ID not found."
      );

      return token;
    }


    // -----------------------------------------
    // Send token to Flask
    //
    // IMPORTANT:
    // text/plain avoids JSON CORS preflight.
    // -----------------------------------------

    const response = await fetch(
      `${API_URL}/save-notification-token`,
      {
        method: "POST",

        headers: {
          "Content-Type": "text/plain"
        },

        body: JSON.stringify({
          customer_id:
            Number(customerId),

          token: token
        })
      }
    );


    const result =
      await response.json();


    console.log(
      "Notification token response:",
      result
    );


    if (
      result.status === "success"
    ) {

      console.log(
        "FCM token saved to database successfully."
      );

    } else {

      console.error(
        "FCM token was not saved:",
        result.message
      );

    }


    return token;


  } catch (error) {

    console.error(
      "Firebase notification error:",
      error
    );

    return null;
  }
}