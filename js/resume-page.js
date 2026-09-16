import { auth, db } from './firebase-config.js';
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { WorkflowManager } from './services/workflow.js';
import { UIUtils } from './ui-utils.js';

// Workflow state
const workflow = WorkflowManager.getState('analysis');

// Expose functions to window since we're in a module now
window.reUploadResume = reUploadResume;
window.analyzeResume = analyzeResume;

// Role-specific ATS Keywords Database
const ATS_KEYWORDS = {
    'sde': {
        technical: ['javascript', 'python', 'java', 'c++', 'react', 'node.js', 'sql', 'git', 'api', 'rest', 'mongodb', 'aws', 'docker', 'kubernetes', 'microservices', 'agile', 'scrum', 'data structures', 'algorithms', 'oop', 'system design'],
        soft: ['problem solving', 'teamwork', 'communication', 'collaboration', 'leadership', 'analytical'],
        experience: ['software development', 'full stack', 'backend', 'frontend', 'coding', 'programming', 'debugging', 'testing']
    },
    'frontend': {
        technical: ['html', 'css', 'javascript', 'react', 'vue', 'angular', 'typescript', 'sass', 'webpack', 'responsive design', 'ui/ux', 'figma', 'tailwind', 'bootstrap', 'redux', 'next.js', 'accessibility', 'web performance'],
        soft: ['creativity', 'attention to detail', 'communication', 'collaboration', 'user-focused'],
        experience: ['frontend development', 'web development', 'ui development', 'responsive design', 'cross-browser']
    },
    'backend': {
        technical: ['node.js', 'python', 'java', 'spring boot', 'express', 'django', 'flask', 'sql', 'postgresql', 'mongodb', 'redis', 'api', 'rest', 'graphql', 'microservices', 'docker', 'kubernetes', 'aws', 'azure', 'ci/cd'],
        soft: ['problem solving', 'analytical thinking', 'teamwork', 'communication', 'scalability mindset'],
        experience: ['backend development', 'server-side', 'database design', 'api development', 'system architecture']
    },
    'fullstack': {
        technical: ['javascript', 'react', 'node.js', 'python', 'sql', 'mongodb', 'html', 'css', 'git', 'api', 'rest', 'docker', 'aws', 'typescript', 'express', 'redux', 'postgresql'],
        soft: ['versatility', 'problem solving', 'communication', 'teamwork', 'adaptability'],
        experience: ['full stack development', 'end-to-end development', 'frontend', 'backend', 'web development']
    },
    'data-analyst': {
        technical: ['python', 'sql', 'excel', 'tableau', 'power bi', 'pandas', 'numpy', 'statistics', 'data visualization', 'r', 'machine learning', 'data mining', 'etl', 'big data'],
        soft: ['analytical thinking', 'attention to detail', 'communication', 'business acumen', 'problem solving'],
        experience: ['data analysis', 'business intelligence', 'reporting', 'data visualization', 'insights']
    },
    'data-scientist': {
        technical: ['python', 'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'scikit-learn', 'sql', 'statistics', 'nlp', 'computer vision', 'pandas', 'numpy', 'jupyter', 'aws', 'spark'],
        soft: ['analytical thinking', 'problem solving', 'communication', 'research', 'innovation'],
        experience: ['data science', 'machine learning', 'predictive modeling', 'ai', 'research']
    },
    'ml-engineer': {
        technical: ['python', 'tensorflow', 'pytorch', 'machine learning', 'deep learning', 'mlops', 'docker', 'kubernetes', 'aws', 'model deployment', 'scikit-learn', 'neural networks', 'computer vision', 'nlp'],
        soft: ['problem solving', 'innovation', 'collaboration', 'analytical thinking', 'research'],
        experience: ['ml engineering', 'model development', 'ai', 'production ml', 'mlops']
    },
    'devops': {
        technical: ['docker', 'kubernetes', 'jenkins', 'ci/cd', 'aws', 'azure', 'terraform', 'ansible', 'linux', 'bash', 'python', 'git', 'monitoring', 'prometheus', 'grafana', 'nginx'],
        soft: ['automation mindset', 'problem solving', 'collaboration', 'reliability focus', 'communication'],
        experience: ['devops', 'infrastructure', 'automation', 'deployment', 'cloud engineering']
    },
    'product': {
        technical: ['product management', 'agile', 'scrum', 'jira', 'analytics', 'roadmap', 'user stories', 'wireframing', 'sql', 'a/b testing'],
        soft: ['leadership', 'communication', 'strategic thinking', 'stakeholder management', 'decision making'],
        experience: ['product management', 'product development', 'product strategy', 'user research', 'feature prioritization']
    },
    'designer': {
        technical: ['figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator', 'ui/ux', 'wireframing', 'prototyping', 'user research', 'design systems', 'responsive design', 'accessibility'],
        soft: ['creativity', 'empathy', 'communication', 'collaboration', 'attention to detail'],
        experience: ['ui/ux design', 'product design', 'user experience', 'visual design', 'interaction design']
    }
};

// Calculate ATS Score
function calculateATSScore(resumeText, targetRole) {
    const keywords = ATS_KEYWORDS[targetRole] || ATS_KEYWORDS['sde'];
    const resumeLower = resumeText.toLowerCase();

    // 1. Keyword Match Score (50% weight)
    const allKeywords = [...keywords.technical, ...keywords.soft, ...keywords.experience];
    const matchedKeywords = allKeywords.filter(kw => resumeLower.includes(kw.toLowerCase()));
    const keywordScore = Math.round((matchedKeywords.length / allKeywords.length) * 100);

    // 2. Experience Relevance Score (30% weight)
    const experienceKeywords = keywords.experience;
    const matchedExperience = experienceKeywords.filter(kw => resumeLower.includes(kw.toLowerCase()));
    const experienceScore = Math.round((matchedExperience.filter(Boolean).length / experienceKeywords.length) * 100);

    // 3. Format Compatibility Score (20% weight)
    let formatScore = 100;
    if (!resumeLower.includes('experience') && !resumeLower.includes('work history')) formatScore -= 20;
    if (!resumeLower.includes('education')) formatScore -= 15;
    if (!resumeLower.includes('skills')) formatScore -= 15;
    if (resumeText.length < 200) formatScore -= 30;
    if (resumeText.length > 5000) formatScore -= 20;
    formatScore = Math.max(0, formatScore);

    const overallScore = Math.round((keywordScore * 0.5) + (experienceScore * 0.3) + (formatScore * 0.2));

    const suggestions = [];
    if (keywordScore < 60) {
        const missingTech = keywords.technical.filter(kw => !resumeLower.includes(kw.toLowerCase())).slice(0, 5);
        suggestions.push(`Add key technical skills: ${missingTech.join(', ')}`);
    }
    if (experienceScore < 50) {
        suggestions.push(`Include more relevant experience keywords like "${keywords.experience[0]}" or "${keywords.experience[1]}"`);
    }
    if (!resumeLower.includes('quantif') && !resumeLower.includes('achiev')) {
        suggestions.push('Add quantifiable achievements (e.g., "Improved performance by 30%")');
    }
    if (formatScore < 80) {
        suggestions.push('Ensure your resume has clear sections: Experience, Education, Skills');
    }

    return {
        overall: overallScore,
        keyword: keywordScore,
        experience: experienceScore,
        format: formatScore,
        suggestions: suggestions,
        matchedKeywords: matchedKeywords
    };
}

// Load user data
document.addEventListener('DOMContentLoaded', () => {
    // Check Workflow State
    if (workflow.status === 'complete' && workflow.data.result) {
        showResults(workflow.data.result);
    } else if (workflow.status === 'processing' && workflow.data.pendingFile) {
        recoverPendingAnalysis(workflow.data.pendingFile);
    } else {
        const rawResumeData = localStorage.getItem('nextStep_resume');
        if (rawResumeData) {
            try {
                let parsedData = JSON.parse(rawResumeData);
                if (parsedData.score !== undefined || (parsedData.skills && parsedData.skills.present)) {
                    showResults(parsedData);
                }
            } catch (e) {
                localStorage.removeItem('nextStep_resume');
            }
        }
    }
});

async function recoverPendingAnalysis(fileData) {
    try {
        const response = await fetch(fileData.data);
        const blob = await response.blob();
        const file = new File([blob], fileData.name, { type: fileData.type });
        analyzeResume(file);
    } catch (e) {
        console.error('[Workflow] Recovery failed:', e);
        WorkflowManager.updateState('analysis', { status: 'idle', data: {} });
    }
}

// File upload handling
const uploadZone = document.getElementById('upload-zone');
const fileInput = document.getElementById('file-input');

uploadZone?.addEventListener('click', () => fileInput?.click());

uploadZone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
});

