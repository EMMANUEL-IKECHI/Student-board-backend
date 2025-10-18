const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET; // Uses the secret from your .env file

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    // Expected format: 'Bearer TOKEN'
    const token = authHeader && authHeader.split(' ')[1]; 

    if (token == null) {
        // No token provided in the header
        return res.status(401).json({ message: "Authentication token required." });
    }

    jwt.verify(token, SECRET, (err, user) => {
        if (err) {
            // Token is invalid, expired, or tampered with
            return res.status(403).json({ message: "Invalid or expired token." });
        }
        // Token is valid. Attach the payload (user info) to the request
        req.user = user; 
        next();
    });
};

module.exports = authenticateToken;