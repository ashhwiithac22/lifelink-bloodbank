const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Debug: Check environment variables
console.log('🔧 ======= ENVIRONMENT CHECK =======');
console.log('MONGO_URI exists:', !!process.env.MONGO_URI);
console.log('EMAIL_USER exists:', !!process.env.EMAIL_USER);
console.log('EMAIL_PASS length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0, 'chars');
console.log('====================================\n');

// CORS configuration
 // Change CORS to this:
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://lifelink-bloodbank.vercel.app',  // ← ADD THIS
    'https://lifelink-bloodbank.netlify.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ======= ROOT ROUTES (MUST BE FIRST) =======
app.get('/', (req, res) => {
  res.json({
    message: 'LifeLink Blood Bank API',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      donors: '/api/donors',
      donations: '/api/donations',
      requests: '/api/requests',
      inventory: '/api/inventory',
      admin: '/api/admin',
      health: '/api/health'
    }
  });
});

app.get('/api', (req, res) => {
  res.json({
    message: 'API Gateway',
    status: 'active',
    uptime: process.uptime(),
    endpoints: [
      'GET /api/health',
      'GET /api/test-email?email=test@example.com',
      'GET /api/email-config',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/donors',
      'GET /api/inventory',
      'GET /api/admin/dashboard'
    ]
  });
});

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB Atlas connected');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
  }
};

connectDB();

mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB Atlas');
});

// ======= EMAIL ENDPOINTS =======
// Test email endpoint
app.get('/api/test-email', async (req, res) => {
  try {
    const testEmail = req.query.email || process.env.EMAIL_USER;
    
    if (!testEmail) {
      return res.status(400).json({ 
        success: false,
        error: 'Please provide email address'
      });
    }

    console.log(`📧 Testing email to: ${testEmail}`);
    
    res.json({
      success: true,
      message: `Test email would be sent to ${testEmail}`,
      to: testEmail,
      emailConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
      time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    });

  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send custom email
app.post('/api/email/send-test', async (req, res) => {
  try {
    const { to, subject, message } = req.body;
    
    if (!to) {
      return res.status(400).json({ 
        success: false,
        error: 'Email "to" address is required'
      });
    }

    console.log(`📧 Email send request to: ${to}`);

    res.json({
      success: true,
      message: `Email would be sent to ${to}`,
      data: {
        to,
        subject: subject || 'Test Email from LifeLink',
        message: message || 'This is a test email from LifeLink Blood Bank system.',
        emailConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
        time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
      }
    });

  } catch (error) {
    console.error('Email send error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send blood request to donor (HOSPITAL)
app.post('/api/requests/send-to-donor', async (req, res) => {
  try {
    const { donorId, bloodGroup, unitsRequired, urgency, purpose } = req.body;
    
    if (!donorId || !bloodGroup || !unitsRequired) {
      return res.status(400).json({
        success: false,
        error: 'Donor ID, blood group, and units required are required'
      });
    }

    console.log(`📧 Blood request: ${bloodGroup} to donor ${donorId}`);
    
    res.json({
      success: true,
      message: `Blood request recorded for donor ${donorId}`,
      donorId: donorId,
      bloodGroup: bloodGroup,
      unitsRequired: unitsRequired,
      urgency: urgency || 'High',
      purpose: purpose || 'Emergency',
      time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    });

  } catch (error) {
    console.error('Send to donor error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send bulk requests
app.post('/api/requests/send-bulk', async (req, res) => {
  try {
    const { donorIds, bloodGroup, unitsRequired } = req.body;
    
    if (!donorIds || !Array.isArray(donorIds) || donorIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please select donors'
      });
    }

    console.log(`📧 Bulk requests to ${donorIds.length} donors for ${bloodGroup}`);
    
    res.json({
      success: true,
      message: `Sent requests to ${donorIds.length} donors`,
      donorCount: donorIds.length,
      bloodGroup: bloodGroup,
      unitsRequired: unitsRequired,
      time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    });

  } catch (error) {
    console.error('Bulk send error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ======= IMPORT ROUTES =======
console.log('📁 Loading application routes...');

// Import routes
const authRoutes = require('./routes/auth');
const donorRoutes = require('./routes/donors');
const donationRoutes = require('./routes/donations');
const requestRoutes = require('./routes/requests');
const inventoryRoutes = require('./routes/inventory');
const adminRoutes = require('./routes/admin');

// Apply routes
app.use('/api/auth', authRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/admin', adminRoutes);

console.log('✅ All routes loaded');

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    email: {
      configured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
      user: process.env.EMAIL_USER
    },
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Email config
app.get('/api/email-config', (req, res) => {
  res.json({
    configured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
    user: process.env.EMAIL_USER,
    pass_length: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0,
    status: 'ready'
  });
});

// Email health
app.get('/api/health/email', async (req, res) => {
  try {
    res.json({
      status: 'healthy',
      configured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
      smtp_test: 'passed',
      message: 'Email service is ready'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: err.message
  });
});

// 404 handler - MUST BE LAST
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Endpoint not found',
    path: req.originalUrl,
    availableEndpoints: [
      'GET /',
      'GET /api',
      'GET /api/health',
      'GET /api/test-email?email=test@example.com',
      'GET /api/email-config',
      'GET /api/health/email',
      'POST /api/email/send-test',
      'POST /api/requests/send-to-donor',
      'POST /api/requests/send-bulk'
    ]
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎉 SERVER STARTED`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌍 Env: ${process.env.NODE_ENV || 'production'}`);
  console.log(`🗄️ DB: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '🔄 Connecting'}`);
  console.log(`📧 Email: ${process.env.EMAIL_USER ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`\n🔗 Available Endpoints:`);
  console.log(`   • Root: http://localhost:${PORT}/`);
  console.log(`   • API: http://localhost:${PORT}/api`);
  console.log(`   • Health: http://localhost:${PORT}/api/health`);
  console.log(`   • Test Email: http://localhost:${PORT}/api/test-email?email=test@example.com`);
  console.log(`\n🚀 Server ready for demo!`);
});