const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db'); // Your database connection pool

// --- Register Route ---
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    // 1. Basic input validation
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Please enter all fields.' });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format.' });
    }

    // Password strength (minimum 6 characters recommended)
    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const saltRounds = 10; // Cost factor for bcrypt hashing

    let client; // Database client for transaction
    try {
        client = await db.getClient();
        await client.query('BEGIN'); // Start a database transaction for atomicity

        // 2. Check if user already exists (by email or username)
        const existingUser = await client.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
        if (existingUser.rows.length > 0) {
            await client.query('ROLLBACK'); // Rollback transaction if user exists
            return res.status(409).json({ message: 'User with that email or username already exists.' });
        }

        // 3. Hash the password before storing it
        const password_hash = await bcrypt.hash(password, saltRounds);

        // 4. Insert new user into the database
        const result = await client.query(
            'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
            [username, email, password_hash, 'user'] // Default role 'user'
        );

        const user = result.rows[0]; // Get the newly created user's data

        // --- DEBUG LOGS FOR REGISTER ---
        console.log('DEBUG (Backend Register): User object created from DB:');
        console.log(user);
        console.log('DEBUG (Backend Register): User Role:', user.role);
        // --- END DEBUG LOGS ---

        // 5. Generate a JSON Web Token (JWT) for the new user
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role }, // Payload: user ID, email, and role
            process.env.JWT_SECRET,            // Secret key from environment variables
            { expiresIn: '3m' } // Changed to 3 minutes for testing
        );

        await client.query('COMMIT'); // Commit the transaction if all steps are successful

        // 6. Send success response with token and user info
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        if (client) await client.query('ROLLBACK'); // Rollback transaction if any error occurs
        console.error('Error registering user:', error.message);
        res.status(500).json({ message: 'Server error during registration.' });
    } finally {
        if (client) client.release(); // Always release the client back to the pool
    }
});

// --- Login Route ---
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    console.log('\n--- LOGIN ATTEMPT ---');
    console.log('1. Received Request Body:');
    console.log('    Email:', email);
    console.log('    Password (length):', password ? password.length : 'N/A');
    console.log('    Password (first 3 chars):', password ? password.substring(0, 3) + '...' : 'N/A');
    console.log('---');

    // 1. Validate input: Ensure email and password are provided
    if (!email || !password) {
        console.log('2. Validation Failed: Missing email or password.');
        return res.status(400).json({ message: 'Please enter both email and password.' });
    }

    let client;
    try {
        client = await db.getClient();

        // 2. Find user by email in the database
        console.log('3. Querying DB for user with email:', email);
        const userResult = await client.query('SELECT id, username, email, password_hash, role FROM users WHERE email = $1', [email]);

        // 3. Check if user exists
        if (userResult.rows.length === 0) {
            console.log('4. User Not Found for email:', email);
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const user = userResult.rows[0];
        // --- DEBUG LOGS FOR LOGIN ---
        console.log('DEBUG (Backend Login): User object retrieved from DB:');
        console.log(user); // This will show the entire user object
        console.log('DEBUG (Backend Login): User Role from DB:', user.role);
        // --- END DEBUG LOGS ---

        console.log('4. User Found. DB Hashed Password:', user.password_hash ? user.password_hash.substring(0, 10) + '...' : 'N/A');

        // 4. Compare the provided plain-text password with the stored hashed password
        const isMatch = await bcrypt.compare(password, user.password_hash);

        console.log('5. Password Comparison Result (bcrypt.compare):', isMatch);

        // 5. Check if passwords match
        if (!isMatch) {
            console.log('6. Passwords DO NOT match. Denying access.');
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // 6. If credentials are valid, generate a JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role }, // Ensuring email and role are in the token
            process.env.JWT_SECRET,
            { expiresIn: '3m' } // Changed to 3 minutes for testing
        );

        console.log('7. Login Successful. Generating token.');
        res.status(200).json({
            message: 'Logged in successfully',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login Error:', error.message);
        res.status(500).json({ message: 'Server error during login.' });
    } finally {
        if (client) client.release();
    }
});

module.exports = router;