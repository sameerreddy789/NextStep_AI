import { auth, db } from './firebase-config.js';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/**
 * Global State Manager
 * Single source of truth for the application.
 * Syncs with Firestore and notifies listeners.
 */
export const appState = {
    // State Data
    user: null,
    resumeData: null,
    skillGap: null,
    interviews: [],
    roadmap: null, // Structure with weeks/topics
    roadmapProgress: null, // Completion status
    tasks: [],
    readinessScore: 0,
    learningActivity: {}, // { "YYYY-MM-DD": count }

    // Observers
    listeners: [],

    /**
     * Initialize the app state
     * Fetches all data from Firestore for the current user
     */
    init() {
        return new Promise((resolve) => {
            onAuthStateChanged(auth, async (user) => {
                if (user) {
                    this.user = user;
                    console.log('[AppState] 🔄 User detected, fetching full state...');
                    await this.fetchAllData(user.uid);
                    console.log('[AppState] ✅ State initialized:', this);
                    this.notifyListeners();
                    resolve(true);
                } else {
                    console.log('[AppState] ⚠️ No user logged in');
                    this.reset();
                    resolve(false);
                }
            });
        });
    },

    /**
     * Fetch all data from Firestore
     * @param {string} uid 
     */
    async fetchAllData(uid) {
        try {
            // Parallel fetch for valid sub-collections and documents
            const [
                userProfileSnap,
                resumeSnap,
                interviewSummarySnap,
                roadmapSnap,
                skillGapSnap,
                roadmapProgressSnap,
                interviewsSnap
            ] = await Promise.all([
                getDoc(doc(db, "users", uid)),
                getDoc(doc(db, "users", uid, "analysis", "resume")),
                getDoc(doc(db, "users", uid, "analysis", "interview")),
                getDoc(doc(db, "users", uid, "roadmap", "structure")),
                getDoc(doc(db, "users", uid, "roadmap", "current")), // Skill Gap Data
                getDoc(doc(db, "users", uid, "roadmap", "progress")),
                getDocs(collection(db, "users", uid, "interviews"))
            ]);

            // Profile
            if (userProfileSnap.exists()) {
                this.user = { ...this.user, ...userProfileSnap.data() };
            }

            // Resume
            this.resumeData = resumeSnap.exists() ? resumeSnap.data() : null;

            // Interviews
            this.interviews = [];
            if (interviewsSnap && !interviewsSnap.empty) {
                interviewsSnap.forEach(d => this.interviews.push(d.data()));
            }

            // Roadmap
            this.roadmap = roadmapSnap.exists() ? roadmapSnap.data() : null;
            this.skillGap = skillGapSnap.exists() ? skillGapSnap.data().skills : [];
            this.roadmapProgress = roadmapProgressSnap.exists() ? roadmapProgressSnap.data() : { completedTopics: [], activityLog: {} };
            this.learningActivity = this.roadmapProgress.activityLog || {};

            // Calculate Derived State
            this.calculateReadiness();
            this.generateTasksList();

        } catch (error) {
            console.error('[AppState] ❌ Error fetching data:', error);
        }
    },

    /**
     * Calculate Readiness Score
     * Formula: (Resume * 0.3) + (Interview * 0.4) + (Roadmap * 0.3)
     */
    calculateReadiness() {
        let score = 0;

        // 1. Resume Score (30%)
        if (this.resumeData?.atsScore) {
            score += (this.resumeData.atsScore / 100) * 30;
        }

        // 2. Interview Score (40%)
        if (this.interviews.length > 0) {
            const avgScore = this.interviews.reduce((sum, i) => sum + (i.finalScore || i.overallScore || 0), 0) / this.interviews.length;
            score += (avgScore / 100) * 40;
        }

        // 3. Roadmap Completion (30%)
        if (this.roadmap?.totalTasks && this.roadmapProgress?.completedTopics) {
            const completion = this.roadmapProgress.completedTopics.length / this.roadmap.totalTasks;
            score += Math.min(completion, 1) * 30;
        }

        this.readinessScore = Math.round(score);
    },

    /**
     * Generate Tasks List
     * Flattens roadmap structure and checks completion status
     */
    generateTasksList() {
        this.tasks = [];
        if (!this.roadmap?.weeks) return;

        const completedSet = new Set(this.roadmapProgress?.completedTopics || []);

        this.roadmap.weeks.forEach((week, wIdx) => {
            if (week.topics) {
                week.topics.forEach((topic, tIdx) => {
                    const moduleId = `${wIdx}-${tIdx}`;

                    if (topic.items && Array.isArray(topic.items)) {
                        topic.items.forEach(item => {
                            const itemId = `${moduleId}-${item.replace(/\s+/g, '')}`;
                            const isCompleted = completedSet.has(itemId);

                            this.tasks.push({
                                id: itemId,
                                title: item,
                                subtitle: topic.name, // Extra context
                                deadline: topic.deadline || week.title.includes('Focus') ? 'This Week' : 'Next Week',
                                completed: isCompleted,
                                type: 'roadmap'
                            });
                        });
                    }
                });
            }
        });
    },

    /**
     * Update Learning Activity (Streak)
     */
    async logActivity() {
        if (!this.user?.uid) return;

        const today = new Date().toISOString().split('T')[0];
        const currentCount = this.learningActivity[today] || 0;

        this.learningActivity[today] = currentCount + 1;

        // Optimistic Update
        this.notifyListeners();

        // Firestore Update
        try {
            const roadmapRef = doc(db, "users", this.user.uid, "roadmap", "progress");
            await setDoc(roadmapRef, {
                activityLog: this.learningActivity
            }, { merge: true });
        } catch (e) {
            console.error('[AppState] Failed to log activity:', e);
        }
    },

    /**
     * Observer Pattern
     */
    subscribe(callback) {
        this.listeners.push(callback);
        // Immediate callback with current state
        callback(this);
    },

    notifyListeners() {
        this.listeners.forEach(cb => cb(this));
    },

    reset() {
        this.user = null;
        this.resumeData = null;
        this.interviews = [];
        this.notifyListeners();
    }
};
