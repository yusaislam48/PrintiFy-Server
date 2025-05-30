// Test comment for pushing to the server repository - Updated
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const printRoutes = require('./routes/print');
const adminRoutes = require('./routes/admin');
const boothManagerRoutes = require('./routes/boothManager');
const { cloudinary } = require('./config/cloudinary');
const axios = require('axios');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Create Express app
const app = express();

// CORS configuration - explicitly list all allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173', 
  'https://printi-fy-client.vercel.app',
  'https://printify-server-production.up.railway.app'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      // Still allow the request to go through for development/debugging
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add CORS headers to all responses
app.use((req, res, next) => {
  const origin = req.headers.origin;
  // Instead of wildcard '*', use the actual origin if it's allowed
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', 'https://printi-fy-client.vercel.app');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} at ${new Date().toISOString()}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/print', printRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/booth-managers', boothManagerRoutes);

// PDF Proxy route - handles /pdf-proxy/* requests
app.get('/pdf-proxy/:cloud_name/raw/upload/:file_path', async (req, res) => {
  try {
    const { cloud_name, file_path } = req.params;
    const isDownload = req.query.download === 'true';
    
    console.log(`PDF Proxy request: cloud_name=${cloud_name}, file_path=${file_path}, download=${isDownload}`);
    
    if (!cloud_name || !file_path) {
      console.error('Missing parameters in PDF proxy request');
      return res.status(400).json({ message: 'Missing parameters' });
    }
    
    // Construct a cloudinary URL for viewing
    const rawFilePath = file_path.endsWith('.pdf.pdf') 
      ? file_path.replace(/\.pdf\.pdf$/, '.pdf')  // Fix double extension
      : file_path;

    const publicId = `printify/pdfs/${rawFilePath.replace(/\.pdf$/, '')}`;
    console.log(`Constructed public ID: ${publicId}`);
    
    // Create URL options for better PDF accessibility
    const viewOptions = {
      resource_type: 'raw',
      type: 'upload',
      flags: isDownload ? 'attachment' : 'attachment:false',  // Force download if requested
      disposition: isDownload ? 'attachment' : 'inline',      // Display in browser or download
      secure: true,
    };
    
    // Make sure the public ID has the correct extension
    const finalPublicId = publicId.endsWith('.pdf') ? publicId : `${publicId}.pdf`;
    const pdfUrl = cloudinary.url(finalPublicId, viewOptions);
    console.log(`Generated Cloudinary URL: ${pdfUrl}`);
    
    try {
      // First check if the PDF exists with a HEAD request
      await axios({
        url: pdfUrl,
        method: 'HEAD',
        timeout: 5000
      });
      
      // Fetch and stream the PDF from Cloudinary
      const response = await axios({
        url: pdfUrl,
        method: 'GET',
        responseType: 'stream',
        timeout: 15000 // 15 second timeout
      });
      
      // Set appropriate headers
      res.setHeader('Content-Type', 'application/pdf');
      
      // Set content disposition based on download flag
      if (isDownload) {
        const fileName = file_path.split('_').slice(1).join('_');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName || 'document.pdf'}"`);
      } else {
        res.setHeader('Content-Disposition', 'inline');
      }
      
      // Add CORS headers to avoid browser restrictions
      const origin = req.headers.origin;
      if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      } else {
        res.setHeader('Access-Control-Allow-Origin', 'https://printi-fy-client.vercel.app');
      }
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      
      // Log success
      console.log(`Successfully streaming PDF: ${publicId}`);
      
      // Pipe the PDF data directly to the response
      response.data.pipe(res);
    } catch (fetchError) {
      console.error('Failed to fetch PDF from Cloudinary:', fetchError.message);
      
      if (fetchError.response) {
        const statusCode = fetchError.response.status;
        console.error(`Cloudinary returned status code: ${statusCode}`);
        
        if (statusCode === 404) {
          return res.status(404).json({ message: 'PDF file not found in cloud storage' });
        }
      }
      
      return res.status(500).json({ 
        message: 'Error fetching PDF from cloud storage',
        error: fetchError.message
      });
    }
  } catch (error) {
    console.error('PDF proxy general error:', error);
    res.status(500).json({ 
      message: 'Error processing PDF request',
      error: error.message
    });
  }
});

// Home route
app.get('/', (req, res) => {
  res.send('PrintiFy API is running');
});

// CORS test page
app.get('/cors-test', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  try {
    const filePath = path.join(__dirname, 'cors-test.html');
    const content = fs.readFileSync(filePath, 'utf8');
    
    res.setHeader('Content-Type', 'text/html');
    res.send(content);
  } catch (error) {
    console.error('Error serving CORS test page:', error);
    res.status(500).send('Error loading CORS test page');
  }
});

// Create initial master admin account if it doesn't exist
const createInitialAdmin = async () => {
  try {
    const User = require('./models/User');
    
    // Check if any master admin exists
    const adminExists = await User.findOne({ role: 'master' });
    
    if (!adminExists) {
      console.log('No master admin found. Creating initial master admin account...');
      
      // Create a master admin with default credentials
      const masterAdmin = new User({
        name: 'Master Admin',
        email: 'admin@printify.com',
        password: 'admin123',  // Will be hashed by pre-save hook
        studentId: '0000000',
        phone: '00000000000',
        role: 'master',
        isAdmin: true,
        isVerified: true,
        points: 999999
      });
      
      await masterAdmin.save();
      
      console.log('Initial master admin created successfully.');
      console.log('Email: admin@printify.com');
      console.log('Password: admin123');
      console.log('Please change these credentials after first login!');
    } else {
      console.log('Master admin account already exists.');
    }
  } catch (error) {
    console.error('Error creating initial admin:', error);
  }
};

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: 'Something went wrong!', error: err.message });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Create initial admin account
  createInitialAdmin();
});

module.exports = app; 