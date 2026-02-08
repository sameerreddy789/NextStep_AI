/**
 * Interview Engine - Manages the state and logic for AI Interviews
 */

const QUESTIONS = {
    mixed: [
        { type: 'code', category: 'Data Structures', text: 'Implement a function to check if a string is a palindrome.' },
        { type: 'text', category: 'Behavioral', text: 'Tell me about a time you had a conflict with a team member. How did you resolve it?' },
        { type: 'code', category: 'Algorithms', text: 'Write a function to find the first non-repeating character in a string.' },
        { type: 'text', category: 'System Design', text: 'How would you design a URL shortening service like bit.ly? Explain the key components.' },
        { type: 'code', category: 'JavaScript', text: 'Write a function that flattens a nested array of any depth.' },
        { type: 'text', category: 'Leadership', text: 'Describe a situation where you had to lead a project under tight deadlines.' },
        { type: 'code', category: 'Problem Solving', text: 'Given an array of integers, find two numbers that add up to a specific target.' },
        { type: 'text', category: 'Databases', text: 'Explain the difference between SQL and NoSQL databases. When would you choose one over the other?' }
    ]
};

const BOILERPLATES = {
    javascript: "// Write your solution here\nfunction solution() {\n    \n}",
    python: "# Write your solution here\ndef solution():\n    pass",
    java: "// Write your solution here\nclass Solution {\n    public void solve() {\n        \n    }\n}",
    cpp: "// Write your solution here\n#include <iostream>\n\nvoid solution() {\n    \n}"
};

let currentMode = 'mixed';
let currentQuestionIndex = 0;
let answers = [];
let timerInterval = null;
let timeLeft = 2700; // 45 minutes global
let initialTime = 2700;
let autoSaveInterval = null;
let AI_QUESTIONS = null;

// Initialize on DOM Load
document.addEventListener('DOMContentLoaded', () => {
    const userData = JSON.parse(localStorage.getItem('nextStep_user') || '{}');
    const userName = document.getElementById('user-name');
    const userAvatar = document.getElementById('user-avatar');
    const userRole = document.getElementById('user-role');

    if (userName && userData.name) userName.textContent = userData.name;
    if (userAvatar && userData.name) userAvatar.textContent = userData.name.charAt(0).toUpperCase();
    if (userRole && userData.targetRole) {
        const roleNames = { 'sde': 'Software Developer', 'frontend': 'Frontend Dev', 'backend': 'Backend Dev' };
        userRole.textContent = roleNames[userData.targetRole] || userData.targetRole;
    }

    // Auto-save logic
    autoSaveInterval = setInterval(() => {
        if (answers.length > 0) {
            localStorage.setItem('nextStep_interview_autosave', JSON.stringify({
                mode: currentMode,
                answers: answers,
                currentIndex: currentQuestionIndex,
                lastSaved: new Date().toISOString()
            }));
        }
    }, 10000);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
        if (e.key === 'Enter' && e.ctrlKey) submitAnswer();
        else if (e.key === 'Escape') skipQuestion();
    });

    // Language Sync Logic
    const langSelect = document.getElementById('language-select');
    const editorLangSelect = document.getElementById('editor-lang-select');

    window.handleLangChange = (lang) => {
        if (window.EditorManager) {
            window.EditorManager.setLanguage(lang);
            if (langSelect) langSelect.value = lang;
            if (editorLangSelect) editorLangSelect.value = lang;
            if (window.MonacoEditor) {
                const currentVal = window.MonacoEditor.getValue();
                if (!currentVal || currentVal.includes('Hello World')) {
                    const newCode = BOILERPLATES[lang];
                    if (newCode) window.MonacoEditor.setValue(newCode);
                }
            }
        }
    };

    if (langSelect) langSelect.addEventListener('change', (e) => handleLangChange(e.target.value));
    if (editorLangSelect) editorLangSelect.addEventListener('change', (e) => handleLangChange(e.target.value));
});

