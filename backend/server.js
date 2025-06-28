// server.js - Complete Backend with User Auth, Voting, Reports, and Paystack Integration
// --- Module Imports ---
const express = require('express');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const axios = require('axios'); // For making HTTP requests to Paystack
const path = require('path'); // <--- ADD THIS LINE
require('dotenv').config(); // Load environment variables from .env file

// --- App Initialization ---
const app = express();
const port = process.env.PORT || 5000;
const SECRET_KEY = process.env.JWT_SECRET || 'your_jwt_secret_key';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Static Files Configuration ---
// <--- ADD THESE LINES IMMEDIATELY AFTER app.use(express.json());
// This tells Express to serve static files from the 'uploads' directory
// when requests come in to the '/uploads' path.
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));// look for 'image.jpg' inside the 'uploads' folder relative to server.js
// --------------------------------------------------------------------

// --- PostgreSQL Connection Pool ---
const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT || 5432,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false // For production on platforms like Heroku
});

// Test Database Connection
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error acquiring client for DB connection test', err.stack);
    }
    client.query('SELECT NOW()', (err, result) => {
        release(); // Release the client back to the pool
        if (err) {
            return console.error('Error executing DB test query', err.stack);
        }
        console.log('PostgreSQL connected successfully! Current time:', result.rows[0].now);
    });
});

// --- JWT Authentication Middleware ---
// Verifies the token from the Authorization header
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer TOKEN"

    if (token == null) {
        return res.status(401).json({ message: 'Authentication token required.' });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            console.error("JWT verification error:", err);
            // Specifically check for 'TokenExpiredError' if you want a custom message
            if (err.name === 'TokenExpiredError') {
                return res.status(403).json({ message: 'Session expired. Please log in again.' });
            }
            return res.status(403).json({ message: 'Invalid or forbidden token.' });
        }
        req.user = user; // Attach user payload ({ id, email, role }) to the request
        next(); // Proceed to the next middleware/route handler
    });
}

// --- Authorization Middleware: Check if user is Admin ---
// Requires authenticateToken to run first to populate req.user
function isAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        next(); // User is an admin, grant access
    } else {
        return res.status(403).json({ message: 'Access Denied: Administrator privileges required.' });
    }
}

// --- User Registration (Public Endpoint) ---
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Username, email, and password are required.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        // Default role is 'user' for public registrations
        const result = await pool.query(
            'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
            [username, email, hashedPassword, 'user']
        );
        const newUser = result.rows[0];

        console.log(`User '${newUser.username}' registered successfully.`);

        // Generate JWT for the new user
        const token = jwt.sign(
            { id: newUser.id, email: newUser.email, role: newUser.role },
            SECRET_KEY,
            { expiresIn: '150d' } // Token expires in 150 days
        );

        res.status(201).json({
            message: 'User registered successfully!',
            token,
            user: { id: newUser.id, username: newUser.username, email: newUser.email, role: newUser.role }
        });

    } catch (error) {
        console.error("Registration error:", error);
        if (error.code === '23505') { // PostgreSQL unique violation error code
            return res.status(409).json({ message: 'User with this email already exists.' });
        }
        res.status(500).json({ message: 'Internal server error during registration.' });
    }
});

// --- User Login (Public Endpoint) ---
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const result = await pool.query(
            'SELECT id, username, email, password_hash, role FROM users WHERE email = $1',
            [email]
        );
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials (email not found).' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials (incorrect password).' });
        }

        // Generate JWT upon successful login
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            SECRET_KEY,
            { expiresIn: '150d' }
        );

        res.json({
            message: 'Login successful!',
            token,
            user: { id: user.id, username: user.username, email: user.email, role: user.role }
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: 'Internal server error during login.' });
    }
});

