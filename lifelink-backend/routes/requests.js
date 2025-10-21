const express = require('express');
const Request = require('../models/Request');
const Inventory = require('../models/Inventory');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Create blood request (Hospital only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'hospital') {
      return res.status(403).json({ message: 'Only hospitals can create requests' });
    }

    const request = await Request.create({
      ...req.body,
      hospitalId: req.user._id,
      hospitalName: req.user.hospitalName
    });

    res.status(201).json(request);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all requests (with filtering)
router.get('/', auth, async (req, res) => {
  try {
    const { status, hospitalId } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (hospitalId) filter.hospitalId = hospitalId;
    if (req.user.role === 'hospital') {
      filter.hospitalId = req.user._id;
    }

    const requests = await Request.find(filter).sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update request status (Admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const request = await Request.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // If approved, update inventory
    if (status === 'approved') {
      await Inventory.findOneAndUpdate(
        { bloodGroup: request.bloodGroup },
        { $inc: { unitsAvailable: -request.unitsRequired } }
      );
    }

    res.json(request);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;