uploadZone?.addEventListener('dragleave', () => {
    uploadZone?.classList.remove('dragover');
});

uploadZone?.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone?.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) analyzeResume(file);
});

fileInput?.addEventListener('change', (e) => {
    // @ts-ignore
    const file = e.target.files[0];
    if (file) analyzeResume(file);
});

// Initialize PDF.js
// @ts-ignore
if (typeof pdfjsLib !== 'undefined') {
    // @ts-ignore
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

async function extractTextFromPDF(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        // @ts-ignore
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(item => item.str).join(" ") + "\n";
        }
        return text;
    } catch (error) {
        console.error('[PDF] Extraction failed:', error);
        return null;
    }
}

async function analyzeResume(file) {
    const uploadSection = document.getElementById('upload-section');
    const analyzingSection = document.getElementById('analyzing-section');
    uploadSection?.classList.add('hidden');
    analyzingSection?.classList.remove('hidden');

    const statusText = document.querySelector('#analyzing-section .text-muted');
    const progressBar = document.getElementById('analysis-progress');

    // Update Workflow to 'processing'
    WorkflowManager.updateState('analysis', {
        status: 'processing',
        data: {
            fileName: file.name,
            startTime: Date.now()
        }
    });

    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    const userData = JSON.parse(localStorage.getItem('nextStep_user') || '{}');
    const targetRole = userProfile.targetRole || userData.targetRole || 'sde';

    const onProgress = (update) => {
        if (statusText) {
            statusText.textContent = update.message || 'AI is analyzing your resume...';
        }
        if (progressBar && update.stage) {
            const progressMap = { 'starting': 10, 'uploading': 30, 'processing': 60, 'complete': 100 };
            progressBar.style.width = (progressMap[update.stage] || 50) + '%';
        }
    };

    try {
        // @ts-ignore
        if (file && window.GeminiService && window.GeminiService.isAvailable()) {
            const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
            let aiResult;

            if (isPDF) {
                const extractedText = await extractTextFromPDF(file);
                if (extractedText && extractedText.trim().length > 100) {
                    // @ts-ignore
                    aiResult = await window.GeminiService.analyzeResume(extractedText, targetRole, onProgress);
                } else {
                    // @ts-ignore
                    aiResult = await window.GeminiService.analyzePDF(file, targetRole, onProgress);
                }
            } else {
                const text = await file.text();
                // @ts-ignore
                aiResult = await window.GeminiService.analyzeResume(text, targetRole, onProgress);
            }

            if (!aiResult) throw new Error('AI failed to produce a valid analysis.');

            const result = {
                skills: aiResult.skills,
                experience: aiResult.experience,
                projects: aiResult.projects,
                score: aiResult.score || 0,
                coverage: aiResult.coverage || 0,
                readiness: aiResult.readiness || 0,
                atsScore: aiResult.atsScore || null,
                _aiGenerated: true
            };

            // Update Workflow to 'complete'
            WorkflowManager.updateState('analysis', {
                status: 'complete',
                data: { result }
            });

            if (progressBar) progressBar.style.width = '100%';
            setTimeout(() => showResults(result), 500);
        } else {
            throw new Error('AI Service not available.');
        }

    } catch (error) {
        WorkflowManager.updateState('analysis', { status: 'failed', error: error.message });
        UIUtils.showToast(error.message, 'error');
        
        uploadSection?.classList.remove('hidden');
        analyzingSection?.classList.add('hidden');
    }
}

