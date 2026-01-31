
import { auth, db } from './firebase-config.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    // State
    let currentView = 'login';
    let userType = '';

    // Elements
    const loginForm = document.getElementById('login-view');
    const signupForm = document.getElementById('signup-view');
    const authTitle = document.getElementById('auth-title');
    const authSubtitle = document.getElementById('auth-subtitle');
    const signupStep1 = document.getElementById('signup-step-1');
    const signupStep2 = document.getElementById('signup-step-2');

    // Toggle View (Login vs Signup)
    window.toggleView = (view) => {
        currentView = view;
        if (view === 'login') {
            loginForm.classList.remove('hidden');
            signupForm.classList.add('hidden');
            authTitle.textContent = 'Welcome back';
            authSubtitle.textContent = 'Sign in to your account to continue';
        } else {
            loginForm.classList.add('hidden');
            signupForm.classList.remove('hidden');
            authTitle.textContent = 'Create Account';
            authSubtitle.textContent = 'Choose your profile type to get started';
            // Reset signup step
            showSignupStep(1);
        }
    };

    // Password Toggle
    window.togglePassword = (inputId, btn) => {
        const input = document.getElementById(inputId);
        const icon = btn.querySelector('svg');
        if (input.type === 'password') {
            input.type = 'text';
            btn.style.color = '#7c3aed';
        } else {
            input.type = 'password';
            btn.style.color = 'var(--muted-foreground)';
        }
    };

    // Signup Handling
    window.selectProfile = (type) => {
        userType = type;
        document.querySelectorAll('.profile-card').forEach(card => card.classList.remove('selected'));
        const selected = document.getElementById(`card-${type}`);
        if (selected) selected.classList.add('selected');
        document.getElementById('profile-continue-btn').disabled = false;
    };

    window.nextSignupStep = () => {
        if (!userType) return;
        showSignupStep(2);

        // Show relevant fields
        document.getElementById('student-fields').classList.toggle('hidden', userType !== 'student');
        document.getElementById('career-gap-fields').classList.toggle('hidden', userType !== 'careerGap');
    };

    window.prevSignupStep = () => {
        showSignupStep(1);
    };

    function showSignupStep(step) {
        if (step === 1) {
            signupStep1.classList.remove('hidden');
            signupStep2.classList.add('hidden');
            authTitle.textContent = 'Create Account';
            authSubtitle.textContent = 'Choose your profile type';
        } else {
            signupStep1.classList.add('hidden');
            signupStep2.classList.remove('hidden');
            authTitle.textContent = 'Enter Details';
            authSubtitle.textContent = 'Fill in your information to continue';
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
            btn.textContent = "Signing in...";

            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Fetch user profile from Firestore to get userType
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const userData = docSnap.data();
                localStorage.setItem("userType", userData.userType || "student");
                localStorage.setItem("nextStep_user", JSON.stringify({
                    name: userData.name,
                    email: user.email,
                    uid: user.uid
                }));
            } else {
                // Fallback if no firestore doc
                localStorage.setItem("userType", "student");
            }

            window.location.href = "dashboard.html";

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

        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const targetRole = document.getElementById('signup-role').value;
        const btn = e.target.querySelector('button[type="submit"]');

        try {
            btn.disabled = true;
            btn.textContent = "Creating Account...";

            // 1. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Update Display Name
            await updateProfile(user, { displayName: name });

            // 3. Save extra data to Firestore
            await setDoc(doc(db, "users", user.uid), {
                name: name,
                email: email,
                userType: userType,
                targetRole: targetRole,
                createdAt: new Date().toISOString()
            });

            // 4. Local Storage for Dashboard Access
            localStorage.setItem("userType", userType);
            localStorage.setItem("nextStep_user", JSON.stringify({
                name: name,
                email: email,
                uid: user.uid
            }));

            alert("Account created successfully!");
            window.location.href = "dashboard.html";

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

            // Check if user exists in Firestore
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                // Existing user
                const userData = docSnap.data();
                localStorage.setItem("userType", userData.userType);
                localStorage.setItem("nextStep_user", JSON.stringify({
                    name: userData.name,
                    email: user.email,
                    uid: user.uid
                }));
                window.location.href = "dashboard.html";
            } else {
                // New User - Quick Prompt for Role
                // In a production app, you might redirect to an onboarding 
                // page. Here we'll use a prompt for simplicity.
                let type = prompt("Welcome! Are you a Student or Career Gap professional? (Type 'student' or 'careerGap')");
                if (type !== 'student' && type !== 'careerGap') type = 'student'; // Default

                await setDoc(doc(db, "users", user.uid), {
                    name: user.displayName,
                    email: user.email,
                    userType: type,
                    targetRole: 'sde', // Default
                    createdAt: new Date().toISOString()
                });

                localStorage.setItem("userType", type);
                localStorage.setItem("nextStep_user", JSON.stringify({
                    name: user.displayName,
                    email: user.email,
                    uid: user.uid
                }));
                window.location.href = "dashboard.html";
            }

        } catch (error) {
            console.error(error);
            alert("Google Sign In Error: " + error.message);
        }
    };
});
