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
      // Save tokens if they exist (no tokens for unverified users)
      if (response.data.token && response.data.refreshToken) {
        setTokens(response.data.token, response.data.refreshToken);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  },

  // Verify email with code
  verify: async (verificationData) => {
    try {
      console.log('Verifying email with data:', verificationData);
      
      // Ensure code is a string and trimmed
      if (verificationData.code) {
        verificationData.code = verificationData.code.toString().trim();
      }
      
      const response = await api.post('/auth/verify', verificationData);
      console.log('Verification API response:', response.data);
      
      // Save tokens after successful verification
      if (response.data.token && response.data.refreshToken) {
        setTokens(response.data.token, response.data.refreshToken);
      }
      return response.data;
    } catch (error) {
      console.error('Verification error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },

  // Resend verification code
  resendVerification: async (emailData) => {
    try {
      console.log('Resending verification to:', emailData.email);
      const response = await api.post('/auth/resend-verification', emailData);
      console.log('Resend verification response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Resend verification error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
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

  // Get current user data
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return {
        id: response.data._id,
        name: response.data.name,
        email: response.data.email,
        studentId: response.data.studentId,
        role: response.data.role,
        phone: response.data.phone,
        profilePicture: response.data.profilePicture,
        points: response.data.points || 0, // Include points in user data
        isVerified: response.data.isVerified
      };
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get user data' };
    }
  },

  // Logout user
  logout: () => {
    removeToken();
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const response = await api.post('/auth/change-password', passwordData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to change password' };
    }
  },

  // Reset password
  resetPassword: async (resetData) => {
    try {
      const response = await api.post('/auth/reset-password', resetData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to reset password' };
    }
  },
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

  // Get user's print history
  getUserHistory: async (page = 1, limit = 10) => {
    try {
      const response = await api.get(`/users/history?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get user history' };
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

// Print API calls
export const printAPI = {
  // Upload PDF file to Cloudinary with print settings
  uploadPDF: async (formData, onUploadProgress) => {
    try {
      // Create a custom instance for file upload with multipart/form-data
      const uploadInstance = axios.create({
        baseURL: 'http://localhost:8080/api',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${getToken()}`
        }
      });
      
      const response = await uploadInstance.post('/print/upload', formData, {
        onUploadProgress
      });
      
      return response.data;
    } catch (error) {
      console.error('PDF Upload Error:', error);
      throw error.response?.data || { message: 'Failed to upload PDF' };
    }
  },
  
  // Get all print jobs for current user
  getUserPrintJobs: async () => {
    try {
      const response = await api.get('/print/jobs');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get print jobs' };
    }
  },
  
  // Get a specific print job
  getPrintJob: async (jobId) => {
    try {
      const response = await api.get(`/print/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get print job' };
    }
  },
  
  // Cancel a print job
  cancelPrintJob: async (jobId) => {
    try {
      const response = await api.post(`/print/jobs/${jobId}/cancel`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to cancel print job' };
    }
  },
  
  // Download a PDF file directly
  downloadPDF: async (jobId) => {
    try {
      const response = await api.get(`/print/download/${jobId}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('PDF Download Error:', error);
      throw error.response?.data || { message: 'Failed to download PDF' };
    }
  }
};

// Utility function to handle API errors
const handleApiError = (error) => {
  if (error.response) {
    // The server responded with an error status
    return error.response.data || { message: 'Server error occurred' };
  } else if (error.request) {
    // The request was made but no response was received
    return { message: 'No response from server. Please check your connection.' };
  } else {
    // Something else happened in setting up the request
    return { message: error.message || 'An error occurred' };
  }
};

// Print Hub API calls (admin/staff endpoints)
export const printHubAPI = {
  // Find print jobs by student ID or RFID Card Number
  findPrintJobsByStudentId: async (searchValue) => {
    try {
      const response = await api.get(`/print/public/jobs/student/${searchValue}`);
      return {
        studentName: response.data.studentName,
        pendingPrintJobs: response.data.pendingPrintJobs,
        userPoints: response.data.userPoints || 0 // Include user points in response
      };
    } catch (error) {
      throw error;
    }
  },

  // Mark a print job as completed
  markPrintJobAsCompleted: async (jobId) => {
    try {
      const response = await api.post(`/print/public/jobs/${jobId}/complete`);
      return {
        message: response.data.message,
        printJob: response.data.printJob,
        user: response.data.user // Will include updated user points
      };
    } catch (error) {
      throw error;
    }
  },
  
  // Print a job directly on the default printer
  printNow: async (jobId) => {
    try {
      const response = await api.post(`/print/public/jobs/${jobId}/print-now`);
      return {
        message: response.data.message,
        printJob: response.data.printJob,
        user: response.data.user // Will include updated user points
      };
    } catch (error) {
      throw error;
    }
  },
  
  // Get direct PDF view URL
  getDirectPdfUrl: (jobId) => {
    if (!jobId) {
      console.error('Missing job ID for PDF view URL');
      return '';
    }
    console.log(`Creating direct PDF URL for job: ${jobId}`);
    // Add a timestamp parameter to prevent caching
    return `http://localhost:8080/api/print/public/view/${jobId}?t=${Date.now()}`;
  },

  // Test PDF view URL directly
  testPdfViewEndpoint: async (jobId) => {
    if (!jobId) {
      console.error('Missing job ID for PDF test');
      return { success: false, message: 'Missing job ID' };
    }
    
    try {
      const url = `http://localhost:8080/api/print/public/view/${jobId}`;
      console.log(`Testing PDF URL: ${url}`);
      
      // Make a HEAD request first to check if the endpoint is accessible
      const response = await axios.head(url);
      return { 
        success: true, 
        status: response.status,
        message: 'PDF endpoint is working'
      };
    } catch (error) {
      console.error('PDF endpoint test failed:', error);
      return { 
        success: false, 
        status: error.response?.status,
        message: error.message,
        details: error.response?.data || 'No details available'
      };
    }
  }
};

// Admin API calls
export const adminAPI = {
  // Dashboard statistics
  getDashboardStats: async () => {
    try {
      const response = await api.get('/admin/dashboard');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get dashboard stats' };
    }
  },

  // Get system history with pagination and filters
  getSystemHistory: async (page = 1, limit = 10, type = 'all') => {
    try {
      const response = await api.get(`/admin/history?page=${page}&limit=${limit}&type=${type}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get system history' };
    }
  },

  // Get all users with pagination
  getAllUsers: async (page = 1, limit = 10, options = {}) => {
    try {
      // Build query parameters
      const params = {
        page,
        limit,
      };
      
      // Add search parameter if provided
      if (options.search) {
        params.search = options.search;
      }
      
      // Add filter parameters if provided
      if (options.role) {
        params.role = options.role;
      }
      
      if (options.verified !== undefined) {
        params.verified = options.verified;
      }
      
      // Convert params object to query string
      const queryString = new URLSearchParams(params).toString();
      
      const response = await api.get(`/admin/users?${queryString}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get users' };
    }
  },

  // Get user by ID
  getUserById: async (userId) => {
    try {
      const response = await api.get(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get user' };
    }
  },

  // Update user
  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(`/admin/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update user' };
    }
  },

  // Delete user
  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete user' };
    }
  },

  // Add points to user
  addPointsToUser: async (userId, points) => {
    try {
      const response = await api.post(`/admin/users/${userId}/add-points`, { points });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to add points to user' };
    }
  },

  // Get all print jobs with pagination and filters
  getAllPrintJobs: async (page = 1, limit = 10, filters = {}) => {
    try {
      // Build query string from filters
      const queryParams = new URLSearchParams({
        page,
        limit,
        ...filters
      }).toString();
      
      const response = await api.get(`/admin/print-jobs?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get print jobs' };
    }
  },

  // Get print job by ID
  getPrintJobById: async (jobId) => {
    try {
      const response = await api.get(`/admin/print-jobs/${jobId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get print job' };
    }
  },

  // Update print job status
  updatePrintJobStatus: async (jobId, status) => {
    try {
      const response = await api.put(`/admin/print-jobs/${jobId}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update print job status' };
    }
  },

  // Delete print job
  deletePrintJob: async (jobId) => {
    try {
      const response = await api.delete(`/admin/print-jobs/${jobId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete print job' };
    }
  },

  // Create master admin
  createMasterAdmin: async (adminData) => {
    try {
      const response = await api.post('/admin/create-master', adminData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create master admin' };
    }
  },
};

export default api; 