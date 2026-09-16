// @ts-check
import { GeminiService } from '../gemini-service.js';
import { StorageService } from '../services/storage.js';

/**
 * Interview Logic Module
 * Manages interview state, questions, and AI evaluations.
 */
export class InterviewLogic {
    constructor() {
        this.questions = [];
        this.currentIndex = 0;
        this.answers = [];
        this.mode = 'mixed';
        this.isComplete = false;
    }

    /**
     * Load questions from AI or cache
     */
    async loadQuestions(skills, role) {
        try {
            this.questions = await GeminiService.generateQuestions(skills, role, this.mode);
            return this.questions;
        } catch (e) {
            console.error('[InterviewLogic] Failed to load questions:', e);
            throw e;
        }
    }

    /**
     * Submit an answer for evaluation
     */
    async submitAnswer(answer) {
        const currentQ = this.getCurrentQuestion();
        if (!currentQ) return null;

        try {
            const evaluation = await GeminiService.evaluateAnswer(currentQ, answer);
            const record = {
                question: currentQ.text,
                answer,
                evaluation,
                timestamp: new Date().toISOString()
            };
            this.answers.push(record);
            this.currentIndex++;
            
            if (this.currentIndex >= this.questions.length) {
                this.isComplete = true;
            }

            return record;
        } catch (e) {
            console.error('[InterviewLogic] Evaluation failed:', e);
            throw e;
        }
    }

    getCurrentQuestion() {
        return this.questions[this.currentIndex] || null;
    }

    getProgress() {
        if (this.questions.length === 0) return 0;
        return (this.currentIndex / this.questions.length) * 100;
    }

    saveProgress() {
        StorageService.localSet('nextStep_interview_state', {
            questions: this.questions,
            currentIndex: this.currentIndex,
            answers: this.answers,
            mode: this.mode
        });
    }

    hydrate() {
        const saved = StorageService.localGet('nextStep_interview_state');
        if (saved) {
            this.questions = saved.questions || [];
            this.currentIndex = saved.currentIndex || 0;
            this.answers = saved.answers || [];
            this.mode = saved.mode || 'mixed';
            return true;
        }
        return false;
    }
}
