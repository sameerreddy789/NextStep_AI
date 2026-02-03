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
    const CURRENT_PAGE = window.location.pathname.split('/').pop();

    // Allow Auth page
    if (CURRENT_PAGE === 'auth.html' || CURRENT_PAGE === '') return;

    // Check LocalStorage Flags
    const state = {
        resume: localStorage.getItem('nextStep_resume'),
        interview: localStorage.getItem('nextStep_interview'),
        roadmap: localStorage.getItem('nextStep_roadmapCompleted') === 'true'
    };

    const hasResume = !!state.resume;
    const hasInterview = !!state.interview;
    const hasRoadmap = state.roadmap;

    // console.log('RouteGuard Check:', { Page: CURRENT_PAGE, State: state }); // DEBUG: Uncomment for development

    // Helper function to show popup and redirect
    function showBlockedPopup(title, message, redirectUrl) {
        // Create popup overlay
        const overlay = document.createElement('div');
        overlay.id = 'route-guard-popup';
        overlay.innerHTML = `
            <div class="rg-popup-overlay">
                <div class="rg-popup">
                    <div class="rg-popup-icon">🔒</div>
                    <h3 class="rg-popup-title">${title}</h3>
                    <p class="rg-popup-message">${message}</p>
                    <button class="rg-popup-btn" onclick="window.location.href='${redirectUrl}'">
                        Continue →
                    </button>
                </div>
            </div>
            <style>
                .rg-popup-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.85);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 99999;
                    animation: rgFadeIn 0.3s ease;
                }
                .rg-popup {
                    background: linear-gradient(135deg, #1a1a2e 0%, #16162a 100%);
                    border: 1px solid rgba(99, 102, 241, 0.3);
                    border-radius: 24px;
                    padding: 40px;
                    max-width: 420px;
                    width: 90%;
                    text-align: center;
                    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(99, 102, 241, 0.1);
                    animation: rgSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .rg-popup-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                }
                .rg-popup-title {
                    font-size: 22px;
                    font-weight: 700;
                    color: #fff;
                    margin-bottom: 12px;
                    font-family: 'Inter', sans-serif;
                }
                .rg-popup-message {
                    color: #94a3b8;
                    font-size: 15px;
                    line-height: 1.6;
                    margin-bottom: 24px;
                    font-family: 'Inter', sans-serif;
                }
                .rg-popup-btn {
                    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                    color: white;
                    border: none;
                    padding: 14px 32px;
                    border-radius: 12px;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-family: 'Inter', sans-serif;
                    box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
                }
                .rg-popup-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(99, 102, 241, 0.5);
                }
                @keyframes rgFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes rgSlideUp {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            </style>
        `;
        document.body.appendChild(overlay);
    }

    // Rules
    if (CURRENT_PAGE === 'dashboard.html') {
        if (!hasRoadmap) {
            if (!hasResume) window.location.href = 'resume.html';
            else if (!hasInterview) window.location.href = 'interview.html';
            else window.location.href = 'roadmap.html';
        }
    }
    else if (CURRENT_PAGE === 'roadmap.html') {
        // Allow access to roadmap.html
        // The page logic itself will handle showing the "locked" state if !hasInterview
    }
    else if (CURRENT_PAGE === 'skill-gap.html') {
        if (!hasInterview) {
            if (!hasResume) {
                showBlockedPopup(
                    'Resume Required',
                    'Please upload your resume first. We need to analyze your skills before showing the skill gap analysis.',
                    'resume.html'
                );
            } else {
                showBlockedPopup(
                    'Interview Required',
                    'Complete a mock interview first! This helps us understand your current skill level and provide accurate gap analysis.',
                    'interview.html'
                );
            }
            return; // Stop execution, popup handles redirect
        }
    }
    else if (CURRENT_PAGE === 'interview.html') {
        if (!hasResume) {
            showBlockedPopup(
                'Resume Required',
                'Please upload your resume first. We use your resume to personalize interview questions based on your skills and experience.',
                'resume.html'
            );
            return; // Stop execution, popup handles redirect
        }
    }
})();

