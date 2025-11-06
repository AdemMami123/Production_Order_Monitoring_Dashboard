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
const { authLimiter, apiLimiter } = require('../middleware/rateLimiter');
const { validateUserRegistration, validateUserLogin, handleValidationErrors } = require('../middleware/validation');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public (or Admin only - depending on requirements)
 */
router.post('/register', apiLimiter, validateUserRegistration, handleValidationErrors, authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and get JWT token
 * @access  Public
 */
router.post('/login', authLimiter, validateUserLogin, handleValidationErrors, authController.login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
router.post('/logout', apiLimiter, authenticate, authController.logout);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', apiLimiter, authenticate, authController.getProfile);

/**
 * @route   PUT /api/auth/password
 * @desc    Update user password
 * @access  Private
 */
router.put(
  '/password',
  apiLimiter,
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
router.get('/verify', apiLimiter, authenticate, authController.verifyToken);

module.exports = router;
