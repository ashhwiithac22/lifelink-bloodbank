const express = require('express');
const Request = require('../models/Request');
const Inventory = require('../models/Inventory');
const User = require('../models/User');

const router = express.Router();

// Create blood request (Hospital only)
router.post('/', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id);
    if (!user || user.role !== 'hospital') {
      return res.status(403).json({ message: 'Only hospitals can create requests' });
    }

    const request = await Request.create({
      ...req.body,
      hospitalId: user._id,
      hospitalName: user.hospitalName
    });

    res.status(201).json(request);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all requests (with filtering)
router.get('/', async (req, res) => {
  try {
    const { status, hospitalId } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (hospitalId) filter.hospitalId = hospitalId;

    // If user is hospital, only show their requests
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (user && user.role === 'hospital') {
          filter.hospitalId = user._id;
        }
      } catch (error) {
        // Continue without user filter if token is invalid
      }
    }

    const requests = await Request.find(filter)
      .populate('hospitalId', 'hospitalName email contact')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get requests for admin with advanced filtering
router.get('/admin/all', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { status, bloodGroup, hospitalId } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (bloodGroup) filter.bloodGroup = bloodGroup;
    if (hospitalId) filter.hospitalId = hospitalId;

    const requests = await Request.find(filter)
      .populate('hospitalId', 'hospitalName email contact')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search requests with advanced filters
router.get('/search', async (req, res) => {
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

    const requests = await Request.find(filter)
      .populate('hospitalId', 'hospitalName email contact')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get request statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await Request.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalUnits: { $sum: '$unitsRequired' }
        }
      }
    ]);

    const totalRequests = await Request.countDocuments();
    const pendingRequests = await Request.countDocuments({ status: 'pending' });

    res.json({
      totalRequests,
      pendingRequests,
      statusBreakdown: stats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update request status (Admin only) - WITHOUT EMAIL FOR NOW
// Update request status (Admin only) with email notifications
router.put('/:id', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id);
    if (!user || user.role !== 'admin') {
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

    // ✅ AUTO-DECREASE INVENTORY WHEN REQUEST IS APPROVED
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

    // ✅ Send rejection email
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

    // ✅ AUTO-INCREASE INVENTORY IF REQUEST IS REJECTED (return units)
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
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;