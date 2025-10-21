const express = require('express');
const Donation = require('../models/Donation');
const Inventory = require('../models/Inventory');
const User = require('../models/User');

const router = express.Router();

// Record a new donation
router.post('/', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { bloodGroup, unitsDonated, hospitalId, hospitalName } = req.body;

    // Create donation record
    const donation = await Donation.create({
      donorId: user._id,
      donorName: user.name,
      bloodGroup,
      unitsDonated,
      hospitalId,
      hospitalName
    });

    // ✅ AUTO-INCREASE INVENTORY
    const inventory = await Inventory.findOneAndUpdate(
      { bloodGroup },
      { $inc: { unitsAvailable: unitsDonated } },
      { new: true }
    );

    if (!inventory) {
      return res.status(404).json({ message: 'Blood group not found in inventory' });
    }

    res.status(201).json({
      donation,
      updatedInventory: inventory
    });

  } catch (error) {
    console.error('Donation error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get all donations
router.get('/', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    let filter = {};
    
    if (token) {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (user && user.role === 'donor') {
        filter.donorId = user._id;
      } else if (user && user.role === 'hospital') {
        filter.hospitalId = user._id;
      }
    }

    const donations = await Donation.find(filter)
      .populate('donorId', 'name email contact')
      .populate('hospitalId', 'hospitalName')
      .sort({ donationDate: -1 });

    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get donation statistics
router.get('/stats', async (req, res) => {
  try {
    const totalDonations = await Donation.countDocuments();
    const totalUnits = await Donation.aggregate([
      {
        $group: {
          _id: null,
          totalUnits: { $sum: '$unitsDonated' }
        }
      }
    ]);
    
    const donationsByBloodGroup = await Donation.aggregate([
      {
        $group: {
          _id: '$bloodGroup',
          totalUnits: { $sum: '$unitsDonated' },
          donationCount: { $sum: 1 }
        }
      }
    ]);

    res.json({
      totalDonations,
      totalUnits: totalUnits[0]?.totalUnits || 0,
      donationsByBloodGroup
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;