function showResults(data) {
    // Normalize skills
    if (data.skills && Array.isArray(data.skills)) {
        data.skills = { present: data.skills, partial: [], missing: data.missing || [] };
    }
    
    localStorage.setItem('nextStep_resume', JSON.stringify(data));
    saveResumeToDatabase(data);

    document.getElementById('upload-section')?.classList.add('hidden');
    document.getElementById('analyzing-section')?.classList.add('hidden');
    document.getElementById('results-section')?.classList.remove('hidden');

    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    const userData = JSON.parse(localStorage.getItem('nextStep_user') || '{}');
    const targetRole = userProfile.targetRole || userData.targetRole || 'sde';

    const resumeText = `Skills: ${(data.skills?.present || []).join(', ')}`;
    const atsResult = calculateATSScore(resumeText, targetRole);

    // Update UI elements (with safety checks)
    const setElText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    setElText('resume-score', (data?.score || 0) + '/100');
    setElText('skill-coverage', (data?.coverage || 0) + '%');
    setElText('missing-count', data?.skills?.missing?.length || 0);
    setElText('readiness', (data?.readiness || 0) + '%');

    // ATS Updates
    const atsScoreEl = document.getElementById('ats-score');
    if (atsScoreEl) atsScoreEl.textContent = atsResult.overall + '%';
    const atsProgressEl = document.getElementById('ats-progress');
    if (atsProgressEl) atsProgressEl.style.width = atsResult.overall + '%';

    // Found Skills
    const foundEl = document.getElementById('skills-found');
    if (foundEl) {
        foundEl.innerHTML = '';
        (data.skills?.present || []).forEach(skill => {
            const tag = document.createElement('div');
            tag.className = 'skill-tag present';
            tag.innerHTML = `<span>✅</span> ${UIUtils.escapeHTML(skill)}`;
            foundEl.appendChild(tag);
        });
    }

    // Missing Skills
    const missingEl = document.getElementById('skills-missing');
    if (missingEl) {
        missingEl.innerHTML = '';
        (data.skills?.missing || []).forEach(skill => {
            const tag = document.createElement('div');
            tag.className = 'skill-tag missing';
            tag.innerHTML = `<span>❌</span> ${UIUtils.escapeHTML(skill)}`;
            missingEl.appendChild(tag);
        });
    }
}

