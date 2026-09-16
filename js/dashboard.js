// @ts-check
import { auth } from './firebase-config.js';
import { appState } from './app-state.js';
import { UIUtils } from './ui-utils.js';

/**
 * Dashboard UI Orchestrator
 * Optimized for performance and modern ES features.
 */
class DashboardManager {
    #stateRef = null;
    #selectedPulseDay = null;

    constructor() {
        console.log('[Dashboard] UI Controller Initialized');
    }

    async init() {
        const initialized = await appState.init();
        if (initialized) {
            this.#stateRef = appState;
            this.render(appState);
            appState.subscribe(state => this.render(state));
        }
    }

    render(state) {
        if (!state.user) return;
        this.#renderUserInfo(state.user);
        this.#renderStats(state);
        this.#renderActivityPulse(state);
        this.#renderCharts(state);
        this.renderTasks(state);
    }

    #renderUserInfo(user) {
        const name = user.displayName || user.email?.split('@')[0] || 'User';
        UIUtils.setElText('user-greeting-name', name.split(' ')[0]);
        UIUtils.setElText('user-name', name);
        
        const avatarEl = document.getElementById('user-avatar');
        if (avatarEl) avatarEl.textContent = name.charAt(0).toUpperCase();
        
        const roleEl = document.getElementById('user-role');
        if (roleEl) {
            const roleMap = { 'sde': 'Software Developer', 'frontend': 'Frontend Dev', 'backend': 'Backend Dev' };
            roleEl.textContent = roleMap[user.targetRole] || user.targetRole || 'Developer';
        }
    }

    #renderStats(state) {
        const skillsCount = (state.resumeData?.skills?.present?.length || 0) + (state.resumeData?.skills?.partial?.length || 0);
        const interviewsCount = state.interviews.length;
        const avgScore = interviewsCount > 0 
            ? Math.round(state.interviews.reduce((s, i) => s + (i.overallScore || 0), 0) / interviewsCount) 
            : 0;

        UIUtils.setElText('skills-covered', skillsCount);
        UIUtils.setElText('interviews-taken', interviewsCount);
        UIUtils.setElText('avg-score', interviewsCount > 0 ? `${avgScore}%` : '—');
        UIUtils.setElText('readiness-score-big', `${state.readinessScore}%`);
        UIUtils.setElText('day-streak', this.#calculateStreak(state));
    }

    #calculateStreak(state) {
        const activity = state.learningActivity || {};
        const dates = Object.keys(activity).filter(d => activity[d] > 0).sort().reverse();
        if (dates.length === 0) return 0;

        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        if (dates[0] !== today && dates[0] !== yesterday) return 0;

        let streak = 0;
        let check = new Date(dates[0]);
        while (activity[check.toISOString().split('T')[0]] > 0) {
            streak++;
            check.setDate(check.getDate() - 1);
        }
        return streak;
    }

    renderTasks(state = this.#stateRef || appState) {
        this.#renderAssignedTasks(state);
        this.#renderUserTasks();
    }

    #renderAssignedTasks(state) {
        const systemList = document.getElementById('system-task-list');
        if (!systemList) return;

        const allTasks = state?.tasks || [];
        let filtered = [...allTasks];
        if (currentTaskFilter === 'pending') {
            filtered = filtered.filter(t => !t.completed);
        } else if (currentTaskFilter === 'completed') {
            filtered = filtered.filter(t => t.completed);
        }

        if (filtered.length === 0) {
            const msg = currentTaskFilter === 'completed'
                ? 'No completed roadmap tasks yet.'
                : currentTaskFilter === 'pending'
                    ? 'All roadmap tasks completed! 🎉'
                    : 'No assigned roadmap tasks found.';
            systemList.innerHTML = `<div class="empty-state-text" style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 13px;">${msg}</div>`;
            return;
        }

        systemList.innerHTML = filtered.slice(0, 20).map(t => `
            <div class="task-item ${t.completed ? 'completed' : ''}">
                <div class="task-icon ${t.completed ? 'green' : 'purple'}">${t.completed ? '✅' : '🎯'}</div>
                <div class="task-content">
                    <div class="task-title ${t.completed ? 'completed' : ''}">${UIUtils.escapeHTML(t.title)}</div>
                    <div class="task-due">${t.subtitle ? UIUtils.escapeHTML(t.subtitle) + ' • ' : ''}${t.deadline || (t.completed ? 'Completed' : 'Roadmap Item')}</div>
                </div>
                <input type="checkbox" class="task-checkbox" ${t.completed ? 'checked' : ''} 
                    onclick="toggleTask('${t.id}', 'system')">
            </div>
        `).join('');
    }

    #renderUserTasks() {
        const personalList = document.getElementById('personal-task-list');
        if (!personalList) return;

        // @ts-ignore
        const tasks = (window.SkillStore && window.SkillStore.getTasks) ? window.SkillStore.getTasks() : [];
        let personal = tasks.filter(t => t.type === 'personal');

        if (currentPersonalFilter === 'done') {
            personal = personal.filter(t => t.completed);
        }

        if (personal.length === 0) {
            personalList.innerHTML = `<div class="empty-state-text" style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 13px;">${currentPersonalFilter === 'done' ? 'No completed personal tasks.' : 'No personal tasks yet. Add one to stay on track.'}</div>`;
            return;
        }

        personalList.innerHTML = personal.map(t => `
            <div class="task-item ${t.completed ? 'completed' : ''}">
                <div class="task-icon ${t.color || 'blue'}">${t.icon || '📝'}</div>
                <div class="task-content">
                    <div class="task-title ${t.completed ? 'completed' : ''}">${UIUtils.escapeHTML(t.title)}</div>
                    <div class="task-due">${t.due || 'Personal'}</div>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" class="task-checkbox" ${t.completed ? 'checked' : ''} 
                        onclick="toggleTask('${t.id}', 'personal')">
                    <div class="task-delete-btn" onclick="deleteTask('${t.id}')" style="cursor: pointer; color: var(--text-muted); padding: 4px 8px;" title="Delete task">✕</div>
                </div>
            </div>
        `).join('');
    }

    #renderCharts(state) {
        const completed = state.roadmapProgress?.completedTopics?.length || 0;
        const total = state.roadmap?.totalTasks || 1;
        const pct = Math.round((completed / total) * 100);
        
        this.#drawPieChart(pct, 0, Math.max(0, 100 - pct), state.readinessScore);

        UIUtils.setElText('legend-completed', `${pct}%`);
        UIUtils.setElText('legend-progress', `0%`);
        UIUtils.setElText('legend-pending', `${Math.max(0, 100 - pct)}%`);
    }

    #drawPieChart(completedVal, inProgressVal, pendingVal, readinessScore) {
        const svg = document.querySelector('.readiness-svg');
        if (!svg) return;
        svg.innerHTML = '';

        const R = 0.82;
        const STROKE = 0.26;
        const total = completedVal + inProgressVal + pendingVal || 100;

        // Simplified SVG generation for performance
        const segments = [
            { val: pendingVal, color: '#9CA3AF' },
            { val: inProgressVal, color: '#3B82F6' },
            { val: completedVal, color: '#10B981' }
        ];

        let cumPercent = 0;
        segments.forEach(seg => {
            if (seg.val === 0) return;
            const percent = seg.val / total;
            const start = cumPercent;
            const end = cumPercent + percent;

            const x1 = R * Math.cos(2 * Math.PI * start);
            const y1 = R * Math.sin(2 * Math.PI * start);
            const x2 = R * Math.cos(2 * Math.PI * end);
            const y2 = R * Math.sin(2 * Math.PI * end);

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', `M ${x1} ${y1} A ${R} ${R} 0 ${percent > 0.5 ? 1 : 0} 1 ${x2} ${y2}`);
            path.setAttribute('stroke', seg.color);
            path.setAttribute('stroke-width', String(STROKE));
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke-linecap', 'round');
            svg.appendChild(path);
            cumPercent += percent;
        });
    }

    #renderActivityPulse(state) {
        const timeline = document.getElementById('pulse-timeline');
        if (!timeline) return;
        timeline.innerHTML = '';

        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const count = state.learningActivity?.[dateStr] || 0;

            const node = document.createElement('div');
            node.className = `pulse-day ${count > 0 ? 'active' : ''} ${i === 0 ? 'is-today' : ''}`;
            node.innerHTML = `
                <div class="pulse-ring" style="--fill: ${Math.min(count * 33, 100)}">
                    <span class="pulse-count">${count || '·'}</span>
                </div>
            `;
            timeline.appendChild(node);
        }
    }
}

