const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
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

// ✅ IMPORTANT: Import and use routes CORRECTLY
// Test route first to verify basic routing works
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test route working!' });
});

// Now import and use your routes
try {
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes loaded');
} catch (error) {
  console.error('❌ Failed to load auth routes:', error.message);
}

try {
  const donorRoutes = require('./routes/donors');
  app.use('/api/donors', donorRoutes);
  console.log('✅ Donor routes loaded');
} catch (error) {
  console.error('❌ Failed to load donor routes:', error.message);
}

try {
  const requestRoutes = require('./routes/requests');
  app.use('/api/requests', requestRoutes);
  console.log('✅ Request routes loaded');
} catch (error) {
  console.error('❌ Failed to load request routes:', error.message);
}

try {
  const inventoryRoutes = require('./routes/inventory');
  app.use('/api/inventory', inventoryRoutes);
  console.log('✅ Inventory routes loaded');
} catch (error) {
  console.error('❌ Failed to load inventory routes:', error.message);
}

try {
  const adminRoutes = require('./routes/admin');
  app.use('/api/admin', adminRoutes);
  console.log('✅ Admin routes loaded');
} catch (error) {
  console.error('❌ Failed to load admin routes:', error.message);
}

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'LifeLink Blood Bank API is running!',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/api/auth',
      '/api/donors', 
      '/api/requests',
      '/api/inventory',
      '/api/admin'
    ]
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.json({
    status: 'OK',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
  console.log(`🔗 API Base: http://localhost:${PORT}/`);
});