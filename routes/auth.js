const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { users, expenses, income, budgets } = require('../database/db');
const { generateToken, authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required' });
        if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

        const existing = await users.findOne({ email });
        if (existing) return res.status(409).json({ error: 'Email already registered' });

        const hashedPassword = await bcrypt.hash(password, 12);
        const id = uuidv4();
        await users.insert({ id, name, email, password: hashedPassword, currency: 'INR', created_at: new Date().toISOString() });

        const token = generateToken({ id, email, name });
        res.status(201).json({ token, user: { id, name, email } });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

        const user = await users.findOne({ email });
        if (!user) return res.status(401).json({ error: 'Invalid email or password' });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

        const token = generateToken({ id: user.id, email: user.email, name: user.name });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Not authenticated' });
    const jwt = require('jsonwebtoken');
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fintrack-ai-secret-2026');
        const user = await users.findOne({ id: decoded.id });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ user: { id: user.id, name: user.name, email: user.email, currency: user.currency, created_at: user.created_at } });
    } catch { res.status(401).json({ error: 'Invalid token' }); }
});

// DELETE /api/auth/account — permanently delete account and all data
router.delete('/account', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const body = req.body || {};
        const password = body.password;

        // Password is REQUIRED for account deletion
        if (!password) {
            return res.status(400).json({ error: 'Password is required to delete account' });
        }

        // Find the user
        const user = await users.findOne({ id: userId });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Verify password
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(403).json({ error: 'Incorrect password. Account was NOT deleted.' });
        }

        // Delete all user data from every collection
        const deletedExpenses = await expenses.remove({ user_id: userId }, { multi: true });
        const deletedIncome = await income.remove({ user_id: userId }, { multi: true });
        const deletedBudgets = await budgets.remove({ user_id: userId }, { multi: true });
        const deletedUser = await users.remove({ id: userId }, { multi: true });

        console.log(`Account deleted: ${user.email} — removed ${deletedExpenses} expenses, ${deletedIncome} income, ${deletedBudgets} budgets, ${deletedUser} user`);

        res.json({
            message: 'Account and all data permanently deleted',
            deleted: { expenses: deletedExpenses, income: deletedIncome, budgets: deletedBudgets }
        });
    } catch (err) {
        console.error('Delete account error:', err);
        res.status(500).json({ error: 'Failed to delete account' });
    }
});

module.exports = router;
