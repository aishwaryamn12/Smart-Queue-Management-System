importScripts(
  "https://www.gstatic.com/firebasejs/12.0.0/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-compat.js"
);


const firebaseConfig = {
  apiKey: "AIzaSyC2PnFiMZTCx2EpuuRIIqZ6rvwpsRx7IBg",
  authDomain: "smart-queue-management-s-252dc.firebaseapp.com",
  projectId: "smart-queue-management-s-252dc",
  storageBucket: "smart-queue-management-s-252dc.firebasestorage.app",
  messagingSenderId: "733621352061",
  appId: "1:733621352061:web:8a1d3ae18c2345db566314"
};


firebase.initializeApp(firebaseConfig);


const messaging = firebase.messaging();


messaging.onBackgroundMessage(
  function (payload) {

    console.log(
      "Background notification received:",
      payload
    );

    const notificationTitle =
      payload.notification?.title ||
      payload.data?.title ||
      "Smart Queue Management";

    const notificationOptions = {

      body:
        payload.notification?.body ||
        payload.data?.body ||
        "Your queue status has been updated.",

      icon: "/favicon.ico",

      badge: "/favicon.ico",

      data: payload.data || {}

    };


    self.registration.showNotification(
      notificationTitle,
      notificationOptions
    );

  }
);