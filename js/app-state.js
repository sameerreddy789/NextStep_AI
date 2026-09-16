// @ts-check
import { auth } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { StorageService } from './services/storage.js';

/**
 * @typedef {Object} UserProfile
 * @property {string} uid
 * @property {string} [displayName]
 * @property {string} [email]
 * @property {string} [photoURL]
 * @property {string} [targetRole]
 * @property {string} [jobReadyTimeline]
 * @property {string} [dailyCommitment]
 * @property {boolean} [onboardingComplete]
 */

const APP_STATE_CACHE_KEY = 'nextStep_appState_cache';
const APP_STATE_CACHE_TTL = 3600000; // 1 hour

/**
 * Global App State Manager
 * Centralized store using ES2023 Class patterns and Hybrid Persistence.
 */
class AppState {
    #listeners = new Set();
    #cacheTTL = APP_STATE_CACHE_TTL;

    // Core Data (Reactive properties)
    user = null;
    resumeData = null;
    skillGap = null;
    interviews = [];
    roadmap = null;
    roadmapProgress = null;
    
    // Derived Data
    tasks = [];
    skills = [];
    prioritySkills = [];
    personalTasks = [];
    readinessScore = 0;
    learningActivity = {};

    constructor() {
        console.log('[AppState] 🚀 Engine Starting...');
    }

    /**
     * Initialize state with Auth listener and Cache hydration
     */
    async init(forceRefresh = false) {
        return new Promise((resolve) => {
            onAuthStateChanged(auth, async (user) => {
                if (user) {
                    this.user = {
                        uid: user.uid,
                        displayName: user.displayName || 'User',
                        email: user.email || '',
                        photoURL: user.photoURL || '',
                        onboardingComplete: false
                    };

                    let hydrated = !forceRefresh && this.#hydrateFromCache(user.uid);
                    
                    if (hydrated) {
                        console.log('[AppState] ⚡ Fast-boot from cache');
                        this.notifyListeners();
                        resolve(true);
                    }

                    // Background Sync
                    const fresh = await this.fetchAllData(user.uid);
                    if (fresh) {
                        this.#saveToCache(user.uid);
                        console.log('[AppState] 🔄 Sync complete');
                    }
                    
                    this.notifyListeners();
                    resolve(true);
                } else {
                    this.reset();
                    resolve(false);
                }
            });
        });
    }

    /**
     * Observer Subscription
     */
    subscribe(callback) {
        this.#listeners.add(callback);
        callback(this);
        return () => this.#listeners.delete(callback);
    }

    notifyListeners() {
        this.#listeners.forEach(cb => cb(this));
    }

    #saveToCache(uid) {
        const payload = {
            uid,
            ts: Date.now(),
            data: {
                resumeData: this.resumeData,
                skillGap: this.skillGap,
                roadmap: this.roadmap,
                roadmapProgress: this.roadmapProgress,
                interviews: this.interviews,
                skills: this.skills,
                prioritySkills: this.prioritySkills,
                personalTasks: this.personalTasks,
                learningActivity: this.learningActivity,
                user: this.user
            }
        };
        StorageService.localSet(APP_STATE_CACHE_KEY, payload);
    }

    #hydrateFromCache(uid) {
        const payload = StorageService.localGet(APP_STATE_CACHE_KEY);
        if (!payload || payload.uid !== uid || (Date.now() - payload.ts > this.#cacheTTL)) return false;

        Object.assign(this, payload.data);
        this.calculateReadiness();
        this.generateTasksList();
        return true;
    }

    invalidateCache() {
        StorageService.localRemove(APP_STATE_CACHE_KEY);
    }

    async fetchAllData(uid) {
        try {
            const [
                profile, resume, structure, current, progress, interviews, skills, tasks, priority
            ] = await Promise.all([
                StorageService.firestoreGet(`users/${uid}`),
                StorageService.firestoreGet(`users/${uid}/analysis/resume`),
                StorageService.firestoreGet(`users/${uid}/roadmap/structure`),
                StorageService.firestoreGet(`users/${uid}/roadmap/current`),
                StorageService.firestoreGet(`users/${uid}/roadmap/progress`),
                StorageService.firestoreGetCollection(`users/${uid}/interviews`),
                StorageService.firestoreGet(`users/${uid}/data/skills`),
                StorageService.firestoreGet(`users/${uid}/data/tasks`),
                StorageService.firestoreGet(`users/${uid}/data/priority_skills`)
            ]);

            if (profile) this.user = { ...this.user, ...profile };
            this.resumeData = resume;
            this.interviews = interviews || [];
            this.roadmap = structure || current;
            this.skillGap = progress?.skills || [];
            this.roadmapProgress = progress || { completedTopics: [], activityLog: {} };
            this.learningActivity = this.roadmapProgress.activityLog || {};
            this.skills = skills?.items || [];
            this.personalTasks = tasks?.items || [];
            this.prioritySkills = priority?.items || [];

            this.calculateReadiness();
            this.generateTasksList();
            return true;
        } catch (e) {
            console.error('[AppState] 🚨 Fetch critical failure:', e);
            return false;
        }
    }

    /**
     * Machine Learning weighted readiness scoring
     */
    calculateReadiness() {
        let score = 0;
        
        // 1. Static Profile Quality (30%)
        const resumeScore = this.resumeData?.atsScore || 0;
        score += (resumeScore / 100) * 30;

        // 2. Behavioral/Technical Performance (40%)
        if (this.interviews.length) {
            const avgInterview = this.interviews.reduce((s, i) => s + (i.overallScore || 0), 0) / this.interviews.length;
            score += (avgInterview / 100) * 40;
        }

        // 3. Execution/Consistency (30%)
        const total = this.roadmap?.totalTasks || 1;
        const done = this.roadmapProgress?.completedTopics?.length || 0;
        score += (Math.min(done / total, 1)) * 30;

        this.readinessScore = Math.round(score);
    }

    /**
     * Organizes roadmap items into typed task objects
     */
    generateTasksList() {
        const rawTasks = [];
        if (!this.roadmap?.weeks) return;

        const completed = new Set(this.roadmapProgress.completedTopics || []);

        for (const [wIdx, week] of this.roadmap.weeks.entries()) {
            for (const [tIdx, topic] of (week.topics || []).entries()) {
                const baseId = `${wIdx}-${tIdx}`;
                
                if (topic.modules) {
                    topic.modules.forEach((mod, mIdx) => {
                        const mid = `${baseId}-${mIdx}`;
                        (mod.subtopics || []).forEach(sub => {
                            const id = `${mid}-${sub.replace(/\s+/g, '')}`;
                            rawTasks.push({ id, title: sub, type: 'roadmap', completed: completed.has(id) });
                        });
                    });
                } else if (topic.items) {
                    topic.items.forEach(item => {
                        const id = `${baseId}-${item.replace(/\s+/g, '')}`;
                        rawTasks.push({ id, title: item, type: 'roadmap', completed: completed.has(id) });
                    });
                }
            }
        }
        this.tasks = rawTasks;
    }

    reset() {
        this.user = null;
        this.resumeData = null;
        this.interviews = [];
        this.roadmap = null;
        this.roadmapProgress = null;
        this.readinessScore = 0;
        this.learningActivity = {};
        this.invalidateCache();
        this.notifyListeners();
    }
}

export const appState = new AppState();
// Support for non-ESM scripts
window.appState = appState;
