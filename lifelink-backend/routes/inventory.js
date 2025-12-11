const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');

// ========== SIMPLE ENDPOINTS ==========

// GET /api/inventory/simple - Returns array for frontend
router.get('/simple', async (req, res) => {
  try {
    console.log('🩸 Fetching inventory via /simple endpoint');
    const inventory = await Inventory.find().sort({ bloodGroup: 1 });
    console.log(`📊 Found ${inventory.length} items`);
    
    // Debug log
    inventory.forEach(item => {
      console.log(`   ${item.bloodGroup}: ${item.unitsAvailable} units`);
    });
    
    res.json(inventory);
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/inventory - Main endpoint
router.get('/', async (req, res) => {
  try {
    const inventory = await Inventory.find().sort({ bloodGroup: 1 });
    res.json(inventory);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;