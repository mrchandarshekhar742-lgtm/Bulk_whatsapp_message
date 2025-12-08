const express = require('express');
const { body, validationResult } = require('express-validator');
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * POST /api/auth/register
 * Register new user
 */
router.post(
  '/register',
  [
    body('first_name').trim().notEmpty().withMessage('First name is required'),
    body('last_name').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('company_name').trim().optional(),
  ],
  handleValidationErrors,
  authController.register
);

/**
 * POST /api/auth/login
 * Login user
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  handleValidationErrors,
  authController.login
);

/**
 * POST /api/auth/refresh-token
 * Refresh access token
 */
router.post('/refresh-token', authController.refreshToken);

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', verifyToken, authController.logout);

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', verifyToken, authController.getCurrentUser);

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put(
  '/profile',
  verifyToken,
  [
    body('first_name').trim().optional(),
    body('last_name').trim().optional(),
    body('company').trim().optional(),
  ],
  handleValidationErrors,
  authController.updateProfile
);

module.exports = router;
