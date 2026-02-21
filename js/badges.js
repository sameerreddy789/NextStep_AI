/**
 * Badge System for NextStep AI
 * Defines badges, checks conditions, awards and persists them.
 */

const BADGES_KEY = 'nextStep_badges';

const BADGE_DEFINITIONS = [
    // Resume badges
    {
        id: 'first-upload',
        name: 'First Impression',
        icon: '📄',
        description: 'Upload your first resume',
        category: 'resume',
        check: (data) => !!data.resume?.atsScore
    },
    {
        id: 'resume-pro',
        name: 'Resume Pro',
        icon: '⭐',
        description: 'Score 80+ on resume ATS analysis',
        category: 'resume',
        check: (data) => (data.resume?.atsScore || 0) >= 80
    },
    {
        id: 'resume-perfect',
        name: 'Flawless Resume',
        icon: '💎',
        description: 'Score 95+ on resume ATS analysis',
        category: 'resume',
        check: (data) => (data.resume?.atsScore || 0) >= 95
    },

    // Interview badges
    {
        id: 'first-interview',
        name: 'Ice Breaker',
        icon: '🎤',
        description: 'Complete your first interview',
        category: 'interview',
        check: (data) => data.interviews?.length >= 1
    },
    {
        id: 'interview-5',
        name: 'Interview Veteran',
        icon: '🏅',
        description: 'Complete 5 interviews',
        category: 'interview',
        check: (data) => data.interviews?.length >= 5
    },
    {
        id: 'interview-10',
        name: 'Interview Master',
        icon: '🏆',
        description: 'Complete 10 interviews',
        category: 'interview',
        check: (data) => data.interviews?.length >= 10
    },
    {
        id: 'high-scorer',
        name: 'High Scorer',
        icon: '🎯',
        description: 'Score 80+ in any interview',
        category: 'interview',
        check: (data) => data.interviews?.some(i => (i.finalScore || i.overallScore || 0) >= 80)
    },

    // Roadmap badges
    {
        id: 'roadmap-started',
        name: 'Pathfinder',
        icon: '🗺️',
        description: 'Start your learning roadmap',
        category: 'roadmap',
        check: (data) => data.roadmap?.weeks?.length > 0
    },
    {
        id: 'roadmap-25',
        name: 'Quarter Way',
        icon: '🚶',
        description: 'Complete 25% of your roadmap',
        category: 'roadmap',
        check: (data) => {
            if (!data.roadmap?.totalTasks || !data.progress?.completedTopics) return false;
            return data.progress.completedTopics.length / data.roadmap.totalTasks >= 0.25;
        }
    },
    {
        id: 'roadmap-50',
        name: 'Halfway Hero',
        icon: '⚡',
        description: 'Complete 50% of your roadmap',
        category: 'roadmap',
        check: (data) => {
            if (!data.roadmap?.totalTasks || !data.progress?.completedTopics) return false;
            return data.progress.completedTopics.length / data.roadmap.totalTasks >= 0.50;
        }
    },
    {
        id: 'roadmap-100',
        name: 'Road Scholar',
        icon: '🎓',
        description: 'Complete your entire roadmap',
        category: 'roadmap',
        check: (data) => {
            if (!data.roadmap?.totalTasks || !data.progress?.completedTopics) return false;
            return data.progress.completedTopics.length >= data.roadmap.totalTasks;
        }
    },

    // Streak badges
    {
        id: 'streak-3',
        name: 'Getting Started',
        icon: '🔥',
        description: 'Maintain a 3-day activity streak',
        category: 'streak',
        check: (data) => getConsecutiveDays(data.activity) >= 3
    },
    {
        id: 'streak-7',
        name: 'Week Warrior',
        icon: '💪',
        description: 'Maintain a 7-day activity streak',
        category: 'streak',
        check: (data) => getConsecutiveDays(data.activity) >= 7
    },
    {
        id: 'streak-30',
        name: 'Unstoppable',
        icon: '👑',
        description: 'Maintain a 30-day activity streak',
        category: 'streak',
        check: (data) => getConsecutiveDays(data.activity) >= 30
    },

    // Skill gap badges
    {
        id: 'skill-scan',
        name: 'Self Aware',
        icon: '🔍',
        description: 'Complete your first skill gap analysis',
        category: 'skills',
        check: (data) => data.skillGap?.length > 0 || data.skillGapData?.skills?.length > 0
    },

    // Readiness badges
    {
        id: 'readiness-50',
        name: 'Getting There',
        icon: '📈',
        description: 'Reach 50% job readiness score',
        category: 'readiness',
        check: (data) => (data.readinessScore || 0) >= 50
    },
    {
        id: 'readiness-80',
        name: 'Job Ready',
        icon: '🚀',
        description: 'Reach 80% job readiness score',
        category: 'readiness',
        check: (data) => (data.readinessScore || 0) >= 80
    }
];

