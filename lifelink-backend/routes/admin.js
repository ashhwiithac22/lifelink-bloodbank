//routes/admin.js
const express = require('express');
const User = require('../models/User');
const Request = require('../models/Request');
const Inventory = require('../models/Inventory');
const EmailLog = require('../models/EmailLog'); // NEW
const { auth } = require('../middleware/auth');
const { sendEmail, emailTemplates } = require('../utils/emailService'); // UPDATED

const router = express.Router();

// Get dashboard stats
router.get('/dashboard', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const totalDonors = await User.countDocuments({ role: 'donor' });
    const totalHospitals = await User.countDocuments({ role: 'hospital' });
    const totalRequests = await Request.countDocuments();
    const pendingRequests = await Request.countDocuments({ status: 'pending' });

    const stats = {
      totalDonors,
      totalHospitals,
      totalRequests,
      pendingRequests
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// NEW: Send email to donor endpoint
router.post('/send-email-to-donor', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { donorId, subject, body } = req.body;

    // Validate required fields
    if (!donorId || !subject || !body) {
      return res.status(400).json({ 
        message: 'Donor ID, subject, and body are required' 
      });
    }

    // Find donor
    const donor = await User.findById(donorId);
    if (!donor || donor.role !== 'donor') {
      return res.status(404).json({ message: 'Donor not found' });
    }

    // Create email log entry
    const emailLog = new EmailLog({
      senderId: req.user._id,
      senderName: req.user.name,
      recipientDonorId: donor._id,
      recipientEmail: donor.email,
      recipientName: donor.name,
      subject,
      body,
      status: 'pending'
    });

    await emailLog.save();

    // Prepare email options
    const emailOptions = {
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
            .content { line-height: 1.6; color: #333; }
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
                  <strong>Sent by:</strong> ${req.user.name} (Admin)<br>
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
    };

    // Send email
    const emailResult = await sendEmail(emailOptions);

    // Update email log with result
    if (emailResult.success) {
      emailLog.status = 'sent';
      emailLog.messageId = emailResult.messageId;
      emailLog.sentAt = new Date();
    } else {
      emailLog.status = 'failed';
      emailLog.error = emailResult.error;
    }

    await emailLog.save();

    if (emailResult.success) {
      res.json({ 
        success: true, 
        message: 'Email sent successfully',
        logId: emailLog._id,
        messageId: emailResult.messageId
      });
    } else {
      res.status(500).json({ 
        success: false,
        message: 'Failed to send email',
        error: emailResult.error,
        logId: emailLog._id
      });
    }

  } catch (error) {
    console.error('Error sending email to donor:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// NEW: Get email logs for admin
router.get('/email-logs', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const emailLogs = await EmailLog.find()
      .populate('senderId', 'name email')
      .populate('recipientDonorId', 'name bloodGroup')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await EmailLog.countDocuments();

    res.json({
      emailLogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Existing routes remain the same...
router.get('/requests', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const requests = await Request.find({})
      .populate('hospitalId', 'hospitalName email contact city')
      .populate('donorRequests.donorId', 'name email bloodGroup contact city availability')
      .sort({ createdAt: -1 });

    // Apply deduplication logic - keep only latest request per hospital+donor+bloodGroup
    const uniqueRequestsMap = new Map();
    
    requests.forEach(request => {
      if (request.donorRequests && request.donorRequests.length > 0) {
        request.donorRequests.forEach(donorReq => {
          const key = `${request.hospitalId}_${donorReq.donorId}_${request.bloodGroup}`;
          
          if (!uniqueRequestsMap.has(key) || new Date(request.createdAt) > new Date(uniqueRequestsMap.get(key).createdAt)) {
            uniqueRequestsMap.set(key, {
              ...request.toObject(),
              displayDonorRequest: donorReq,
              isAuto: request.purpose && request.purpose.includes('AUTO: Low inventory alert'),
              hasDuplicates: false
            });
          } else {
            // Mark as duplicate
            const existing = uniqueRequestsMap.get(key);
            existing.hasDuplicates = true;
          }
        });
      } else {
        // Handle requests without donorRequests (auto-generated requests)
        const key = `${request.hospitalId}_${request.bloodGroup}_${request._id}`;
        uniqueRequestsMap.set(key, {
          ...request.toObject(),
          isAuto: request.purpose && request.purpose.includes('AUTO: Low inventory alert'),
          hasDuplicates: false
        });
      }
    });

    // Convert to array and format for frontend
    const uniqueRequests = Array.from(uniqueRequestsMap.values()).map(item => ({
      _id: item._id,
      hospitalId: item.hospitalId?._id,
      hospitalName: item.hospitalName,
      bloodGroup: item.bloodGroup,
      unitsRequired: item.unitsRequired,
      urgency: item.urgency,
      status: item.status,
      purpose: item.purpose,
      contactPerson: item.contactPerson,
      contactNumber: item.contactNumber,
      city: item.city,
      createdAt: item.createdAt,
      // Donor info if available
      donorName: item.displayDonorRequest?.donorName,
      donorEmail: item.displayDonorRequest?.donorEmail,
      donorId: item.displayDonorRequest?.donorId,
      // Flags
      isAuto: item.isAuto,
      hasDuplicates: item.hasDuplicates
    }));

    res.json(uniqueRequests);
  } catch (error) {
    console.error('Error fetching admin requests:', error);
    res.status(500).json({ message: error.message });
  }
});

router.put('/requests/:id/status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { status } = req.body;
    const validStatuses = ['pending', 'approved', 'rejected', 'fulfilled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const request = await Request.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('hospitalId', 'hospitalName email contact');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.json(request);
  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/notify-hospitals', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { bloodGroup } = req.body;
    
    if (!bloodGroup) {
      return res.status(400).json({ message: 'Blood group is required' });
    }

    // Get all hospitals
    const hospitals = await User.find({ role: 'hospital' });
    
    // Create auto-request for each hospital
    const notificationPromises = hospitals.map(async (hospital) => {
      const autoRequest = new Request({
        hospitalId: hospital._id,
        hospitalName: hospital.hospitalName,
        bloodGroup: bloodGroup,
        city: hospital.city,
        unitsRequired: 5, // Default units for auto-requests
        urgency: 'high',
        status: 'pending',
        contactPerson: 'System Administrator',
        contactNumber: '0422-3566580',
        purpose: `AUTO: Low inventory alert - ${bloodGroup} blood needed urgently`,
        isAutoGenerated: true
      });

      await autoRequest.save();
    });

    await Promise.all(notificationPromises);

    res.json({ 
      message: `Low inventory notification sent to ${hospitals.length} hospitals for ${bloodGroup} blood`,
      hospitalsNotified: hospitals.length 
    });
  } catch (error) {
    console.error('Error notifying hospitals:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/urgent-inventory', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const urgentInventory = await Inventory.find({ 
      unitsAvailable: { $lte: 3 } 
    });

    res.json(urgentInventory);
  } catch (error) {
    console.error('Error fetching urgent inventory:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/users', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/users/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    // Prevent admin from deleting themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;