// Modal Helpers
window.showAlert = function (message, icon = '⚠️', title = 'Alert') {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-modal');
        document.getElementById('modal-icon').textContent = icon;
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-message').textContent = message;
        document.getElementById('modal-cancel').classList.add('hidden');
        const confirmBtn = document.getElementById('modal-confirm');
        confirmBtn.textContent = 'OK';
        modal.classList.remove('hidden');

        const handleConfirm = () => {
            modal.classList.add('hidden');
            confirmBtn.removeEventListener('click', handleConfirm);
            resolve(true);
        };
        confirmBtn.addEventListener('click', handleConfirm);
    });
};

window.showConfirm = function (message, icon = '❓', title = 'Confirm') {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-modal');
        document.getElementById('modal-icon').textContent = icon;
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-message').textContent = message;
        const cancelBtn = document.getElementById('modal-cancel');
        const confirmBtn = document.getElementById('modal-confirm');
        cancelBtn.classList.remove('hidden');
        confirmBtn.textContent = 'OK';
        cancelBtn.textContent = 'Cancel';
        modal.classList.remove('hidden');

        const handleConfirm = () => { modal.classList.add('hidden'); cleanup(); resolve(true); };
        const handleCancel = () => { modal.classList.add('hidden'); cleanup(); resolve(false); };
        const cleanup = () => {
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
        };
        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
    });
};

// Timer Logic
window.startTimer = function () {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft === 30) {
            const timerEl = document.getElementById('timer');
            if (timerEl) {
                timerEl.style.color = '#ef4444';
                timerEl.style.animation = 'pulse 1s infinite';
            }
        }
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            showAlert('Time is up! Moving to next question...', '⏰', 'Time Expired').then(() => {
                currentQuestionIndex++;
                const questions = getQuestions();
                if (currentQuestionIndex >= questions.length) completeInterview();
                else showQuestion();
            });
        }
    }, 1000);
};

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timerDisplay = document.getElementById('timer');
    const progressCircle = document.querySelector('.timer-progress');

    if (timerDisplay) {
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        // Update circular progress
        if (progressCircle) {
            const circumference = 2 * Math.PI * 45; // r=45
            const offset = circumference - (timeLeft / initialTime) * circumference;
            progressCircle.style.strokeDashoffset = offset;

            // Dynamic color
            const percent = (timeLeft / initialTime) * 100;
            if (percent < 20) {
                progressCircle.style.stroke = '#ef4444'; // Red
            } else if (percent < 50) {
                progressCircle.style.stroke = 'var(--accent-gold)'; // Yellow/Gold
            } else {
                progressCircle.style.stroke = 'var(--accent-primary)'; // Blue
            }
        }

        if (timeLeft <= 30) {
            timerDisplay.style.color = '#ef4444';
            timerDisplay.style.animation = 'pulse 1s infinite';
        } else {
            timerDisplay.style.color = 'var(--text-primary)';
            timerDisplay.style.animation = 'none';
        }
    }
}

