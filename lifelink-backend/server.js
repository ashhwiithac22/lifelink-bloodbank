const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Debug: Check if environment variables are loaded
console.log('🔧 Environment check:');
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('PORT:', process.env.PORT);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('EMAIL_USER exists:', !!process.env.EMAIL_USER);
console.log('EMAIL_PASS exists:', !!process.env.EMAIL_PASS);

// Email configuration check
console.log('📧 Email Configuration:');
console.log('EMAIL_USER exists:', !!process.env.EMAIL_USER);
console.log('EMAIL_PASS exists:', !!process.env.EMAIL_PASS);

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  console.log('✅ Email service is configured and ready');
} else {
  console.log('⚠️ Email service is not configured. Emails will be skipped.');
}

// Database connection
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('🔗 Attempting to connect to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('✅ MongoDB Atlas connection established successfully');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('⚠️  Server running without database connection');
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
  console.log('❌ Mongoose disconnected from MongoDB');
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

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'LifeLink Blood Bank API is running!',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    emailConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
    endpoints: [
      '/api/auth',
      '/api/donors', 
      '/api/donations',
      '/api/requests',
      '/api/inventory',
      '/api/admin',
      '/api/analytics'
    ]
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const emailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
  
  res.json({
    status: 'OK',
    database: dbStatus,
    email: emailConfigured ? 'configured' : 'not configured',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// FIXED: Enhanced 404 handler - Use proper syntax
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
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
});

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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
  console.log(`🔗 API Base: http://localhost:${PORT}/`);
  console.log(`📧 Email Service: ${process.env.EMAIL_USER ? 'Configured' : 'Not Configured'}`);
  console.log(`🗄️ Database: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
});