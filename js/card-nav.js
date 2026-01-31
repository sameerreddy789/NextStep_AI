/**
 * CardNav - Vanilla JS Version
 */

class CardNav {
    constructor(options = {}) {
        this.options = {
            containerSelector: options.containerSelector || '#card-nav-container',
            items: options.items || [],
            baseColor: options.baseColor || '#fff',
            menuColor: options.menuColor || '#000',
            buttonBgColor: options.buttonBgColor || '#111',
            buttonTextColor: options.buttonTextColor || '#fff',
            ease: options.ease || 'power3.out',
            ...options
        };

        this.isExpanded = false;
        this.navEl = null;
        this.contentEl = null;
        this.hamburgerEl = null;
        this.cards = [];
        this.tl = null;

        this.init();
    }

    init() {
        this.render();
        this.setupTimeline();
        this.setupEventListeners();
    }

    render() {
        const container = document.querySelector(this.options.containerSelector);
        if (!container) return;

        container.className = 'card-nav-container';
        container.innerHTML = `
            <nav class="card-nav" style="background-color: ${this.options.baseColor}">
                <div class="card-nav-top">
                    <div class="hamburger-menu" style="color: ${this.options.menuColor}" role="button" aria-label="Open menu" tabindex="0">
                        <div class="hamburger-line"></div>
                        <div class="hamburger-line"></div>
                    </div>

                    <div class="logo-container">
                        <div class="logo-text" style="font-weight: 800; font-size: 20px; color: #000;">NextStep AI</div>
                    </div>

                    <button type="button" class="card-nav-cta-button" style="background-color: ${this.options.buttonBgColor}; color: ${this.options.buttonTextColor}">
                        Get Started
                    </button>
                </div>

                <div class="card-nav-content" aria-hidden="true">
                    ${this.options.items.map((item, idx) => `
                        <div class="nav-card" style="background-color: ${item.bgColor}; color: ${item.textColor}">
                            <div class="nav-card-label">${item.label}</div>
                            <div class="nav-card-links">
                                ${item.links.map(link => `
                                    <a class="nav-card-link" href="${link.href || '#'}" aria-label="${link.ariaLabel || ''}">
                                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="nav-card-link-icon">
                                            <line x1="7" y1="17" x2="17" y2="7"></line>
                                            <polyline points="7 7 17 7 17 17"></polyline>
                                        </svg>
                                        ${link.label}
                                    </a>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </nav>
        `;

        this.navEl = container.querySelector('.card-nav');
        this.contentEl = container.querySelector('.card-nav-content');
        this.hamburgerEl = container.querySelector('.hamburger-menu');
        this.cards = container.querySelectorAll('.nav-card');
    }

    calculateHeight() {
        if (!this.contentEl) return 260;

        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        if (isMobile) {
            // Force visibility to measure
            const wasExpanded = this.navEl.classList.contains('open');
            if (!wasExpanded) {
                this.contentEl.style.visibility = 'visible';
                this.contentEl.style.position = 'static';
            }

            const topBar = 60;
            const padding = 16;
            const contentHeight = this.contentEl.scrollHeight;

            if (!wasExpanded) {
                this.contentEl.style.visibility = '';
                this.contentEl.style.position = '';
            }

            return topBar + contentHeight + padding;
        }
        return 260;
    }

    setupTimeline() {
        if (!this.navEl || !this.cards.length) return;

        gsap.set(this.navEl, { height: 60, overflow: 'hidden' });
        gsap.set(this.cards, { y: 50, opacity: 0 });

        this.tl = gsap.timeline({ paused: true });

        this.tl.to(this.navEl, {
            height: () => this.calculateHeight(),
            duration: 0.4,
            ease: this.options.ease
        });

        this.tl.to(this.cards, {
            y: 0,
            opacity: 1,
            duration: 0.4,
            ease: this.options.ease,
            stagger: 0.08
        }, '-=0.1');
    }

    toggleMenu() {
        if (!this.tl) return;

        if (!this.isExpanded) {
            this.isExpanded = true;
            this.navEl.classList.add('open');
            this.hamburgerEl.classList.add('open');
            this.contentEl.setAttribute('aria-hidden', 'false');
            this.tl.play();
        } else {
            this.isExpanded = false;
            this.hamburgerEl.classList.remove('open');
            this.tl.reverse().eventCallback('onReverseComplete', () => {
                this.navEl.classList.remove('open');
                this.contentEl.setAttribute('aria-hidden', 'true');
            });
        }
    }

    setupEventListeners() {
        if (this.hamburgerEl) {
            this.hamburgerEl.addEventListener('click', () => this.toggleMenu());
        }

        window.addEventListener('resize', () => {
            if (this.isExpanded) {
                gsap.set(this.navEl, { height: this.calculateHeight() });
            }
        });
    }
}

// Auto-initialize with data
document.addEventListener('DOMContentLoaded', () => {
    const navItems = [
        {
            label: "Features",
            bgColor: "#0D0716",
            textColor: "#fff",
            links: [
                { label: "AI Resume Analysis", href: "auth.html" },
                { label: "Interview Mock", href: "interview.html" },
                { label: "Learning Roadmap", href: "roadmap.html" }
            ]
        },
        {
            label: "Insights",
            bgColor: "#170D27",
            textColor: "#fff",
            links: [
                { label: "Skill Gap Analysis", href: "skill-gap.html" },
                { label: "Career Progress", href: "#" },
                { label: "ATS Scorer", href: "#" }
            ]
        },
        {
            label: "Connect",
            bgColor: "#271E37",
            textColor: "#fff",
            links: [
                { label: "Our Story", href: "#" },
                { label: "Community", href: "#" },
                { label: "GitHub", href: "https://github.com/sameerreddy789/CareerPilot" }
            ]
        }
    ];

    if (document.getElementById('card-nav-container')) {
        new CardNav({
            containerSelector: '#card-nav-container',
            items: navItems,
            baseColor: '#fff',
            menuColor: '#000',
            buttonBgColor: '#111',
            buttonTextColor: '#fff'
        });
    }
});
