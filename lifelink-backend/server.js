const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import email service
const { sendEmail, emailTemplates, testEmailConfig } = require('./utils/emailService');

const app = express();

// Debug: Check environment variables
console.log('🔧 ======= ENVIRONMENT CHECK =======');
console.log('MONGO_URI exists:', !!process.env.MONGO_URI);
console.log('EMAIL_USER exists:', !!process.env.EMAIL_USER);
console.log('EMAIL_PASS length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0, 'chars');
console.log('====================================\n');

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'https://lifelink-bloodbank.netlify.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// REMOVE THIS LINE - IT'S CAUSING THE ERROR:
// app.use('/api/email', emailRoutes); // DELETE THIS LINE

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
    
    const emailResult = await sendEmail(emailTemplates.testEmail(testEmail));

    res.json({
      success: emailResult.success,
      message: emailResult.success ? 
        `Test email sent to ${testEmail}` : 
        `Failed: ${emailResult.error}`,
      to: testEmail,
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

    const emailResult = await sendEmail({
      from: `"LifeLink Blood Bank" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject || 'Test Email from LifeLink',
      text: message || 'This is a test email from LifeLink Blood Bank system.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc3545;">${subject || 'Test Email from LifeLink'}</h2>
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

// Send blood request to donor (HOSPITAL)
app.post('/api/requests/send-to-donor', async (req, res) => {
  try {
    const { donorId, bloodGroup, unitsRequired, urgency, purpose, hospitalId } = req.body;
    
    if (!donorId || !bloodGroup || !unitsRequired) {
      return res.status(400).json({
        success: false,
        error: 'Donor ID, blood group, and units required are required'
      });
    }

    console.log(`📧 Sending blood request: ${bloodGroup} to donor ${donorId}`);
    
    // In real app, fetch donor details from database
    // For now, use test email
    const testEmail = 'ashwithac22@gmail.com';
    
    const emailResult = await sendEmail({
      from: `"LifeLink Blood Bank" <${process.env.EMAIL_USER}>`,
      to: testEmail,
      subject: `🩸 URGENT: ${bloodGroup} Blood Request`,
      text: `Blood Group: ${bloodGroup}\nUnits Needed: ${unitsRequired}\nUrgency: ${urgency || 'High'}\nPurpose: ${purpose || 'Emergency'}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc3545;">🩸 URGENT BLOOD REQUEST</h2>
          <p><strong>Blood Group:</strong> ${bloodGroup}</p>
          <p><strong>Units Needed:</strong> ${unitsRequired}</p>
          <p><strong>Urgency:</strong> ${urgency || 'High'}</p>
          <p><strong>Purpose:</strong> ${purpose || 'Emergency'}</p>
          <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 0;"><strong>LifeLink Blood Bank</strong><br>Emergency Helpline: 0422-3566580</p>
          </div>
        </div>
      `
    });

    res.json({
      success: emailResult.success,
      message: emailResult.success ? 'Blood request sent successfully' : 'Failed to send request',
      donorId: donorId,
      bloodGroup: bloodGroup,
      result: emailResult
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
    const { donorIds, bloodGroup, unitsRequired, urgency, purpose } = req.body;
    
    if (!donorIds || !Array.isArray(donorIds) || donorIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please select donors'
      });
    }

    console.log(`📧 Sending bulk requests to ${donorIds.length} donors for ${bloodGroup}`);
    
    // Send test email
    const emailResult = await sendEmail({
      from: `"LifeLink Blood Bank" <${process.env.EMAIL_USER}>`,
      to: 'ashwithac22@gmail.com',
      subject: `🩸 Bulk Request: ${bloodGroup}`,
      text: `Sent to ${donorIds.length} donors\nBlood Group: ${bloodGroup}\nUnits: ${unitsRequired}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc3545;">📧 Bulk Blood Requests Sent</h2>
          <p><strong>Recipients:</strong> ${donorIds.length} donors</p>
          <p><strong>Blood Group:</strong> ${bloodGroup}</p>
          <p><strong>Units Required:</strong> ${unitsRequired}</p>
          <p><strong>Status:</strong> ✅ Emails dispatched</p>
        </div>
      `
    });

    res.json({
      success: true,
      message: `Sent requests to ${donorIds.length} donors`,
      sent: donorIds.length,
      bloodGroup: bloodGroup,
      result: emailResult
    });

  } catch (error) {
    console.error('Bulk send error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Import other routes
const authRoutes = require('./routes/auth');
const donorRoutes = require('./routes/donors');
const donationRoutes = require('./routes/donations');
const requestRoutes = require('./routes/requests');
const inventoryRoutes = require('./routes/inventory');
const adminRoutes = require('./routes/admin');

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
    const testResult = await testEmailConfig();
    res.json({
      status: testResult ? 'healthy' : 'unhealthy',
      configured: true,
      smtp_test: testResult ? 'passed' : 'failed'
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Endpoint not found',
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎉 SERVER STARTED`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌍 Env: ${process.env.NODE_ENV || 'production'}`);
  console.log(`🗄️ DB: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '🔄 Connecting'}`);
  console.log(`📧 Email: ${process.env.EMAIL_USER ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
  console.log(`📧 Test: http://localhost:${PORT}/api/test-email?email=ashwithac22@gmail.com`);
  
  // Test email on startup
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    testEmailConfig().then(success => {
      if (success) {
        console.log('✅ Email service ready');
      }
    });
  }
});