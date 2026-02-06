/**
 * Number Counter Animation
 * Animates numbers from 0 to target value
 * Usage: animateNumber(element, targetValue, duration)
 */

function animateNumber(element, targetValue, duration = 1000, suffix = '') {
    const startValue = 0;
    const startTime = performance.now();

    // Parse target value (remove % or other suffixes)
    const numericTarget = parseFloat(targetValue);

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (ease-out cubic)
        const easeOut = 1 - Math.pow(1 - progress, 3);

        const currentValue = startValue + (numericTarget - startValue) * easeOut;

        // Format the number
        if (Number.isInteger(numericTarget)) {
            element.textContent = Math.round(currentValue) + suffix;
        } else {
            element.textContent = currentValue.toFixed(1) + suffix;
        }

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = targetValue; // Ensure final value is exact
        }
    }

    requestAnimationFrame(update);
}

// Auto-animate on scroll into view
function setupCounterAnimations() {
    const counters = document.querySelectorAll('[data-counter]');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.dataset.animated) {
                const target = entry.target.dataset.counter;
                const suffix = entry.target.dataset.suffix || '';
                const duration = parseInt(entry.target.dataset.duration) || 1500;

                animateNumber(entry.target, target, duration, suffix);
                entry.target.dataset.animated = 'true';
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupCounterAnimations);
} else {
    setupCounterAnimations();
}

// Export
window.animateNumber = animateNumber;
window.setupCounterAnimations = setupCounterAnimations;
