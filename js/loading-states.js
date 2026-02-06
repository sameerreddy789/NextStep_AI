/**
 * Loading States System
 * Usage: 
 * - showLoader() / hideLoader() for full page overlay
 * - createSkeleton(element) for skeleton screens
 */

class LoadingManager {
    constructor() {
        this.overlay = null;
        this.init();
    }

    init() {
        this.injectStyles();
    }

    injectStyles() {
        if (document.getElementById('loading-styles')) return;

        const style = document.createElement('style');
        style.id = 'loading-styles';
        style.textContent = `
            /* Full Page Loader */
            .loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(15, 20, 25, 0.95);
                backdrop-filter: blur(4px);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 99999;
                animation: fadeIn 0.2s ease;
            }

            .loading-overlay.hiding {
                animation: fadeOut 0.2s ease;
            }

            .loader-spinner {
                width: 48px;
                height: 48px;
                border: 4px solid rgba(59, 130, 246, 0.1);
                border-top-color: #3B82F6;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
            }

            .loader-text {
                margin-top: 20px;
                color: rgba(255, 255, 255, 0.7);
                font-size: 14px;
                font-weight: 500;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes fadeOut {
                to { opacity: 0; }
            }

            /* Skeleton Loader */
            .skeleton {
                background: linear-gradient(
                    90deg,
                    rgba(255, 255, 255, 0.03) 25%,
                    rgba(255, 255, 255, 0.08) 50%,
                    rgba(255, 255, 255, 0.03) 75%
                );
                background-size: 200% 100%;
                animation: shimmer 1.5s infinite;
                border-radius: 8px;
            }

            .skeleton-text {
                height: 16px;
                margin-bottom: 8px;
                border-radius: 4px;
            }

            .skeleton-title {
                height: 24px;
                width: 60%;
                margin-bottom: 12px;
                border-radius: 6px;
            }

            .skeleton-card {
                height: 120px;
                border-radius: 12px;
            }

            .skeleton-circle {
                border-radius: 50%;
            }

            @keyframes shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }

            /* Mini Spinner (for buttons) */
            .btn-spinner {
                display: inline-block;
                width: 16px;
                height: 16px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-top-color: #ffffff;
                border-radius: 50%;
                animation: spin 0.6s linear infinite;
                margin-right: 8px;
            }

            /* Loading State for Cards */
            .card-loading {
                position: relative;
                overflow: hidden;
                pointer-events: none;
                opacity: 0.6;
            }

            .card-loading::after {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(
                    90deg,
                    transparent,
                    rgba(255, 255, 255, 0.1),
                    transparent
                );
                animation: cardShimmer 1.5s infinite;
            }

            @keyframes cardShimmer {
                to { left: 100%; }
            }
        `;
        document.head.appendChild(style);
    }

    show(text = 'Loading...') {
        if (this.overlay) return;

        this.overlay = document.createElement('div');
        this.overlay.className = 'loading-overlay';
        this.overlay.setAttribute('role', 'status');
        this.overlay.setAttribute('aria-live', 'polite');
        this.overlay.innerHTML = `
            <div class="loader-spinner" aria-hidden="true"></div>
            <div class="loader-text">${text}</div>
        `;

        document.body.appendChild(this.overlay);
        document.body.style.overflow = 'hidden';
    }

    hide() {
        if (!this.overlay) return;

        this.overlay.classList.add('hiding');
        setTimeout(() => {
            if (this.overlay && this.overlay.parentNode) {
                this.overlay.parentNode.removeChild(this.overlay);
                this.overlay = null;
                document.body.style.overflow = '';
            }
        }, 200);
    }

    createSkeleton(type = 'text') {
        const skeleton = document.createElement('div');
        skeleton.className = `skeleton skeleton-${type}`;
        return skeleton;
    }
}

// Global instance
const loadingManager = new LoadingManager();

// Global helper functions
window.showLoader = (text) => loadingManager.show(text);
window.hideLoader = () => loadingManager.hide();
window.createSkeleton = (type) => loadingManager.createSkeleton(type);

// Helper for button loading state
window.setButtonLoading = (button, loading) => {
    if (loading) {
        button.disabled = true;
        button.dataset.originalText = button.innerHTML;
        button.innerHTML = `<span class="btn-spinner"></span>${button.dataset.loadingText || 'Loading...'}`;
    } else {
        button.disabled = false;
        button.innerHTML = button.dataset.originalText || button.innerHTML;
    }
};

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LoadingManager, showLoader: window.showLoader, hideLoader: window.hideLoader };
}