/**
 * Calculate consecutive days from an activity log { "YYYY-MM-DD": count }
 */
function getConsecutiveDays(activity) {
    if (!activity || typeof activity !== 'object') return 0;

    const dates = Object.keys(activity).sort().reverse();
    if (dates.length === 0) return 0;

    const today = new Date().toISOString().split('T')[0];
    // Start counting from today or yesterday
    if (dates[0] !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        if (dates[0] !== yesterday) return 0;
    }

    let streak = 1;
    for (let i = 0; i < dates.length - 1; i++) {
        const curr = new Date(dates[i]);
        const prev = new Date(dates[i + 1]);
        const diff = (curr - prev) / 86400000;
        if (diff === 1) {
            streak++;
        } else {
            break;
        }
    }
    return streak;
}

/**
 * Get earned badges from localStorage
 */
function getEarnedBadges() {
    const stored = localStorage.getItem(BADGES_KEY);
    return stored ? JSON.parse(stored) : {};
}

/**
 * Save earned badges to localStorage
 */
function saveEarnedBadges(badges) {
    try {
        localStorage.setItem(BADGES_KEY, JSON.stringify(badges));
    } catch (e) {
        console.warn('[Badges] Failed to save:', e.message);
    }
}

/**
 * Check all badges against current user data and award new ones.
 * Returns array of newly earned badge IDs.
 */
function checkAndAwardBadges(userData) {
    const earned = getEarnedBadges();
    const newlyEarned = [];

    BADGE_DEFINITIONS.forEach(badge => {
        if (earned[badge.id]) return; // Already earned

        try {
            if (badge.check(userData)) {
                earned[badge.id] = {
                    earnedAt: new Date().toISOString()
                };
                newlyEarned.push(badge);
            }
        } catch (e) {
            // Silently skip if check fails
        }
    });

    if (newlyEarned.length > 0) {
        saveEarnedBadges(earned);
    }

    return newlyEarned;
}

/**
 * Show celebration for newly earned badges
 */
function celebrateNewBadges(newBadges) {
    if (!newBadges.length) return;
    if (typeof showCelebrationModal !== 'function') return;

    // Show first badge immediately, queue others
    const showBadge = (index) => {
        if (index >= newBadges.length) return;
        const badge = newBadges[index];

        showCelebrationModal({
            title: `${badge.icon} Badge Unlocked!`,
            message: `You earned "${badge.name}" — ${badge.description}`,
            showConfetti: true,
            onClose: () => {
                if (index + 1 < newBadges.length) {
                    setTimeout(() => showBadge(index + 1), 500);
                }
            }
        });
    };

    showBadge(0);
}

/**
 * Render badges showcase into a container element
 */
function renderBadgesShowcase(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const earned = getEarnedBadges();
    const earnedCount = Object.keys(earned).length;
    const totalCount = BADGE_DEFINITIONS.length;

    container.innerHTML = `
        <div class="card-header">
            <h3 class="card-title">Badges</h3>
            <span class="badge-counter">${earnedCount}/${totalCount}</span>
        </div>
        <div class="badges-grid">
            ${BADGE_DEFINITIONS.map(badge => {
                const isEarned = !!earned[badge.id];
                return `
                    <div class="badge-item ${isEarned ? 'earned' : 'locked'}" title="${badge.description}">
                        <div class="badge-icon">${isEarned ? badge.icon : '🔒'}</div>
                        <div class="badge-name">${badge.name}</div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

/**
 * Gather user data from all available sources for badge checking
 */
function gatherBadgeData(appStateData) {
    if (appStateData) {
        return {
            resume: appStateData.resumeData,
            interviews: appStateData.interviews || [],
            roadmap: appStateData.roadmap,
            progress: appStateData.roadmapProgress,
            skillGap: appStateData.skillGap,
            readinessScore: appStateData.readinessScore || 0,
            activity: appStateData.learningActivity || {}
        };
    }

    // Fallback: read from localStorage directly
    return {
        resume: JSON.parse(localStorage.getItem('nextStep_resume') || 'null'),
        interviews: JSON.parse(localStorage.getItem('nextStep_interviews') || '[]'),
        roadmap: JSON.parse(localStorage.getItem('nextStep_roadmap') || 'null'),
        progress: JSON.parse(localStorage.getItem('nextStep_roadmap_progress') || 'null'),
        skillGap: JSON.parse(localStorage.getItem('nextStep_skillGap') || 'null'),
        readinessScore: 0,
        activity: JSON.parse(localStorage.getItem('nextStep_activity') || '{}')
    };
}

// Export globally
window.BadgeSystem = {
    BADGE_DEFINITIONS,
    checkAndAwardBadges,
    celebrateNewBadges,
    renderBadgesShowcase,
    gatherBadgeData,
    getEarnedBadges
};
