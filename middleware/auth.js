const jwt = require('jsonwebtoken');
const User = require('../models/User.js');
const config = require('../config/config.js');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  let token; // declare here
  try {
    
    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is invalid. User not found.'
      });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated.'
      });
    }
    
    // Check if user changed password after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        message: 'User recently changed password. Please login again.'
      });
    }
    
    // Check account status
    if (user.accountStatus === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Account is suspended. Contact support for assistance.'
      });
    }
    
    // Add user to request object
    req.user = user;
    next();
  } 
  
  catch (error) {
    console.error('Auth middleware error:', error);
    console.log("Generated token:", token);
    console.log("Using secret:", config.JWT_SECRET);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Authentication error.'
    });
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please login first.'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }
    
    next();
  };
};

// Check if email is verified
const requireEmailVerification = (req, res, next) => {
  if (!req.user.verification.email.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required. Please verify your email address.'
    });
  }
  next();
};

// Check if phone is verified
const requirePhoneVerification = (req, res, next) => {
  if (!req.user.verification.phone.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Phone verification required. Please verify your phone number.'
    });
  }
  next();
};

module.exports = {
  protect,
  authorize,
  requireEmailVerification,
  requirePhoneVerification
};