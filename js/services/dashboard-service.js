import { db, auth } from '../firebase-config.js';
import { doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export class DashboardService {
    static async fetchDashboardData(uid) {
        if (!uid) {
            console.warn('[DashboardService] No UID provided');
            return null;
        }

        try {
            console.log('[DashboardService] Fetching data for:', uid);

            // Parallelize fetches
            const [userProfileSnap, resumeSnap, interviewSummarySnap, roadmapSnap, interviewsSnap] = await Promise.all([
                getDoc(doc(db, "users", uid)),
                getDoc(doc(db, "users", uid, "analysis", "resume")),
                getDoc(doc(db, "users", uid, "analysis", "interview")),
                getDoc(doc(db, "users", uid, "roadmap", "progress")),
                getDocs(collection(db, "users", uid, "interviews"))
            ]);

            const interviews = [];
            interviewsSnap.forEach(doc => interviews.push(doc.data()));

            const dashboardData = {
                userProfile: userProfileSnap.exists() ? userProfileSnap.data() : {},
                resume: resumeSnap.exists() ? resumeSnap.data() : null,
                interviewSummary: interviewSummarySnap.exists() ? interviewSummarySnap.data() : null,
                interviews: interviews, // Array of interview objects
                roadmap: roadmapSnap.exists() ? roadmapSnap.data() : null
            };

            console.log('[DashboardService] Data fetched:', dashboardData);
            return dashboardData;

        } catch (error) {
            console.error('[DashboardService] Error fetching data:', error);
            throw error;
        }
    }
}
