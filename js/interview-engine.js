// @ts-check
import { auth, db } from './firebase-config.js';
import { doc, setDoc, serverTimestamp, collection, addDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { appState } from './app-state.js';
import { InterviewTimer } from './interview/timer.js';
import { InterviewLogic } from './interview/logic.js';
import { InterviewUI } from './interview/ui.js';
import { GeminiService } from './gemini-service.js';
import { UIUtils } from './ui-utils.js';
import { WorkflowManager } from './services/workflow.js';

/**
 * Interview Engine Orchestrator
 * Coordinates between Logic, UI, and Timer modules with Workflow management.
 */

// Global Instances
const logic = new InterviewLogic();
let timer = null;

// Workflow state
const workflow = WorkflowManager.getState('interview');

// State
let isSpeakerEnabled = localStorage.getItem('nextStep_speaker_enabled') !== 'false';

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await appState.init();
    renderUserWidget();
    renderInterviewHistory();
    
    // Resume detection via WorkflowManager
    if (workflow.status === 'active') {
        UIUtils.showConfirmDialog('Resume Interview?', 'You have an active session. Would you like to resume?', () => {
            resumeInterview();
        }, () => {
            WorkflowManager.reset('interview');
            resetUI();
        });
    }

    // Event Listeners
    setupEventListeners();
});

async function resumeInterview() {
    if (logic.hydrate()) {
        document.getElementById('mode-selection')?.classList.add('hidden');
        document.getElementById('interview-section')?.classList.remove('hidden');
        
        InterviewUI.renderNavigation(logic.questions.length, logic.currentIndex);
        showCurrentQuestion();
        
        // Restart timer (safe default)
        timer = new InterviewTimer(1800, (left) => updateTimerUI(left), () => completeInterview());
        timer.start();
        enterFocusedMode();
        initMedia();
    } else {
        WorkflowManager.reset('interview');
    }
}

function renderUserWidget() {
    const userData = appState.user || {};
    const userName = document.getElementById('user-name');
    const userAvatar = document.getElementById('user-avatar');
    const userRole = document.getElementById('user-role');

    if (userName && userData.displayName) userName.textContent = userData.displayName;
    if (userAvatar && userData.displayName) userAvatar.textContent = userData.displayName.charAt(0).toUpperCase();
    if (userRole && userData.targetRole) {
        const roleNames = { 'sde': 'Software Developer', 'frontend': 'Frontend Dev', 'backend': 'Backend Dev' };
        userRole.textContent = roleNames[userData.targetRole] || userData.targetRole;
    }
}

function setupEventListeners() {
    document.addEventListener('keydown', (e) => {
        if (e.target instanceof HTMLElement && e.target.matches('input, textarea, select')) return;
        if (e.key === 'Enter' && e.ctrlKey) submitAnswer();
        else if (e.key === 'Escape') skipQuestion();
    });

    const langSelect = document.getElementById('language-select');
    const editorLangSelect = document.getElementById('editor-lang-select');

    // @ts-ignore
    window.handleLangChange = (lang) => {
        if (window.EditorManager) {
            window.EditorManager.setLanguage(lang);
            // @ts-ignore
            if (langSelect) langSelect.value = lang;
            // @ts-ignore
            if (editorLangSelect) editorLangSelect.value = lang;
        }
    };

    langSelect?.addEventListener('change', (e) => window.handleLangChange(e.target.value));
    editorLangSelect?.addEventListener('change', (e) => window.handleLangChange(e.target.value));
}

/**
 * Start Interview Flow
 * @param {'mixed'|'coding'|'behavioral'} mode 
 */
export async function startInterview(mode) {
    logic.mode = mode;
    
    // Update Workflow to 'active'
    WorkflowManager.updateState('interview', {
        status: 'active',
        step: 1,
        data: { mode, startTime: Date.now() }
    });

    const userData = appState.user || {};
    const targetRole = userData.targetRole || 'sde';
    const resumeData = appState.resumeData || {};
    const skills = [...(resumeData.skills?.present || []), ...(resumeData.skills?.partial || [])];

    document.getElementById('mode-selection')?.classList.add('hidden');
    document.getElementById('interview-section')?.classList.remove('hidden');

    UIUtils.showLoader('Generating your assessment...');
    try {
        await logic.loadQuestions(skills, targetRole);
        logic.saveProgress(); // Initial save
        
        InterviewUI.renderNavigation(logic.questions.length, 0);
        showCurrentQuestion();
        
        timer = new InterviewTimer(2700, (left) => updateTimerUI(left), () => completeInterview());
        timer.start();

        enterFocusedMode();
        initMedia();
    } catch (e) {
        UIUtils.showToast('Failed to start interview.', 'error');
        WorkflowManager.reset('interview');
        resetUI();
    } finally {
        UIUtils.hideLoader();
    }
}

