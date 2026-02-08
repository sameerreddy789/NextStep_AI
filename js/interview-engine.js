import { auth, db } from './firebase-config.js';
import { doc, setDoc, serverTimestamp, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// functions will be exposed to window via window.funcName = funcName after they are defined

/**
 * Interview Engine - Manages the state and logic for AI Interviews
 */

const BOILERPLATES = {
    c: `#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    printf("Hello World");\n    return 0;\n}`,
    java: `public class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n        System.out.println("Hello World");\n    }\n}`,
    python: `def solution():\n    # Write your solution here\n    print("Hello World")`
};

let currentMode = 'mixed';
let currentQuestionIndex = 0;
let answers = [];
let timerInterval = null;
let timeLeft = 2700; // 45 minutes global
let initialTime = 2700;
let autoSaveInterval = null;
let AI_QUESTIONS = null;
let isSpeakerEnabled = localStorage.getItem('nextStep_speaker_enabled') !== 'false'; // Default to true

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

// Speaker Toggle Logic
window.toggleSpeaker = function () {
    isSpeakerEnabled = !isSpeakerEnabled;
    localStorage.setItem('nextStep_speaker_enabled', isSpeakerEnabled);
    updateSpeakerUI();

    if (!isSpeakerEnabled) {
        if (window.interviewMedia) window.interviewMedia.cancelSpeech();
    } else {
        // If turned ON, read the current question description
        const questions = getQuestions();
        const q = questions[currentQuestionIndex];
        if (q && window.interviewMedia) {
            const pulse = document.querySelector('.ai-pulse');
            const btn = document.getElementById('speaker-toggle-btn');
            window.interviewMedia.speak(q.description || q.text,
                () => {
                    if (pulse) pulse.classList.add('speaking');
                    if (btn) btn.classList.add('speaking');
                },
                () => {
                    if (pulse) pulse.classList.remove('speaking');
                    if (btn) btn.classList.remove('speaking');
                }
            );
        }
    }
};

function updateSpeakerUI() {
    const btn = document.getElementById('speaker-toggle-btn');
    const icon = document.getElementById('speaker-icon');
    if (btn && icon) {
        if (isSpeakerEnabled) {
            btn.classList.add('on');
            btn.classList.remove('off');
            icon.textContent = '🔊';
            btn.title = 'Mute AI Voice';
        } else {
            btn.classList.add('off');
            btn.classList.remove('on');
            icon.textContent = '🔇';
            btn.title = 'Unmute AI Voice';
        }
    }
}

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

    if (timerDisplay) {
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

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
async function startInterview(mode) {
    currentMode = mode;
    currentQuestionIndex = 0;
    answers = [];

    document.getElementById('mode-selection').classList.add('hidden');
    document.getElementById('interview-section').classList.remove('hidden');
    document.getElementById('interview-mode-badge').textContent = 'Adaptive Interview';

    // Show video slot
    const videoSlot = document.getElementById('video-slot');
    if (videoSlot) videoSlot.classList.remove('hidden');

    // Show loading screen if AI is available
    const loadingScreen = document.getElementById('ai-loading-screen');
    const resumeData = JSON.parse(localStorage.getItem('nextStep_resume') || '{}');
    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    const userData = JSON.parse(localStorage.getItem('nextStep_user') || '{}');
    const targetRole = userProfile.targetRole || userData.targetRole || 'sde';

    if (window.GeminiService && window.GeminiService.isAvailable() && resumeData.skills) {
        if (loadingScreen) loadingScreen.classList.remove('hidden');
        try {
            const skills = [...(resumeData.skills.present || []), ...(resumeData.skills.partial || [])];
            AI_QUESTIONS = await window.GeminiService.generateQuestions(skills, targetRole, mode, 8);
        } catch (error) {
            console.error('[InterviewEngine] AI Question Generation failed:', error);
            AI_QUESTIONS = null;
        } finally {
            if (loadingScreen) loadingScreen.classList.add('hidden');
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

    updateSpeakerUI();
};

function toggleSpeech() {
    if (!window.interviewMedia) {
        console.warn('[Speech] interviewMedia not initialized');
        return;
    }
    const isRecording = window.interviewMedia.toggleListening();
    const btn = document.getElementById('mic-btn');
    const status = document.getElementById('mic-status');
    const micIcon = btn ? btn.querySelector('.mic-icon') : null;
    const aiStatus = document.getElementById('ai-status');

    if (isRecording) {
        if (btn) btn.classList.add('recording');
        if (status) status.textContent = 'Stop Recording';
        if (micIcon) micIcon.textContent = '⏹️';
        if (aiStatus) { aiStatus.classList.remove('hidden'); aiStatus.textContent = 'AI is listening...'; }
    } else {
        if (btn) btn.classList.remove('recording');
        if (status) status.textContent = 'Start Speaking';
        if (micIcon) micIcon.textContent = '🎤';
        if (aiStatus) aiStatus.classList.add('hidden');

        // AUTO-EVALUATE: If user spoke an answer, trigger AI evaluation
        const answer = document.getElementById('answer-input').value.trim();
        if (answer.length > 10) {
            evaluateCurrentAnswer(answer);
        }
    }
};

async function evaluateCurrentAnswer(answerText) {
    const feedbackArea = document.getElementById('ai-evaluation-feedback');
    const feedbackIcon = document.getElementById('feedback-icon');
    const feedbackStatus = document.getElementById('feedback-status');
    const feedbackText = document.getElementById('feedback-text');
    const questions = getQuestions();
    const q = questions[currentQuestionIndex];

    if (!feedbackArea || !window.GeminiService) return;

    // Show loading state in feedback area
    feedbackArea.classList.remove('hidden');
    feedbackIcon.textContent = '⏳';
    feedbackStatus.textContent = 'Evaluating...';
    feedbackText.textContent = 'AI is analyzing your response...';

    try {
        const evaluation = await window.GeminiService.evaluateAnswer(q, answerText);

        const isCorrect = evaluation.score >= 70;
        feedbackIcon.textContent = isCorrect ? '✅' : '⚠️';
        feedbackStatus.textContent = isCorrect ? 'Correct / Strong' : 'Needs Improvement';
        feedbackStatus.style.color = isCorrect ? 'var(--accent-green)' : 'var(--accent-red)';
        feedbackText.textContent = evaluation.feedback;
    } catch (error) {
        console.error('[Evaluation] Failed:', error);
        feedbackIcon.textContent = '❌';
        feedbackStatus.textContent = 'Evaluation Failed';
        feedbackText.textContent = 'Could not get AI feedback at this time.';
    }
}

const QUESTIONS = {
    mixed: [
        {
            type: 'code',
            category: 'Data Structures',
            text: 'Palindrome Check',
            description: 'Implement a function to check if a string is a palindrome. A palindrome is a word, phrase, number, or other sequence of characters that reads the same forward and backward. Ignore capitalization and punctuation.',
            examples: [
                { input: '"racecar"', output: 'true', explanation: 'Reads "racecar" backwards.' },
                { input: '"A man, a plan, a canal: Panama"', output: 'true', explanation: 'After cleaning: "amanaplanacanalpanama"' },
                { input: '"hello"', output: 'false', explanation: 'Backwards is "olleh".' }
            ],
            testCases: [
                { input: '"racecar"', expected: 'true', isHidden: false, label: 'Standard Palindrome' },
                { input: '"A man, a plan, a canal: Panama"', expected: 'true', isHidden: false, label: 'Palindrome with Punctuation' },
                { input: '"hello"', expected: 'false', isHidden: false, label: 'Non-palindrome' },
                { input: '"RaceCar"', expected: 'true', isHidden: true, label: 'Mixed Case' },
                { input: '"12321"', expected: 'true', isHidden: true, label: 'Numeric Palindrome' }
            ]
        },
        {
            type: 'text',
            category: 'Behavioral',
            text: 'Conflict Resolution',
            description: 'Tell me about a time you had a conflict with a team member. How did you resolve it? Focus on your specific actions and the outcome.',
            examples: []
        },
        {
            type: 'code',
            category: 'Algorithms',
            text: 'First Unique Character',
            description: 'Given a string efficiently find the first non-repeating character in it and return its index. If it does not exist, return -1.',
            examples: [
                { input: '"leetcode"', output: '0', explanation: '"l" is the first unique char.' },
                { input: '"loveleetcode"', output: '2', explanation: '"v" is the first unique char.' },
                { input: '"aabb"', output: '-1', explanation: 'No unique characters.' }
            ],
            testCases: [
                { input: '"leetcode"', expected: '0', isHidden: false, label: 'Basic Case' },
                { input: '"loveleetcode"', expected: '2', isHidden: false, label: 'Middle Match' },
                { input: '"aabb"', expected: '-1', isHidden: false, label: 'No Unique' },
                { input: '"abcabc"', expected: '-1', isHidden: true, label: 'All Repeaters' },
                { input: '"z"', expected: '0', isHidden: true, label: 'Single Character' }
            ]
        },
        { type: 'text', category: 'System Design', text: 'URL Shortener Design', description: 'How would you design a URL shortening service like bit.ly? Explain the key components, data model, and API endpoints.', examples: [] },
        {
            type: 'code',
            category: 'JavaScript',
            text: 'Flatten Array',
            description: 'Write a function that flattens a nested array of any depth. Do not use Array.prototype.flat().',
            examples: [
                { input: '[1, [2, [3, 4], 5], 6]', output: '[1, 2, 3, 4, 5, 6]', explanation: 'Flattens all nested levels.' },
                { input: '[[1], [2], [3]]', output: '[1, 2, 3]', explanation: 'Flattens one level.' }
            ],
            testCases: [
                { input: '[1, [2, [3, 4], 5], 6]', expected: '[1, 2, 3, 4, 5, 6]', isHidden: false, label: 'Mixed Depths' },
                { input: '[[1], [2], [3]]', expected: '[1, 2, 3]', isHidden: false, label: 'Shallow Nesting' },
                { input: '[]', expected: '[]', isHidden: true, label: 'Empty Array' },
                { input: '[1, [2, [3, [4, [5]]]]]', expected: '[1, 2, 3, 4, 5]', isHidden: true, label: 'Deep Nesting' }
            ]
        },
        { type: 'text', category: 'Leadership', text: 'Leading Under Pressure', description: 'Describe a situation where you had to lead a project under tight deadlines. What strategies did you use?', examples: [] },
        {
            type: 'code',
            category: 'Problem Solving',
            text: 'Two Sum',
            description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
            examples: [
                { input: 'nums = [2,7,11,15], target = 9', output: '[0, 1]', explanation: '2 + 7 = 9' },
                { input: 'nums = [3,2,4], target = 6', output: '[1, 2]', explanation: '2 + 4 = 6' }
            ],
            testCases: [
                { input: 'nums = [2,7,11,15], target = 9', expected: '[0, 1]', isHidden: false, label: 'Basic Case' },
                { input: 'nums = [3,2,4], target = 6', expected: '[1, 2]', isHidden: false, label: 'Non-Adjacent' },
                { input: 'nums = [3,3], target = 6', expected: '[0, 1]', isHidden: true, label: 'Duplicate Values' },
                { input: 'nums = [-1, -8, 10], target = 2', expected: '[1, 2]', isHidden: true, label: 'Negative Values' }
            ]
        },
        { type: 'text', category: 'Databases', text: 'SQL vs NoSQL', description: 'Explain the difference between SQL and NoSQL databases. When would you choose one over the other? Provide specific use cases.', examples: [] }
    ]
};


function getQuestions() { return AI_QUESTIONS || QUESTIONS[currentMode]; }

async function jumpToQuestion(index) { currentQuestionIndex = index; showQuestion(); }

function showQuestion() {
    const questions = getQuestions();
    const q = questions[currentQuestionIndex];

    // Reset AI feedback area for new question
    const feedbackArea = document.getElementById('ai-evaluation-feedback');
    if (feedbackArea) feedbackArea.classList.add('hidden');

    document.querySelectorAll('.nav-btn').forEach((btn, i) => {
        btn.classList.toggle('active', i === currentQuestionIndex);
        if (answers.some(a => a.question === questions[i].text)) btn.classList.add('completed');
    });

    document.getElementById('question-category').textContent = q.category;

    // Build Rich Question Content
    let contentHtml = `<h2 class="question-title">${q.text}</h2>`;
    if (q.description) {
        contentHtml += `<div class="question-description">${q.description}</div>`;
    }

    if (q.examples && q.examples.length > 0) {
        contentHtml += `<div class="examples-section"><h3>Examples:</h3>`;
        q.examples.forEach((ex, idx) => {
            contentHtml += `
                <div class="example-block">
                    <h4>Example ${idx + 1}:</h4>
                    <div class="code-block"><strong>Input:</strong> ${ex.input}</div>
                    <div class="code-block"><strong>Output:</strong> ${ex.output}</div>
                    ${ex.explanation ? `<div class="explanation"><strong>Explanation:</strong> ${ex.explanation}</div>` : ''}
                </div>`;
        });
        contentHtml += `</div>`;
    }

    // Inject content into question-text element (which we will likely rename/refactor in HTML to be a container)
    // Ideally, we should target a container, but 'question-text' is a convenient existing ID.
    // Ensure CSS handles div children correctly.
    document.getElementById('question-text').innerHTML = contentHtml;

    const pulse = document.querySelector('.ai-pulse');
    const speakerBtn = document.getElementById('speaker-toggle-btn');

    // Speak only if enabled
    if (isSpeakerEnabled && window.interviewMedia) {
        window.interviewMedia.speak(q.description || q.text,
            () => {
                if (pulse) pulse.classList.add('speaking');
                if (speakerBtn) speakerBtn.classList.add('speaking');
            },
            () => {
                if (pulse) pulse.classList.remove('speaking');
                if (speakerBtn) speakerBtn.classList.remove('speaking');
            }
        );
    }

    const textContainer = document.getElementById('text-input-container');
    const codeContainer = document.getElementById('code-input-container');
    const micBtn = document.getElementById('mic-btn');
    const aiInterviewer = document.getElementById('ai-interviewer');

    if (q.type === 'code') {
        textContainer.classList.add('hidden');
        codeContainer.classList.remove('hidden');
        micBtn.classList.add('hidden');
        document.getElementById('answer-label').textContent = 'Your Solution';

        renderTestCases(q);

        if (window.EditorManager) {
            const editorLangSelect = document.getElementById('editor-lang-select');
            let lang = 'c';
            const cat = q.category.toLowerCase();
            if (cat.includes('python')) lang = 'python';
            else if (cat.includes('java')) lang = 'java';

            window.EditorManager.init('monaco-editor-host');

            // Wait for editor to be ready before setting language/boilerplate
            const setupEditor = () => {
                if (window.MonacoEditor) {
                    window.EditorManager.setLanguage(lang);
                    if (editorLangSelect) editorLangSelect.value = lang;

                    const val = window.MonacoEditor.getValue();
                    if (!val || val.includes('Hello World')) {
                        const customBoilerplate = BOILERPLATES[lang];
                        if (customBoilerplate) window.MonacoEditor.setValue(customBoilerplate);
                    }
                } else {
                    setTimeout(setupEditor, 100);
                }
            };
            setupEditor();
        }
    } else {
        textContainer.classList.remove('hidden');
        codeContainer.classList.add('hidden');
        micBtn.classList.remove('hidden');
        document.getElementById('answer-label').textContent = 'Your Answer';

        // Auto-resize logic for text input
        const answerInput = document.getElementById('answer-input');
        answerInput.value = '';
        answerInput.style.height = 'auto'; // Reset height

        const autoResize = () => {
            answerInput.style.height = 'auto';
            answerInput.style.height = (answerInput.scrollHeight + 10) + 'px';
        };
        answerInput.removeEventListener('input', autoResize); // Prevent duplicates
        answerInput.addEventListener('input', autoResize);

        const transcriptPreview = document.getElementById('transcript-preview');
        if (transcriptPreview) transcriptPreview.textContent = '';
    }
    document.getElementById('interview-progress').style.width = ((currentQuestionIndex + 1) / questions.length * 100) + '%';

    // Update Tips
    const tipsList = document.getElementById('tips-list');
    if (tipsList) {
        const defaultTips = [
            '<strong>Be specific:</strong> Use the STAR method for behavioral questions.',
            '<strong>Use examples:</strong> Relate your answers to past projects.',
            '<strong>Structure:</strong> Start with a summary, then dive into details.',
            '<strong>Optimization:</strong> For code, discuss time/space complexity.'
        ];
        const qTips = q.tips || [];
        const combinedTips = qTips.length > 0 ? qTips : defaultTips;

        tipsList.innerHTML = combinedTips.map(tip => `<li>${tip.includes('<strong>') ? tip : `<strong>Tip:</strong> ${tip}`}</li>`).join('');
    }
}

async function submitAnswer(skipEvaluation = false) {
    const questions = getQuestions();
    const q = questions[currentQuestionIndex];
    let answer = q.type === 'code' ? (window.EditorManager ? window.EditorManager.getValue() : '') : document.getElementById('answer-input').value.trim();

    if (!answer) {
        const confirmSkip = await showConfirm('Your answer is empty. Do you want to skip this question?', '❓', 'Empty Answer');
        if (!confirmSkip) return;
    }

    // For coding questions, we run evaluation first unless skipEvaluation is true
    if (q.type === 'code' && !skipEvaluation && q.testCases && q.testCases.length > 0) {
        executeGlobal();
        return;
    }

    const submitBtn = document.getElementById('submit-btn');
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
}

async function skipQuestion() {
    if (!await showConfirm('Are you sure you want to skip this question?', '⏭️', 'Skip Question')) return;
    const questions = getQuestions();
    const q = questions[currentQuestionIndex];
    answers.push({ question: q.text, category: q.category, type: q.type, answer: '', skipped: true, timeSpent: initialTime - timeLeft });
    currentQuestionIndex++;
    if (currentQuestionIndex >= questions.length) completeInterview();
    else showQuestion();
};

async function completeInterview() {
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
            const container = document.getElementById('completion-header');
            if (container && !container.querySelector('a[download]')) {
                container.appendChild(document.createElement('br'));
                container.appendChild(downloadBtn);
            }
        }
    });

    // Flag as completed
    localStorage.setItem('nextStep_onboardingCompleted', 'true');
    localStorage.setItem('nextStep_roadmapCompleted', 'true');

    // Hide interview UI
    document.getElementById('interview-section').classList.add('hidden');
    document.getElementById('complete-section').classList.remove('hidden');
    const videoSlot = document.getElementById('video-slot');
    if (videoSlot) videoSlot.classList.add('hidden');

    // Start AI Analysis
    const loadingEl = document.getElementById('results-loading');
    const resultsViewEl = document.getElementById('results-view');
    if (loadingEl) loadingEl.classList.remove('hidden');

    try {
        console.log('[Interview] 🤖 Starting AI performance analysis...');
        const analyzedAnswers = [];
        let totalScore = 0;
        let validAnswersCount = 0;

        // Perform per-question evaluation
        for (const ans of answers) {
            if (ans.skipped) {
                analyzedAnswers.push({
                    ...ans,
                    evaluation: {
                        score: 0,
                        feedback: "Question was skipped. No demonstration of skill was possible.",
                        strengths: [],
                        improvements: ["Attempt similar questions in the future to show your logic."]
                    }
                });
                continue;
            }

            try {
                const evaluation = await window.GeminiService.evaluateAnswer(
                    { text: ans.question, category: ans.category },
                    ans.answer
                );

                analyzedAnswers.push({
                    ...ans,
                    evaluation: evaluation || { score: 50, feedback: "Evaluation unavailable", strengths: [], improvements: [] }
                });

                if (evaluation && typeof evaluation.score === 'number') {
                    totalScore += evaluation.score;
                    validAnswersCount++;
                }
            } catch (evalError) {
                console.error('[Interview] Evaluation failed for question:', ans.question, evalError);
                analyzedAnswers.push({
                    ...ans,
                    evaluation: { score: 50, feedback: "Analysis failed due to API error.", strengths: [], improvements: [] }
                });
            }
        }

        const overallScore = validAnswersCount > 0 ? Math.round(totalScore / validAnswersCount) : 0;
        const interviewData = {
            mode: currentMode,
            answers: analyzedAnswers,
            overallScore: overallScore,
            completedAt: new Date().toISOString()
        };

        // Save Results
        localStorage.setItem('nextStep_interview', JSON.stringify(interviewData));
        localStorage.removeItem('nextStep_interview_autosave');

        // Render Results
        renderInterviewResults(interviewData);

        // Transition UI
        if (loadingEl) loadingEl.classList.add('hidden');
        if (resultsViewEl) resultsViewEl.classList.remove('hidden');

        // Save to Database
        saveInterviewToDatabase(interviewData);

    } catch (err) {
        console.error('[Interview] ❌ Analysis Error:', err);
        if (loadingEl) loadingEl.innerHTML = `<p style="color: #ef4444">Analysis failed: ${err.message}. You can still proceed to your dashboard.</p>`;
    }
}

function renderInterviewResults(data) {
    const scoreVal = document.getElementById('overall-score-value');
    const summaryEl = document.getElementById('overall-summary');
    const listEl = document.getElementById('results-list');

    if (scoreVal) scoreVal.innerText = `${data.overallScore}%`;
    if (summaryEl) {
        summaryEl.innerText = data.overallScore >= 80 ?
            "Exceptional performance! You demonstrated deep technical knowledge and clear communication." :
            data.overallScore >= 60 ?
                "Good effort! You have a solid foundation but there are specific areas where you can sharpen your expertise." :
                "This was a great learning experience. Your roadmap has been updated with focused topics to help you bridge these gaps.";
    }

    if (listEl) {
        listEl.innerHTML = data.answers.map((ans, idx) => {
            const evalData = ans.evaluation || { score: 0 };
            const scoreClass = evalData.score >= 80 ? 'score-high' : evalData.score >= 50 ? 'score-mid' : 'score-low';

            return `
                <div class="result-card">
                    <div class="result-header">
                        <div style="flex: 1;">
                            <div style="font-size: 12px; color: var(--accent-primary); font-weight: 600; margin-bottom: 4px;">QUESTION ${idx + 1} • ${ans.category}</div>
                            <div style="font-weight: 600; font-size: 16px; color: white; line-height: 1.4;">${ans.question}</div>
                        </div>
                        <div class="result-score ${scoreClass}">${evalData.score}%</div>
                    </div>
                    
                    <div class="user-answer-box">
                        <strong>Your Answer:</strong><br>
                        ${ans.skipped ? '<em>Skipped</em>' : (ans.answer && ans.answer.length > 200) ? ans.answer.substring(0, 200) + '...' : (ans.answer || '')}
                    </div>

                    <div class="result-content" style="margin-top: 20px;">
                        <div class="result-block">
                            <h4>AI Feedback</h4>
                            <p>${evalData.feedback || 'No feedback provided'}</p>
                        </div>
                        
                        ${evalData.strengths?.length > 0 ? `
                        <div class="result-block">
                            <h4>Key Strengths</h4>
                            <div class="pill-group">
                                ${evalData.strengths.map(s => `<span class="strength-pill">${s}</span>`).join('')}
                            </div>
                        </div>` : ''}

                        ${evalData.improvements?.length > 0 ? `
                        <div class="result-block">
                            <h4>Areas to Improve</h4>
                            <div class="pill-group">
                                ${evalData.improvements.map(i => `<span class="improvement-pill">${i}</span>`).join('')}
                            </div>
                        </div>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }
}

async function validateCodingSolution() {
    if (!window.GeminiService || !window.EditorManager) return;

    const questions = getQuestions();
    const q = questions[currentQuestionIndex];
    const code = window.EditorManager.getValue().trim();

    if (!code || code.length < 10) {
        showAlert('Please write some code before validating.', '⚠️', 'Empty Solution');
        return;
    }

    const validateBtn = document.getElementById('validate-logic-btn');
    const badge = document.getElementById('logic-outcome-badge');
    const out = document.getElementById('console-output');

    const originalText = validateBtn.innerHTML;
    validateBtn.innerHTML = '<span>⏳</span> Analyzing...';
    validateBtn.disabled = true;

    try {
        const result = await window.GeminiService.evaluateAnswer(
            { text: q.text, category: q.category },
            code
        );

        if (badge) {
            badge.textContent = result.outcome || "Analyzed";
            badge.classList.remove('hidden');

            if (result.outcome === 'Correct Answer') {
                badge.style.background = 'var(--accent-green)';
                badge.style.color = '#000';
            } else {
                badge.style.background = 'var(--accent-red)';
                badge.style.color = '#fff';
            }
        }

        if (out) {
            const reasoningHtml = `
                <div style="margin-top: 10px; border-top: 1px solid #334155; padding-top: 10px;">
                    <div style="color: var(--accent-primary); font-weight: 600; font-size: 12px; margin-bottom: 4px;">AI LOGIC ANALYSIS:</div>
                    <div style="color: #f3f4f6; font-size: 13px; line-height: 1.5; font-family: 'Inter', sans-serif;">${result.reasoning || result.feedback}</div>
                </div>
            `;
            out.innerHTML += reasoningHtml;
            out.scrollTop = out.scrollHeight;
        }

        // EPHEMERAL: Clear badge after 15 seconds to remind user it's a real-time check
        setTimeout(() => {
            if (badge) badge.classList.add('hidden');
        }, 15000);

    } catch (error) {
        console.error('[Validation] Failed:', error);
        if (out) out.innerHTML += `<div style="color: #ef4444; margin-top: 10px;">❌ AI Validation failed: ${error.message}</div>`;
    } finally {
        validateBtn.innerHTML = originalText;
        validateBtn.disabled = false;
    }
}

// Database Integration
async function saveInterviewToDatabase(data) {
    try {
        // Wait for auth to initialize if it hasn't yet
        const user = await new Promise((resolve) => {
            if (auth.currentUser) return resolve(auth.currentUser);
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                unsubscribe();
                resolve(user);
            });
            // Timeout after 3 seconds if auth still hasn't settled
            setTimeout(() => resolve(auth.currentUser), 3000);
        });

        if (!user) {
            console.log('[Database] ⚠️ User not logged in to Firebase Auth, skipping cloud save');
            return;
        }

        console.log('[Database] Saving interview results to Firestore (UID: ' + user.uid + ')...');
        // Save overall summary
        await setDoc(doc(db, "users", user.uid, "analysis", "interview"), {
            lastCompletedAt: serverTimestamp(),
            mode: data.mode,
            questionCount: data.answers.length,
            overallScore: data.overallScore
        }, { merge: true });

        // Save detailed session to a subcollection
        await addDoc(collection(db, "users", user.uid, "interviews"), {
            ...data,
            timestamp: serverTimestamp()
        });

        console.log('[Database] ✅ Interview results saved successfully');

        // Analyze skill gaps and update roadmap
        if (window.SkillGapService) {
            console.log('[Database] 🔍 Analyzing skill gaps...');
            await window.SkillGapService.analyzeAndUpdateRoadmap(data);
        }
    } catch (error) {
        console.error('[Database] ❌ Error saving interview results:', error);
    }
}

// Test Case Interaction Logic
window.switchTestTab = function (tabId) {
    document.querySelectorAll('.test-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('onclick').includes(`'${tabId}'`));
    });
    document.querySelectorAll('.test-view').forEach(view => {
        view.classList.toggle('active', view.id === `${tabId}-tests-view`);
    });
};

