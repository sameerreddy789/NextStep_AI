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
    if (total === 0) return; // Prevent division by zero

    // Helper function to create SVG path for pie segment
    function createPieSegment(startAngle, endAngle) {
        const radius = 80;
        const cx = 100;
        const cy = 100;

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

    // Draw completed segment
    const completedAngle = (completed / total) * 360;
    if (completed > 0) {
        const el = document.getElementById('segment-completed');
        if (el) el.setAttribute('d', createPieSegment(currentAngle, currentAngle + completedAngle));
    }
    currentAngle += completedAngle;

    // Draw in-progress segment
    const progressAngle = (inProgress / total) * 360;
    if (inProgress > 0) {
        const el = document.getElementById('segment-progress');
        if (el) el.setAttribute('d', createPieSegment(currentAngle, currentAngle + progressAngle));
    }
    currentAngle += progressAngle;

    // Draw pending segment
    const pendingAngle = (pending / total) * 360;
    if (pending > 0) {
        const el = document.getElementById('segment-pending');
        if (el) el.setAttribute('d', createPieSegment(currentAngle, currentAngle + pendingAngle));
    }

    // Update center text (Initial view)
    const valueEl = document.getElementById('readiness-value');
    if (valueEl) {
        // Calculate readiness score
        const readiness = Math.round((completed / total) * 100) || 0;
        valueEl.textContent = `${readiness}%`;
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
