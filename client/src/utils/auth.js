// JWT token management utility

// Token storage keys
const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';

// Get token from localStorage
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

// Get refresh token from localStorage
export const getRefreshToken = () => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

// Save tokens to localStorage
export const setTokens = (token, refreshToken) => {
  let success = false;
  
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    success = true;
  }
  
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    success = true;
  }
  
  return success;
};

// Save token to localStorage
export const setToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    return true;
  }
  return false;
};

// Remove tokens from localStorage
export const removeTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// Alias for backward compatibility
export const removeToken = removeTokens;

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;
  
  // Additional check: verify token is not expired
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp > Date.now() / 1000;
  } catch (error) {
    console.error('Invalid token format:', error);
    removeToken();
    return false;
  }
};

// Get user info from token
export const getUserInfo = () => {
  const token = getToken();
  if (!token) return null;
  
  try {
    // Decode payload
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      exp: payload.exp,
      iat: payload.iat
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Set Authorization header for axios
export const setAuthHeader = (axios) => {
  const token = getToken();
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

export default {
  getToken,
  setToken,
  removeToken,
  isAuthenticated,
  getUserInfo,
  setAuthHeader
}; 