// Shared Sidebar Component — generates consistent sidebar across all pages
function renderSidebar(activePage) {
    const user = API.getUser();
    const initial = user ? user.name.charAt(0).toUpperCase() : 'U';
    const name = user ? user.name : 'User';
    const email = user ? user.email : 'user@email.com';

    const links = [
        { label: 'Overview', section: 'Dashboard', href: '/dashboard.html', icon: Icons.dashboard, id: 'dashboard' },
        { label: 'Expenses', section: 'Dashboard', href: '/expenses.html', icon: Icons.expenses, id: 'expenses' },
        { label: 'Income', section: 'Dashboard', href: '/income.html', icon: Icons.income, id: 'income' },
        { label: 'Budgets', section: 'Planning', href: '/budgets.html', icon: Icons.budgets, id: 'budgets' },
        { label: 'Analytics', section: 'Planning', href: '/analytics.html', icon: Icons.analytics, id: 'analytics' },
        { label: 'Settings', section: 'Account', href: '/settings.html', icon: Icons.settings, id: 'settings' },
    ];

    let sections = {};
    links.forEach(l => {
        if (!sections[l.section]) sections[l.section] = [];
        sections[l.section].push(l);
    });

    let navHTML = '';
    Object.entries(sections).forEach(([section, items]) => {
        navHTML += `<div class="sidebar-section-label">${section}</div>`;
        items.forEach(item => {
            const isActive = item.id === activePage ? ' active' : '';
            navHTML += `<a href="${item.href}" class="sidebar-link${isActive}"><span class="icon">${item.icon}</span> ${item.label}</a>`;
        });
    });

    const sidebarHTML = `
        <aside class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <a href="/dashboard.html" class="sidebar-brand">
                    <div class="sidebar-brand-icon">F</div>
                    <div class="sidebar-brand-text">FinTrack <span class="accent">AI</span></div>
                </a>
            </div>
            <nav class="sidebar-nav">${navHTML}</nav>
            <div class="sidebar-footer">
                <div class="sidebar-user">
                    <div class="sidebar-avatar">${initial}</div>
                    <div class="sidebar-user-info">
                        <div class="sidebar-user-name">${name}</div>
                        <div class="sidebar-user-email">${email}</div>
                    </div>
                    <button class="sidebar-logout" id="logoutBtn" title="Sign out">${Icons.logout}</button>
                </div>
            </div>
        </aside>
        <div class="sidebar-overlay" id="sidebarOverlay"></div>
    `;

    return sidebarHTML;
}

// Initialize sidebar events
function initSidebar() {
    document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
        document.getElementById('sidebarOverlay').classList.toggle('open');
    });
    document.getElementById('sidebarOverlay')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebarOverlay').classList.remove('open');
    });
    document.getElementById('logoutBtn')?.addEventListener('click', () => API.logout());
}

// Month navigation helper
function createMonthPicker(containerId, onChange) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let currentDate = new Date();

    function render() {
        const monthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        const label = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

        container.innerHTML = `
            <div class="month-picker">
                <button class="month-picker-btn" id="monthPrev" title="Previous month">${Icons.chevronLeft}</button>
                <div class="month-picker-label">
                    <span class="month-picker-icon">${Icons.calendar}</span>
                    <span>${label}</span>
                </div>
                <button class="month-picker-btn" id="monthNext" title="Next month">${Icons.chevronRight}</button>
            </div>
        `;

        container.querySelector('#monthPrev').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            render();
            onChange(getMonthStr());
        });

        container.querySelector('#monthNext').addEventListener('click', () => {
            const now = new Date();
            const nextMonth = new Date(currentDate);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            if (nextMonth <= new Date(now.getFullYear(), now.getMonth() + 1, 0)) {
                currentDate.setMonth(currentDate.getMonth() + 1);
                render();
                onChange(getMonthStr());
            }
        });
    }

    function getMonthStr() {
        return `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    }

    render();
    return { getMonth: getMonthStr };
}

// Auth guard
function requireAuth() {
    if (!API.isLoggedIn()) {
        window.location.href = '/';
        return false;
    }
    return true;
}
