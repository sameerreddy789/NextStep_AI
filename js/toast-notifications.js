/**
 * Toast Notification System
 * Usage: showToast('Message', 'success|error|warning|info')
 */

class ToastManager {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        // Create toast container
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        this.container.setAttribute('aria-live', 'polite');
        this.container.setAttribute('aria-atomic', 'true');
        document.body.appendChild(this.container);

        // Add styles
        this.injectStyles();
    }

    injectStyles() {
        if (document.getElementById('toast-styles')) return;

        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            .toast-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 12px;
                pointer-events: none;
            }

            .toast {
                min-width: 300px;
                max-width: 400px;
                padding: 16px 20px;
                background: rgba(35, 41, 55, 0.98);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(10px);
                display: flex;
                align-items: center;
                gap: 12px;
                pointer-events: auto;
                animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .toast.removing {
                animation: slideOutRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .toast-icon {
                font-size: 20px;
                flex-shrink: 0;
            }

            .toast-content {
                flex: 1;
            }

            .toast-title {
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 4px;
                color: #ffffff;
            }

            .toast-message {
                font-size: 13px;
                color: rgba(255, 255, 255, 0.7);
                line-height: 1.4;
            }

            .toast-close {
                width: 24px;
                height: 24px;
                border-radius: 6px;
                background: rgba(255, 255, 255, 0.05);
                border: none;
                cursor: pointer;
                color: rgba(255, 255, 255, 0.5);
                font-size: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
                flex-shrink: 0;
            }

            .toast-close:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #ffffff;
            }

            .toast.success {
                border-left: 3px solid #10B981;
            }

            .toast.error {
                border-left: 3px solid #EF4444;
            }

            .toast.warning {
                border-left: 3px solid #F59E0B;
            }

            .toast.info {
                border-left: 3px solid #3B82F6;
            }

            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            @keyframes slideOutRight {
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }

            @media (max-width: 640px) {
                .toast-container {
                    left: 20px;
                    right: 20px;
                }

                .toast {
                    min-width: auto;
                    max-width: none;
                }
            }
        `;
        document.head.appendChild(style);
    }

    show(message, type = 'info', duration = 3000) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        const titles = {
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Info'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon">${icons[type]}</div>
            <div class="toast-content">
                <div class="toast-title">${titles[type]}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" aria-label="Close notification">×</button>
        `;

        this.container.appendChild(toast);

        // Close button
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.remove(toast));

        // Auto remove
        if (duration > 0) {
            setTimeout(() => this.remove(toast), duration);
        }

        return toast;
    }

    remove(toast) {
        toast.classList.add('removing');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
}

// Global instance
const toastManager = new ToastManager();

// Global helper function
window.showToast = (message, type = 'info', duration = 3000) => {
    return toastManager.show(message, type, duration);
};

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ToastManager, showToast: window.showToast };
}
