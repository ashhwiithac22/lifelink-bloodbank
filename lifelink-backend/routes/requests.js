const express = require('express');
const Request = require('../models/Request');
const Inventory = require('../models/Inventory');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// NEW: Send blood request to specific donor - ENHANCED WITH BETTER EMAIL HANDLING
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

    res.status(201).json(responseData);

  } catch (error) {
    console.error('❌ Error sending request to donor:', error);
    res.status(400).json({ 
      message: 'Failed to send blood request',
      error: error.message 
    });
  }
});

// Get all requests (with filtering) - ENHANCED WITH CONTACT INFO
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
      .populate('hospitalId', 'hospitalName email contact city')
      .populate('donorRequests.donorId', 'name email bloodGroup contact city availability')
      .sort({ createdAt: -1 });

    // Enhanced response with contact information
    const enhancedRequests = requests.map(request => ({
      ...request.toObject(),
      // Ensure contact info is available for hospitals/admins
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

// Get requests for admin with advanced filtering - ENHANCED
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

    // Add full contact information for admin
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

// Get donor requests for a specific hospital - ENHANCED
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

    // Enhanced response with donor contact info for hospital
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

// NEW: Get email delivery status
router.get('/email-status/:requestId', auth, async (req, res) => {
  try {
    const request = await Request.findById(req.params.requestId)
      .populate('donorRequests.donorId', 'name email contact');
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check if user has permission
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

// Keep all other existing routes (they're already good)
// ... [rest of your existing routes remain unchanged]

module.exports = router;