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
        const completed = skills.filter(s => s.level === 'Expert').length;
        const inProgress = skills.filter(s => s.level === 'Intermediate' || s.level === 'Beginner').length;
        const pending = skills.filter(s => s.level === 'Missing').length;
        drawPieChart(completed, inProgress, pending);
    }
}

// Draw Pie Chart
function drawPieChart(completed = 35, inProgress = 25, pending = 40) {
    const total = completed + inProgress + pending;
    if (total === 0) return;

    function createPieSegment(startAngle, endAngle) {
        const radius = 80;
        const cx = 100, cy = 100;
        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;
        const x1 = cx + radius * Math.cos(startRad);
        const y1 = cy + radius * Math.sin(startRad);
        const x2 = cx + radius * Math.cos(endRad);
        const y2 = cy + radius * Math.sin(endRad);
        const largeArc = endAngle - startAngle > 180 ? 1 : 0;
        return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    }

    let currentAngle = 0;
    const segments = [
        { id: 'segment-completed', val: completed, color: 'var(--accent-green)', label: 'Completed' },
        { id: 'segment-progress', val: inProgress, color: 'var(--accent-gold)', label: 'In Progress' },
        { id: 'segment-pending', val: pending, color: 'rgba(255,255,255,0.1)', label: 'Pending' }
    ];

    segments.forEach(seg => {
        const el = document.getElementById(seg.id);
        if (el && seg.val > 0) {
            const angle = (seg.val / total) * 360;
            el.setAttribute('d', createPieSegment(currentAngle, currentAngle + angle));

            // Add click interaction
            el.onclick = () => {
                const percent = Math.round((seg.val / total) * 100);
                const valueEl = document.getElementById('readiness-value');
                const labelEl = document.querySelector('.pie-label');
                if (valueEl) {
                    valueEl.textContent = `${percent}%`;
                    valueEl.style.color = seg.color;
                }
                if (labelEl) labelEl.textContent = seg.label;
            };

            currentAngle += angle;
        }
    });

    const readinessValue = document.getElementById('readiness-value');
    if (readinessValue) readinessValue.textContent = `${Math.round((completed / total) * 100)}%`;
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
