const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Debug: Check if environment variables are loaded
console.log('🔧 Environment check:');
console.log('MONGO_URI exists:', !!process.env.MONGO_URI);
console.log('PORT:', process.env.PORT);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('EMAIL_USER exists:', !!process.env.EMAIL_USER);
console.log('EMAIL_PASS exists:', !!process.env.EMAIL_PASS);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Email configuration check
console.log('📧 Email Configuration:');
console.log('EMAIL_USER exists:', !!process.env.EMAIL_USER);
console.log('EMAIL_PASS exists:', !!process.env.EMAIL_PASS);

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  console.log('✅ Email service is configured and ready');
} else {
  console.log('⚠️ Email service is not configured. Emails will be skipped.');
}

// CORS configuration for production
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://lifelink-bloodbank.netlify.app',
    'https://lifelink-bloodbank.vercel.app', 
    'https://*.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Database connection
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    console.log('🔗 Attempting to connect to MongoDB...');
    
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('✅ MongoDB Atlas connection established successfully');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('💡 Tip: Check MongoDB Atlas IP whitelist - add 0.0.0.0/0');
  }
};

// Call the connection function
connectDB();

// Database connection events
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected from MongoDB');
});

// Test route first to verify basic routing works
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test route working!' });
});

// Import and use routes
const authRoutes = require('./routes/auth');
const donorRoutes = require('./routes/donors');
const donationRoutes = require('./routes/donations');
const requestRoutes = require('./routes/requests');
const inventoryRoutes = require('./routes/inventory');
const adminRoutes = require('./routes/admin');
const analyticsRoutes = require('./routes/analytics');

app.use('/api/auth', authRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);

console.log('✅ All routes loaded successfully');

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const emailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
  
  res.json({
    status: 'OK',
    database: dbStatus,
    email: emailConfigured ? 'configured' : 'not configured',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    version: '1.0.0'
  });
});

// Basic route - API information only
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 LifeLink Blood Bank API Server',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Connecting...',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    emailConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
    endpoints: [
      '/api/auth',
      '/api/donors', 
      '/api/donations',
      '/api/requests',
      '/api/inventory',
      '/api/admin',
      '/api/analytics',
      '/api/health'
    ],
    note: 'Frontend deployed separately on Netlify'
  });
});

// 404 handler - REMOVED THE PROBLEMATIC WILDCARD ROUTE
// app.use('/api/*') - THIS WAS CAUSING THE ERROR

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('🚨 Server Error:', err.stack);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({ 
      message: 'Duplicate field value entered',
      field: Object.keys(err.keyPattern)[0]
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired' });
  }

  // Default error
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.message 
  });
});

// Catch-all 404 handler at the end (without wildcard)
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ 
      message: 'API endpoint not found',
      path: req.originalUrl,
      method: req.method,
      availableEndpoints: [
        'GET /api/auth',
        'GET /api/donors',
        'GET /api/donations', 
        'GET /api/requests',
        'GET /api/inventory',
        'GET /api/admin',
        'GET /api/analytics',
        'GET /api/health',
        'POST /api/auth/login',
        'POST /api/auth/register',
        'POST /api/donations',
        'POST /api/requests',
        'POST /api/requests/send-to-donor',
        'PUT /api/requests/:id',
        'PUT /api/donors/availability'
      ]
    });
  } else {
    res.status(404).json({ 
      message: 'Route not found',
      path: req.originalUrl,
      method: req.method
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎉 Server Started Successfully!`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`🗄️ Database: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '🔄 Connecting...'}`);
  console.log(`📧 Email: ${process.env.EMAIL_USER ? '✅ Configured' : '❌ Not Configured'}`);
  console.log(`🔗 Health Check: https://lifelink-bloodbank.onrender.com/api/health`);
  console.log(`🚀 API Base URL: https://lifelink-bloodbank.onrender.com/api`);
  console.log(`📊 Server running on: 0.0.0.0:${PORT}`);
});