// backend/utils/emailService.js
const nodemailer = require('nodemailer');

console.log('📧 Email Service Initializing...');

// Create transporter with FIXED configuration
const createTransporter = () => {
  try {
    console.log('🔧 Creating transporter with Gmail configuration...');
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Email credentials not configured in .env file');
    }

    // FIXED: Use correct Gmail configuration
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Use 'gmail' service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    console.log('✅ Transporter created successfully');
    return transporter;
    
  } catch (error) {
    console.error('❌ Failed to create transporter:', error.message);
    throw error;
  }
};

// Verify transporter connection
const verifyTransporter = async () => {
  try {
    console.log('🔧 Verifying SMTP connection...');
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('❌ SMTP connection failed:', error.message);
    
    // Detailed error help
    if (error.code === 'EAUTH') {
      console.log('\n🔧 AUTHENTICATION ERROR - COMMON FIXES:');
      console.log('1. Make sure you are using Gmail App Password (16 characters, no spaces)');
      console.log('2. Enable 2-Step Verification: https://myaccount.google.com/security');
      console.log('3. Generate App Password: https://myaccount.google.com/apppasswords');
      console.log('4. Your App Password should look like: "drmcqoyoergwgjad" (16 chars, no spaces)');
    }
    
    return false;
  }
};

// Enhanced email templates
const emailTemplates = {
  // Donor Blood Request Email - FIXED with better formatting
  donorBloodRequest: (request, donor, hospital, hospitalContact) => {
    const urgencyMap = {
      'low': '🟢 Low Priority',
      'medium': '🟡 Medium Priority', 
      'high': '🔴 High Priority',
      'critical': '🚨 CRITICAL - URGENT'
    };

    const urgency = urgencyMap[request.urgency] || 'Medium Priority';
    
    return {
      from: `"LifeLink Blood Bank" <${process.env.EMAIL_USER}>`,
      to: donor.email,
      subject: `🩸 ${urgency}: ${request.bloodGroup} Blood Request from ${hospital.hospitalName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              max-width: 600px; 
              margin: 0 auto; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 20px; 
            }
            .container { 
              background: white; 
              padding: 40px; 
              border-radius: 15px; 
              box-shadow: 0 10px 30px rgba(0,0,0,0.2); 
              margin: 20px 0;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              padding-bottom: 20px; 
              border-bottom: 3px solid #dc3545; 
            }
            .urgent-alert { 
              background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
              color: white; 
              padding: 25px; 
              border-radius: 10px; 
              margin-bottom: 30px; 
              text-align: center;
            }
            .details-card {
              background: #f8f9fa;
              padding: 25px;
              border-radius: 10px;
              margin-bottom: 25px;
              border-left: 4px solid #007bff;
            }
            .contact-card {
              background: #e3f2fd;
              padding: 25px;
              border-radius: 10px;
              margin-bottom: 30px;
              border: 2px solid #2196f3;
            }
            .btn {
              display: inline-block;
              padding: 14px 28px;
              background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
              color: white;
              text-decoration: none;
              border-radius: 50px;
              font-weight: bold;
              font-size: 16px;
              margin: 10px;
              transition: transform 0.3s, box-shadow 0.3s;
            }
            .btn:hover {
              transform: translateY(-3px);
              box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #dee2e6;
              text-align: center;
              color: #6c757d;
              font-size: 14px;
            }
            h1 { color: #dc3545; margin: 0 0 10px 0; }
            h2 { color: #343a40; margin: 0 0 15px 0; }
            p { margin: 0 0 15px 0; }
            strong { color: #495057; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🩸 LifeLink Blood Bank</h1>
              <p style="color: #6c757d; font-size: 18px;">Connecting Donors, Saving Lives</p>
            </div>
            
            <div class="urgent-alert">
              <h2 style="color: white; margin: 0 0 15px 0;">${urgency.toUpperCase()}</h2>
              <p style="font-size: 24px; font-weight: bold; margin: 0;">${request.bloodGroup} BLOOD NEEDED</p>
            </div>
            
            <div style="text-align: center; margin: 25px 0;">
              <p>Dear <strong style="color: #007bff; font-size: 18px;">${donor.name}</strong>,</p>
              <p style="font-size: 18px;">Your blood type <strong>${donor.bloodGroup}</strong> can save lives!</p>
            </div>
            
            <div class="details-card">
              <h2>📋 Request Details</h2>
              <p><strong>Hospital:</strong> ${hospital.hospitalName}</p>
              <p><strong>Blood Type Needed:</strong> <span style="color: #dc3545; font-weight: bold; font-size: 18px;">${request.bloodGroup}</span></p>
              <p><strong>Units Required:</strong> ${request.unitsRequired} unit(s)</p>
              <p><strong>Urgency Level:</strong> ${urgency}</p>
              <p><strong>Purpose:</strong> ${request.purpose || 'Emergency requirement'}</p>
              <p><strong>Request ID:</strong> ${request._id || 'N/A'}</p>
            </div>
            
            <div class="contact-card">
              <h2>📞 Immediate Contact Information</h2>
              <p><strong>Contact Person:</strong> ${request.contactPerson}</p>
              <p><strong>Contact Number:</strong> <a href="tel:${request.contactNumber}" style="color: #007bff; text-decoration: none; font-weight: bold;">${request.contactNumber}</a></p>
              <p><strong>Hospital Email:</strong> ${hospitalContact}</p>
              <p><strong>Request Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 20px; color: #28a745; font-weight: bold;">🎯 Your donation can save up to 3 lives!</p>
              <div>
                <a href="tel:${request.contactNumber}" class="btn">📞 CALL NOW TO DONATE</a>
                <br>
                <a href="mailto:${hospitalContact}" class="btn" style="background: linear-gradient(135deg, #007bff 0%, #6610f2 100%);">📧 EMAIL RESPONSE</a>
              </div>
            </div>
            
            <div class="footer">
              <p><strong style="color: #dc3545; font-size: 16px;">LifeLink Blood Bank</strong><br>
              🏥 Emergency Helpline: <strong>0422-3566580</strong> (Available 24/7)<br>
              📧 Email: ${process.env.EMAIL_USER}</p>
              <p style="font-size: 12px; color: #999; margin-top: 20px;">
                This is an automated blood request email from LifeLink Blood Bank System.<br>
                Please do not reply to this email. Contact the hospital directly.<br>
                Request ID: ${request._id || 'TEST'} | Generated: ${new Date().toISOString()}
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
URGENT BLOOD REQUEST - ${request.bloodGroup} BLOOD NEEDED

Dear ${donor.name},

${urgency.toUpperCase()}

${hospital.hospitalName} urgently needs ${request.bloodGroup} blood.

REQUEST DETAILS:
- Hospital: ${hospital.hospitalName}
- Blood Type Needed: ${request.bloodGroup}
- Units Required: ${request.unitsRequired}
- Urgency: ${request.urgency || 'Medium'}
- Purpose: ${request.purpose || 'Emergency requirement'}

IMMEDIATE CONTACT:
- Contact Person: ${request.contactPerson}
- Phone: ${request.contactNumber}
- Hospital Email: ${hospitalContact}

YOUR DONATION CAN SAVE UP TO 3 LIVES!

Please contact the hospital immediately if you can donate.

LifeLink Blood Bank
Emergency Helpline: 0422-3566580 (24/7)
Email: ${process.env.EMAIL_USER}

This is an automated blood request. Please contact the hospital directly.
Request ID: ${request._id || 'TEST'}
      `
    };
  },

  // Test email template
  testEmail: (toEmail) => ({
    from: `"LifeLink Blood Bank" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: '✅ LifeLink Email System Test - SUCCESS',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; }
          .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
          .success { color: #28a745; font-size: 48px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success">✅</div>
          <h2 style="color: #28a745;">Email System Working Perfectly!</h2>
          <p>Test email sent successfully on <strong>${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</strong></p>
          <p>Your LifeLink Blood Bank email system is configured correctly and ready to send blood request emails.</p>
          <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>LifeLink Blood Bank</strong><br>Emergency Helpline: 0422-3566580</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Test email sent successfully on ${new Date().toLocaleString()}\n\nYour LifeLink Blood Bank email system is working correctly!\n\nLifeLink Blood Bank\nEmergency: 0422-3566580`
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
      console.log('❌ EMAIL CREDENTIALS MISSING in .env file');
      console.log('💡 Add to .env:');
      console.log('EMAIL_USER=your-email@gmail.com');
      console.log('EMAIL_PASS=your-16-char-app-password');
      return { 
        success: false, 
        error: 'Email credentials not configured in .env',
        skipped: true 
      };
    }

    // Create transporter
    const transporter = createTransporter();
    
    // Send email
    console.log('📤 Sending email...');
    const info = await transporter.sendMail(emailOptions);
    
    console.log('✅ EMAIL SENT SUCCESSFULLY!');
    console.log('📬 Message ID:', info.messageId);
    console.log('📧 Response:', info.response);
    console.log('================================\n');
    
    return { 
      success: true, 
      messageId: info.messageId,
      response: info.response,
      to: emailOptions.to
    };
    
  } catch (error) {
    console.error('\n❌ EMAIL SENDING FAILED!');
    console.error('Error:', error.message);
    console.error('Error Code:', error.code);
    
    // Detailed error analysis
    if (error.code === 'EAUTH') {
      console.log('\n🔧 AUTHENTICATION ISSUE DETECTED');
      console.log('Your EMAIL_PASS in .env should be:');
      console.log('1. 16 characters long');
      console.log('2. No spaces (should be like: drmcqoyoergwgjad)');
      console.log('3. Gmail App Password, NOT your regular password');
      console.log('4. Generate at: https://myaccount.google.com/apppasswords');
    }
    
    console.log('================================\n');
    
    return { 
      success: false, 
      error: error.message,
      code: error.code,
      command: error.command
    };
  }
};

