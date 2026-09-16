// @ts-check
import { escapeHTML } from '../ui-utils.js';

/**
 * Interview UI Module
 * Handles rendering of questions, feedback, and history list.
 */
export const InterviewUI = {
    /**
     * Render the question list navigation
     * @param {number} count 
     * @param {number} activeIndex 
     */
    renderNavigation(count, activeIndex) {
        const nav = document.getElementById('question-nav');
        if (!nav) return;

        nav.innerHTML = Array.from({ length: count }, (_, i) => `
            <div class="nav-btn ${i === activeIndex ? 'active' : ''}" data-index="${i}">
                ${i + 1}
            </div>
        `).join('');
    },

    /**
     * Show a specific question in the UI
     * @param {object} question 
     * @param {number} index 
     */
    showQuestion(question, index) {
        const questionText = document.getElementById('question-text');
        const questionDesc = document.getElementById('question-description');
        const questionNum = document.getElementById('current-question-num');
        const editorContainer = document.getElementById('code-editor-container');
        const textContainer = document.getElementById('text-input-container');

        if (questionNum) questionNum.textContent = String(index + 1);
        if (questionText) questionText.textContent = question.text;
        if (questionDesc) questionDesc.textContent = question.description || '';

        // Toggle editor vs text input
        if (question.type === 'code') {
            editorContainer?.classList.remove('hidden');
            textContainer?.classList.add('hidden');
            if (window.EditorManager && question.boilerplate) {
                window.EditorManager.setValue(question.boilerplate);
            }
        } else {
            editorContainer?.classList.add('hidden');
            textContainer?.classList.remove('hidden');
            const input = document.getElementById('answer-input');
            if (input) {
                // @ts-ignore
                input.value = '';
                input.focus();
            }
        }

        this.updateActiveNav(index);
    },

    updateActiveNav(index) {
        document.querySelectorAll('.nav-btn').forEach((btn, i) => {
            btn.classList.toggle('active', i === index);
        });
    },

    /**
     * Render evaluation feedback
     * @param {object} evaluation 
     */
    renderFeedback(evaluation) {
        const feedbackArea = document.getElementById('ai-evaluation-feedback');
        const feedbackIcon = document.getElementById('feedback-icon');
        const feedbackStatus = document.getElementById('feedback-status');
        const feedbackText = document.getElementById('feedback-text');

        if (!feedbackArea) return;

        feedbackArea.classList.remove('hidden');
        const isCorrect = evaluation.score >= 70;
        
        if (feedbackIcon) feedbackIcon.textContent = isCorrect ? '✅' : '⚠️';
        if (feedbackStatus) {
            feedbackStatus.textContent = isCorrect ? 'Correct / Strong' : 'Needs Improvement';
            feedbackStatus.style.color = isCorrect ? 'var(--accent-green)' : 'var(--accent-red)';
        }
        if (feedbackText) feedbackText.textContent = evaluation.feedback;
    },

    /**
     * Render interview results summary
     * @param {number} overallScore 
     * @param {string} summary 
     * @param {Array} results 
     */
    showResults(overallScore, summary, results) {
        const interviewSection = document.getElementById('interview-section');
        const resultsView = document.getElementById('results-view');
        const scoreVal = document.getElementById('overall-score-value');
        const summaryEl = document.getElementById('overall-summary');
        const listEl = document.getElementById('results-list');

        interviewSection?.classList.add('hidden');
        resultsView?.classList.remove('hidden');

        if (scoreVal) scoreVal.textContent = `${overallScore}%`;
        if (summaryEl) summaryEl.textContent = summary;

        if (listEl) {
            listEl.innerHTML = results.map((r, i) => `
                <div class="result-card clay-card">
                    <div class="result-header">
                        <span class="result-index">Q${i + 1}</span>
                        <span class="result-score ${r.evaluation.score >= 70 ? 'high' : 'low'}">${r.evaluation.score}%</span>
                    </div>
                    <div class="result-body">
                        <p class="result-question"><strong>Q:</strong> ${escapeHTML(r.question)}</p>
                        <p class="result-answer"><strong>Your Answer:</strong> ${escapeHTML(r.answer)}</p>
                        <div class="result-feedback">
                            <strong>AI Feedback:</strong> ${escapeHTML(r.evaluation.feedback)}
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }
};
