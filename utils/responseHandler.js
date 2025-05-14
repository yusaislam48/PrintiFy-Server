/**
 * Standard success response
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {object|array} data - Data to send back
 */
exports.success = (res, statusCode = 200, message = 'Success', data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Standard error response
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {object} error - Error details
 */
exports.error = (res, statusCode = 500, message = 'Server Error', error = null) => {
  // Log the error for server-side debugging
  if (error) {
    console.error(`Error: ${message}`, error);
  }
  
  const response = {
    success: false,
    message
  };
  
  // Only include error details in non-production environments
  if (process.env.NODE_ENV !== 'production' && error) {
    response.error = error.toString();
  }
  
  return res.status(statusCode).json(response);
}; 