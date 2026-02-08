/**
 * Roadmap UI Manager - Handles interactive elements of the roadmap page
 */

let completedTopics = JSON.parse(localStorage.getItem('nextStep_roadmap_progress') || '[]');
const openWeeks = new Set([0]);
let totalTaskCount = 0;

// Initialize on DOM Load
document.addEventListener('DOMContentLoaded', () => {
    const userRole = localStorage.getItem('userType') || 'student';
    const isSample = !localStorage.getItem('nextStep_user');

    if (window.initRoadmap) initRoadmap(userRole, isSample);

    // Check for new roadmap success
    const showModal = localStorage.getItem('nextStep_showNewRoadmapModal');
    const skillFocus = localStorage.getItem('nextStep_newSkillFocus');

    if (showModal === 'true' && skillFocus) {
        localStorage.removeItem('nextStep_showNewRoadmapModal');
        const descEl = document.getElementById('new-roadmap-desc');
        if (descEl) descEl.innerHTML = `Your progress has been reset and a new <strong>${skillFocus}</strong> learning roadmap has been created for you!`;
        setTimeout(() => {
            const modal = document.getElementById('new-roadmap-modal');
            if (modal) modal.classList.remove('hidden');
        }, 500);
    }
});

// Platform Link Helpers
window.getLearningLink = function (sectionTitle, moduleName) {
    const sTitle = sectionTitle.toLowerCase();
    const mName = moduleName.toLowerCase();
    if (sTitle.includes('aptitude')) return 'https://www.geeksforgeeks.org/aptitude/aptitude-questions-and-answers/';
    if (sTitle.includes('cs fundamentals') || sTitle.includes('computer science')) {
        if (mName.includes('operating system')) return 'https://www.geeksforgeeks.org/operating-systems/';
        if (mName.includes('dbms') || mName.includes('database')) return 'https://www.geeksforgeeks.org/dbms/';
        if (mName.includes('network')) return 'https://www.geeksforgeeks.org/computer-network-tutorials/';
        if (mName.includes('oops') || mName.includes('object')) return 'https://www.geeksforgeeks.org/object-oriented-programming-oops-concept-in-java/';
    }
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(moduleName + ' tutorial')}`;
};

window.getPracticeLink = function (sectionTitle, moduleName) {
    const sTitle = sectionTitle.toLowerCase();
    const mName = moduleName.toLowerCase();
    if (sTitle.includes('aptitude')) return 'https://www.geeksforgeeks.org/aptitude/aptitude-questions-and-answers/';
    if (sTitle.includes('data structures') || sTitle.includes('dsa')) return `https://leetcode.com/problemset/all/?search=${encodeURIComponent(moduleName)}`;
    if (sTitle.includes('cs fundamentals') || sTitle.includes('computer science')) {
        if (mName.includes('operating system')) return 'https://www.geeksforgeeks.org/quizzes/50-operating-system-mcqs-with-answers/';
        if (mName.includes('dbms') || mName.includes('database')) return 'https://www.geeksforgeeks.org/quizzes/50-dbms-mcqs-with-answers/';
        if (mName.includes('network')) return 'https://www.geeksforgeeks.org/quizzes/50-computer-networks-mcqs-with-answers/';
    }
    return '#';
};

window.openSubtopicLearn = function (topicName) {
    const query = encodeURIComponent(topicName + ' tutorial');
    window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank');
};

window.openSubtopicPractice = function (sectionTitle, topicName) {
    const sTitle = sectionTitle.toLowerCase();
    const tName = encodeURIComponent(topicName);
    if (sTitle.includes('data structures') || sTitle.includes('dsa')) {
        window.open(`https://leetcode.com/problemset/all/?search=${tName}`, '_blank');
    } else if (sTitle.includes('aptitude')) {
        window.open(`https://www.geeksforgeeks.org/search?q=${tName}+aptitude`, '_blank');
    } else {
        window.open(`https://www.geeksforgeeks.org/search?q=${tName}`, '_blank');
    }
};

