/**
 * JWT configuration settings
 * This centralizes all JWT related configuration
 */

module.exports = {
  // Secret key used to sign JWTs
  secretKey: process.env.JWT_SECRET || 'A2Qo3Vp8XcMz9DrBtEwS5FgHiJkLnR7Y', 
  
  // Token expiration time
  expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  
  // Options for token generation
  options: {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
    issuer: 'printify-api',
    audience: 'printify-client',
  },
  
  // Refresh token settings
  refreshToken: {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'
  }
}; 