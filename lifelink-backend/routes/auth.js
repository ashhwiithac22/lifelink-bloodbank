//routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Inventory = require('../models/Inventory');

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Register user
// routes/auth.js - Update the register route
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, bloodGroup, age, city, contact, hospitalName } = req.body;

    console.log('Registration attempt for:', email, 'Role:', role);

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Validate role-specific requirements
    if (role === 'donor') {
      if (!bloodGroup || !age) {
        return res.status(400).json({ message: 'Blood group and age are required for donors' });
      }
    }

    if (role === 'hospital') {
      if (!hospitalName) {
        return res.status(400).json({ message: 'Hospital name is required for hospitals' });
      }
    }

    // For admin role, no additional fields are required
    // You can add admin-specific validation here if needed

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      bloodGroup: role === 'donor' ? bloodGroup : undefined,
      age: role === 'donor' ? age : undefined,
      city,
      contact,
      hospitalName: role === 'hospital' ? hospitalName : undefined,
      availability: role === 'donor' // Default availability for donors
    });

    console.log('User created successfully:', user.email, 'Role:', user.role);

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bloodGroup: user.bloodGroup,
        city: user.city,
        hospitalName: user.hospitalName,
        availability: user.availability,
        token: generateToken(user._id),
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.correctPassword(password, user.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bloodGroup: user.bloodGroup,
        city: user.city,
        hospitalName: user.hospitalName,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// ✅ MUST HAVE THIS LINE:
module.exports = router;