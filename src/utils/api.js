import axios from 'axios';
import { getToken, setToken, removeToken, getRefreshToken, setTokens } from './auth';

// Create axios instance with the correct base URL
const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Flag to prevent multiple refreshes
let isRefreshing = false;
let failedQueue = [];

// Process the queue
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Add a request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`Making ${config.method.toUpperCase()} request to: ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    console.error('API Error:', error.message);
    
    const originalRequest = error.config;
    
    // If it's a 401 error (unauthorized) and not a /auth/refresh request
    // and the request hasn't been retried before
    if (error.response?.status === 401 && 
        !originalRequest._retry && 
        !originalRequest.url?.includes('/auth/refresh')) {
      
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        // Try to refresh the token
        const refreshToken = getRefreshToken();
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        const response = await axios.post('http://localhost:8080/api/auth/refresh', {
          refreshToken
        });
        
        const { accessToken } = response.data;
        
        // Save the new access token
        setToken(accessToken);
        
        // Update authorization header
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        // Process requests in queue
        processQueue(null, accessToken);
        
        // Return the original request with new token
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh token failed, clear tokens and redirect to login
        console.error('Token refresh failed:', refreshError);
        processQueue(refreshError, null);
        removeToken();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received', error.request);
    }
    
    return Promise.reject(error);
  }
);

// Authentication API calls
export const authAPI = {
  // Register a new user
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      // Save tokens
      if (response.data.token && response.data.refreshToken) {
        setTokens(response.data.token, response.data.refreshToken);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      // Save tokens
      if (response.data.token && response.data.refreshToken) {
        setTokens(response.data.token, response.data.refreshToken);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  // Get current user profile
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get user data' };
    }
  },

  // Logout user
  logout: () => {
    removeToken();
  }
};

// User API calls
export const userAPI = {
  // Get all users (admin only)
  getAllUsers: async () => {
    try {
      const response = await api.get('/users');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get users' };
    }
  },

  // Get user by ID
  getUserById: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get user' };
    }
  },

  // Update user
  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(`/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update user' };
    }
  },

  // Delete user (admin only)
  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete user' };
    }
  },
};

export default api; 