const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create storage directories
const uploadsDir = path.join(__dirname, '../uploads'); // temporary uploads
const storageDir = path.join(__dirname, '../storage/pdfs'); // permanent storage

// Ensure directories exist
[uploadsDir, storageDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Helper function to create organized storage path
const getStoragePath = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const datePath = path.join(storageDir, String(year), month, day);
  
  if (!fs.existsSync(datePath)) {
    fs.mkdirSync(datePath, { recursive: true });
  }
  
  return datePath;
};

// Configure storage for permanent files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, getStoragePath());
  },
  filename: function (req, file, cb) {
    const userId = req.user?.id || 'anonymous';
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E9);
    const filename = `${userId}_${timestamp}_${randomSuffix}.pdf`;
    cb(null, filename);
  }
});

// File filter for PDFs
const fileFilter = (req, file, cb) => {
  // Accept only PDF files
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

// Set size limits
const limits = {
  fileSize: 25 * 1024 * 1024 // 25 MB for VPS
};

// Create upload middleware
const upload = multer({
  storage,
  fileFilter,
  limits
});

// Upload middleware for PDF files
const uploadPDF = upload.single('pdfFile');

// Error handling middleware for multer
const handleUploadErrors = (req, res, next) => {
  uploadPDF(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          message: 'File size is too large. Maximum size is 25 MB.' 
        });
      }
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      // An unknown error occurred
      return res.status(400).json({ message: err.message });
    }
    // Everything went fine
    next();
  });
};

module.exports = { handleUploadErrors };