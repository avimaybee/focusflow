// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC-0EoBq0044_NX-NrUC7noM8_MA9jbT_8",
  authDomain: "focusflow-ai-w1jt3.firebaseapp.com",
  projectId: "focusflow-ai-w1jt3",
  storageBucket: "focusflow-ai-w1jt3.appspot.com",
  messagingSenderId: "434262671485",
  appId: "1:434262671485:web:8c0efe439951108b547114",
  measurementId: "G-WYWK9K2375"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
