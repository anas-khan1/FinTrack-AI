const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { income } = require('../database/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/income
router.get('/', async (req, res) => {
    try {
        const results = await income.find({ user_id: req.user.id }).sort({ date: -1 }).limit(parseInt(req.query.limit || 50));
        res.json({ income: results });
    } catch (err) {
        console.error('Get income error:', err);
        res.status(500).json({ error: 'Failed to fetch income' });
    }
});

// POST /api/income
router.post('/', async (req, res) => {
    try {
        const { amount, source, description, date, recurring } = req.body;
        if (!amount || !source || !date) return res.status(400).json({ error: 'Amount, source, and date are required' });

        const id = uuidv4();
        const entry = { id, user_id: req.user.id, amount, source, description: description || '', date, recurring: !!recurring, created_at: new Date().toISOString() };
        await income.insert(entry);
        res.status(201).json({ income: entry });
    } catch (err) {
        console.error('Add income error:', err);
        res.status(500).json({ error: 'Failed to add income' });
    }
});

// DELETE /api/income/:id
router.delete('/:id', async (req, res) => {
    try {
        const removed = await income.remove({ id: req.params.id, user_id: req.user.id });
        if (removed === 0) return res.status(404).json({ error: 'Income entry not found' });
        res.json({ message: 'Income deleted' });
    } catch (err) {
        console.error('Delete income error:', err);
        res.status(500).json({ error: 'Failed to delete income' });
    }
});

module.exports = router;
