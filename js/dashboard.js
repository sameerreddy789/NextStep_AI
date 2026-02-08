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
    } else {
        console.error("SkillStore not found!");
    }

    // 2. Render User Info
    renderUserInfo(userData);

    // 3. Render Charts & Stats
    renderStats();
    renderCharts();

    // 4. Render Action Items
    renderActionItems();
});

function renderUserInfo(user) {
    const nameEl = document.getElementById('user-greeting-name');
    if (nameEl) {
        // Use first name or 'User'
        const name = user.name || user.email?.split('@')[0] || 'User';
        nameEl.textContent = name.split(' ')[0];
    }
}

function renderStats() {
    // Fetch data from SkillStore
    const skills = window.SkillStore ? SkillStore.getSkills() : [];
    const readiness = window.SkillStore ? SkillStore.getReadiness() : 0;

    // Update "Skills Covered"
    const skillsCount = document.getElementById('skills-covered');
    if (skillsCount) {
        // Count skills with status 'expert' or 'intermediate'
        const covered = skills.filter(s => s.level === 'Expert' || s.level === 'Intermediate').length;
        skillsCount.textContent = covered || 0;
    }

    // Update "Readiness Score" if element exists (might be in a different card)
    const readinessEl = document.getElementById('readiness-score');
    if (readinessEl) {
        readinessEl.textContent = `${readiness}%`;
    }
}

function renderCharts() {
    // 1. Pie Chart (Skills Breakdown)
    if (window.drawPieChart && window.SkillStore) {
        const skills = SkillStore.getSkills();
        const completed = skills.filter(s => s.level === 'Expert').length;
        const inProgress = skills.filter(s => s.level === 'Intermediate' || s.level === 'Beginner').length;
        const pending = skills.filter(s => s.level === 'Missing').length;

        // Use the global function defined in inline script (or move it here)
        window.drawPieChart(completed, inProgress, pending);
    }
}

function renderActionItems() {
    // Logic to show/hide "Complete X" cards based on progress
    const roadmapDone = localStorage.getItem('nextStep_roadmapCompleted');

    // Example: Toggle visibility of a "Start Roadmap" CTA
    const roadmapCard = document.getElementById('action-card-roadmap');
    if (roadmapCard) {
        roadmapCard.style.display = roadmapDone ? 'none' : 'block';
    }
}

// Make globally available if needed
window.DashboardManager = {
    refresh: () => {
        renderStats();
        renderCharts();
    }
};
