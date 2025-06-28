// backend/routes/reports.js

const express = require('express');
const router = express.Router(); // <--- This line defines 'router'
const db = require('../config/db'); // <--- IMPORTANT: Adjust this path if your db.js is located elsewhere

// Optional: Middleware for basic error logging (good practice)
router.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// --- Endpoint 1: Top Candidates by Votes (Who's Winning) ---
router.get('/top-candidates', async (req, res) => {
    let client;
    try {
        client = await db.getClient();
        const result = await client.query(`
            SELECT
                c.id AS candidate_id,
                c.name AS candidate_name,
                p.title AS poll_name, -- Uses 'p.title' as confirmed for polls table
                COUNT(v.id) AS total_votes_received
            FROM
                candidates AS c
            JOIN
                votes AS v ON c.id = v.candidate_id -- Uses 'votes' (plural) as confirmed
            LEFT JOIN
                polls AS p ON c.poll_id = p.id
            GROUP BY
                c.id, c.name, p.title -- Uses 'p.title' in GROUP BY
            ORDER BY
                total_votes_received DESC, c.name ASC;
        `);
        res.status(200).json(result.rows); // Send the query results as JSON
    } catch (error) {
        console.error('Error fetching top candidates:', error);
        res.status(500).json({ message: 'Error fetching top candidates.' }); // Send a 500 error response
    } finally {
        if (client) client.release(); // Release the client back to the pool
    }
});

// --- Endpoint 2: User Voting Activity (Votes Cast by Each User) ---
router.get('/user-voting-activity', async (req, res) => {
    let client; // Declare client here
    try {
        client = await db.getClient();
        const result = await client.query(`
            SELECT
                u.id AS user_id,
                u.username,
                u.email,
                u.created_at,
                u.is_admin,
                u.money,
                u.role,
                u.last_free_vote_date,
                COUNT(v.id) AS votes_cast_by_user
            FROM
                users AS u
            LEFT JOIN
                votes AS v ON u.id = v.user_id -- Uses 'votes' (plural) as confirmed
            GROUP BY
                u.id, u.username, u.email, u.created_at, u.is_admin, u.money, u.role, u.last_free_vote_date
            ORDER BY
                votes_cast_by_user DESC, u.username ASC;
        `);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching user voting activity:', error);
        res.status(500).json({ message: 'Error fetching user voting activity.' });
    } finally {
        if (client) client.release();
    }
});

module.exports = router; // Export the router to be used in server.js