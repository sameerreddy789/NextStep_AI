/**
 * SkillGapService - Analyzes interview results and updates roadmap
 * 
 * Flow:
 * 1. After interview completion, analyze each answer's score
 * 2. Identify weak skills (score < 70%)
 * 3. Compare with resume skills
 * 4. Add missing/weak skills to roadmap
 */

import { auth, db } from './firebase-config.js';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const SkillGapService = {

    /**
     * Analyze interview results and update roadmap
     * @param {Object} interviewData - { answers: [{ question, category, answer, score }], mode, ... }
     */
    async analyzeAndUpdateRoadmap(interviewData) {
        console.log('[SkillGap] Starting skill gap analysis...');

        try {
            const user = auth.currentUser;
            if (!user) {
                console.warn('[SkillGap] No authenticated user, skipping roadmap update');
                return;
            }

            // 1. Extract weak skills and all tested categories from interview
            const weakSkills = this.extractWeakSkills(interviewData.answers);
            const testedCategories = [...new Set(interviewData.answers.map(a => a.category))];
            console.log('[SkillGap] Weak skills identified:', weakSkills);
            console.log('[SkillGap] Categories tested:', testedCategories);

            // 2. Get resume skills from localStorage/Firestore
            const resumeSkills = await this.getResumeSkills(user.uid);
            console.log('[SkillGap] Resume skills:', resumeSkills);

            // 3. Find skills gaps (in resume but weak in interview, or missing entirely)
            const skillGaps = this.identifySkillGaps(weakSkills, resumeSkills, testedCategories);
            console.log('[SkillGap] Skill gaps to add:', skillGaps);

            // 4. Update roadmap with new skills
            if (skillGaps.length > 0) {
                await this.updateRoadmap(user.uid, skillGaps);
                console.log('[SkillGap] ✅ Roadmap updated with', skillGaps.length, 'new skills');
            } else {
                console.log('[SkillGap] No new skill gaps found');
            }

            return skillGaps;
        } catch (error) {
            console.error('[SkillGap] ❌ Error:', error);
            return [];
        }
    },

    /**
     * Extract skills where user scored below threshold
     */
    extractWeakSkills(answers) {
        const WEAK_THRESHOLD = 70;
        const weakSkills = [];

        for (const answer of answers) {
            if (answer.skipped) {
                // Skipped questions = weak skill
                weakSkills.push({
                    name: answer.category,
                    score: 0,
                    reason: 'skipped'
                });
            } else if (answer.evaluation && answer.evaluation.score < WEAK_THRESHOLD) {
                weakSkills.push({
                    name: answer.category,
                    score: answer.evaluation.score,
                    reason: 'low_score'
                });
            }
        }

        // Deduplicate by category
        const uniqueSkills = [];
        const seen = new Set();
        for (const skill of weakSkills) {
            if (!seen.has(skill.name)) {
                seen.add(skill.name);
                uniqueSkills.push(skill);
            }
        }

        return uniqueSkills;
    },

    /**
     * Get skills from user's resume analysis
     */
    async getResumeSkills(uid) {
        // Try localStorage first
        const resumeData = JSON.parse(localStorage.getItem('nextStep_resume') || '{}');
        if (resumeData.skills && resumeData.skills.length > 0) {
            return resumeData.skills;
        }

        // Try Firestore
        try {
            const resumeDoc = await getDoc(doc(db, "users", uid, "analysis", "resume"));
            if (resumeDoc.exists()) {
                return resumeDoc.data().skills || [];
            }
        } catch (e) {
            console.warn('[SkillGap] Could not fetch resume from Firestore:', e);
        }

        return [];
    },

    /**
     * Identify skill gaps: weak interview skills + resume skills not demonstrated
     */
    identifySkillGaps(weakSkills, resumeSkills, testedCategories) {
        const gaps = [];
        const now = new Date().toISOString();

        // 1. Add weak skills from interview (Weak compared to expected level)
        for (const skill of weakSkills) {
            gaps.push({
                name: skill.name,
                status: 'not_started',
                addedFrom: 'interview',
                reason: skill.reason,
                score: skill.score,
                addedAt: now
            });
        }

        // 2. Identify skills claimed in resume but not demonstrated (missing in interview)
        const weakNames = new Set(weakSkills.map(s => s.name.toLowerCase()));
        const testedNames = new Set(testedCategories.map(c => c.toLowerCase()));

        for (const resumeSkill of resumeSkills) {
            const skillName = typeof resumeSkill === 'string' ? resumeSkill : resumeSkill.name;
            const skillLower = skillName.toLowerCase();

            // If it wasn't tested at all AND is not already in gaps
            if (!testedNames.has(skillLower) && !weakNames.has(skillLower)) {
                // Claimed in resume but not demonstrated
                gaps.push({
                    name: skillName,
                    status: 'not_started',
                    addedFrom: 'resume',
                    reason: 'not_demonstrated',
                    addedAt: now
                });
            }
        }

        return gaps;
    },

    /**
     * Update roadmap in Firestore (merge, don't replace)
     */
    async updateRoadmap(uid, newSkills) {
        const roadmapRef = doc(db, "users", uid, "roadmap", "current");

        try {
            const roadmapDoc = await getDoc(roadmapRef);

            if (roadmapDoc.exists()) {
                // Merge with existing skills
                const existingSkills = roadmapDoc.data().skills || [];
                const existingNames = new Set(existingSkills.map(s => s.name.toLowerCase()));

                // Only add skills that don't already exist
                const uniqueNewSkills = newSkills.filter(s => !existingNames.has(s.name.toLowerCase()));

                if (uniqueNewSkills.length > 0) {
                    await updateDoc(roadmapRef, {
                        skills: arrayUnion(...uniqueNewSkills),
                        updatedAt: serverTimestamp(),
                        lastInterviewAnalysis: serverTimestamp()
                    });
                }
            } else {
                // Create new roadmap document
                await setDoc(roadmapRef, {
                    skills: newSkills,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    lastInterviewAnalysis: serverTimestamp()
                });
            }

            // Also save to localStorage for immediate access
            const currentRoadmap = JSON.parse(localStorage.getItem('nextStep_roadmap') || '{"skills":[]}');
            currentRoadmap.skills = [...(currentRoadmap.skills || []), ...newSkills];
            localStorage.setItem('nextStep_roadmap', JSON.stringify(currentRoadmap));

        } catch (error) {
            console.error('[SkillGap] ❌ Failed to update roadmap:', error);
            throw error;
        }
    }
};

window.SkillGapService = SkillGapService;
export default SkillGapService;
