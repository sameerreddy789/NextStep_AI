/**
 * Radial Orbital Timeline - Vanilla JS Version
 * Handles mathematical positioning, 3D rotations, and interactions
 */

class OrbitalTimeline {
    constructor(options = {}) {
        this.options = {
            containerSelector: options.containerSelector || '#orbital-timeline-container',
            data: options.data || [],
            autoRotate: options.autoRotate !== undefined ? options.autoRotate : false,
            rotationSpeed: options.rotationSpeed || 0,
            radius: options.radius || 200,
            accentColor: options.accentColor || '#6366f1',
            ...options
        };

        this.rotationAngle = 0;
        this.isAutoRotating = this.options.autoRotate;
        this.expandedId = null;
        this.pulseEffects = {};
        this.nodeElements = {};

        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
        this.startAnimation();
    }

    render() {
        const container = document.querySelector(this.options.containerSelector);
        if (!container) return;

        container.classList.add('orbital-timeline-wrapper');

        container.innerHTML = `
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
            this.nodeElements[item.id] = container.querySelector(`#node-${item.id}`);
        });
    }

    getIcon(iconName) {
        // Simple SVG mapping for Lucide-like icons
        const icons = {
            'Calendar': '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
            'FileText': '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
            'Code': '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>',
            'User': '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
            'Clock': '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>'
        };
        return icons[iconName] || icons['FileText'];
    }

    setupEventListeners() {
        const container = document.querySelector(this.options.containerSelector);

        container.addEventListener('click', (e) => {
            const node = e.target.closest('.orbital-node');
            const relBtn = e.target.closest('.rel-btn');

            if (relBtn) {
                e.stopPropagation();
                this.toggleNode(parseInt(relBtn.dataset.rel));
                return;
            }

            if (node) {
                e.stopPropagation();
                this.toggleNode(parseInt(node.dataset.id));
            } else {
                this.closeAll();
            }
        });
    }

    toggleNode(id) {
        if (this.expandedId === id) {
            this.closeAll();
            return;
        }

        this.expandedId = id;
        this.isAutoRotating = false;

        // Center the view on this node (270deg is top)
        const index = this.options.data.findIndex(item => item.id === id);
        const total = this.options.data.length;
        const targetAngle = (index / total) * 360;
        this.rotationAngle = (270 - targetAngle) % 360;

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
        this.isAutoRotating = true;
        this.pulseEffects = {};
        this.updateNodeStates();
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
        this.options.data.forEach((item, index) => {
            const el = this.nodeElements[item.id];
            // Start from top (270 degrees / -90 degrees) and distribute evenly
            const angleOffset = -90; // Start from top
            const angle = angleOffset + (index / total) * 360 + this.rotationAngle;
            const radian = (angle * Math.PI) / 180;

            // Calculate position on the circle perimeter
            const x = this.options.radius * Math.cos(radian);
            const y = this.options.radius * Math.sin(radian);

            // Apply transform - nodes are already centered via CSS
            el.style.transform = `translate(${x}px, ${y}px)`;

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
        icon: "FileText",
        relatedIds: [2, 3],
        energy: 100
    },
    {
        id: 2,
        title: "Interview",
        date: "Step 2",
        content: "Practice with adaptive AI mock interviews. Choose technical, behavioral, or mixed modes tailored to your target role.",
        status: "in-progress",
        icon: "User",
        relatedIds: [1, 3, 4],
        energy: 75
    },
    {
        id: 3,
        title: "Skill Gap",
        date: "Step 3",
        content: "Identify missing critical skills for your dream job. Get prioritized recommendations based on market demand.",
        status: "in-progress",
        icon: "Code",
        relatedIds: [1, 2, 4],
        energy: 60
    },
    {
        id: 4,
        title: "Roadmap",
        date: "Step 4",
        content: "Follow a personalized 6-week learning plan with curated YouTube tutorials and LeetCode problems.",
        status: "pending",
        icon: "Calendar",
        relatedIds: [3, 5],
        energy: 40
    },
    {
        id: 5,
        title: "Progress",
        date: "Ongoing",
        content: "Track your daily activities, maintain streaks, and monitor your Job Readiness Score as you improve.",
        status: "pending",
        icon: "Clock",
        relatedIds: [4],
        energy: 20
    }
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('orbital-timeline-container')) {
        new OrbitalTimeline({
            containerSelector: '#orbital-timeline-container',
            data: timelineData,
            accentColor: '#6366f1'
        });
    }
});
