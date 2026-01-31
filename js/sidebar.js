/**
 * Sidebar Navigation Component
 * Generates consistent sidebar across all pages
 */

const SIDEBAR_CONFIG = {
    logo: {
        icon: '🚀',
        text: 'NextStep AI',
        href: 'index.html'
    },
    mainNav: [
        { icon: '📊', text: 'Dashboard', href: 'dashboard.html' },
        { icon: '📄', text: 'Resume', href: 'resume.html' },
        { icon: '🎯', text: 'Skill Gap', href: 'skill-gap.html' },
        { icon: '🎤', text: 'Interview', href: 'interview.html' },
        { icon: '🗺️', text: 'Roadmap', href: 'roadmap.html' }
    ],
    accountNav: [
        { icon: '👤', text: 'My Profile', href: 'profile.html' }
    ]
};

function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
    return page;
}

function generateSidebar() {
    const currentPage = getCurrentPage();
    const userData = JSON.parse(localStorage.getItem('nextStep_user') || '{}');

    const userName = userData.name || 'User';
    const userInitial = userName.charAt(0).toUpperCase();
    const roleNames = {
        'sde': 'Software Developer',
        'frontend': 'Frontend Dev',
        'backend': 'Backend Dev',
        'fullstack': 'Full Stack Dev',
        'data-analyst': 'Data Analyst',
        'data-scientist': 'Data Scientist',
        'ml-engineer': 'ML Engineer',
        'devops': 'DevOps Engineer',
        'product': 'Product Manager',
        'designer': 'UI/UX Designer'
    };
    const userRole = roleNames[userData.targetRole] || 'Developer';

    const sidebarHTML = `
        <div class="sidebar-header">
            <a href="${SIDEBAR_CONFIG.logo.href}" class="nav-logo">
                <span class="nav-logo-icon">${SIDEBAR_CONFIG.logo.icon}</span>
                <span class="nav-logo-text">${SIDEBAR_CONFIG.logo.text}</span>
            </a>
        </div>
        <nav class="sidebar-nav">
            <div class="nav-section-title">Menu</div>
            ${SIDEBAR_CONFIG.mainNav.map(item => `
                <a href="${item.href}" class="sidebar-link ${currentPage === item.href ? 'active' : ''}">
                    <span class="sidebar-link-icon">${item.icon}</span>
                    ${item.text}
                </a>
            `).join('')}
            
            <div class="nav-section-title" style="margin-top: 24px;">Account</div>
            ${SIDEBAR_CONFIG.accountNav.map(item => `
                <a href="${item.href}" class="sidebar-link ${currentPage === item.href ? 'active' : ''}">
                    <span class="sidebar-link-icon">${item.icon}</span>
                    ${item.text}
                </a>
            `).join('')}
            <a href="#" onclick="if(typeof logout === 'function') logout(); return false;" class="sidebar-link">
                <span class="sidebar-link-icon">🚪</span>
                Logout
            </a>
        </nav>
        <div class="sidebar-footer">
            <div class="user-info-widget">
                <div class="user-avatar-widget">${userInitial}</div>
                <div class="user-details-widget">
                    <div class="user-name-widget">${userName}</div>
                    <div class="user-role-widget">${userRole}</div>
                </div>
            </div>
        </div>
    `;

    // Find or create sidebar element
    let sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.innerHTML = sidebarHTML;
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    generateSidebar();
});

// Export for use
window.SidebarComponent = {
    generate: generateSidebar,
    config: SIDEBAR_CONFIG
};
