// @ts-check
/**
 * Skills Data Store
 * Manages skill data with Hybrid Persistence (LocalStorage + Firestore)
 */
import { StorageService } from './services/storage.js';
import { appState } from './app-state.js';

const STORAGE_KEY = 'nextStep_skills';
const USER_KEY = 'nextStep_user';
const TASKS_KEY = 'nextStep_tasks';
const PRIORITY_SKILLS_KEY = 'nextStep_priority_skills';

// Default data
const DEFAULT_SKILLS = [
    {
        id: 'js-fundamentals',
        name: 'JavaScript Fundamentals',
        category: 'programming',
        icon: '🟨',
        description: 'Core JavaScript concepts including variables, functions, and DOM manipulation',
        progress: 55,
        streak: 12,
        lastPracticed: new Date().toISOString(),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        history: [
            { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), progress: 10 },
            { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), progress: 10 },
            { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), progress: 15 },
            { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), progress: 10 },
            { date: new Date().toISOString(), progress: 10 }
        ]
    }
];

const DEFAULT_USER = {
    name: 'Learner',
    level: 5,
    totalXP: 1250,
    joinDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
};

const DEFAULT_TASKS = [
    { id: 't1', title: 'Learn System Design basics', due: 'Today', status: 'progress', icon: '📚', color: 'blue', completed: false, type: 'system' },
    { id: 't2', title: 'Practice DSA - Arrays', due: 'Tomorrow', status: 'pending', icon: '💻', color: 'purple', completed: false, type: 'system' },
    { id: 't3', title: 'Mock Interview #4', due: 'In 2 days', status: 'pending', icon: '🎙️', color: 'green', completed: false, type: 'system' },  
    { id: 't4', title: 'Review React concepts', due: 'Completed', status: 'done', icon: '📖', color: 'gold', completed: true, type: 'personal' }  
];

const DEFAULT_PRIORITY_SKILLS = [
    { id: 'ps1', name: 'System Design', priority: 'High', icon: '🏗️' },
    { id: 'ps2', name: 'Kubernetes', priority: 'High', icon: '☸️' },
    { id: 'ps3', name: 'CI/CD', priority: 'Medium', icon: '🚀' }
];

const CATEGORIES = {
    programming: { name: 'Programming', icon: '💻', color: '#60a5fa' },
    design: { name: 'Design', icon: '🎨', color: '#a78bfa' },
    data: { name: 'Data Science', icon: '📊', color: '#4ade80' },
    devops: { name: 'DevOps', icon: '⚙️', color: '#f97316' },
    language: { name: 'Languages', icon: '🌐', color: '#22d3ee' },
    other: { name: 'Other', icon: '📚', color: '#6b7280' }
};

const GROWTH_STAGES = [
    { name: 'Seed', min: 0, max: 10, color: '#6b7280' },
    { name: 'Sprout', min: 10, max: 30, color: '#84cc16' },
    { name: 'Sapling', min: 30, max: 60, color: '#22c55e' },
    { name: 'Mature', min: 60, max: 90, color: '#16a34a' },
    { name: 'Mastery', min: 90, max: 101, color: '#fbbf24' }
];

// ============ Storage Functions ============

function getSkills() {
    if (appState.skills && appState.skills.length > 0) return appState.skills;
    const skills = StorageService.localGet(STORAGE_KEY, DEFAULT_SKILLS);
    appState.skills = skills;
    return skills;
}

async function saveSkills(skills) {
    StorageService.localSet(STORAGE_KEY, skills);
    appState.skills = skills;
    if (appState.user?.uid) {
        await StorageService.firestoreSet(`users/${appState.user.uid}/data/skills`, { items: skills });
    }
}

function getUser() {
    if (appState.user) {
        return {
            name: appState.user.displayName || 'Learner',
            uid: appState.user.uid,
        };
    }
    return StorageService.localGet(USER_KEY, DEFAULT_USER);
}

function saveUser(user) {
    StorageService.localSet(USER_KEY, user);
}

function getTasks() {
    if (appState.personalTasks && appState.personalTasks.length > 0) return appState.personalTasks;
    const tasks = StorageService.localGet(TASKS_KEY, DEFAULT_TASKS);
    appState.personalTasks = tasks;
    return tasks;
}

async function saveTasks(tasks) {
    StorageService.localSet(TASKS_KEY, tasks);
    appState.personalTasks = tasks;
    if (appState.user?.uid) {
        await StorageService.firestoreSet(`users/${appState.user.uid}/data/tasks`, { items: tasks });
    }
}

function getPrioritySkills() {
    if (appState.prioritySkills && appState.prioritySkills.length > 0) return appState.prioritySkills;
    const skills = StorageService.localGet(PRIORITY_SKILLS_KEY, DEFAULT_PRIORITY_SKILLS);
    appState.prioritySkills = skills;
    return skills;
}

async function savePrioritySkills(skills) {
    StorageService.localSet(PRIORITY_SKILLS_KEY, skills);
    appState.prioritySkills = skills;
    if (appState.user?.uid) {
        await StorageService.firestoreSet(`users/${appState.user.uid}/data/priority_skills`, { items: skills });
    }
}

// ============ Skill CRUD ============

function getSkillById(id) {
    return getSkills().find(s => s.id === id);
}

function addSkill(skill) {
    const skills = getSkills();
    const newSkill = {
        id: `skill-${Date.now()}`,
        progress: 0,
        streak: 0,
        lastPracticed: null,
        createdAt: new Date().toISOString(),
        history: [],
        ...skill
    };
    skills.push(newSkill);
    saveSkills(skills);
    return newSkill;
}

