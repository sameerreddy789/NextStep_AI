/**
 * Skills Data Store
 * Manages skill data in localStorage with CRUD operations
 */

const STORAGE_KEY = 'nextStep_skills';
const USER_KEY = 'nextStep_user';
const TASKS_KEY = 'nextStep_tasks';
const PRIORITY_SKILLS_KEY = 'nextStep_priority_skills';

// Default skills for demo
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
    },
    {
        id: 'react-basics',
        name: 'React Basics',
        category: 'programming',
        icon: '⚛️',
        description: 'Component-based UI development with React',
        progress: 25,
        streak: 3,
        lastPracticed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        history: [
            { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), progress: 10 },
            { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), progress: 15 }
        ]
    },
    {
        id: 'python-basics',
        name: 'Python',
        category: 'programming',
        icon: '🐍',
        description: 'Python programming fundamentals and best practices',
        progress: 45,
        streak: 7,
        lastPracticed: new Date().toISOString(),
        createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        history: []
    },
    {
        id: 'ui-design',
        name: 'UI Design',
        category: 'design',
        icon: '🎨',
        description: 'User interface design principles and practices',
        progress: 70,
        streak: 15,
        lastPracticed: new Date().toISOString(),
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        history: []
    },
    {
        id: 'data-analysis',
        name: 'Data Analysis',
        category: 'data',
        icon: '📊',
        description: 'Statistical analysis and data visualization',
        progress: 60,
        streak: 8,
        lastPracticed: new Date().toISOString(),
        createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
        history: []
    },
    {
        id: 'machine-learning',
        name: 'Machine Learning',
        category: 'data',
        icon: '🤖',
        description: 'ML algorithms and model training',
        progress: 20,
        streak: 2,
        lastPracticed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        history: []
    }
];

const DEFAULT_USER = {
    name: 'Learner',
    level: 5,
    totalXP: 1250,
    joinDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
};

// Default tasks
const DEFAULT_TASKS = [
    { id: 't1', title: 'Learn System Design basics', due: 'Today', status: 'progress', icon: '📚', color: 'blue', completed: false, type: 'system' },
    { id: 't2', title: 'Practice DSA - Arrays', due: 'Tomorrow', status: 'pending', icon: '💻', color: 'purple', completed: false, type: 'system' },
    { id: 't3', title: 'Mock Interview #4', due: 'In 2 days', status: 'pending', icon: '🎤', color: 'green', completed: false, type: 'system' },
    { id: 't4', title: 'Review React concepts', due: 'Completed', status: 'done', icon: '📖', color: 'gold', completed: true, type: 'personal' }
];

// Default Priority Skills
const DEFAULT_PRIORITY_SKILLS = [
    { id: 'ps1', name: 'System Design', priority: 'High', icon: '🏗️' },
    { id: 'ps2', name: 'Kubernetes', priority: 'High', icon: '☸️' },
    { id: 'ps3', name: 'CI/CD', priority: 'Medium', icon: '🚀' }
];

// Categories definition
const CATEGORIES = {
    programming: { name: 'Programming', icon: '💻', color: '#60a5fa' },
    design: { name: 'Design', icon: '🎨', color: '#a78bfa' },
    data: { name: 'Data Science', icon: '📊', color: '#4ade80' },
    devops: { name: 'DevOps', icon: '⚙️', color: '#f97316' },
    language: { name: 'Languages', icon: '🌐', color: '#22d3ee' },
    other: { name: 'Other', icon: '📚', color: '#6b7280' }
};

// Growth stages
const GROWTH_STAGES = [
    { name: 'Seed', min: 0, max: 10, color: '#6b7280' },
    { name: 'Sprout', min: 10, max: 30, color: '#84cc16' },
    { name: 'Sapling', min: 30, max: 60, color: '#22c55e' },
    { name: 'Mature', min: 60, max: 90, color: '#16a34a' },
    { name: 'Mastery', min: 90, max: 101, color: '#fbbf24' }
];

// ============ Storage Functions ============

function getSkills() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SKILLS));
        return DEFAULT_SKILLS;
    }
    return JSON.parse(stored);
}

function saveSkills(skills) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(skills));
}

function getUser() {
    const stored = localStorage.getItem(USER_KEY);
    if (!stored) {
        localStorage.setItem(USER_KEY, JSON.stringify(DEFAULT_USER));
        return DEFAULT_USER;
    }
    return JSON.parse(stored);
}

function saveUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function getTasks() {
    const stored = localStorage.getItem(TASKS_KEY);
    let tasks = [];

    if (!stored) {
        tasks = DEFAULT_TASKS;
        localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    } else {
        tasks = JSON.parse(stored);
    }

    // Migrate old tasks that don't have a 'type'
    let migrated = false;
    tasks = tasks.map(t => {
        if (!t.type) {
            migrated = true;
            // Best guess: t1, t2, t3 from DEFAULT_TASKS are 'system'
            return {
                ...t,
                type: t.id && t.id.startsWith('t') ? 'system' : 'personal'
            };
        }
        return t;
    });

    if (migrated) {
        saveTasks(tasks);
    }

    return tasks;
}

