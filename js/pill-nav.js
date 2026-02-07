/**
 * Pill Navigation - Vanilla JS
 * Animated pill-style navigation with GSAP
 */

class PillNav {
    constructor(options = {}) {
        this.options = {
            containerSelector: '#pill-nav-container',
            logo: options.logo || '🚀',
            logoAlt: options.logoAlt || 'Logo',
            items: options.items || [],
            activeHref: options.activeHref || '/',
            ease: options.ease || 'power3.out',
            baseColor: options.baseColor || '#ffffff',
            pillColor: options.pillColor || '#6366f1',
            hoveredPillTextColor: options.hoveredPillTextColor || '#ffffff',
            pillTextColor: options.pillTextColor || '#ffffff',
            ...options
        };

        this.circleRefs = [];
        this.timelines = [];
        this.isMobileMenuOpen = false;

        this.init();
    }

    init() {
        this.render();
        this.setupAnimations();
        this.setupEventListeners();
    }

    render() {
        const container = document.querySelector(this.options.containerSelector);
        if (!container) return;

        const { logo, logoAlt, items, activeHref, baseColor, pillColor, hoveredPillTextColor, pillTextColor } = this.options;

        container.innerHTML = `
            <nav class="pill-nav" style="--base: ${baseColor}; --pill-bg: ${pillColor}; --hover-text: ${hoveredPillTextColor}; --pill-text: ${pillTextColor};">
                <div class="nav-branding">
                    <a class="pill-logo" href="${items[0]?.href || '/'}" aria-label="Home">
                        ${logo.includes('.') ? `<img src="${logo}" alt="${logoAlt}">` : `<span class="logo-emoji">${logo}</span>`}
                    </a>
                    <span class="nav-brand-name">NextStep AI</span>
                </div>

                <div class="pill-nav-items desktop-only">
                    <ul class="pill-list" role="menubar">
                        ${items.map((item, i) => `
                            <li role="none">
                                <a role="menuitem" href="${item.href}" 
                                   class="pill${activeHref === item.href ? ' is-active' : ''}"
                                   data-index="${i}">
                                    <span class="hover-circle" aria-hidden="true"></span>
                                    <span class="label-stack">
                                        <span class="pill-label">${item.label}</span>
                                        <span class="pill-label-hover" aria-hidden="true">${item.label}</span>
                                    </span>
                                </a>
                            </li>
                        `).join('')}
                    </ul>
                </div>

                <button class="mobile-menu-button mobile-only" aria-label="Toggle menu">
                    <span class="hamburger-line"></span>
                    <span class="hamburger-line"></span>
                </button>
            </nav>

            <div class="mobile-menu-popover mobile-only" style="--base: ${baseColor}; --pill-bg: ${pillColor}; --hover-text: ${hoveredPillTextColor}; --pill-text: ${pillTextColor};">
                <ul class="mobile-menu-list">
                    ${items.map((item) => `
                        <li>
                            <a href="${item.href}" 
                               class="mobile-menu-link${activeHref === item.href ? ' is-active' : ''}">
                                ${item.label}
                            </a>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    setupAnimations() {
        const pills = document.querySelectorAll('.pill');
        const totalPills = pills.length;

        pills.forEach((pill, i) => {
            // Skip animation for the last item (CTA button)
            if (i === totalPills - 1) {
                this.timelines[i] = null;
                return;
            }

            const circle = pill.querySelector('.hover-circle');
            const label = pill.querySelector('.pill-label');
            const hoverLabel = pill.querySelector('.pill-label-hover');

            if (!circle) return;

            this.circleRefs[i] = circle;

            const rect = pill.getBoundingClientRect();
            const { width: w, height: h } = rect;
            const R = ((w * w) / 4 + h * h) / (2 * h);
            const D = Math.ceil(2 * R) + 2;
            const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
            const originY = D - delta;

            circle.style.width = `${D}px`;
            circle.style.height = `${D}px`;
            circle.style.bottom = `-${delta}px`;

            gsap.set(circle, {
                xPercent: -50,
                scale: 0,
                transformOrigin: `50% ${originY}px`
            });

            if (label) gsap.set(label, { y: 0 });
            if (hoverLabel) gsap.set(hoverLabel, { y: h + 12, opacity: 0 });

            // Create timeline
            const tl = gsap.timeline({ paused: true });

            tl.to(circle, {
                scale: 1.2,
                xPercent: -50,
                duration: 0.4,
                ease: this.options.ease
            }, 0);

            if (label) {
                tl.to(label, {
                    y: -(h + 8),
                    duration: 0.4,
                    ease: this.options.ease
                }, 0);
            }

            if (hoverLabel) {
                gsap.set(hoverLabel, { y: Math.ceil(h + 100), opacity: 0 });
                tl.to(hoverLabel, {
                    y: 0,
                    opacity: 1,
                    duration: 0.4,
                    ease: this.options.ease
                }, 0);
            }

            this.timelines[i] = tl;
        });
    }


    setupEventListeners() {
        // Pill hover events
        document.querySelectorAll('.pill').forEach((pill, i) => {
            pill.addEventListener('mouseenter', () => this.handleEnter(i));
            pill.addEventListener('mouseleave', () => this.handleLeave(i));
        });

        // Mobile menu toggle
        const mobileBtn = document.querySelector('.mobile-menu-button');
        if (mobileBtn) {
            mobileBtn.addEventListener('click', () => this.toggleMobileMenu());
        }

        // Resize handler
        window.addEventListener('resize', () => this.setupAnimations());

        // Logo hover
        const logo = document.querySelector('.pill-logo img, .pill-logo .logo-emoji');
        if (logo) {
            document.querySelector('.pill-logo').addEventListener('mouseenter', () => {
                gsap.to(logo, { rotate: 360, duration: 0.3, ease: this.options.ease });
            });
        }
    }

    handleEnter(i) {
        const tl = this.timelines[i];
        if (tl) {
            tl.tweenTo(tl.duration(), { duration: 0.3, ease: this.options.ease });
        }
    }

    handleLeave(i) {
        const tl = this.timelines[i];
        if (tl) {
            tl.tweenTo(0, { duration: 0.2, ease: this.options.ease });
        }
    }

    toggleMobileMenu() {
        this.isMobileMenuOpen = !this.isMobileMenuOpen;

        const hamburger = document.querySelector('.mobile-menu-button');
        const menu = document.querySelector('.mobile-menu-popover');
        const lines = hamburger?.querySelectorAll('.hamburger-line');

        if (lines) {
            if (this.isMobileMenuOpen) {
                gsap.to(lines[0], { rotation: 45, y: 3, duration: 0.3, ease: this.options.ease });
                gsap.to(lines[1], { rotation: -45, y: -3, duration: 0.3, ease: this.options.ease });
            } else {
                gsap.to(lines[0], { rotation: 0, y: 0, duration: 0.3, ease: this.options.ease });
                gsap.to(lines[1], { rotation: 0, y: 0, duration: 0.3, ease: this.options.ease });
            }
        }

        if (menu) {
            if (this.isMobileMenuOpen) {
                gsap.set(menu, { visibility: 'visible' });
                gsap.fromTo(menu,
                    { opacity: 0, y: 10 },
                    { opacity: 1, y: 0, duration: 0.3, ease: this.options.ease }
                );
            } else {
                gsap.to(menu, {
                    opacity: 0,
                    y: 10,
                    duration: 0.2,
                    ease: this.options.ease,
                    onComplete: () => gsap.set(menu, { visibility: 'hidden' })
                });
            }
        }
    }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('pill-nav-container')) {
        new PillNav({
            logo: '🚀',
            logoAlt: 'NextStep AI',
            items: [
                { label: 'Home', href: 'index.html' },
                { label: 'How It Works', href: '#how-it-works' },
                { label: 'Features', href: '#features' },
                { label: 'Get Started', href: 'auth.html' }
            ],
            activeHref: 'index.html',
            baseColor: '#0a0a12',
            pillColor: '#6366f1',
            hoveredPillTextColor: '#ffffff',
            pillTextColor: '#ffffff'
        });
    }

    // Intercept clicks on auth.html links - redirect to dashboard if already logged in
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href="auth.html"]');
        if (link) {
            // Check if user is already logged in
            const userData = localStorage.getItem('nextStep_user');
            if (userData) {
                e.preventDefault();
                window.location.href = 'dashboard.html';
            }
        }
    });
});
