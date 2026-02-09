/**
 * Roadmap Engine
 * Manages granular topic structures and roadmap generation logic.
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
            topics: week.topics
        }));
    },

    /**
     * Generate roadmap from AI data or fallback to static
     */
    generateFullRoadmap(role, skillGaps = [], aiRoadmapData = null) {
        // 1. If AI data exists, use it as the primary source
        if (aiRoadmapData && Array.isArray(aiRoadmapData) && aiRoadmapData.length > 0) {
            console.log('[RoadmapEngine] 🤖 Using AI-generated roadmap data');
            return aiRoadmapData.map((week, index) => ({
                week: week.week || index + 1,
                title: week.title,
                status: index === 0 ? 'current' : 'upcoming',
                topics: week.topics.map(t => ({
                    name: t.name,
                    searchQuery: t.query, // Store query for SERP
                    items: [t.desc] // Use desc as the first item
                }))
            }));
        }

        // 2. Fallback to Static Data with partial personalization
        const data = JSON.parse(JSON.stringify(this.getRoleData(role))); // Deep copy

        // Inject skill gaps if provided
        if (skillGaps && skillGaps.length > 0) {
            // Find or create an 'Evaluation Focus' section
            let focusSection = data.find(s => s.title.includes('Focus Area'));
            if (!focusSection) {
                focusSection = {
                    title: '🎯 Interview Focus Areas',
                    icon: '🚀',
                    topics: []
                };
                data.unshift(focusSection); // Add to beginning
            }

            // Group skill gaps into topics
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
            topics: week.topics
        }));
    }
};

window.RoadmapEngine = RoadmapEngine;
