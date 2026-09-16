// @ts-check
import { db } from '../firebase-config.js';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/**
 * Centralized Storage Service
 * Handles Hybrid Persistence (LocalStorage + Firestore) with unified logic.
 */
export const StorageService = {
    /**
     * Set item in localStorage with error handling
     * @param {string} key 
     * @param {any} value 
     */
    localSet(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.warn(`[StorageService] localStorage write failed for ${key}:`, e.message);
        }
    },

    /**
     * Get item from localStorage with error handling
     * @param {string} key 
     * @param {any} defaultValue 
     */
    localGet(key, defaultValue = null) {
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : defaultValue;
        } catch (e) {
            console.warn(`[StorageService] localStorage read failed for ${key}:`, e.message);
            return defaultValue;
        }
    },

    /**
     * Remove item from localStorage
     * @param {string} key 
     */
    localRemove(key) {
        localStorage.removeItem(key);
    },

    /**
     * Save document to Firestore
     * @param {string} path - Document path (e.g., "users/uid/data/skills")
     * @param {any} data 
     * @param {boolean} merge 
     */
    async firestoreSet(path, data, merge = true) {
        try {
            const docRef = doc(db, path);
            await setDoc(docRef, data, { merge });
            return true;
        } catch (e) {
            console.error(`[StorageService] Firestore set failed for ${path}:`, e);
            return false;
        }
    },

    /**
     * Get document from Firestore
     * @param {string} path 
     */
    async firestoreGet(path) {
        try {
            const docRef = doc(db, path);
            const snap = await getDoc(docRef);
            return snap.exists() ? snap.data() : null;
        } catch (e) {
            console.error(`[StorageService] Firestore get failed for ${path}:`, e);
            return null;
        }
    },

    /**
     * Get all documents in a collection
     * @param {string} path 
     */
    async firestoreGetCollection(path) {
        try {
            const colRef = collection(db, path);
            const snap = await getDocs(colRef);
            return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (e) {
            console.error(`[StorageService] Firestore collection get failed for ${path}:`, e);
            return [];
        }
    }
};