// Initializer
window.initRoadmap = function (role, isSample) {
    const container = document.getElementById('roadmap-container');
    if (!container || !window.RoadmapEngine) return;

    const sectionsData = isSample
        ? RoadmapEngine.generateSampleRoadmap(role)
        : RoadmapEngine.generateFullRoadmap(role, []);

    container.innerHTML = sectionsData.map((section, idx) => {
        const isDSA = section.title.includes('Data Structures') || idx === 1;
        const sectionIcon = section.icon || (idx === 0 ? '🧠' : (idx === 1 ? '⚡' : '💻'));
        let sectionTotalTasks = 0, sectionCompletedTasks = 0;

        const modulesHtml = section.topics.map((module, mIdx) => {
            const moduleId = `${idx}-${mIdx}`;
            const taskIds = module.items.map(item => `${moduleId}-${item.replace(/\s+/g, '')}`);
            sectionTotalTasks += taskIds.length;
            const completedInModule = taskIds.filter(id => completedTopics.includes(id)).length;
            sectionCompletedTasks += completedInModule;
            const isModuleCompleted = completedInModule === taskIds.length && taskIds.length > 0;
            const learnLink = getLearningLink(section.title, module.name);
            const practiceLink = getPracticeLink(section.title, module.name);

            const subtopicsHtml = module.items.map(item => {
                const itemId = `${moduleId}-${item.replace(/\s+/g, '')}`;
                const isItemDone = completedTopics.includes(itemId);
                return `
                <div class="subtopic-item">
                    <div class="subtopic-left">
                        <div class="task-checkbox ${isItemDone ? 'checked' : ''}" onclick="event.stopPropagation(); toggleTask('${itemId}', '${moduleId}', this)"></div>
                        <span class="subtopic-name ${isItemDone ? 'completed' : ''}">${item}</span>
                    </div>
                    <div class="subtopic-actions">
                        <button class="icon-btn youtube" onclick="window.openSubtopicLearn('${item}')" title="Watch Tutorial">📺</button>
                        <button class="icon-btn practice" onclick="window.openSubtopicPractice('${section.title}', '${item}')" title="Practice">🎯</button>
                    </div>
                </div>`;
            }).join('');

            return `
            <div class="module-card ${isModuleCompleted ? 'completed' : ''}" id="module-${moduleId}">
                <div class="module-header">
                    <div class="module-checkbox ${isModuleCompleted ? 'checked' : ''}" onclick="toggleModule('${moduleId}', [${taskIds.map(id => `'${id}'`).join(',')}], this)"></div>
                    <div class="module-info">
                        <div class="module-title">${module.name}</div>
                        <div class="module-meta">${module.items.length} Topics • ${completedInModule}/${taskIds.length} Done</div>
                    </div>
                </div>
                <div class="module-actions">
                    <button class="action-btn learn" onclick="window.open('${learnLink}', '_blank')">📚 Learn Module</button>
                    <button class="action-btn practice ${isDSA ? 'leetcode' : 'geeksforgeeks'}" onclick="window.open('${practiceLink}', '_blank')">
                        ${isDSA ? '⚡ Practice Module' : '🧠 Practice Module'}
                    </button>
                </div>
                <div class="module-subtopics">${subtopicsHtml}</div>
            </div>`;
        }).join('');

        return `
        <div class="topic-card ${openWeeks.has(idx) ? 'active' : ''}" id="topic-${idx}">
            <div class="topic-header" onclick="toggleTopic(${idx})">
                <div class="topic-info">
                    <div class="topic-icon-wrapper">${sectionIcon}</div>
                    <div class="topic-title-group">
                        <div class="topic-title">${section.title}</div>
                        <div class="topic-subtitle">${section.topics.length} Modules • ${sectionCompletedTasks}/${sectionTotalTasks} Tasks</div>
                    </div>
                </div>
                <div class="topic-toggle-icon">▼</div>
            </div>
            <div class="topic-body">
                <div class="guidance-box">
                    <div class="guidance-icon">📌</div>
                    <div class="guidance-content">
                        <div class="guidance-title">Learning Path</div>
                        <div class="guidance-steps">
                            <div class="guidance-step">📘 First: Learn Concepts</div>
                            <div class="guidance-step">🧠 Then: Practice Problems</div>
                        </div>
                    </div>
                </div>
                <div class="module-list">${modulesHtml}</div>
            </div>
        </div>`;
    }).join('');

    totalTaskCount = sectionsData.reduce((acc, sec) => acc + sec.topics.reduce((tAcc, topic) => tAcc + topic.items.length, 0), 0);
    updateProgress();
};

// Task Toggles
window.toggleTask = function (taskId, moduleId, checkbox) {
    const taskItem = checkbox.closest('.subtopic-item');
    const topicCard = checkbox.closest('.topic-card');
    if (completedTopics.includes(taskId)) {
        completedTopics.splice(completedTopics.indexOf(taskId), 1);
        checkbox.classList.remove('checked');
        taskItem.querySelector('.subtopic-name').classList.remove('completed');
    } else {
        completedTopics.push(taskId);
        checkbox.classList.add('checked');
        taskItem.querySelector('.subtopic-name').classList.add('completed');
    }
    localStorage.setItem('nextStep_roadmap_progress', JSON.stringify(completedTopics));
    const moduleCard = document.getElementById(`module-${moduleId}`);
    const allSubCks = moduleCard.querySelectorAll('.subtopic-item .task-checkbox');
    const allChecked = Array.from(allSubCks).every(ck => ck.classList.contains('checked'));
    const moduleCk = moduleCard.querySelector('.module-header .module-checkbox');
    if (allChecked) { moduleCk.classList.add('checked'); moduleCard.classList.add('completed'); }
    else { moduleCk.classList.remove('checked'); moduleCard.classList.remove('completed'); }
    updateModuleMeta(moduleCard, allSubCks.length);
    updateTaskCountsInPlace(topicCard);
    updateProgress();
};

