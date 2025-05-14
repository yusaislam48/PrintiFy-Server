const express = require('express');
const router = express.Router();
const { register, login, getCurrentUser, refreshToken } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Register new user
router.post('/register', register);

// Login user
router.post('/login', login);

// Refresh token
router.post('/refresh', refreshToken);

// Get current user (protected route)
router.get('/me', protect, getCurrentUser);

module.exports = router; 