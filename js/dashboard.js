import { auth } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { appState } from './app-state.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize Global State
    const initialized = await appState.init();

    if (initialized) {
        // 2. Initial Render
        renderDashboard(appState);

        // 3. Subscribe to Updates
        appState.subscribe((state) => {
            renderDashboard(state);
        });
    } else {
        // Handle unauthenticated or offline state if needed
        console.log("App state not initialized (User logged out?)");
    }

    // 4. Initialize Interactive Elements
    // Any legacy UI inits can go here
});

function renderDashboard(state) {
    if (!state.user) return;

    renderUserInfo(state.user);
    renderStats(state);
    renderCharts(state); // Donut + Readiness
    renderStreak(state); // GitHub Graph
    renderTasks(state);  // Assigned + Personal
    renderActionItems(state);
}

function renderUserInfo(user) {
    const greetingEl = document.getElementById('user-greeting-name');
    const nameEl = document.getElementById('user-name');
    const roleEl = document.getElementById('user-role');
    const avatarEl = document.getElementById('user-avatar');

    const displayName = user.name || user.email?.split('@')[0] || 'User';

    if (greetingEl) greetingEl.textContent = displayName.split(' ')[0];
    if (nameEl) nameEl.textContent = displayName;
    if (avatarEl) avatarEl.textContent = displayName.charAt(0).toUpperCase();

    if (roleEl) {
        const roleNames = { 'sde': 'Software Developer', 'frontend': 'Frontend Dev', 'backend': 'Backend Dev' };
        roleEl.textContent = roleNames[user.targetRole] || user.targetRole || 'Developer';
    }
}

function renderStats(state) {
    // Derive Stats from State
    const skillsCovered = (state.resumeData?.skills?.present?.length || 0) + (state.resumeData?.skills?.partial?.length || 0);
    const interviewsTaken = state.interviews.length;

    let avgScore = 0;
    if (interviewsTaken > 0) {
        const total = state.interviews.reduce((sum, i) => sum + (i.finalScore || i.overallScore || 0), 0);
        avgScore = Math.round(total / interviewsTaken);
    }

    // Calculate Streak
    const activityDates = Object.keys(state.learningActivity || {}).sort();
    let dayStreak = 0;
    if (activityDates.length > 0) {
        // Simple streak calculation (consecutive days ending yesterday/today)
        // For now, let's trust the length of recent activity keys or implement better logic
        // This is a placeholder for the complex streak logic
        const lastDate = new Date(activityDates[activityDates.length - 1]);
        const today = new Date();
        const diffTime = Math.abs(today - lastDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 2) {
            // Basic streak check
            dayStreak = activityDates.length; // Simplified
        }
    }

    // Update UI
    const elSkills = document.getElementById('skills-covered');
    const elInterviews = document.getElementById('interviews-taken');
    const elAvg = document.getElementById('avg-score');
    const elStreak = document.getElementById('day-streak');
    const elReadiness = document.getElementById('readiness-score-big');

    if (elSkills) elSkills.textContent = skillsCovered;
    if (elInterviews) elInterviews.textContent = interviewsTaken;
    if (elAvg) elAvg.textContent = `${avgScore}%`;
    if (elStreak) elStreak.textContent = dayStreak;
    if (elReadiness) elReadiness.textContent = `${state.readinessScore}%`;

    // Weekly Progress (Derived from current week in roadmap)
    const weeklyTopics = document.getElementById('weekly-topics');
    const weeklyQuestions = document.getElementById('weekly-questions');
    const weeklyTime = document.getElementById('weekly-time');

    // Placeholder logic for weekly stats
    if (weeklyTopics) weeklyTopics.textContent = state.roadmapProgress?.completedTopics?.length || 0;
    if (weeklyQuestions) weeklyQuestions.textContent = 0; // TODO: Track questions
    if (weeklyTime) weeklyTime.textContent = '0h'; // TODO: Track time
}

function renderCharts(state) {
    // Use Roadmap Progress for the donut chart
    const totalTasks = state.roadmap?.totalTasks || 100; // Default or from state
    const completedTasks = state.roadmapProgress?.completedTopics?.length || 0;
    const completedProgress = Math.round((completedTasks / totalTasks) * 100);
    const inProgressProgress = 0; // Hard to track individually without more data
    const pendingProgress = 100 - completedProgress;

    drawPieChart(completedProgress, inProgressProgress, pendingProgress, state.readinessScore);
}

