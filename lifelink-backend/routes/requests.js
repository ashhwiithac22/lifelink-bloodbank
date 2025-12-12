const express = require('express');
const router = express.Router();
const { sendBloodRequestEmail } = require('../utils/emailService');
const User = require('../models/User');
const Request = require('../models/Request');

// Middleware to check if user is hospital or admin
const isHospitalOrAdmin = (req, res, next) => {
  // For demo, allow all requests
  // In production, check req.user.role
  next();
};

// Send blood request to a single donor - FIXED VERSION
router.post('/send-to-donor', isHospitalOrAdmin, async (req, res) => {
  try {
    console.log('📧 ======= /requests/send-to-donor CALLED =======');
    console.log('📧 Full request body:', JSON.stringify(req.body, null, 2));
    
    const { 
      donorId, 
      bloodGroup, 
      unitsRequired, 
      urgency, 
      contactPerson, 
      contactNumber, 
      purpose,
      hospitalName,
      location
    } = req.body;

    // Validate required fields
    if (!donorId || !bloodGroup) {
      console.error('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Donor ID and blood group are required'
      });
    }

    console.log(`📋 Processing request for donor: ${donorId}, blood group: ${bloodGroup}`);

    // Try to find donor in database
    let donor = null;
    try {
      donor = await User.findById(donorId);
      if (!donor) {
        console.log(`⚠️ Donor ${donorId} not found in database`);
        
        // Try to find any donor with matching blood group
        const matchingDonor = await User.findOne({ 
          bloodGroup: bloodGroup,
          role: 'donor'
        });
        
        if (matchingDonor) {
          console.log(`✅ Found matching donor with blood group ${bloodGroup}: ${matchingDonor.email}`);
          donor = matchingDonor;
        } else {
          // Use test email
          donor = {
            _id: donorId,
            name: 'Valued Donor',
            email: process.env.TEST_EMAIL || 'test@example.com',
            bloodGroup: bloodGroup
          };
          console.log(`📧 Using test email: ${donor.email}`);
        }
      } else {
        console.log(`✅ Found donor: ${donor.name} (${donor.email})`);
      }
    } catch (dbError) {
      console.error('⚠️ Database error:', dbError.message);
      donor = {
        _id: donorId,
        name: 'Valued Donor',
        email: process.env.TEST_EMAIL || 'test@example.com',
        bloodGroup: bloodGroup
      };
      console.log(`📧 Using fallback email: ${donor.email}`);
    }

    if (!donor.email) {
      console.error('❌ No email address available for donor');
      return res.status(400).json({
        success: false,
        error: 'Donor does not have an email address'
      });
    }

    console.log(`📤 Preparing to send email to: ${donor.email} (${donor.name})`);

    // Prepare request details
    const requestDetails = {
      hospitalName: hospitalName || 'LifeLink Hospital',
      bloodGroup: bloodGroup,
      unitsRequired: unitsRequired || 1,
      urgency: urgency || 'high',
      contactPerson: contactPerson || 'Hospital Staff',
      contactNumber: contactNumber || '0422-3566580',
      location: location || 'Coimbatore',
      purpose: purpose || 'Emergency blood requirement',
      donorId: donor._id
    };

    console.log('📋 Request details:', requestDetails);

    // ACTUALLY SEND THE EMAIL
    console.log('🚀 Calling sendBloodRequestEmail function...');
    const emailResult = await sendBloodRequestEmail(
      donor.email,
      donor.name,
      requestDetails
    );

    console.log('📧 Email result:', emailResult);

    if (!emailResult.success) {
      console.error('❌ Email sending failed:', emailResult.error);
      return res.status(500).json({
        success: false,
        error: emailResult.error || 'Failed to send email',
        donorId: donor._id,
        donorName: donor.name,
        donorEmail: donor.email
      });
    }

    console.log('✅ Email sent successfully! Message ID:', emailResult.messageId);

    // Save the request to database
    try {
      const request = new Request({
        hospitalId: req.user?._id || 'demo-hospital',
        hospitalName: requestDetails.hospitalName,
        donorId: donor._id,
        donorName: donor.name,
        donorEmail: donor.email,
        bloodGroup: bloodGroup,
        unitsRequired: unitsRequired || 1,
        urgency: urgency || 'high',
        contactPerson: contactPerson,
        contactNumber: contactNumber,
        purpose: purpose,
        status: 'sent',
        emailSent: true,
        emailMessageId: emailResult.messageId,
        emailSentAt: new Date()
      });
      
      await request.save();
      console.log('✅ Blood request saved to database with ID:', request._id);
    } catch (saveError) {
      console.warn('⚠️ Could not save blood request to database:', saveError.message);
      // Continue even if save fails
    }

    const responseData = {
      success: true,
      message: `Blood request email sent successfully to ${donor.name}`,
      donorId: donor._id,
      donorName: donor.name,
      donorEmail: donor.email,
      bloodGroup: bloodGroup,
      messageId: emailResult.messageId,
      timestamp: emailResult.timestamp,
      time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    };

    console.log('✅ Sending response:', responseData);
    
    res.json(responseData);

  } catch (error) {
    console.error('❌ Error in /send-to-donor:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'SERVER_ERROR',
      details: error.stack
    });
  }
});

