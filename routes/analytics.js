const express = require('express');
const { expenses, income, budgets } = require('../database/db');
const { authenticate } = require('../middleware/auth');
const { calculateHealthScore, generateRecommendations, getSpendingDiversity } = require('../services/ai-advisor');

const router = express.Router();
router.use(authenticate);

function getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// GET /api/analytics/summary
router.get('/summary', async (req, res) => {
    try {
        const userId = req.user.id;
        const currentMonth = req.query.month || getCurrentMonth();
        const monthRegex = new RegExp('^' + currentMonth);

        const monthExpenses = await expenses.find({ user_id: userId, date: { $regex: monthRegex } });
        const monthIncome = await income.find({ user_id: userId, date: { $regex: monthRegex } });
        const monthBudgets = await budgets.find({ user_id: userId, month: currentMonth });

        const totalExpenses = monthExpenses.reduce((s, e) => s + e.amount, 0);
        const totalIncome = monthIncome.reduce((s, i) => s + i.amount, 0);
        const savings = totalIncome - totalExpenses;
        const savingsRate = totalIncome > 0 ? ((savings / totalIncome) * 100).toFixed(1) : 0;

        // Category breakdown
        const catMap = {};
        monthExpenses.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + e.amount; });
        const categoryBreakdown = Object.entries(catMap).map(([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total);

        // Budget adherence
        let budgetAdherence = 1;
        if (monthBudgets.length > 0) {
            const values = monthBudgets.map(b => {
                const spent = catMap[b.category] || 0;
                return spent <= b.amount ? 1 : b.amount / spent;
            });
            budgetAdherence = values.reduce((s, v) => s + v, 0) / values.length;
        }

        const diversity = getSpendingDiversity(catMap);
        const healthScore = calculateHealthScore(totalIncome, totalExpenses, budgetAdherence, diversity);

        res.json({
            currentMonth, totalIncome, totalExpenses, savings,
            savingsRate: parseFloat(savingsRate),
            expenseCount: monthExpenses.length,
            healthScore, categoryBreakdown,
            topCategory: categoryBreakdown[0]?.category || 'None'
        });
    } catch (err) {
        console.error('Analytics summary error:', err);
        res.status(500).json({ error: 'Failed to generate summary' });
    }
});

// GET /api/analytics/category-breakdown
router.get('/category-breakdown', async (req, res) => {
    try {
        const userId = req.user.id;
        const targetMonth = req.query.month || getCurrentMonth();
        const re = new RegExp('^' + targetMonth);

        const monthExpenses = await expenses.find({ user_id: userId, date: { $regex: re } });
        const catMap = {};
        monthExpenses.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + e.amount; });
        const total = Object.values(catMap).reduce((s, v) => s + v, 0);

        const breakdown = Object.entries(catMap).map(([category, t]) => ({
            category, total: t, count: monthExpenses.filter(e => e.category === category).length,
            percentage: total > 0 ? ((t / total) * 100).toFixed(1) : 0
        })).sort((a, b) => b.total - a.total);

        res.json({ month: targetMonth, breakdown, total });
    } catch (err) {
        console.error('Category breakdown error:', err);
        res.status(500).json({ error: 'Failed to get breakdown' });
    }
});

// GET /api/analytics/monthly-trend
router.get('/monthly-trend', async (req, res) => {
    try {
        const userId = req.user.id;
        const months = [];
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const re = new RegExp('^' + m);

            const monthExp = await expenses.find({ user_id: userId, date: { $regex: re } });
            const monthInc = await income.find({ user_id: userId, date: { $regex: re } });

            const expTotal = monthExp.reduce((s, e) => s + e.amount, 0);
            const incTotal = monthInc.reduce((s, i) => s + i.amount, 0);

            months.push({ month: m, label: d.toLocaleString('default', { month: 'short', year: 'numeric' }), expenses: expTotal, income: incTotal, savings: incTotal - expTotal });
        }

        res.json({ trend: months });
    } catch (err) {
        console.error('Monthly trend error:', err);
        res.status(500).json({ error: 'Failed to get trend' });
    }
});

// GET /api/analytics/ai-recommendations
router.get('/ai-recommendations', async (req, res) => {
    try {
        const userId = req.user.id;
        const currentMonth = req.query.month || getCurrentMonth();
        const re = new RegExp('^' + currentMonth);

        const monthExpenses = await expenses.find({ user_id: userId, date: { $regex: re } });
        const monthIncome = await income.find({ user_id: userId, date: { $regex: re } });
        const monthBudgets = await budgets.find({ user_id: userId, month: currentMonth });

        const recommendations = generateRecommendations(monthExpenses, monthIncome, monthBudgets);
        res.json({ recommendations, generatedAt: new Date().toISOString(), dataPoints: { expenses: monthExpenses.length, income: monthIncome.length, budgets: monthBudgets.length } });
    } catch (err) {
        console.error('AI recommendations error:', err);
        res.status(500).json({ error: 'Failed to generate recommendations' });
    }
});

// GET /api/analytics/budget-vs-actual
router.get('/budget-vs-actual', async (req, res) => {
    try {
        const userId = req.user.id;
        const currentMonth = req.query.month || getCurrentMonth();
        const re = new RegExp('^' + currentMonth);

        const monthBudgets = await budgets.find({ user_id: userId, month: currentMonth });
        const monthExpenses = await expenses.find({ user_id: userId, date: { $regex: re } });

        const spentMap = {};
        monthExpenses.forEach(e => { spentMap[e.category] = (spentMap[e.category] || 0) + e.amount; });

        const comparison = monthBudgets.map(b => ({
            category: b.category, budget: b.amount,
            spent: spentMap[b.category] || 0,
            remaining: b.amount - (spentMap[b.category] || 0),
            percentage: ((spentMap[b.category] || 0) / b.amount * 100).toFixed(1),
            status: (spentMap[b.category] || 0) > b.amount ? 'over' : (spentMap[b.category] || 0) > b.amount * 0.8 ? 'warning' : 'good'
        }));

        res.json({ month: currentMonth, comparison });
    } catch (err) {
        console.error('Budget vs actual error:', err);
        res.status(500).json({ error: 'Failed to get comparison' });
    }
});

module.exports = router;
