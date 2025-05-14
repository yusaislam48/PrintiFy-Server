const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'pdf-' + uniqueSuffix + path.extname(file.originalname));
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
  fileSize: 10 * 1024 * 1024 // 10 MB
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
          message: 'File size is too large. Maximum size is 10 MB.' 
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