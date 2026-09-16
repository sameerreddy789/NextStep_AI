// @ts-check
import { StorageService } from './storage.js';

/**
 * @typedef {'onboarding'|'analysis'|'interview'|'roadmap'} WorkflowType
 */

/**
 * Workflow Orchestrator
 * Manages complex multi-step processes with state persistence and recovery.
 */
export const WorkflowManager = {
    /** @type {Record<WorkflowType, string>} */
    STORAGE_KEYS: {
        onboarding: 'nextStep_workflow_onboarding',
        analysis: 'nextStep_workflow_analysis',
        interview: 'nextStep_workflow_interview',
        roadmap: 'nextStep_workflow_roadmap'
    },

    /**
     * Get state for a workflow
     * @param {WorkflowType} type 
     */
    getState(type) {
        return StorageService.localGet(this.STORAGE_KEYS[type], {
            step: 1,
            status: 'idle',
            data: {},
            lastUpdated: Date.now()
        });
    },

    /**
     * Update workflow state
     * @param {WorkflowType} type 
     * @param {object} updates 
     */
    updateState(type, updates) {
        const current = this.getState(type);
        const newState = {
            ...current,
            ...updates,
            lastUpdated: Date.now()
        };
        StorageService.localSet(this.STORAGE_KEYS[type], newState);
        console.log(`[Workflow:${type}] State updated:`, newState);
        return newState;
    },

    /**
     * Reset a workflow
     * @param {WorkflowType} type 
     */
    reset(type) {
        StorageService.localRemove(this.STORAGE_KEYS[type]);
    },

    /**
     * Check if a workflow is in progress
     * @param {WorkflowType} type 
     */
    isInProgress(type) {
        const state = this.getState(type);
        return state.status === 'active' || state.status === 'pending';
    },

    /**
     * Transition logic for Onboarding -> Resume -> Interview -> Roadmap
     */
    async advanceToNextWorkflow() {
        const onboarding = this.getState('onboarding');
        const analysis = this.getState('analysis');
        const interview = this.getState('interview');

        if (onboarding.status !== 'complete') {
            window.location.href = '/pages/onboarding.html';
        } else if (analysis.status !== 'complete') {
            window.location.href = '/pages/resume.html';
        } else if (interview.status !== 'complete') {
            window.location.href = '/pages/interview.html';
        } else {
            window.location.href = '/pages/dashboard.html';
        }
    }
};

window.WorkflowManager = WorkflowManager;
