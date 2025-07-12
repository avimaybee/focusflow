"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.functions = exports.storage = exports.db = exports.auth = exports.app = void 0;
// Import the functions you need from the SDKs you need
const app_1 = require("firebase/app");
const auth_1 = require("firebase/auth");
const firestore_1 = require("firebase/firestore");
const storage_1 = require("firebase/storage");
const functions_1 = require("firebase/functions");
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
const app = !(0, app_1.getApps)().length ? (0, app_1.initializeApp)(firebaseConfig) : (0, app_1.getApp)();
exports.app = app;
const auth = (0, auth_1.getAuth)(app);
exports.auth = auth;
const db = (0, firestore_1.getFirestore)(app);
exports.db = db;
const storage = (0, storage_1.getStorage)(app);
exports.storage = storage;
const functions = (0, functions_1.getFunctions)(app);
exports.functions = functions;
//# sourceMappingURL=firebase.js.map