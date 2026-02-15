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

    // Store ref for filter function
    window.appStateRef = state;

    renderUserInfo(state.user);
    renderStats(state);
    renderActivityPulse(state);
    renderCharts(state);    // Donut + Readiness
    renderTasks(state);     // Assigned + Personal
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
    if (elReadiness) elReadiness.textContent = `${state.readinessScore || 0}%`;

}

function renderCharts(state) {
    const totalTasks = state.roadmap?.totalTasks || 0;
    const completedTasks = state.roadmapProgress?.completedTopics?.length || 0;
    const completedProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const inProgressProgress = 0;
    const pendingProgress = Math.max(0, 100 - completedProgress);

    drawPieChart(completedProgress, inProgressProgress, pendingProgress, state.readinessScore || 0);
}

// Draw Static Pie/Donut Chart using progress values
// Draw Static Pie/Donut Chart using progress values
function drawPieChart(completedVal = 0, inProgressVal = 0, pendingVal = 0, readinessScore = 0) {
    const total = completedVal + inProgressVal + pendingVal;
    const svg = document.querySelector('.readiness-svg');
    const scoreBig = document.getElementById('readiness-score-big');

    // Update Score
    if (scoreBig) scoreBig.textContent = `${readinessScore || 0}%`;

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


// ====== Activity Pulse — ring tracker with drill-down ======
let selectedPulseDay = null;

function renderActivityPulse(state) {
    const timeline = document.getElementById('pulse-timeline');
    const insightEl = document.getElementById('pulse-insight');
    const totalEl = document.getElementById('pulse-total');
    const streakEl = document.getElementById('streak-count');
    const detailPanel = document.getElementById('pulse-detail');
    if (!timeline) return;

    timeline.innerHTML = '';
    const today = new Date();
    const dayOfWeek = today.getDay();
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Monday of this week
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const dailyGoal = 3; // daily target for ring fill
    let totalWeek = 0;
    let bestDay = { name: '', count: 0 };
    let activeDays = 0;
    const weekData = [];

    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const isToday = d.toDateString() === today.toDateString();

        // Activity count
        const activityCount = state.learningActivity?.[dateStr] || 0;

        // Tasks completed that day
        let tasksOnDay = [];
        if (state.tasks) {
            state.tasks.forEach(t => {
                if (t.completed && t.completedAt) {
                    const cDate = new Date(t.completedAt).toISOString().split('T')[0];
                    if (cDate === dateStr) tasksOnDay.push(t);
                }
            });
        }

        const dayTotal = Math.max(activityCount, tasksOnDay.length);
        totalWeek += dayTotal;
        if (dayTotal > 0) activeDays++;
        if (dayTotal > bestDay.count) bestDay = { name: dayNames[i], count: dayTotal };

        const fillPercent = Math.min(Math.round((dayTotal / dailyGoal) * 100), 100);

        weekData.push({ dateStr, dayTotal, tasksOnDay, isToday, fillPercent, label: dayNames[i] });

        // Build ring node
        const node = document.createElement('div');
        node.className = 'pulse-day';
        if (isToday) node.classList.add('is-today');
        if (dayTotal > 0) node.classList.add('active');
        if (selectedPulseDay === i) node.classList.add('selected');

        const displayLabel = isToday ? 'Today' : dayNames[i];

        node.innerHTML = `
            <div class="pulse-ring" style="--fill: ${fillPercent}">
                <span class="pulse-count">${dayTotal || '·'}</span>
            </div>
            <span class="pulse-day-label">${displayLabel}</span>
        `;

        node.addEventListener('click', () => {
            if (selectedPulseDay === i) {
                // Toggle off
                selectedPulseDay = null;
                detailPanel.classList.remove('expanded');
                detailPanel.innerHTML = '';
                node.classList.remove('selected');
            } else {
                selectedPulseDay = i;
                expandPulseDetail(weekData[i], detailPanel);
                // Update ring visuals
                timeline.querySelectorAll('.pulse-day').forEach((n, idx) => {
                    n.classList.toggle('selected', idx === i);
                });
            }
        });

        timeline.appendChild(node);
    }

    // Total
    if (totalEl) {
        totalEl.textContent = `${totalWeek} done`;
    }

    // Streak
    if (streakEl) {
        const streak = calculateStreak(state);
        streakEl.textContent = streak;
    }

    // Smart insight
    if (insightEl) {
        insightEl.textContent = generateInsight(totalWeek, activeDays, bestDay, state);
    }

    // Restore expanded detail if a day was selected
    if (selectedPulseDay !== null && weekData[selectedPulseDay]) {
        expandPulseDetail(weekData[selectedPulseDay], detailPanel);
    }
}

function expandPulseDetail(dayData, panel) {
    if (!panel) return;

    let itemsHTML = '';
    if (dayData.tasksOnDay.length > 0) {
        itemsHTML = dayData.tasksOnDay.map(t => `
            <div class="detail-item">
                <span class="detail-item-icon">✅</span>
                <span>${t.title}</span>
            </div>
        `).join('');
    } else if (dayData.dayTotal > 0) {
        itemsHTML = `
            <div class="detail-item">
                <span class="detail-item-icon">📊</span>
                <span>${dayData.dayTotal} activit${dayData.dayTotal > 1 ? 'ies' : 'y'} logged</span>
            </div>
        `;
    } else {
        itemsHTML = `<div class="detail-empty">No activity on ${dayData.label}</div>`;
    }

    panel.innerHTML = `
        <div class="detail-header">
            <span class="detail-title">${dayData.isToday ? 'Today' : dayData.label} — ${dayData.dateStr}</span>
            <button class="detail-close" onclick="closePulseDetail()">✕</button>
        </div>
        <div class="detail-items">${itemsHTML}</div>
    `;

    requestAnimationFrame(() => panel.classList.add('expanded'));
}

