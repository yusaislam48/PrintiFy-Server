// Test comment for pushing to the server repository - Updated
const dotenv = require('dotenv');

// Load environment variables FIRST before any other imports
dotenv.config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const compression = require('compression');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const printRoutes = require('./routes/print');
const adminRoutes = require('./routes/admin');
const boothManagerRoutes = require('./routes/boothManager');
const { secureErrorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { cleanupExpiredFiles } = require('./controllers/printController');
const customMongoSanitize = require('./middleware/mongoSanitize');
const axios = require('axios');

// Connect to MongoDB
connectDB();

// Create Express app
const app = express();

// Security Headers with Helmet.js
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https://api.cloudinary.com"],
      uploadSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for file uploads
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
}));

// Response compression
app.use(compression());

// HTTP Parameter Pollution protection  
app.use(hpp({
  whitelist: ['tags', 'categories'], // Allow arrays for specific fields
  checkBody: false, // Don't check body parameters to avoid conflicts
  checkQuery: true   // Only check query parameters
}));

// Secure CORS configuration - explicitly list all allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  ...(process.env.NODE_ENV === 'production' ? [
    'https://printi-fy-client.vercel.app',
    'https://printify-server-production.up.railway.app'
  ] : [])
];

// Security: Log and block unauthorized origins
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin only in development (like Postman, curl)
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS BLOCKED: Unauthorized origin attempted access: ${origin}`);
      callback(new Error(`CORS policy violation: Origin ${origin} is not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count'], // For pagination
  maxAge: 86400, // Cache preflight for 24 hours
  optionsSuccessStatus: 200 // For legacy browser support
}));

// Security middleware for request body size limits
app.use(express.json({ limit: '10mb' })); // Limit JSON payload size
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 1000 // Limit number of parameters
}));

// Custom MongoDB injection protection (safe implementation)
app.use(customMongoSanitize({
  replaceWith: '_',
  logAttempts: true
}));

// Dynamic rate limiting configuration for clustered environment
const os = require('os');
const numCPUs = os.cpus().length;
const workerCount = process.env.WORKER_COUNT ? parseInt(process.env.WORKER_COUNT) : Math.min(2, numCPUs);

// Scale rate limits based on cluster size for optimal VPS utilization
const baseRateLimit = 100;
const clusterMultiplier = Math.max(1, workerCount);
const dynamicRateLimit = Math.floor(baseRateLimit * clusterMultiplier);

console.log(`⚡ Rate Limiting Configuration:`);
console.log(`   └─ Workers: ${workerCount}`);
console.log(`   └─ Rate Limit: ${dynamicRateLimit} requests/15min per IP`);

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: dynamicRateLimit, // Dynamic limit based on cluster size
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes',
    limit: dynamicRateLimit,
    workers: workerCount
  },
  standardHeaders: true, // Return rate limit info in the `RateLimitInfo` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    console.warn(`🚨 Rate Limit Exceeded: ${req.ip} - ${req.method} ${req.originalUrl} (Limit: ${dynamicRateLimit})`);
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes',
      limit: dynamicRateLimit,
      workers: workerCount
    });
  }
});

// Strict rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful requests
});

// Progressive delay for repeated requests
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per windowMs without delay
  delayMs: () => 500, // Add 500ms delay per request after delayAfter
  validate: { delayMs: false } // Disable warning
});

// Apply rate limiting
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/verify', authLimiter);
app.use(generalLimiter);
app.use(speedLimiter);

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

// Error handling middleware (must be after routes)
app.use(notFoundHandler);
app.use(secureErrorHandler);

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