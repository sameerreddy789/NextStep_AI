// @ts-check
import { appState } from './app-state.js';

/**
 * Dashboard Engine
 * Aggregates data from all sources and generates AI-powered insights.
 * Now unified to use appState as the single source of truth.
 */
const DashboardEngine = {
    /**
     * Aggregate all user data from the central App State
     */
    aggregateUserData() {
        // We prioritize the unified appState
        return {
            profile: appState.user || {},
            resume: appState.resumeData || {},
            interviews: appState.interviews || [],
            skillGap: appState.skillGap || {},
            roadmap: appState.roadmap || {},
            progress: appState.roadmapProgress || {},
            learningActivity: appState.learningActivity || {}
        };
    },

    /**
     * Calculate real-time statistics
     */
    calculateStatistics(userData) {
        const stats = {
            skillsCovered: 0,
            interviewsTaken: 0,
            avgScore: 0,
            dayStreak: 0,
            weeklyTopics: 0,
            weeklyQuestions: 0,
            weeklyTime: 0,
            readinessScore: 0,
            completedTasks: 0,
            inProgressTasks: 0,
            pendingTasks: 0
        };

        // Skills Covered
        if (userData.resume?.skills) {
            const presentSkills = Array.isArray(userData.resume.skills.present)
                ? userData.resume.skills.present
                : [];
            const partialSkills = Array.isArray(userData.resume.skills.partial)
                ? userData.resume.skills.partial
                : [];
            stats.skillsCovered = presentSkills.length + partialSkills.length;
        }

        // Interviews Taken
        stats.interviewsTaken = Array.isArray(userData.interviews) ? userData.interviews.length : 0;

        // Average Score
        if (stats.interviewsTaken > 0) {
            const totalScore = userData.interviews.reduce((sum, interview) => {
                return sum + (interview.finalScore || interview.overallScore || 0);
            }, 0);
            stats.avgScore = Math.round(totalScore / stats.interviewsTaken);
        }

        // Day Streak
        stats.dayStreak = this._calculateStreak(userData);

        // Readiness Score
        stats.readinessScore = appState.readinessScore || 0;

        // Task counts (from flattened tasks in appState)
        if (appState.tasks && Array.isArray(appState.tasks)) {
            appState.tasks.forEach(task => {
                if (task.completed) stats.completedTasks++;
                else stats.pendingTasks++; // appState doesn't explicitly track 'inProgress' in flattened tasks yet
            });
        }

        return stats;
    },

    /**
     * Calculate activity streak using learningActivity from appState
     */
    _calculateStreak(userData) {
        const activityLog = userData.learningActivity || {};
        const dates = Object.keys(activityLog).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

        if (dates.length === 0) return 0;

        let streak = 0;
        let checkDate = new Date();
        checkDate.setHours(0, 0, 0, 0);

        // Check if today or yesterday was the last activity to keep streak alive
        const lastActivityDate = new Date(dates[0]);
        lastActivityDate.setHours(0, 0, 0, 0);
        
        const diffDays = Math.floor((checkDate.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays > 1) return 0; // Streak broken

        for (let i = 0; i < dates.length; i++) {
            const date = new Date(dates[i]);
            date.setHours(0, 0, 0, 0);
            
            const expectedDate = new Date(checkDate);
            expectedDate.setDate(checkDate.getDate() - i);
            
            // If the last activity was yesterday, offset the check
            if (diffDays === 1 && i === 0) {
                expectedDate.setDate(expectedDate.getDate() - 1);
            }

            if (date.getTime() === expectedDate.getTime()) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    },

    /**
     * Generate AI-powered roadmap using Gemini
     */
    async generateAIRoadmap(targetDomain, userSkills, interviewGaps, resumeData) {
        // @ts-ignore - GeminiService is global or imported elsewhere
        if (!window.GeminiService || !window.GeminiService.isAvailable()) {
            console.warn('[DashboardEngine] Gemini not available, using fallback roadmap');
            return this._getFallbackRoadmap(targetDomain);
        }

        try {
            console.log('[DashboardEngine] 🤖 Generating AI roadmap for:', targetDomain);

            const prompt = `You are a career advisor AI. Create a personalized 4-week learning roadmap for someone targeting the role: "${targetDomain}".

User Context:
- Current Skills: ${JSON.stringify(userSkills || [])}
- Interview Weak Points: ${JSON.stringify(interviewGaps || [])}
- Resume Experience: ${JSON.stringify(resumeData?.experience || [])}

Create a focused, actionable 4-week plan that:
1. Week 1-2: Address critical interview weaknesses
2. Week 3: Build missing "must-have" skills for ${targetDomain}
3. Week 4: Learn advanced/future-proof concepts

Respond with ONLY a JSON array of weeks:
[
    {
        "week": 1,
        "title": "Foundations & Interview Prep",
        "focus": "Brief description of this week's theme",
        "topics": [
            { "name": "Topic Name", "priority": "High|Medium|Low", "estimatedHours": 5 },
            { "name": "Another Topic", "priority": "High", "estimatedHours": 3 }
        ]
    }
]`;

            // @ts-ignore
            const response = await window.GeminiService._request(prompt);
            // @ts-ignore
            const parsed = window.GeminiService._parseJSON(response);

            if (parsed && Array.isArray(parsed)) {
                console.log('[DashboardEngine] ✅ AI roadmap generated');
                return parsed;
            }

            throw new Error('Invalid roadmap structure from AI');
        } catch (error) {
            console.error('[DashboardEngine] 🚨 AI roadmap failed:', error);
            return this._getFallbackRoadmap(targetDomain);
        }
    },

    /**
     * Fallback roadmap when AI is unavailable
     */
    _getFallbackRoadmap(domain) {
        return [
            {
                week: 1,
                title: "Core Foundations",
                focus: `Master the fundamentals required for ${domain}`,
                topics: [
                    { name: "Programming Fundamentals", priority: "High", estimatedHours: 8 },
                    { name: "Data Structures & Algorithms", priority: "High", estimatedHours: 10 }
                ]
            },
            {
                week: 2,
                title: "Interview Preparation",
                focus: "Practice technical interviews and problem-solving",
                topics: [
                    { name: "Coding Interview Practice", priority: "High", estimatedHours: 12 },
                    { name: "System Design Basics", priority: "Medium", estimatedHours: 6 }
                ]
            },
            {
                week: 3,
                title: "Domain-Specific Skills",
                focus: `Build expertise in ${domain} technologies`,
                topics: [
                    { name: "Framework Mastery", priority: "High", estimatedHours: 10 },
                    { name: "Best Practices", priority: "Medium", estimatedHours: 5 }
                ]
            },
            {
                week: 4,
                title: "Advanced Concepts",
                focus: "Future-proof your skillset",
                topics: [
                    { name: "Cloud Technologies", priority: "Medium", estimatedHours: 6 },
                    { name: "DevOps Fundamentals", priority: "Low", estimatedHours: 4 }
                ]
            }
        ];
    },

    /**
     * Trigger dashboard update event
     */
    triggerUpdate() {
        window.dispatchEvent(new CustomEvent('dashboardUpdate', {
            detail: this.aggregateUserData()
        }));
    },

    /**
     * Subscribe to dashboard updates
     */
    subscribe(callback) {
        window.addEventListener('dashboardUpdate', (event) => {
            // @ts-ignore
            callback(event.detail);
        });
    }
};

// Expose globally for legacy integration
// @ts-ignore
window.DashboardEngine = DashboardEngine;
export { DashboardEngine };
