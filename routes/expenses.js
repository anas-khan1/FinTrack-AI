const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { expenses } = require('../database/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/expenses
router.get('/', async (req, res) => {
    try {
        const { startDate, endDate, category, limit = 50 } = req.query;
        const query = { user_id: req.user.id };
        if (category) query.category = category;
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = startDate;
            if (endDate) query.date.$lte = endDate;
        }

        const results = await expenses.find(query).sort({ date: -1 }).limit(parseInt(limit));
        res.json({ expenses: results });
    } catch (err) {
        console.error('Get expenses error:', err);
        res.status(500).json({ error: 'Failed to fetch expenses' });
    }
});

// POST /api/expenses
router.post('/', async (req, res) => {
    try {
        const { amount, category, description, date } = req.body;
        if (!amount || !category || !date) return res.status(400).json({ error: 'Amount, category, and date are required' });
        if (amount <= 0) return res.status(400).json({ error: 'Amount must be positive' });

        const id = uuidv4();
        const expense = { id, user_id: req.user.id, amount, category, description: description || '', date, created_at: new Date().toISOString() };
        await expenses.insert(expense);
        res.status(201).json({ expense });
    } catch (err) {
        console.error('Add expense error:', err);
        res.status(500).json({ error: 'Failed to add expense' });
    }
});

// PUT /api/expenses/:id
router.put('/:id', async (req, res) => {
    try {
        const { amount, category, description, date } = req.body;
        const expense = await expenses.findOne({ id: req.params.id, user_id: req.user.id });
        if (!expense) return res.status(404).json({ error: 'Expense not found' });

        await expenses.update({ id: req.params.id, user_id: req.user.id }, {
            $set: { amount: amount || expense.amount, category: category || expense.category, description: description ?? expense.description, date: date || expense.date }
        });
        res.json({ message: 'Expense updated' });
    } catch (err) {
        console.error('Update expense error:', err);
        res.status(500).json({ error: 'Failed to update expense' });
    }
});

// DELETE /api/expenses/:id
router.delete('/:id', async (req, res) => {
    try {
        const removed = await expenses.remove({ id: req.params.id, user_id: req.user.id });
        if (removed === 0) return res.status(404).json({ error: 'Expense not found' });
        res.json({ message: 'Expense deleted' });
    } catch (err) {
        console.error('Delete expense error:', err);
        res.status(500).json({ error: 'Failed to delete expense' });
    }
});

module.exports = router;