function renderTestCases(q) {
    const sampleView = document.getElementById('sample-tests-view');
    if (!sampleView) return;

    if (!q.testCases || q.testCases.length === 0) {
        sampleView.innerHTML = '<div class="empty-state">No test cases required for this question.</div>';
        return;
    }

    const publicTests = q.testCases.filter(tc => !tc.isHidden);
    sampleView.innerHTML = publicTests.map((tc, i) => `
        <div class="test-case-item">
            <div class="test-case-header">
                <span class="test-case-label">${tc.label || `Test Case ${i + 1}`}</span>
            </div>
            <div class="test-case-data">
                <span class="data-label">Input:</span>
                <span class="data-value">${tc.input}</span>
                <span class="data-label">Expected:</span>
                <span class="data-value">${tc.expected}</span>
            </div>
        </div>
    `).join('');

    // Clear previous results
    document.getElementById('detailed-results').innerHTML = '<div class="empty-state" style="margin-top:20px">Click "Run Code" to see results</div>';
    document.getElementById('tests-passed').textContent = '0';
    document.getElementById('tests-failed').textContent = '0';
    document.getElementById('execution-status').textContent = 'Ready';
}

window.executeLocal = async function () {
    const questions = getQuestions();
    const q = questions[currentQuestionIndex];
    const code = window.EditorManager ? window.EditorManager.getValue() : '';

    if (!code || code.length < 5) {
        showAlert('Please write some code first.', '⚠️', 'Empty Solution');
        return;
    }

    switchTestTab('results');
    const statusEl = document.getElementById('execution-status');
    statusEl.innerHTML = '<span style="color:var(--accent-primary)">⏳ Running Samples...</span>';

    const sampleTests = q.testCases.filter(tc => !tc.isHidden);
    await runExecutionFlow(code, sampleTests);
};

