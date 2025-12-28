const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../utils/logger');

/**
 * Verify JWT token and attach user to request
 */
exports.verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      logger.error('No authorization header provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      logger.error('No token in authorization header');
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded.userId) {
      logger.error('Token missing userId');
      return res.status(401).json({ error: 'Invalid token format' });
    }

    const user = await User.findByPk(decoded.userId);

    if (!user) {
      logger.error('User not found for token', { userId: decoded.userId });
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.error('Token expired', { error: error.message });
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      logger.error('Invalid token', { error: error.message });
      return res.status(401).json({ error: 'Invalid token' });
    }
    logger.error('Token verification failed', { 
      error: error.message, 
      stack: error.stack,
      headers: req.headers.authorization ? 'present' : 'missing'
    });
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
