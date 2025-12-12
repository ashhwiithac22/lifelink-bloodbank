//routes/admin.js
const express = require('express');
const User = require('../models/User');
const Request = require('../models/Request');
const Donation = require('../models/Donation');
const Inventory = require('../models/Inventory');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Admin dashboard
router.get('/dashboard', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    // Get counts
    const totalDonors = await User.countDocuments({ role: 'donor' });
    const totalHospitals = await User.countDocuments({ role: 'hospital' });
    const totalRequests = await Request.countDocuments({});
    const pendingRequests = await Request.countDocuments({ status: 'pending' });
    const availableDonors = await User.countDocuments({ 
      role: 'donor', 
      availability: true 
    });
    
    // Get inventory stats
    const inventory = await Inventory.find();
    const totalUnits = inventory.reduce((sum, item) => sum + (item.unitsAvailable || 0), 0);
    const criticalStocks = inventory.filter(item => (item.unitsAvailable || 0) < 5).length;
    const bloodTypes = inventory.filter(item => (item.unitsAvailable || 0) > 0).length;

    res.json({
      totalDonors,
      totalHospitals,
      totalRequests,
      pendingRequests,
      availableDonors,
      totalUnits,
      criticalStocks,
      bloodTypes
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all users
router.get('/users', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get admin requests - FIXED: This was missing
router.get('/requests', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { status, bloodGroup } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (bloodGroup) filter.bloodGroup = bloodGroup;

    const requests = await Request.find(filter)
      .populate('hospitalId', 'hospitalName email contact city')
      .populate('donorRequests.donorId', 'name email bloodGroup contact city availability')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(requests);
  } catch (error) {
    console.error('Error fetching admin requests:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get user counts - NEW
router.get('/user-counts', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const donors = await User.countDocuments({ role: 'donor' });
    const hospitals = await User.countDocuments({ role: 'hospital' });
    const admins = await User.countDocuments({ role: 'admin' });
    const availableDonors = await User.countDocuments({ 
      role: 'donor', 
      availability: true 
    });

    res.json({
      donors,
      hospitals,
      admins,
      availableDonors,
      totalUsers: donors + hospitals + admins
    });
  } catch (error) {
    console.error('Error fetching user counts:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get dashboard stats - NEW
router.get('/dashboard-stats', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const [donors, hospitals, requests, donations, inventory] = await Promise.all([
      User.countDocuments({ role: 'donor' }),
      User.countDocuments({ role: 'hospital' }),
      Request.countDocuments({}),
      Donation.countDocuments({}),
      Inventory.find()
    ]);

    const totalUnits = inventory.reduce((sum, item) => sum + (item.unitsAvailable || 0), 0);
    const criticalStocks = inventory.filter(item => (item.unitsAvailable || 0) < 5).length;
    const pendingRequests = await Request.countDocuments({ status: 'pending' });
    const availableDonors = await User.countDocuments({ 
      role: 'donor', 
      availability: true 
    });

    res.json({
      donors,
      hospitals,
      totalRequests: requests,
      pendingRequests,
      totalDonations: donations,
      totalUnits,
      criticalStocks,
      availableDonors,
      bloodTypes: inventory.filter(item => (item.unitsAvailable || 0) > 0).length
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete user
router.delete('/users/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add this to backend/routes/admin.js - Before module.exports
// Update request status
router.put('/requests/:id/status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

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
    console.error('Error updating request status:', error);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;