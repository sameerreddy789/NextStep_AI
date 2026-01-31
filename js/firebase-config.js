// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBx72z8rNYCfONq2A-Gat_kh8UUNWIQUZM",
    authDomain: "nextstep-ai-c721a.firebaseapp.com",
    databaseURL: "https://nextstep-ai-c721a-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "nextstep-ai-c721a",
    storageBucket: "nextstep-ai-c721a.firebasestorage.app",
    messagingSenderId: "287110693541",
    appId: "1:287110693541:web:ffa0f18467b98eadb1c34c",
    measurementId: "G-6V2YXFPCD5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

export { auth, db, analytics };
