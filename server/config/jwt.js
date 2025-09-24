/**
 * JWT configuration settings
 * This centralizes all JWT related configuration with security validation
 */

// Validate required environment variables
const validateEnvironment = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required for security');
  }
  
  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long for security');
  }
};

// Run validation on module load
validateEnvironment();

module.exports = {
  // Secret key used to sign JWTs - NO FALLBACK FOR SECURITY
  secretKey: process.env.JWT_SECRET,
  
  // Token expiration time
  expiresIn: process.env.JWT_EXPIRES_IN || '24h', // Reduced from 30d for better security
  
  // Options for token generation
  options: {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    issuer: 'printify-api',
    audience: 'printify-client',
    algorithm: 'HS256' // Explicitly specify algorithm
  },
  
  // Refresh token settings
  refreshToken: {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'
  }
}; 