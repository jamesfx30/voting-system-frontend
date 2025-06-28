const jwt = require('jsonwebtoken');
const db = require('../config/db'); // Import your PostgreSQL db client

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Fetch user from PostgreSQL
            // Important: Do NOT select the password field for security
            const userResult = await db.query('SELECT id, username, email FROM users WHERE id = $1', [decoded.id]);
            const user = userResult.rows[0];

            if (!user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            // Attach user to the request object
            req.user = user;

            next();
        } catch (error) {
            console.error('Not authorized, token failed:', error.message);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };