// API Helper — handles fetch calls with auth token
const API = {
    BASE: '/api',

    getToken() {
        return localStorage.getItem('fintrack_token');
    },

    setToken(token) {
        localStorage.setItem('fintrack_token', token);
    },

    setUser(user) {
        localStorage.setItem('fintrack_user', JSON.stringify(user));
    },

    getUser() {
        try { return JSON.parse(localStorage.getItem('fintrack_user')); }
        catch { return null; }
    },

    logout() {
        localStorage.removeItem('fintrack_token');
        localStorage.removeItem('fintrack_user');
        window.location.href = '/';
    },

    isLoggedIn() {
        return !!this.getToken();
    },

    async request(endpoint, options = {}) {
        const url = this.BASE + endpoint;
        const headers = { 'Content-Type': 'application/json' };
        const token = this.getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;

        try {
            const res = await fetch(url, { ...options, headers: { ...headers, ...options.headers } });
            const data = await res.json();
            if (!res.ok) {
                if (res.status === 401) {
                    this.logout();
                    return;
                }
                throw new Error(data.error || 'Request failed');
            }
            return data;
        } catch (err) {
            throw err;
        }
    },

    get(endpoint) { return this.request(endpoint); },
    post(endpoint, body) { return this.request(endpoint, { method: 'POST', body: JSON.stringify(body) }); },
    put(endpoint, body) { return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body) }); },
    delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); }
};

// Toast notification
function showToast(message, type = 'success') {
    let toast = document.getElementById('globalToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'globalToast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    const icon = type === 'success' ? Icons.checkCircle : Icons.alertCircle;
    toast.innerHTML = `<span class="toast-icon">${icon}</span> ${message}`;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Format currency
function formatCurrency(amount) {
    return '\u20B9' + Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// Get current month string YYYY-MM
function getCurrentMonth() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Category colors
const CATEGORY_COLORS = {
    'Food': '#f97316', 'Transport': '#3b82f6', 'Entertainment': '#8b5cf6',
    'Shopping': '#ec4899', 'Bills': '#f59e0b', 'Health': '#22c55e',
    'Education': '#06b6d4', 'Travel': '#6366f1', 'Other': '#94a3b8'
};

// Export data helper
function exportToCSV(filename, rows) {
    const csvContent = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}
