/**
 * Sidebar Navigation Component
 * Generates consistent sidebar across all pages
 */

const SIDEBAR_CONFIG = {
    logo: {
        icon: '🚀',
        text: 'CareerPilot',
        href: 'index.html'
    },
    mainNav: [
        { icon: '📊', text: 'Dashboard', href: 'dashboard.html' },
        { icon: '📄', text: 'Resume', href: 'resume.html' },
        { icon: '🎯', text: 'Skill Gap', href: 'skill-gap.html' },
        { icon: '🎤', text: 'Interview', href: 'interview.html' },
        { icon: '📈', text: 'Feedback', href: 'feedback.html' },
        { icon: '🗺️', text: 'Roadmap', href: 'roadmap.html' },
        { icon: '✅', text: 'Tracker', href: 'tracker.html' }
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
    const userData = JSON.parse(localStorage.getItem('careerPilot_user') || '{}');

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

// Add sidebar styles
function addSidebarStyles() {
    if (document.getElementById('sidebar-widget-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'sidebar-widget-styles';
    styles.textContent = `
        .user-info-widget {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .user-avatar-widget {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, var(--accent-green, #10b981), var(--accent-green-dark, #059669));
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 16px;
            color: white;
        }
        
        .user-name-widget {
            font-size: 14px;
            font-weight: 600;
        }
        
        .user-role-widget {
            font-size: 12px;
            color: var(--accent-green, #10b981);
        }
    `;
    document.head.appendChild(styles);
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    addSidebarStyles();
    generateSidebar();
});

// Export for use
window.SidebarComponent = {
    generate: generateSidebar,
    config: SIDEBAR_CONFIG
};