function updateSkill(id, updates) {
    const skills = getSkills();
    const index = skills.findIndex(s => s.id === id);
    if (index !== -1) {
        skills[index] = { ...skills[index], ...updates };
        saveSkills(skills);
        return skills[index];
    }
    return null;
}

function deleteSkill(id) {
    const filtered = getSkills().filter(s => s.id !== id);
    saveSkills(filtered);
}

function logProgress(skillId, amount = 10) {
    const skills = getSkills();
    const skill = skills.find(s => s.id === skillId);
    if (!skill) return null;

    const now = new Date();
    const lastPracticed = skill.lastPracticed ? new Date(skill.lastPracticed) : null;
    const isToday = lastPracticed && lastPracticed.toDateString() === now.toDateString();
    const isYesterday = lastPracticed && new Date(lastPracticed.getTime() + 24 * 60 * 60 * 1000).toDateString() === now.toDateString();

    skill.progress = Math.min(100, skill.progress + amount);
    skill.lastPracticed = now.toISOString();

    if (!isToday) {
        skill.streak = (isYesterday || !lastPracticed) ? skill.streak + 1 : 1;
    }

    skill.history.push({ date: now.toISOString(), progress: amount });
    saveSkills(skills);
    return skill;
}

// ============ Task CRUD ============

function toggleTask(id) {
    const tasks = getTasks();
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        task.status = task.completed ? 'done' : 'progress';
        saveTasks(tasks);
        return task;
    }
    return null;
}

function addTask(task) {
    const tasks = getTasks();
    const newTask = {
        id: `task-${Date.now()}`,
        status: 'pending',
        completed: false,
        type: 'personal',
        ...task
    };
    tasks.push(newTask);
    saveTasks(tasks);
    return newTask;
}

function syncTaskByTitle(title, completed) {
    const tasks = getTasks();
    const normalizedTitle = title.toLowerCase().trim();
    const roadmapWords = normalizedTitle.split(/[\s&/]+/).filter(w => w.length > 3);

    let updated = false;
    const updatedTasks = tasks.map(t => {
        const taskTitle = t.title.toLowerCase();
        const isMatch = taskTitle.includes(normalizedTitle) ||
            normalizedTitle.includes(taskTitle) ||
            (roadmapWords.length > 0 && roadmapWords.some(word => taskTitle.includes(word)));

        if (isMatch && t.completed !== completed) {
            updated = true;
            return { ...t, completed: completed, status: completed ? 'done' : 'pending' };
        }
        return t;
    });

    if (updated) saveTasks(updatedTasks);
}

function deleteTask(id) {
    const filtered = getTasks().filter(t => t.id !== id);
    saveTasks(filtered);
}

// ============ Priority Skills CRUD ============

function addPrioritySkill(skill) {
    const skills = getPrioritySkills();
    const newSkill = { id: `ps-${Date.now()}`, ...skill };
    skills.push(newSkill);
    savePrioritySkills(skills);
    return newSkill;
}

function deletePrioritySkill(id) {
    const filtered = getPrioritySkills().filter(s => s.id !== id);
    savePrioritySkills(filtered);
}

// ============ Analytics ============

function getStats() {
    const skills = getSkills();
    const totalSkills = skills.length;
    const avgProgress = skills.reduce((sum, s) => sum + s.progress, 0) / (totalSkills || 1);
    const maxStreak = Math.max(...skills.map(s => s.streak), 0);
    const masteredCount = skills.filter(s => s.progress >= 90).length;

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyProgress = skills.reduce((sum, skill) => {
        const weeklyHistory = (skill.history || []).filter(h => new Date(h.date) > weekAgo);
        return sum + weeklyHistory.reduce((s, h) => s + h.progress, 0);
    }, 0);

    const today = new Date().toDateString();
    const practicedToday = skills.filter(s => s.lastPracticed && new Date(s.lastPracticed).toDateString() === today).length;

    return {
        totalSkills,
        avgProgress: Math.round(avgProgress),
        maxStreak,
        masteredCount,
        weeklyProgress,
        practicedToday
    };
}

// ============ Export ============

export const SkillStore = {
    init: () => { },
    getSkills,
    saveSkills,
    getSkillById,
    addSkill,
    updateSkill,
    deleteSkill,
    logProgress,
    getStats,
    getGrowthStage: (progress) => GROWTH_STAGES.find(s => progress >= s.min && progress < s.max) || GROWTH_STAGES[4],
    getReadiness: () => Math.round(getSkills().reduce((sum, s) => sum + s.progress, 0) / (getSkills().length || 1)),
    getRecentActivity: (limit = 5) => {
        const activities = [];
        getSkills().forEach(skill => {
            (skill.history || []).forEach(h => {
                activities.push({
                    skillId: skill.id, skillName: skill.name, skillIcon: skill.icon,
                    progress: h.progress, date: new Date(h.date)
                });
            });
        });
        return activities.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit);
    },
    getTopSkills: (limit = 3) => {
        return getSkills()
            .filter(s => s.progress < 100)
            .sort((a, b) => (b.streak - a.streak) || (new Date(b.lastPracticed || 0).getTime() - new Date(a.lastPracticed || 0).getTime()))
            .slice(0, limit);
    },
    getUser,
    saveUser,
    CATEGORIES,
    GROWTH_STAGES,
    getTasks,
    toggleTask,
    addTask,
    deleteTask,
    syncTaskByTitle,
    getPrioritySkills,
    addPrioritySkill,
    deletePrioritySkill
};

// @ts-ignore
window.SkillStore = SkillStore;
