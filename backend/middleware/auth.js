const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
    // Get token from Authorization header
    // Format: "Bearer TOKEN_HERE"
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Get token after "Bearer "

    // Check if token exists
    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Add user info to request object
        req.user = decoded; // Contains: { userId, email, role }
        
        // Continue to the route handler
        next();
        
    } catch (error) {
        // Token is invalid or expired
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
}

module.exports = { authenticateToken };