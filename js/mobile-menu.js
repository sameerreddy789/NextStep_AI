/**
 * Mobile Menu Controller
 * Handles hamburger menu toggle and sidebar overlay
 */

function initMobileMenu() {
    // Create mobile menu elements if they don't exist
    if (!document.querySelector('.mobile-menu-toggle')) {
        const toggle = document.createElement('button');
        toggle.className = 'mobile-menu-toggle';
        toggle.setAttribute('aria-label', 'Toggle menu');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.innerHTML = `
            <div class="hamburger">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        document.body.appendChild(toggle);

        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.setAttribute('aria-hidden', 'true');
        document.body.appendChild(overlay);

        // Toggle menu
        toggle.addEventListener('click', toggleMobileMenu);
        overlay.addEventListener('click', closeMobileMenu);
    }
}

function toggleMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    const isOpen = sidebar.classList.contains('open');

    if (isOpen) {
        closeMobileMenu();
    } else {
        sidebar.classList.add('open');
        overlay.classList.add('active');
        toggle.classList.add('active');
        toggle.setAttribute('aria-expanded', 'true');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }
}

function closeMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    toggle.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

// Close menu when clicking sidebar links
document.addEventListener('click', function (e) {
    if (e.target.classList.contains('sidebar-link')) {
        closeMobileMenu();
    }
});

// Close menu on window resize to desktop
let resizeTimer;
window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
        if (window.innerWidth > 768) {
            closeMobileMenu();
        }
    }, 250);
});

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileMenu);
} else {
    initMobileMenu();
}

// Export for use
window.MobileMenu = {
    init: initMobileMenu,
    toggle: toggleMobileMenu,
    close: closeMobileMenu
};
