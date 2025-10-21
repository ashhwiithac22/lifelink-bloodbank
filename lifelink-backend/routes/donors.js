const express = require('express');
const User = require('../models/User');

const router = express.Router();

// Get all donors (with filtering)
router.get('/', async (req, res) => {
  try {
    const { bloodGroup, city } = req.query;
    let filter = { role: 'donor', availability: true };

    if (bloodGroup) filter.bloodGroup = bloodGroup;
    if (city) filter.city = new RegExp(city, 'i');

    const donors = await User.find(filter).select('-password');
    res.json(donors);
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