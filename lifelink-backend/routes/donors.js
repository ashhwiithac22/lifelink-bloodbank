//routes/donors.js
const express = require('express');
const User = require('../models/User');

const router = express.Router();

// Get all donors (with filtering)
// Get all donors (with advanced filtering)
router.get('/', async (req, res) => {
  try {
    const { bloodGroup, city, availability, search } = req.query;
    let filter = { role: 'donor' };

    if (bloodGroup) filter.bloodGroup = bloodGroup;
    if (city) filter.city = new RegExp(city, 'i');
    if (availability !== undefined) filter.availability = availability === 'true';
    
    // Text search across multiple fields
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { city: new RegExp(search, 'i') },
        { bloodGroup: new RegExp(search, 'i') }
      ];
    }

    const donors = await User.find(filter)
      .select('-password')
      .sort({ availability: -1, createdAt: -1 });

    res.json(donors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get donor statistics
router.get('/stats', async (req, res) => {
  try {
    const totalDonors = await User.countDocuments({ role: 'donor' });
    const availableDonors = await User.countDocuments({ role: 'donor', availability: true });
    
    const donorsByBloodGroup = await User.aggregate([
      { $match: { role: 'donor' } },
      {
        $group: {
          _id: '$bloodGroup',
          count: { $sum: 1 },
          available: {
            $sum: { $cond: [{ $eq: ['$availability', true] }, 1, 0] }
          }
        }
      }
    ]);

    const donorsByCity = await User.aggregate([
      { $match: { role: 'donor' } },
      {
        $group: {
          _id: '$city',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      totalDonors,
      availableDonors,
      donorsByBloodGroup,
      donorsByCity
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update donor availability
router.put('/availability', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id);
    if (!user || user.role !== 'donor') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { availability } = req.body;
    const donor = await User.findByIdAndUpdate(
      user._id,
      { availability },
      { new: true }
    ).select('-password');

    res.json(donor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get donor profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id);
    if (!user || user.role !== 'donor') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ MUST HAVE THIS LINE:
module.exports = router;