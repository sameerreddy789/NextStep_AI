// @ts-check
import { auth, db } from './firebase-config.js';
import { doc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { appState } from './app-state.js';
import { WorkflowManager } from './services/workflow.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize State
    const isLoggedIn = await appState.init();
    if (!isLoggedIn) {
        window.location.href = '/pages/auth.html';
        return;
    }

    // 2. Check Workflow Status (Gated Access)
    const analysis = WorkflowManager.getState('analysis');
    const interview = WorkflowManager.getState('interview');
    
    const hasData = appState.resumeData || appState.interviews.length > 0;
    const isWorkflowComplete = analysis.status === 'complete' || interview.status === 'complete';

    if (!hasData && !isWorkflowComplete) {
        document.getElementById('gated-modal')?.classList.remove('hidden');
        return;
    }

    // 3. Initialize Roadmap
    const userData = appState.user || {};
    const userRole = userData.targetRole || 'sde';
    const skillGaps = appState.skillGap || [];

    // initRoadmap is defined in roadmap-ui.js
    // @ts-ignore
    if (window.initRoadmap) {
        // @ts-ignore
        await window.initRoadmap(userRole, false, skillGaps);
        
        // 4. Update Workflow State
        WorkflowManager.updateState('roadmap', {
            status: 'complete',
            data: { generatedAt: Date.now() }
        });

        // 5. Sync with Firestore
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userRef = doc(db, "users", user.uid);
                    await updateDoc(userRef, {
                        roadmapGenerated: true,
                        updatedAt: serverTimestamp()
                    });
                } catch (e) {
                    console.error("[Roadmap] Sync error:", e);
                }
            }
        });
    }
});

// Unlock Sample Mode (Preview)
window.unlockSampleMode = function () {
    document.getElementById('gated-modal')?.classList.add('hidden');
    const userRole = appState.user?.targetRole || 'sde';
    // @ts-ignore
    if (window.initRoadmap) window.initRoadmap(userRole, true); 
};
