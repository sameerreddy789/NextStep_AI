/**
 * Roadmap Customizer - AI Integration
 * Handles user prompts to refine the roadmap
 */

window.roadmapCustomizer = {
    modalId: 'ai-customization-modal',
    inputId: 'ai-prompt-input',
    btnId: 'btn-generate-ai',

    openModal: function () {
        const modal = document.getElementById(this.modalId);
        if (modal) {
            modal.classList.remove('hidden');
            // Auto focus input
            setTimeout(() => {
                document.getElementById(this.inputId).focus();
            }, 100);
        }
    },

    closeModal: function () {
        const modal = document.getElementById(this.modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
    },

    submitPrompt: async function () {
        const promptRaw = document.getElementById(this.inputId).value;
        const prompt = promptRaw.trim();
        const btn = document.getElementById(this.btnId);

        if (!prompt) {
            if (typeof UIUtils !== 'undefined' && UIUtils.showToast) {
                UIUtils.showToast('Please enter a request for the AI.', 'warning');
            } else {
                alert('Please enter a request for the AI.');
            }
            return;
        }

        // UI Loading State
        const originalText = btn.innerText;
        btn.disabled = true;
        btn.innerHTML = `<span class="loading-spinner"></span> Generating...`;

        // Real AI Processing
        try {
            const userData = JSON.parse(localStorage.getItem('nextStep_user') || '{}');
            const role = userData.targetRole || 'sde';

            // Trigger full roadmap regeneration with refinement prompt
            if (window.initRoadmap) {
                // (role, isSample, skillGaps, aiData, refinementPrompt)
                // We pass null for skillGaps/aiData to let it re-fetch or use defaults, 
                // but crucially we pass the PROMPT as the 5th argument.
                await window.initRoadmap(role, false, null, null, prompt);
            }

            this.showNotification(`Roadmap updated based on your request: "${prompt}"`);
            this.closeModal();
            document.getElementById(this.inputId).value = '';

        } catch (error) {
            console.error(error);
            this.showNotification('Failed to refine roadmap. Please try again.');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerText = originalText;
            }
        }
    },

    showNotification: function (message) {
        // Reuse or create a notification toaster
        const div = document.createElement('div');
        div.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, var(--accent-primary), var(--accent-purple));
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            font-weight: 500;
        `;
        div.innerHTML = `✨ ${message}`;
        document.body.appendChild(div);

        setTimeout(() => {
            div.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => div.remove(), 300);
        }, 3000);
    }
};

// Add styles for spinner if not present
if (!document.getElementById('ai-customizer-styles')) {
    const style = document.createElement('style');
    style.id = 'ai-customizer-styles';
    style.textContent = `
        .loading-spinner {
            display: inline-block;
            width: 12px;
            height: 12px;
            border: 2px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 1s ease-in-out infinite;
            margin-right: 8px;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}