// --- ADMIN-ONLY: Register New User (Admin Controlled Endpoint) ---
// Only an authenticated admin can register new users and assign roles
app.post('/api/admin/register-user', authenticateToken, isAdmin, async (req, res) => {
    const { username, email, password, role } = req.body; // 'role' is provided by the admin

    if (!username || !email || !password || !role) {
        return res.status(400).json({ message: 'Username, email, password, and role are all required.' });
    }

    // Basic role validation: ensure only 'user' or 'admin' roles can be set
    if (role !== 'user' && role !== 'admin') {
        return res.status(400).json({ message: 'Invalid role specified. Role must be "user" or "admin".' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
            [username, email, hashedPassword, role] // Use the role provided by the admin
        );
        const newUser = result.rows[0];

        // FIX: Removed extraneous HTML/LaTeX tags in the console.log
        console.log(`Admin '${req.user.username}' registered new user '${newUser.username}' with role: ${newUser.role}`);

        res.status(201).json({
            message: `User '${newUser.username}' registered successfully as ${newUser.role}!`,
            user: { id: newUser.id, username: newUser.username, email: newUser.email, role: newUser.role }
        });

    } catch (error) {
        console.error("Admin registration error:", error);
        if (error.code === '23505') { // Duplicate email error code
            return res.status(409).json({ message: 'User with this email already exists.' });
        }
        res.status(500).json({ message: 'Internal server error during admin registration.' });
    }
});

// --- Get All Contestants (Public Endpoint) ---
app.get('/api/contestants', async (req, res) => {
    try {
        // Includes poll_id, assuming your contestants table links to polls
        const result = await pool.query('SELECT id, name, country, age, bio, votes, image_url, poll_id FROM contestants ORDER BY votes DESC');
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching contestants:", error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// --- Get Free Vote Status for a User (Authenticated Endpoint) ---
app.get('/api/user/free-vote-status', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id; // From JWT payload

        const result = await pool.query(
            'SELECT last_free_vote_date FROM users WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Check if last_free_vote_date is not null, indicating a free vote has been cast
        const hasCastFreeVote = result.rows[0].last_free_vote_date !== null;

        res.json({ has_cast_free_vote: hasCastFreeVote });

    } catch (error) {
        console.error("Error fetching free vote status:", error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// --- Vote for a Contestant (Authenticated Endpoint - Handles Free and Paid Logic) ---
app.put('/api/contestants/:id/vote', authenticateToken, async (req, res) => {
    const contestantId = parseInt(req.params.id);
    const { amount, voteType } = req.body; // amount is for paid votes, voteType is 'free' or 'paid'
    const userId = req.user.id; // From JWT payload

    if (isNaN(contestantId)) {
        return res.status(400).json({ message: 'Invalid contestant ID.' });
    }
    // Validate voteType and amount for paid votes
    if (!voteType || (voteType === 'paid' && (!amount || amount <= 0))) {
        return res.status(400).json({ message: 'Invalid vote type or amount for paid vote.' });
    }

    try {
        await pool.query('BEGIN'); // Start a database transaction for atomicity

        // Lock contestant row to prevent race conditions during vote update
        const contestantResult = await pool.query(
            'SELECT * FROM contestants WHERE id = $1 FOR UPDATE',
            [contestantId]
        );

        if (contestantResult.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ message: 'Contestant not found.' });
        }

        let votesToAdd = 0;
        let transactionMessage = '';

        if (voteType === 'free') {
            votesToAdd = 1;

            // Check and update user's last free vote date
            const userResult = await pool.query(
                'SELECT last_free_vote_date FROM users WHERE id = $1 FOR UPDATE', // Lock user row
                [userId]
            );

            if (userResult.rows.length === 0) {
                await pool.query('ROLLBACK');
                return res.status(404).json({ message: 'User not found.' });
            }

            if (userResult.rows[0].last_free_vote_date !== null) {
                await pool.query('ROLLBACK');
                return res.status(403).json({ message: 'You have already cast your one-time free vote.' });
            }

            await pool.query(
                'UPDATE users SET last_free_vote_date = CURRENT_DATE WHERE id = $1',
                [userId]
            );
            transactionMessage = `1 free vote cast for ${contestantResult.rows[0].name}.`;

        } else if (voteType === 'paid') {
            // For paid votes, 'amount' from request body directly represents votes to add
            votesToAdd = amount;
            // In a real scenario, this would follow a successful payment verification (e.g., Paystack callback)
            // This endpoint now assumes the frontend has already handled payment initiation and verified.
            console.log(`Processed ${amount} paid vote(s) for contestant ${contestantId}.`);
            transactionMessage = `${amount} paid vote(s) cast for ${contestantResult.rows[0].name}.`;

        } else {
            await pool.query('ROLLBACK');
            return res.status(400).json({ message: 'Invalid voteType specified. Must be "free" or "paid".' });
        }

        // Update contestant's total votes
        const updatedContestantResult = await pool.query(
            'UPDATE contestants SET votes = votes + $1 WHERE id = $2 RETURNING id, name, country, age, bio, votes, image_url',
            [votesToAdd, contestantId]
        );

        await pool.query('COMMIT'); // Commit the transaction

        res.json({
            message: 'Vote submitted successfully!',
            contestant: updatedContestantResult.rows[0],
            detail: transactionMessage
        });

    } catch (error) {
        await pool.query('ROLLBACK'); // Rollback transaction if any error occurs
        console.error("Vote error:", error);
        res.status(500).json({ message: 'Internal server error during voting.' });
    }
});

// --- Paystack Payment Verification Endpoint ---
// This endpoint is crucial for confirming payments and updating votes after a Paystack transaction.
// It should be called from your frontend after a successful payment callback from Paystack.
app.post('/api/verify-payment', authenticateToken, async (req, res) => {
    const { reference, contestantId, expectedAmountUSD, expectedAmountGHS } = req.body;
    const userId = req.user.id; // User ID from authenticated JWT

    if (!reference || !contestantId || expectedAmountUSD === undefined || expectedAmountGHS === undefined) {
        return res.status(400).json({ message: 'Missing required payment verification data (reference, contestantId, expectedAmountUSD, expectedAmountGHS).' });
    }

    if (!PAYSTACK_SECRET_KEY) {
        console.error('PAYSTACK_SECRET_KEY is not set in environment variables!');
        return res.status(500).json({ message: 'Server configuration error: Paystack secret key missing.' });
    }

    try {
        // 1. Verify transaction with Paystack API
        const paystackResponse = await axios.get(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                },
            }
        );

        const transactionData = paystackResponse.data.data;
        console.log('Paystack Verification Data:', transactionData);

        // 2. Perform Server-Side Validation of Paystack Response
        if (transactionData.status !== 'success') {
            return res.status(400).json({ message: 'Paystack transaction was not successful or is still pending.' });
        }

        // Paystack amount is in kobo/pesewas (smallest unit)
        // Ensure the paid amount from Paystack matches our expected amount (in pesewas).
        if (transactionData.amount !== expectedAmountGHS) {
            console.warn(`Amount mismatch for reference ${reference}: Expected ${expectedAmountGHS}, Got ${transactionData.amount}`);
            // Log this as a critical security issue or fraud attempt
            return res.status(400).json({ message: `Amount paid (${transactionData.amount / 100} GHS) does not match expected amount (${expectedAmountGHS / 100} GHS). Transaction failed due to amount mismatch.` });
        }

        if (transactionData.currency !== 'GHS') {
            return res.status(400).json({ message: 'Invalid currency. Expected GHS. Transaction failed.' });
        }

        // Start a database transaction for vote update and transaction logging
        const client = await pool.connect();
        try {
            await client.query('BEGIN'); // Start transaction

            // Check if the transaction has already been processed to prevent double-spending
            const checkQuery = `SELECT * FROM transactions WHERE paystack_reference = $1 AND status = 'success'`;
            const existingTransaction = await client.query(checkQuery, [reference]);

            if (existingTransaction.rows.length > 0) {
                // If already processed, respond positively but inform that votes were already added.
                // This is important for idempotent requests (e.g., if Paystack sends webhook multiple times).
                await client.query('ROLLBACK'); // No changes needed if already processed
                return res.status(200).json({
                    message: 'Transaction already processed. Votes have already been added.',
                    contestant: { votes: existingTransaction.rows[0].votes_added_usd } // Return current votes or a relevant message
                });
            }

            // 3. Update contestant votes in your database
            const updateContestantQuery = `
                UPDATE contestants
                SET votes = votes + $1
                WHERE id = $2
                RETURNING id, name, country, age, bio, votes, image_url;
            `;
            const contestantResult = await client.query(updateContestantQuery, [expectedAmountUSD, contestantId]);

            if (contestantResult.rows.length === 0) {
                await client.query('ROLLBACK'); // Contestant not found, so rollback
                return res.status(404).json({ message: 'Contestant not found for vote update.' });
            }
            const updatedContestant = contestantResult.rows[0];

            // 4. Log the successful transaction in your database
            const insertTransactionQuery = `
                INSERT INTO transactions (user_id, contestant_id, paystack_reference, amount_ghs_pesewas, votes_added_usd, status, transaction_date)
                VALUES ($1, $2, $3, $4, $5, 'success', NOW())
                RETURNING *;
            `;
            await client.query(insertTransactionQuery, [
                userId,
                contestantId,
                reference,
                expectedAmountGHS, // The amount Paystack reported as paid in pesewas
                expectedAmountUSD, // The equivalent votes added (USD)
            ]);

            await client.query('COMMIT'); // Commit all changes in the transaction

            res.status(200).json({
                message: `Payment successful! ${expectedAmountUSD} vote(s) added for ${updatedContestant.name}.`,
                contestant: updatedContestant,
            });

        } catch (dbError) {
            await client.query('ROLLBACK'); // Rollback transaction if any DB error occurs
            console.error('Database operation failed during payment verification and vote update:', dbError);
            res.status(500).json({ message: 'Internal server error during vote update. Please contact support.' });
        } finally {
            client.release(); // Always release the client back to the pool
        }

    } catch (error) {
        console.error('Paystack verification or general server error:', error.response ? error.response.data : error.message);
        // Provide more specific error message based on Paystack response if possible
        if (error.response && error.response.data && error.response.data.message) {
            return res.status(400).json({ message: `Payment verification failed: ${error.response.data.message}` });
        }
        res.status(500).json({ message: 'Payment verification failed. Please try again or contact support.' });
    }
});

// --- Admin Reports Endpoints ---
// These endpoints provide administrative reports, accessible only to authenticated admin users.

// Fetch Top Candidates by Votes Report
app.get('/api/reports/top-candidates', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.id AS candidate_id, c.name AS candidate_name, p.title AS poll_name, c.votes AS total_votes_received
            FROM contestants c
            JOIN polls p ON c.poll_id = p.id -- Assuming a poll_id in contestants table
            ORDER BY c.votes DESC
            LIMIT 10; -- Adjust limit as needed
        `);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching top candidates report:", error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Fetch User Voting Activity Report
app.get('/api/reports/user-voting-activity', authenticateToken, isAdmin, async (req, res) => {
    try {
        // This query provides a summary of user activity, including paid amounts and free vote status.
        // It assumes `t.user_id` correctly links transactions to users.
        const result = await pool.query(`
            SELECT
                u.id AS user_id,
                u.username,
                u.email,
                u.role,
                COALESCE(SUM(CASE WHEN t.status = 'success' THEN t.amount_ghs_pesewas ELSE 0 END), 0) AS total_paid_amount_pesewas,
                -- You can convert total_paid_amount_pesewas to GHS in your frontend or here if needed
                u.last_free_vote_date,
                u.created_at AS user_registered_at
            FROM users u
            LEFT JOIN transactions t ON u.id = t.user_id
            GROUP BY u.id, u.username, u.email, u.role, u.created_at, u.last_free_vote_date
            ORDER BY u.created_at DESC;
        `);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching user voting activity report:", error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// --- General API Routes ---
// Basic route to check if the backend is running
app.get('/', (req, res) => {
    res.send('Backend is running and ready for action!');
});

// --- Error Handling Middleware ---
// Catches errors that occur in route handlers and sends a generic 500 response
app.use((err, req, res, next) => {
    console.error(err.stack); // Log the error stack for debugging
    res.status(500).send('Something broke on the server!');
});

// --- Start Server ---
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Access backend at http://localhost:${port}`);
});