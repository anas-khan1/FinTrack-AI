// Expenses page logic
document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth()) return;

    document.getElementById('sidebarContainer').innerHTML = renderSidebar('expenses');
    initSidebar();

    // Set SVG icons
    document.getElementById('mobileMenuBtn').innerHTML = Icons.menu;
    document.getElementById('addExpenseBtn').innerHTML = `${Icons.plus} Add Expense`;
    document.getElementById('exportExpBtn').innerHTML = `${Icons.download} Export`;
    if (document.getElementById('emptyExpIcon')) document.getElementById('emptyExpIcon').innerHTML = Icons.expenses;

    const modal = document.getElementById('expenseModal');
    document.getElementById('addExpenseBtn').addEventListener('click', () => {
        document.getElementById('expDate').value = new Date().toISOString().split('T')[0];
        modal.classList.add('active');
    });
    document.getElementById('cancelExpenseBtn').addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('active'); });

    let allExpenses = [];

    async function loadExpenses() {
        try {
            const category = document.getElementById('categoryFilter').value;
            const query = category ? `?category=${category}` : '';
            const data = await API.get(`/expenses${query}`);
            allExpenses = data.expenses;

            const tbody = document.getElementById('expenseTbody');
            const empty = document.getElementById('expenseEmpty');
            const table = document.getElementById('expenseTable');

            // Summary
            const total = allExpenses.reduce((s, e) => s + e.amount, 0);
            document.getElementById('expTotal').textContent = formatCurrency(total);
            document.getElementById('expCount').textContent = allExpenses.length;
            document.getElementById('expAvg').textContent = allExpenses.length > 0 ? formatCurrency(total / allExpenses.length) : '\u20B90';

            if (allExpenses.length === 0) {
                table.style.display = 'none'; empty.style.display = 'block';
            } else {
                table.style.display = 'table'; empty.style.display = 'none';
                tbody.innerHTML = allExpenses.map(e => `
                    <tr>
                        <td>${new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</td>
                        <td><span class="category-badge">${categoryDot(e.category)} ${e.category}</span></td>
                        <td style="color:var(--text-secondary)">${e.description || '\u2014'}</td>
                        <td style="text-align:right;font-weight:600;color:var(--danger)">-${formatCurrency(e.amount)}</td>
                        <td><button class="action-btn delete" data-id="${e.id}" title="Delete">${Icons.trash}</button></td>
                    </tr>
                `).join('');

                tbody.querySelectorAll('.action-btn.delete').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        if (confirm('Delete this expense?')) {
                            await API.delete(`/expenses/${btn.dataset.id}`);
                            showToast('Expense deleted');
                            loadExpenses();
                        }
                    });
                });
            }
        } catch (err) { showToast('Failed to load expenses', 'error'); }
    }

    document.getElementById('categoryFilter').addEventListener('change', loadExpenses);

    document.getElementById('expenseForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await API.post('/expenses', {
                amount: parseFloat(document.getElementById('expAmount').value),
                category: document.getElementById('expCategory').value,
                description: document.getElementById('expDescription').value,
                date: document.getElementById('expDate').value
            });
            modal.classList.remove('active');
            document.getElementById('expenseForm').reset();
            showToast('Expense added');
            loadExpenses();
        } catch (err) { showToast(err.message, 'error'); }
    });

    // Export CSV
    document.getElementById('exportExpBtn').addEventListener('click', () => {
        if (allExpenses.length === 0) { showToast('No data to export', 'error'); return; }
        const rows = [['Date', 'Category', 'Description', 'Amount']];
        allExpenses.forEach(e => rows.push([e.date, e.category, e.description || '', e.amount]));
        exportToCSV('fintrack_expenses.csv', rows);
        showToast('Exported expenses');
    });

    loadExpenses();
});
