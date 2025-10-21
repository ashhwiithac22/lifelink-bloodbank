//routes/inventory.js
const express = require('express');
const Inventory = require('../models/Inventory');
const User = require('../models/User');

const router = express.Router();

// Get blood inventory
router.get('/', async (req, res) => {
  try {
    const inventory = await Inventory.find().sort({ bloodGroup: 1 });
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update inventory (Admin only)
// Add manual adjustment endpoint
router.put('/adjust', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { bloodGroup, adjustment, reason } = req.body;
    
    // Validate adjustment (can be positive or negative)
    if (typeof adjustment !== 'number') {
      return res.status(400).json({ message: 'Adjustment must be a number' });
    }

    const inventory = await Inventory.findOneAndUpdate(
      { bloodGroup },
      { 
        $inc: { unitsAvailable: adjustment },
        $min: { unitsAvailable: 0 } // Prevent negative values
      },
      { new: true }
    );

    if (!inventory) {
      return res.status(404).json({ message: 'Blood group not found' });
    }

    res.json({
      inventory,
      message: `Inventory adjusted by ${adjustment} units. Reason: ${reason}`
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;