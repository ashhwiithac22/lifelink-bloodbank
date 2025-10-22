//src/services/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

export const donorsAPI = {
  getAll: (filters = {}) => api.get('/donors', { params: filters }),
  updateAvailability: (availability) => api.put('/donors/availability', { availability }),
  getProfile: () => api.get('/donors/profile'),
  getStats: () => api.get('/donors/stats'),
};

export const requestsAPI = {
  create: (requestData) => api.post('/requests', requestData),
  getAll: (filters = {}) => api.get('/requests', { params: filters }),
  getAdminAll: (filters = {}) => api.get('/requests/admin/all', { params: filters }),
  updateStatus: (id, status) => api.put(`/requests/${id}`, { status }),
  getStats: () => api.get('/requests/stats'),
  search: (filters = {}) => api.get('/requests/search', { params: filters }),
};

export const inventoryAPI = {
  getAll: () => api.get('/inventory'),
  update: (data) => api.put('/inventory/update', data),
  adjust: (data) => api.put('/inventory/adjust', data),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: () => api.get('/admin/users'),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
};

export const donationsAPI = {
  create: (donationData) => api.post('/donations', donationData),
  getAll: (filters = {}) => api.get('/donations', { params: filters }),
  getStats: () => api.get('/donations/stats'),
};

export default api;