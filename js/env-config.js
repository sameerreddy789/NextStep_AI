/**
 * Environment Configuration for Local Development
 * This file translates .env variables for the browser.
 * In production, these would be injected by your build tool/hosting provider.
 */
window.ENV = {
    VITE_FIREBASE_API_KEY: 'YOUR_FIREBASE_API_KEY',
    VITE_FIREBASE_AUTH_DOMAIN: 'YOUR_FIREBASE_AUTH_DOMAIN',
    VITE_FIREBASE_DATABASE_URL: 'YOUR_FIREBASE_DATABASE_URL',
    VITE_FIREBASE_PROJECT_ID: 'YOUR_FIREBASE_PROJECT_ID',
    VITE_FIREBASE_STORAGE_BUCKET: 'YOUR_FIREBASE_STORAGE_BUCKET',
    VITE_FIREBASE_MESSAGING_SENDER_ID: 'YOUR_FIREBASE_SENDER_ID',
    VITE_FIREBASE_APP_ID: 'YOUR_FIREBASE_APP_ID',
    VITE_FIREBASE_MEASUREMENT_ID: 'YOUR_FIREBASE_MEASUREMENT_ID',
    VITE_SERP_API_KEY: 'YOUR_SERP_API_KEY',
    VITE_GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY'
};

console.log('🌍 Environment variables loaded locally');
