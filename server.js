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
const { cleanupExpiredFiles } = require('./controllers/printController');
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

// Setup automatic file cleanup - runs every hour
const cleanupInterval = setInterval(() => {
  console.log('Running scheduled file cleanup...');
  cleanupExpiredFiles();
}, 60 * 60 * 1000); // 1 hour in milliseconds

// Cleanup on server startup
console.log('Running initial file cleanup...');
cleanupExpiredFiles();

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Automatic file cleanup scheduled every hour');
  
  // Create initial admin account
  createInitialAdmin();
});

module.exports = app; 