const dashboard = new DashboardManager();
document.addEventListener('DOMContentLoaded', () => dashboard.init());

// Global Event Bridge for HTML onclick attributes
// @ts-ignore
window.filterTasks = (filter) => {
    currentTaskFilter = filter;
    document.querySelectorAll('#task-filter-tabs .task-filter-tab').forEach(tab => {
        // @ts-ignore
        tab.classList.toggle('active', tab.dataset.filter === filter);
    });
    dashboard.renderTasks();
};

// @ts-ignore
window.filterPersonalTasks = (filter) => {
    currentPersonalFilter = filter;
    document.querySelectorAll('#personal-filter-tabs .task-filter-tab').forEach(tab => {
        // @ts-ignore
        tab.classList.toggle('active', tab.dataset.filter === filter);
    });
    dashboard.renderTasks();
};

// @ts-ignore
window.openAddModal = (type) => {
    const modal = document.getElementById('add-modal');
    const input = /** @type {HTMLInputElement} */ (document.getElementById('task-title-input'));
    if (modal) modal.classList.add('active');
    if (input) {
        input.value = '';
        input.focus();
    }
};

// @ts-ignore
window.closeModal = () => {
    const modal = document.getElementById('add-modal');
    if (modal) modal.classList.remove('active');
};

// @ts-ignore
window.saveNewTask = () => {
    const titleInput = /** @type {HTMLInputElement} */ (document.getElementById('task-title-input'));
    const title = titleInput?.value.trim();

    if (!title) {
        UIUtils.showToast('Please enter a task title', 'warning');
        return;
    }

    // @ts-ignore
    if (window.SkillStore) {
        // @ts-ignore
        window.SkillStore.addTask({
            title: title,
            due: 'Today',
            icon: '📝',
            color: 'blue',
            type: 'personal'
        });

        // @ts-ignore
        window.closeModal();
        dashboard.renderTasks();
        UIUtils.showToast('Task added successfully!', 'success');
    }
};