function showCurrentQuestion() {
    const q = logic.getCurrentQuestion();
    if (q) {
        InterviewUI.showQuestion(q, logic.currentIndex);
        if (isSpeakerEnabled && window.interviewMedia) {
            window.interviewMedia.speak(q.description || q.text);
        }
    }
}

export async function submitAnswer() {
    const input = document.getElementById('answer-input');
    // @ts-ignore
    const answer = (logic.getCurrentQuestion()?.type === 'code' && window.EditorManager) 
        ? window.EditorManager.getValue() 
        : input?.value;

    if (!answer || answer.length < 5) {
        UIUtils.showToast('Please provide a more detailed answer.', 'warning');
        return;
    }

    UIUtils.showLoader('AI is evaluating...');
    try {
        await logic.submitAnswer(answer);
        logic.saveProgress(); // Save after every answer
        
        if (logic.isComplete) {
            completeInterview();
        } else {
            showCurrentQuestion();
            UIUtils.showToast('Answer submitted!', 'success');
        }
    } catch (e) {
        UIUtils.showToast('Evaluation failed, but progress was saved.', 'warning');
        logic.saveProgress();
    } finally {
        UIUtils.hideLoader();
    }
}

export function skipQuestion() {
    logic.currentIndex++;
    logic.saveProgress();
    if (logic.currentIndex >= logic.questions.length) {
        completeInterview();
    } else {
        showCurrentQuestion();
    }
}

async function completeInterview() {
    timer?.stop();
    UIUtils.showLoader('Generating performance report...');
    
    try {
        const overallScore = Math.round(logic.answers.reduce((acc, a) => acc + a.evaluation.score, 0) / (logic.answers.length || 1));
        const summary = `Completed ${logic.answers.length} questions with ${overallScore}% score.`;
        
        InterviewUI.showResults(overallScore, summary, logic.answers);
        
        // Save to Firebase
        if (appState.user?.uid) {
            const resultRef = collection(db, 'users', appState.user.uid, 'interviews');
            await addDoc(resultRef, {
                mode: logic.mode,
                overallScore,
                answers: logic.answers,
                timestamp: serverTimestamp()
            });
            await appState.fetchAllData(appState.user.uid);
        }
        
        // Finalize Workflow
        WorkflowManager.updateState('interview', {
            status: 'complete',
            data: { overallScore, completedAt: Date.now() }
        });

        exitFocusedMode();
    } catch (e) {
        console.error('[Interview] Completion failed:', e);
    } finally {
        UIUtils.hideLoader();
    }
}

// Focused UX Helpers
function enterFocusedMode() {
    document.querySelector('.sidebar')?.classList.add('hidden');
    // @ts-ignore
    if (document.querySelector('.main-content')) document.querySelector('.main-content').style.marginLeft = '0';
    document.documentElement.requestFullscreen?.().catch(() => {});
}

function exitFocusedMode() {
    document.querySelector('.sidebar')?.classList.remove('hidden');
    // @ts-ignore
    if (document.querySelector('.main-content')) document.querySelector('.main-content').style.marginLeft = '';
    if (document.fullscreenElement) document.exitFullscreen?.();
    
    // Release hardware
    if (window.interviewMedia) {
        window.interviewMedia.stopCamera();
    }
}

function resetUI() {
    document.getElementById('mode-selection')?.classList.remove('hidden');
    document.getElementById('interview-section')?.classList.add('hidden');
}

function updateTimerUI(seconds) {
    const el = document.getElementById('timer');
    if (!el) return;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    el.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    
    if (seconds <= 30) {
        el.style.color = 'var(--accent-red)';
        el.style.animation = 'pulse 1s infinite';
    } else {
        el.style.color = 'inherit';
        el.style.animation = 'none';
    }
}

function initMedia() {
    if (window.interviewMedia) {
        window.interviewMedia.initCamera('webcam-feed');
    }
}

// Speech recognition toggle
export async function toggleSpeech() {
    if (!window.interviewMedia) {
        console.warn('[Speech] ❌ interviewMedia not initialized');
        return;
    }

    const btn = document.getElementById('mic-btn');
    const status = document.getElementById('mic-status');
    const transcriptPreview = document.getElementById('transcript-preview');
    const answerInput = /** @type {HTMLTextAreaElement} */ (document.getElementById('answer-input'));

    const isStarting = !window.interviewMedia.isRecording;

    if (isStarting) {
        window.interviewMedia.initSpeech((final, interim) => {
            if (interim && transcriptPreview) transcriptPreview.textContent = interim;
            if (final) {
                if (transcriptPreview) transcriptPreview.textContent = final;
                if (answerInput) {
                    const current = answerInput.value ? answerInput.value.trim() + ' ' : '';
                    answerInput.value = current + final;
                }
            }
        });

        const success = window.interviewMedia.toggleListening();
        if (success) {
            btn?.classList.add('recording');
            if (status) status.textContent = 'Stop Recording';
            UIUtils.showToast('Microphone listening...', 'info');
        } else {
            UIUtils.showToast('Could not access microphone.', 'error');
        }
    } else {
        await window.interviewMedia.stopListening();
        btn?.classList.remove('recording');
        if (status) status.textContent = 'Speak Answer';
        UIUtils.showToast('Recording stopped.', 'info');
    }
}

