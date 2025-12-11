const nodemailer = require('nodemailer');
require('dotenv').config();

// Debug logging
console.log('📧 ======= EMAIL SERVICE INIT =======');
console.log('EMAIL_USER exists:', !!process.env.EMAIL_USER);
console.log('EMAIL_PASS length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0, 'chars');
console.log('===================================\n');

// Create transporter WITH TIMEOUT CONFIGURATION
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('❌ Email credentials not configured');
    return null;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      // CRITICAL: Add timeout configuration
      connectionTimeout: 15000, // 15 seconds
      socketTimeout: 20000, // 20 seconds
      greetingTimeout: 10000, // 10 seconds
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100
    });

    console.log('✅ Transporter created successfully with timeout configuration');
    return transporter;
  } catch (error) {
    console.error('❌ Error creating transporter:', error.message);
    return null;
  }
};

const transporter = createTransporter();

// Email templates
const emailTemplates = {
  testEmail: (toEmail) => ({
    from: `"LifeLink Blood Bank" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: '✅ LifeLink Email Service Test',
    text: `This is a test email from LifeLink Blood Bank system.\n\nIf you received this, email service is working correctly!\n\nTime: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="background: linear-gradient(135deg, #dc3545, #c82333); padding: 20px; border-radius: 8px 8px 0 0; color: white; text-align: center;">
          <h1 style="margin: 0;">✅ LifeLink Email Test</h1>
          <p style="margin: 10px 0 0 0;">Blood Bank Management System</p>
        </div>
        <div style="padding: 20px;">
          <h2 style="color: #333;">Email Service is Working!</h2>
          <p style="color: #555; line-height: 1.6;">
            This is a test email from the LifeLink Blood Bank system. 
            If you received this, the email service is configured correctly and ready to send notifications.
          </p>
          <div style="background: #e7f3ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #004085;">
              <strong>Test Details:</strong><br>
              Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}<br>
              Service: Gmail SMTP<br>
              Status: Active
            </p>
          </div>
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px;">
              <strong>LifeLink Blood Bank</strong><br>
              Emergency Helpline: 0422-3566580<br>
              24/7 Blood Donation Service
            </p>
          </div>
        </div>
      </div>
    `
  }),

  bloodRequest: (toEmail, donorName, requestDetails) => ({
    from: `"LifeLink Blood Bank" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `🩸 Urgent Blood Request: ${requestDetails.bloodGroup} Needed`,
    text: `
Dear ${donorName},

We have an urgent requirement for ${requestDetails.bloodGroup} blood.

Patient Details:
- Hospital: ${requestDetails.hospitalName || 'LifeLink Hospital'}
- Blood Group: ${requestDetails.bloodGroup}
- Units Required: ${requestDetails.unitsRequired}
- Urgency: ${requestDetails.urgency || 'High'}
- Location: ${requestDetails.location || 'Coimbatore'}

If you are available to donate, please respond to this email or call the emergency helpline.

Emergency Contact: 0422-3566580

Thank you for your life-saving support!

LifeLink Blood Bank
24/7 Emergency Service
${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
    `,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="background: linear-gradient(135deg, #dc3545, #c82333); padding: 20px; border-radius: 8px 8px 0 0; color: white; text-align: center;">
          <h1 style="margin: 0;">🩸 URGENT BLOOD REQUEST</h1>
          <p style="margin: 10px 0 0 0;">LifeLink Blood Bank - Emergency Alert</p>
        </div>
        
        <div style="padding: 20px;">
          <h2 style="color: #dc3545; margin-top: 0;">Dear ${donorName},</h2>
          
          <p style="color: #555; line-height: 1.6; font-size: 16px;">
            We have an <strong style="color: #dc3545;">URGENT REQUIREMENT</strong> for 
            <span style="background: #ffebee; padding: 2px 8px; border-radius: 4px; font-weight: bold;">${requestDetails.bloodGroup}</span> blood.
          </p>
          
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="color: #856404; margin-top: 0;">📋 Request Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #333; width: 40%;"><strong>Hospital:</strong></td>
                <td style="padding: 8px 0; color: #555;">${requestDetails.hospitalName || 'LifeLink Hospital'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #333;"><strong>Blood Group:</strong></td>
                <td style="padding: 8px 0; color: #555;">
                  <span style="background: #dc3545; color: white; padding: 4px 12px; border-radius: 20px; font-weight: bold;">
                    ${requestDetails.bloodGroup}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #333;"><strong>Units Required:</strong></td>
                <td style="padding: 8px 0; color: #555;">${requestDetails.unitsRequired} unit(s)</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #333;"><strong>Urgency Level:</strong></td>
                <td style="padding: 8px 0; color: #555;">
                  <span style="color: ${requestDetails.urgency === 'high' ? '#dc3545' : requestDetails.urgency === 'medium' ? '#ffc107' : '#28a745'}; font-weight: bold;">
                    ${(requestDetails.urgency || 'High').toUpperCase()}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #333;"><strong>Location:</strong></td>
                <td style="padding: 8px 0; color: #555;">${requestDetails.location || 'Coimbatore'}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="color: #155724; margin-top: 0;">✅ You Can Help Save Lives!</h3>
            <p style="color: #155724; margin: 10px 0;">
              If you are available to donate blood, please:
            </p>
            <ul style="color: #155724; padding-left: 20px;">
              <li>Reply to this email confirming availability</li>
              <li>Contact the emergency helpline immediately</li>
              <li>Visit the nearest donation center</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0; padding: 20px; background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-radius: 8px;">
            <h3 style="color: #dc3545; margin-top: 0;">🚨 Emergency Contact</h3>
            <p style="font-size: 24px; font-weight: bold; color: #333; margin: 10px 0;">
              📞 0422-3566580
            </p>
            <p style="color: #666; font-size: 14px; margin: 5px 0;">
              Available 24/7 • Immediate Response
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px; line-height: 1.5;">
              <strong>LifeLink Blood Bank</strong><br>
              A Unit of LifeLink Hospitals<br>
              Emergency Helpline: 0422-3566580<br>
              Email: support@lifelinkbloodbank.in<br>
              Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 10px;">
              "Every drop counts. Your donation can save up to 3 lives."
            </p>
          </div>
        </div>
      </div>
    `
  }),

  requestConfirmation: (toEmail, hospitalName, requestDetails) => ({
    from: `"LifeLink Blood Bank" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `✅ Blood Request Submitted: ${requestDetails.bloodGroup}`,
    text: `
Dear ${hospitalName},

Your blood request has been submitted successfully.

Request ID: ${requestDetails.requestId}
Blood Group: ${requestDetails.bloodGroup}
Units Requested: ${requestDetails.unitsRequired}
Urgency: ${requestDetails.urgency}

We have sent email notifications to available donors matching the blood group.

You can track the status in your dashboard.

Thank you for using LifeLink Blood Bank.

Emergency Contact: 0422-3566580

LifeLink Blood Bank
${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
    `,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="background: linear-gradient(135deg, #28a745, #218838); padding: 20px; border-radius: 8px 8px 0 0; color: white; text-align: center;">
          <h1 style="margin: 0;">✅ REQUEST CONFIRMED</h1>
          <p style="margin: 10px 0 0 0;">Blood Request Submitted Successfully</p>
        </div>
        
        <div style="padding: 20px;">
          <h2 style="color: #333; margin-top: 0;">Dear ${hospitalName},</h2>
          
          <p style="color: #555; line-height: 1.6; font-size: 16px;">
            Your blood request has been <strong style="color: #28a745;">submitted successfully</strong> 
            and notifications have been sent to available donors.
          </p>
          
          <div style="background: #e7f3ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h3 style="color: #004085; margin-top: 0;">📋 Request Summary:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #333; width: 40%;"><strong>Request ID:</strong></td>
                <td style="padding: 8px 0; color: #555;">${requestDetails.requestId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #333;"><strong>Blood Group:</strong></td>
                <td style="padding: 8px 0; color: #555;">
                  <span style="background: #dc3545; color: white; padding: 4px 12px; border-radius: 20px; font-weight: bold;">
                    ${requestDetails.bloodGroup}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #333;"><strong>Units Required:</strong></td>
                <td style="padding: 8px 0; color: #555;">${requestDetails.unitsRequired}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #333;"><strong>Urgency:</strong></td>
                <td style="padding: 8px 0; color: #555;">${requestDetails.urgency}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #333;"><strong>Status:</strong></td>
                <td style="padding: 8px 0; color: #28a745; font-weight: bold;">✅ Active</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #333;"><strong>Submitted:</strong></td>
                <td style="padding: 8px 0; color: #555;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #d4edda; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h3 style="color: #155724; margin-top: 0;">📧 Next Steps:</h3>
            <ul style="color: #155724; padding-left: 20px;">
              <li>Email notifications sent to matching donors</li>
              <li>Track responses in your dashboard</li>
              <li>Donors will contact you directly</li>
              <li>Update request status when fulfilled</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://lifelink-bloodbank.netlify.app/requests" 
               style="background: linear-gradient(135deg, #dc3545, #c82333); color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              📊 View in Dashboard
            </a>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px; line-height: 1.5;">
              <strong>LifeLink Blood Bank</strong><br>
              Emergency Helpline: 0422-3566580<br>
              Email: support@lifelinkbloodbank.in<br>
              Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
            </p>
          </div>
        </div>
      </div>
    `
  })
};

// Send email function with timeout
const sendEmail = async (emailOptions) => {
  if (!transporter) {
    console.error('❌ Cannot send email: Transporter not created');
    return {
      success: false,
      error: 'Email service not configured',
      code: 'NO_TRANSPORTER'
    };
  }

  try {
    console.log(`📤 Attempting to send email to: ${emailOptions.to}`);
    console.log(`📝 Subject: ${emailOptions.subject}`);
    
    // Add timeout to the send operation
    const sendPromise = transporter.sendMail(emailOptions);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Email sending timeout (15s)')), 15000);
    });
    
    const info = await Promise.race([sendPromise, timeoutPromise]);
    
    console.log(`✅ Email sent successfully to ${emailOptions.to}`);
    console.log(`📨 Message ID: ${info.messageId}`);
    console.log(`🔄 Response: ${info.response}`);
    
    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
      to: emailOptions.to,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    console.error('Error details:', error);
    
    return {
      success: false,
      error: error.message,
      code: error.code || 'SEND_ERROR',
      timestamp: new Date().toISOString()
    };
  }
};

// Test email configuration
const testEmailConfig = async (testEmail = null) => {
  if (!transporter) {
    console.error('❌ Test failed: Transporter not created');
    return false;
  }

  try {
    console.log('🔧 Testing email configuration...');
    
    // Test connection
    const verifyResult = await transporter.verify();
    console.log('✅ SMTP Connection verified:', verifyResult);
    
    // Try to send test email if email provided
    if (testEmail) {
      console.log(`📧 Sending test email to ${testEmail}...`);
      const testResult = await sendEmail(emailTemplates.testEmail(testEmail));
      return testResult.success;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Email configuration test failed:', error.message);
    console.error('Error stack:', error.stack);
    return false;
  }
};

// Verify transporter
const verifyTransporter = async () => {
  if (!transporter) {
    return { valid: false, error: 'Transporter not created' };
  }

  try {
    await transporter.verify();
    return { valid: true, message: 'SMTP connection verified' };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

module.exports = {
  sendEmail,
  emailTemplates,
  testEmailConfig,
  verifyTransporter,
  transporter
};