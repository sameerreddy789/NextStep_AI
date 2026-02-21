/**
 * Radial Orbital Timeline - Vanilla JS Version
 * Version: 3.1 — Card attached below each node, moves with it
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
        try {
            this.render();
            this.setupEventListeners();
            this.startAnimation();
            if (this.options.autoCycle) this.startAutoCycle();
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
                <div class="orbital-core">
                    <div class="core-inner"></div>
                    <div class="core-pulse-1"></div>
                    <div class="core-pulse-2"></div>
                </div>
                <div class="orbital-path"></div>
                <div class="nodes-container">
                    ${this.options.data.map((item) => `
                        <div class="orbital-node" data-id="${item.id}" id="node-${item.id}">
                            <div class="node-glow" style="--energy: ${item.energy}"></div>
                            <div class="node-circle">
                                ${this.getIcon(item.icon)}
                            </div>
                            <div class="node-label">${item.title}</div>
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
        const icons = {
            'Milestone': '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h13l4-3.5L18 6Z"></path><path d="M12 13v8"></path><path d="M12 3v3"></path></svg>',
            'UserSquare': '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="12" cy="10" r="3"></circle><path d="M7 21v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"></path></svg>',
            'Target': '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>',
            'Mic2': '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>',
            'TrendingUp': '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>'
        };
        return icons[iconName] || icons['UserSquare'];
    }

    setupEventListeners() {
        this.container.addEventListener('click', (e) => {
            const node = e.target.closest('.orbital-node');
            this._isUserClick = true;

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
        if (this.expandedId === id) { this.closeAll(); return; }

        if (this._isUserClick) {
            if (this.cycleTimer) this.stopAutoCycle();
            if (this._resumeTimer) { clearTimeout(this._resumeTimer); this._resumeTimer = null; }
        }

        this.expandedId = id;
        this.pulseEffects = {};
        const currentItem = this.options.data.find(item => item.id === id);
        currentItem.relatedIds.forEach(relId => { this.pulseEffects[relId] = true; });
        this.updateNodeStates();
    }

    closeAll() {
        this.expandedId = null;
        this.pulseEffects = {};
        this.updateNodeStates();
        if (this.options.autoCycle && !this.cycleTimer) {
            this._resumeTimer = setTimeout(() => this.startAutoCycle(), 6000);
        }
    }

    updateRotationState() {
        if (this.container) this.container.classList.toggle('is-rotating', this.isAutoRotating);
    }

    startAutoCycle() { this.cycleToNext(); }

    cycleToNext() {
        if (this.cycleTimer) clearTimeout(this.cycleTimer);
        const currentItem = this.options.data[this.currentCycleIndex];
        if (currentItem) this.toggleNode(currentItem.id);
        this.currentCycleIndex = (this.currentCycleIndex + 1) % this.options.data.length;
        this.cycleTimer = setTimeout(() => this.cycleToNext(), this.options.cycleDuration);
    }

    stopAutoCycle() {
        if (this.cycleTimer) { clearTimeout(this.cycleTimer); this.cycleTimer = null; }
    }

    updateNodeStates() {
        Object.keys(this.nodeElements).forEach(id => {
            const el = this.nodeElements[id];
            const numericId = parseInt(id);
            el.classList.remove('expanded', 'related', 'pulse');
            if (numericId === this.expandedId) el.classList.add('expanded');
            else if (this.expandedId && this.pulseEffects[numericId]) el.classList.add('related', 'pulse');
        });
    }

    startAnimation() {
        const animate = () => {
            if (this.isAutoRotating) this.rotationAngle = (this.rotationAngle + this.options.rotationSpeed) % 360;
            this.positionNodes();
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }

    positionNodes() {
        const total = this.options.data.length;
        const effectiveRadius = window.innerWidth <= 600 ? 150 : this.options.radius;

        this.options.data.forEach((item, index) => {
            const el = this.nodeElements[item.id];
            if (!el) return;

            const angle = -90 + (index / total) * 360 + this.rotationAngle;
            const radian = (angle * Math.PI) / 180;
            const x = effectiveRadius * Math.cos(radian);
            const y = effectiveRadius * Math.sin(radian);

            el.style.transform = `translate(${x}px, ${y}px)`;
            el.style.left = '0';
            el.style.top = '0';

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

// Data
const timelineData = [
    { id: 1, title: "Resume", date: "Step 1", content: "Upload your resume and get AI-powered skill extraction, ATS compatibility scoring, and personalized improvement suggestions.", status: "completed", icon: "UserSquare", relatedIds: [2, 3], energy: 100 },
    { id: 2, title: "Interview", date: "Step 2", content: "Practice with adaptive AI mock interviews. Choose technical, behavioral, or mixed modes tailored to your target role.", status: "in-progress", icon: "Mic2", relatedIds: [1, 3, 4], energy: 75 },
    { id: 3, title: "Skill Gap", date: "Step 3", content: "Identify missing critical skills for your dream job. Get prioritized recommendations based on market demand.", status: "in-progress", icon: "Target", relatedIds: [1, 2, 4], energy: 60 },
    { id: 4, title: "Roadmap", date: "Step 4", content: "Follow a personalized 6-week learning plan with curated YouTube tutorials and LeetCode problems.", status: "pending", icon: "Milestone", relatedIds: [3, 5], energy: 40 },
    { id: 5, title: "Progress", date: "Ongoing", content: "Track your daily activities, maintain streaks, and monitor your Job Readiness Score as you improve.", status: "pending", icon: "TrendingUp", relatedIds: [4], energy: 20 }
];

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('orbital-timeline-container')) {
        new OrbitalTimeline({
            containerSelector: '#orbital-timeline-container',
            data: timelineData, accentColor: '#6366f1',
            autoRotate: true, rotationSpeed: 0.2,
            autoCycle: true, cycleDuration: 3000
        });
    }
});
