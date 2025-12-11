const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import email service
const { sendEmail, emailTemplates, testEmailConfig, verifyTransporter } = require('./utils/emailService');

const app = express();

// Debug: Check if environment variables are loaded
console.log('🔧 ======= ENVIRONMENT CHECK =======');
console.log('MONGO_URI exists:', !!process.env.MONGO_URI);
console.log('PORT:', process.env.PORT);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('EMAIL_USER exists:', !!process.env.EMAIL_USER);
console.log('EMAIL_PASS exists:', process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-4) : 'No');
console.log('EMAIL_PASS length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0, 'characters');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('====================================\n');

// Email configuration check
console.log('📧 ======= EMAIL CONFIGURATION =======');
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  console.log('✅ Email service is configured');
  console.log('Email:', process.env.EMAIL_USER);
  console.log('Password length:', process.env.EMAIL_PASS.length, 'characters');
  
  // Check if password is 16 characters (Gmail App Password requirement)
  if (process.env.EMAIL_PASS.length !== 16) {
    console.log('❌ WARNING: EMAIL_PASS should be 16 characters for Gmail App Password');
    console.log('💡 Generate new 16-char App Password: https://myaccount.google.com/apppasswords');
    console.log('💡 Current password is', process.env.EMAIL_PASS.length, 'characters');
  }
  
  // Test email configuration on startup
  testEmailConfig().then(isValid => {
    if (isValid) {
      console.log('✅ Email service test passed on startup');
    } else {
      console.log('⚠️ Email service test failed on startup');
      console.log('🔧 Check:');
      console.log('1. EMAIL_PASS must be 16 characters');
      console.log('2. Must be Gmail App Password (not regular password)');
      console.log('3. Enable 2-Step Verification');
      console.log('4. Generate at: https://myaccount.google.com/apppasswords');
    }
  });
} else {
  console.log('⚠️ Email service is not configured. Emails will be skipped.');
  console.log('💡 Add to .env:');
  console.log('EMAIL_USER=your-email@gmail.com');
  console.log('EMAIL_PASS=16-char-gmail-app-password');
}
console.log('====================================\n');

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
    
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
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

// ======= EMAIL TEST ENDPOINTS =======
// Test email endpoint using QUERY PARAMETER (not URL parameter)
app.get('/api/test-email', async (req, res) => {
  try {
    const testEmail = req.query.email || process.env.EMAIL_USER;
    
    if (!testEmail) {
      return res.status(400).json({ 
        success: false,
        error: 'Please provide an email address',
        usage: '/api/test-email?email=your-email@gmail.com',
        tip: 'Example: /api/test-email?email=ashwithac22@gmail.com'
      });
    }

    console.log(`\n📧 ======= EMAIL TEST REQUEST =======`);
    console.log('Testing email to:', testEmail);
    console.log('Using EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_PASS length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0, 'chars');
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      return res.json({
        success: false,
        error: 'Invalid email format',
        received: testEmail,
        tip: 'Use a valid email like: test@example.com'
      });
    }

    // Check if email is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.json({
        success: false,
        error: 'Email credentials not configured',
        tip: 'Add EMAIL_USER and EMAIL_PASS to your .env file',
        required: 'EMAIL_USER=your-email@gmail.com\nEMAIL_PASS=16-char-gmail-app-password'
      });
    }

    // Check password length
    if (process.env.EMAIL_PASS.length !== 16) {
      console.log('⚠️ WARNING: EMAIL_PASS is', process.env.EMAIL_PASS.length, 'characters (should be 16)');
    }

    // Test configuration
    console.log('🔧 Testing email configuration...');
    const configTest = await testEmailConfig(testEmail);
    
    if (!configTest) {
      return res.json({ 
        success: false, 
        message: 'Email configuration failed',
        details: 'Check server logs above for detailed error',
        common_fixes: [
          '1. EMAIL_PASS must be 16 characters exactly',
          '2. Must be Gmail App Password (not regular password)',
          '3. Enable 2-Step Verification in Google Account',
          '4. Generate App Password: https://myaccount.google.com/apppasswords',
          '5. Example: EMAIL_PASS=drmcqoyoergwgjad (16 chars, no spaces)'
        ]
      });
    }

    // Send actual test email using template
    console.log('📤 Sending test email...');
    const emailResult = await sendEmail(emailTemplates.testEmail(testEmail));

    console.log('📧 Email Result:', emailResult.success ? '✅ SUCCESS' : '❌ FAILED');
    if (emailResult.success) {
      console.log('Message ID:', emailResult.messageId);
      console.log('To:', emailResult.to);
    } else {
      console.log('Error:', emailResult.error);
      console.log('Error Code:', emailResult.code);
    }
    console.log('================================\n');

    res.json({
      success: emailResult.success,
      message: emailResult.success ? 
        `Test email sent successfully to ${testEmail}` : 
        `Failed to send test email: ${emailResult.error}`,
      to: testEmail,
      time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      configuration: {
        user: process.env.EMAIL_USER,
        pass_length: process.env.EMAIL_PASS.length,
        status: emailResult.success ? 'working' : 'failed'
      },
      result: emailResult.success ? {
        messageId: emailResult.messageId,
        response: emailResult.response,
        sent_at: new Date().toISOString()
      } : {
        error: emailResult.error,
        code: emailResult.code,
        tip: 'Check if EMAIL_PASS is 16-character Gmail App Password'
      }
    });

  } catch (error) {
    console.error('❌ Test email endpoint error:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Email test endpoint failed',
      tip: 'Check server logs for detailed error information'
    });
  }
});

