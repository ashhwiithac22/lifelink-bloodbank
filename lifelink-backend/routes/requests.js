//backend/routes/requests.js
const express = require('express');
const Request = require('../models/Request');
const Inventory = require('../models/Inventory');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create blood request (Hospital only) - ENHANCED WITH DONOR SELECTION
router.post('/', auth, async (req, res) => {
  try {
    // Check if user is hospital
    if (req.user.role !== 'hospital') {
      return res.status(403).json({ message: 'Only hospitals can create requests' });
    }

    const request = await Request.create({
      ...req.body,
      hospitalId: req.user._id,
      hospitalName: req.user.hospitalName
    });

    res.status(201).json(request);
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(400).json({ message: error.message });
  }
});

// NEW: Send blood request to specific donor
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
        emailSent: true,
        emailSentAt: new Date()
      }],
      totalEmailsSent: 1
    });

    // Send email to donor
    try {
      const { emailTemplates, sendEmail } = require('../utils/emailService');
      const emailOptions = emailTemplates.donorBloodRequest(
        { ...req.body, _id: request._id },
        donor,
        { hospitalName: req.user.hospitalName }
      );
      
      const emailResult = await sendEmail(emailOptions);
      
      if (emailResult.success) {
        console.log(`✅ Blood request email sent to donor: ${donor.email}`);
        
        // Update request with email status
        await Request.findByIdAndUpdate(request._id, {
          'donorRequests.0.emailSent': true,
          'donorRequests.0.emailSentAt': new Date()
        });
      } else {
        console.log('⚠️ Email sending failed, but request was recorded');
      }
    } catch (emailError) {
      console.error('❌ Email sending error:', emailError);
      // Continue even if email fails - request is still recorded
    }

    res.status(201).json({
      message: 'Blood request sent to donor successfully',
      request,
      donor: {
        name: donor.name,
        email: donor.email,
        bloodGroup: donor.bloodGroup
      }
    });

  } catch (error) {
    console.error('Error sending request to donor:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get all requests (with filtering)
router.get('/', auth, async (req, res) => {
  try {
    const { status, bloodGroup } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (bloodGroup) filter.bloodGroup = bloodGroup;

    // If user is hospital, only show their requests
    if (req.user.role === 'hospital') {
      filter.hospitalId = req.user._id;
    }

    const requests = await Request.find(filter)
      .populate('hospitalId', 'hospitalName email contact')
      .populate('donorRequests.donorId', 'name email bloodGroup contact')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get requests for admin with advanced filtering
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
      .populate('hospitalId', 'hospitalName email contact')
      .populate('donorRequests.donorId', 'name email bloodGroup contact')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching admin requests:', error);
    res.status(500).json({ message: error.message });
  }
});

// Search requests with advanced filters
router.get('/search', auth, async (req, res) => {
  try {
    const { bloodGroup, status, hospitalName, city, dateFrom, dateTo } = req.query;
    let filter = {};

    if (bloodGroup) filter.bloodGroup = bloodGroup;
    if (status) filter.status = status;
    if (city) filter.city = new RegExp(city, 'i');
    if (hospitalName) filter.hospitalName = new RegExp(hospitalName, 'i');

    // Date range filter
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    // Hospital users can only see their own requests
    if (req.user.role === 'hospital') {
      filter.hospitalId = req.user._id;
    }

    const requests = await Request.find(filter)
      .populate('hospitalId', 'hospitalName email contact')
      .populate('donorRequests.donorId', 'name email bloodGroup contact')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error searching requests:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get request statistics
router.get('/stats', auth, async (req, res) => {
  try {
    let matchStage = {};

    // Hospital users can only see their own stats
    if (req.user.role === 'hospital') {
      matchStage.hospitalId = req.user._id;
    }

    const stats = await Request.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalUnits: { $sum: '$unitsRequired' }
        }
      }
    ]);

    const totalRequests = await Request.countDocuments(matchStage);
    const pendingRequests = await Request.countDocuments({ ...matchStage, status: 'pending' });
    const emailsSent = await Request.aggregate([
      { $match: matchStage },
      { $group: { _id: null, total: { $sum: '$totalEmailsSent' } } }
    ]);

    res.json({
      totalRequests,
      pendingRequests,
      totalEmailsSent: emailsSent[0]?.total || 0,
      statusBreakdown: stats
    });
  } catch (error) {
    console.error('Error fetching request stats:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update request status (Admin only) with email notifications
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { status } = req.body;
    const request = await Request.findById(req.params.id).populate('hospitalId');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const oldStatus = request.status;
    request.status = status;
    await request.save();

    // AUTO-DECREASE INVENTORY WHEN REQUEST IS APPROVED
    if (status === 'approved') {
      const inventory = await Inventory.findOneAndUpdate(
        { bloodGroup: request.bloodGroup },
        { 
          $inc: { unitsAvailable: -request.unitsRequired },
          $min: { unitsAvailable: 0 }
        },
        { new: true }
      );

      if (!inventory) {
        return res.status(404).json({ message: 'Blood group not found in inventory' });
      }

      // Send approval email
      if (request.hospitalId && request.hospitalId.email) {
        try {
          const { emailTemplates, sendEmail } = require('../utils/emailService');
          const emailOptions = emailTemplates.requestApproved(request, request.hospitalId.email);
          await sendEmail(emailOptions);
          console.log('✅ Approval email sent to:', request.hospitalId.email);
        } catch (emailError) {
          console.log('⚠️ Email sending failed, but request was approved');
        }
      }

      // Check for low stock alert
      if (inventory.unitsAvailable < 5) {
        console.log(`🚨 CRITICAL STOCK: ${request.bloodGroup} now has ${inventory.unitsAvailable} units`);
      }
    }

    // Send rejection email
    if (status === 'rejected' && request.hospitalId && request.hospitalId.email) {
      try {
        const { emailTemplates, sendEmail } = require('../utils/emailService');
        const emailOptions = emailTemplates.requestRejected(request, request.hospitalId.email);
        await sendEmail(emailOptions);
        console.log('✅ Rejection email sent to:', request.hospitalId.email);
      } catch (emailError) {
        console.log('⚠️ Email sending failed, but request was rejected');
      }
    }

    // AUTO-INCREASE INVENTORY IF REQUEST IS REJECTED (return units)
    if (status === 'rejected' && oldStatus === 'approved') {
      await Inventory.findOneAndUpdate(
        { bloodGroup: request.bloodGroup },
        { $inc: { unitsAvailable: request.unitsRequired } }
      );
    }

    res.json({
      request,
      message: `Request ${status} successfully`
    });
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get donor requests for a specific hospital
router.get('/hospital/donor-requests', auth, async (req, res) => {
  try {
    if (req.user.role !== 'hospital') {
      return res.status(403).json({ message: 'Access denied. Hospital only.' });
    }

    const requests = await Request.find({ 
      hospitalId: req.user._id,
      'donorRequests.0': { $exists: true } // Only requests with donor emails sent
    })
    .populate('donorRequests.donorId', 'name email bloodGroup contact availability')
    .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching hospital donor requests:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;