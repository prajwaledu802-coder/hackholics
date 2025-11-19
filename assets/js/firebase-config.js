// assets/js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.6.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.6.1/firebase-analytics.js";

// Your Firebase config (inserted)
const firebaseConfig = {
  apiKey: "AIzaSyDXBOQwix0xfphjHTPFdEjx07NRF2yEtbc",
  authDomain: "ai-student-assistant-4b3d2.firebaseapp.com",
  projectId: "ai-student-assistant-4b3d2",
  storageBucket: "ai-student-assistant-4b3d2.firebasestorage.app",
  messagingSenderId: "514233455470",
  appId: "1:514233455470:web:95584fe70faec2518f677f",
  measurementId: "G-FEQZM4PHB1"
};

const app = initializeApp(firebaseConfig);
try { getAnalytics(app); } catch(e){/* ignore analytics errors in test */}
export const auth = getAuth(app);
export const db = getFirestore(app);
