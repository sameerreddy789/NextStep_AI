/**
 * dashboard.js
 * Manages the dashboard UI, data visualization, and user progress.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Data
    const userRole = localStorage.getItem('userType') || 'student';
    const userData = JSON.parse(localStorage.getItem('nextStep_user') || '{}');

    // Initialize Stores
    if (window.SkillStore) {
        SkillStore.init();
    }

    // 2. Render User Info
    renderUserInfo(userData);

    // 3. Render Charts & Stats
    renderStats();
    renderCharts();

    // 4. Render Action Items
    renderActionItems();

    // 5. Initialize Interactive Elements
    renderTasks();
    updateWeeklyProgress();

    // 6. Handle Global Logout
    window.logout = function () {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.clear();
            window.location.href = 'index.html';
        }
    };
});

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

function renderStats() {
    const skills = window.SkillStore ? SkillStore.getSkills() : [];
    const readiness = window.SkillStore ? SkillStore.getReadiness() : 0;

    const skillsCount = document.getElementById('skills-covered');
    if (skillsCount) {
        const covered = skills.filter(s => s.level === 'Expert' || s.level === 'Intermediate').length;
        skillsCount.textContent = covered || 0;
    }

    const readinessEl = document.getElementById('readiness-score');
    if (readinessEl) readinessEl.textContent = `${readiness}%`;
}

function renderCharts() {
    if (window.SkillStore) {
        const skills = SkillStore.getSkills();
        const totalSkills = skills.length || 1;

        // Categorize progress contribution rather than simple counts
        let completedProgress = 0;
        let inProgressProgress = 0;

        skills.forEach(s => {
            if (s.progress >= 90) {
                completedProgress += s.progress;
            } else if (s.progress > 0) {
                inProgressProgress += s.progress;
            }
        });

        const totalPossible = totalSkills * 100;
        const totalAchieved = completedProgress + inProgressProgress;
        const pendingProgress = totalPossible - totalAchieved;

        // Draw chart using progress-weighted segments
        drawPieChart(completedProgress, inProgressProgress, pendingProgress);
    }
}

// Draw Static Pie/Donut Chart using progress values
function drawPieChart(completedVal = 0, inProgressVal = 0, pendingVal = 0) {
    const total = completedVal + inProgressVal + pendingVal;
    const svg = document.querySelector('.readiness-svg');
    const scoreBig = document.getElementById('readiness-score-big');

    // Calculate Overall Score (Progress Average across all skills)
    const overallReadiness = window.SkillStore ? SkillStore.getReadiness() : 0;
    if (scoreBig) scoreBig.textContent = `${overallReadiness}%`;

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
function renderAssignedTasks() {
    if (!window.SkillStore) return;
    const systemList = document.getElementById('system-task-list');
    if (!systemList) return;

    const tasks = SkillStore.getTasks();
    const systemTasks = tasks.filter(t => t.type === 'system');

    systemList.innerHTML = systemTasks.map(t => `
        <div class="task-item ${t.completed ? 'completed' : ''}">
            <div class="task-icon ${t.color}">${t.icon}</div>
            <div class="task-content">
                <div class="task-title ${t.completed ? 'completed' : ''}">${t.title}</div>
                <div class="task-due">${t.due}</div>
            </div>
            <input type="checkbox" class="task-checkbox" ${t.completed ? 'checked' : ''} onclick="toggleTask('${t.id}', 'system')">
        </div>
    `).join('') || '<div class="empty-state-text">No assigned tasks yet.</div>';
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
function renderTasks() {
    renderAssignedTasks();
    renderUserTasks();
}

window.toggleTask = (id, type) => {
    if (window.SkillStore) {
        SkillStore.toggleTask(id);
        if (type === 'system') renderAssignedTasks();
        else renderUserTasks();
    }
};

let taskToDeleteId = null;

window.deleteTask = id => {
    taskToDeleteId = id;
    const modal = document.getElementById('delete-confirm-modal');
    if (modal) modal.classList.add('active');
};

window.closeDeleteModal = () => {
    taskToDeleteId = null;
    const modal = document.getElementById('delete-confirm-modal');
    if (modal) modal.classList.remove('active');
};

window.confirmDelete = () => {
    if (taskToDeleteId && window.SkillStore) {
        SkillStore.deleteTask(taskToDeleteId);
        renderUserTasks(); // Only refresh personal tasks
        closeDeleteModal();
        if (window.showToast) {
            showToast('Task removed');
        }
    }
};

function renderPrioritySkills() {
    if (!window.SkillStore) return;
    const skillList = document.getElementById('skill-gaps');
    if (!skillList) return;

    const skills = SkillStore.getPrioritySkills();
    skillList.innerHTML = skills.map(s => `
        <div class="skill-mini-item">
            <div class="skill-mini-icon">${s.icon || '🚀'}</div>
            <div class="skill-mini-name">${s.name}</div>
            <span class="skill-mini-priority ${s.priority === 'Medium' ? 'medium' : ''}">${s.priority}</span>
            <div onclick="deletePrioritySkill('${s.id}')" style="margin-left: auto; cursor: pointer;">✕</div>
        </div>
    `).join('');
}

window.deletePrioritySkill = id => { if (confirm('Remove?')) { SkillStore.deletePrioritySkill(id); renderPrioritySkills(); } };

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

function renderActionItems() {
    const roadmapDone = localStorage.getItem('nextStep_roadmapCompleted');
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
