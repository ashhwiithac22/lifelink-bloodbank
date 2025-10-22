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
  // Donor Blood Request Email
  donorBloodRequest: (request, donor, hospital) => ({
    from: process.env.EMAIL_USER || 'noreply@lifelink.com',
    to: donor.email,
    subject: `🩸 Urgent Blood Request from ${hospital.hospitalName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc3545; margin: 0;">LifeLink Blood Bank</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Saving Lives Together</p>
          </div>

          <!-- Main Content -->
          <div style="background: #fff5f5; padding: 20px; border-radius: 8px; border-left: 4px solid #dc3545; margin-bottom: 25px;">
            <h2 style="color: #dc3545; margin: 0 0 15px 0;">Urgent Blood Request</h2>
            <p style="margin: 0; color: #333; font-size: 16px;">
              Dear <strong>${donor.name}</strong>,
            </p>
            <p style="margin: 15px 0; color: #333;">
              <strong>${hospital.hospitalName}</strong> has requested your help for a <strong>${request.bloodGroup}</strong> blood donation.
            </p>
          </div>

          <!-- Request Details -->
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #333; margin: 0 0 15px 0;">📋 Request Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; width: 40%;"><strong>Hospital:</strong></td>
                <td style="padding: 8px 0; color: #333;">${hospital.hospitalName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Blood Group Needed:</strong></td>
                <td style="padding: 8px 0; color: #333;">
                  <span style="background: #dc3545; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">
                    ${request.bloodGroup}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Units Required:</strong></td>
                <td style="padding: 8px 0; color: #333;">${request.unitsRequired} unit(s)</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Urgency Level:</strong></td>
                <td style="padding: 8px 0; color: #333;">
                  <span style="color: ${
                    request.urgency === 'high' ? '#dc3545' : 
                    request.urgency === 'medium' ? '#ffc107' : '#28a745'
                  }; font-weight: bold; text-transform: capitalize;">
                    ${request.urgency}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Contact Person:</strong></td>
                <td style="padding: 8px 0; color: #333;">${request.contactPerson}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Contact Number:</strong></td>
                <td style="padding: 8px 0; color: #333;">
                  <a href="tel:${request.contactNumber}" style="color: #007bff; text-decoration: none;">
                    ${request.contactNumber}
                  </a>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Purpose:</strong></td>
                <td style="padding: 8px 0; color: #333;">${request.purpose}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Request Date:</strong></td>
                <td style="padding: 8px 0; color: #333;">${new Date().toLocaleDateString()}</td>
              </tr>
            </table>
          </div>

          <!-- Call to Action -->
          <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 25px;">
            <h3 style="color: #0056b3; margin: 0 0 15px 0;">💪 You Can Save Lives!</h3>
            <p style="margin: 0 0 20px 0; color: #333;">
              Please reach out to the hospital if you're available to help. Your donation can save up to 3 lives!
            </p>
            <div style="display: inline-block; background: #dc3545; padding: 12px 24px; border-radius: 6px;">
              <a href="tel:${request.contactNumber}" style="color: white; text-decoration: none; font-weight: bold; font-size: 16px;">
                📞 Contact Hospital Now
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding-top: 20px; border-top: 1px solid #ddd; color: #666;">
            <p style="margin: 0 0 10px 0;">
              <strong>LifeLink Blood Bank</strong><br>
              Emergency Helpline: 📞 0422-3566580
            </p>
            <p style="margin: 0; font-size: 12px;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    `
  }),

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
          Emergency Contact: 0422-3566580</p>
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
          Emergency Contact: 0422-3566580</p>
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
    console.log('✅ Email sent successfully to:', emailOptions.to);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { emailTemplates, sendEmail };