// Interview Flow
window.startInterview = async function (mode) {
    currentMode = mode;
    currentQuestionIndex = 0;
    answers = [];

    document.getElementById('mode-selection').classList.add('hidden');
    document.getElementById('interview-section').classList.remove('hidden');
    document.getElementById('interview-mode-badge').textContent = 'Adaptive Interview';

    // Show video slot
    const videoSlot = document.querySelector('.floating-cam');
    if (videoSlot) videoSlot.classList.remove('hidden');

    const resumeData = JSON.parse(localStorage.getItem('nextStep_resume') || '{}');
    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    const userData = JSON.parse(localStorage.getItem('nextStep_user') || '{}');
    const targetRole = userProfile.targetRole || userData.targetRole || 'sde';

    if (window.GeminiService && window.GeminiService.isAvailable() && resumeData.skills) {
        try {
            const skills = [...(resumeData.skills.present || []), ...(resumeData.skills.partial || [])];
            AI_QUESTIONS = await window.GeminiService.generateQuestions(skills, targetRole, mode, 8);
        } catch (error) {
            AI_QUESTIONS = null;
        }
    }

    const questions = getQuestions();
    const nav = document.getElementById('question-nav');
    nav.innerHTML = questions.map((_, i) => `<div class="nav-btn ${i === 0 ? 'active' : ''}" onclick="jumpToQuestion(${i})">${i + 1}</div>`).join('');

    showQuestion();
    startTimer();

    window.interviewMedia.initCamera('webcam-feed').then(success => {
        if (success) window.interviewMedia.startVideoRecording();
    });

    window.interviewMedia.initSpeech((final, interim) => {
        const textArea = document.getElementById('answer-input');
        const transcriptPreview = document.getElementById('transcript-preview');
        if (!document.getElementById('text-input-container').classList.contains('hidden')) {
            if (interim) { transcriptPreview.textContent = interim; transcriptPreview.style.opacity = '0.6'; }
            if (final) {
                textArea.value += (textArea.value ? ' ' : '') + final;
                textArea.scrollTop = textArea.scrollHeight;
                transcriptPreview.textContent = '';
            }
        }
    });
};

window.toggleSpeech = function () {
    const isRecording = window.interviewMedia.toggleListening();
    const btn = document.getElementById('mic-btn');
    const status = document.getElementById('mic-status');
    const micIcon = btn.querySelector('.mic-icon');
    const aiStatus = document.getElementById('ai-status');

    if (isRecording) {
        btn.classList.add('recording');
        status.textContent = 'Stop Recording';
        micIcon.textContent = '⏹️';
        if (aiStatus) { aiStatus.classList.remove('hidden'); aiStatus.textContent = 'AI is listening...'; }
    } else {
        btn.classList.remove('recording');
        status.textContent = 'Start Speaking';
        micIcon.textContent = '🎤';
        if (aiStatus) aiStatus.classList.add('hidden');
        const transcriptPreview = document.getElementById('transcript-preview');
        if (transcriptPreview) transcriptPreview.textContent = '';
    }
};

window.getQuestions = function () { return AI_QUESTIONS || QUESTIONS[currentMode]; };

window.jumpToQuestion = function (index) { currentQuestionIndex = index; showQuestion(); };

window.showQuestion = function () {
    const questions = getQuestions();
    const q = questions[currentQuestionIndex];

    document.querySelectorAll('.nav-btn').forEach((btn, i) => {
        btn.classList.toggle('active', i === currentQuestionIndex);
        if (answers.some(a => a.question === questions[i].text)) btn.classList.add('completed');
    });

    document.getElementById('question-category').textContent = q.category;
    document.getElementById('question-text').textContent = q.text;

    const pulse = document.querySelector('.ai-pulse');
    window.interviewMedia.speak(q.text, () => pulse.classList.add('speaking'), () => pulse.classList.remove('speaking'));

    const textContainer = document.getElementById('text-input-container');
    const codeContainer = document.getElementById('code-input-container');
    const micBtn = document.getElementById('mic-btn');
    const aiInterviewer = document.getElementById('ai-interviewer');

    if (q.type === 'code') {
        textContainer.classList.add('hidden');
        codeContainer.classList.remove('hidden');
        micBtn.classList.add('hidden');
        document.getElementById('language-select').classList.remove('hidden');
        document.getElementById('answer-label').textContent = 'Your Solution';
        aiInterviewer.classList.add('hidden');

        if (window.EditorManager) {
            const topLangSelect = document.getElementById('language-select');
            const editorLangSelect = document.getElementById('editor-lang-select');
            setTimeout(() => {
                window.EditorManager.init('monaco-editor-host');
                let lang = 'javascript';
                const cat = q.category.toLowerCase();
                if (cat.includes('python')) lang = 'python';
                else if (cat.includes('java')) lang = 'java';
                else if (cat.includes('c++')) lang = 'cpp';

                window.EditorManager.setLanguage(lang);
                if (topLangSelect) topLangSelect.value = lang;
                if (editorLangSelect) editorLangSelect.value = lang;

                const checkAndSet = () => {
                    if (window.MonacoEditor) {
                        if (!window.MonacoEditor.getValue() || window.MonacoEditor.getValue().includes('Hello World')) {
                            const customBoilerplate = BOILERPLATES[lang];
                            if (customBoilerplate) window.MonacoEditor.setValue(customBoilerplate);
                        }
                    } else setTimeout(checkAndSet, 50);
                };
                checkAndSet();
            }, 100);
        }
    } else {
        textContainer.classList.remove('hidden');
        codeContainer.classList.add('hidden');
        micBtn.classList.remove('hidden');
        document.getElementById('language-select').classList.add('hidden');
        document.getElementById('answer-label').textContent = 'Your Answer';
        aiInterviewer.classList.remove('hidden');
        document.getElementById('answer-input').value = '';
        const transcriptPreview = document.getElementById('transcript-preview');
        if (transcriptPreview) transcriptPreview.textContent = '';
    }
    document.getElementById('interview-progress').style.width = ((currentQuestionIndex + 1) / questions.length * 100) + '%';
};

