// @ts-check
/**
 * Roadmap Engine
 * Manages granular topic structures, dynamic module generation, and roadmap logic.
 */
import { ROLE_TOPICS } from './data/role-topics.js';
import { StorageService } from './services/storage.js';

// Core skills per role — used for minimum module enforcement
const CORE_SKILLS = {
    'frontend': ['javascript', 'react', 'css', 'html', 'typescript'],
    'backend': ['node', 'api', 'database', 'sql', 'authentication', 'system design'],
    'sde': ['data structures', 'algorithms', 'dynamic programming', 'trees', 'graphs', 'system design', 'oops', 'dbms'],
    'fullstack': ['javascript', 'react', 'node', 'database', 'api'],
    'devops': ['docker', 'ci/cd', 'kubernetes', 'cloud', 'linux'],
    'data-science': ['python', 'machine learning', 'statistics', 'sql', 'deep learning']
};

/**
 * Determine dynamic module count based on subtopic count, role difficulty, and core skill status
 */
function calculateModuleCount(subtopicCount, difficulty, isCore) {
    let count;
    if (subtopicCount <= 4) count = 2;
    else if (subtopicCount <= 8) count = 3;
    else if (subtopicCount <= 12) count = 4;
    else count = Math.min(6, 5);

    if (difficulty === 'advanced') count += 1;
    if (isCore && count < 3) count = 3;

    return Math.min(count, 6);
}

/**
 * Check if a topic name matches core skills for the given role
 */
function isCoreTopic(topicName, role) {
    const coreList = CORE_SKILLS[role] || CORE_SKILLS['sde'];
    const lower = topicName.toLowerCase();
    return coreList.some(skill => lower.includes(skill) || skill.includes(lower));
}

/**
 * Generate dynamic modules from a flat list of items
 */
function generateDynamicModulesFromItems(topicName, items, role, difficulty = 'intermediate') {
    const isCore = isCoreTopic(topicName, role);
    const moduleCount = calculateModuleCount(items.length, difficulty, isCore);

    const modules = [];
    const itemsPerModule = Math.ceil(items.length / moduleCount);

    for (let i = 0; i < moduleCount; i++) {
        const start = i * itemsPerModule;
        const moduleItems = items.slice(start, start + itemsPerModule);
        if (moduleItems.length === 0) break;

        let moduleTitle;
        if (moduleCount === 2) {
            moduleTitle = i === 0 ? `${topicName} — Core Concepts` : `${topicName} — Applied & Advanced`;
        } else {
            moduleTitle = `${moduleItems[0]}${moduleItems.length > 1 ? ' & Related' : ''}`;
        }

        modules.push({
            title: moduleTitle,
            subtopics: moduleItems,
            practiceProblems: [],
            youtubeQueries: [
                `${topicName} ${moduleItems[0]} tutorial`,
                `${topicName} ${moduleItems[moduleItems.length - 1]} explained`
            ],
            deadline: `${Math.max(2, Math.ceil(moduleItems.length * 1.5))} days`,
            tasks: moduleItems.slice(0, 3).map(item => `Study and practice: ${item}`)
        });
    }

    return modules;
}

/**
 * Validate and normalize AI-generated modules for a topic.
 */
function normalizeTopicModules(topic, role) {
    const difficulty = topic.difficulty || 'intermediate';
    const isCore = topic.isCore || isCoreTopic(topic.name, role);

    if (topic.modules && Array.isArray(topic.modules) && topic.modules.length > 0) {
        const totalSubtopics = topic.modules.reduce((sum, m) => sum + (m.subtopics?.length || 0), 0);
        const expectedMin = calculateModuleCount(totalSubtopics, difficulty, isCore);

        if (topic.modules.length < expectedMin && totalSubtopics > 6) {
            const allSubtopics = topic.modules.flatMap(m => m.subtopics || []);
            return generateDynamicModulesFromItems(topic.name, allSubtopics, role, difficulty);
        }
        return topic.modules;
    }

    if (topic.items && Array.isArray(topic.items)) {
        return generateDynamicModulesFromItems(topic.name, topic.items, role, difficulty);
    }

    return [];
}

const RoadmapEngine = {
    getRoleTopics: (role) => ROLE_TOPICS[role] || ROLE_TOPICS['sde'],
    
    generateRoadmap: (role, skillGaps = []) => {
        const baseTopics = ROLE_TOPICS[role] || ROLE_TOPICS['sde'];
        const roadmap = {
            role,
            weeks: [],
            totalTasks: 0
        };

        // Add skill gaps as a special section
        if (skillGaps.length > 0) {
            const focusSection = {
                title: 'Personalized Focus (Skill Gaps)',
                topics: skillGaps.map(gap => ({
                    name: gap.name,
                    modules: generateDynamicModulesFromItems(gap.name, [gap.name, 'Practical Implementation', 'Advanced Scenarios'], role)
                }))
            };
            roadmap.weeks.push(focusSection);
        }

        // Standard role topics
        baseTopics.forEach(section => {
            const week = {
                title: section.title,
                topics: section.topics.map(topic => ({
                    name: topic.name,
                    modules: normalizeTopicModules(topic, role)
                }))
            };
            roadmap.weeks.push(week);
        });

        // Calculate totals
        roadmap.weeks.forEach(w => {
            w.topics.forEach(t => {
                t.modules.forEach(m => {
                    roadmap.totalTasks += (m.subtopics || []).length;
                });
            });
        });

        return roadmap;
    }
};

export { RoadmapEngine };
window.RoadmapEngine = RoadmapEngine;
