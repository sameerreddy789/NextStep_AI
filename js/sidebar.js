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
        </nav>
        <div class="sidebar-footer">
            <a href="profile.html" class="user-info-widget" style="text-decoration: none; cursor: pointer;">
                <div class="user-avatar-widget">${userInitial}</div>
                <div class="user-details-widget">
                    <div class="user-name-widget">${userName}</div>
                    <div class="user-role-widget">${userRole}</div>
                </div>
            </a>
        </div>
    `;

    /* Inject Sidebar HTML */
    let sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.innerHTML = sidebarHTML;
    }

    /* Inject Logout Modal */
    if (!document.getElementById('logout-modal')) {
        const modalHTML = `
            <div id="logout-modal" class="custom-modal-overlay hidden">
                <div class="custom-modal">
                    <div class="modal-icon">👋</div>
                    <h3 class="modal-title">Ready to leave?</h3>
                    <p class="modal-desc">Are you sure you want to log out of your account?</p>
                    <div class="modal-actions">
                        <button onclick="closeLogoutModal()" class="btn-modal-cancel">Cancel</button>
                        <button onclick="confirmLogout()" class="btn-modal-confirm">Log Out</button>
                    </div>
                </div>
            </div>
            <style>
                .custom-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    animation: fadeIn 0.2s ease;
                }
                
                .custom-modal {
                    background: #1a1a2e; /* Matches bg-card var */
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    padding: 32px;
                    width: 90%;
                    max-width: 400px;
                    text-align: center;
                    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
                    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .modal-icon {
                    font-size: 40px;
                    margin-bottom: 16px;
                }

                .modal-title {
                    font-size: 20px;
                    font-weight: 700;
                    color: white;
                    margin-bottom: 8px;
                    font-family: 'Inter', sans-serif;
                }

                .modal-desc {
                    color: #94a3b8;
                    font-size: 14px;
                    margin-bottom: 24px;
                    line-height: 1.5;
                    font-family: 'Inter', sans-serif;
                }

                .modal-actions {
                    display: flex;
                    gap: 12px;
                }

                .btn-modal-cancel, .btn-modal-confirm {
                    flex: 1;
                    padding: 12px;
                    border-radius: 12px;
                    font-weight: 600;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                    font-family: 'Inter', sans-serif;
                }

                .btn-modal-cancel {
                    background: rgba(255, 255, 255, 0.05);
                    color: white;
                }

                .btn-modal-cancel:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                .btn-modal-confirm {
                    background: linear-gradient(135deg, #ef4444, #dc2626);
                    color: white;
                    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
                }

                .btn-modal-confirm:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
                }

                .hidden {
                    display: none !important;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            </style>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    /* Add User Menu Dropdown Styles */
    if (!document.getElementById('user-menu-styles')) {
        const menuStyles = document.createElement('style');
        menuStyles.id = 'user-menu-styles';
        menuStyles.textContent = `
            .user-menu-dropdown {
                position: absolute;
                bottom: 80px;
                left: 12px;
                right: 12px;
                background: rgba(30, 30, 50, 0.95);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                padding: 8px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(10px);
                z-index: 1000;
            }

            .user-menu-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                color: white;
                text-decoration: none;
                border-radius: 8px;
                transition: background 0.2s;
                font-size: 14px;
                font-weight: 500;
            }

            .user-menu-item:hover {
                background: rgba(99, 102, 241, 0.1);
            }

            .user-menu-item.logout-item {
                color: #ef4444;
            }

            .user-menu-item.logout-item:hover {
                background: rgba(239, 68, 68, 0.1);
            }

            .user-menu-item span {
                font-size: 18px;
            }
        `;
        document.head.appendChild(menuStyles);
    }
}

// Toggle User Menu Dropdown
window.toggleUserMenu = function (event) {
    event.stopPropagation();
    const menu = document.getElementById('user-menu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
};

// Close menu when clicking outside
document.addEventListener('click', function (event) {
    const menu = document.getElementById('user-menu');
    const userWidget = document.querySelector('.user-info-widget');

    if (menu && !menu.classList.contains('hidden')) {
        if (!userWidget || !userWidget.contains(event.target)) {
            menu.classList.add('hidden');
        }
    }
});

// Global Logout Logic
window.logout = function () {
    const modal = document.getElementById('logout-modal');
    if (modal) {
        modal.classList.remove('hidden');
    } else {
        // Fallback if sidebar hasn't loaded (rare)
        if (confirm('Are you sure you want to logout?')) {
            confirmLogout();
        }
    }
};

window.closeLogoutModal = function () {
    const modal = document.getElementById('logout-modal');
    if (modal) modal.classList.add('hidden');
};

window.confirmLogout = function () {
    // Clear all app specific keys
    localStorage.removeItem('userType');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('nextStep_user');
    localStorage.removeItem('nextStep_resume');
    localStorage.removeItem('nextStep_profile');
    localStorage.removeItem('nextStep_interview');
    localStorage.removeItem('nextStep_skills');
    localStorage.removeItem('nextStep_tasks');
    localStorage.removeItem('nextStep_roadmapCompleted');

    // Redirect to landing page
    window.location.href = 'index.html';
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    generateSidebar();
});

// Export for use
window.SidebarComponent = {
    generate: generateSidebar,
    config: SIDEBAR_CONFIG
};