window.closePulseDetail = () => {
    selectedPulseDay = null;
    const panel = document.getElementById('pulse-detail');
    if (panel) {
        panel.classList.remove('expanded');
        setTimeout(() => { panel.innerHTML = ''; }, 350);
    }
    document.querySelectorAll('.pulse-day.selected').forEach(n => n.classList.remove('selected'));
};

function calculateStreak(state) {
    const activity = state.learningActivity || {};
    const dates = Object.keys(activity).filter(d => activity[d] > 0).sort().reverse();
    if (dates.length === 0) return 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    // Streak must include today or yesterday
    if (dates[0] !== todayStr && dates[0] !== yesterdayStr) return 0;

    let streak = 0;
    let checkDate = new Date(dates[0]);

    while (true) {
        const check = checkDate.toISOString().split('T')[0];
        if (activity[check] && activity[check] > 0) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }
    return streak;
}

function generateInsight(totalWeek, activeDays, bestDay, state) {
    if (totalWeek === 0) return 'Start your week — complete a task to light up the rings';

    const insights = [];

    if (activeDays >= 5) {
        insights.push(`On fire — ${activeDays} active days this week`);
    } else if (activeDays >= 3) {
        insights.push(`Solid progress — ${activeDays} active days`);
    } else {
        insights.push(`${activeDays} day${activeDays !== 1 ? 's' : ''} active — keep building momentum`);
    }

    if (bestDay.count >= 3) {
        insights.push(`Best day: ${bestDay.name} with ${bestDay.count} tasks`);
    }

    // Pick one at random-ish based on day
    const idx = new Date().getDay() % insights.length;
    return insights[idx];
}



// Current filter state
let currentTaskFilter = 'all';

function renderAssignedTasks(state) {
    const systemList = document.getElementById('system-task-list');
    if (!systemList) return;

    if (!state.tasks || state.tasks.length === 0) {
        systemList.innerHTML = '<div class="empty-state-text">No assigned tasks. Generate a roadmap to get started!</div>';
        return;
    }

    // Apply filter
    let filteredTasks = [...state.tasks];
    if (currentTaskFilter === 'pending') {
        filteredTasks = filteredTasks.filter(t => !t.completed);
    } else if (currentTaskFilter === 'completed') {
        filteredTasks = filteredTasks.filter(t => t.completed);
    }

    // Sort: Pending first, then by deadline
    filteredTasks.sort((a, b) => {
        if (a.completed === b.completed) return 0;
        return a.completed ? 1 : -1;
    });

    if (filteredTasks.length === 0) {
        const msg = currentTaskFilter === 'completed'
            ? 'No completed tasks yet. Keep going!'
            : currentTaskFilter === 'pending'
                ? 'All tasks completed! 🎉'
                : 'No tasks found.';
        systemList.innerHTML = `<div class="empty-state-text">${msg}</div>`;
        return;
    }

    systemList.innerHTML = filteredTasks.map(t => {
        const completedDateHTML = t.completed && t.completedAt
            ? `<div class="task-completed-date">Completed ${formatCompletedDate(t.completedAt)}</div>`
            : t.completed
                ? `<div class="task-completed-date">Completed</div>`
                : '';

        return `
        <div class="task-item ${t.completed ? 'completed' : ''}">
            <div class="task-icon purple">🎯</div>
            <div class="task-content">
                <div class="task-title ${t.completed ? 'completed' : ''}">${t.title}</div>
                <div class="task-due">${t.subtitle ? t.subtitle + ' • ' : ''}${t.deadline}</div>
                ${completedDateHTML}
            </div>
            <input type="checkbox" class="task-checkbox" ${t.completed ? 'checked' : ''} onclick="toggleTask('${t.id}', 'system')">
        </div>
    `}).join('');
}

// Format completion date
function formatCompletedDate(dateInput) {
    try {
        const d = new Date(dateInput);
        const now = new Date();
        const diff = now - d;
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
        return '';
    }
}

// Filter tasks handler
window.filterTasks = function (filter) {
    currentTaskFilter = filter;

    // Update active tab
    document.querySelectorAll('.task-filter-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.filter === filter);
    });

    // Re-render with current app state
    if (window.appStateRef) {
        renderAssignedTasks(window.appStateRef);
    }
};

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

        // Record completedAt timestamp on each task
        if (state.tasks) {
            state.tasks.forEach(t => {
                if (t.id === id) {
                    t.completedAt = t.completed ? new Date().toISOString() : null;
                }
            });
        }

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
        if (typeof UIUtils !== 'undefined' && UIUtils.showToast) {
            UIUtils.showToast('Please enter a task title', 'warning');
        } else {
            alert('Please enter a task title');
        }
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
