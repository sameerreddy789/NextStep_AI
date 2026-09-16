export const ROLE_TOPICS = {
    'frontend': [
        {
            title: 'HTML & CSS Mastery',
            topics: [
                { name: 'Semantic HTML', items: ['Accessibility (ARIA)', 'SEO Meta Tags', 'Form Validation & Inputs'] },
                { name: 'Modern CSS', items: ['Flexbox', 'CSS Grid', 'Custom Properties', 'Container Queries', 'Animations & Transitions', 'Responsive Design', 'Media Queries', 'Clamp & Fluid Typography'] },
                { name: 'CSS Architecture', items: ['BEM Methodology', 'SASS/SCSS', 'Utility-first (Tailwind)', 'CSS Modules'] }
            ]
        },
        {
            title: 'JavaScript Deep Dive',
            topics: [
                { name: 'Core Concepts', items: ['Closures & Scope', 'Prototypal Inheritance', 'ES6+ Features', 'Destructuring & Spread', 'Modules (import/export)', 'Symbol & Iterator', 'Proxy & Reflect', 'WeakMap & WeakSet', 'Tagged Template Literals'] },
                { name: 'Asynchronous JS', items: ['Promises', 'Async/Await', 'Event Loop & Microtasks', 'Web Workers', 'AbortController'] },
                { name: 'DOM & Browser APIs', items: ['Event Delegation', 'Intersection Observer', 'MutationObserver', 'Performance API', 'Service Workers', 'Web Storage API', 'Fetch & XMLHttpRequest', 'History API', 'Drag & Drop API', 'Clipboard API', 'Geolocation API', 'Notification API'] }
            ]
        },
        {
            title: 'React Ecosystem',
            topics: [
                { name: 'React Fundamentals', items: ['useState & useEffect', 'useRef & useContext', 'Custom Hooks', 'Error Boundaries', 'Suspense & Lazy Loading', 'React.memo', 'forwardRef', 'Portals', 'Strict Mode'] },
                { name: 'State Management', items: ['Context API', 'Redux Toolkit', 'Zustand', 'TanStack Query', 'Jotai', 'Recoil', 'Signals Pattern'] },
                { name: 'Testing & Tooling', items: ['Jest', 'React Testing Library', 'Cypress E2E'] },
                { name: 'Performance & SSR', items: ['Code Splitting', 'useMemo & useCallback', 'React Profiler', 'Next.js Basics', 'Server Components', 'Streaming SSR', 'ISR & SSG', 'Image Optimization', 'Bundle Analysis'] }
            ]
        }
    ],
    'backend': [
        {
            title: 'Node.js & Express',
            topics: [
                { name: 'Server Core', items: ['Event Loop Internals', 'Streams & Buffers', 'File System (fs)', 'Cluster Module', 'Child Processes', 'Worker Threads', 'Environment Config', 'Process Signals', 'Error Handling Patterns'] },
                { name: 'API Design', items: ['RESTful Conventions', 'Middleware Chains', 'Input Validation (Zod)', 'Rate Limiting'] },
                { name: 'Authentication & Security', items: ['JWT Tokens', 'OAuth2 Flows', 'Passport.js Strategies', 'Session Management', 'RBAC', 'Refresh Token Rotation', 'CORS', 'Helmet.js', 'CSRF Protection', 'SQL Injection Prevention', 'XSS Prevention'] }
            ]
        },
        {
            title: 'Database & Storage',
            topics: [
                { name: 'SQL Databases', items: ['PostgreSQL', 'Complex Joins', 'Indexing Strategies', 'Stored Procedures', 'Query Optimization', 'Migrations', 'Window Functions', 'CTEs', 'Partitioning', 'Connection Pooling', 'Replication', 'Backup Strategies'] },
                { name: 'NoSQL Databases', items: ['MongoDB CRUD', 'Schema Design Patterns', 'Aggregation Pipeline', 'Mongoose ODM'] },
                { name: 'Caching & Queues', items: ['Redis Data Structures', 'Cache Invalidation', 'Pub/Sub', 'CDN Caching', 'Bull/BullMQ Job Queues', 'RabbitMQ Basics', 'Kafka Fundamentals', 'Dead Letter Queues'] }
            ]
        },
        {
            title: 'System & DevOps',
            topics: [
                { name: 'System Design', items: ['Scalability Patterns', 'Load Balancing', 'Microservices Architecture', 'API Gateway', 'CAP Theorem', 'Database Sharding', 'Event-Driven Architecture', 'CQRS', 'Saga Pattern', 'Circuit Breaker', 'Service Mesh', 'Rate Limiting at Scale', 'Consistent Hashing'] },
                { name: 'Docker & CI/CD', items: ['Dockerfile & Images', 'Docker Compose', 'GitHub Actions', 'Nginx Reverse Proxy'] },
                { name: 'Monitoring', items: ['Logging (Winston/Pino)', 'Health Checks', 'APM Tools'] }
            ]
        }
    ],
    'sde': [
        {
            title: 'Aptitude & Reasoning',
            icon: '🧠',
            topics: [
                { name: 'Quantitative Aptitude', items: ['Number Systems', 'Percentages & Ratios', 'Time, Speed & Distance', 'Profit & Loss', 'Averages & Mixtures', 'Permutations & Combinations', 'Probability', 'Simple & Compound Interest', 'Work & Time', 'Mensuration'] },
                { name: 'Logical Reasoning', items: ['Seating Arrangement', 'Blood Relations', 'Syllogisms', 'Coding-Decoding', 'Direction Sense'] },
                { name: 'Verbal Ability', items: ['Reading Comprehension', 'Sentence Correction', 'Vocabulary'] },
                { name: 'Data Interpretation', items: ['Bar & Line Charts', 'Pie Charts', 'Tables & Caselets', 'Data Sufficiency', 'Ratio-based DI', 'Multi-level DI', 'Missing Data Problems'] }
            ]
        },
        {
            title: 'Data Structures & Algorithms',
            icon: '⚡',
            topics: [
                { name: 'Arrays & Strings', items: ['Kadane\'s Algorithm', 'Two Pointers', 'Sliding Window', 'Prefix Sums', 'Matrix Traversal', 'String Matching', 'Anagram Problems', 'Subarray Problems', 'Merge Intervals', 'Spiral Order', 'Next Permutation', 'Trapping Rain Water', 'Stock Buy/Sell'] },
                { name: 'Linked Lists', items: ['Singly & Doubly Linked Lists', 'Cycle Detection (Floyd)', 'Reverse a Linked List', 'Merge Two Sorted Lists'] },
                { name: 'Stacks & Queues', items: ['Monotonic Stack', 'Next Greater Element', 'Min Stack', 'Queue using Stacks'] },
                { name: 'Trees', items: ['Binary Tree Traversals', 'BST Operations', 'Lowest Common Ancestor', 'Diameter of Tree', 'Level Order Traversal', 'Serialize/Deserialize', 'Morris Traversal', 'AVL & Red-Black Basics', 'Segment Trees', 'Fenwick Tree (BIT)'] },
                { name: 'Graphs', items: ['BFS & DFS', 'Dijkstra\'s Algorithm', 'Bellman-Ford', 'Floyd-Warshall', 'Topological Sort', 'Union-Find (DSU)', 'Minimum Spanning Tree (Kruskal/Prim)', 'Cycle Detection', 'Bipartite Check', 'Strongly Connected Components', 'Articulation Points', 'Network Flow Basics'] },
                { name: 'Heaps & Hashing', items: ['Min/Max Heap', 'Priority Queue', 'Top K Elements', 'Median in Stream', 'HashMap Internals', 'Collision Resolution'] },
                { name: 'Dynamic Programming', items: ['0/1 Knapsack', 'Longest Common Subsequence', 'Longest Increasing Subsequence', 'Matrix Chain Multiplication', 'Coin Change', 'Edit Distance', 'Palindrome Partitioning', 'DP on Trees', 'DP on Grids', 'Bitmask DP', 'Digit DP', 'Interval DP', 'State Machine DP'] },
                { name: 'Greedy & Backtracking', items: ['Activity Selection', 'Huffman Coding', 'Job Scheduling', 'N-Queens', 'Sudoku Solver', 'Subset Sum', 'Permutations & Combinations'] },
                { name: 'Miscellaneous', items: ['Binary Search Variants', 'Bit Manipulation', 'Recursion Patterns', 'Divide & Conquer'] }
            ]
        },
        {
            title: 'CS Fundamentals',
            icon: '💻',
            topics: [
                { name: 'Operating Systems', items: ['Process vs Thread', 'CPU Scheduling Algorithms', 'Memory Management (Paging, Segmentation)', 'Virtual Memory', 'Deadlocks (Detection, Prevention, Avoidance)', 'Concurrency & Synchronization (Mutex, Semaphore)', 'File Systems', 'Disk Scheduling', 'Inter-Process Communication'] },
                { name: 'DBMS', items: ['ER Model & Schema Design', 'Normalization (1NF to BCNF)', 'ACID Properties', 'Indexing (B-Tree, Hash)', 'Transactions & Concurrency Control', 'SQL Queries (Joins, Subqueries, Aggregates)', 'Triggers & Views', 'NoSQL Concepts', 'CAP Theorem', 'Query Optimization', 'Stored Procedures', 'Database Recovery'] },
                { name: 'Computer Networks', items: ['OSI vs TCP/IP Model', 'HTTP/HTTPS & TLS', 'DNS Resolution', 'TCP vs UDP', 'Subnetting & CIDR'] },
                { name: 'OOPS Concepts', items: ['Encapsulation', 'Polymorphism (Compile-time & Runtime)', 'Inheritance (Single, Multiple, Multilevel)', 'Abstraction', 'SOLID Principles', 'Design Patterns (Singleton, Factory, Observer, Strategy, Decorator)'] }
            ]
        }
    ]
};
