import axios from 'axios';

// API URL - Use environment variable for production
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
console.log('🔗 API URL configured:', API_URL);

// Create axios instance with proper configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 30000, // 30 seconds timeout
  withCredentials: false
});

// Enhanced request interceptor with email debugging
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    const method = config.method?.toUpperCase();
    const url = config.url;
    
    // Special logging for email endpoints
    if (url.includes('send-to-donor') || url.includes('send-bulk')) {
      console.log('📧 EMAIL REQUEST:', method, url);
      console.log('📧 Request data:', config.data);
    } else {
      console.log(`📡 ${method} ${url} ${token ? '(with token)' : '(no token)'}`);
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor
api.interceptors.response.use(
  (response) => {
    const url = response.config.url;
    
    // Special logging for email responses
    if (url.includes('send-to-donor') || url.includes('send-bulk')) {
      console.log('📧 EMAIL RESPONSE:', response.status, url);
      console.log('📧 Response data:', response.data);
    } else {
      console.log(`✅ ${response.status} ${response.config.method?.toUpperCase()} ${url}`);
    }
    
    return response;
  },
  (error) => {
    const { response } = error;
    const url = error.config?.url || 'unknown';
    
    if (response) {
      // Special logging for email errors
      if (url.includes('send-to-donor') || url.includes('send-bulk')) {
        console.error('📧 EMAIL ERROR:', response.status, url);
        console.error('📧 Error data:', response.data);
      } else {
        console.error(`❌ ${response.status} ${url}:`, response.data?.message || response.statusText);
      }
      
      // Handle 401 Unauthorized
      if (response.status === 401) {
        console.log('🔑 Token expired or invalid, redirecting to login...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    } else {
      console.error('🌐 Network error or server not responding:', error.message);
      
      if (!window.location.pathname.includes('/login')) {
        alert('Server is not responding. Please check if backend is running on port 5000.');
      }
    }
    
    return Promise.reject(error);
  }
);

// ========== AUTH API ==========
export const authAPI = {
  login: (credentials) => {
    console.log('🔐 Login attempt');
    return api.post('/auth/login', credentials);
  },
  register: (userData) => {
    console.log('👤 Register attempt');
    return api.post('/auth/register', userData);
  },
  getMe: () => {
    console.log('👤 Getting user info');
    return api.get('/auth/me');
  },
};

// ========== DONORS API ==========
export const donorsAPI = {
  getAll: (filters = {}) => {
    console.log('👥 Getting donors with filters:', filters);
    return api.get('/donors', { params: filters });
  },
  updateAvailability: (availability) => {
    console.log('🔄 Updating donor availability:', availability);
    return api.put('/donors/availability', { availability });
  },
  getProfile: () => {
    console.log('👤 Getting donor profile');
    return api.get('/donors/profile');
  },
  getStats: () => {
    console.log('📊 Getting donor stats');
    return api.get('/donors/stats');
  },
};

// ========== REQUESTS API ==========
export const requestsAPI = {
  // Create new blood request
  create: (requestData) => {
    console.log('📋 Creating blood request:', requestData);
    return api.post('/requests', requestData);
  },
  
  // Get all requests (with optional filters)
  getAll: (filters = {}) => {
    console.log('📋 Getting requests with filters:', filters);
    return api.get('/requests', { params: filters });
  },
  
  // Update request status
  updateStatus: (id, status) => {
    console.log(`📋 Updating request ${id} to ${status}`);
    return api.put(`/requests/${id}`, { status });
  },
  
  // Email-related endpoints - ENHANCED WITH DEBUGGING
  sendToDonor: (data) => {
    console.log('📧 ======= SEND TO DONOR =======');
    console.log('📧 Donor ID:', data.donorId);
    console.log('📧 Blood Group:', data.bloodGroup);
    console.log('📧 Units Required:', data.unitsRequired);
    console.log('📧 API Endpoint:', '/requests/send-to-donor');
    console.log('📧 ============================');
    
    // Ensure all required fields are present
    const requestData = {
      donorId: data.donorId,
      bloodGroup: data.bloodGroup,
      unitsRequired: parseInt(data.unitsRequired) || 1,
      urgency: data.urgency || 'medium',
      contactPerson: data.contactPerson || 'Hospital Staff',
      contactNumber: data.contactNumber || '0422-3566580',
      purpose: data.purpose || 'Emergency blood requirement',
      hospitalName: data.hospitalName || 'LifeLink Hospital',
      location: data.location || 'Coimbatore'
    };
    
    return api.post('/requests/send-to-donor', requestData)
      .then(response => {
        console.log('✅ EMAIL SENT SUCCESSFULLY!');
        console.log('✅ Response:', response.data);
        return response;
      })
      .catch(error => {
        console.error('❌ EMAIL SENDING FAILED!');
        console.error('❌ Error:', error.message);
        console.error('❌ Error response:', error.response?.data);
        throw error;
      });
  },
  
  sendBulkRequests: (data) => {
    console.log('📧 ======= SEND BULK REQUESTS =======');
    console.log('📧 Donor count:', data.donorIds?.length);
    console.log('📧 Blood Group:', data.bloodGroup);
    console.log('📧 API Endpoint:', '/requests/send-bulk');
    console.log('📧 =================================');
    
    return api.post('/requests/send-bulk', data)
      .then(response => {
        console.log('✅ BULK EMAILS SENT SUCCESSFULLY!');
        console.log('✅ Successful:', response.data.successfulCount);
        console.log('✅ Failed:', response.data.failedCount);
        return response;
      })
      .catch(error => {
        console.error('❌ BULK EMAIL SENDING FAILED!');
        console.error('❌ Error:', error.message);
        console.error('❌ Error response:', error.response?.data);
        throw error;
      });
  },
  
  // Hospital-specific requests
  getHospitalDonorRequests: () => {
    console.log('📋 Getting hospital donor requests');
    return api.get('/requests/hospital/donor-requests');
  },
  
  getMyRequests: () => {
    console.log('📋 Getting my requests');
    return api.get('/requests/my-requests');
  },
  
  // Stats
  getStats: () => {
    console.log('📋 Getting request stats');
    return api.get('/requests/stats');
  },
  
  // Email status
  getEmailStatus: (requestId) => {
    console.log(`📧 Getting email status for request: ${requestId}`);
    return api.get(`/requests/email-status/${requestId}`);
  },
};

// ========== INVENTORY API ==========
export const inventoryAPI = {
  getAll: () => {
    console.log('📦 Getting inventory');
    return api.get('/inventory');
  },
  
  getSimple: () => {
    console.log('📦 Getting simple inventory');
    return api.get('/inventory/simple');
  },
  
  update: (data) => {
    console.log('📦 Updating inventory:', data);
    return api.put('/inventory/update', data);
  },
  
  getCriticalStocks: () => {
    console.log('📦 Getting critical stocks');
    return api.get('/inventory/critical');
  },
  
  getInventorySafe: () => {
    return api.get('/inventory/simple')
      .then(response => ({ 
        success: true, 
        data: response.data || [] 
      }))
      .catch(error => {
        console.warn('⚠️ Inventory fetch failed, returning empty array');
        return { success: false, data: [] };
      });
  }
};

// ========== ADMIN API ==========
export const adminAPI = {
  getDashboard: () => {
    console.log('🏠 Getting admin dashboard');
    return api.get('/admin/dashboard');
  },
  
  getDashboardStats: () => {
    console.log('📊 Getting dashboard stats');
    return api.get('/admin/dashboard-stats');
  },
  
  getUsers: () => {
    console.log('👥 Getting users');
    return api.get('/admin/users');
  },
  
  getUserCounts: () => {
    console.log('🔢 Getting user counts');
    return api.get('/admin/user-counts');
  },
  
  deleteUser: (id) => {
    console.log(`🗑️ Deleting user: ${id}`);
    return api.delete(`/admin/users/${id}`);
  },
  
  getRequests: () => {
    console.log('📋 Getting admin requests');
    return api.get('/admin/requests');
  },
  
  updateRequestStatus: (id, status) => {
    console.log(`📋 Updating request ${id} to ${status}`);
    return api.put(`/requests/${id}`, { status });
  },
  
  sendEmailToDonor: (data) => {
    console.log('📧 Admin sending email to donor:', data.donorId);
    console.log('📧 Subject:', data.subject);
    return api.post('/admin/send-email', data)
      .then(response => {
        console.log('✅ ADMIN EMAIL SENT!');
        console.log('✅ Response:', response.data);
        return response;
      })
      .catch(error => {
        console.error('❌ ADMIN EMAIL FAILED!');
        console.error('❌ Error:', error.response?.data || error.message);
        throw error;
      });
  },
};

// ========== DONATIONS API ==========
export const donationsAPI = {
  create: (donationData) => {
    console.log('🩸 Creating donation:', donationData);
    return api.post('/donations', donationData);
  },
  
  getAll: (filters = {}) => {
    console.log('🩸 Getting donations with filters:', filters);
    return api.get('/donations', { params: filters });
  },
  
  getStats: () => {
    console.log('📊 Getting donation stats');
    return api.get('/donations/stats');
  },
};

// ========== EMAIL API ==========
export const emailAPI = {
  sendTest: (email) => {
    console.log('📧 Sending test email to:', email);
    return api.get(`/test-email?email=${encodeURIComponent(email)}`);
  },
  
  sendCustom: (data) => {
    console.log('📧 Sending custom email:', data.to);
    return api.post('/email/send-test', data);
  },
  
  getConfig: () => {
    console.log('⚙️ Getting email config');
    return api.get('/email-config');
  },
  
  healthCheck: () => {
    console.log('❤️ Checking email health');
    return api.get('/health/email');
  },
  
  sendDemoEmail: (to, subject, body) => {
    console.log('📧 Sending demo email to:', to);
    return api.post('/email/send-test', {
      to,
      subject: subject || 'LifeLink Blood Bank Notification',
      message: body || 'This is a test notification from LifeLink Blood Bank.'
    });
  },
  
  // NEW: Direct email test function
  testEmailService: async (testEmail) => {
    try {
      console.log('🔧 Testing email service...');
      const config = await emailAPI.getConfig();
      console.log('📧 Config:', config.data);
      
      const health = await emailAPI.healthCheck();
      console.log('📧 Health:', health.data);
      
      if (testEmail) {
        const testResult = await emailAPI.sendTest(testEmail);
        console.log('📧 Test result:', testResult.data);
        return testResult.data;
      }
      
      return { config: config.data, health: health.data };
    } catch (error) {
      console.error('❌ Email service test failed:', error);
      throw error;
    }
  }
};

// ========== HEALTH & SYSTEM API ==========
export const systemAPI = {
  health: () => {
    console.log('❤️ Checking system health');
    return api.get('/health');
  },
  
  apiInfo: () => {
    console.log('ℹ️ Getting API info');
    return api.get('/');
  },
  
  apiStatus: () => {
    console.log('📊 Getting API status');
    return api.get('/api');
  },
  
  ping: () => {
    console.log('🏓 Pinging server');
    return api.get('/api/ping');
  },
};

// ========== BACKEND CONNECTION TEST ==========
export const testBackendConnection = async () => {
  try {
    console.log('🔌 ======= TESTING BACKEND CONNECTION =======');
    const response = await systemAPI.health();
    
    if (response.data.status === 'OK') {
      console.log('✅ Backend connected successfully');
      console.log('🗄️ Database:', response.data.database);
      console.log('📧 Email configured:', response.data.email?.configured);
      console.log('🕐 Uptime:', Math.floor(response.data.uptime), 'seconds');
      console.log('===========================================');
      return { connected: true, data: response.data };
    } else {
      console.warn('⚠️ Backend responded but status not OK');
      return { connected: false, error: 'Backend status not OK' };
    }
  } catch (error) {
    console.error('❌ Backend connection failed:', error.message);
    console.error('💡 Suggestion: Make sure backend server is running on port 5000');
    console.log('===========================================');
    return { 
      connected: false, 
      error: error.message,
      suggestion: 'Make sure backend server is running on port 5000'
    };
  }
};

// Auto-test connection when module loads
if (process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    testBackendConnection().then(result => {
      if (result.connected && result.data.email?.configured) {
        console.log('🚀 Email service is configured and ready!');
      } else if (result.connected) {
        console.warn('⚠️ Email service not configured. Emails will not be sent.');
      }
    });
  }, 1500);
}

// Export the main api instance
export { api };
export default api;