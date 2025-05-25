const express = require('express');
const router = express.Router();
const boothManagerController = require('../controllers/boothManagerController');
const { protect, admin, boothManager } = require('../middleware/authMiddleware');

// Public routes
router.post('/login', boothManagerController.loginBoothManager);

// Booth manager routes (accessible by booth managers themselves) - MUST come before /:id routes
router.get('/profile', protect, boothManager, boothManagerController.getBoothManagerProfile);
router.put('/paper-count', protect, boothManager, boothManagerController.updatePaperCount);

// Admin routes for managing booth managers
router.route('/')
  .get(protect, admin, boothManagerController.getAllBoothManagers)
  .post(protect, admin, boothManagerController.registerBoothManager);

// Parameterized routes MUST come after specific routes
router.route('/:id')
  .get(protect, admin, boothManagerController.getBoothManagerById)
  .put(protect, admin, boothManagerController.updateBoothManager)
  .delete(protect, admin, boothManagerController.deleteBoothManager);

module.exports = router; 