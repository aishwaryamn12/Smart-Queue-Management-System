import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "./firebase";

const VAPID_KEY =
  "BHshzGG7XRF6z-uM0iR9nX_uIuy_rrTnZzeZsmK_M74AONYhD_QDN9CxKaI7t0prSU19GvJoxBGGq1PTV5I623o";

// Request notification permission and get FCM token
export const requestNotificationPermission = async () => {
  try {
    // Check browser support
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications.");
      return null;
    }

    // Ask permission
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("Notification permission denied.");
      return null;
    }

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
    });

    if (!token) {
      console.log("FCM token was not generated.");
      return null;
    }

    console.log("FCM Token:", token);

    return token;

  } catch (error) {
    console.error("FCM notification error:", error);
    return null;
  }
};


// Listen for notifications when website is open
export const listenForMessages = (callback) => {
  return onMessage(messaging, (payload) => {

    console.log("Foreground notification:", payload);

    if (callback) {
      callback(payload);
    }

  });
};