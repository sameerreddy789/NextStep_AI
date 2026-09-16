/**
 * Magic Bento Effects - Vanilla JS
 * Optimized for performance: throttled mousemove and scoped interactions.
 */

class MagicBento {
    constructor(options = {}) {
        this.options = {
            glowColor: options.glowColor || '132, 0, 255',
            spotlightRadius: options.spotlightRadius || 400,
            particleCount: options.particleCount || 8,
            enableSpotlight: options.enableSpotlight !== false,
            enableBorderGlow: options.enableBorderGlow !== false,
            enableParticles: options.enableParticles !== false,
            enableClickRipple: options.enableClickRipple !== false,
            cardSelector: options.cardSelector || '.magic-card',
            throttleMs: options.throttleMs || 16, // ~60fps
            ...options
        };

        this.spotlight = null;
        this.particles = new Map();
        this.cards = [];
        this.lastMove = 0;

        this.init();
    }

    init() {
        if (this.options.enableSpotlight) this.createSpotlight();
        this.cacheCards();
        this.setupEventListeners();
    }

    cacheCards() {
        this.cards = Array.from(document.querySelectorAll(this.options.cardSelector));
    }

    createSpotlight() {
        this.spotlight = document.createElement('div');
        this.spotlight.className = 'magic-spotlight';
        this.spotlight.style.willChange = 'transform, opacity';
        document.body.appendChild(this.spotlight);
    }

    setupEventListeners() {
        // Throttled mousemove
        document.addEventListener('mousemove', (e) => {
            const now = performance.now();
            if (now - this.lastMove >= this.options.throttleMs) {
                this.handleMouseMove(e);
                this.lastMove = now;
            }
        }, { passive: true });

        // Scoped card events
        this.cards.forEach(card => {
            card.addEventListener('mouseenter', (e) => this.handleCardEnter(e, card), { passive: true });
            card.addEventListener('mouseleave', (e) => this.handleCardLeave(e, card), { passive: true });

            if (this.options.enableClickRipple) {
                card.addEventListener('click', (e) => this.handleCardClick(e, card), { passive: true });
            }
        });
    }

    handleMouseMove(e) {
        let minDistance = Infinity;
        let isNearAnyCard = false;
        const { clientX, clientY } = e;

        this.cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            
            // Fast check: is mouse anywhere near this card?
            const buffer = this.options.spotlightRadius;
            if (clientX < rect.left - buffer || clientX > rect.right + buffer || 
                clientY < rect.top - buffer || clientY > rect.bottom + buffer) {
                return;
            }

            const isInside = (
                clientX >= rect.left && clientX <= rect.right &&
                clientY >= rect.top && clientY <= rect.bottom
            );

            if (isInside && this.options.enableBorderGlow) {
                const relativeX = ((clientX - rect.left) / rect.width) * 100;
                const relativeY = ((clientY - rect.top) / rect.height) * 100;
                card.style.setProperty('--glow-x', `${relativeX}%`);
                card.style.setProperty('--glow-y', `${relativeY}%`);
                card.style.setProperty('--glow-intensity', '1');
            }

            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const distance = Math.hypot(clientX - centerX, clientY - centerY);
            const effectiveDistance = Math.max(0, distance - Math.max(rect.width, rect.height) / 2);

            if (effectiveDistance < this.options.spotlightRadius) {
                isNearAnyCard = true;
                minDistance = Math.min(minDistance, effectiveDistance);
            }
        });

        if (this.spotlight && this.options.enableSpotlight) {
            // Use transform for better performance than top/left
            this.spotlight.style.transform = `translate3d(${clientX}px, ${clientY}px, 0)`;

            if (isNearAnyCard) {
                const intensity = 1 - (minDistance / this.options.spotlightRadius);
                this.spotlight.style.opacity = Math.max(0, intensity * 0.8);
            } else {
                this.spotlight.style.opacity = '0';
            }
        }
    }

    handleCardEnter(e, card) {
        if (!this.options.enableParticles) return;

        const rect = card.getBoundingClientRect();
        const particleElements = [];

        for (let i = 0; i < this.options.particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'magic-particle';
            particle.style.left = `${Math.random() * rect.width}px`;
            particle.style.top = `${Math.random() * rect.height}px`;
            particle.style.willChange = 'transform, opacity';
            
            card.appendChild(particle);
            particleElements.push(particle);

            setTimeout(() => {
                particle.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
                particle.style.opacity = '0.6';
                particle.style.transform = 'scale(1)';
                this.animateParticle(particle, rect.width, rect.height);
            }, i * 50);
        }

        this.particles.set(card, particleElements);
    }

    animateParticle(particle, maxX, maxY) {
        const animate = () => {
            if (!particle.parentNode) return;

            const currentLeft = parseFloat(particle.style.left) || 0;
            const currentTop = parseFloat(particle.style.top) || 0;

            const newLeft = currentLeft + (Math.random() - 0.5) * 20;
            const newTop = currentTop + (Math.random() - 0.5) * 20;

            particle.style.left = `${Math.max(0, Math.min(maxX, newLeft))}px`;
            particle.style.top = `${Math.max(0, Math.min(maxY, newTop))}px`;
            particle.style.opacity = `${0.3 + Math.random() * 0.4}`;

            particle._animationTimeout = setTimeout(animate, 600 + Math.random() * 600);
        };
        animate();
    }

    handleCardLeave(e, card) {
        card.style.setProperty('--glow-intensity', '0');
        const particleElements = this.particles.get(card);
        if (particleElements) {
            particleElements.forEach(particle => {
                clearTimeout(particle._animationTimeout);
                particle.style.opacity = '0';
                particle.style.transform = 'scale(0)';
                setTimeout(() => { if (particle.parentNode) particle.parentNode.removeChild(particle); }, 300);
            });
            this.particles.delete(card);
        }
    }

    handleCardClick(e, card) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const maxDistance = Math.max(
            Math.hypot(x, y),
            Math.hypot(x - rect.width, y),
            Math.hypot(x, y - rect.height),
            Math.hypot(x - rect.width, y - rect.height)
        );

        const ripple = document.createElement('div');
        ripple.className = 'magic-ripple';
        ripple.style.cssText = `
            width: ${maxDistance * 2}px;
            height: ${maxDistance * 2}px;
            left: ${x - maxDistance}px;
            top: ${y - maxDistance}px;
            background: radial-gradient(circle, rgba(${this.options.glowColor}, 0.4) 0%, transparent 70%);
            transform: translate3d(0,0,0) scale(0);
            opacity: 1;
            will-change: transform, opacity;
            transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ease-out;
        `;

        card.appendChild(ripple);
        requestAnimationFrame(() => {
            ripple.style.transform = 'scale(1)';
            ripple.style.opacity = '0';
        });

        setTimeout(() => { if (ripple.parentNode) ripple.parentNode.removeChild(ripple); }, 650);
    }

    destroy() {
        if (this.spotlight?.parentNode) this.spotlight.parentNode.removeChild(this.spotlight);
        this.particles.forEach(elems => elems.forEach(p => p.parentNode?.removeChild(p)));
        this.particles.clear();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const magicSelectors = ['.stepper-box', '.step-panel', '.orbital-node .node-card', '.hero-cta .btn'];
    magicSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => el.classList.add('magic-card'));
    });

    new MagicBento({
        glowColor: '99, 102, 241',
        spotlightRadius: 400,
        particleCount: 6,
        enableSpotlight: true,
        enableBorderGlow: true,
        enableParticles: true,
        enableClickRipple: true
    });
});
