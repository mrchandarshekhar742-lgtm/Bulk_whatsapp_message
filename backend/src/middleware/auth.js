const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../utils/logger');

/**
 * Verify JWT token and attach user to request
 */
exports.verifyToken = async (req, res, next) => {
  try {
    console.log('=== AUTH MIDDLEWARE DEBUG ===');
    console.log('Headers:', req.headers.authorization ? 'Authorization header present' : 'No authorization header');
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      console.log('AUTH ERROR: No authorization header provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      console.log('AUTH ERROR: No token in authorization header');
      return res.status(401).json({ error: 'No token provided' });
    }

    console.log('AUTH: Token found, verifying...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded.userId) {
      console.log('AUTH ERROR: Token missing userId');
      return res.status(401).json({ error: 'Invalid token format' });
    }

    console.log('AUTH: Looking up user ID:', decoded.userId);
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      console.log('AUTH ERROR: User not found for ID:', decoded.userId);
      return res.status(401).json({ error: 'User not found' });
    }

    console.log('AUTH SUCCESS: User found:', { id: user.id, email: user.email });
    req.user = user;
    next();
  } catch (error) {
    console.log('AUTH EXCEPTION:', error.message);
    if (error.name === 'TokenExpiredError') {
      console.log('AUTH ERROR: Token expired');
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      console.log('AUTH ERROR: Invalid token');
      return res.status(401).json({ error: 'Invalid token' });
    }
    console.log('AUTH ERROR: Unexpected error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Check if user is admin
 */
exports.isAdmin = async (req, res, next) => {
  try {
    if (req.user.role_id !== 1) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

/**
 * Check if user is verified
 */
exports.isVerified = async (req, res, next) => {
  if (!req.user.is_verified) {
    return res.status(403).json({ error: 'Email verification required' });
  }
  next();
};
