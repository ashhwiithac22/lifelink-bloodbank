import axios from 'axios';

// CRITICAL: Debug the environment variables
console.log('=== ENVIRONMENT DEBUG ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('=========================');

// Determine the correct API URL
let API_URL;

if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  // Local development
  API_URL = 'http://localhost:5000/api';
  console.log('🌍 Detected: Local development environment');
} else {
  // Production (Vercel/Render)
  API_URL = 'https://lifelink-bloodbank-4gxu.onrender.com/api';
  console.log('🌍 Detected: Production environment');
}

// Override with environment variable if set
if (process.env.REACT_APP_API_URL) {
  API_URL = process.env.REACT_APP_API_URL;
  console.log('🔄 Overriding with REACT_APP_API_URL:', API_URL);
}

console.log('🔗 FINAL API URL:', API_URL);
console.log('🔗 Full login URL will be:', `${API_URL}/auth/login`);

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
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
    // Log detailed error information
    console.error('❌ API Error Details:');
    console.error('Error Message:', error.message);
    console.error('Error Code:', error.code);
    console.error('Request URL:', error.config?.url);
    console.error('Full Request URL:', error.config?.baseURL + error.config?.url);
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

// Auth API
export const authAPI = {
  login: (credentials) => {
    console.log('🔑 Login attempt with:', credentials.email);
    return api.post('/auth/login', credentials);
  },
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

// Donors API
export const donorsAPI = {
  getAll: (filters = {}) => api.get('/donors', { params: filters }),
  updateAvailability: (availability) => api.put('/donors/availability', { availability }),
  getProfile: () => api.get('/donors/profile'),
  getStats: () => api.get('/donors/stats'),
};

// REQUESTS API - FIXED WITH ALL MISSING FUNCTIONS
export const requestsAPI = {
  create: (requestData) => api.post('/requests', requestData),
  getAll: (filters = {}) => api.get('/requests', { params: filters }),
  getAdminAll: (filters = {}) => api.get('/requests/admin/all', { params: filters }),
  updateStatus: (id, status) => api.put(`/requests/${id}`, { status }),
  getStats: () => api.get('/requests/stats'),
  search: (filters = {}) => api.get('/requests/search', { params: filters }),
  
  // ADD THESE MISSING FUNCTIONS THAT ARE CAUSING ERRORS:
  sendToDonor: (data) => api.post('/requests/send-to-donor', data),
  sendBulkRequests: (data) => api.post('/requests/send-bulk', data),
  getHospitalDonorRequests: () => api.get('/requests/hospital/donor-requests'),
  getMyRequests: () => api.get('/requests/my-requests'),
  getDonorRequests: () => api.get('/requests/donor/my-requests'),
  getHospitalUniqueEmailRequests: () => api.get('/requests/hospital/unique-email-requests'),
  getEmailStatus: (requestId) => api.get(`/requests/email-status/${requestId}`),
  getRequests: () => api.get('/requests'),
};

// INVENTORY API - FIXED
export const inventoryAPI = {
  getAll: () => api.get('/inventory'),
  update: (data) => api.put('/inventory/update', data),
  adjust: (data) => api.put('/inventory/adjust', data),
  getStats: () => api.get('/inventory/stats'), // NEW
  getDashboardStats: () => api.get('/inventory/dashboard-stats'), // NEW
  getCriticalStocks: () => api.get('/inventory/critical'), // NEW
};

// ADMIN API - FIXED
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: () => api.get('/admin/users'),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getRequests: () => api.get('/admin/requests'), // FIXED: Now exists
  getDashboardStats: () => api.get('/admin/dashboard-stats'), // NEW
  getUserCounts: () => api.get('/admin/user-counts'), // NEW
};

// Donations API
export const donationsAPI = {
  create: (donationData) => api.post('/donations', donationData),
  getAll: (filters = {}) => api.get('/donations', { params: filters }),
  getStats: () => api.get('/donations/stats'),
};

// Analytics API
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  exportData: (type) => api.get(`/analytics/export?type=${type}`),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

// Export the api instance for direct use if needed
export { api };

export default api;