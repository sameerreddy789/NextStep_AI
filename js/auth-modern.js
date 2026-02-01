
import { auth, db } from './firebase-config.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    // State
    const loginForm = document.getElementById('login-view');
    const signupForm = document.getElementById('signup-view');
    const authTitle = document.getElementById('auth-title');
    const authSubtitle = document.getElementById('auth-subtitle');

    // Toggle View (Login vs Signup)
    window.toggleView = (view) => {
        if (view === 'login') {
            loginForm.classList.remove('hidden');
            signupForm.classList.add('hidden');
            authTitle.textContent = 'Welcome back';
            authSubtitle.textContent = 'Sign in to your account to continue';
        } else {
            loginForm.classList.add('hidden');
            signupForm.classList.remove('hidden');
            authTitle.textContent = 'Create Account';
            authSubtitle.textContent = 'Join NextStep AI to start your journey';
        }
    };

    // Password Toggle
    window.togglePassword = (inputId, btn) => {
        const input = document.getElementById(inputId);
        if (input.type === 'password') {
            input.type = 'text';
            btn.style.color = '#7c3aed';
        } else {
            input.type = 'password';
            btn.style.color = 'var(--muted-foreground)';
        }
    };

    // Helper: Check Onboarding Status & Redirect
    async function checkAndRedirect(user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().roadmapGenerated) { // Changed from onboardingCompleted
            window.location.href = "dashboard.html";
        } else {
            // Modified: All users go to resume upload first if strict flow is required
            // Route guard on resume.html isn't strictly pushing *forward* yet, 
            // but let's send them to the start of the funnel.
            window.location.href = "resume.html";
        }
    }

    // ==========================================
    // FIREBASE AUTH LOGIC
    // ==========================================

    // LOGIN
    document.getElementById('form-login').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const btn = e.target.querySelector('button[type="submit"]');

        try {
            btn.disabled = true;
            btn.innerHTML = `<span class="loading-spinner"></span> Signing in...`; // Optional spinner CSS

            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            await checkAndRedirect(userCredential.user);

        } catch (error) {
            console.error(error);
            alert("Login Failed: " + error.message);
            btn.disabled = false;
            btn.textContent = "Sign In";
        }
    });

    // SIGN UP
    document.getElementById('form-signup').addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const btn = e.target.querySelector('button[type="submit"]');

        try {
            btn.disabled = true;
            btn.textContent = "Creating Account...";

            // 1. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Initialize Firestore Doc (Empty but exists)
            await setDoc(doc(db, "users", user.uid), {
                email: email,
                createdAt: new Date().toISOString(),
                onboardingCompleted: false,
                roadmapGenerated: false
            });

            // 3. Redirect to Resume Upload
            window.location.href = "resume.html";

        } catch (error) {
            console.error(error);
            alert("Signup Failed: " + error.message);
            btn.disabled = false;
            btn.textContent = "Create Account";
        }
    });

    // GOOGLE AUTH
    window.handleGoogleAuth = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if user doc exists
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                // First time user -> Create doc -> Onboarding
                await setDoc(doc(db, "users", user.uid), {
                    email: user.email,
                    name: user.displayName,
                    createdAt: new Date().toISOString(),
                    onboardingCompleted: false, // Legacy flag
                    roadmapGenerated: false
                });
                window.location.href = "resume.html";
            } else {
                // Existing user -> Check status
                if (docSnap.data().roadmapGenerated) {
                    window.location.href = "dashboard.html";
                } else {
                    window.location.href = "resume.html";
                }
            }

        } catch (error) {
            console.error(error);
            alert("Google Sign In Error: " + error.message);
        }
    };
});
