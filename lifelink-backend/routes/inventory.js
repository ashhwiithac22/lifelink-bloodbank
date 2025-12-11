const express = require('express');
const Inventory = require('../models/Inventory');
const User = require('../models/User');

const router = express.Router();

// Get blood inventory
router.get('/', async (req, res) => {
  try {
    const inventory = await Inventory.find().sort({ bloodGroup: 1 });
    
    // Calculate stats
    const totalUnits = inventory.reduce((sum, item) => sum + (item.unitsAvailable || 0), 0);
    const criticalStocks = inventory.filter(item => (item.unitsAvailable || 0) < 5).length;
    const bloodTypes = inventory.filter(item => (item.unitsAvailable || 0) > 0).length;
    
    // Add stats to response
    const response = {
      inventory,
      stats: {
        totalUnits,
        criticalStocks,
        bloodTypes,
        totalItems: inventory.length
      }
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get inventory stats - NEW
router.get('/stats', async (req, res) => {
  try {
    const inventory = await Inventory.find().sort({ bloodGroup: 1 });
    
    const totalUnits = inventory.reduce((sum, item) => sum + (item.unitsAvailable || 0), 0);
    const criticalStocks = inventory.filter(item => (item.unitsAvailable || 0) < 5).length;
    const lowStocks = inventory.filter(item => (item.unitsAvailable || 0) < 10).length;
    const bloodTypes = inventory.filter(item => (item.unitsAvailable || 0) > 0).length;
    
    const bloodGroupStats = inventory.map(item => ({
      bloodGroup: item.bloodGroup,
      unitsAvailable: item.unitsAvailable,
      status: item.unitsAvailable < 5 ? 'critical' : item.unitsAvailable < 10 ? 'low' : 'good'
    }));
    
    res.json({
      totalUnits,
      criticalStocks,
      lowStocks,
      bloodTypes,
      bloodGroupStats,
      totalItems: inventory.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get dashboard stats - NEW
router.get('/dashboard-stats', async (req, res) => {
  try {
    const inventory = await Inventory.find();
    
    const totalUnits = inventory.reduce((sum, item) => sum + (item.unitsAvailable || 0), 0);
    const criticalStocks = inventory.filter(item => (item.unitsAvailable || 0) < 5).length;
    const bloodTypes = inventory.filter(item => (item.unitsAvailable || 0) > 0).length;
    
    res.json({
      totalUnits,
      criticalStocks,
      bloodTypes,
      inventory: inventory.map(item => ({
        bloodGroup: item.bloodGroup,
        unitsAvailable: item.unitsAvailable,
        status: item.unitsAvailable < 5 ? 'critical' : item.unitsAvailable < 10 ? 'low' : 'good'
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update inventory (Admin only)
router.put('/update', async (req, res) => {
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

    const { bloodGroup, unitsAvailable } = req.body;
    
    if (!bloodGroup || typeof unitsAvailable !== 'number') {
      return res.status(400).json({ message: 'Blood group and units are required' });
    }

    const inventory = await Inventory.findOneAndUpdate(
      { bloodGroup },
      { 
        unitsAvailable: Math.max(0, unitsAvailable),
        lastUpdated: new Date()
      },
      { new: true, upsert: true }
    );

    res.json({
      inventory,
      message: `Inventory updated for ${bloodGroup} to ${unitsAvailable} units`
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

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

// Get critical stocks - NEW
router.get('/critical', async (req, res) => {
  try {
    const criticalStocks = await Inventory.find({ 
      unitsAvailable: { $lt: 5 } 
    }).sort({ unitsAvailable: 1 });
    
    res.json({
      count: criticalStocks.length,
      stocks: criticalStocks
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;