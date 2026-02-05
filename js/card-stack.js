/**
 * CardStack - Vanilla JS Version
 * Adapted from React implementation with GSAP
 */

class CardStack {
    constructor(options = {}) {
        this.options = {
            containerSelector: options.containerSelector || '#card-stack-container',
            items: options.items || [],
            initialIndex: options.initialIndex || 0,
            maxVisible: options.maxVisible || 7,
            cardWidth: options.cardWidth || 480,
            cardHeight: options.cardHeight || 300,
            overlap: options.overlap || 0.48,
            spreadDeg: options.spreadDeg || 48,
            perspectivePx: options.perspectivePx || 1100,
            depthPx: options.depthPx || 140,
            tiltXDeg: options.tiltXDeg || 12,
            activeLiftPx: options.activeLiftPx || 22,
            activeScale: options.activeScale || 1.03,
            inactiveScale: options.inactiveScale || 0.94,
            ease: options.ease || 'power3.out',
            autoAdvance: options.autoAdvance !== undefined ? options.autoAdvance : true,
            intervalMs: options.intervalMs || 3000,
            ...options
        };

        this.activeIndex = this.wrapIndex(this.options.initialIndex);
        this.len = this.options.items.length;
        this.container = null;
        this.stage = null;
        this.cardElements = [];
        this.dots = [];
        this.isHovering = false;
        this.autoPlayTimer = null;

        if (this.len > 0) {
            this.init();
        }
    }

    wrapIndex(n) {
        if (this.len <= 0) return 0;
        return ((n % this.len) + this.len) % this.len;
    }

    signedOffset(i, active) {
        let raw = i - active;
        const half = Math.floor(this.len / 2);

        if (raw > half) raw -= this.len;
        if (raw < -half) raw += this.len;

        return raw;
    }

    init() {
        this.render();
        this.setupInteractions();

        // Position them immediately using manual styles to ensure layout
        this.updateCards(true);

        // Allow browser to breathe then ensure GSAP takes over
        requestAnimationFrame(() => {
            // We don't need to force immediate again if first one worked, 
            // but let's schedule the first transition
            setTimeout(() => this.updateCards(false), 200);
        });

        if (this.options.autoAdvance) {
            this.startAutoAdvance();
        }
    }

    render() {
        const root = document.querySelector(this.options.containerSelector);
        if (!root) return;

        root.className = 'card-stack-container';
        root.innerHTML = `
            <div class="card-stack-stage" style="height: ${this.options.cardHeight + 80}px; perspective: ${this.options.perspectivePx}px;" tabindex="0">
                <div class="card-stack-spotlight"></div>
                <div class="card-stack-shadow"></div>
                <div class="cards-wrapper"></div>
            </div>
            <div class="card-stack-dots"></div>
        `;

        this.stage = root.querySelector('.card-stack-stage');
        this.wrapper = root.querySelector('.cards-wrapper');
        this.dotsContainer = root.querySelector('.card-stack-dots');

        // Create cards
        this.options.items.forEach((item, i) => {
            const card = document.createElement('div');
            card.className = 'card-stack-item';
            card.style.width = `${this.options.cardWidth}px`;
            card.style.height = `${this.options.cardHeight}px`;
            card.innerHTML = `
                <div class="card-inner">
                    <div class="card-image-content">
                        ${item.imageSrc ? `<img src="${item.imageSrc}" class="card-image" alt="${item.title}">` : ''}
                        <div class="card-overlay"></div>
                    </div>
                    <div class="card-info">
                        <div class="card-title">${item.title}</div>
                        ${item.description ? `<div class="card-description">${item.description}</div>` : ''}
                    </div>
                </div>
            `;

            card.addEventListener('click', () => {
                if (i !== this.activeIndex) {
                    this.setActive(i);
                }
            });

            this.wrapper.appendChild(card);
            this.cardElements.push(card);

            // Create dot
            const dot = document.createElement('button');
            dot.className = `stack-dot ${i === this.activeIndex ? 'is-active' : ''}`;
            dot.addEventListener('click', () => this.setActive(i));
            this.dotsContainer.appendChild(dot);
            this.dots.push(dot);
        });
    }

    setupInteractions() {
        // Drag logic for active card
        let isDragging = false;
        let startX = 0;
        let currentTranslate = 0;

        const handleDown = (e) => {
            if (this.isHovering) {
                const activeCard = this.cardElements[this.activeIndex];
                isDragging = true;
                startX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
                currentTranslate = 0;
                this.stopAutoAdvance();
            }
        };

        const handleMove = (e) => {
            if (!isDragging) return;
            const x = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            const diff = x - startX;
            currentTranslate = diff;

            // Apply slight rotation/translate to active card while dragging
            const activeCard = this.cardElements[this.activeIndex];
            gsap.set(activeCard, {
                x: diff,
                rotateZ: diff * 0.05,
                overwrite: 'auto'
            });
        };

        const handleUp = () => {
            if (!isDragging) return;
            isDragging = false;

            const threshold = this.options.cardWidth / 4;
            if (currentTranslate > threshold) {
                this.setActive(this.wrapIndex(this.activeIndex - 1));
            } else if (currentTranslate < -threshold) {
                this.setActive(this.wrapIndex(this.activeIndex + 1));
            } else {
                this.updateCards(); // Reset position
            }

            if (this.options.autoAdvance) this.startAutoAdvance();
        };

        // Touch events
        this.stage.addEventListener('touchstart', handleDown);
        window.addEventListener('touchmove', handleMove);
        window.addEventListener('touchend', handleUp);

        // Mouse events (only if over active card handled via class)
        this.stage.addEventListener('mousedown', handleDown);
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);

