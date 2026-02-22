/**
 * Shared Stats Bar — Injects a consistent stats row on any page.
 * Reads real data from appState and updates dynamically.
 */
import { appState } from '../app-state.js';

const STATS_BAR_HTML = `
<div class="stats-row" id="global-stats-row">
    <div class="stat-card-new">
        <div class="stat-card-header">
            <span class="stat-card-title">Skills Covered</span>
            <span class="stat-card-icon">📊</span>
        </div>
        <div class="stat-card-value" id="skills-covered">—</div>
        <div class="stat-card-change" id="skills-change"></div>
    </div>
    <div class="stat-card-new">
        <div class="stat-card-header">
            <span class="stat-card-title">Interviews Taken</span>
            <span class="stat-card-icon">🎤</span>
        </div>
        <div class="stat-card-value" id="interviews-taken">—</div>
        <div class="stat-card-change" id="interviews-change"></div>
    </div>
    <div class="stat-card-new">
        <div class="stat-card-header">
            <span class="stat-card-title">Avg. Score</span>
            <span class="stat-card-icon">📈</span>
        </div>
        <div class="stat-card-value" id="avg-score">—</div>
        <div class="stat-card-change" id="avg-score-change"></div>
    </div>
    <div class="stat-card-new">
        <div class="stat-card-header">
            <span class="stat-card-title">Day Streak</span>
            <span class="stat-card-icon">🔥</span>
        </div>
        <div class="stat-card-value" id="day-streak">—</div>
        <div class="stat-card-change" id="streak-change"></div>
    </div>
</div>`;

function calculateStreak(activityLog) {
    let dayStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let checkDate = new Date(today);
    const todayStr = checkDate.toISOString().split('T')[0];
    if (!activityLog[todayStr]) {
        checkDate.setDate(checkDate.getDate() - 1);
    }
    while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (activityLog[dateStr] && activityLog[dateStr] > 0) {
            dayStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }
    return dayStreak;
}

function updateStatsUI(state) {
    if (!state.user) return;

    const skillsCovered = (state.resumeData?.skills?.present?.length || 0) + (state.resumeData?.skills?.partial?.length || 0);
    const interviewsTaken = state.interviews.length;
    let avgScore = 0;
    if (interviewsTaken > 0) {
        const total = state.interviews.reduce((sum, i) => sum + (i.finalScore || i.overallScore || 0), 0);
        avgScore = Math.round(total / interviewsTaken);
    }
    const dayStreak = calculateStreak(state.learningActivity || {});

    const el = (id) => document.getElementById(id);

    const elSkills = el('skills-covered');
    const elInterviews = el('interviews-taken');
    const elAvg = el('avg-score');
    const elStreak = el('day-streak');

    if (elSkills) elSkills.textContent = skillsCovered;
    if (elInterviews) elInterviews.textContent = interviewsTaken;
    if (elAvg) elAvg.textContent = interviewsTaken > 0 ? `${avgScore}%` : '—';
    if (elStreak) elStreak.textContent = dayStreak;

    // Contextual change text
    const elSkillsChange = el('skills-change');
    const elInterviewsChange = el('interviews-change');
    const elAvgChange = el('avg-score-change');
    const elStreakChange = el('streak-change');

    if (elSkillsChange) {
        if (skillsCovered === 0) {
            elSkillsChange.textContent = 'Upload resume to detect skills';
            elSkillsChange.className = 'stat-card-change';
        } else {
            elSkillsChange.innerHTML = `<span>✓</span> ${skillsCovered} skills detected`;
            elSkillsChange.className = 'stat-card-change positive';
        }
    }
    if (elInterviewsChange) {
        if (interviewsTaken === 0) {
            elInterviewsChange.textContent = 'Take your first interview';
            elInterviewsChange.className = 'stat-card-change';
        } else {
            elInterviewsChange.innerHTML = `<span>✓</span> ${interviewsTaken} session${interviewsTaken > 1 ? 's' : ''} completed`;
            elInterviewsChange.className = 'stat-card-change positive';
        }
    }
    if (elAvgChange) {
        if (interviewsTaken === 0) {
            elAvgChange.textContent = 'No interviews yet';
            elAvgChange.className = 'stat-card-change';
        } else if (avgScore >= 70) {
            elAvgChange.innerHTML = '<span>↑</span> Strong performance';
            elAvgChange.className = 'stat-card-change positive';
        } else if (avgScore >= 40) {
            elAvgChange.textContent = 'Room to improve';
            elAvgChange.className = 'stat-card-change';
        } else {
            elAvgChange.textContent = 'Keep practicing';
            elAvgChange.className = 'stat-card-change';
        }
    }
    if (elStreakChange) {
        if (dayStreak === 0) {
            elStreakChange.textContent = 'Start learning today';
            elStreakChange.className = 'stat-card-change';
        } else if (dayStreak >= 7) {
            elStreakChange.innerHTML = '<span>🔥</span> On fire! Keep going';
            elStreakChange.className = 'stat-card-change positive';
        } else {
            elStreakChange.innerHTML = `<span>↑</span> ${dayStreak} day${dayStreak > 1 ? 's' : ''} in a row`;
            elStreakChange.className = 'stat-card-change positive';
        }
    }
}

/**
 * Inject the stats bar into the page.
 * Call this after the page header, before main content.
 * If a #global-stats-row already exists (e.g. dashboard.html), it just updates data.
 */
export function initStatsBar() {
    // Don't inject if already present (dashboard has it in HTML)
    if (!document.getElementById('global-stats-row')) {
        // Find the best insertion point: after .page-header or at top of .main-content
        const pageHeader = document.querySelector('.page-header');
        const mainContent = document.querySelector('.main-content');
        if (pageHeader) {
            pageHeader.insertAdjacentHTML('afterend', STATS_BAR_HTML);
        } else if (mainContent) {
            mainContent.insertAdjacentHTML('afterbegin', STATS_BAR_HTML);
        }
    }

    // If appState already has user data, update immediately
    if (appState.user) {
        updateStatsUI(appState);
    }

    // Subscribe to live updates (covers initial load + future changes)
    appState.subscribe(updateStatsUI);
}