const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Email templates
const emailTemplates = {
  requestApproved: (request, hospitalEmail) => ({
    from: process.env.EMAIL_USER || 'noreply@lifelink.com',
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
          Emergency Contact: +1-800-LIFELINK</p>
        </div>
      </div>
    `
  }),

  requestRejected: (request, hospitalEmail) => ({
    from: process.env.EMAIL_USER || 'noreply@lifelink.com',
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
          Emergency Contact: +1-800-LIFELINK</p>
        </div>
      </div>
    `
  })
};

// Send email function
const sendEmail = async (emailOptions) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('📧 Email credentials not configured. Skipping email send.');
      return { success: true, message: 'Email skipped - not configured' };
    }

    const transporter = createTransporter();
    const info = await transporter.sendMail(emailOptions);
    console.log('✅ Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { emailTemplates, sendEmail };