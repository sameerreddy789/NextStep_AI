/**
 * Click Spark Effect - Vanilla JS
 * Creates spark animation on click anywhere on the page
 */

class ClickSpark {
    constructor(options = {}) {
        this.options = {
            sparkColor: options.sparkColor || '#fff',
            sparkSize: options.sparkSize || 10,
            sparkRadius: options.sparkRadius || 15,
            sparkCount: options.sparkCount || 8,
            duration: options.duration || 400,
            easing: options.easing || 'ease-out',
            extraScale: options.extraScale || 1.0,
            ...options
        };

        this.canvas = null;
        this.ctx = null;
        this.sparks = [];
        this.animationId = null;

        this.init();
    }

    init() {
        this.createCanvas();
        this.setupEventListeners();
        this.startAnimation();
    }

    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'click-spark-canvas';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
        `;
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.resizeCanvas());
        document.addEventListener('click', (e) => this.handleClick(e));
    }

    easeFunc(t) {
        switch (this.options.easing) {
            case 'linear':
                return t;
            case 'ease-in':
                return t * t;
            case 'ease-in-out':
                return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            default: // ease-out
                return t * (2 - t);
        }
    }

    handleClick(e) {
        const x = e.clientX;
        const y = e.clientY;
        const now = performance.now();

        // Create sparks in all directions
        for (let i = 0; i < this.options.sparkCount; i++) {
            this.sparks.push({
                x,
                y,
                angle: (2 * Math.PI * i) / this.options.sparkCount,
                startTime: now
            });
        }
    }

    startAnimation() {
        const draw = (timestamp) => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            this.sparks = this.sparks.filter(spark => {
                const elapsed = timestamp - spark.startTime;
                if (elapsed >= this.options.duration) {
                    return false;
                }

                const progress = elapsed / this.options.duration;
                const eased = this.easeFunc(progress);

                const distance = eased * this.options.sparkRadius * this.options.extraScale;
                const lineLength = this.options.sparkSize * (1 - eased);

                const x1 = spark.x + distance * Math.cos(spark.angle);
                const y1 = spark.y + distance * Math.sin(spark.angle);
                const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
                const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);

                this.ctx.strokeStyle = this.options.sparkColor;
                this.ctx.lineWidth = 2;
                this.ctx.lineCap = 'round';
                this.ctx.beginPath();
                this.ctx.moveTo(x1, y1);
                this.ctx.lineTo(x2, y2);
                this.ctx.stroke();

                return true;
            });

            this.animationId = requestAnimationFrame(draw);
        };

        this.animationId = requestAnimationFrame(draw);
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    new ClickSpark({
        sparkColor: '#a78bfa',  // Purple color matching the theme
        sparkSize: 12,
        sparkRadius: 25,
        sparkCount: 8,
        duration: 400,
        extraScale: 1.2
    });
});
