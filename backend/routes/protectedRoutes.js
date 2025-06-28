// backend/routes/protectedRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/authorizeRoles');
const bcrypt = require('bcryptjs');

// --- Protected: Get current user profile (Accessible by any authenticated user) ---
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const userQuery = 'SELECT id, email, username, role, money FROM users WHERE id = $1';
        const userResult = await db.query(userQuery, [req.user.id]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.json(userResult.rows[0]);
    } catch (err) {
        console.error('Error fetching user profile:', err.message);
        res.status(500).json({ message: 'Server error fetching profile.' });
    }
});

// --- Protected: Update user profile (Accessible by any authenticated user) ---
router.put('/users/profile', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const { username, email, password } = req.body;

    if (!username && !email && !password) {
        return res.status(400).json({ error: 'At least one field (username, email, or password) is required for update.' });
    }

    let client;
    try {
        client = await db.getClient();
        await client.query('BEGIN');

        let query = 'UPDATE users SET ';
        const queryParams = [];
        let paramIndex = 1;
        const updates = [];

        if (username !== undefined) {
            if (username.length < 3 || username.length > 50) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Username must be between 3 and 50 characters.' });
            }
            updates.push(`username = $${paramIndex++}`);
            queryParams.push(username);
        }

        if (email !== undefined) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Invalid email format.' });
            }
            updates.push(`email = $${paramIndex++}`);
            queryParams.push(email);
        }

        if (password !== undefined) {
            if (password.length < 6) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
            }
            const saltRounds = 10;
            const password_hash = await bcrypt.hash(password, saltRounds);
            updates.push(`password_hash = $${paramIndex++}`);
            queryParams.push(password_hash);
        }

        if (updates.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'No valid fields provided for update.' });
        }

        query += updates.join(', ') + ` WHERE id = $${paramIndex} RETURNING id, username, email, role, money`;
        queryParams.push(userId);

        const result = await client.query(query, queryParams);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'User not found.' });
        }

        await client.query('COMMIT');
        res.status(200).json({
            message: 'Profile updated successfully!',
            user: result.rows[0]
        });

    } catch (error) {
        if (client) await client.query('ROLLBACK');
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Username or email already exists.' });
        }
        console.error('Error updating user profile:', error);
        res.status(500).json({ error: 'Failed to update profile.' });
    } finally {
        if (client) client.release();
    }
});


// --- Protected: Create a new poll (Example: Admin-only) ---
router.post('/polls', authMiddleware, authorizeRoles('admin'), async (req, res) => {
    const { title, description, candidates } = req.body;

    if (!title || title.trim() === '') {
        return res.status(400).json({ error: 'Poll title is required.' });
    }
    if (!Array.isArray(candidates) || candidates.length === 0) {
        return res.status(400).json({ error: 'At least one candidate is required.' });
    }

    let client;
    try {
        client = await db.getClient();
        await client.query('BEGIN');

        const pollResult = await client.query(
            'INSERT INTO polls (title, description) VALUES ($1, $2) RETURNING id',
            [title.trim(), description ? description.trim() : null]
        );
        const pollId = pollResult.rows[0].id;

        const candidateInserts = candidates.map(candidate =>
            client.query('INSERT INTO candidates (poll_id, name) VALUES ($1, $2)', [pollId, candidate.name.trim()])
        );

        await Promise.all(candidateInserts);
        await client.query('COMMIT');
        res.status(201).json({ id: pollId, message: 'Poll created successfully!' });

    } catch (error) {
        if (client) await client.query('ROLLBACK');
        console.error('Error creating poll:', error);
        res.status(500).json({ error: 'Failed to create poll.' });
    } finally {
        if (client) client.release();
    }
});

// --- Protected: Admin-only GET /api/admin/contestants (Includes votes) ---
router.get('/admin/contestants', authMiddleware, authorizeRoles('admin'), async (req, res) => {
    try {
        const result = await db.query('SELECT id, name, country, age, bio, votes, image_url FROM contestants ORDER BY votes DESC');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Admin Error fetching contestants results:', err);
        res.status(500).json({ error: 'Failed to retrieve contestant results' });
    }
});

// --- Protected: Admin-only: Update contestant details (including votes directly) ---
router.put('/admin/contestants/:id', authMiddleware, authorizeRoles('admin'), async (req, res) => {
    const { id } = req.params;
    const { name, country, age, bio, votes, image_url } = req.body;

    let client;
    try {
        client = await db.getClient();
        await client.query('BEGIN');

        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (name !== undefined) { updates.push(`name = $${paramIndex++}`); values.push(name); }
        if (country !== undefined) { updates.push(`country = $${paramIndex++}`); values.push(country); }
        if (age !== undefined) { updates.push(`age = $${paramIndex++}`); values.push(age); }
        if (bio !== undefined) { updates.push(`bio = $${paramIndex++}`); values.push(bio); }
        if (votes !== undefined) { updates.push(`votes = $${paramIndex++}`); values.push(votes); }
        if (image_url !== undefined) { updates.push(`image_url = $${paramIndex++}`); values.push(image_url); }

        if (updates.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'No valid fields provided for update.' });
        }

        values.push(id);
        const query = `UPDATE contestants SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

        const result = await client.query(query, values);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Contestant not found.' });
        }

        await client.query('COMMIT');
        res.status(200).json({ message: 'Contestant updated successfully.', contestant: result.rows[0] });

    } catch (error) {
        if (client) await client.query('ROLLBACK');
        console.error('Error updating contestant:', error);
        res.status(500).json({ error: 'Failed to update contestant.' });
    } finally {
        if (client) client.release();
    }
});

module.exports = router;