window.submitAnswer = async function () {
    const questions = getQuestions();
    const q = questions[currentQuestionIndex];
    let answer = q.type === 'code' ? (window.EditorManager ? window.EditorManager.getValue() : '') : document.getElementById('answer-input').value.trim();

    if (!answer) {
        const confirmSkip = await showConfirm('Your answer is empty. Do you want to skip this question?', '❓', 'Empty Answer');
        if (!confirmSkip) return;
    }

    const submitBtn = document.querySelector('.interview-actions .btn-primary');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '✓ Submitted';
    submitBtn.disabled = true;

    answers.push({ question: q.text, category: q.category, type: q.type, answer: answer, timeSpent: initialTime - timeLeft });

    setTimeout(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        currentQuestionIndex++;
        if (currentQuestionIndex >= questions.length) completeInterview();
        else showQuestion();
    }, 500);
};

window.skipQuestion = async function () {
    if (!await showConfirm('Are you sure you want to skip this question?', '⏭️', 'Skip Question')) return;
    const questions = getQuestions();
    const q = questions[currentQuestionIndex];
    answers.push({ question: q.text, category: q.category, type: q.type, answer: '', skipped: true, timeSpent: initialTime - timeLeft });
    currentQuestionIndex++;
    if (currentQuestionIndex >= questions.length) completeInterview();
    else showQuestion();
};

window.completeInterview = function () {
    clearInterval(timerInterval);
    clearInterval(autoSaveInterval);
    window.interviewMedia.stopListening();
    window.interviewMedia.stopVideoRecording().then(videoUrl => {
        window.interviewMedia.stopCamera();
        if (videoUrl) {
            const downloadBtn = document.createElement('a');
            downloadBtn.href = videoUrl;
            downloadBtn.download = `nextstep-interview-${new Date().getTime()}.webm`;
            downloadBtn.className = 'btn btn-secondary';
            downloadBtn.style.marginTop = '16px';
            downloadBtn.innerHTML = '📥 Download Interview Recording';
            const container = document.getElementById('complete-section');
            if (!container.querySelector('a[download]')) {
                container.appendChild(document.createElement('br'));
                container.appendChild(downloadBtn);
            }
        }
    });

    const interviewData = { mode: currentMode, answers: answers, completedAt: new Date().toISOString() };
    localStorage.setItem('nextStep_interview', JSON.stringify(interviewData));
    localStorage.removeItem('nextStep_interview_autosave');
    document.getElementById('interview-section').classList.add('hidden');
    document.getElementById('complete-section').classList.remove('hidden');

    // Hide video slot
    const videoSlot = document.querySelector('.floating-cam');
    if (videoSlot) videoSlot.classList.add('hidden');
};