// Draw Static Pie/Donut Chart using progress values
// Draw Static Pie/Donut Chart using progress values
function drawPieChart(completedVal = 0, inProgressVal = 0, pendingVal = 0, readinessScore = 0) {
    const total = completedVal + inProgressVal + pendingVal;
    const svg = document.querySelector('.readiness-svg');
    const scoreBig = document.getElementById('readiness-score-big');

    // Update Score
    if (scoreBig) scoreBig.textContent = `${readinessScore}%`;

    // Clear previous
    if (svg) svg.innerHTML = '';

    const segments = [
        { val: pendingVal, class: 'segment-pending', color: '#E5E7EB', label: 'Not Started', legendId: 'legend-pending' },
        { val: inProgressVal, class: 'segment-progress', color: '#3B82F6', label: 'In Progress', legendId: 'legend-progress' },
        { val: completedVal, class: 'segment-completed', color: '#10B981', label: 'Completed', legendId: 'legend-completed' }
    ];

    // Update Legend Percentages
    segments.forEach(seg => {
        const el = document.getElementById(seg.legendId);
        if (el) {
            const p = total > 0 ? Math.round((seg.val / total) * 100) : 0;
            el.textContent = `${p}%`;
        }
    });

    if (total === 0) {
        // Draw background circle
        if (svg) {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', '0');
            circle.setAttribute('cy', '0');
            circle.setAttribute('r', '1');
            circle.setAttribute('fill', 'rgba(255,255,255,0.05)');
            circle.setAttribute('stroke', 'rgba(255,255,255,0.1)');
            circle.setAttribute('stroke-width', '0.05');
            svg.appendChild(circle);
        }
        return;
    }

    let cumPercent = 0;

    function getCoordinatesForPercent(percent) {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    }

    // Add background circle for the "donut" look
    const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bgCircle.setAttribute('cx', '0');
    bgCircle.setAttribute('cy', '0');
    bgCircle.setAttribute('r', '1');
    bgCircle.setAttribute('fill', 'rgba(255,255,255,0.02)');
    svg.appendChild(bgCircle);

    segments.forEach(seg => {
        if (seg.val === 0) return;

        const percent = seg.val / total;
        const startPercent = cumPercent;
        const endPercent = cumPercent + percent;

        // Calculate coordinates for the arc
        const [startX, startY] = getCoordinatesForPercent(startPercent);
        const [endX, endY] = getCoordinatesForPercent(endPercent);

        // SVG Path Command - Donut segment (thick ring)
        const largeArcFlag = percent > 0.5 ? 1 : 0;
        const pathData = `M ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`;

        if (svg) {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathData);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', seg.color);
            path.setAttribute('stroke-width', '0.22');
            path.setAttribute('class', 'pie-ring-segment');
            path.style.transition = 'stroke-width 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

            // Enhanced Interactivity
            path.addEventListener('mouseenter', () => {
                showTooltip(seg.label, Math.round(percent * 100));
                path.setAttribute('stroke-width', '0.28');
                path.style.filter = 'drop-shadow(0 0 4px ' + seg.color + '44)';
            });
            path.addEventListener('mouseleave', () => {
                hideTooltip();
                path.setAttribute('stroke-width', '0.22');
                path.style.filter = 'none';
            });

            svg.appendChild(path);
        }

        cumPercent += percent;
    });
}

function showTooltip(status, percent) {
    const tooltip = document.getElementById('chart-tooltip');
    if (tooltip) {
        const statusEl = tooltip.querySelector('.tooltip-status');
        const percentEl = tooltip.querySelector('.tooltip-percent');
        if (statusEl) statusEl.textContent = status;
        if (percentEl) percentEl.textContent = `${percent}%`;
        tooltip.classList.add('active');
        tooltip.style.opacity = '1';
        tooltip.style.visibility = 'visible';
    }
}

function hideTooltip() {
    const tooltip = document.getElementById('chart-tooltip');
    if (tooltip) {
        tooltip.classList.remove('active');
        tooltip.style.opacity = '0';
        tooltip.style.visibility = 'hidden';
    }
}

// Task & Skill Management
function renderStreak(state) {
    const grid = document.getElementById('streak-grid');
    if (!grid) return;

    grid.innerHTML = '';
    const today = new Date();
    const daysToShow = 35; // 7 cols x 5 rows

    // Generate last 35 days
    for (let i = daysToShow - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const count = state.learningActivity?.[dateStr] || 0;

        const cell = document.createElement('div');
        cell.className = 'streak-cell';

        // Color intensity
        if (count > 0) cell.classList.add('level-1');
        if (count > 2) cell.classList.add('level-2');
        if (count > 4) cell.classList.add('level-3');

        cell.title = `${dateStr}: ${count} activities`;
        grid.appendChild(cell);
    }
}

function renderAssignedTasks(state) {
    // const state = appState; // Already passed as arg
    const systemList = document.getElementById('system-task-list');
    if (!systemList) return;

    if (!state.tasks || state.tasks.length === 0) {
        systemList.innerHTML = '<div class="empty-state-text">No assigned tasks. Generate a roadmap to get started!</div>';
        return;
    }

    // Sort: Pending first, then by deadline
    const sortedTasks = [...state.tasks].sort((a, b) => {
        if (a.completed === b.completed) return 0;
        return a.completed ? 1 : -1;
    });

    systemList.innerHTML = sortedTasks.map(t => `
        <div class="task-item ${t.completed ? 'completed' : ''}">
            <div class="task-icon purple">🎯</div>
            <div class="task-content">
                <div class="task-title ${t.completed ? 'completed' : ''}">${t.title}</div>
                <div class="task-due">${t.subtitle ? t.subtitle + ' • ' : ''}${t.deadline}</div>
            </div>
            <input type="checkbox" class="task-checkbox" ${t.completed ? 'checked' : ''} onclick="toggleTask('${t.id}', 'system')">
        </div>
    `).join('');
}

