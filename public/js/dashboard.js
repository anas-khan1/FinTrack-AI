// Dashboard logic with month navigation
document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth()) return;

    const user = API.getUser();
    if (user) {
        document.getElementById('greetingText').textContent = `Welcome back, ${user.name.split(' ')[0]}`;
    }

    // Render sidebar and init
    document.getElementById('sidebarContainer').innerHTML = renderSidebar('dashboard');
    initSidebar();

    // Set SVG icons
    document.getElementById('mobileMenuBtn').innerHTML = Icons.menu;
    document.getElementById('iconIncome').innerHTML = Icons.income;
    document.getElementById('iconExpense').innerHTML = Icons.expenses;
    document.getElementById('iconSavings').innerHTML = Icons.arrowUp;
    document.getElementById('iconHealth').innerHTML = Icons.analytics;
    document.getElementById('refreshIcon').innerHTML = Icons.refresh;
    if (document.getElementById('emptyRecIcon')) document.getElementById('emptyRecIcon').innerHTML = Icons.analytics;
    if (document.getElementById('emptyRecentIcon')) document.getElementById('emptyRecentIcon').innerHTML = Icons.expenses;

    let trendChart, categoryChart;

    // Month picker
    const monthPicker = createMonthPicker('monthPickerContainer', (month) => {
        loadDashboard(month);
    });

    async function loadDashboard(month) {
        const m = month || monthPicker.getMonth();
        try {
            const [summary, trend, recs, expData] = await Promise.all([
                API.get(`/analytics/summary?month=${m}`),
                API.get('/analytics/monthly-trend'),
                API.get(`/analytics/ai-recommendations?month=${m}`),
                API.get(`/expenses?startDate=${m}-01&endDate=${m}-31&limit=5`)
            ]);

            // Stats
            document.getElementById('statIncome').textContent = formatCurrency(summary.totalIncome);
            document.getElementById('statExpenses').textContent = formatCurrency(summary.totalExpenses);
            document.getElementById('statSavings').textContent = formatCurrency(summary.savings);
            document.getElementById('statSavingsRate').textContent = `${summary.savingsRate}% savings rate`;
            document.getElementById('statExpenseCount').textContent = `${summary.expenseCount} transactions`;

            // Health score ring
            const score = summary.healthScore;
            document.getElementById('healthScore').textContent = score;
            const circumference = 2 * Math.PI * 34;
            const offset = circumference - (score / 100) * circumference;
            const ringFill = document.getElementById('ringFill');
            ringFill.style.strokeDasharray = circumference;
            ringFill.style.strokeDashoffset = offset;
            if (score >= 70) ringFill.style.stroke = '#22c55e';
            else if (score >= 40) ringFill.style.stroke = '#f59e0b';
            else ringFill.style.stroke = '#ef4444';

            // Trend chart
            if (trendChart) trendChart.destroy();
            const trendCtx = document.getElementById('trendChart').getContext('2d');
            trendChart = new Chart(trendCtx, {
                type: 'line',
                data: {
                    labels: trend.trend.map(t => t.label),
                    datasets: [
                        {
                            label: 'Income', data: trend.trend.map(t => t.income),
                            borderColor: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#22c55e'
                        },
                        {
                            label: 'Expenses', data: trend.trend.map(t => t.expenses),
                            borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#ef4444'
                        }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: '#94a3b8', font: { family: 'Inter' } } } },
                    scales: {
                        x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.04)' } },
                        y: { ticks: { color: '#64748b', callback: v => '\u20B9' + v.toLocaleString() }, grid: { color: 'rgba(255,255,255,0.04)' } }
                    }
                }
            });

            // Category chart
            if (categoryChart) categoryChart.destroy();
            const catCtx = document.getElementById('categoryChart').getContext('2d');
            const catData = summary.categoryBreakdown;
            if (catData.length > 0) {
                categoryChart = new Chart(catCtx, {
                    type: 'doughnut',
                    data: {
                        labels: catData.map(c => c.category),
                        datasets: [{
                            data: catData.map(c => c.total),
                            backgroundColor: catData.map(c => CATEGORY_COLORS[c.category] || '#94a3b8'),
                            borderWidth: 0, hoverOffset: 8
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false, cutout: '65%',
                        plugins: { legend: { position: 'right', labels: { color: '#94a3b8', padding: 12, font: { family: 'Inter', size: 12 } } } }
                    }
                });
            }

            // Recent transactions
            const tbody = document.getElementById('recentTbody');
            const empty = document.getElementById('recentEmpty');
            if (expData.expenses.length > 0) {
                tbody.parentElement.style.display = 'table';
                empty.style.display = 'none';
                tbody.innerHTML = expData.expenses.map(e => `
                    <tr>
                        <td>${new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                        <td><span class="category-badge">${categoryDot(e.category)} ${e.category}</span></td>
                        <td style="color:var(--text-secondary)">${e.description || '\u2014'}</td>
                        <td style="text-align:right;font-weight:600;color:var(--danger)">-${formatCurrency(e.amount)}</td>
                    </tr>
                `).join('');
            } else {
                tbody.parentElement.style.display = 'none';
                empty.style.display = 'block';
            }

            // Recommendations
            const recList = document.getElementById('recList');
            if (recs.recommendations.length > 0) {
                recList.innerHTML = recs.recommendations.map(r => `
                    <div class="rec-card ${r.type}">
                        <div class="rec-icon">${REC_ICONS[r.type] || Icons.info}</div>
                        <div class="rec-content">
                            <div class="rec-title">${r.title}</div>
                            <div class="rec-message">${r.message}</div>
                        </div>
                    </div>
                `).join('');
            } else {
                recList.innerHTML = `<div class="empty-state"><div class="empty-state-icon">${Icons.analytics}</div><div class="empty-state-text">Add expenses and income to get AI recommendations</div></div>`;
            }

        } catch (err) {
            console.error('Dashboard load error:', err);
            showToast('Failed to load dashboard data', 'error');
        }
    }

    document.getElementById('refreshRecBtn')?.addEventListener('click', () => loadDashboard());
    loadDashboard();
});
