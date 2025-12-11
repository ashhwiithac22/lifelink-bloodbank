const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Inventory = require('../models/Inventory');

const router = express.Router();

// FIXED: Generate JWT Token with consistent id field
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,  // ← CRITICAL FIX: Use id field consistently
      _id: user._id, // ← Also include _id for backward compatibility
      role: user.role 
    }, 
    process.env.JWT_SECRET, 
    { expiresIn: '30d' }
  );
};

// Register user
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
      availability: role === 'donor'
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
        token: generateToken(user), // ← Use fixed token generation
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
        token: generateToken(user), // ← Use fixed token generation
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
    
    // Try id first, then _id as fallback
    const userId = decoded.id || decoded._id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Invalid token structure' });
    }
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router;