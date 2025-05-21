const express = require('express');
const router = express.Router();
const printController = require('../controllers/printController');
const { handleUploadErrors } = require('../middleware/upload');
const { protect } = require('../middleware/authMiddleware');

// Public routes - no authentication required
router.get('/public/jobs/student/:studentId', printController.findPrintJobsByStudentId);
router.post('/public/jobs/:jobId/complete', printController.markPrintJobAsCompleted);
router.get('/public/view/:jobId', printController.viewPublicPDF);
router.post('/public/jobs/:jobId/print-now', printController.printJobNow);

// All routes below this line require authentication
router.use(protect);

// Upload PDF route
router.post('/upload', handleUploadErrors, printController.uploadPDF);

// Get all print jobs for current user
router.get('/jobs', printController.getUserPrintJobs);

// Get specific print job
router.get('/jobs/:jobId', printController.getPrintJob);

// Cancel a print job
router.post('/jobs/:jobId/cancel', printController.cancelPrintJob);

// Download a PDF file directly
router.get('/download/:jobId', printController.downloadPDF);

module.exports = router; 