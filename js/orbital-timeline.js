/**
 * Radial Orbital Timeline - Vanilla JS Version
 * Handles mathematical positioning, 3D rotations, and interactions
 */

class OrbitalTimeline {
    constructor(options = {}) {
        this.options = {
            containerSelector: options.containerSelector || '#orbital-timeline-container',
            data: options.data || [],
            autoRotate: options.autoRotate !== undefined ? options.autoRotate : true,
            rotationSpeed: options.rotationSpeed || 0.3,
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
                                <div class="card-header">
                                    <span class="badge ${item.status}">${item.status.toUpperCase()}</span>
                                    <span class="date">${item.date}</span>
                                </div>
                                <h3 class="card-title">${item.title}</h3>
                                <p class="card-desc">${item.content}</p>
                                
                                <div class="card-energy">
                                    <div class="energy-label">
                                        <span>⚡ Energy Level</span>
                                        <span>${item.energy}%</span>
                                    </div>
                                    <div class="energy-bar">
                                        <div class="energy-fill" style="width: ${item.energy}%"></div>
                                    </div>
                                </div>

                                ${item.relatedIds.length > 0 ? `
                                    <div class="card-connections">
                                        <h4>CONNECTED NODES</h4>
                                        <div class="connection-list">
                                            ${item.relatedIds.map(relId => {
            const rel = this.options.data.find(d => d.id === relId);
            return `<button class="rel-btn" data-rel="${relId}">${rel ? rel.title : 'Node'} →</button>`;
        }).join('')}
                                        </div>
                                    </div>
                                ` : ''}
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
            const angle = ((index / total) * 360 + this.rotationAngle) % 360;
            const radian = (angle * Math.PI) / 180;

            const x = this.options.radius * Math.cos(radian);
            const y = this.options.radius * Math.sin(radian);

            // Z-index simulating depth
            const zIndex = 100 + Math.round(50 * Math.cos(radian));
            const opacity = 0.4 + 0.6 * ((1 + Math.sin(radian)) / 2);

            el.style.transform = `translate(${x}px, ${y}px)`;
            el.style.zIndex = (item.id === this.expandedId) ? 1000 : zIndex;
            el.style.opacity = (item.id === this.expandedId) ? 1 : opacity;
        });
    }
}

// Initial Data
const timelineData = [
    { id: 1, title: "Planning", date: "Jan 2024", content: "Project planning and requirements gathering phase.", status: "completed", icon: "Calendar", relatedIds: [2], energy: 100 },
    { id: 2, title: "Design", date: "Feb 2024", content: "UI/UX design and system architecture.", status: "completed", icon: "FileText", relatedIds: [1, 3], energy: 90 },
    { id: 3, title: "Development", date: "Mar 2024", content: "Core features implementation and testing.", status: "in-progress", icon: "Code", relatedIds: [2, 4], energy: 60 },
    { id: 4, title: "Testing", date: "Apr 2024", content: "User testing and bug fixes.", status: "pending", icon: "User", relatedIds: [3, 5], energy: 30 },
    { id: 5, title: "Release", date: "May 2024", content: "Final deployment and release.", status: "pending", icon: "Clock", relatedIds: [4], energy: 10 }
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
