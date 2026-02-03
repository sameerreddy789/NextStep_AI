// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

// Helper function to get environment variables
// For static sites, you'll need to use a build tool like Vite or webpack to inject these
// Or use a simple approach with a config file that's git-ignored
function getEnvVar(key, defaultValue = '') {
    // Check if running in a build environment with injected variables
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        return import.meta.env[key] || defaultValue;
    }
    // Fallback for static deployment - load from window object if set
    if (typeof window !== 'undefined' && window.ENV) {
        return window.ENV[key] || defaultValue;
    }
    return defaultValue;
}

// Your web app's Firebase configuration
// NOTE: These values are loaded from environment variables (.env file)
// For production deployment:
// - Use your build tool (Vite/webpack) to inject environment variables
// - OR set up a config.js that loads from server-side rendered values
// 
// Security is enforced through Firebase Security Rules in the Firebase Console.
// Ensure you have properly configured:
// 1. Firestore Security Rules (restrict read/write to authenticated users)
// 2. Authentication rules (domain restrictions, email verification)
// 3. Storage rules (if using Firebase Storage)
const firebaseConfig = {
    apiKey: getEnvVar('VITE_FIREBASE_API_KEY', 'AIzaSyBx72z8rNYCfONq2A-Gat_kh8UUNWIQUZM'),
    authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN', 'nextstep-ai-c721a.firebaseapp.com'),
    databaseURL: getEnvVar('VITE_FIREBASE_DATABASE_URL', 'https://nextstep-ai-c721a-default-rtdb.asia-southeast1.firebasedatabase.app'),
    projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID', 'nextstep-ai-c721a'),
    storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET', 'nextstep-ai-c721a.firebasestorage.app'),
    messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID', '287110693541'),
    appId: getEnvVar('VITE_FIREBASE_APP_ID', '1:287110693541:web:ffa0f18467b98eadb1c34c'),
    measurementId: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID', 'G-6V2YXFPCD5')
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

export { auth, db, analytics };