function renderUserTasks() {
    if (!window.SkillStore) return;
    const personalList = document.getElementById('personal-task-list');
    if (!personalList) return;

    const tasks = SkillStore.getTasks();
    const personalTasks = tasks.filter(t => t.type === 'personal');

    personalList.innerHTML = personalTasks.map(t => `
        <div class="task-item ${t.completed ? 'completed' : ''}">
            <div class="task-icon ${t.color || 'blue'}">${t.icon || '📝'}</div>
            <div class="task-content">
                <div class="task-title ${t.completed ? 'completed' : ''}">${t.title}</div>
                <div class="task-due">${t.due || 'Personal'}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <input type="checkbox" class="task-checkbox" ${t.completed ? 'checked' : ''} onclick="toggleTask('${t.id}', 'personal')">
                <div class="task-delete-btn" onclick="deleteTask('${t.id}')">✕</div>
            </div>
        </div>
    `).join('') || '<div class="empty-state-text">No personal tasks yet. Add one to stay on track.</div>';
}

// Global wrapper for initial render
function renderTasks(state) {
    if (!state) return;
    renderAssignedTasks(state);
    renderUserTasks(state);
}

// Task & Skill Management
window.toggleTask = async (id, type) => {
    if (type === 'system') {
        // Roadmap Task
        // We need to update Firestore roadmap progress
        // This logic mimics roadmap-ui.js but from dashboard
        const state = appState;
        const currentCompleted = state.roadmapProgress?.completedTopics || [];
        const isCompleted = currentCompleted.includes(id);

        let newCompleted;
        if (isCompleted) {
            newCompleted = currentCompleted.filter(t => t !== id);
        } else {
            newCompleted = [...currentCompleted, id];
        }

        // Optimistic Update
        state.roadmapProgress.completedTopics = newCompleted;
        state.generateTasksList(); // Regenerate tasks list
        state.calculateReadiness();
        state.logActivity(); // Log activity on completion
        renderDashboard(state); // Re-render immediately

        // Firestore Update
        try {
            const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
            const { db } = await import('./firebase-config.js');

            await setDoc(doc(db, "users", state.user.uid, "roadmap", "progress"), {
                completedTopics: newCompleted,
                lastUpdated: new Date()
            }, { merge: true });
            console.log('[Dashboard] Task updated in Firestore');
        } catch (e) {
            console.error('[Dashboard] Failed to update task:', e);
            // Revert on failure? For now, just log.
        }

    } else {
        // Personal Task
        if (window.SkillStore) {
            SkillStore.toggleTask(id);
            renderUserTasks();
        }
    }
};

function renderActionItems(state) {
    if (!state) return;
    const roadmapDone = state.readinessScore >= 90; // Example threshold
    const roadmapCard = document.getElementById('action-card-roadmap');
    if (roadmapCard) roadmapCard.style.display = roadmapDone ? 'none' : 'block';
}

function updateWeeklyProgress() {
    const progressData = JSON.parse(localStorage.getItem('nextStep_roadmap_progress') || '[]');
    const topicsDone = progressData.length;

    const topicsEl = document.getElementById('weekly-topics');
    const questionsEl = document.getElementById('weekly-questions');
    const timeEl = document.getElementById('weekly-time');

    if (topicsEl) topicsEl.textContent = topicsDone;
    if (questionsEl) questionsEl.textContent = topicsDone * 5;
    if (timeEl) timeEl.textContent = `${Math.round(topicsDone * 0.75)}h`;
}

window.DashboardManager = {
    refresh: () => {
        renderStats();
        renderCharts();
        renderTasks();
    }
};

// --- Modal & Task Logic ---
window.openAddModal = (type) => {
    const modal = document.getElementById('add-modal');
    const input = document.getElementById('task-title-input');
    if (modal) modal.classList.add('active');
    if (input) {
        input.value = '';
        input.focus();
    }
};

window.closeModal = () => {
    const modal = document.getElementById('add-modal');
    if (modal) modal.classList.remove('active');
};

window.saveNewTask = () => {
    const titleInput = document.getElementById('task-title-input');
    const title = titleInput.value.trim();

    if (!title) {
        alert('Please enter a task title');
        return;
    }

    if (window.SkillStore) {
        SkillStore.addTask({
            title: title,
            due: 'Today',
            icon: '📝',
            color: 'blue',
            type: 'personal' // Explicitly set as personal
        });

        closeModal();
        renderUserTasks();

        if (window.showToast) {
            showToast('Task added successfully!');
        }
    }
};
