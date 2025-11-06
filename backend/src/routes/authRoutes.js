const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');
const {
  registerValidation,
  loginValidation,
  updatePasswordValidation,
} = require('../utils/validators');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public (or Admin only - depending on requirements)
 */
router.post('/register', registerValidation, validate, authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and get JWT token
 * @access  Public
 */
router.post('/login', loginValidation, validate, authController.login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticate, authController.getProfile);

/**
 * @route   PUT /api/auth/password
 * @desc    Update user password
 * @access  Private
 */
router.put(
  '/password',
  authenticate,
  updatePasswordValidation,
  validate,
  authController.updatePassword
);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify if JWT token is valid
 * @access  Private
 */
router.get('/verify', authenticate, authController.verifyToken);

module.exports = router;
