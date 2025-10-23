//routes/admin.js
const express = require('express');
const User = require('../models/User');
const Request = require('../models/Request');
const Inventory = require('../models/Inventory');
const { auth } = require('../middleware/auth');

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

// NEW: Get all requests for admin with deduplication and auto-request tracking
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

// NEW: Update request status
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

// NEW: Notify hospitals about low inventory
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

// NEW: Get urgent inventory (blood groups with ≤ 3 units)
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

// Get all users
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

// Delete user
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