// Test case tab switcher
export function switchTestTab(tabId) {
    const isSample = tabId === 'sample';
    const sampleView = document.getElementById('sample-tests-view');
    const resultsView = document.getElementById('results-tests-view');
    const tabs = document.querySelectorAll('.test-tab-btn');

    if (tabs.length >= 2) {
        tabs[0].classList.toggle('active', isSample);
        tabs[1].classList.toggle('active', !isSample);
    }
    sampleView?.classList.toggle('active', isSample);
    resultsView?.classList.toggle('active', !isSample);
}

// Local code runner
export async function executeLocal() {
    const q = logic.getCurrentQuestion();
    // @ts-ignore
    const code = window.EditorManager ? window.EditorManager.getValue() : '';

    if (!code || code.trim().length < 5) {
        UIUtils.showToast('Please write some code first.', 'warning');
        return;
    }

    switchTestTab('results');
    const statusEl = document.getElementById('execution-status');
    const passedEl = document.getElementById('tests-passed');
    const failedEl = document.getElementById('tests-failed');
    const consoleOutput = document.getElementById('console-output');

    if (statusEl) statusEl.innerHTML = '<span style="color:var(--accent-primary)">⏳ Running...</span>';

    const testCases = (q && q.testCases) ? q.testCases.filter(tc => !tc.isHidden) : [];
    
    // Capture console.log
    let logs = [];
    const originalLog = console.log;
    console.log = (...args) => {
        logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
        originalLog(...args);
    };

    let passed = 0;
    let failed = 0;
    let errorMsg = null;

    try {
        const userFn = new Function(`
            ${code}
            if (typeof solution === 'function') return solution;
            if (typeof solve === 'function') return solve;
            if (typeof main === 'function') return main;
            return null;
        `)();

        if (testCases.length > 0 && typeof userFn === 'function') {
            for (const tc of testCases) {
                try {
                    let inputArg = tc.input;
                    try { inputArg = JSON.parse(tc.input); } catch {}
                    const result = userFn(inputArg);
                    const expectedStr = String(tc.expected).trim();
                    const resultStr = String(result).trim();
                    if (resultStr === expectedStr) {
                        passed++;
                    } else {
                        failed++;
                    }
                } catch {
                    failed++;
                }
            }
        } else {
            passed = 1;
        }
    } catch (err) {
        errorMsg = err.message;
        failed = testCases.length || 1;
    } finally {
        console.log = originalLog;
    }

    if (consoleOutput) {
        consoleOutput.textContent = logs.join('\n') || (errorMsg ? `Error: ${errorMsg}` : 'Code executed successfully.');
    }

    if (passedEl) passedEl.textContent = String(passed);
    if (failedEl) failedEl.textContent = String(failed);
    if (statusEl) {
        if (errorMsg) {
            statusEl.innerHTML = '<span style="color:var(--accent-red)">✗ Error</span>';
        } else if (failed === 0) {
            statusEl.innerHTML = '<span style="color:#10b981">✓ Passed</span>';
        } else {
            statusEl.innerHTML = `<span style="color:#ef4444">✗ ${failed} Failed</span>`;
        }
    }
}

// Expose to window
window.startInterview = startInterview;
window.submitAnswer = submitAnswer;
window.skipQuestion = skipQuestion;
window.toggleSpeech = toggleSpeech;
window.switchTestTab = switchTestTab;
window.executeLocal = executeLocal;
window.toggleSpeaker = () => {
    isSpeakerEnabled = !isSpeakerEnabled;
    localStorage.setItem('nextStep_speaker_enabled', String(isSpeakerEnabled));
    if (!isSpeakerEnabled) window.interviewMedia?.cancelSpeech();
};

function renderInterviewHistory() {
    const list = document.getElementById('history-list');
    if (!list || !appState.interviews.length) return;
    
    document.getElementById('interview-history-section')?.classList.remove('hidden');
    list.innerHTML = appState.interviews.map(i => `
        <div class="history-card clay-card">
            <div class="history-header">
                <span class="badge">${i.mode}</span>
                <span class="score">${i.overallScore}%</span>
            </div>
            <div class="history-date">${new Date(i.timestamp?.seconds * 1000).toLocaleDateString()}</div>
        </div>
    `).join('');
}
