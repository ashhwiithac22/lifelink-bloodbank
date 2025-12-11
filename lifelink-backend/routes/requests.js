//backend/routes/requests.js
const express = require('express');
const Request = require('../models/Request');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// NEW: Check for duplicate requests before sending
// Add this function at the top of your requests.js file
const checkDuplicateRequest = async (hospitalId, donorId, bloodGroup) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const existingRequest = await Request.findOne({
      hospitalId: hospitalId,
      'donorRequests.donorId': donorId,
      bloodGroup: bloodGroup,
      createdAt: { $gte: twentyFourHoursAgo },
      status: 'pending'
    });

    return existingRequest;
  } catch (error) {
    console.error('Error checking duplicate request:', error);
    return null;
  }
};


// NEW: Send blood request to specific donor with DUPLICATE PREVENTION
router.post('/send-to-donor', auth, async (req, res) => {
  try {
    // Check if user is hospital
    if (req.user.role !== 'hospital') {
      return res.status(403).json({ message: 'Only hospitals can send requests to donors' });
    }

    const { donorId, bloodGroup, unitsRequired, urgency, contactPerson, contactNumber, purpose } = req.body;

    // Validate required fields
    if (!donorId || !bloodGroup || !unitsRequired || !contactPerson || !contactNumber || !purpose) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Get donor details
    const donor = await User.findById(donorId);
    if (!donor || donor.role !== 'donor') {
      return res.status(404).json({ message: 'Donor not found' });
    }

    // Check if donor is available
    if (!donor.availability) {
      return res.status(400).json({ message: 'This donor is currently not available' });
    }

    // NEW: Check for duplicate request within 24 hours
    const duplicateRequest = await checkDuplicateRequest(req.user._id, donorId, bloodGroup);
    if (duplicateRequest) {
      return res.status(409).json({ 
        message: `You already sent a ${bloodGroup} blood request to ${donor.name} in the last 24 hours.`,
        duplicate: true,
        existingRequest: {
          id: duplicateRequest._id,
          createdAt: duplicateRequest.createdAt,
          status: duplicateRequest.status
        }
      });
    }

    console.log(`📧 Preparing to send request to donor: ${donor.name} (${donor.email})`);

    // Create request record
    const request = await Request.create({
      hospitalId: req.user._id,
      hospitalName: req.user.hospitalName,
      bloodGroup,
      city: req.user.city,
      unitsRequired,
      urgency: urgency || 'medium',
      contactPerson,
      contactNumber,
      purpose,
      donorRequests: [{
        donorId: donor._id,
        donorEmail: donor.email,
        donorName: donor.name,
        emailSent: false,
        emailSentAt: null
      }],
      totalEmailsSent: 0
    });

    // Send email to donor with enhanced error handling
    let emailResult = { success: false, error: 'Email not attempted' };
    
    try {
      const { emailTemplates, sendEmail } = require('../utils/emailService');
      
      const emailOptions = emailTemplates.donorBloodRequest(
        { 
          bloodGroup, 
          unitsRequired, 
          urgency, 
          contactPerson, 
          contactNumber, 
          purpose,
          _id: request._id 
        },
        donor,
        { 
          hospitalName: req.user.hospitalName 
        },
        req.user.email // Hospital contact email
      );
      
      emailResult = await sendEmail(emailOptions);
      
      if (emailResult.success) {
        console.log(`✅ Blood request email sent successfully to: ${donor.email}`);
        
        // Update request with email status
        await Request.findByIdAndUpdate(request._id, {
          'donorRequests.0.emailSent': true,
          'donorRequests.0.emailSentAt': new Date(),
          totalEmailsSent: 1
        });
        
      } else {
        console.log('❌ Email sending failed:', emailResult.error);
        
        // Still update the request but mark email as not sent
        await Request.findByIdAndUpdate(request._id, {
          'donorRequests.0.emailSent': false,
          'donorRequests.0.emailError': emailResult.error
        });
      }
      
    } catch (emailError) {
      console.error('❌ Email sending error:', emailError);
      emailResult = { success: false, error: emailError.message };
      
      // Update request with error
      await Request.findByIdAndUpdate(request._id, {
        'donorRequests.0.emailSent': false,
        'donorRequests.0.emailError': emailError.message
      });
    }

    // Prepare response
    const responseData = {
      message: 'Blood request recorded successfully',
      request,
      donor: {
        name: donor.name,
        email: donor.email,
        contact: donor.contact,
        bloodGroup: donor.bloodGroup,
        city: donor.city
      },
      emailStatus: emailResult.success ? 'sent' : 'failed',
      emailDetails: emailResult
    };

    // Add appropriate message based on email status
    if (emailResult.success) {
      responseData.message = `Blood request sent to ${donor.name} successfully! Email dispatched.`;
    } else if (emailResult.skipped) {
      responseData.message = `Blood request recorded for ${donor.name}. Email service not configured.`;
    } else {
      responseData.message = `Blood request recorded for ${donor.name}. Email sending failed: ${emailResult.error}`;
    }

    // NEW: Emit real-time update via Socket.io
    try {
      const io = req.app.get('socketio');
      if (io) {
        io.emit('newEmailRequest', {
          requestId: request._id,
          hospitalId: req.user._id,
          hospitalName: req.user.hospitalName,
          bloodGroup: bloodGroup,
          donorName: donor.name,
          unitsRequired: unitsRequired,
          urgency: urgency,
          createdAt: request.createdAt,
          status: request.status
        });
        console.log('📢 Real-time update emitted for new email request');
      }
    } catch (socketError) {
      console.log('Socket.io not available for real-time updates');
    }

    res.status(201).json(responseData);

  } catch (error) {
    console.error('❌ Error sending request to donor:', error);
    res.status(400).json({ 
      message: 'Failed to send blood request',
      error: error.message 
    });
  }
});

