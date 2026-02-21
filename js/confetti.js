/**
 * Confetti Animation Library
 * Lightweight canvas-based confetti for celebrations
 */

class ConfettiCelebration {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.animationId = null;
    }

    create(options = {}) {
        const defaults = {
            particleCount: 150,
            duration: 3000,
            colors: ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'],
            spread: 360,
            startVelocity: 45,
            decay: 0.9,
            gravity: 1.2
        };

        const config = { ...defaults, ...options };

        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '9999';
        document.body.appendChild(this.canvas);

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx = this.canvas.getContext('2d');

        // Create particles
        this.particles = [];
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        for (let i = 0; i < config.particleCount; i++) {
            const angle = (Math.random() * config.spread) * (Math.PI / 180);
            const velocity = (Math.random() * config.startVelocity) + (config.startVelocity / 2);

            this.particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity - Math.random() * 10,
                color: config.colors[Math.floor(Math.random() * config.colors.length)],
                size: Math.random() * 8 + 4,
                rotation: Math.random() * 360,
                rotationSpeed: Math.random() * 10 - 5,
                decay: config.decay,
                gravity: config.gravity,
                opacity: 1
            });
        }

        // Animate
        this.animate(config.duration);
    }

    animate(duration) {
        const startTime = Date.now();

        const frame = () => {
            const elapsed = Date.now() - startTime;

            if (elapsed > duration) {
                this.destroy();
                return;
            }

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            this.particles.forEach((p, index) => {
                // Update position
                p.vy += p.gravity;
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= p.decay;
                p.vy *= p.decay;
                p.rotation += p.rotationSpeed;

                // Fade out towards end
                const fadeStart = duration * 0.7;
                if (elapsed > fadeStart) {
                    p.opacity = 1 - ((elapsed - fadeStart) / (duration - fadeStart));
                }

                // Draw particle
                this.ctx.save();
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate(p.rotation * Math.PI / 180);
                this.ctx.globalAlpha = p.opacity;
                this.ctx.fillStyle = p.color;
                this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                this.ctx.restore();

                // Remove off-screen particles
                if (p.y > this.canvas.height + 100 || p.opacity <= 0) {
                    this.particles.splice(index, 1);
                }
            });

            this.animationId = requestAnimationFrame(frame);
        };

        frame();
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        this.particles = [];
    }
}

// Global confetti function for easy use
function launchConfetti(options) {
    const confetti = new ConfettiCelebration();
    confetti.create(options);
}

// Preset celebrations
function celebrateSuccess() {
    launchConfetti({
        particleCount: 150,
        spread: 120,
        startVelocity: 45
    });
}

function celebrateRoadmapComplete() {
    // Multiple bursts
    launchConfetti({ particleCount: 100, spread: 100 });
    setTimeout(() => launchConfetti({ particleCount: 80, spread: 120 }), 250);
    setTimeout(() => launchConfetti({ particleCount: 60, spread: 140 }), 500);
}

function launchInterviewConfetti() {
    launchConfetti({
        particleCount: 200,
        spread: 360,
        startVelocity: 50,
        duration: 4000
    });
}
