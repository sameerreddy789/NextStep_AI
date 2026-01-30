/**
 * Skills Data Model & Management
 * Handles skill definitions, progress tracking, and state management
 */

// Skill Categories with icons
export const CATEGORIES = {
    programming: { name: 'Programming', icon: '💻', color: '#60a5fa' },
    design: { name: 'Design', icon: '🎨', color: '#a78bfa' },
    data: { name: 'Data Science', icon: '📊', color: '#4ade80' },
    devops: { name: 'DevOps', icon: '⚙️', color: '#f97316' }
};

// Growth stages based on progress percentage
export const GROWTH_STAGES = [
    { name: 'Seed', min: 0, max: 10, color: '#6b7280' },
    { name: 'Sprout', min: 10, max: 30, color: '#84cc16' },
    { name: 'Sapling', min: 30, max: 60, color: '#22c55e' },
    { name: 'Mature', min: 60, max: 90, color: '#16a34a' },
    { name: 'Mastery', min: 90, max: 100, color: '#fbbf24' }
];

// Initial skill tree structure
const initialSkills = [
    {
        id: 'core-programming',
        name: 'Core Programming',
        category: 'programming',
        icon: '🖥️',
        progress: 0.35,
        streak: 5,
        lastPracticed: new Date(Date.now() - 86400000), // Yesterday
        position: { angle: 0, height: 0.3, radius: 0.5 },
        children: ['javascript', 'python']
    },
    {
        id: 'javascript',
        name: 'JavaScript',
        category: 'programming',
        icon: '🟨',
        progress: 0.55,
        streak: 12,
        lastPracticed: new Date(),
        position: { angle: -0.4, height: 0.5, radius: 0.8 },
        parent: 'core-programming',
        children: ['react', 'nodejs']
    },
    {
        id: 'react',
        name: 'React',
        category: 'programming',
        icon: '⚛️',
        progress: 0.25,
        streak: 3,
        lastPracticed: new Date(Date.now() - 172800000), // 2 days ago
        position: { angle: -0.6, height: 0.7, radius: 1.1 },
        parent: 'javascript',
        children: []
    },
    {
        id: 'nodejs',
        name: 'Node.js',
        category: 'programming',
        icon: '🟢',
        progress: 0.15,
        streak: 0,
        lastPracticed: new Date(Date.now() - 604800000), // Week ago
        position: { angle: -0.2, height: 0.7, radius: 1.0 },
        parent: 'javascript',
        children: []
    },
    {
        id: 'python',
        name: 'Python',
        category: 'programming',
        icon: '🐍',
        progress: 0.45,
        streak: 7,
        lastPracticed: new Date(),
        position: { angle: 0.4, height: 0.5, radius: 0.85 },
        parent: 'core-programming',
        children: ['machine-learning', 'data-analysis']
    },
    {
        id: 'machine-learning',
        name: 'Machine Learning',
        category: 'data',
        icon: '🤖',
        progress: 0.20,
        streak: 2,
        lastPracticed: new Date(Date.now() - 259200000), // 3 days ago
        position: { angle: 0.3, height: 0.75, radius: 1.15 },
        parent: 'python',
        children: []
    },
    {
        id: 'data-analysis',
        name: 'Data Analysis',
        category: 'data',
        icon: '📈',
        progress: 0.60,
        streak: 8,
        lastPracticed: new Date(),
        position: { angle: 0.55, height: 0.72, radius: 1.05 },
        parent: 'python',
        children: []
    },
    {
        id: 'ui-design',
        name: 'UI Design',
        category: 'design',
        icon: '🎨',
        progress: 0.70,
        streak: 15,
        lastPracticed: new Date(),
        position: { angle: Math.PI * 0.6, height: 0.4, radius: 0.6 },
        children: ['animation', 'prototyping']
    },
    {
        id: 'animation',
        name: 'Animation',
        category: 'design',
        icon: '✨',
        progress: 0.40,
        streak: 4,
        lastPracticed: new Date(Date.now() - 86400000),
        position: { angle: Math.PI * 0.5, height: 0.65, radius: 0.95 },
        parent: 'ui-design',
        children: []
    },
    {
        id: 'prototyping',
        name: 'Prototyping',
        category: 'design',
        icon: '📐',
        progress: 0.85,
        streak: 20,
        lastPracticed: new Date(),
        position: { angle: Math.PI * 0.7, height: 0.62, radius: 0.9 },
        parent: 'ui-design',
        children: []
    }
];

