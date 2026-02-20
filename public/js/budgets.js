// Budget planner logic with month navigation
document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth()) return;

    document.getElementById('sidebarContainer').innerHTML = renderSidebar('budgets');
    initSidebar();

    // Set SVG icons
    document.getElementById('mobileMenuBtn').innerHTML = Icons.menu;
    document.getElementById('addBudgetBtn').innerHTML = `${Icons.plus} Set Budget`;

    const modal = document.getElementById('budgetModal');
    document.getElementById('addBudgetBtn').addEventListener('click', () => modal.classList.add('active'));
    document.getElementById('cancelBudgetBtn').addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('active'); });

    // Month picker for budgets
    const monthPicker = createMonthPicker('budgetMonthPicker', (month) => {
        loadBudgets(month);
    });

    async function loadBudgets(month) {
        const m = month || monthPicker.getMonth();
        try {
            const data = await API.get(`/analytics/budget-vs-actual?month=${m}`);
            const list = document.getElementById('budgetList');

            if (data.comparison.length === 0) {
                // Build empty state fresh each time (avoids DOM reference issues)
                list.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">${Icons.target}</div>
                        <div class="empty-state-text">No budgets set</div>
                        <div class="empty-state-hint">Click "Set Budget" to create category budgets</div>
                    </div>`;

                // Reset summary
                document.getElementById('budTotalBudget').textContent = formatCurrency(0);
                document.getElementById('budTotalSpent').textContent = formatCurrency(0);
                document.getElementById('budRemaining').textContent = formatCurrency(0);
            } else {
                // Summary stats
                const totalBudget = data.comparison.reduce((s, b) => s + b.budget, 0);
                const totalSpent = data.comparison.reduce((s, b) => s + b.spent, 0);
                document.getElementById('budTotalBudget').textContent = formatCurrency(totalBudget);
                document.getElementById('budTotalSpent').textContent = formatCurrency(totalSpent);
                const rem = totalBudget - totalSpent;
                document.getElementById('budRemaining').textContent = formatCurrency(Math.abs(rem));
                document.getElementById('budRemaining').style.color = rem >= 0 ? 'var(--success)' : 'var(--danger)';

                list.innerHTML = data.comparison.map(b => {
                    const pct = Math.min(parseFloat(b.percentage), 100);
                    const fillClass = b.status === 'over' ? 'danger' : b.status === 'warning' ? 'warning' : '';
                    return `
                    <div class="budget-item">
                        <div class="budget-item-header">
                            <span class="budget-item-category">${categoryDot(b.category)} ${b.category}</span>
                            <span class="budget-item-amount">${formatCurrency(b.spent)} / ${formatCurrency(b.budget)}</span>
                        </div>
                        <div class="budget-progress">
                            <div class="budget-progress-fill ${fillClass}" style="width:${pct}%"></div>
                        </div>
                        <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:0.78rem;color:var(--text-muted)">
                            <span>${b.percentage}% used</span>
                            <span style="color:${b.status === 'over' ? 'var(--danger)' : 'var(--success)'}">
                                ${b.remaining >= 0 ? formatCurrency(b.remaining) + ' left' : formatCurrency(Math.abs(b.remaining)) + ' over'}
                            </span>
                        </div>
                    </div>`;
                }).join('');
            }
        } catch (err) {
            console.error('Budget load error:', err);
            showToast('Failed to load budgets', 'error');
        }
    }

    document.getElementById('budgetForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const m = monthPicker.getMonth();
            await API.post('/budgets', {
                category: document.getElementById('budCategory').value,
                amount: parseFloat(document.getElementById('budAmount').value),
                month: m
            });
            modal.classList.remove('active');
            document.getElementById('budgetForm').reset();
            showToast('Budget saved');
            loadBudgets(m);
        } catch (err) { showToast(err.message, 'error'); }
    });

    loadBudgets();
});
