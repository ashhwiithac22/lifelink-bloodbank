//src/services/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  getProfile: () => api.get('/auth/profile'),
};

// Donors API
export const donorsAPI = {
  getAll: (filters = {}) => {
    return api.get('/donors', { 
      params: filters,
      paramsSerializer: {
        indexes: null
      }
    });
  },
  updateAvailability: (availability) => 
    api.put('/donors/availability', { availability }),
  getProfile: () => api.get('/donors/profile'),
  getStats: () => api.get('/donors/stats'),
  getById: (id) => api.get(`/donors/${id}`),
};

// Requests API
export const requestsAPI = {
  create: (requestData) => api.post('/requests', requestData),
  sendToDonor: (requestData) => api.post('/requests/send-to-donor', requestData),
  getAll: (filters = {}) => api.get('/requests', { params: filters }),
  getUniqueEmailRequests: () => api.get('/requests/hospital/unique-email-requests'),
  getAdminAll: (filters = {}) => api.get('/requests/admin/all', { params: filters }),
  updateStatus: (id, status) => api.put(`/requests/${id}`, { status }),
  getStats: () => api.get('/requests/stats'),
  search: (filters = {}) => api.get('/requests/search', { params: filters }),
  getHospitalDonorRequests: () => api.get('/requests/hospital/donor-requests'),
  getEmailStatus: (requestId) => api.get(`/requests/email-status/${requestId}`),
};

// Inventory API
export const inventoryAPI = {
  getAll: () => api.get('/inventory'),
  update: (data) => api.put('/inventory/update', data),
  adjust: (data) => api.put('/inventory/adjust', data),
};

// Admin API - ENHANCED WITH NEW ENDPOINTS
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: () => api.get('/admin/users'),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  
  // NEW: Admin request management endpoints
  getRequests: () => api.get('/admin/requests'),
  updateRequestStatus: (id, status) => api.put(`/admin/requests/${id}/status`, { status }),
  notifyHospitals: (bloodGroup) => api.post('/admin/notify-hospitals', { bloodGroup }),
  getUrgentInventory: () => api.get('/admin/urgent-inventory'),

  // NEW: Email sending endpoint for donors
  sendEmailToDonor: (emailData) => api.post('/admin/send-email-to-donor', emailData),
};

// Donations API
export const donationsAPI = {
  create: (donationData) => api.post('/donations', donationData),
  getAll: (filters = {}) => api.get('/donations', { params: filters }),
  getStats: () => api.get('/donations/stats'),
};

export default api;