/**
 * Radial Orbital Timeline - Vanilla JS Version
 * Handles mathematical positioning, 3D rotations, and interactions
 * Version: 2.1 (Auto-Rotation Enabled)
 */


class OrbitalTimeline {
    constructor(options = {}) {
        this.options = {
            containerSelector: options.containerSelector || '#orbital-timeline-container',
            data: options.data || [],
            autoRotate: options.autoRotate !== undefined ? options.autoRotate : false,
            rotationSpeed: options.rotationSpeed || 0,
            autoCycle: options.autoCycle !== undefined ? options.autoCycle : false,
            cycleDuration: options.cycleDuration || 4000,
            radius: options.radius || 200,
            accentColor: options.accentColor || '#6366f1',
            ...options
        };

        this.rotationAngle = 0;
        this.isAutoRotating = this.options.autoRotate;
        this.expandedId = null;
        this.pulseEffects = {};
        this.nodeElements = {};
        this.container = null;
        this.cycleTimer = null;
        this.currentCycleIndex = 0;

        this.init();
    }


    init() {
        console.log("OrbitalTimeline: Initializing...");
        try {
            this.render();
            this.setupEventListeners();
            this.startAnimation();
            if (this.options.autoCycle) {
                this.startAutoCycle();
            }
            console.log("OrbitalTimeline: Initialization complete");
        } catch (e) {
            console.error("OrbitalTimeline: Initialization failed", e);
        }
    }


    render() {
        this.container = document.querySelector(this.options.containerSelector);
        if (!this.container) return;

        this.container.classList.add('orbital-timeline-wrapper');
        this.updateRotationState();


        this.container.innerHTML = `
            <div class="orbital-scene">
                <!-- Center Core -->
                <div class="orbital-core">
                    <div class="core-inner"></div>
                    <div class="core-pulse-1"></div>
                    <div class="core-pulse-2"></div>
                </div>

                <!-- Orbit Path -->
                <div class="orbital-path"></div>

                <!-- Nodes Container -->
                <div class="nodes-container">
                    ${this.options.data.map((item, i) => `
                        <div class="orbital-node" data-id="${item.id}" id="node-${item.id}">
                            <div class="node-glow" style="--energy: ${item.energy}"></div>
                            <div class="node-circle">
                                ${this.getIcon(item.icon)}
                            </div>
                            <div class="node-label">${item.title}</div>
                            
                            <!-- Detail Card (Initially hidden) -->
                            <div class="node-card">
                                <h3 class="card-title">${item.title}</h3>
                                <p class="card-desc">${item.content}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        this.options.data.forEach(item => {
            this.nodeElements[item.id] = this.container.querySelector(`#node-${item.id}`);
        });

    }

    getIcon(iconName) {
        // Updated SVG mapping for more suitable navigation icons
        const icons = {
            // Milestone (was Calendar/Roadmap)
            'Milestone': '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h13l4-3.5L18 6Z"></path><path d="M12 13v8"></path><path d="M12 3v3"></path></svg>',
            // UserSquare (was FileText/Resume)
            'UserSquare': '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="12" cy="10" r="3"></circle><path d="M7 21v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"></path></svg>',
            // Target (was Code/Skill Gap)
            'Target': '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>',
            // Mic2 (was User/Interview)
            'Mic2': '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>',
            // TrendingUp (was Clock/Progress)
            'TrendingUp': '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>'
        };
        return icons[iconName] || icons['UserSquare'];
    }

    setupEventListeners() {
        const container = document.querySelector(this.options.containerSelector);

        container.addEventListener('click', (e) => {
            const node = e.target.closest('.orbital-node');
            const relBtn = e.target.closest('.rel-btn');

            this._isUserClick = true;

            if (relBtn) {
                e.stopPropagation();
                this.toggleNode(parseInt(relBtn.dataset.rel));
                this._isUserClick = false;
                return;
            }

            if (node) {
                e.stopPropagation();
                this.toggleNode(parseInt(node.dataset.id));
            } else {
                this.closeAll();
            }

            this._isUserClick = false;
        });
    }

    toggleNode(id) {
        if (this.expandedId === id) {
            this.closeAll();
            return;
        }

        // Pause auto-cycle on user interaction (not on auto-cycle calls)
        if (this._isUserClick) {
            if (this.cycleTimer) {
                this.stopAutoCycle();
            }
            if (this._resumeTimer) {
                clearTimeout(this._resumeTimer);
                this._resumeTimer = null;
            }
        }

        this.expandedId = id;

        // Set pulse effects for related nodes
        this.pulseEffects = {};
        const currentItem = this.options.data.find(item => item.id === id);
        currentItem.relatedIds.forEach(relId => {
            this.pulseEffects[relId] = true;
        });

        this.updateNodeStates();
    }


    closeAll() {
        this.expandedId = null;
        this.pulseEffects = {};
        this.updateNodeStates();

        // Resume auto-cycle after user closes all cards
        if (this.options.autoCycle && !this.cycleTimer) {
            this._resumeTimer = setTimeout(() => {
                this.startAutoCycle();
            }, 6000);
        }
    }


