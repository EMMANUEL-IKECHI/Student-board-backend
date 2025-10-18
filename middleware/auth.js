const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET;

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    // Format: 'Bearer TOKEN'
    const token = authHeader && authHeader.split(' ')[1]; 

    if (token == null) {
        return res.status(401).json({ message: "Authentication token required." });
    }

    jwt.verify(token, SECRET, (err, user) => {
        if (err) {
            // Token is invalid or expired
            return res.status(403).json({ message: "Invalid or expired token." });
        }
        req.user = user; // Attach payload to request
        next();
    });
};

module.exports = authenticateToken;