/**
 * Roadmap Engine
 * Manages granular topic structures, dynamic module generation, and roadmap logic.
 */

const ROLE_TOPICS = {
    'frontend': [
        {
            title: 'HTML & CSS Mastery',
            topics: [
                { name: 'Semantic HTML', items: ['Accessibility', 'SEO Tags', 'Form Validation'] },
                { name: 'Modern CSS', items: ['Flexbox', 'Grid', 'Custom Properties (Variables)'] },
                { name: 'CSS Architecture', items: ['BEM', 'SASS/SCSS', 'Utility-first'] }
            ]
        },
        {
            title: 'JavaScript Deep Dive',
            topics: [
                { name: 'Core Concepts', items: ['Closures', 'Prototypal Inheritance', 'ES6+ Features'] },
                { name: 'Asynchronous JS', items: ['Promises', 'Async/Await', 'Event Loop'] },
                { name: 'DOM Manipulation', items: ['Event Delegation', 'Performance Optimization'] }
            ]
        },
        {
            title: 'React Ecosystem',
            topics: [
                { name: 'React Fundamentals', items: ['Hooks (useState, useEffect)', 'Props & State', 'Components Lifecycle'] },
                { name: 'State Management', items: ['Context API', 'Redux Toolkit', 'Zustand'] },
                { name: 'Routing & Performance', items: ['React Router', 'Code Splitting', 'Memoization'] }
            ]
        }
    ],
    'backend': [
        {
            title: 'Node.js & Express',
            topics: [
                { name: 'Server Core', items: ['Event Loop', 'Buffer & Streams', 'File System'] },
                { name: 'API Design', items: ['RESTful Principles', 'Middleware', 'Error Handling'] },
                { name: 'Authentication', items: ['JWT', 'OAuth2', 'Passport.js'] }
            ]
        },
        {
            title: 'Database & Storage',
            topics: [
                { name: 'SQL', items: ['PostgreSQL', 'Complex Joins', 'Indexing'] },
                { name: 'NoSQL', items: ['MongoDB', 'Schema Design', 'Aggregation Pipeline'] },
                { name: 'Caching', items: ['Redis', 'Cache Invalidation Strategies'] }
            ]
        },
        {
            title: 'System & DevOps',
            topics: [
                { name: 'System Design', items: ['Scalability', 'Load Balancing', 'Microservices'] },
                { name: 'Docker & CI/CD', items: ['Containerization', 'GitHub Actions', 'Deployment'] }
            ]
        }
    ],
    'sde': [
        {
            title: 'Aptitude & Reasoning',
            icon: '🧠',
            topics: [
                { name: 'Quantitative Aptitude', items: ['Number Systems', 'Percentages & Ratios', 'Time, Speed & Distance'] },
                { name: 'Logical Reasoning', items: ['Seating Arrangement', 'Blood Relations', 'Syllogisms'] },
                { name: 'Verbal Ability', items: ['Reading Comprehension', 'Sentence Correction', 'Vocabulary'] }
            ]
        },
        {
            title: 'Data Structures & Algorithms',
            icon: '⚡',
            topics: [
                { name: 'Linear Data Structures', items: ['Arrays & Strings', 'Linked Lists', 'Stacks & Queues'] },
                { name: 'Non-Linear Data Structures', items: ['Trees (BST, Heap)', 'Graphs (BFS, DFS)', 'Hash Tables'] },
                { name: 'Algorithm Paradigms', items: ['Dynamic Programming', 'Greedy Algorithms', 'Backtracking'] }
            ]
        },
        {
            title: 'CS Fundamentals',
            icon: '💻',
            topics: [
                { name: 'Operating Systems', items: ['Process Management', 'Memory Management', 'Concurrency'] },
                { name: 'DBMS', items: ['SQL vs NoSQL', 'Normalization', 'ACID Properties'] },
                { name: 'Computer Networks', items: ['OSI Model', 'TCP/IP', 'HTTP/HTTPS'] },
                { name: 'OOPS', items: ['Encapsulation', 'Polymorphism', 'Inheritance'] }
            ]
        }
    ]
};


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

    // Advanced role gets +1 module
    if (difficulty === 'advanced') count += 1;

    // Core skills get minimum 3 modules
    if (isCore && count < 3) count = 3;

    return Math.min(count, 6); // Cap at 6
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
 * Generate dynamic modules from a flat list of items (for legacy/static data)
 * Splits items into balanced modules with generated metadata
 */
