
// Route Guard - Protects pages that require authentication
// Now with Unified App Instance and Nuclear Blocking Loader + Retry Logic

const PROTECTED_PAGES = ['dashboard.html', 'roadmap.html', 'interview.html', 'resume.html', 'studio.html'];
const CURRENT_PAGE = window.location.pathname.split('/').pop();

// Helper to get cookies (if needed, but we rely on Firebase Auth + LocalStorage)
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

(function () {
    console.log('[RouteGuard] Checking access for:', CURRENT_PAGE);

    // Allow public pages
    if (!PROTECTED_PAGES.includes(CURRENT_PAGE) && CURRENT_PAGE !== '') {
        return;
    }

    // Check LocalStorage Flags
    const state = {
        onboarding: localStorage.getItem('nextStep_onboardingCompleted') === 'true',
        roadmap: localStorage.getItem('nextStep_roadmapCompleted') === 'true'
    };

    // 1. Basic Redirects based on flags
    if (CURRENT_PAGE === 'dashboard.html') {
        if (!state.onboarding) {
            window.location.href = 'onboarding.html';
            return;
        }
    } else if (CURRENT_PAGE === 'onboarding.html') {
        if (state.onboarding) {
            window.location.href = 'dashboard.html';
            return;
        }
    } else if (CURRENT_PAGE === 'resume.html') {
        if (!state.onboarding) {
            window.location.href = 'onboarding.html';
            return;
        }
    }

    // 2. Auth Verification
    // Use the stored user as a fast initial check
    const storedUser = localStorage.getItem('nextStep_user');
    if (!storedUser) {
        window.location.href = 'auth.html';
        return;
    }

    // Async Firebase auth verification with BLOCKING LOADER
    // This prevents "glitchy" redirects by waiting for a definitive answer from Firebase
    import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js").then(({ getAuth, onAuthStateChanged }) => {
        import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js").then(({ initializeApp, getApps, getApp }) => {

            // 1. Show Blocking Loader immediately if we suspect a user exists
            if (localStorage.getItem('nextStep_user')) {
                const loader = document.createElement('div');
                loader.id = 'auth-checking-loader';
                loader.innerHTML = `
                    <style>
                        #auth-checking-loader {
                            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                            background: #0f172a; z-index: 999999;
                            display: flex; justify-content: center; align-items: center;
                            color: white; font-family: sans-serif; flex-direction: column;
                        }
                        .rg-spinner {
                            width: 50px; height: 50px; border: 3px solid rgba(255,255,255,0.3);
                            border-radius: 50%; border-top-color: #6366f1;
                            animation: rg-spin 1s ease-in-out infinite; margin-bottom: 20px;
                        }
                        @keyframes rg-spin { to { transform: rotate(360deg); } }
                    </style>
                    <div class="rg-spinner"></div>
                <p>Verifying session...</p>
                `;
                // Append to documentElement (<html>) because body might not exist yet if script is in <head>
                if (document.body) {
                    document.body.appendChild(loader);
                } else {
                    document.documentElement.appendChild(loader);
                }
            }

            // Use existing app if available, or init from window.ENV
            const cfg = window.ENV || {};
            try {
                let app;
                if (getApps().length > 0) {
                    app = getApp(); // Use default app
                    console.log('[RouteGuard] Using existing default app for check');
                } else {
                    app = initializeApp({
                        apiKey: cfg.VITE_FIREBASE_API_KEY,
                        authDomain: cfg.VITE_FIREBASE_AUTH_DOMAIN,
                        projectId: cfg.VITE_FIREBASE_PROJECT_ID,
                        storageBucket: cfg.VITE_FIREBASE_STORAGE_BUCKET,
                        messagingSenderId: cfg.VITE_FIREBASE_MESSAGING_SENDER_ID,
                        appId: cfg.VITE_FIREBASE_APP_ID,
                        measurementId: cfg.VITE_FIREBASE_MEASUREMENT_ID
                    });
                    console.log('[RouteGuard] Initialized new default app for check');
                }
                const authInstance = getAuth(app);

                // 2. Wait for definitive Auth State (with Retry Mechanism)
                let retryCount = 0;
                const maxRetries = 3;

                const checkAuth = (user) => {
                    if (user) {
                        // Success - user is logged in
                        const loader = document.getElementById('auth-checking-loader');
                        if (loader) loader.remove();
                        console.log('[RouteGuard] Auth State Resolves: Logged In');
                        // Cleanup listener
                        unsubscribe();
                        return;
                    }

                    // User is null - retry or redirect
                    if (retryCount < maxRetries) {
                        retryCount++;
                        console.warn(`[RouteGuard] Auth returned null. Retrying (${retryCount}/${maxRetries})...`);
                        setTimeout(() => {
                            // Re-check current user from instance directly
                            // Note: onAuthStateChanged might fire again if state changes, but we also manually poll here
                            checkAuth(authInstance.currentUser);
                        }, 1000); // Wait 1s between retries (slower check for stability)
                    } else {
                        // Definitely logged out after retries
                        const loader = document.getElementById('auth-checking-loader');
                        if (loader) loader.remove();

                        if (CURRENT_PAGE !== 'auth.html' && CURRENT_PAGE !== 'index.html' && CURRENT_PAGE !== '') {
                            console.warn('[RouteGuard] No user found after retries. Redirecting to login.');
                            // Do NOT clear nextStep_user immediately, just redirect.
                            // If they login again, it will overwrite.
                            window.location.href = 'auth.html';
                        }
                        unsubscribe();
                    }
                };

                const unsubscribe = onAuthStateChanged(authInstance, (user) => {
                    // Only trigger the check logic if we haven't already succeeded
                    // (Note: onAuthStateChanged can fire multiple times)
                    if (user) {
                        checkAuth(user);
                    } else {
                        // If null, start the retry sequence
                        checkAuth(null);
                    }
                });

            } catch (e) {
                console.warn('[RouteGuard] Auth check skipped:', e.message);
                const loader = document.getElementById('auth-checking-loader');
                if (loader) loader.remove();
            }
        });
    }).catch((e) => {
        console.warn('[RouteGuard] Could not load Firebase Auth for verification', e);
        const loader = document.getElementById('auth-checking-loader');
        if (loader) loader.remove();
    });

})();
