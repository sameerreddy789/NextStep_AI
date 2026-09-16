// @ts-check
import { auth, db } from './firebase-config.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { UIUtils } from './ui-utils.js';
import { appState } from './app-state.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const loginForm = document.getElementById('login-view');
    const signupForm = document.getElementById('signup-view');
    const authTitle = document.getElementById('auth-title');
    const authSubtitle = document.getElementById('auth-subtitle');

    /**
     * Toggle between Login and Signup views
     * @param {'login'|'signup'} view 
     */
    // @ts-ignore
    window.toggleView = (view) => {
        const isLogin = view === 'login';
        loginForm?.classList.toggle('hidden', !isLogin);
        signupForm?.classList.toggle('hidden', isLogin);
        if (authTitle) authTitle.textContent = isLogin ? 'Welcome back' : 'Create Account';
        if (authSubtitle) authSubtitle.textContent = isLogin ? 'Sign in to your account to continue' : 'Join NextStep AI to start your journey';
    };

    /**
     * Toggle password visibility
     */
    // @ts-ignore
    window.togglePassword = (inputId, btn) => {
        const input = /** @type {HTMLInputElement} */ (document.getElementById(inputId));
        if (input.type === 'password') {
            input.type = 'text';
            btn.style.color = 'var(--accent-primary)';
        } else {
            input.type = 'password';
            btn.style.color = 'var(--text-muted)';
        }
    };

    /**
     * Post-authentication logic: sync state and redirect
     */
    async function handlePostAuth(user) {
        localStorage.removeItem('demoMode');
        UIUtils.showLoader('Syncing your profile...');

        try {
            await appState.init(true); // Force refresh from Firestore

            const userData = appState.user;
            if (!userData) throw new Error('Failed to load user profile');

            // If new user (no target role set yet)
            if (!userData.targetRole) {
                window.location.href = "/pages/onboarding.html";
                return;
            }

            // Progress-based redirection
            if (appState.roadmap) {
                window.location.href = "/pages/dashboard.html";
            } else if (appState.interviews.length > 0) {
                window.location.href = "/pages/roadmap.html";
            } else if (appState.resumeData) {
                window.location.href = "/pages/interview.html";
            } else {
                window.location.href = "/pages/resume.html";
            }
        } catch (error) {
            console.error('[Auth] Post-auth error:', error);
            UIUtils.showToast('Login successful, but profile sync failed.', 'warning');
            window.location.href = "/pages/dashboard.html"; // Fallback
        } finally {
            UIUtils.hideLoader();
        }
    }

    // Login Handler
    document.getElementById('form-login')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = /** @type {HTMLInputElement} */ (document.getElementById('login-email')).value;
        const password = /** @type {HTMLInputElement} */ (document.getElementById('login-password')).value;
        const btn = /** @type {HTMLButtonElement} */ (e.target).querySelector('button[type="submit"]');

        if (btn) btn.disabled = true;
        
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            await handlePostAuth(userCredential.user);
        } catch (error) {
            console.error('[Auth] Login failed:', error);
            UIUtils.showToast(error.message || 'Sign in failed', 'error');
            if (btn) btn.disabled = false;
        }
    });

    // Signup Handler
    document.getElementById('form-signup')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = /** @type {HTMLInputElement} */ (document.getElementById('signup-email')).value;
        const password = /** @type {HTMLInputElement} */ (document.getElementById('signup-password')).value;
        const btn = /** @type {HTMLButtonElement} */ (e.target).querySelector('button[type="submit"]');

        if (btn) btn.disabled = true;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const userData = {
                uid: user.uid,
                email: email,
                name: email.split('@')[0],
                createdAt: new Date().toISOString(),
                onboardingCompleted: false
            };

            await setDoc(doc(db, "users", user.uid), userData);
            await handlePostAuth(user);
        } catch (error) {
            console.error('[Auth] Signup failed:', error);
            UIUtils.showToast(error.message || 'Account creation failed', 'error');
            if (btn) btn.disabled = false;
        }
    });

    // Google Sign In
    // @ts-ignore
    window.handleGoogleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            await handlePostAuth(result.user);
        } catch (error) {
            console.error('[Auth] Google Sign-in failed:', error);
            UIUtils.showToast('Google sign-in failed', 'error');
        }
    };
    // @ts-ignore
    window.handleGoogleAuth = window.handleGoogleSignIn;

    // Forgot Password
    // @ts-ignore
    window.handleForgotPassword = async () => {
        const email = /** @type {HTMLInputElement} */ (document.getElementById('login-email')).value.trim();
        if (!email) {
            UIUtils.showToast('Please enter your email first', 'warning');
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
            UIUtils.showToast('Reset email sent! Check your inbox.', 'success');
        } catch (error) {
            UIUtils.showToast('Failed to send reset email', 'error');
        }
    };
});