// Simple test endpoint (for debugging)
router.get('/test-send', async (req, res) => {
  try {
    console.log('🧪 Testing email service directly...');
    
    // Get a donor from database
    const donor = await User.findOne({ role: 'donor' });
    
    if (!donor) {
      return res.status(404).json({
        success: false,
        error: 'No donors found in database'
      });
    }
    
    console.log(`🧪 Testing with donor: ${donor.name} (${donor.email})`);
    
    const requestDetails = {
      hospitalName: 'Test Hospital',
      bloodGroup: donor.bloodGroup || 'O+',
      unitsRequired: 2,
      urgency: 'high',
      contactPerson: 'Test Doctor',
      contactNumber: '0422-3566580',
      location: 'Coimbatore',
      purpose: 'Test email from /test-send endpoint',
      donorId: donor._id
    };
    
    console.log('🧪 Request details:', requestDetails);
    
    // Actually send the email
    const emailResult = await sendBloodRequestEmail(
      donor.email,
      donor.name,
      requestDetails
    );
    
    console.log('🧪 Email result:', emailResult);
    
    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        error: emailResult.error,
        donorId: donor._id,
        donorEmail: donor.email
      });
    }
    
    res.json({
      success: true,
      message: `Test email sent to ${donor.name}`,
      donorEmail: donor.email,
      messageId: emailResult.messageId,
      time: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Test error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send bulk requests to multiple donors
router.post('/send-bulk', isHospitalOrAdmin, async (req, res) => {
  try {
    console.log('📧 ======= /requests/send-bulk CALLED =======');
    console.log('📧 Donor IDs:', req.body.donorIds);
    console.log('📧 Blood Group:', req.body.bloodGroup);
    
    const { donorIds, bloodGroup, unitsRequired, urgency, purpose } = req.body;

    if (!donorIds || !Array.isArray(donorIds) || donorIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please select at least one donor'
      });
    }

    if (!bloodGroup) {
      return res.status(400).json({
        success: false,
        error: 'Blood group is required'
      });
    }

    // Get donors from database
    let donors = [];
    try {
      donors = await User.find({ _id: { $in: donorIds } });
      if (donors.length === 0) {
        console.log('⚠️ No donors found with given IDs, trying to find by blood group...');
        
        // Try to find donors by blood group
        donors = await User.find({ 
          bloodGroup: bloodGroup,
          role: 'donor'
        }).limit(5);
        
        if (donors.length === 0) {
          console.log('⚠️ No donors found at all, using test email');
          donors = [{
            _id: 'test-donor',
            name: 'Test Donor',
            email: process.env.TEST_EMAIL || 'test@example.com',
            bloodGroup: bloodGroup
          }];
        }
      }
      console.log(`📋 Found ${donors.length} donors`);
    } catch (dbError) {
      console.log('⚠️ Database error:', dbError.message);
      donors = [{
        _id: 'test-donor',
        name: 'Test Donor',
        email: process.env.TEST_EMAIL || 'test@example.com',
        bloodGroup: bloodGroup
      }];
    }

    console.log(`📤 Sending bulk requests to ${donors.length} donors`);

    const results = [];
    const errors = [];

    // Prepare request details
    const requestDetails = {
      hospitalName: 'LifeLink Hospital',
      bloodGroup: bloodGroup,
      unitsRequired: unitsRequired || 1,
      urgency: urgency || 'high',
      contactPerson: 'Hospital Staff',
      contactNumber: '0422-3566580',
      location: 'Coimbatore',
      purpose: purpose || 'Emergency blood requirement'
    };

    // Send emails to all donors
    for (const donor of donors) {
      try {
        console.log(`📧 Sending to ${donor.name} (${donor.email})`);
        const emailResult = await sendBloodRequestEmail(
          donor.email,
          donor.name,
          { ...requestDetails, donorId: donor._id }
        );

        if (emailResult.success) {
          console.log(`✅ Sent to ${donor.name}`);
          results.push({
            donorId: donor._id,
            donorName: donor.name,
            donorEmail: donor.email,
            success: true,
            messageId: emailResult.messageId
          });
        } else {
          console.error(`❌ Failed to send to ${donor.name}:`, emailResult.error);
          errors.push({
            donorId: donor._id,
            donorName: donor.name,
            error: emailResult.error
          });
        }
      } catch (error) {
        console.error(`❌ Error sending to ${donor.name}:`, error.message);
        errors.push({
          donorId: donor._id,
          donorName: donor.name,
          error: error.message
        });
      }
    }

    console.log(`📊 Results: ${results.length} successful, ${errors.length} failed`);

    res.json({
      success: true,
      message: `Sent requests to ${results.length} donors successfully${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
      donorCount: donorIds.length,
      successfulCount: results.length,
      failedCount: errors.length,
      bloodGroup: bloodGroup,
      unitsRequired: unitsRequired,
      results: results,
      errors: errors,
      time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    });

  } catch (error) {
    console.error('❌ Error in /send-bulk:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all requests
router.get('/', async (req, res) => {
  try {
    const requests = await Request.find()
      .sort({ createdAt: -1 })
      .limit(100);
    
    res.json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error('Error getting requests:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get request by ID
router.get('/:id', async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }
    
    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('Error getting request:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update request status
router.put('/:id', isHospitalOrAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    const request = await Request.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    );
    
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }
    
    res.json({
      success: true,
      message: `Request ${status} successfully`,
      data: request
    });
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get my requests (for hospital) - FIXED VERSION
router.get('/my-requests', isHospitalOrAdmin, async (req, res) => {
  try {
    const requests = await Request.find({ hospitalId: req.user?._id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error('Error getting my requests:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get email status for a request
router.get('/email-status/:requestId', async (req, res) => {
  try {
    const request = await Request.findById(req.params.requestId);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }
    
    res.json({
      success: true,
      emailSent: request.emailSent || false,
      emailMessageId: request.emailMessageId,
      emailSentAt: request.emailSentAt,
      status: request.status
    });
  } catch (error) {
    console.error('Error getting email status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get request statistics
router.get('/stats', async (req, res) => {
  try {
    const totalRequests = await Request.countDocuments();
    const pendingRequests = await Request.countDocuments({ status: 'pending' });
    const approvedRequests = await Request.countDocuments({ status: 'approved' });
    const fulfilledRequests = await Request.countDocuments({ status: 'fulfilled' });
    const rejectedRequests = await Request.countDocuments({ status: 'rejected' });
    
    // Get requests by blood group
    const requestsByBloodGroup = await Request.aggregate([
      {
        $group: {
          _id: '$bloodGroup',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Get recent activity
    const recentActivity = await Request.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('hospitalName bloodGroup unitsRequired status createdAt');
    
    res.json({
      success: true,
      stats: {
        total: totalRequests,
        pending: pendingRequests,
        approved: approvedRequests,
        fulfilled: fulfilledRequests,
        rejected: rejectedRequests
      },
      byBloodGroup: requestsByBloodGroup,
      recentActivity: recentActivity
    });
  } catch (error) {
    console.error('Error getting request stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create new blood request (traditional form submission)
router.post('/', isHospitalOrAdmin, async (req, res) => {
  try {
    const { 
      hospitalName,
      bloodGroup,
      unitsRequired,
      urgency,
      patientName,
      contactPerson,
      contactNumber,
      purpose,
      location
    } = req.body;

    // Validate
    if (!hospitalName || !bloodGroup || !unitsRequired) {
      return res.status(400).json({
        success: false,
        error: 'Hospital name, blood group, and units required are required'
      });
    }

    // Create blood request
    const request = new Request({
      hospitalId: req.user?._id,
      hospitalName,
      bloodGroup,
      unitsRequired: parseInt(unitsRequired),
      urgency: urgency || 'medium',
      patientName,
      contactPerson,
      contactNumber,
      purpose,
      location,
      status: 'pending'
    });

    await request.save();

    res.json({
      success: true,
      message: 'Blood request created successfully',
      requestId: request._id,
      data: request
    });

  } catch (error) {
    console.error('Error creating blood request:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// REMOVED: Get hospital's donor requests (causing error)
// router.get('/hospital/donor-requests', isHospitalOrAdmin, async (req, res) => {
//   try {
//     const requests = await Request.find({ hospitalId: req.user?._id })
//       .sort({ createdAt: -1 });
    
//     res.json({
//       success: true,
//       count: requests.length,
//       data: requests
//     });
//   } catch (error) {
//     console.error('Error getting hospital requests:', error);
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// });

module.exports = router;