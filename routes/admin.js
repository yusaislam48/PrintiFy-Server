const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, admin, masterAdmin } = require('../middleware/authMiddleware');

// Protect all admin routes
router.use(protect);
router.use(admin);

// Dashboard statistics
router.get('/dashboard', adminController.getDashboardStats);

// User management
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.post('/users/:id/add-points', adminController.addPointsToUser);

// Print job management
router.get('/print-jobs', adminController.getAllPrintJobs);
router.get('/print-jobs/:id', adminController.getPrintJobById);
router.put('/print-jobs/:id/status', adminController.updatePrintJobStatus);
router.delete('/print-jobs/:id', adminController.deletePrintJob);

// Master admin routes (restricted to master admin role)
router.post('/create-master', masterAdmin, adminController.createMasterAdmin);

module.exports = router; 