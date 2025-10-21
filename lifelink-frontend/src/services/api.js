//lifelink-frontend/src/services/api.js
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
};

export const requestsAPI = {
  create: (requestData) => api.post('/requests', requestData),
  getAll: (filters = {}) => api.get('/requests', { params: filters }),
  updateStatus: (id, status) => api.put(`/requests/${id}`, { status }),
};

export const inventoryAPI = {
  getAll: () => api.get('/inventory'),
  update: (data) => api.put('/inventory/update', data),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: () => api.get('/admin/users'),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
};

export default api;