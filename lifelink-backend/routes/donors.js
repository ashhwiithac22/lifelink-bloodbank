const express = require('express');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all donors (with filtering) - FIXED VERSION
router.get('/', auth, async (req, res) => {
  try {
    // Check if user has permission to view donors
    if (req.user.role !== 'hospital' && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. Only hospitals and admins can view donors.' 
      });
    }

    const { bloodGroup, city, availability, search } = req.query;
    
    // Build filter object
    let filter = { role: 'donor' };

    // Add filters if provided
    if (bloodGroup && bloodGroup !== '') {
      filter.bloodGroup = bloodGroup;
    }
    
    if (city && city !== '') {
      filter.city = new RegExp(city, 'i'); // Case-insensitive search
    }
    
    if (availability !== undefined && availability !== '') {
      filter.availability = availability === 'true';
    }
    
    // Text search across multiple fields
    if (search && search !== '') {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { city: new RegExp(search, 'i') },
        { bloodGroup: new RegExp(search, 'i') },
        { contact: new RegExp(search, 'i') }
      ];
    }

    console.log('Donor search filter:', filter);

    // Fetch donors with selected fields only
    const donors = await User.find(filter)
      .select('name email bloodGroup age city contact availability createdAt updatedAt')
      .sort({ availability: -1, createdAt: -1 });

    console.log(`Found ${donors.length} donors`);

    res.json(donors);
  } catch (error) {
    console.error('Error fetching donors:', error);
    res.status(500).json({ 
      message: 'Failed to fetch donors',
      error: error.message 
    });
  }
});

// Get donor statistics - FIXED VERSION
router.get('/stats', auth, async (req, res) => {
  try {
    const totalDonors = await User.countDocuments({ role: 'donor' });
    const availableDonors = await User.countDocuments({ 
      role: 'donor', 
      availability: true 
    });
    
    // Get unique cities count
    const uniqueCities = await User.distinct('city', { role: 'donor' });
    
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
      },
      { $sort: { _id: 1 } }
    ]);

    const donorsByCity = await User.aggregate([
      { $match: { role: 'donor' } },
      {
        $group: {
          _id: '$city',
          count: { $sum: 1 },
          available: {
            $sum: { $cond: [{ $eq: ['$availability', true] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      totalDonors,
      availableDonors,
      citiesCovered: uniqueCities.length,
      donorsByBloodGroup,
      donorsByCity
    });
  } catch (error) {
    console.error('Error fetching donor stats:', error);
    res.status(500).json({ 
      message: 'Failed to fetch donor statistics',
      error: error.message 
    });
  }
});

// Update donor availability - FIXED VERSION
router.put('/availability', auth, async (req, res) => {
  try {
    // Only donors can update their own availability
    if (req.user.role !== 'donor') {
      return res.status(403).json({ 
        message: 'Access denied. Only donors can update availability.' 
      });
    }

    const { availability } = req.body;
    
    if (typeof availability !== 'boolean') {
      return res.status(400).json({ 
        message: 'Availability must be a boolean value' 
      });
    }

    const donor = await User.findByIdAndUpdate(
      req.user._id,
      { availability },
      { new: true }
    ).select('-password');

    res.json({
      message: `Availability updated to ${availability ? 'Available' : 'Not Available'}`,
      donor
    });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(400).json({ 
      message: 'Failed to update availability',
      error: error.message 
    });
  }
});

// Get donor profile - FIXED VERSION
router.get('/profile', auth, async (req, res) => {
  try {
    // Only donors can access their own profile
    if (req.user.role !== 'donor') {
      return res.status(403).json({ 
        message: 'Access denied. Donor profile access only.' 
      });
    }

    const donor = await User.findById(req.user._id)
      .select('-password');

    res.json(donor);
  } catch (error) {
    console.error('Error fetching donor profile:', error);
    res.status(500).json({ 
      message: 'Failed to fetch donor profile',
      error: error.message 
    });
  }
});

// Get single donor by ID (for hospitals/admins)
router.get('/:id', auth, async (req, res) => {
  try {
    // Check if user has permission to view donor details
    if (req.user.role !== 'hospital' && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. Only hospitals and admins can view donor details.' 
      });
    }

    const donor = await User.findOne({ 
      _id: req.params.id, 
      role: 'donor' 
    }).select('-password');

    if (!donor) {
      return res.status(404).json({ 
        message: 'Donor not found' 
      });
    }

    res.json(donor);
  } catch (error) {
    console.error('Error fetching donor:', error);
    res.status(500).json({ 
      message: 'Failed to fetch donor',
      error: error.message 
    });
  }
});

module.exports = router;