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
      // Token expired or invalid
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
  // Get all donors with optional filters
  getAll: (filters = {}) => {
    console.log('Fetching donors with filters:', filters);
    return api.get('/donors', { 
      params: filters,
      paramsSerializer: {
        indexes: null // Better array handling
      }
    });
  },
  
  // Update donor availability
  updateAvailability: (availability) => 
    api.put('/donors/availability', { availability }),
  
  // Get donor profile
  getProfile: () => api.get('/donors/profile'),
  
  // Get donor statistics
  getStats: () => api.get('/donors/stats'),
  
  // Get single donor by ID
  getById: (id) => api.get(`/donors/${id}`),
};

// Requests API - ENHANCED WITH EMAIL FUNCTIONALITY
export const requestsAPI = {
  // Create traditional blood request
  create: (requestData) => api.post('/requests', requestData),
  
  // NEW: Send request to specific donor with email
  sendToDonor: (requestData) => api.post('/requests/send-to-donor', requestData),
  
  // Get all requests with filters
  getAll: (filters = {}) => api.get('/requests', { params: filters }),
  
  // Get admin requests
  getAdminAll: (filters = {}) => api.get('/requests/admin/all', { params: filters }),
  
  // Update request status
  updateStatus: (id, status) => api.put(`/requests/${id}`, { status }),
  
  // Get request statistics
  getStats: () => api.get('/requests/stats'),
  
  // Search requests
  search: (filters = {}) => api.get('/requests/search', { params: filters }),
  
  // NEW: Get hospital's donor requests
  getHospitalDonorRequests: () => api.get('/requests/hospital/donor-requests'),
};

// Inventory API
export const inventoryAPI = {
  getAll: () => api.get('/inventory'),
  update: (data) => api.put('/inventory/update', data),
  adjust: (data) => api.put('/inventory/adjust', data),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: () => api.get('/admin/users'),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
};

// Donations API
export const donationsAPI = {
  create: (donationData) => api.post('/donations', donationData),
  getAll: (filters = {}) => api.get('/donations', { params: filters }),
  getStats: () => api.get('/donations/stats'),
};

export default api;