window.toggleModule = function (moduleId, taskIds, checkbox) {
    const moduleCard = document.getElementById(`module-${moduleId}`);
    const topicCard = checkbox.closest('.topic-card');
    const isChecked = checkbox.classList.contains('checked');
    if (isChecked) {
        checkbox.classList.remove('checked');
        moduleCard.classList.remove('completed');
        taskIds.forEach(id => { const idx = completedTopics.indexOf(id); if (idx > -1) completedTopics.splice(idx, 1); });
        moduleCard.querySelectorAll('.subtopic-item .task-checkbox').forEach(ck => { ck.classList.remove('checked'); ck.nextElementSibling.classList.remove('completed'); });
    } else {
        checkbox.classList.add('checked');
        moduleCard.classList.add('completed');
        taskIds.forEach(id => { if (!completedTopics.includes(id)) completedTopics.push(id); });
        moduleCard.querySelectorAll('.subtopic-item .task-checkbox').forEach(ck => { ck.classList.add('checked'); ck.nextElementSibling.classList.add('completed'); });
    }
    localStorage.setItem('nextStep_roadmap_progress', JSON.stringify(completedTopics));
    updateModuleMeta(moduleCard, taskIds.length);
    updateTaskCountsInPlace(topicCard);
    updateProgress();
};

function updateModuleMeta(moduleCard, total) {
    const completed = moduleCard.querySelectorAll('.subtopic-item .task-checkbox.checked').length;
    const meta = moduleCard.querySelector('.module-meta');
    if (meta) meta.innerText = `${meta.innerText.split('•')[0].trim()} • ${completed}/${total} Done`;
}

function updateTaskCountsInPlace(topicCard) {
    if (!topicCard) return;
    let secTotal = 0, secDone = 0;
    topicCard.querySelectorAll('.module-meta').forEach(meta => {
        const match = meta.innerText.match(/(\d+)\/(\d+) Done/);
        if (match) { secDone += parseInt(match[1]); secTotal += parseInt(match[2]); }
    });
    const subtitle = topicCard.querySelector('.topic-subtitle');
    if (subtitle) subtitle.textContent = `${subtitle.textContent.split('•')[0]} • ${secDone}/${secTotal} Tasks`;
}

window.toggleTopic = function (idx) {
    document.querySelectorAll('.topic-card').forEach((card, i) => {
        const cardIdx = parseInt(card.id.split('-')[1]);
        if (cardIdx !== idx) { card.classList.remove('active'); openWeeks.delete(cardIdx); }
    });
    const card = document.getElementById(`topic-${idx}`);
    if (card) {
        if (card.classList.contains('active')) { card.classList.remove('active'); openWeeks.delete(idx); }
        else { card.classList.add('active'); openWeeks.add(idx); }
    }
};

window.updateProgress = function () {
    const total = totalTaskCount > 0 ? totalTaskCount : 1;
    const percentage = Math.min(100, Math.round((completedTopics.length / total) * 100));
    const progressVal = document.getElementById('overall-progress-val');
    const progressBar = document.getElementById('overall-progress-bar');
    if (progressVal) progressVal.textContent = percentage + '%';
    if (progressBar) progressBar.style.width = percentage + '%';

    const topicCards = document.querySelectorAll('.topic-card');
    let completedSections = 0;
    topicCards.forEach(card => {
        const modules = card.querySelectorAll('.module-card');
        if (modules.length > 0 && Array.from(modules).every(m => m.classList.contains('completed'))) completedSections++;
    });
    const weeksLabel = document.querySelector('.overview-stat .overview-label');
    if (weeksLabel && weeksLabel.textContent.includes('Weeks')) weeksLabel.textContent = 'Sections Complete';
    const weeksVal = document.getElementById('weeks-complete-val');
    if (weeksVal) weeksVal.textContent = `${completedSections}/${topicCards.length}`;
    if (percentage === 100 && completedTopics.length > 0 && completedTopics.length === totalTaskCount) triggerCelebration();
};

function triggerCelebration() {
    const modal = document.getElementById('celebration-modal');
    if (modal && modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        document.getElementById('confetti-canvas').style.display = 'block';
        const duration = 3000, end = Date.now() + duration;
        (function frame() {
            confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 } });
            confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 } });
            if (Date.now() < end) requestAnimationFrame(frame);
            else document.getElementById('confetti-canvas').style.display = 'none';
        }());
    }
}

window.showJobLinks = () => { document.getElementById('job-panel').classList.remove('hidden'); document.getElementById('skills-panel').classList.add('hidden'); };
window.showRelatedSkills = () => { document.getElementById('skills-panel').classList.remove('hidden'); document.getElementById('job-panel').classList.add('hidden'); };
window.closeCelebrationModal = () => { ['celebration-modal', 'job-panel', 'skills-panel'].forEach(id => document.getElementById(id).classList.add('hidden')); };
window.startNewRoadmap = skill => { localStorage.removeItem('nextStep_roadmap_progress'); localStorage.setItem('nextStep_newSkillFocus', skill); localStorage.setItem('nextStep_showNewRoadmapModal', 'true'); closeCelebrationModal(); window.location.reload(); };
window.closeNewRoadmapModal = () => document.getElementById('new-roadmap-modal').classList.add('hidden');