// @ts-ignore
window.deleteTask = (id) => {
    taskToDeleteId = id;
    const modal = document.getElementById('delete-confirm-modal');
    if (modal) modal.classList.add('active');
};

// @ts-ignore
window.closeDeleteModal = () => {
    taskToDeleteId = null;
    const modal = document.getElementById('delete-confirm-modal');
    if (modal) modal.classList.remove('active');
};

// @ts-ignore
window.confirmDelete = () => {
    // @ts-ignore
    if (taskToDeleteId && window.SkillStore) {
        // @ts-ignore
        window.SkillStore.deleteTask(taskToDeleteId);
        // @ts-ignore
        window.closeDeleteModal();
        dashboard.renderTasks();
        UIUtils.showToast('Task removed', 'info');
    }
};

// @ts-ignore
window.toggleTask = async (id, type) => {
    if (type === 'personal') {
        // @ts-ignore
        if (window.SkillStore) {
            // @ts-ignore
            window.SkillStore.toggleTask(id);
            dashboard.renderTasks();
        }
        return;
    }

    if (type === 'system') {
        const current = appState.roadmapProgress?.completedTopics || [];
        const completed = new Set(current);
        if (completed.has(id)) {
            completed.delete(id);
        } else {
            completed.add(id);
            UIUtils.showToast('Progress Logged! 🔥', 'success');
        }

        if (!appState.roadmapProgress) appState.roadmapProgress = {};
        appState.roadmapProgress.completedTopics = Array.from(completed);
        if (appState.tasks) {
            appState.tasks.forEach(t => {
                if (t.id === id) t.completed = completed.has(id);
            });
        }
        appState.calculateReadiness();
        appState.notifyListeners();
        
        // Background Sync
        if (appState.user?.uid) {
            try {
                const { StorageService } = await import('./services/storage.js');
                await StorageService.firestoreSet(`users/${appState.user.uid}/roadmap/progress`, {
                    completedTopics: appState.roadmapProgress.completedTopics,
                    lastUpdated: new Date()
                });
            } catch (err) {
                console.warn('[Dashboard] Firestore sync error:', err);
            }
        }
    }
};