window.executeGlobal = async function () {
    const questions = getQuestions();
    const q = questions[currentQuestionIndex];
    const code = window.EditorManager ? window.EditorManager.getValue() : '';

    if (!code || code.length < 5) {
        showAlert('Please write some code first.', '⚠️', 'Empty Solution');
        return;
    }

    switchTestTab('results');
    const statusEl = document.getElementById('execution-status');
    statusEl.innerHTML = '<span style="color:var(--accent-primary)">⏳ evaluating all tests...</span>';

    await runExecutionFlow(code, q.testCases, true);
};

async function runExecutionFlow(code, tests, isGlobal = false) {
    const resultsContainer = document.getElementById('detailed-results');
    const passedEl = document.getElementById('tests-passed');
    const failedEl = document.getElementById('tests-failed');
    const statusEl = document.getElementById('execution-status');

    try {
        const langCode = document.getElementById('editor-lang-select').value;
        const results = await window.GeminiService.executeCode(code, langCode, tests);

        let passed = 0;
        let failed = 0;

        resultsContainer.innerHTML = results.map(res => {
            const isPassed = res.status === 'passed';
            if (isPassed) passed++; else failed++;

            return `
                <div class="test-case-item">
                    <div class="test-case-header">
                        <span class="test-case-label">${res.label}</span>
                        <span class="test-case-status ${isPassed ? 'status-passed' : 'status-failed'}">${res.status.toUpperCase()}</span>
                    </div>
                    <div class="test-case-data">
                        <span class="data-label">Input:</span>
                        <span class="data-value">${res.input}</span>
                        <span class="data-label">Expected:</span>
                        <span class="data-value">${res.expected}</span>
                        <span class="data-label">Actual:</span>
                        <span class="data-value" style="color: ${isPassed ? '#10b981' : '#ef4444'}">${res.actual}</span>
                    </div>
                    ${res.output ? `<div style="margin-top:8px; font-size:11px; color:#64748b">Console: ${res.output}</div>` : ''}
                </div>
            `;
        }).join('');

        passedEl.textContent = passed;
        failedEl.textContent = failed;
        statusEl.innerHTML = failed === 0 ? '<span style="color:var(--accent-green)">✓ All Passed</span>' : `<span style="color:var(--accent-red)">✗ ${failed} Failed</span>`;

        if (isGlobal && failed === 0) {
            setTimeout(async () => {
                const confirmSubmit = await showConfirm('All test cases passed! Do you want to submit this solution?', '🚀', 'Solution Verified');
                if (confirmSubmit) submitAnswer(true);
            }, 500);
        }

    } catch (error) {
        console.error('[Execution] Error:', error);
        statusEl.innerHTML = '<span style="color:var(--accent-red)">✗ Execution Error</span>';
        resultsContainer.innerHTML = `<div class="error-box" style="color:#ef4444; padding:16px; background:rgba(239,68,68,0.1); border-radius:8px">${error.message}</div>`;
    }
}

// Expose functions to window
window.switchTestTab = switchTestTab;
window.executeLocal = executeLocal;
window.executeGlobal = executeGlobal;

// Expose functions to window for globally defined onclick handlers
window.startInterview = startInterview;
window.toggleSpeech = toggleSpeech;
window.submitAnswer = submitAnswer;
window.skipQuestion = skipQuestion;
window.jumpToQuestion = jumpToQuestion;
window.handleLangChange = handleLangChange;
window.showQuestion = showQuestion;
window.completeInterview = completeInterview;
window.validateCodingSolution = validateCodingSolution;
