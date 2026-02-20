// Analytics page logic with month navigation
document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth()) return;

    document.getElementById('sidebarContainer').innerHTML = renderSidebar('analytics');
    initSidebar();

    // Set SVG icons
    document.getElementById('mobileMenuBtn').innerHTML = Icons.menu;
    document.getElementById('iconScore').innerHTML = Icons.analytics;
    document.getElementById('iconTopCat').innerHTML = Icons.expenses;
    document.getElementById('iconSavRate').innerHTML = Icons.arrowUp;
    document.getElementById('iconTxn').innerHTML = Icons.income;
    if (document.getElementById('emptyAnalyticsIcon')) document.getElementById('emptyAnalyticsIcon').innerHTML = Icons.analytics;

    let catBarChart, trendBarChart;

    // Month picker
    const monthPicker = createMonthPicker('analyticsMonthPicker', (month) => {
        loadAnalytics(month);
    });

    async function loadAnalytics(month) {
        const m = month || monthPicker.getMonth();
        try {
            const [summary, catBreakdown, trend, recs] = await Promise.all([
                API.get(`/analytics/summary?month=${m}`),
                API.get(`/analytics/category-breakdown?month=${m}`),
                API.get('/analytics/monthly-trend'),
                API.get(`/analytics/ai-recommendations?month=${m}`)
            ]);

            // Stats
            document.getElementById('aHealthScore').textContent = summary.healthScore;
            document.getElementById('aTopCategory').textContent = summary.topCategory;
            document.getElementById('aSavingsRate').textContent = summary.savingsRate + '%';
            document.getElementById('aTransactions').textContent = summary.expenseCount;

            // Category bar chart
            if (catBarChart) catBarChart.destroy();
            const catCtx = document.getElementById('catBarChart').getContext('2d');
            if (catBreakdown.breakdown.length > 0) {
                catBarChart = new Chart(catCtx, {
                    type: 'bar',
                    data: {
                        labels: catBreakdown.breakdown.map(c => c.category),
                        datasets: [{
                            label: 'Spending',
                            data: catBreakdown.breakdown.map(c => c.total),
                            backgroundColor: catBreakdown.breakdown.map(c => CATEGORY_COLORS[c.category] || '#94a3b8'),
                            borderRadius: 8,
                            barThickness: 32
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            x: { ticks: { color: '#64748b' }, grid: { display: false } },
                            y: { ticks: { color: '#64748b', callback: v => '\u20B9' + v.toLocaleString() }, grid: { color: 'rgba(255,255,255,0.04)' } }
                        }
                    }
                });
            }

            // Trend bar chart
            if (trendBarChart) trendBarChart.destroy();
            const trendCtx = document.getElementById('trendBarChart').getContext('2d');
            trendBarChart = new Chart(trendCtx, {
                type: 'bar',
                data: {
                    labels: trend.trend.map(t => t.label),
                    datasets: [
                        { label: 'Income', data: trend.trend.map(t => t.income), backgroundColor: 'rgba(34, 197, 94, 0.7)', borderRadius: 6, barThickness: 20 },
                        { label: 'Expenses', data: trend.trend.map(t => t.expenses), backgroundColor: 'rgba(239, 68, 68, 0.7)', borderRadius: 6, barThickness: 20 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: '#94a3b8', font: { family: 'Inter' } } } },
                    scales: {
                        x: { ticks: { color: '#64748b' }, grid: { display: false } },
                        y: { ticks: { color: '#64748b', callback: v => '\u20B9' + v.toLocaleString() }, grid: { color: 'rgba(255,255,255,0.04)' } }
                    }
                }
            });

            // Recommendations
            const recList = document.getElementById('recList');
            document.getElementById('recTimestamp').textContent = 'Generated: ' + new Date(recs.generatedAt).toLocaleTimeString();
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
                recList.innerHTML = `<div class="empty-state"><div class="empty-state-icon">${Icons.analytics}</div><div class="empty-state-text">Add expenses and income to get AI insights</div></div>`;
            }
        } catch (err) {
            console.error('Analytics load error:', err);
            showToast('Failed to load analytics', 'error');
        }
    }

    loadAnalytics();
});