        // Keyboard
        this.stage.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.setActive(this.wrapIndex(this.activeIndex - 1));
            if (e.key === 'ArrowRight') this.setActive(this.wrapIndex(this.activeIndex + 1));
        });

        // Hover pause
        this.stage.addEventListener('mouseenter', () => {
            this.isHovering = true;
            this.stopAutoAdvance();
        });
        this.stage.addEventListener('mouseleave', () => {
            this.isHovering = false;
            if (this.options.autoAdvance) this.startAutoAdvance();
        });
    }

    setActive(index) {
        this.activeIndex = this.wrapIndex(index);
        this.updateCards();
        this.updateDots();
    }

    updateCards(immediate = false) {
        const maxOffset = Math.max(0, Math.floor(this.options.maxVisible / 2));
        const cardSpacing = Math.max(10, Math.round(this.options.cardWidth * (1 - this.options.overlap)));
        const stepDeg = maxOffset > 0 ? this.options.spreadDeg / maxOffset : 0;

        this.cardElements.forEach((el, i) => {
            const off = this.signedOffset(i, this.activeIndex);
            const abs = Math.abs(off);
            const visible = abs <= maxOffset;

            if (!visible) {
                el.style.opacity = '0';
                el.style.visibility = 'hidden';
                gsap.set(el, { opacity: 0, scale: 0.8 });
                return;
            }

            const rotateZ = off * stepDeg;
            const x = off * cardSpacing;
            const y = abs * 10;
            const z = -abs * this.options.depthPx;
            const isActive = off === 0;
            const scale = isActive ? this.options.activeScale : this.options.inactiveScale;
            const lift = isActive ? -this.options.activeLiftPx : 0;
            const rotateX = isActive ? 0 : this.options.tiltXDeg;
            const zIndex = 100 - abs;

            el.classList.toggle('is-active', isActive);

            const props = {
                visibility: 'visible',
                opacity: 1,
                x: x,
                xPercent: -50,
                y: y + lift,
                z: z,
                rotateZ: rotateZ,
                rotateX: rotateX,
                scale: scale,
                zIndex: zIndex,
                force3D: true,
                overwrite: true
            };

            if (immediate) {
                // Manual fallback for instant reliablity
                el.style.zIndex = zIndex;
                el.style.opacity = '1';
                el.style.visibility = 'visible';
                el.style.transform = `translate3d(${x}px, ${y + lift}px, ${z}px) rotateX(${rotateX}deg) rotateZ(${rotateZ}deg) scale(${scale}) translateX(-50%)`;

                // Sync GSAP so it knows where we are
                gsap.set(el, props);
            } else {
                gsap.to(el, {
                    ...props,
                    duration: 0.6,
                    ease: this.options.ease
                });
            }
        });
    }

    updateDots() {
        this.dots.forEach((dot, i) => {
            dot.classList.toggle('is-active', i === this.activeIndex);
        });
    }

    startAutoAdvance() {
        this.stopAutoAdvance();
        this.autoPlayTimer = setInterval(() => {
            this.setActive(this.activeIndex + 1);
        }, this.options.intervalMs);
    }

    stopAutoAdvance() {
        if (this.autoPlayTimer) {
            clearInterval(this.autoPlayTimer);
            this.autoPlayTimer = null;
        }
    }
}

// Auto-initialize with career paths
const initCardStack = () => {
    // Check if GSAP is loaded
    if (typeof gsap === 'undefined') {
        console.warn('GSAP not loaded yet, retrying...');
        setTimeout(initCardStack, 100);
        return;
    }

    const stackItems = [
        {
            title: "1. AI Resume Analysis",
            description: "Instant feedback on your resume with real-time score and ATS optimization tips.",
            imageSrc: "assets/images/card-1.png"
        },
        {
            title: "2. Master Interviews",
            description: "Practice with our role-specific AI interviewer and conquer your nerves with direct feedback.",
            imageSrc: "assets/images/card-2.png"
        },
        {
            title: "3. Skill Gap Identification",
            description: "We reveal what you're missing for your dream job and how to bridge that gap.",
            imageSrc: "assets/images/card-3.png"
        },
        {
            title: "4. Custom Learning Roadmap",
            description: "Tailored path of curated resources to help you level up where it matters most.",
            imageSrc: "assets/images/card-4.png"
        },
        {
            title: "5. Land Your Dream Job",
            description: "Final polish, tracking your progress, and getting hired with confidence.",
            imageSrc: "assets/images/card-5.png"
        }
    ];

    const container = document.getElementById('card-stack-container');
    if (container) {
        new CardStack({
            containerSelector: '#card-stack-container',
            items: stackItems,
            initialIndex: 2, // Start in the middle for visual symmetry
            autoAdvance: false, // User request: static start to see all cards
            intervalMs: 3500
        });
    }
};

// Start ASAP
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCardStack);
} else {
    initCardStack();
}