// NEW: Get unique email requests for hospital (no duplicates)
router.get('/hospital/unique-email-requests', auth, async (req, res) => {
  try {
    if (req.user.role !== 'hospital') {
      return res.status(403).json({ message: 'Access denied. Hospital only.' });
    }

    const requests = await Request.find({ 
      hospitalId: req.user._id,
      'donorRequests.0': { $exists: true }
    })
    .populate('donorRequests.donorId', 'name email bloodGroup contact city availability')
    .sort({ createdAt: -1 });

    // NEW: Filter out duplicates - keep only the latest request for each donor+bloodGroup combination
    const uniqueRequestsMap = new Map();
    
    requests.forEach(request => {
      request.donorRequests.forEach(donorReq => {
        const key = `${donorReq.donorId}_${request.bloodGroup}`;
        
        if (!uniqueRequestsMap.has(key)) {
          // Store the entire request but mark which donor request we're showing
          uniqueRequestsMap.set(key, {
            ...request.toObject(),
            displayDonorRequest: donorReq,
            isDuplicate: false
          });
        } else {
          // Mark as duplicate for tracking
          const existing = uniqueRequestsMap.get(key);
          existing.isDuplicate = true;
          existing.duplicateCount = (existing.duplicateCount || 1) + 1;
        }
      });
    });

    // Convert map back to array and enhance with donor info
    const uniqueRequests = Array.from(uniqueRequestsMap.values()).map(item => ({
      _id: item._id,
      hospitalName: item.hospitalName,
      bloodGroup: item.bloodGroup,
      unitsRequired: item.unitsRequired,
      urgency: item.urgency,
      status: item.status,
      purpose: item.purpose,
      contactPerson: item.contactPerson,
      contactNumber: item.contactNumber,
      createdAt: item.createdAt,
      // Single donor info for display
      donorName: item.displayDonorRequest.donorName,
      donorEmail: item.displayDonorRequest.donorEmail,
      donorId: item.displayDonorRequest.donorId,
      emailSent: item.displayDonorRequest.emailSent,
      emailSentAt: item.displayDonorRequest.emailSentAt,
      donorResponded: item.displayDonorRequest.donorResponded,
      responseStatus: item.displayDonorRequest.responseStatus,
      // Additional info
      totalDonorsContacted: item.donorRequests.length,
      emailsSent: item.donorRequests.filter(dr => dr.emailSent).length,
      donorsResponded: item.donorRequests.filter(dr => dr.donorResponded).length,
      // Duplicate info
      hasDuplicates: item.isDuplicate,
      duplicateCount: item.duplicateCount || 1
    }));

    res.json(uniqueRequests);
  } catch (error) {
    console.error('Error fetching unique email requests:', error);
    res.status(500).json({ message: error.message });
  }
});

