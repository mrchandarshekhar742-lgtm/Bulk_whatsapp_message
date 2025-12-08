const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { User } = require('../models');
const logger = require('../utils/logger');

/**
 * Register new user
 */
exports.register = async (req, res) => {
  try {
    const { first_name, last_name, email, password, company_name } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Create user
    const user = await User.create({
      first_name,
      last_name,
      email,
      password_hash: password,
      company_name,
      api_key: `sk_${uuidv4()}`,
      is_verified: true, // Auto-verify on registration
    });

    // Generate tokens
    const tokens = generateTokens(user.id);

    logger.info(`User registered: ${email}`);

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      },
      ...tokens,
    });
  } catch (error) {
    logger.error('Registration failed', { error: error.message });
    res.status(500).json({ error: 'Registration failed' });
  }
};

/**
 * Login user
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email, is_active: true } });

    if (!user || !(await user.verifyPassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    user.last_login = new Date();
    user.login_attempts = 0;
    await user.save();

    const tokens = generateTokens(user.id);

    logger.info(`User logged in: ${email}`);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      },
      ...tokens,
    });
  } catch (error) {
    logger.error('Login failed', { error: error.message });
    res.status(500).json({ error: 'Login failed' });
  }
};

/**
 * Refresh access token
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);
    const tokens = generateTokens(decoded.userId);

    res.json(tokens);
  } catch (error) {
    logger.error('Token refresh failed', { error: error.message });
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

/**
 * Logout user
 */
exports.logout = async (req, res) => {
  try {
    // Token is invalidated on frontend
    logger.info(`User logged out: ${req.user.email}`);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
};

/**
 * Get current user profile
 */
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId, {
      attributes: ['id', 'email', 'first_name', 'last_name', 'company_name', 'is_verified'],
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        company_name: user.company_name,
        is_verified: user.is_verified,
      },
    });
  } catch (error) {
    logger.error('Failed to get current user', { error: error.message });
    res.status(500).json({ error: 'Failed to get user profile' });
  }
};

/**
 * Update user profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const { first_name, last_name, company } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update fields
    if (first_name) user.first_name = first_name;
    if (last_name) user.last_name = last_name;
    if (company) user.company_name = company;

    await user.save();

    logger.info(`User profile updated: ${user.email}`, { userId });

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        company_name: user.company_name,
      },
    });
  } catch (error) {
    logger.error('Profile update failed', { error: error.message });
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

/**
 * Helper function to generate JWT tokens
 */
function generateTokens(userId) {
  const access_token = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '24h' }
  );

  const refresh_token = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );

  return { access_token, refresh_token };
}