function saveTasks(tasks) {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

function getPrioritySkills() {
    const stored = localStorage.getItem(PRIORITY_SKILLS_KEY);
    if (!stored) {
        localStorage.setItem(PRIORITY_SKILLS_KEY, JSON.stringify(DEFAULT_PRIORITY_SKILLS));
        return DEFAULT_PRIORITY_SKILLS;
    }
    return JSON.parse(stored);
}

function savePrioritySkills(skills) {
    localStorage.setItem(PRIORITY_SKILLS_KEY, JSON.stringify(skills));
}

// ============ Skill CRUD ============

function getSkillById(id) {
    const skills = getSkills();
    return skills.find(s => s.id === id);
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
    const skills = getSkills();
    const filtered = skills.filter(s => s.id !== id);
    saveSkills(filtered);
}

function logProgress(skillId, amount = 10) {
    const skills = getSkills();
    const skill = skills.find(s => s.id === skillId);
    if (!skill) return null;

    const now = new Date();
    const lastPracticed = skill.lastPracticed ? new Date(skill.lastPracticed) : null;
    const isToday = lastPracticed &&
        lastPracticed.toDateString() === now.toDateString();
    const isYesterday = lastPracticed &&
        new Date(lastPracticed.getTime() + 24 * 60 * 60 * 1000).toDateString() === now.toDateString();

    // Update progress
    skill.progress = Math.min(100, skill.progress + amount);
    skill.lastPracticed = now.toISOString();

    // Update streak
    if (!isToday) {
        if (isYesterday || !lastPracticed) {
            skill.streak += 1;
        } else {
            skill.streak = 1;
        }
    }

    // Add to history
    skill.history.push({
        date: now.toISOString(),
        progress: amount
    });

    saveSkills(skills);
    saveSkills(skills);
    return skill;
}

// ============ Task CRUD ============

function getTodayTasks() {
    return getTasks();
}

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
        type: 'personal', // Default to personal
        ...task
    };
    tasks.push(newTask);
    saveTasks(tasks);
    return newTask;
}

/**
 * Syncs a task's completion status based on its title.
 * Used to integrate Roadmap progress with Dashboard tasks.
 */
function syncTaskByTitle(title, completed) {
    const tasks = getTasks();
    const normalizedTitle = title.toLowerCase().trim();
    // Extract keywords (longer than 3 chars) to avoid matching common small words like "and", "the"
    const roadmapWords = normalizedTitle.split(/[\s&/]+/).filter(w => w.length > 3);

    let updated = false;
    const updatedTasks = tasks.map(t => {
        const taskTitle = t.title.toLowerCase();

        // Match if titles share meaningful keywords OR have a containment relationship
        const isMatch = taskTitle.includes(normalizedTitle) ||
            normalizedTitle.includes(taskTitle) ||
            (roadmapWords.length > 0 && roadmapWords.some(word => taskTitle.includes(word)));

        if (isMatch) {
            if (t.completed !== completed) {
                updated = true;
                return { ...t, completed: completed, status: completed ? 'done' : 'pending' };
            }
        }
        return t;
    });

    if (updated) {
        saveTasks(updatedTasks);
    }
}

function deleteTask(id) {
    const tasks = getTasks();
    const filtered = tasks.filter(t => t.id !== id);
    saveTasks(filtered);
}

// ============ Priority Skills CRUD ============

function addPrioritySkill(skill) {
    const skills = getPrioritySkills();
    const newSkill = {
        id: `ps-${Date.now()}`,
        ...skill
    };
    skills.push(newSkill);
    savePrioritySkills(skills);
    return newSkill;
}

function deletePrioritySkill(id) {
    const skills = getPrioritySkills();
    const filtered = skills.filter(s => s.id !== id);
    savePrioritySkills(filtered);
}

// ============ Analytics ============

function getStats() {
    const skills = getSkills();
    const totalSkills = skills.length;
    const avgProgress = skills.reduce((sum, s) => sum + s.progress, 0) / (totalSkills || 1);
    const maxStreak = Math.max(...skills.map(s => s.streak), 0);
    const masteredCount = skills.filter(s => s.progress >= 90).length;

    // Calculate weekly progress
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyProgress = skills.reduce((sum, skill) => {
        const weeklyHistory = skill.history.filter(h => new Date(h.date) > weekAgo);
        return sum + weeklyHistory.reduce((s, h) => s + h.progress, 0);
    }, 0);

    // Skills practiced today
    const today = new Date().toDateString();
    const practicedToday = skills.filter(s =>
        s.lastPracticed && new Date(s.lastPracticed).toDateString() === today
    ).length;

    return {
        totalSkills,
        avgProgress: Math.round(avgProgress),
        maxStreak,
        masteredCount,
        weeklyProgress,
        practicedToday
    };
}

function getGrowthStage(progress) {
    return GROWTH_STAGES.find(s => progress >= s.min && progress < s.max) || GROWTH_STAGES[4];
}

function getRecentActivity(limit = 5) {
    const skills = getSkills();
    const activities = [];

    skills.forEach(skill => {
        skill.history.forEach(h => {
            activities.push({
                skillId: skill.id,
                skillName: skill.name,
                skillIcon: skill.icon,
                progress: h.progress,
                date: new Date(h.date)
            });
        });
    });

    return activities
        .sort((a, b) => b.date - a.date)
        .slice(0, limit);
}

function getTopSkills(limit = 3) {
    const skills = getSkills();
    return skills
        .filter(s => s.progress < 100)
        .sort((a, b) => {
            // Prioritize by streak and recency
            const streakDiff = b.streak - a.streak;
            if (streakDiff !== 0) return streakDiff;
            return new Date(b.lastPracticed || 0) - new Date(a.lastPracticed || 0);
        })
        .slice(0, limit);
}

// ============ Export ============

window.SkillStore = {
    init: () => { }, // Prevent crashes if called
    getSkills,
    saveSkills,
    getSkillById,
    addSkill,
    updateSkill,
    deleteSkill,
    logProgress,
    getStats,
    getGrowthStage,
    getRecentActivity,
    getTopSkills,
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
