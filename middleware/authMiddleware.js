const jwt = require('jsonwebtoken');
const User = require('../models/User');
const BoothManager = require('../models/BoothManager');
const jwtConfig = require('../config/jwt');

// Middleware to protect routes - requires valid JWT
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Check if token exists in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // If no token found, return unauthorized
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token provided' });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, jwtConfig.secretKey);
      
      // Attach user to request object
      req.user = decoded;
      
      next();
    } catch (error) {
      console.error('JWT verification error:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error in auth middleware' });
  }
};

// Middleware to restrict routes to admin users only
exports.admin = async (req, res, next) => {
  try {
    // Get user from database to check current role
    // (since role might have changed since token was issued)
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user is admin or master
    if (user.role === 'admin' || user.role === 'master' || user.isAdmin === true) {
      next();
    } else {
      return res.status(403).json({ message: 'Not authorized as admin' });
    }
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ message: 'Server error in admin middleware' });
  }
};

// Middleware to restrict routes to master admin only
exports.masterAdmin = async (req, res, next) => {
  try {
    // Get user from database to check current role
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user is master admin
    if (user.role === 'master') {
      next();
    } else {
      return res.status(403).json({ message: 'Not authorized as master admin' });
    }
  } catch (error) {
    console.error('Master admin middleware error:', error);
    res.status(500).json({ message: 'Server error in master admin middleware' });
  }
};

// Middleware to restrict routes to booth managers only
exports.boothManager = async (req, res, next) => {
  try {
    // Get booth manager from database
    const boothManager = await BoothManager.findById(req.user.id);
    
    if (!boothManager) {
      return res.status(404).json({ message: 'Booth manager not found' });
    }
    
    // Check if user is a booth manager
    if (boothManager.role === 'boothManager' && boothManager.isActive) {
      next();
    } else {
      return res.status(403).json({ message: 'Not authorized as booth manager' });
    }
  } catch (error) {
    console.error('Booth manager middleware error:', error);
    res.status(500).json({ message: 'Server error in booth manager middleware' });
  }
}; 