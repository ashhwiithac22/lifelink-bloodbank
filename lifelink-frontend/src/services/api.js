//src/services/api.js
import axios from 'axios';

// FORCE LOCALHOST FOR TESTING
const API_URL = 'http://localhost:5000/api';
console.log('🔗 Using API URL:', API_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`📡 Request to: ${config.url} (with token)`);
    } else {
      console.log(`📡 Request to: ${config.url} (no token)`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle responses
api.interceptors.response.use(
  (response) => {
    console.log(`✅ Response ${response.status}: ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`❌ Error ${error.response?.status}: ${error.config?.url}`);
    console.error('Error details:', error.response?.data);
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// ========== AUTH API ==========
export const authAPI = {
  login: (credentials) => {
    console.log('🔑 Login attempt:', credentials.email);
    return api.post('/auth/login', credentials);
  },
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

// ========== DONORS API ==========
export const donorsAPI = {
  getAll: (filters = {}) => api.get('/donors', { params: filters }),
  updateAvailability: (availability) => api.put('/donors/availability', { availability }),
  getProfile: () => api.get('/donors/profile'),
};

// ========== REQUESTS API ==========
export const requestsAPI = {
  create: (requestData) => api.post('/requests', requestData),
  getAll: (filters = {}) => api.get('/requests', { params: filters }),
  updateStatus: (id, status) => api.put(`/requests/${id}`, { status }),
  
  // EMAIL ENDPOINTS - THESE WORK
  sendToDonor: (data) => {
    console.log('📧 Sending to donor:', data);
    return api.post('/requests/send-to-donor', data);
  },
  
  sendBulkRequests: (data) => {
    console.log('📧 Sending bulk to:', data.donorIds?.length || 0, 'donors');
    return api.post('/requests/send-bulk', data);
  },
  
  getHospitalDonorRequests: () => api.get('/requests/hospital/donor-requests'),
  getMyRequests: () => api.get('/requests/my-requests'),
  getRequests: () => api.get('/requests'),
};

// ========== INVENTORY API ==========
export const inventoryAPI = {
  getAll: () => {
    console.log('🩸 Fetching inventory...');
    return api.get('/inventory/simple')
      .then(response => {
        console.log('✅ Inventory data:', response.data.length, 'items');
        return { data: response.data };
      })
      .catch(error => {
        console.error('❌ Inventory error:', error);
        return { data: [] };
      });
  },
  getSimple: () => api.get('/inventory/simple'),
  update: (data) => api.put('/inventory/update', data),
  getCriticalStocks: () => api.get('/inventory/critical'),
};

// ========== ADMIN API ==========
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: () => api.get('/admin/users'),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getRequests: () => api.get('/admin/requests'), // This exists in backend/routes/admin.js
  updateRequestStatus: (id, status) => api.put(`/admin/requests/${id}/status`, { status }), // Add this if needed

};

// ========== DONATIONS API ==========
export const donationsAPI = {
  create: (donationData) => api.post('/donations', donationData),
  getAll: (filters = {}) => api.get('/donations', { params: filters }),
};

// ========== EMAIL API ==========
export const emailAPI = {
  // TEST EMAIL - WORKS
  sendTest: (email) => {
    console.log('📧 Sending test email to:', email);
    return api.get(`/test-email?email=${email}`);
  },
  
  // CUSTOM EMAIL - WORKS
  sendCustom: (data) => {
    console.log('📧 Sending custom email:', data);
    return api.post('/email/send-test', data);
  },
  
  // CONFIG - WORKS
  getConfig: () => api.get('/email-config'),
  
  // HEALTH - WORKS
  healthCheck: () => api.get('/health/email'),
  
  // SIMPLE BLOOD REQUEST
  sendBloodRequest: (donorEmail, requestData) => {
    return api.post('/email/send-test', {
      to: donorEmail,
      subject: `🩸 Blood Request: ${requestData.bloodGroup}`,
      message: `Blood Group: ${requestData.bloodGroup}\nUnits: ${requestData.unitsRequired}\nUrgency: ${requestData.urgency || 'High'}`
    });
  }
};

// ========== HEALTH API ==========
export const healthAPI = {
  check: () => api.get('/health'),
};

// Test connection on startup
api.get('/health')
  .then(res => console.log('✅ Backend connected:', res.data.status))
  .catch(err => console.error('❌ Backend connection failed:', err.message));

export { api };
export default api;