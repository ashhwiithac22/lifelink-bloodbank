import axios from 'axios';

// CRITICAL: Debug the environment variables
console.log('=== ENVIRONMENT DEBUG ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('=========================');

// FORCE LOCALHOST FOR NOW
let API_URL = 'http://localhost:5000/api';
console.log('🌍 FORCING LOCALHOST:', API_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Increased timeout for email operations
});

// Request interceptor - Log all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request details
    console.log(`📡 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Log all responses
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response ${response.status}: ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Error Details:');
    console.error('Error Message:', error.message);
    console.error('Request URL:', error.config?.url);
    console.error('Status Code:', error.response?.status);
    console.error('Response Data:', error.response?.data);
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Test backend connection on startup
const testBackendConnection = async () => {
  try {
    console.log('🔧 Testing backend connection...');
    const response = await api.get('/health');
    console.log('✅ Backend connection successful:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Backend connection failed:', error.message);
    return false;
  }
};

// Run connection test
testBackendConnection();

// ========== AUTH API ==========
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

// ========== DONORS API ==========
export const donorsAPI = {
  getAll: (filters = {}) => api.get('/donors', { params: filters }),
  updateAvailability: (availability) => api.put('/donors/availability', { availability }),
  getProfile: () => api.get('/donors/profile'),
  getStats: () => api.get('/donors/stats'),
};

// ========== REQUESTS API ==========
export const requestsAPI = {
  create: (requestData) => api.post('/requests', requestData),
  getAll: (filters = {}) => api.get('/requests', { params: filters }),
  getAdminAll: (filters = {}) => api.get('/requests/admin/all', { params: filters }),
  updateStatus: (id, status) => api.put(`/requests/${id}`, { status }),
  getStats: () => api.get('/requests/stats'),
  search: (filters = {}) => api.get('/requests/search', { params: filters }),
  
  // Email functions - USE EXISTING ENDPOINTS
  sendToDonor: (data) => api.post('/requests/send-to-donor', data),
  sendBulkRequests: (data) => api.post('/requests/send-bulk', data),
  getHospitalDonorRequests: () => api.get('/requests/hospital/donor-requests'),
  getMyRequests: () => api.get('/requests/my-requests'),
  getDonorRequests: () => api.get('/requests/donor/my-requests'),
  getHospitalUniqueEmailRequests: () => api.get('/requests/hospital/unique-email-requests'),
  getEmailStatus: (requestId) => api.get(`/requests/email-status/${requestId}`),
  getRequests: () => api.get('/requests'),
};

// ========== INVENTORY API ==========
export const inventoryAPI = {
  // Gets simple array response
  getAll: () => {
    console.log('🩸 Fetching inventory...');
    return api.get('/inventory/simple')
      .then(response => {
        console.log('✅ Inventory data received:', response.data);
        return { data: Array.isArray(response.data) ? response.data : [] };
      })
      .catch(error => {
        console.error('❌ Inventory fetch error:', error);
        return { data: [] };
      });
  },
  
  getSimple: () => api.get('/inventory/simple'),
  getWithStats: () => api.get('/inventory/stats'),
  update: (data) => api.put('/inventory/update', data),
  adjust: (data) => api.put('/inventory/adjust', data),
  getStats: () => api.get('/inventory/stats'),
  getDashboardStats: () => api.get('/inventory/dashboard-stats'),
  getCriticalStocks: () => api.get('/inventory/critical'),
};

// ========== ADMIN API ==========
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: () => api.get('/admin/users'),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getRequests: () => api.get('/admin/requests'),
  getDashboardStats: () => api.get('/admin/dashboard-stats'),
  getUserCounts: () => api.get('/admin/user-counts'),
};

// ========== DONATIONS API ==========
export const donationsAPI = {
  create: (donationData) => api.post('/donations', donationData),
  getAll: (filters = {}) => api.get('/donations', { params: filters }),
  getStats: () => api.get('/donations/stats'),
};

// ========== ANALYTICS API ==========
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  exportData: (type) => api.get(`/analytics/export?type=${type}`),
};

// ========== EMAIL API - SIMPLIFIED ==========
export const emailAPI = {
  // Test email (already works!)
  sendTest: (email) => api.get(`/test-email?email=${email}`),
  
  // Custom email (use existing endpoint)
  sendCustom: (data) => api.post('/email/send-test', data),
  
  // Check config
  getConfig: () => api.get('/email-config'),
  
  // Health check
  healthCheck: () => api.get('/health/email'),
  
  // SIMPLE FUNCTION THAT WORKS
  sendBloodRequest: async (donorData) => {
    try {
      console.log('📧 Sending blood request via simple method...');
      
      // Option 1: Use the test endpoint with custom message
      const response = await api.post('/email/send-test', {
        to: donorData.email,
        subject: `🩸 Blood Request: ${donorData.bloodGroup} Needed`,
        message: `Dear ${donorData.name},\n\nWe need ${donorData.bloodGroup} blood urgently.\n\nPlease contact us if available.\n\nLifeLink Blood Bank`
      });
      
      return response;
    } catch (error) {
      console.error('Email send error:', error);
      throw error;
    }
  }
};

// ========== HEALTH API ==========
export const healthAPI = {
  check: () => api.get('/health'),
};

// Export the api instance for direct use
export { api };
export default api;