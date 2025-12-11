const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // FIX: Verify token and handle both id and _id
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'lifelink_secret');
    
    // Try id first, then _id as fallback
    const userId = decoded.id || decoded._id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Invalid token structure' });
    }

    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {});
    
    // Check if user is admin
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};

module.exports = { auth, adminAuth };