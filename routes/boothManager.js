const express = require('express');
const router = express.Router();
const boothManagerController = require('../controllers/boothManagerController');
const { protect, admin, boothManager } = require('../middleware/authMiddleware');

// Public routes
router.post('/login', boothManagerController.loginBoothManager);

// Admin routes for managing booth managers
router.route('/')
  .get(protect, admin, boothManagerController.getAllBoothManagers)
  .post(protect, admin, boothManagerController.registerBoothManager);

router.route('/:id')
  .get(protect, admin, boothManagerController.getBoothManagerById)
  .put(protect, admin, boothManagerController.updateBoothManager)
  .delete(protect, admin, boothManagerController.deleteBoothManager);

// Booth manager routes (accessible by booth managers themselves)
router.get('/profile', protect, boothManager, boothManagerController.getBoothManagerProfile);
router.put('/paper-count', protect, boothManager, boothManagerController.updatePaperCount);

module.exports = router; 