/**
 * Secure Error Handling Middleware
 * Prevents sensitive information from being exposed in API responses
 */

const secureErrorHandler = (err, req, res, next) => {
  console.error('🚨 Server Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Default error response
  let error = {
    message: 'Internal Server Error',
    status: 500
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    // Mongoose validation errors
    error = {
      message: 'Validation failed',
      status: 400,
      details: Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message
      }))
    };
  } else if (err.code === 11000) {
    // MongoDB duplicate key error
    const field = Object.keys(err.keyValue)[0];
    error = {
      message: `${field} already exists`,
      status: 400
    };
  } else if (err.name === 'JsonWebTokenError') {
    error = {
      message: 'Invalid token',
      status: 401
    };
  } else if (err.name === 'TokenExpiredError') {
    error = {
      message: 'Token expired',
      status: 401
    };
  } else if (err.name === 'CastError') {
    error = {
      message: 'Invalid ID format',
      status: 400
    };
  } else if (err.status && err.status < 500) {
    // Client errors (4xx) - safe to expose message
    error = {
      message: err.message,
      status: err.status
    };
  } else if (process.env.NODE_ENV === 'development') {
    // In development, show more details
    error = {
      message: err.message,
      status: err.status || 500,
      stack: err.stack
    };
  }

  // Security headers for error responses
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
  });

  res.status(error.status).json({
    error: true,
    message: error.message,
    ...(error.details && { details: error.details }),
    ...(error.stack && process.env.NODE_ENV === 'development' && { stack: error.stack }),
    timestamp: new Date().toISOString()
  });
};

// Handle 404 errors
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

module.exports = {
  secureErrorHandler,
  notFoundHandler
};
