const nodemailer = require('nodemailer');

// Create transporter with enhanced configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    requireTLS: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      ciphers: 'SSLv3'
    },
    debug: true // Enable debugging
  });
};

// Verify transporter connection
const verifyTransporter = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('❌ SMTP connection failed:', error.message);
    return false;
  }
};

// Enhanced email templates
const emailTemplates = {
  // Donor Blood Request Email
  donorBloodRequest: (request, donor, hospital, hospitalContact) => ({
    from: `"LifeLink Blood Bank" <${process.env.EMAIL_USER}>`,
    to: donor.email,
    subject: `🩸 Urgent Blood Request from ${hospital.hospitalName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px; }
          .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #dc3545; padding-bottom: 20px; }
          .urgent-alert { background: #fff5f5; padding: 20px; border-radius: 8px; border-left: 4px solid #dc3545; margin-bottom: 25px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="color: #dc3545; margin: 0;">LifeLink Blood Bank</h1>
          </div>
          <div class="urgent-alert">
            <h2 style="color: #dc3545; margin: 0 0 15px 0;">Urgent Blood Request</h2>
            <p>Dear ${donor.name},</p>
            <p><strong>${hospital.hospitalName}</strong> urgently needs <strong>${request.bloodGroup}</strong> blood.</p>
            <p><strong>Contact:</strong> ${request.contactPerson} - ${request.contactNumber}</p>
          </div>
          <div class="footer">
            <p>LifeLink Blood Bank<br>Emergency Helpline: 0422-3566580</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Urgent Blood Request\n\nDear ${donor.name},\n\n${hospital.hospitalName} urgently needs ${request.bloodGroup} blood.\n\nContact: ${request.contactPerson} - ${request.contactNumber}\n\nLifeLink Blood Bank\nEmergency Helpline: 0422-3566580`
  }),

  // Admin to Donor Email
  adminToDonor: (admin, donor, subject, body) => ({
    from: `"LifeLink Blood Bank" <${process.env.EMAIL_USER}>`,
    to: donor.email,
    subject: subject,
    html: `
      <!DOCTYPE html>
      <html>
      <body>
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc3545;">LifeLink Blood Bank</h2>
          <p>Dear ${donor.name},</p>
          <p>${body.replace(/\n/g, '<br>')}</p>
          <hr>
          <p>Sent by: ${admin.name}<br>Blood Bank: 0422-3566580</p>
        </div>
      </body>
      </html>
    `,
    text: `Dear ${donor.name},\n\n${body}\n\nSent by: ${admin.name}\nBlood Bank: 0422-3566580`
  }),

  requestApproved: (request, hospitalEmail) => ({
    from: `"LifeLink Blood Bank" <${process.env.EMAIL_USER}>`,
    to: hospitalEmail,
    subject: `✅ Blood Request Approved - ${request.bloodGroup}`,
    text: `Your blood request for ${request.bloodGroup} has been approved.\n\nRequest ID: ${request._id}\nUnits: ${request.unitsRequired}\n\nLifeLink Blood Bank\n0422-3566580`
  }),

  requestRejected: (request, hospitalEmail) => ({
    from: `"LifeLink Blood Bank" <${process.env.EMAIL_USER}>`,
    to: hospitalEmail,
    subject: `❌ Blood Request Update - ${request.bloodGroup}`,
    text: `Your blood request for ${request.bloodGroup} has been rejected due to insufficient inventory.\n\nPlease try again later.\n\nLifeLink Blood Bank\n0422-3566580`
  })
};

// Enhanced send email function with detailed logging
const sendEmail = async (emailOptions) => {
  try {
    console.log('\n📧 ======= EMAIL SENDING ATTEMPT =======');
    console.log('To:', emailOptions.to);
    console.log('Subject:', emailOptions.subject);
    console.log('From:', process.env.EMAIL_USER);

    // Check if email credentials exist
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('❌ EMAIL CREDENTIALS MISSING');
      return { 
        success: false, 
        error: 'Email credentials not configured',
        skipped: true 
      };
    }

    // Test SMTP connection first
    const isVerified = await verifyTransporter();
    if (!isVerified) {
      return {
        success: false,
        error: 'SMTP connection failed'
      };
    }

    const transporter = createTransporter();
    
    // Add fallback text content if not provided
    if (!emailOptions.text && emailOptions.html) {
      // Create simple text from HTML
      emailOptions.text = emailOptions.html
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    const info = await transporter.sendMail(emailOptions);
    
    console.log('✅ EMAIL SENT SUCCESSFULLY');
    console.log('Message ID:', info.messageId);
    console.log('================================\n');
    
    return { 
      success: true, 
      messageId: info.messageId,
      response: info.response 
    };
    
  } catch (error) {
    console.error('\n❌ EMAIL SENDING FAILED:', error.message);
    console.error('Error Code:', error.code);
    console.error('Stack:', error.stack);
    console.log('================================\n');
    
    return { 
      success: false, 
      error: error.message,
      code: error.code,
      details: error 
    };
  }
};

// Test email configuration
const testEmailConfig = async (testEmail = null) => {
  console.log('\n🧪 ======= EMAIL CONFIGURATION TEST =======');
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('❌ CREDENTIALS NOT FOUND IN .env');
    console.log('EMAIL_USER exists:', !!process.env.EMAIL_USER);
    console.log('EMAIL_PASS exists:', !!process.env.EMAIL_PASS);
    console.log('================================\n');
    return false;
  }
  
  console.log('Email User:', process.env.EMAIL_USER);
  console.log('Email Pass Length:', process.env.EMAIL_PASS.length);
  
  try {
    // Test SMTP connection
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ SMTP CONNECTION VERIFIED');
    
    // Send test email if email provided
    if (testEmail) {
      console.log('Sending test email to:', testEmail);
      
      const testResult = await sendEmail({
        from: `"LifeLink Test" <${process.env.EMAIL_USER}>`,
        to: testEmail,
        subject: '✅ LifeLink Email Test - SUCCESS',
        text: 'Congratulations! Your LifeLink email system is working correctly.',
        html: '<h2>✅ Email Test Successful!</h2><p>Your LifeLink email system is working correctly.</p>'
      });
      
      console.log('Test Email Result:', testResult.success ? '✅ Sent' : '❌ Failed');
    }
    
    console.log('✅ EMAIL CONFIGURATION TEST PASSED');
    console.log('================================\n');
    return true;
    
  } catch (error) {
    console.error('❌ EMAIL CONFIGURATION TEST FAILED');
    console.error('Error:', error.message);
    
    // Specific error handling
    if (error.code === 'EAUTH') {
      console.log('\n🔧 AUTHENTICATION ERROR SOLUTIONS:');
      console.log('1. Use Gmail App Password (not your regular password)');
      console.log('2. Enable 2-Step Verification on Google');
      console.log('3. Generate App Password: https://myaccount.google.com/apppasswords');
      console.log('4. Make sure EMAIL_PASS is 16 characters, no spaces');
    }
    
    console.log('================================\n');
    return false;
  }
};

module.exports = { 
  emailTemplates, 
  sendEmail, 
  testEmailConfig,
  verifyTransporter
};