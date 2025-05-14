const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate JWT token
 * Checks if token is valid and sets user info in request
 */
const authenticateToken = (req, res, next) => {
  // Get auth header
  const authHeader = req.headers['authorization'];
  // Token format: "Bearer TOKEN"
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }
  
  try {
    const secret = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secret);
    
    // Add user info to request
    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT verification error:', error.message);
    return res.status(403).json({ message: 'Invalid token.' });
  }
};

module.exports = { authenticateToken }; 