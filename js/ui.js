/**
 * UI Manager
 * Handles all UI interactions and updates
 */

import { skillManager, CATEGORIES, GROWTH_STAGES } from './skills.js';

class UIManager {
    constructor() {
        this.panel = document.getElementById('skill-panel');
        this.panelClose = document.getElementById('panel-close');
        this.currentSkillId = null;

        this.callbacks = {
            onPractice: null,
            onChallenge: null,
            onGrowAll: null,
            onDecay: null,
            onReset: null
        };

        this.init();
    }

    init() {
        this.bindEvents();
        this.updateHeaderStats();
        this.hideLoading();
    }

    bindEvents() {
        // Panel close
        this.panelClose?.addEventListener('click', () => this.closePanel());

        // Practice button
        document.getElementById('practice-btn')?.addEventListener('click', () => {
            if (this.currentSkillId && this.callbacks.onPractice) {
                this.callbacks.onPractice(this.currentSkillId, 0.1);
            }
        });

        // Challenge button
        document.getElementById('challenge-btn')?.addEventListener('click', () => {
            if (this.currentSkillId && this.callbacks.onChallenge) {
                this.callbacks.onChallenge(this.currentSkillId, 0.25);
            }
        });

        // Grow all button
        document.getElementById('grow-all-btn')?.addEventListener('click', () => {
            if (this.callbacks.onGrowAll) {
                this.callbacks.onGrowAll();
            }
        });

        // Decay button
        document.getElementById('decay-btn')?.addEventListener('click', () => {
            if (this.callbacks.onDecay) {
                this.callbacks.onDecay();
            }
        });

        // Reset button
        document.getElementById('reset-btn')?.addEventListener('click', () => {
            if (this.callbacks.onReset) {
                this.callbacks.onReset();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closePanel();
            }
        });
    }

    // Set callback handlers
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    // Show skill panel with selected skill
    showSkillPanel(skillId) {
        const skill = skillManager.getSkill(skillId);
        if (!skill) return;

        this.currentSkillId = skillId;
        this.panel.classList.add('open');

        this.updateSkillPanel(skill);
    }

    // Update skill panel content
    updateSkillPanel(skill) {
        const category = CATEGORIES[skill.category];
        const stage = skillManager.getGrowthStage(skill.progress);
        const percent = Math.round(skill.progress * 100);

        // Update header
        document.getElementById('skill-icon').textContent = skill.icon;
        document.getElementById('skill-name').textContent = skill.name;
        document.getElementById('skill-category').textContent = category?.name || skill.category;
        document.getElementById('skill-category').style.background =
            `${category?.color}33` || 'rgba(167, 139, 250, 0.2)';
        document.getElementById('skill-category').style.color =
            category?.color || '#a78bfa';

        // Update progress
        document.getElementById('progress-percent').textContent = `${percent}%`;
        document.getElementById('progress-fill').style.width = `${percent}%`;
        document.getElementById('progress-stage').textContent = `${stage.name} Stage`;
        document.getElementById('progress-stage').style.color = stage.color;

        // Update stats
        document.getElementById('skill-streak').textContent = skill.streak;
        document.getElementById('skill-level').textContent = Math.floor(skill.progress * 10) + 1;

        // Format last practiced date
        const lastPracticed = new Date(skill.lastPracticed);
        const now = new Date();
        const diffDays = Math.floor((now - lastPracticed) / (1000 * 60 * 60 * 24));

        let lastPracticedText = 'Today';
        if (diffDays === 1) lastPracticedText = 'Yesterday';
        else if (diffDays > 1) lastPracticedText = `${diffDays}d ago`;

        document.getElementById('last-practiced').textContent = lastPracticedText;
    }

    // Close skill panel
    closePanel() {
        this.panel.classList.remove('open');
        this.currentSkillId = null;
    }

    // Update header statistics
    updateHeaderStats() {
        const overallProgress = skillManager.getOverallProgress();
        const maxStreak = skillManager.getMaxStreak();

        document.getElementById('total-progress').textContent =
            `${Math.round(overallProgress * 100)}%`;
        document.getElementById('streak-count').textContent = maxStreak;
    }

    // Hide loading screen
    hideLoading() {
        setTimeout(() => {
            const loading = document.getElementById('loading-screen');
            loading?.classList.add('hidden');
        }, 2000);
    }

    // Show tooltip at position
    showTooltip(text, x, y) {
        let tooltip = document.querySelector('.tooltip');

        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            document.body.appendChild(tooltip);
        }

        tooltip.textContent = text;
        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
        tooltip.style.display = 'block';
    }

    // Hide tooltip
    hideTooltip() {
        const tooltip = document.querySelector('.tooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
        }
    }

    // Create notification toast
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span class="notification-icon">${type === 'success' ? '✨' : '🍂'}</span>
            <span class="notification-text">${message}</span>
        `;

        // Add styles inline (could move to CSS)
        Object.assign(notification.style, {
            position: 'fixed',
            top: '90px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: type === 'success'
                ? 'linear-gradient(135deg, rgba(74, 222, 128, 0.9), rgba(34, 197, 94, 0.9))'
                : 'linear-gradient(135deg, rgba(248, 113, 113, 0.9), rgba(239, 68, 68, 0.9))',
            color: type === 'success' ? '#000' : '#fff',
            padding: '12px 24px',
            borderRadius: '30px',
            fontWeight: '600',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: '1000',
            animation: 'slideDown 0.3s ease, fadeOut 0.3s ease 2.5s forwards',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
        });

        // Add animation keyframes
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideDown {
                    from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
                    to { transform: translateX(-50%) translateY(0); opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Remove after animation
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Refresh panel if a skill is selected
    refreshCurrentSkill() {
        if (this.currentSkillId) {
            const skill = skillManager.getSkill(this.currentSkillId);
            if (skill) {
                this.updateSkillPanel(skill);
            }
        }
        this.updateHeaderStats();
    }
}

export const uiManager = new UIManager();
export default uiManager;
