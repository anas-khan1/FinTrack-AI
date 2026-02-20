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
                    <div class="sidebar-brand-icon"><svg width="28" height="28" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="url(#lg)"/><rect x="6" y="18" width="5" height="8" rx="1.5" fill="rgba(255,255,255,0.5)"/><rect x="13.5" y="13" width="5" height="13" rx="1.5" fill="rgba(255,255,255,0.7)"/><rect x="21" y="7" width="5" height="19" rx="1.5" fill="white"/><path d="M8 10l7-4 5 3 5-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="25" cy="5" r="2" fill="white"/><defs><linearGradient id="lg" x1="0" y1="0" x2="32" y2="32"><stop stop-color="#6366f1"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient></defs></svg></div>
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