    updateRotationState() {
        if (this.container) {
            if (this.isAutoRotating) {
                this.container.classList.add('is-rotating');
            } else {
                this.container.classList.remove('is-rotating');
            }
        }
    }

    startAutoCycle() {
        console.log("OrbitalTimeline: Starting auto-cycle");
        // Start with the first card immediately
        this.cycleToNext();
    }

    cycleToNext() {
        // Clear existing timer
        if (this.cycleTimer) {
            clearTimeout(this.cycleTimer);
        }

        // Get the current item ID
        const currentItem = this.options.data[this.currentCycleIndex];
        if (currentItem) {
            this.toggleNode(currentItem.id);
        }

        // Move to next index
        this.currentCycleIndex = (this.currentCycleIndex + 1) % this.options.data.length;

        // Schedule next cycle
        this.cycleTimer = setTimeout(() => {
            this.cycleToNext();
        }, this.options.cycleDuration);
    }

    stopAutoCycle() {
        if (this.cycleTimer) {
            clearTimeout(this.cycleTimer);
            this.cycleTimer = null;
        }
    }



    updateNodeStates() {
        Object.keys(this.nodeElements).forEach(id => {
            const el = this.nodeElements[id];
            const numericId = parseInt(id);

            el.classList.remove('expanded', 'related', 'pulse');

            if (numericId === this.expandedId) {
                el.classList.add('expanded');
            } else if (this.expandedId && this.pulseEffects[numericId]) {
                el.classList.add('related', 'pulse');
            }
        });
    }

    startAnimation() {
        const animate = () => {
            if (this.isAutoRotating) {
                this.rotationAngle = (this.rotationAngle + this.options.rotationSpeed) % 360;
            }
            this.positionNodes();
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }

    positionNodes() {
        const total = this.options.data.length;
        const nodeWidth = 40; // Width of node-circle

        // Responsive radius — match CSS media query breakpoint
        const effectiveRadius = window.innerWidth <= 600 ? 150 : this.options.radius;

        this.options.data.forEach((item, index) => {
            const el = this.nodeElements[item.id];
            if (!el) return;

            // Start from top (270 degrees / -90 degrees) and distribute evenly
            const angleOffset = -90; // Start from top
            const angle = angleOffset + (index / total) * 360 + this.rotationAngle;
            const radian = (angle * Math.PI) / 180;

            // Calculate position on the circle perimeter
            const x = effectiveRadius * Math.cos(radian);
            const y = effectiveRadius * Math.sin(radian);

            // Apply transform - node center is already handled via CSS
            el.style.transform = `translate(${x}px, ${y}px)`;
            el.style.left = '0';
            el.style.top = '0';

            // Keep all nodes at full opacity when static, dim others when one is expanded
            if (this.expandedId) {
                el.style.zIndex = (item.id === this.expandedId) ? 1000 : 10;
                el.style.opacity = (item.id === this.expandedId) ? 1 : 0.5;
            } else {
                el.style.zIndex = 100;
                el.style.opacity = 1;
            }
        });
    }
}

// NextStep AI Features Data
const timelineData = [
    {
        id: 1,
        title: "Resume",
        date: "Step 1",
        content: "Upload your resume and get AI-powered skill extraction, ATS compatibility scoring, and personalized improvement suggestions.",
        status: "completed",
        icon: "UserSquare",
        relatedIds: [2, 3],
        energy: 100
    },
    {
        id: 2,
        title: "Interview",
        date: "Step 2",
        content: "Practice with adaptive AI mock interviews. Choose technical, behavioral, or mixed modes tailored to your target role.",
        status: "in-progress",
        icon: "Mic2",
        relatedIds: [1, 3, 4],
        energy: 75
    },
    {
        id: 3,
        title: "Skill Gap",
        date: "Step 3",
        content: "Identify missing critical skills for your dream job. Get prioritized recommendations based on market demand.",
        status: "in-progress",
        icon: "Target",
        relatedIds: [1, 2, 4],
        energy: 60
    },
    {
        id: 4,
        title: "Roadmap",
        date: "Step 4",
        content: "Follow a personalized 6-week learning plan with curated YouTube tutorials and LeetCode problems.",
        status: "pending",
        icon: "Milestone",
        relatedIds: [3, 5],
        energy: 40
    },
    {
        id: 5,
        title: "Progress",
        date: "Ongoing",
        content: "Track your daily activities, maintain streaks, and monitor your Job Readiness Score as you improve.",
        status: "pending",
        icon: "TrendingUp",
        relatedIds: [4],
        energy: 20
    }
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('orbital-timeline-container')) {
        console.log("OrbitalTimeline: Container found, starting instance...");
        new OrbitalTimeline({
            containerSelector: '#orbital-timeline-container',
            data: timelineData,
            accentColor: '#6366f1',
            autoRotate: true,
            rotationSpeed: 0.2,
            autoCycle: true,
            cycleDuration: 3000
        });
    } else {
        console.warn("OrbitalTimeline: Container #orbital-timeline-container not found!");
    }


});
