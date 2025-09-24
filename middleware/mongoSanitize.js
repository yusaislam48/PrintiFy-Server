/**
 * Custom MongoDB Injection Protection Middleware
 * Safer implementation that doesn't conflict with Express request parsing
 */

const customMongoSanitize = (options = {}) => {
  const { replaceWith = '_', logAttempts = true } = options;

  return (req, res, next) => {
    try {
      // Function to recursively sanitize object
      const sanitizeObject = (obj, path = '') => {
        if (!obj || typeof obj !== 'object') return obj;

        const sanitized = Array.isArray(obj) ? [] : {};
        
        for (let key in obj) {
          if (obj.hasOwnProperty(key)) {
            let newKey = key;
            let value = obj[key];
            let currentPath = path ? `${path}.${key}` : key;
            
            // Check for MongoDB injection patterns in key
            if (typeof key === 'string' && (key.startsWith('$') || key.includes('.'))) {
              if (logAttempts) {
                console.warn(`🚨 MongoDB Injection Attempt: ${req.ip} - Field: ${currentPath} - Key: ${key}`);
              }
              newKey = key.replace(/^\$+|\.+/g, replaceWith);
            }
            
            // Check for MongoDB injection patterns in value
            if (typeof value === 'string' && (value.includes('$') || value.includes('.'))) {
              // Only sanitize if it looks like an injection attempt
              if (value.match(/\$\w+/) || value.match(/\.\$/)) {
                if (logAttempts) {
                  console.warn(`🚨 MongoDB Injection Attempt: ${req.ip} - Field: ${currentPath} - Value: ${value}`);
                }
                value = value.replace(/\$\w+|\.\$/g, replaceWith);
              }
            }
            
            // Recursively sanitize nested objects
            if (value && typeof value === 'object') {
              value = sanitizeObject(value, currentPath);
            }
            
            sanitized[newKey] = value;
          }
        }
        
        return sanitized;
      };

      // Sanitize different parts of the request
      if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body, 'body');
      }
      
      if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObject(req.query, 'query');
      }
      
      if (req.params && typeof req.params === 'object') {
        req.params = sanitizeObject(req.params, 'params');
      }

      next();
    } catch (error) {
      console.error('MongoDB sanitization error:', error);
      next(); // Continue even if sanitization fails
    }
  };
};

module.exports = customMongoSanitize;
