/**
 * route-guard.js
 * Enforces strict sequential onboarding flow.
 * 
 * Logic:
 * 1. Dashboard requires Roadmap
 * 2. Roadmap requires Skill Gap Analysis (Interview Completed)
 * 3. Skill Gap requires Interview
 * 4. Interview requires Resume
 * 5. Resume requires Auth
 */

(function () {
    // Helper to check if user is authenticated (mock check via localStorage for speed, real auth via Firebase happens async)
    // Note: detailed Firebase auth check happens in individual page scripts, 
    // this guard focuses on flow prerequisites *after* auth is assumed or checking local state.

    const CURRENT_PAGE = window.location.pathname.split('/').pop();

    // Allow Auth page
    if (CURRENT_PAGE === 'auth.html' || CURRENT_PAGE === '') return;

    // Check LocalStorage Flags
    const state = {
        resume: localStorage.getItem('nextStep_resume'), // Parsed Object
        interview: localStorage.getItem('nextStep_interview'), // Parsed Object
        roadmap: localStorage.getItem('nextStep_roadmapCompleted') === 'true'
    };

    const hasResume = !!state.resume;
    const hasInterview = !!state.interview;
    const hasRoadmap = state.roadmap;

    console.log('RouteGuard Check:', { Page: CURRENT_PAGE, State: state });

    // Rules
    if (CURRENT_PAGE === 'dashboard.html') {
        if (!hasRoadmap) {
            // Determine where they should be
            if (!hasResume) window.location.href = 'resume.html';
            else if (!hasInterview) window.location.href = 'interview.html';
            else window.location.href = 'roadmap.html';
        }
    }
    else if (CURRENT_PAGE === 'roadmap.html') {
        if (!hasInterview) {
            if (!hasResume) window.location.href = 'resume.html';
            else window.location.href = 'interview.html';
        }
    }
    else if (CURRENT_PAGE === 'skill-gap.html') {
        if (!hasInterview) {
            if (!hasResume) window.location.href = 'resume.html';
            else window.location.href = 'interview.html';
        }
    }
    else if (CURRENT_PAGE === 'interview.html') {
        if (!hasResume) {
            window.location.href = 'resume.html';
        }
    }
    // resume.html is the entry point, accessible if auth (handled by page's own auth check)
})();
