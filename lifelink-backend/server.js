const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Enhanced CORS for production
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://lifelink-bloodbank.netlify.app',
    'https://*.netlify.app',
    'https://*.vercel.app',
    'https://*.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());

// Database connection with better error handling
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined');
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    // Don't exit in production - Render will restart
  }
};

connectDB();

// Import routes
const authRoutes = require('./routes/auth');
const donorRoutes = require('./routes/donors');
const donationRoutes = require('./routes/donations');
const requestRoutes = require('./routes/requests');
const inventoryRoutes = require('./routes/inventory');
const adminRoutes = require('./routes/admin');
const analyticsRoutes = require('./routes/analytics');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint (important for Render)
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'OK',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 LifeLink Blood Bank API Server',
    version: '1.0.0',
    status: 'Running',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Remove static file serving for Render (frontend is separate)
// Render is only for backend API

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🎯 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`🔗 Health Check: /api/health`);
});