const express = require('express');
const User = require('../models/User');
const Donation = require('../models/Donation');
const Request = require('../models/Request');
const Inventory = require('../models/Inventory');

const router = express.Router();

// Get comprehensive analytics
router.get('/dashboard', async (req, res) => {
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

    // Get all stats in parallel
    const [
      totalDonors,
      totalHospitals,
      totalDonations,
      totalRequests,
      inventory,
      bloodGroupStats
    ] = await Promise.all([
      User.countDocuments({ role: 'donor' }),
      User.countDocuments({ role: 'hospital' }),
      Donation.countDocuments(),
      Request.countDocuments(),
      Inventory.find().sort({ bloodGroup: 1 }),
      getBloodGroupStats()
    ]);

    // Calculate critical stock
    const criticalStock = inventory.filter(item => item.unitsAvailable < 5).length;
    const totalUnits = inventory.reduce((sum, item) => sum + item.unitsAvailable, 0);

    // Recent activity
    const recentDonations = await Donation.find()
      .populate('donorId', 'name bloodGroup')
      .sort({ donationDate: -1 })
      .limit(5);

    const recentRequests = await Request.find()
      .populate('hospitalId', 'hospitalName')
      .sort({ createdAt: -1 })
      .limit(5);

    // Request status breakdown
    const requestStats = await Request.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      overview: {
        totalDonors,
        totalHospitals,
        totalDonations,
        totalRequests,
        totalUnits,
        criticalStock
      },
      inventory: inventory,
      bloodGroupStats: bloodGroupStats,
      requestStats: requestStats,
      recentActivity: {
        donations: recentDonations,
        requests: recentRequests
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Helper function for blood group statistics
async function getBloodGroupStats() {
  return await Donation.aggregate([
    {
      $group: {
        _id: '$bloodGroup',
        totalDonations: { $sum: 1 },
        totalUnits: { $sum: '$unitsDonated' }
      }
    }
  ]);
}

// Export analytics data
router.get('/export', async (req, res) => {
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

    const { type } = req.query;

    let data;
    switch (type) {
      case 'donations':
        data = await Donation.find()
          .populate('donorId', 'name bloodGroup city')
          .populate('hospitalId', 'hospitalName')
          .sort({ donationDate: -1 });
        break;
      case 'requests':
        data = await Request.find()
          .populate('hospitalId', 'hospitalName city contact')
          .sort({ createdAt: -1 });
        break;
      case 'inventory':
        data = await Inventory.find().sort({ bloodGroup: 1 });
        break;
      default:
        return res.status(400).json({ message: 'Invalid export type' });
    }

    res.json({
      type,
      exportedAt: new Date().toISOString(),
      count: data.length,
      data
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;