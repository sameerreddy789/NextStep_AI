// ===== Loading States & UI Utilities =====

/**
 * Shows a full-screen loading overlay with spinner and optional message
 * @param {string} message - Loading message to display
 */
function showLoader(message = 'Loading...') {
    // Remove existing loader if any
    hideLoader();

    const loader = document.createElement('div');
    loader.className = 'loader-overlay';
    loader.innerHTML = `
        <div class="loader-content">
            <div class="loader-spinner"></div>
            <p class="loader-message">${message}</p>
        </div>
    `;
    document.body.appendChild(loader);

    // Prevent body scroll while loading
    document.body.style.overflow = 'hidden';
}

/**
 * Hides the loading overlay
 */
function hideLoader() {
    const loader = document.querySelector('.loader-overlay');
    if (loader) {
        loader.remove();
        document.body.style.overflow = '';
    }
}

/**
 * Shows a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of toast: 'success', 'error', 'info', 'warning'
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    // Icon based on type
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };

    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${message}</span>
    `;

    // Create toast container if it doesn't exist
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 100);

    // Auto-remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Shows inline loading spinner for specific elements
 * @param {HTMLElement} element - Element to show spinner in
 * @param {string} size - Size: 'small', 'medium', 'large'
 */
function showInlineLoader(element, size = 'medium') {
    if (!element) return;

    const spinner = document.createElement('div');
    spinner.className = `inline-spinner inline-spinner-${size}`;
    spinner.innerHTML = '<div class="spinner"></div>';

    // Store original content
    element.dataset.originalContent = element.innerHTML;
    element.innerHTML = '';
    element.appendChild(spinner);
    element.classList.add('loading');
}

/**
 * Hides inline loading spinner and restores original content
 * @param {HTMLElement} element - Element to hide spinner from
 */
function hideInlineLoader(element) {
    if (!element) return;

    const originalContent = element.dataset.originalContent;
    if (originalContent) {
        element.innerHTML = originalContent;
        delete element.dataset.originalContent;
    }
    element.classList.remove('loading');
}

/**
 * Creates a skeleton loader for content placeholders
 * @param {string} type - Type: 'text', 'card', 'avatar', 'image'
 * @param {number} count - Number of skeleton items
 * @returns {string} HTML string for skeleton
 */
function createSkeleton(type = 'text', count = 1) {
    const skeletons = {
        text: '<div class="skeleton skeleton-text"></div>',
        card: `
            <div class="skeleton skeleton-card">
                <div class="skeleton skeleton-image"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text" style="width: 60%;"></div>
            </div>
        `,
        avatar: '<div class="skeleton skeleton-avatar"></div>',
        image: '<div class="skeleton skeleton-image"></div>'
    };

    return (skeletons[type] || skeletons.text).repeat(count);
}

/**
 * Shows a confirmation dialog
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @param {Function} onConfirm - Callback for confirm button
 * @param {Function} onCancel - Callback for cancel button
 * @param {Object} options - Additional options (confirmText, cancelText, danger)
 */
function showConfirmDialog(title, message, onConfirm, onCancel, options = {}) {
    const { confirmText = 'Confirm', cancelText = 'Cancel', danger = false } = options;

    const dialog = document.createElement('div');
    dialog.className = 'dialog-overlay';
    dialog.innerHTML = `
        <div class="dialog-content">
            <h3 class="dialog-title">${title}</h3>
            <p class="dialog-message">${message}</p>
            <div class="dialog-actions">
                <button class="btn btn-secondary" data-action="cancel">${cancelText}</button>
                <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-action="confirm">${confirmText}</button>
            </div>
        </div>
    `;

    document.body.appendChild(dialog);
    document.body.style.overflow = 'hidden';

    // Handle button clicks
    dialog.querySelector('[data-action="confirm"]').addEventListener('click', () => {
        dialog.remove();
        document.body.style.overflow = '';
        if (onConfirm) onConfirm();
    });

    dialog.querySelector('[data-action="cancel"]').addEventListener('click', () => {
        dialog.remove();
        document.body.style.overflow = '';
        if (onCancel) onCancel();
    });

    // Close on overlay click or Escape key
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            dialog.remove();
            document.body.style.overflow = '';
            if (onCancel) onCancel();
        }
    });

    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            dialog.remove();
            document.body.style.overflow = '';
            if (onCancel) onCancel();
            document.removeEventListener('keydown', escHandler);
        }
    });
}

/**
 * Updates a progress bar
 * @param {HTMLElement} progressBar - Progress bar element
 * @param {number} percentage - Progress percentage (0-100)
 */
function updateProgress(progressBar, percentage) {
    if (!progressBar) return;

    const fill = progressBar.querySelector('.progress-fill');
    if (fill) {
        fill.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
    }

    const text = progressBar.querySelector('.progress-text');
    if (text) {
        text.textContent = `${Math.round(percentage)}%`;
    }
}

/**
 * Creates an empty state component
 * @param {Object} config - Configuration object
 * @returns {string} HTML string for empty state
 */
function createEmptyState(config) {
    const {
        icon = '📭',
        title = 'Nothing here yet',
        description = 'Get started by taking an action.',
        actions = [],
        variant = '', // 'compact', 'success', 'warning', 'info'
    } = config;

    const actionsHtml = actions.map(action =>
        `<a href="${action.href || '#'}" class="btn ${action.primary ? 'btn-primary' : 'btn-secondary'}" ${action.onclick ? `onclick="${action.onclick}"` : ''}>${action.label}</a>`
    ).join('');

    return `
        <div class="empty-state ${variant}">
            <div class="empty-state-icon">${icon}</div>
            <h3 class="empty-state-title">${title}</h3>
            <p class="empty-state-description">${description}</p>
            ${actionsHtml ? `<div class="empty-state-actions">${actionsHtml}</div>` : ''}
        </div>
    `;
}

/**
 * Initializes global keyboard shortcuts
 * @param {Object} shortcuts - Map of key combinations to callbacks
 */
function initKeyboardShortcuts(shortcuts = {}) {
    document.addEventListener('keydown', (e) => {
        // Skip if user is typing in an input
        if (e.target.matches('input, textarea, select, [contenteditable]')) return;

        const key = [];
        if (e.ctrlKey) key.push('ctrl');
        if (e.shiftKey) key.push('shift');
        if (e.altKey) key.push('alt');
        key.push(e.key.toLowerCase());

        const combo = key.join('+');

        if (shortcuts[combo]) {
            e.preventDefault();
            shortcuts[combo]();
        }
    });
}

// Export functions for use in other modules
if (typeof window !== 'undefined') {
    window.UIUtils = {
        showLoader,
        hideLoader,
        showToast,
        showInlineLoader,
        hideInlineLoader,
        createSkeleton,
        showConfirmDialog,
        updateProgress,
        createEmptyState,
        initKeyboardShortcuts
    };
}

