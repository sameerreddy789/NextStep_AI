/**
 * ProfileService - Manages user profile data in Firestore
 */

import { auth, db } from './firebase-config.js';
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const ProfileService = {
    /**
     * Load user profile from Firestore
     * @param {string} uid - User's unique ID
     */
    async loadProfile(uid) {
        if (!uid) return null;
        try {
            const profileDoc = await getDoc(doc(db, "users", uid, "profile", "data"));
            if (profileDoc.exists()) {
                const data = profileDoc.data();
                // Sync to localStorage as well
                localStorage.setItem('nextStep_profile', JSON.stringify(data));
                return data;
            }
            return null;
        } catch (error) {
            console.error('[ProfileService] Error loading profile:', error);
            return null;
        }
    },

    /**
     * Save/Update user profile in Firestore
     * @param {string} uid - User's unique ID
     * @param {Object} profileData - Profile information to save
     */
    async saveProfile(uid, profileData) {
        if (!uid) return;
        try {
            const dataToSave = {
                ...profileData,
                updatedAt: serverTimestamp()
            };

            await setDoc(doc(db, "users", uid, "profile", "data"), dataToSave, { merge: true });

            // Also update local storage for immediate access
            localStorage.setItem('nextStep_profile', JSON.stringify(profileData));

            console.log('[ProfileService] Profile saved to Firestore successfully');
            return true;
        } catch (error) {
            console.error('[ProfileService] Error saving profile:', error);
            throw error;
        }
    }
};

window.ProfileService = ProfileService;
export default ProfileService;
