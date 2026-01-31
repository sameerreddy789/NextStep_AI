/**
 * Magic Bento Effects - Vanilla JS
 * Adds spotlight, border glow, particles, and click ripple effects
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
            ...options
        };

        this.spotlight = null;
        this.particles = new Map();
        this.isMouseInSection = false;

        this.init();
    }

    init() {
        if (this.options.enableSpotlight) {
            this.createSpotlight();
        }
        this.setupEventListeners();
    }

    createSpotlight() {
        this.spotlight = document.createElement('div');
        this.spotlight.className = 'magic-spotlight';
        document.body.appendChild(this.spotlight);
    }

    setupEventListeners() {
        // Global mouse move for spotlight and border glow
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));

        // Card-specific events
        document.querySelectorAll(this.options.cardSelector).forEach(card => {
            card.addEventListener('mouseenter', (e) => this.handleCardEnter(e, card));
            card.addEventListener('mouseleave', (e) => this.handleCardLeave(e, card));

            if (this.options.enableClickRipple) {
                card.addEventListener('click', (e) => this.handleCardClick(e, card));
            }
        });
    }

    handleMouseMove(e) {
        const cards = document.querySelectorAll(this.options.cardSelector);
        let minDistance = Infinity;
        let isNearCard = false;

        cards.forEach(card => {
            const rect = card.getBoundingClientRect();

            // Check if mouse is inside or near the card
            const isInside = (
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom
            );

            if (isInside && this.options.enableBorderGlow) {
                // Update border glow position
                const relativeX = ((e.clientX - rect.left) / rect.width) * 100;
                const relativeY = ((e.clientY - rect.top) / rect.height) * 100;

                card.style.setProperty('--glow-x', `${relativeX}%`);
                card.style.setProperty('--glow-y', `${relativeY}%`);
                card.style.setProperty('--glow-intensity', '1');
                card.style.setProperty('--glow-radius', `${this.options.spotlightRadius}px`);
            }

            // Calculate distance to card center for spotlight
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const distance = Math.hypot(e.clientX - centerX, e.clientY - centerY);
            const effectiveDistance = Math.max(0, distance - Math.max(rect.width, rect.height) / 2);

            if (effectiveDistance < this.options.spotlightRadius) {
                isNearCard = true;
                minDistance = Math.min(minDistance, effectiveDistance);
            }
        });

        // Update spotlight
        if (this.spotlight && this.options.enableSpotlight) {
            this.spotlight.style.left = `${e.clientX}px`;
            this.spotlight.style.top = `${e.clientY}px`;

            if (isNearCard) {
                const intensity = 1 - (minDistance / this.options.spotlightRadius);
                this.spotlight.style.opacity = Math.max(0, intensity * 0.8);
            } else {
                this.spotlight.style.opacity = '0';
            }
        }
    }

    handleCardEnter(e, card) {
        if (!this.options.enableParticles) return;

        // Create particles
        const rect = card.getBoundingClientRect();
        const particleElements = [];

        for (let i = 0; i < this.options.particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'magic-particle';
            particle.style.left = `${Math.random() * rect.width}px`;
            particle.style.top = `${Math.random() * rect.height}px`;
            particle.style.opacity = '0';
            particle.style.transform = 'scale(0)';

            card.appendChild(particle);
            particleElements.push(particle);

            // Animate particle appearance
            setTimeout(() => {
                particle.style.transition = 'all 0.3s ease-out';
                particle.style.opacity = '0.6';
                particle.style.transform = 'scale(1)';

                // Float animation
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

            // Keep within bounds
            particle.style.left = `${Math.max(0, Math.min(maxX, newLeft))}px`;
            particle.style.top = `${Math.max(0, Math.min(maxY, newTop))}px`;
            particle.style.opacity = `${0.3 + Math.random() * 0.4}`;

            particle._animationTimeout = setTimeout(animate, 500 + Math.random() * 500);
        };

        animate();
    }

    handleCardLeave(e, card) {
        // Reset border glow
        card.style.setProperty('--glow-intensity', '0');

        // Remove particles
        const particleElements = this.particles.get(card);
        if (particleElements) {
            particleElements.forEach(particle => {
                clearTimeout(particle._animationTimeout);
                particle.style.transition = 'all 0.3s ease-in';
                particle.style.opacity = '0';
                particle.style.transform = 'scale(0)';

                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.parentNode.removeChild(particle);
                    }
                }, 300);
            });
            this.particles.delete(card);
        }
    }

    handleCardClick(e, card) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Calculate ripple size
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
            background: radial-gradient(circle, 
                rgba(${this.options.glowColor}, 0.4) 0%, 
                rgba(${this.options.glowColor}, 0.2) 30%, 
                transparent 70%);
            transform: scale(0);
            opacity: 1;
            transition: transform 0.6s ease-out, opacity 0.6s ease-out;
        `;

        card.appendChild(ripple);

        // Trigger animation
        requestAnimationFrame(() => {
            ripple.style.transform = 'scale(1)';
            ripple.style.opacity = '0';
        });

        // Remove after animation
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 600);
    }

    destroy() {
        if (this.spotlight && this.spotlight.parentNode) {
            this.spotlight.parentNode.removeChild(this.spotlight);
        }
        this.particles.forEach((particleElements, card) => {
            particleElements.forEach(p => {
                if (p.parentNode) p.parentNode.removeChild(p);
            });
        });
        this.particles.clear();
    }
}

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Apply magic effect to various elements
    const magicSelectors = [
        '.stepper-box',
        '.step-panel',
        '.orbital-node .node-card',
        '.hero-cta .btn'
    ];

    // Add magic-card class to target elements
    magicSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            el.classList.add('magic-card');
        });
    });

    // Initialize magic effects
    new MagicBento({
        glowColor: '99, 102, 241',  // Purple matching theme
        spotlightRadius: 400,
        particleCount: 6,
        enableSpotlight: true,
        enableBorderGlow: true,
        enableParticles: true,
        enableClickRipple: true
    });
});
