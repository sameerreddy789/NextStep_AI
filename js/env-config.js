/**
 * Environment Configuration for Local Development
 * This file translates .env variables for the browser.
 * In production, these would be injected by your build tool/hosting provider.
 */
window.ENV = {
    VITE_FIREBASE_API_KEY: 'AIzaSyBx72z8rNYCfONq2A-Gat_kh8UUNWIQUZM',
    VITE_FIREBASE_AUTH_DOMAIN: 'nextstep-ai-c721a.firebaseapp.com',
    VITE_FIREBASE_DATABASE_URL: 'https://nextstep-ai-c721a-default-rtdb.asia-southeast1.firebasedatabase.app',
    VITE_FIREBASE_PROJECT_ID: 'nextstep-ai-c721a',
    VITE_FIREBASE_STORAGE_BUCKET: 'nextstep-ai-c721a.firebasestorage.app',
    VITE_FIREBASE_MESSAGING_SENDER_ID: '287110693541',
    VITE_FIREBASE_APP_ID: '1:287110693541:web:ffa0f18467b98eadb1c34c',
    VITE_FIREBASE_MEASUREMENT_ID: 'G-6V2YXFPCD5',
    VITE_SERP_API_KEY: '88d8886347c403796d943a3a925ff87fcf93fa4cd085b8d76a69f7a606f3cb39',
    VITE_GEMINI_API_KEY: 'AIzaSyBp8IHwLH0GCm0jWsJwN4Ht0u1rJKM0p4E'
};

console.log('🌍 Environment variables loaded locally');