class SkillManager {
    constructor() {
        this.skills = new Map();
        this.listeners = new Set();
        this.selectedSkillId = null;
        this.init();
    }

    init() {
        // Load skills into map
        initialSkills.forEach(skill => {
            this.skills.set(skill.id, { ...skill });
        });
    }

    // Get a specific skill
    getSkill(id) {
        return this.skills.get(id);
    }

    // Get all skills
    getAllSkills() {
        return Array.from(this.skills.values());
    }

    // Get skills by category
    getSkillsByCategory(category) {
        return this.getAllSkills().filter(s => s.category === category);
    }

    // Calculate overall progress
    getOverallProgress() {
        const skills = this.getAllSkills();
        const total = skills.reduce((sum, s) => sum + s.progress, 0);
        return total / skills.length;
    }

    // Get maximum streak
    getMaxStreak() {
        const skills = this.getAllSkills();
        return Math.max(...skills.map(s => s.streak));
    }

    // Get growth stage for a progress value
    getGrowthStage(progress) {
        const percent = progress * 100;
        return GROWTH_STAGES.find(
            stage => percent >= stage.min && percent < stage.max
        ) || GROWTH_STAGES[GROWTH_STAGES.length - 1];
    }

    // Add progress to a skill
    addProgress(skillId, amount = 0.1) {
        const skill = this.skills.get(skillId);
        if (!skill) return;

        const oldProgress = skill.progress;
        skill.progress = Math.min(1, skill.progress + amount);
        skill.lastPracticed = new Date();
        
        // Update streak if practiced today
        const today = new Date().toDateString();
        const lastDate = new Date(skill.lastPracticed).toDateString();
        if (today !== lastDate) {
            skill.streak += 1;
        }

        this.notifyListeners('progress', { 
            skillId, 
            oldProgress, 
            newProgress: skill.progress,
            skill 
        });

        return skill;
    }

    // Simulate decay from inactivity
    applyDecay(amount = 0.1) {
        const now = new Date();
        const decayedSkills = [];

        this.skills.forEach((skill, id) => {
            const daysSinceLastPractice = Math.floor(
                (now - new Date(skill.lastPracticed)) / (1000 * 60 * 60 * 24)
            );

            if (daysSinceLastPractice > 3) {
                const oldProgress = skill.progress;
                const decayAmount = amount * Math.min(daysSinceLastPractice / 7, 1);
                skill.progress = Math.max(0, skill.progress - decayAmount);
                skill.streak = 0;
                
                decayedSkills.push({
                    skillId: id,
                    oldProgress,
                    newProgress: skill.progress,
                    skill
                });
            }
        });

        if (decayedSkills.length > 0) {
            this.notifyListeners('decay', { decayedSkills });
        }

        return decayedSkills;
    }

    // Grow all skills
    growAll(amount = 0.1) {
        const grownSkills = [];
        
        this.skills.forEach((skill, id) => {
            if (skill.progress < 1) {
                const oldProgress = skill.progress;
                skill.progress = Math.min(1, skill.progress + amount);
                skill.lastPracticed = new Date();
                skill.streak += 1;
                
                grownSkills.push({
                    skillId: id,
                    oldProgress,
                    newProgress: skill.progress,
                    skill
                });
            }
        });

        this.notifyListeners('growAll', { grownSkills });
        return grownSkills;
    }

    // Reset all skills
    reset() {
        this.skills.clear();
        this.init();
        this.notifyListeners('reset', {});
    }

    // Select a skill
    selectSkill(skillId) {
        this.selectedSkillId = skillId;
        this.notifyListeners('select', { 
            skillId, 
            skill: this.skills.get(skillId) 
        });
    }

    // Subscribe to changes
    subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    // Notify all listeners
    notifyListeners(eventType, data) {
        this.listeners.forEach(callback => {
            callback(eventType, data);
        });
    }
}

// Export singleton instance
export const skillManager = new SkillManager();
export default skillManager;
