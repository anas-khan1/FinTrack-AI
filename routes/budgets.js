const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { budgets } = require('../database/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/budgets
router.get('/', async (req, res) => {
    try {
        const query = { user_id: req.user.id };
        if (req.query.month) query.month = req.query.month;
        const results = await budgets.find(query).sort({ category: 1 });
        res.json({ budgets: results });
    } catch (err) {
        console.error('Get budgets error:', err);
        res.status(500).json({ error: 'Failed to fetch budgets' });
    }
});

// POST /api/budgets — upsert budget for category+month
router.post('/', async (req, res) => {
    try {
        const { category, amount, month } = req.body;
        if (!category || !amount || !month) return res.status(400).json({ error: 'Category, amount, and month are required' });

        const existing = await budgets.findOne({ user_id: req.user.id, category, month });
        if (existing) {
            await budgets.update({ id: existing.id }, { $set: { amount } });
            res.json({ message: 'Budget updated', id: existing.id });
        } else {
            const id = uuidv4();
            await budgets.insert({ id, user_id: req.user.id, category, amount, month, created_at: new Date().toISOString() });
            res.status(201).json({ message: 'Budget created', id });
        }
    } catch (err) {
        console.error('Set budget error:', err);
        res.status(500).json({ error: 'Failed to set budget' });
    }
});

// DELETE /api/budgets/:id
router.delete('/:id', async (req, res) => {
    try {
        const removed = await budgets.remove({ id: req.params.id, user_id: req.user.id });
        if (removed === 0) return res.status(404).json({ error: 'Budget not found' });
        res.json({ message: 'Budget deleted' });
    } catch (err) {
        console.error('Delete budget error:', err);
        res.status(500).json({ error: 'Failed to delete budget' });
    }
});

module.exports = router;
