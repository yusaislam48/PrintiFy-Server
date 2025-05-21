const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getCurrentUser, 
  refreshToken, 
  verifyEmail, 
  resendVerification,
  createTestUser,
  resetPassword,
  changePassword
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Register new user
router.post('/register', register);

// Login user
router.post('/login', login);

// Verify user email
router.post('/verify', verifyEmail);

// Resend verification code
router.post('/resend-verification', resendVerification);

// Refresh token
router.post('/refresh', refreshToken);

// Reset password (for fixing users with broken passwords)
router.post('/reset-password', resetPassword);

// Change password (protected route)
router.post('/change-password', protect, changePassword);

// Get current user (protected route)
router.get('/me', protect, getCurrentUser);

// Create test user (DEVELOPMENT ONLY)
router.post('/test-create-user', createTestUser);

module.exports = router; 