// Keep all other existing routes
router.get('/', auth, async (req, res) => {
  try {
    const { status, bloodGroup } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (bloodGroup) filter.bloodGroup = bloodGroup;

    if (req.user.role === 'hospital') {
      filter.hospitalId = req.user._id;
    }

    const requests = await Request.find(filter)
      .populate('hospitalId', 'hospitalName email contact city')
      .populate('donorRequests.donorId', 'name email bloodGroup contact city availability')
      .sort({ createdAt: -1 });

    const enhancedRequests = requests.map(request => ({
      ...request.toObject(),
      contactInfo: {
        hospitalContact: request.hospitalId?.contact,
        hospitalEmail: request.hospitalId?.email,
        donorContacts: request.donorRequests.map(dr => ({
          donorName: dr.donorId?.name,
          donorEmail: dr.donorId?.email,
          donorPhone: dr.donorId?.contact,
          donorCity: dr.donorId?.city
        }))
      }
    }));

    res.json(enhancedRequests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add this route to backend/routes/requests.js (before module.exports)

// GET /api/admin/requests - For admin dashboard
router.get('/admin/requests', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const requests = await Request.find({})
      .populate('hospitalId', 'hospitalName email contact city')
      .populate('donorRequests.donorId', 'name email bloodGroup contact city availability')
      .sort({ createdAt: -1 })
      .limit(50); // Limit to 50 most recent

    res.json(requests);
  } catch (error) {
    console.error('Error fetching admin requests:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/admin/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { status, bloodGroup, hospitalId } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (bloodGroup) filter.bloodGroup = bloodGroup;
    if (hospitalId) filter.hospitalId = hospitalId;

    const requests = await Request.find(filter)
      .populate('hospitalId', 'hospitalName email contact city')
      .populate('donorRequests.donorId', 'name email bloodGroup contact city availability')
      .sort({ createdAt: -1 });

    const adminRequests = requests.map(request => ({
      ...request.toObject(),
      fullContactInfo: {
        hospital: {
          name: request.hospitalId?.hospitalName,
          email: request.hospitalId?.email,
          phone: request.hospitalId?.contact,
          city: request.hospitalId?.city
        },
        donors: request.donorRequests.map(dr => ({
          name: dr.donorId?.name,
          email: dr.donorId?.email,
          phone: dr.donorId?.contact,
          bloodGroup: dr.donorId?.bloodGroup,
          city: dr.donorId?.city,
          availability: dr.donorId?.availability,
          emailSent: dr.emailSent,
          responded: dr.donorResponded
        }))
      }
    }));

    res.json(adminRequests);
  } catch (error) {
    console.error('Error fetching admin requests:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/hospital/donor-requests', auth, async (req, res) => {
  try {
    if (req.user.role !== 'hospital') {
      return res.status(403).json({ message: 'Access denied. Hospital only.' });
    }

    const requests = await Request.find({ 
      hospitalId: req.user._id,
      'donorRequests.0': { $exists: true }
    })
    .populate('donorRequests.donorId', 'name email bloodGroup contact city availability')
    .sort({ createdAt: -1 });

    const enhancedRequests = requests.map(request => ({
      ...request.toObject(),
      donorContactInfo: request.donorRequests.map(dr => ({
        donorId: dr.donorId?._id,
        name: dr.donorId?.name,
        email: dr.donorId?.email,
        phone: dr.donorId?.contact,
        bloodGroup: dr.donorId?.bloodGroup,
        city: dr.donorId?.city,
        availability: dr.donorId?.availability,
        emailSent: dr.emailSent,
        emailSentAt: dr.emailSentAt,
        responded: dr.donorResponded,
        responseStatus: dr.responseStatus
      }))
    }));

    res.json(enhancedRequests);
  } catch (error) {
    console.error('Error fetching hospital donor requests:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/email-status/:requestId', auth, async (req, res) => {
  try {
    const request = await Request.findById(req.params.requestId)
      .populate('donorRequests.donorId', 'name email contact');
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (req.user.role === 'hospital' && request.hospitalId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const emailStatus = request.donorRequests.map(dr => ({
      donorName: dr.donorId?.name,
      donorEmail: dr.donorId?.email,
      donorPhone: dr.donorId?.contact,
      emailSent: dr.emailSent,
      emailSentAt: dr.emailSentAt,
      donorResponded: dr.donorResponded,
      responseStatus: dr.responseStatus,
      responseDate: dr.responseDate
    }));

    res.json({
      requestId: request._id,
      hospitalName: request.hospitalName,
      bloodGroup: request.bloodGroup,
      emailStatus
    });
  } catch (error) {
    console.error('Error fetching email status:', error);
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { status } = req.body;
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
    res.status(400).json({ message: error.message });
  }
});

router.get('/stats', auth, async (req, res) => {
  try {
    let filter = {};
    
    if (req.user.role === 'hospital') {
      filter.hospitalId = req.user._id;
    }

    const totalRequests = await Request.countDocuments(filter);
    const pendingRequests = await Request.countDocuments({ ...filter, status: 'pending' });
    const approvedRequests = await Request.countDocuments({ ...filter, status: 'approved' });
    const rejectedRequests = await Request.countDocuments({ ...filter, status: 'rejected' });

    const bloodGroupStats = await Request.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$bloodGroup',
          count: { $sum: 1 },
          totalUnits: { $sum: '$unitsRequired' }
        }
      }
    ]);

    res.json({
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      bloodGroupStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;