// Test email configuration
const testEmailConfig = async (testEmail = null) => {
  console.log('\n🧪 ======= EMAIL CONFIGURATION TEST =======');
  console.log('Testing with EMAIL_USER:', process.env.EMAIL_USER);
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('❌ CREDENTIALS MISSING in .env file');
    console.log('================================\n');
    return false;
  }
  
  try {
    // Test SMTP connection
    console.log('🔧 Testing SMTP connection to Gmail...');
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ SMTP CONNECTION VERIFIED');
    
    // Send test email if email provided
    if (testEmail) {
      console.log('📧 Sending test email to:', testEmail);
      
      const testResult = await sendEmail({
        from: `"LifeLink Test" <${process.env.EMAIL_USER}>`,
        to: testEmail,
        subject: '✅ LifeLink Email Test - SUCCESS',
        text: 'Congratulations! Your LifeLink email system is working correctly.',
        html: '<div style="text-align: center; padding: 30px;"><h2 style="color: #28a745;">✅ Email Test Successful!</h2><p>Your LifeLink email system is working correctly.</p></div>'
      });
      
      if (testResult.success) {
        console.log('🎉 TEST EMAIL SENT SUCCESSFULLY!');
      } else {
        console.log('❌ TEST EMAIL FAILED:', testResult.error);
      }
    }
    
    console.log('✅ EMAIL CONFIGURATION TEST COMPLETE');
    console.log('================================\n');
    return true;
    
  } catch (error) {
    console.error('❌ EMAIL CONFIGURATION TEST FAILED');
    console.error('Error:', error.message);
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