async function saveResumeToDatabase(data) {
    const user = auth.currentUser;
    if (!user) return;
    try {
        await setDoc(doc(db, "users", user.uid), {
            resumeStatus: 'completed',
            resumeData: data,
            updatedAt: serverTimestamp()
        }, { merge: true });
        
        await setDoc(doc(db, "users", user.uid, "analysis", "resume"), {
            ...data,
            updatedAt: serverTimestamp()
        }, { merge: true });

        localStorage.removeItem('nextStep_appState_cache');
    } catch (e) {
        console.error('[Database] Save failed:', e);
    }
}

function reUploadResume() {
    UIUtils.showConfirmDialog('Re-upload Resume?', 'This will replace your current analysis.', () => {
        localStorage.removeItem('nextStep_resume');
        WorkflowManager.reset('analysis');
        window.location.reload();
    });
}

// Check for pending resume from onboarding
window.addEventListener('load', async () => {
    if (localStorage.getItem('nextStep_resume')) return;
    const pendingFileData = localStorage.getItem('pendingResumeFile');
    if (pendingFileData) {
        try {
            const fileData = JSON.parse(pendingFileData);
            const response = await fetch(fileData.data);
            const blob = await response.blob();
            const file = new File([blob], fileData.name, { type: fileData.type });
            localStorage.removeItem('pendingResumeFile');
            analyzeResume(file);
        } catch (e) {
            console.error('[Resume] Pending file error:', e);
        }
    }
});