function generateDynamicModulesFromItems(topicName, items, role, difficulty = 'intermediate') {
    const isCore = isCoreTopic(topicName, role);
    const moduleCount = calculateModuleCount(items.length, difficulty, isCore);

    // Split items evenly across modules
    const modules = [];
    const itemsPerModule = Math.ceil(items.length / moduleCount);

    for (let i = 0; i < moduleCount; i++) {
        const start = i * itemsPerModule;
        const moduleItems = items.slice(start, start + itemsPerModule);
        if (moduleItems.length === 0) break;

        const moduleTitle = moduleCount <= 2
            ? (i === 0 ? 'Fundamentals' : 'Advanced Concepts')
            : `Module ${i + 1}: ${moduleItems[0]}+`;

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
 * If AI didn't provide modules or provided flat items, generate modules dynamically.
 */
function normalizeTopicModules(topic, role) {
    const difficulty = topic.difficulty || 'intermediate';
    const isCore = topic.isCore || isCoreTopic(topic.name, role);

    // Case 1: AI provided proper modules array
    if (topic.modules && Array.isArray(topic.modules) && topic.modules.length > 0) {
        // Validate module count against rules
        const totalSubtopics = topic.modules.reduce((sum, m) => sum + (m.subtopics?.length || 0), 0);
        const expectedCount = calculateModuleCount(totalSubtopics, difficulty, isCore);

        // If AI gave too few modules, we accept what it gave but log it
        if (topic.modules.length < expectedCount) {
            console.log(`[RoadmapEngine] ⚠️ Topic "${topic.name}" has ${topic.modules.length} modules, expected ${expectedCount}. Accepting AI output.`);
        }

        // Normalize each module to ensure all fields exist
        return topic.modules.map(mod => ({
            title: mod.title || 'Untitled Module',
            subtopics: mod.subtopics || [],
            practiceProblems: mod.practiceProblems || [],
            youtubeQueries: mod.youtubeQueries || [`${topic.name} ${mod.title} tutorial`],
            deadline: mod.deadline || '3 days',
            tasks: mod.tasks || mod.subtopics?.slice(0, 3).map(s => `Study: ${s}`) || []
        }));
    }

    // Case 2: Legacy format — flat items array, no modules
    if (topic.items && Array.isArray(topic.items) && topic.items.length > 0) {
        return generateDynamicModulesFromItems(topic.name, topic.items, role, difficulty);
    }

    // Case 3: No items or modules — generate a single placeholder module
    return [{
        title: topic.name,
        subtopics: [topic.desc || `Learn ${topic.name}`],
        practiceProblems: [],
        youtubeQueries: [`${topic.name} tutorial for beginners`],
        deadline: '3 days',
        tasks: [`Study ${topic.name} fundamentals`]
    }];
}


const RoadmapEngine = {
    customTopics: [],

    addCustomTopic(weekTitle, topic) {
        this.customTopics.push({ weekTitle, topic });
    },

    getRoleData(role) {
        return ROLE_TOPICS[role] || ROLE_TOPICS['sde'];
    },

    generateSampleRoadmap(role = 'sde') {
        const data = this.getRoleData(role);
        return data.map((week, index) => ({
            week: index + 1,
            title: week.title,
            status: 'locked',
            topics: week.topics.map(t => ({
                name: t.name,
                isCore: isCoreTopic(t.name, role),
                difficulty: 'intermediate',
                modules: generateDynamicModulesFromItems(t.name, t.items, role)
            }))
        }));
    },

    /**
     * Generate roadmap from AI data or fallback to static.
     * Applies dynamic module generation as post-processing.
     */
    generateFullRoadmap(role, skillGaps = [], aiRoadmapData = null) {
        // 1. If AI data exists, use it as the primary source
        if (aiRoadmapData && Array.isArray(aiRoadmapData) && aiRoadmapData.length > 0) {
            console.log('[RoadmapEngine] 🤖 Using AI-generated roadmap data with dynamic modules');
            return aiRoadmapData.map((week, index) => ({
                week: week.week || index + 1,
                title: week.title,
                status: index === 0 ? 'current' : 'upcoming',
                topics: week.topics.map(t => ({
                    name: t.name,
                    searchQuery: t.query,
                    isCore: t.isCore || isCoreTopic(t.name, role),
                    difficulty: t.difficulty || 'intermediate',
                    modules: normalizeTopicModules(t, role)
                }))
            }));
        }

        // 2. Fallback to Static Data with dynamic module generation
        const data = JSON.parse(JSON.stringify(this.getRoleData(role)));

        // Inject skill gaps if provided
        if (skillGaps && skillGaps.length > 0) {
            let focusSection = data.find(s => s.title.includes('Focus Area'));
            if (!focusSection) {
                focusSection = {
                    title: '🎯 Interview Focus Areas',
                    icon: '🚀',
                    topics: []
                };
                data.unshift(focusSection);
            }

            skillGaps.forEach(gap => {
                focusSection.topics.push({
                    name: gap.name,
                    items: [
                        gap.reason === 'low_score' ? `Improve score (current: ${gap.score}%)` : `Master ${gap.name}`,
                        `Demonstrated in: ${gap.addedFrom}`,
                        'Review related conceptual modules'
                    ]
                });
            });
        }

        // Inject custom topics
        this.customTopics.forEach(custom => {
            const week = data.find(w => w.title.includes(custom.weekTitle)) || data[data.length - 1];
            if (week) {
                week.topics.push(custom.topic);
            }
        });

        return data.map((week, index) => ({
            week: index + 1,
            title: week.title,
            status: index === 0 ? 'current' : 'upcoming',
            topics: week.topics.map(t => ({
                name: t.name,
                isCore: isCoreTopic(t.name, role),
                difficulty: 'intermediate',
                modules: generateDynamicModulesFromItems(t.name, t.items || [], role)
            }))
        }));
    },

    /**
     * Detect if a roadmap uses the legacy flat format (items) vs new module format.
     * Used for backward compatibility with saved Firestore data.
     */
    isLegacyFormat(roadmapData) {
        if (!roadmapData?.weeks || !Array.isArray(roadmapData.weeks)) return false;
        const firstWeek = roadmapData.weeks[0];
        if (!firstWeek?.topics?.[0]) return false;
        // Legacy format has topic.items but no topic.modules
        return firstWeek.topics[0].items && !firstWeek.topics[0].modules;
    },

    /**
     * Migrate legacy roadmap data to new module format
     */
    migrateLegacyRoadmap(roadmapData, role = 'sde') {
        if (!this.isLegacyFormat(roadmapData)) return roadmapData;

        console.log('[RoadmapEngine] 🔄 Migrating legacy roadmap to dynamic module format');
        return {
            ...roadmapData,
            weeks: roadmapData.weeks.map(week => ({
                ...week,
                topics: week.topics.map(t => ({
                    name: t.name,
                    searchQuery: t.searchQuery,
                    isCore: isCoreTopic(t.name, role),
                    difficulty: 'intermediate',
                    modules: generateDynamicModulesFromItems(t.name, t.items || [], role)
                }))
            })),
            totalTasks: roadmapData.weeks.reduce((acc, w) =>
                acc + w.topics.reduce((t, topic) => {
                    const items = topic.items || [];
                    return t + items.length;
                }, 0), 0)
        };
    }
};

window.RoadmapEngine = RoadmapEngine;