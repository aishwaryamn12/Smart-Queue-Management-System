import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyC2PnFiMZTCx2EpuuRIIqZ6rvwpsRx7IBg",
  authDomain: "smart-queue-management-s-252dc.firebaseapp.com",
  projectId: "smart-queue-management-s-252dc",
  storageBucket: "smart-queue-management-s-252dc.firebasestorage.app",
  messagingSenderId: "733621352061",
  appId: "1:733621352061:web:8a1d3ae18c2345db566314"
};

const app = initializeApp(firebaseConfig);

const messaging = getMessaging(app);

export { app, messaging };