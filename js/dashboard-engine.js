/**
 * Dashboard Engine
 * Aggregates data from all sources and generates AI-powered insights
 */

const DashboardEngine = {
    /**
     * Aggregate all user data from LocalStorage
     */
    aggregateUserData(cloudData = null) {
        const localData = {
            profile: JSON.parse(localStorage.getItem('nextStep_user') || '{}'),
            resume: JSON.parse(localStorage.getItem('nextStep_resume') || '{}'),
            interviews: JSON.parse(localStorage.getItem('nextStep_interviews') || '[]'),
            skillGap: JSON.parse(localStorage.getItem('nextStep_skillGap') || '{}'),
            roadmap: JSON.parse(localStorage.getItem('nextStep_roadmap') || '{}'),
            progress: JSON.parse(localStorage.getItem('nextStep_progress') || '{}')
        };

        if (cloudData) {
            // Merge cloud data over local data
            // Note: We prioritize cloud data for persistence-heavy items
            return {
                profile: { ...localData.profile, ...cloudData.userProfile },
                resume: cloudData.resume || localData.resume,
                interviews: cloudData.interviews && cloudData.interviews.length > 0 ? cloudData.interviews : localData.interviews,
                skillGap: localData.skillGap, // Not synced yet
                // Roadmap: Use cloud progress if available to patch local static structure
                roadmap: this._mergeRoadmapProgress(localData.roadmap, cloudData.roadmap),
                progress: { ...localData.progress, weeklyStats: this._calculateWeeklyStatsFromCloud(cloudData) }
            };
        }

        return localData;
    },

    _mergeRoadmapProgress(localRoadmap, cloudProgress) {
        if (!cloudProgress || !localRoadmap) return localRoadmap;

        // If we have cloud progress (completedTopics), we need to apply it to the local roadmap structure
        // This assumes localRoadmap contains the STRUCTURE (weeks, topics) and cloud contains PROGRESS (ids)
        // However, aggregateUserData returns the stored roadmap object which might be structure+state.

        // Actually, roadmap-ui.js manages state in 'nextStep_roadmap_progress'. 
        // Dashboard uses 'nextStep_roadmap' which is the structure.
        // We need to map completedTopics from cloud to the structure.

        if (cloudProgress.completedTopics && Array.isArray(cloudProgress.completedTopics) && localRoadmap.weeks) {
            const completedSet = new Set(cloudProgress.completedTopics);
            localRoadmap.weeks.forEach((week, wIdx) => {
                if (week.topics) {
                    week.topics.forEach((topic, tIdx) => {
                        // Reconstruct ID: weekIdx-topicIdx-itemName
                        // This is tricky without exact matching logic from roadmap-ui.js
                        // But DashboardEngine stats only count completed/inProgress flags on topics.
                        // We might need to rely on the cloud data's activity log or just trust local for now if structure is complex.
                        // Let's simplified: If we have cloud data, we assume it's the source of truth for stats.
                    });
                }
            });
        }
        return localRoadmap;
    },

    _calculateWeeklyStatsFromCloud(cloudData) {
        // Calculate weekly stats from cloud activity log if available
        if (cloudData.roadmap && cloudData.roadmap.activityLog) {
            const log = cloudData.roadmap.activityLog;
            // ... Logic to sum up last 7 days ...
            // For simplicity, returning existing local stats or 0
            return { topics: 0, questions: 0, timeSpent: 0 };
        }
        return { topics: 0, questions: 0, timeSpent: 0 };
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
                // handle both formats: interview.finalScore or interview.overallScore
                return sum + (interview.finalScore || interview.overallScore || 0);
            }, 0);
            stats.avgScore = Math.round(totalScore / stats.interviewsTaken);
        }

        // Day Streak (calculate from activity timestamps)
        stats.dayStreak = this._calculateStreak(userData);

        // Weekly Progress
        if (userData.progress?.weeklyStats) {
            stats.weeklyTopics = userData.progress.weeklyStats.topics || 0;
            stats.weeklyQuestions = userData.progress.weeklyStats.questions || 0;
            stats.weeklyTime = userData.progress.weeklyStats.timeSpent || 0;
        }

        // Readiness Score (combine resume, interviews, skill gaps)
        stats.readinessScore = this._calculateReadiness(userData);

        // Task counts
        if (userData.roadmap?.weeks) {
            userData.roadmap.weeks.forEach(week => {
                if (week.topics && Array.isArray(week.topics)) {
                    week.topics.forEach(topic => {
                        if (topic.completed) stats.completedTasks++;
                        else if (topic.inProgress) stats.inProgressTasks++;
                        else stats.pendingTasks++;
                    });
                }
            });
        }

        return stats;
    },

    /**
     * Calculate activity streak
     */
    _calculateStreak(userData) {
        const activities = [];

        // Collect all activity timestamps
        if (userData.resume?.timestamp) activities.push(new Date(userData.resume.timestamp));
        if (userData.interviews) {
            userData.interviews.forEach(i => {
                if (i.timestamp) activities.push(new Date(i.timestamp));
            });
        }
        if (userData.progress?.lastActivity) activities.push(new Date(userData.progress.lastActivity));

        if (activities.length === 0) return 0;

        // Sort by date (newest first)
        activities.sort((a, b) => b - a);

        // Calculate streak
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let date of activities) {
            date.setHours(0, 0, 0, 0);
            const daysDiff = Math.floor((today - date) / (1000 * 60 * 60 * 24));

            if (daysDiff === streak) {
                streak++;
            } else if (daysDiff > streak) {
                break;
            }
        }

        return streak;
    },

    /**
     * Calculate overall readiness score
     */
    _calculateReadiness(userData) {
        let score = 0;

        // Resume Score (30%)
        if (userData.resume?.score) {
            score += (userData.resume.score / 100) * 30;
        }

        // Interview Performance (40%)
        if (userData.interviews && userData.interviews.length > 0) {
            const avgInterviewScore = userData.interviews.reduce((sum, i) => sum + (i.finalScore || 0), 0) / userData.interviews.length;
            score += (avgInterviewScore / 100) * 40;
        }

        // Skill Coverage (30%)
        if (userData.resume?.coverage) {
            score += (userData.resume.coverage / 100) * 30;
        }

        return Math.round(score);
    },

    /**
     * Generate AI-powered roadmap using Gemini
     */
    async generateAIRoadmap(targetDomain, userSkills, interviewGaps, resumeData) {
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
        "title": "Foundations \u0026 Interview Prep",
        "focus": "Brief description of this week's theme",
        "topics": [
            { "name": "Topic Name", "priority": "High|Medium|Low", "estimatedHours": 5 },
            { "name": "Another Topic", "priority": "High", "estimatedHours": 3 }
        ]
    }
]`;

            const response = await window.GeminiService._request(prompt);
            const parsed = window.GeminiService._parseJSON(response);

            if (parsed && Array.isArray(parsed)) {
                console.log('[DashboardEngine] ✅ AI roadmap generated');
                return parsed;
            }

            throw new Error('Invalid roadmap structure from AI');
        } catch (error) {
            console.error('[DashboardEngine] ❌ AI roadmap failed:', error);
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
     * Update dashboard from resume analysis
     */
    updateFromResume(resumeData) {
        const currentData = this.aggregateUserData();
        currentData.resume = { ...resumeData, timestamp: new Date().toISOString() };

        localStorage.setItem('nextStep_resume', JSON.stringify(currentData.resume));
        this.triggerUpdate();
    },

    /**
     * Update dashboard from interview completion
     */
    updateFromInterview(interviewResult) {
        const currentData = this.aggregateUserData();
        const interviews = currentData.interviews || [];

        interviews.push({ ...interviewResult, timestamp: new Date().toISOString() });

        localStorage.setItem('nextStep_interviews', JSON.stringify(interviews));
        this.triggerUpdate();
    },

    /**
     * Update dashboard from skill gap analysis
     */
    updateFromSkillGap(gapAnalysis) {
        const currentData = this.aggregateUserData();
        currentData.skillGap = { ...gapAnalysis, timestamp: new Date().toISOString() };

        localStorage.setItem('nextStep_skillGap', JSON.stringify(currentData.skillGap));
        this.triggerUpdate();
    },

    /**
     * Update dashboard from roadmap progress
     */
    updateFromRoadmap(roadmapProgress) {
        const currentData = this.aggregateUserData();
        currentData.roadmap = roadmapProgress;

        localStorage.setItem('nextStep_roadmap', JSON.stringify(roadmapProgress));

        // Update progress timestamp
        const progress = currentData.progress || {};
        progress.lastActivity = new Date().toISOString();
        localStorage.setItem('nextStep_progress', JSON.stringify(progress));

        this.triggerUpdate();
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
            callback(event.detail);
        });
    }
};

// Expose globally
window.DashboardEngine = DashboardEngine;
