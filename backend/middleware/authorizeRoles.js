// middleware/authorizeRoles.js
module.exports = (...allowedRoles) => { // Takes roles as arguments, e.g., authorizeRoles('admin', 'contestant')
    return (req, res, next) => {
        // Ensure req.user (from authMiddleware) exists and has a role
        if (!req.user || !req.user.role) {
            // This scenario should ideally not happen if authMiddleware runs first
            return res.status(403).json({ message: 'Access denied. No user role found.' });
        }

        // Check if the user's role is included in the list of allowed roles for this route
        const hasPermission = allowedRoles.includes(req.user.role);
        if (!hasPermission) {
            return res.status(403).json({ message: 'Access denied. Insufficient role.' });
        }

        next(); // User has the required role, proceed to the route handler
    };
};