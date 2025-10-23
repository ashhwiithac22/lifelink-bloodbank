//backend/utils/emailService.js
const nodemailer = require('nodemailer');

// Create transporter with correct syntax
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Enhanced email templates with better error handling
const emailTemplates = {
  // Donor Blood Request Email - ENHANCED
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
          .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .details-table td { padding: 10px; border-bottom: 1px solid #eee; }
          .cta-section { background: #e7f3ff; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0; }
          .footer { text-align: center; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
          .contact-highlight { background: #fff3cd; padding: 15px; border-radius: 6px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="color: #dc3545; margin: 0;">LifeLink Blood Bank</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Saving Lives Together</p>
          </div>

          <div class="urgent-alert">
            <h2 style="color: #dc3545; margin: 0 0 15px 0;">Urgent Blood Request</h2>
            <p style="margin: 0; color: #333; font-size: 16px;">
              Dear <strong>${donor.name}</strong>,
            </p>
            <p style="margin: 15px 0; color: #333;">
              <strong>${hospital.hospitalName}</strong> urgently needs <strong>${request.bloodGroup}</strong> blood donation.
            </p>
          </div>

          <div class="contact-highlight">
            <h3 style="margin: 0 0 10px 0; color: #856404;">📞 Immediate Contact Information</h3>
            <p style="margin: 5px 0; font-size: 16px;">
              <strong>Hospital:</strong> ${hospital.hospitalName}<br>
              <strong>Contact Person:</strong> ${request.contactPerson}<br>
              <strong>Phone:</strong> <a href="tel:${request.contactNumber}" style="color: #007bff; text-decoration: none; font-weight: bold;">${request.contactNumber}</a><br>
              <strong>Your Contact:</strong> ${donor.contact} | ${donor.email}
            </p>
          </div>

          <h3 style="color: #333; margin: 0 0 15px 0;">📋 Request Details</h3>
          <table class="details-table">
            <tr>
              <td style="color: #666; width: 40%;"><strong>Blood Group Needed:</strong></td>
              <td style="color: #333;">
                <span style="background: #dc3545; color: white; padding: 4px 12px; border-radius: 20px; font-weight: bold;">
                  ${request.bloodGroup}
                </span>
              </td>
            </tr>
            <tr>
              <td style="color: #666;"><strong>Units Required:</strong></td>
              <td style="color: #333;">${request.unitsRequired} unit(s)</td>
            </tr>
            <tr>
              <td style="color: #666;"><strong>Urgency Level:</strong></td>
              <td style="color: #333;">
                <span style="color: ${
                  request.urgency === 'high' ? '#dc3545' : 
                  request.urgency === 'medium' ? '#ff9800' : '#4caf50'
                }; font-weight: bold; text-transform: capitalize;">
                  ${request.urgency} priority
                </span>
              </td>
            </tr>
            <tr>
              <td style="color: #666;"><strong>Purpose:</strong></td>
              <td style="color: #333;">${request.purpose}</td>
            </tr>
            <tr>
              <td style="color: #666;"><strong>Request Date:</strong></td>
              <td style="color: #333;">${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
            </tr>
          </table>

          <div class="cta-section">
            <h3 style="color: #0056b3; margin: 0 0 15px 0;">💪 You Can Save Lives!</h3>
            <p style="margin: 0 0 20px 0; color: #333; font-size: 16px;">
              Your ${donor.bloodGroup} blood is urgently needed. Please contact the hospital immediately if you can help.
            </p>
            <div style="margin: 20px 0;">
              <a href="tel:${request.contactNumber}" style="display: inline-block; background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 5px;">
                📞 Call Hospital Now
              </a>
              <a href="mailto:${hospitalContact}" style="display: inline-block; background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 5px;">
                📧 Email Response
              </a>
            </div>
            <p style="margin: 15px 0 0 0; color: #666; font-size: 14px;">
              ⚠️ Each donation can save up to 3 lives!
            </p>
          </div>

          <div class="footer">
            <p style="margin: 0 0 10px 0;">
              <strong>LifeLink Blood Bank</strong><br>
              Emergency Helpline: 📞 <strong>0422-3566580</strong><br>
              Email: support@lifelink.com
            </p>
            <p style="margin: 0; font-size: 11px; color: #999;">
              This is an automated message. Please do not reply directly to this email.<br>
              Contact the hospital directly using the phone number provided above.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // NEW: Admin to Donor Email Template
  adminToDonor: (admin, donor, subject, body) => ({
    from: `"LifeLink Blood Bank" <${process.env.EMAIL_USER}>`,
    to: donor.email,
    subject: subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px; }
          .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #dc3545; padding-bottom: 20px; }
          .content { line-height: 1.6; color: #333; white-space: pre-line; }
          .footer { text-align: center; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
          .admin-info { background: #e7f3ff; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="color: #dc3545; margin: 0;">LifeLink Blood Bank</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Saving Lives Together</p>
          </div>

          <div class="content">
            <p>Dear <strong>${donor.name}</strong>,</p>
            
            ${body.replace(/\n/g, '<br>')}
            
            <div class="admin-info">
              <p style="margin: 0;">
                <strong>Sent by:</strong> ${admin.name} (Admin)<br>
                <strong>Blood Bank Contact:</strong> 0422-3566580<br>
                <strong>Email:</strong> support@lifelink.com
              </p>
            </div>
          </div>

          <div class="footer">
            <p style="margin: 0 0 10px 0;">
              <strong>LifeLink Blood Bank</strong><br>
              Emergency Helpline: 📞 <strong>0422-3566580</strong><br>
              Email: support@lifelink.com
            </p>
            <p style="margin: 0; font-size: 11px; color: #999;">
              This email was sent to you because you are a registered blood donor with LifeLink Blood Bank.<br>
              Please do not reply directly to this email. Contact the blood bank using the phone number above.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  requestApproved: (request, hospitalEmail) => ({
    from: `"LifeLink Blood Bank" <${process.env.EMAIL_USER}>`,
    to: hospitalEmail,
    subject: `✅ Blood Request Approved - ${request.bloodGroup}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2ecc71;">Blood Request Approved!</h2>
        <p>Dear Hospital Administrator,</p>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>Request Details:</h3>
          <p><strong>Blood Group:</strong> ${request.bloodGroup}</p>
          <p><strong>Units Approved:</strong> ${request.unitsRequired}</p>
          <p><strong>Request ID:</strong> ${request._id}</p>
          <p><strong>Approval Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <p>The blood units have been reserved for your hospital. Please coordinate with the blood bank for collection.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p><strong>LifeLink Blood Bank</strong><br>
          Emergency Contact: 0422-3566580</p>
        </div>
      </div>
    `
  }),

  requestRejected: (request, hospitalEmail) => ({
    from: `"LifeLink Blood Bank" <${process.env.EMAIL_USER}>`,
    to: hospitalEmail,
    subject: `❌ Blood Request Update - ${request.bloodGroup}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">Blood Request Update</h2>
        <p>Dear Hospital Administrator,</p>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>Request Details:</h3>
          <p><strong>Blood Group:</strong> ${request.bloodGroup}</p>
          <p><strong>Units Requested:</strong> ${request.unitsRequired}</p>
          <p><strong>Request ID:</strong> ${request._id}</p>
          <p><strong>Status:</strong> Rejected</p>
        </div>

        <p>Unfortunately, we are unable to fulfill your blood request at this time due to insufficient inventory.</p>
        <p>Please try again later or contact our emergency helpline for urgent requirements.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p><strong>LifeLink Blood Bank</strong><br>
          Emergency Contact: 0422-3566580</p>
        </div>
      </div>
    `
  })
};

// Enhanced send email function with better error handling
const sendEmail = async (emailOptions) => {
  try {
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('📧 Email credentials not configured. Skipping email send.');
      return { 
        success: false, 
        error: 'Email credentials not configured',
        skipped: true 
      };
    }

    console.log(`📧 Attempting to send email to: ${emailOptions.to}`);
    console.log(`📧 Email subject: ${emailOptions.subject}`);

    const transporter = createTransporter();
    
    // Send email
    const info = await transporter.sendMail(emailOptions);
    
    console.log('✅ Email sent successfully!');
    console.log(`✅ Message ID: ${info.messageId}`);
    console.log(`✅ To: ${emailOptions.to}`);
    
    return { 
      success: true, 
      messageId: info.messageId,
      response: info.response 
    };
    
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Email sending failed';
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Email authentication failed. Check your email credentials.';
    } else if (error.code === 'EENVELOPE') {
      errorMessage = 'Invalid email address or envelope configuration.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Could not connect to email server. Check your internet connection.';
    } else {
      errorMessage = error.message;
    }
    
    return { 
      success: false, 
      error: errorMessage,
      details: error 
    };
  }
};

// Test email configuration
const testEmailConfig = async () => {
  console.log('🧪 Testing email configuration...');
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('❌ Email credentials not found in environment variables');
    return false;
  }
  
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email configuration test passed');
    return true;
  } catch (error) {
    console.error('❌ Email configuration test failed:', error.message);
    return false;
  }
};

module.exports = { 
  emailTemplates, 
  sendEmail, 
  testEmailConfig
};