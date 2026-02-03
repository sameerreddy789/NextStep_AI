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
            title: 'Data Structures & Algorithms',
            topics: [
                { name: 'Linear DS', items: ['Arrays & Strings', 'Linked Lists', 'Stacks & Queues'] },
                { name: 'Non-Linear DS', items: ['Trees (BST, AVL)', 'Heaps', 'Graphs (BFS, DFS)'] },
                { name: 'Algorithm Patterns', items: ['Sliding Window', 'Two Pointers', 'Dynamic Programming'] }
            ]
        },
        {
            title: 'Low Level Design (LLD)',
            topics: [
                { name: 'OOPS Principles', items: ['SOLID', 'Encapsulation', 'Polymorphism'] },
                { name: 'Design Patterns', items: ['Singleton', 'Factory', 'Observer', 'Strategy'] }
            ]
        },
        {
            title: 'Computer Science Fundamentals',
            topics: [
                { name: 'Operating Systems', items: ['Process vs Thread', 'Scheduling', 'Memory Management'] },
                { name: 'Computer Networks', items: ['TCP/IP', 'HTTP/HTTPS', 'DNS', 'Websockets'] }
            ]
        }
    ]
};

const RoadmapEngine = {
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

    generateFullRoadmap(role, skillGaps) {
        // In a real app, this would filter/prioritize based on skillGaps
        const data = this.getRoleData(role);
        return data.map((week, index) => ({
            week: index + 1,
            title: week.title,
            status: index === 0 ? 'current' : 'upcoming',
            topics: week.topics
        }));
    }
};

window.RoadmapEngine = RoadmapEngine;