// Email configuration endpoint
app.get('/api/email-config', (req, res) => {
  const emailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
  const passLength = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0;
  const is16Chars = passLength === 16;
  
  res.json({
    configured: emailConfigured,
    user: process.env.EMAIL_USER,
    pass_length: passLength,
    pass_valid_length: is16Chars,
    status: emailConfigured ? (is16Chars ? 'ready' : 'invalid_length') : 'not_configured',
    node_env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    server_time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    requirements: {
      pass_length: '16 characters',
      type: 'Gmail App Password',
      verification: '2-Step Verification must be enabled'
    },
    next_steps: !emailConfigured ? [
      '1. Add EMAIL_USER and EMAIL_PASS to .env file',
      '2. Generate 16-char Gmail App Password',
      '3. Restart server'
    ] : !is16Chars ? [
      '1. Current password is ' + passLength + ' chars (needs 16)',
      '2. Generate new 16-char App Password',
      '3. Update .env file',
      '4. Restart server'
    ] : ['✅ Configuration looks correct']
  });
});

// Quick email send endpoint (for testing via POST)
app.post('/api/email/send-test', async (req, res) => {
  try {
    const { to, subject, message } = req.body;
    
    if (!to) {
      return res.status(400).json({ 
        success: false,
        error: 'Email "to" address is required'
      });
    }

    const emailResult = await sendEmail({
      from: `"LifeLink Test" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject || 'Test Email from LifeLink',
      text: message || 'This is a test email from LifeLink Blood Bank system.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc3545;">Test Email from LifeLink</h2>
          <p>${message || 'This is a test email from LifeLink Blood Bank system.'}</p>
          <p>Sent at: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
          <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 0;"><strong>LifeLink Blood Bank</strong><br>Emergency Helpline: 0422-3566580</p>
          </div>
        </div>
      `
    });

    res.json({
      success: emailResult.success,
      message: emailResult.success ? 'Email sent successfully' : 'Failed to send email',
      result: emailResult
    });

  } catch (error) {
    console.error('Email send error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Email health check endpoint
app.get('/api/health/email', async (req, res) => {
  try {
    const emailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
    const passLength = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0;
    
    if (!emailConfigured) {
      return res.json({
        status: 'not_configured',
        message: 'Email credentials not configured in .env',
        required: 'EMAIL_USER and EMAIL_PASS in .env file',
        tip: 'Generate 16-char Gmail App Password'
      });
    }

    if (passLength !== 16) {
      return res.json({
        status: 'invalid_length',
        message: `EMAIL_PASS is ${passLength} characters (should be 16)`,
        current_length: passLength,
        required_length: 16,
        tip: 'Generate new 16-char App Password at https://myaccount.google.com/apppasswords'
      });
    }
    
    const testResult = await testEmailConfig();
    
    res.json({
      status: testResult ? 'healthy' : 'unhealthy',
      configured: true,
      user: process.env.EMAIL_USER,
      pass_length: passLength,
      pass_valid: passLength === 16,
      smtp_test: testResult ? 'passed' : 'failed',
      timestamp: new Date().toISOString(),
      next_steps: !testResult ? [
        '1. Check EMAIL_PASS is 16 characters',
        '2. Must be Gmail App Password (not regular password)',
        '3. Enable 2-Step Verification',
        '4. Generate at: https://myaccount.google.com/apppasswords'
      ] : ['✅ Email service is ready']
    });
    
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test route first to verify basic routing works
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Test route working!',
    timestamp: new Date().toISOString(),
    email: process.env.EMAIL_USER ? 'configured' : 'not configured',
    email_user: process.env.EMAIL_USER,
    server_time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  });
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
  const passLength = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0;
  
  res.json({
    status: 'OK',
    database: dbStatus,
    email: {
      configured: emailConfigured,
      user: process.env.EMAIL_USER,
      pass_length: passLength,
      valid_length: passLength === 16
    },
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    version: '1.0.0',
    serverTime: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Basic route - API information only
app.get('/', (req, res) => {
  const emailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
  const passLength = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0;
  
  res.json({ 
    message: '🚀 LifeLink Blood Bank API Server',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Connecting...',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    email: {
      configured: emailConfigured,
      user: process.env.EMAIL_USER,
      pass_length: passLength,
      status: emailConfigured ? (passLength === 16 ? 'ready' : 'invalid_length') : 'not_configured'
    },
    emailEndpoints: [
      'GET  /api/health/email',
      'GET  /api/email-config',
      'GET  /api/test-email?email=your-email@gmail.com',
      'POST /api/email/send-test'
    ],
    coreEndpoints: [
      'GET  /api/auth',
      'GET  /api/donors', 
      'GET  /api/donations',
      'GET  /api/requests',
      'GET  /api/inventory',
      'GET  /api/admin',
      'GET  /api/analytics',
      'GET  /api/health',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'POST /api/donations',
      'POST /api/requests',
      'POST /api/requests/send-to-donor',
      'PUT  /api/requests/:id',
      'PUT  /api/donors/availability'
    ],
    note: 'Frontend deployed separately on Netlify',
    server_time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
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
    error: process.env.NODE_ENV === 'production' ? {} : err.message,
    timestamp: new Date().toISOString()
  });
});

// Catch-all 404 handler at the end (without wildcard)
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ 
      message: 'API endpoint not found',
      path: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString(),
      availableEndpoints: [
        'GET /api/health',
        'GET /api/health/email',
        'GET /api/email-config',
        'GET /api/test-email?email=your-email@gmail.com',
        'POST /api/email/send-test',
        'GET /api/auth',
        'GET /api/donors',
        'GET /api/donations', 
        'GET /api/requests',
        'GET /api/inventory',
        'GET /api/admin',
        'GET /api/analytics',
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
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎉 ======= SERVER STARTED SUCCESSFULLY =======`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`🗄️ Database: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '🔄 Connecting...'}`);
  
  // Enhanced email status
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const passLength = process.env.EMAIL_PASS.length;
    console.log(`📧 Email: ${process.env.EMAIL_USER}`);
    console.log(`📧 Password: ${passLength === 16 ? '✅ 16 chars' : `❌ ${passLength} chars (needs 16)`}`);
    
    if (passLength !== 16) {
      console.log(`💡 FIX: Generate 16-char Gmail App Password:`);
      console.log(`💡 1. Go to: https://myaccount.google.com/apppasswords`);
      console.log(`💡 2. Generate new 16-char password for "Mail"`);
      console.log(`💡 3. Update .env: EMAIL_PASS=16-char-password`);
      console.log(`💡 4. Restart server`);
    }
  } else {
    console.log(`📧 Email: ❌ Not Configured`);
  }
  
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📧 Email Config: http://localhost:${PORT}/api/email-config`);
  console.log(`📧 Email Test: http://localhost:${PORT}/api/test-email?email=ashwithac22@gmail.com`);
  console.log(`🚀 API Base URL: http://localhost:${PORT}/api`);
  console.log(`📊 Server running on: 0.0.0.0:${PORT}`);
  console.log(`⏰ Server Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
  console.log(`===============================================\n`);
  
  // Test email on startup
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    console.log('📧 Testing email configuration on startup...');
    testEmailConfig().then(success => {
      if (success) {
        console.log('✅ Email service is ready to send emails');
      } else {
        console.log('⚠️ Email service test failed. Emails may not work.');
        console.log('🔧 Common fixes:');
        console.log('1. EMAIL_PASS must be 16 characters exactly');
        console.log('2. Must be Gmail App Password (not regular password)');
        console.log('3. Enable 2-Step Verification in Google Account');
        console.log('4. Generate App Password: https://myaccount.google.com/apppasswords');
      }
    });
  }
});