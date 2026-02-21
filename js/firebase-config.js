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
    apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
    authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
    databaseURL: getEnvVar('VITE_FIREBASE_DATABASE_URL'),
    projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: getEnvVar('VITE_FIREBASE_APP_ID'),
    measurementId: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID')
};

// Validate that required config values are present
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error('[Firebase] ❌ Missing required Firebase configuration. Ensure env-config.js is loaded before this module.');
}

// Initialize Firebase
import { getApps, getApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

export { auth, db, analytics };
