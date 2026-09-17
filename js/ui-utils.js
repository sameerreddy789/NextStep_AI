// @ts-check
/**
 * UI Utilities & Components
 * Standardized loading states, toasts, and dialogs using the Design System.
 */

/**
 * Escapes HTML special characters to prevent XSS
 * @param {string} str - Untrusted string to escape
 * @returns {string} Escaped safe string
 */
export function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Shows a full-screen loading overlay with spinner and optional message
 * @param {string} message - Loading message to display
 */
export function showLoader(message = 'Loading...') {
    hideLoader();

    const loader = document.createElement('div');
    loader.id = 'global-loader';
    loader.className = 'loader-overlay';
    loader.innerHTML = `
        <div class="loader-content">
            <div class="loader-spinner"></div>
            <p class="loader-message">${escapeHTML(message)}</p>
        </div>
    `;
    document.body.appendChild(loader);
    document.body.style.overflow = 'hidden';
}

/**
 * Hides the loading overlay
 */
export function hideLoader() {
    const loader = document.getElementById('global-loader') || document.querySelector('.loader-overlay');
    if (loader) {
        loader.remove();
        document.body.style.overflow = '';
    }
}

/**
 * Shows a toast notification
 * @param {string} message - Message to display
 * @param {'success'|'error'|'warning'|'info'} type - Type of toast
 * @param {number} duration - Duration in milliseconds
 */
export function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };

    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${escapeHTML(message)}</span>
    `;

    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Shows a confirmation dialog with Claymorphism style
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @param {Function} [onConfirm] - Callback for confirm
 * @param {Function} [onCancel] - Callback for cancel
 * @param {Object} [options] - Options
 */
export function showConfirmDialog(title, message, onConfirm, onCancel, options = {}) {
    const { confirmText = 'Confirm', cancelText = 'Cancel', danger = false, icon = '❓' } = options;

    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    overlay.innerHTML = `
        <div class="dialog-content clay-card">
            <div class="dialog-header" style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                <span style="font-size: 24px;">${icon}</span>
                <h3 class="dialog-title" style="margin: 0;">${escapeHTML(title)}</h3>
            </div>
            <p class="dialog-message" style="margin-bottom: 24px; color: var(--text-secondary);">${escapeHTML(message)}</p>
            <div class="dialog-actions" style="display: flex; justify-content: flex-end; gap: 12px;">
                <button class="btn btn-secondary" data-action="cancel">${escapeHTML(cancelText)}</button>
                <button class="btn ${danger ? 'btn-red' : 'btn-primary'}" data-action="confirm">${escapeHTML(confirmText)}</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    const close = (cb) => {
        overlay.remove();
        document.body.style.overflow = '';
        if (cb) cb();
    };

    overlay.querySelector('[data-action="confirm"]').addEventListener('click', () => close(onConfirm));
    overlay.querySelector('[data-action="cancel"]').addEventListener('click', () => close(onCancel));
    overlay.addEventListener('click', (e) => e.target === overlay && close(onCancel));
}

/**
 * Initializes global keyboard shortcuts
 * @param {Object} shortcuts - { 'ctrl+enter': callback }
 */
export function initKeyboardShortcuts(shortcuts = {}) {
    document.addEventListener('keydown', (e) => {
        if (e.target instanceof HTMLElement && e.target.matches('input, textarea, select, [contenteditable]')) return;

        const keys = [];
        if (e.ctrlKey) keys.push('ctrl');
        if (e.shiftKey) keys.push('shift');
        if (e.altKey) keys.push('alt');
        keys.push(e.key.toLowerCase());

        const combo = keys.join('+');
        if (shortcuts[combo]) {
            e.preventDefault();
            shortcuts[combo]();
        }
    });
}

/**
 * DOM Helper Utilities
 */
export function setElText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = String(text);
}

export function setElAttr(id, attr, value) {
    const el = document.getElementById(id);
    if (el) el[attr] = value;
}

// Attach to window for legacy support and HTML event handlers
const UIUtils = {
    escapeHTML,
    showLoader,
    hideLoader,
    showToast,
    showConfirmDialog,
    initKeyboardShortcuts,
    setElText,
    setElAttr
};

// @ts-ignore
window.UIUtils = UIUtils;
// @ts-ignore
window.showToast = showToast;
// @ts-ignore
window.showLoader = showLoader;
// @ts-ignore
window.hideLoader = hideLoader;
// @ts-ignore
window.escapeHTML = escapeHTML;
// @ts-ignore
window.showConfirmDialog = showConfirmDialog;

export { UIUtils };
export default UIUtils;
