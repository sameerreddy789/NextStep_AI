
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// State
let currentStep = 1;
const totalSteps = 5;
let userData = {
    careerGoal: null,
    targetRole: null,
    jobReadyTimeline: null,
    preparationStyle: null,
    resumeStatus: 'pending'
};

// DOM Elements
const progressBar = document.getElementById('progress-bar');
const stepIndicator = document.getElementById('step-indicator');
const btnNext = document.getElementById('btn-next');
const btnBack = document.getElementById('btn-back');

// Init
document.addEventListener('DOMContentLoaded', () => {

    // Check Auth
    // Check Auth & Redirect if already onboarded
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = 'auth.html';
            return;
        }

        // Check if onboarding is already finished
        try {
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();

                // If roadmap is already generated, go straight to dashboard
                if (data.roadmapGenerated) {
                    window.location.href = 'dashboard.html';
                    return;
                }

                // If onboarding is done, go to next step (resume)
                if (data.onboardingCompleted) {
                    window.location.href = 'resume.html';
                    return;
                }

                // Restore State if exists (user in progress)
                if (data.careerGoal) {
                    userData = { ...userData, ...data };
                    // Optionally advance step if we saved that, for now just load data
                }
            }
        } catch (error) {
            console.error("Error checking user status:", error);
        }
    });

    // Event Listeners
    btnNext.addEventListener('click', nextStep);
    btnBack.addEventListener('click', prevStep);

    // Custom Role Input
    const roleInput = document.getElementById('custom-role-input');
    if (roleInput) {
        roleInput.addEventListener('input', (e) => {
            selectOption('targetRole', e.target.value, false); // Don't highlight cards
            // Visually deselect cards
            document.querySelectorAll('#step-2 .option-card').forEach(c => c.classList.remove('selected'));
        });
    }

    // Resume Upload
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('resume-upload');
    const removeFileBtn = document.getElementById('remove-file');

    uploadZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileUpload);
    removeFileBtn.addEventListener('click', removeFile);



    updateUI();
});

// Navigation
async function nextStep() {
    if (currentStep < totalSteps) {
        // Save progress to DB (optional: save every step)
        await saveProgress();

        currentStep++;
        updateUI();
    } else {
        finishOnboarding();
    }
}

function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        updateUI();
    }
}

function updateUI() {
    // Show/Hide Steps
    document.querySelectorAll('.step-content').forEach((el, index) => {
        if (index + 1 === currentStep) el.classList.remove('hidden');
        else el.classList.add('hidden');
    });

    // Update Progress
    const pct = ((currentStep) / totalSteps) * 100;
    progressBar.style.width = `${pct}%`;
    stepIndicator.textContent = `Step ${currentStep} of ${totalSteps}`;

    // Buttons
    btnBack.classList.toggle('hidden', currentStep === 1);
    btnNext.textContent = currentStep === totalSteps ? 'Finish' : 'Next';

    validateStep();
}

// Option Selection
window.selectOption = (key, value, highlight = true) => {
    userData[key] = value;

    // Visual Feedback
    const stepEl = document.getElementById(`step-${currentStep}`);
    if (highlight && stepEl) {
        stepEl.querySelectorAll('.option-card, .option-row').forEach(card => {
            // Check label text or click check
            if (card.innerText.includes(value) || card.textContent.includes(value)) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
    }

    validateStep();
};

function validateStep() {
    let isValid = false;

    switch (currentStep) {
        case 1: isValid = !!userData.careerGoal; break;
        case 2: isValid = !!userData.targetRole; break;
        case 3: isValid = !!userData.jobReadyTimeline; break;
        case 4: isValid = !!userData.preparationStyle; break;
        case 5: isValid = userData.resumeStatus === 'uploaded'; break; // Resume Mandatory
    }

    btnNext.disabled = !isValid;
}

// File Handling
function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
        document.getElementById('file-name').textContent = file.name;
        document.getElementById('file-preview').classList.remove('hidden');
        document.getElementById('upload-zone').classList.add('hidden');
        userData.resumeStatus = 'uploaded';

        // Note: In real app, upload to Firebase Storage here. 
        // For now, we simulate success.
        validateStep();
    }
}

function removeFile() {
    document.getElementById('file-preview').classList.add('hidden');
    document.getElementById('upload-zone').classList.remove('hidden');
    document.getElementById('resume-upload').value = '';
    userData.resumeStatus = 'pending';
    validateStep();
}

// Save & Finish
async function saveProgress() {
    const user = auth.currentUser;
    if (user) {
        try {
            await setDoc(doc(db, "users", user.uid), {
                ...userData,
                updatedAt: new Date().toISOString()
            }, { merge: true });
        } catch (e) {
            console.error("Save error:", e);
        }
    }
}

async function finishOnboarding() {
    const user = auth.currentUser;
    btnNext.textContent = "Generating Roadmap...";
    btnNext.disabled = true;

    if (user) {
        await setDoc(doc(db, "users", user.uid), {
            ...userData,
            onboardingCompleted: true,
            completedAt: new Date().toISOString()
        }, { merge: true });

        // Update Local Storage for Dashboard compatibility
        localStorage.setItem("userType", userData.careerGoal === 'Student' ? 'student' : 'careerGap');
        const nextStepUser = JSON.parse(localStorage.getItem('nextStep_user') || '{}');
        localStorage.setItem("nextStep_user", JSON.stringify({
            ...nextStepUser,
            targetRole: userData.targetRole
        }));

        // Mock Resume Data for Dashboard
        localStorage.setItem("nextStep_resume", JSON.stringify({
            readiness: 45,
            skills: ['JavaScript', 'HTML'],
            missing: ['React', 'Node.js']
        }));
    }

    // Redirect to Resume Analysis (Next Step in Flow)
    setTimeout(() => {
        window.location.href = 'resume.html';
    }, 1500);
}
