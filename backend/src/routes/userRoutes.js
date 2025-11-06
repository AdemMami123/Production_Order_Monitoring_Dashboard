const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { isAdmin, isSelfOrAdmin } = require('../middleware/authorize');
const { idValidation } = require('../utils/validators');
const { validate } = require('../middleware/errorHandler');
const { apiLimiter, userCreationLimiter } = require('../middleware/rateLimiter');
const {
  validateUserUpdate,
  validateMongoId,
  handleValidationErrors,
} = require('../middleware/validation');

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private (Admin only)
 */
router.get('/', authenticate, isAdmin, apiLimiter, userController.getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin or own profile)
 */
router.get(
  '/:id',
  authenticate,
  apiLimiter,
  validateMongoId('id'),
  handleValidationErrors,
  isSelfOrAdmin,
  userController.getUserById
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  authenticate,
  apiLimiter,
  validateMongoId('id'),
  validateUserUpdate,
  handleValidationErrors,
  isAdmin,
  userController.updateUser
);

/**
 * @route   PATCH /api/users/:id
 * @desc    Update user (partial update)
 * @access  Private (Admin only)
 */
router.patch(
  '/:id',
  authenticate,
  apiLimiter,
  validateMongoId('id'),
  validateUserUpdate,
  handleValidationErrors,
  isAdmin,
  userController.updateUser
);

/**
 * @route   PATCH /api/users/:id/deactivate
 * @desc    Deactivate user (soft delete)
 * @access  Private (Admin only)
 */
router.patch(
  '/:id/deactivate',
  authenticate,
  apiLimiter,
  validateMongoId('id'),
  handleValidationErrors,
  isAdmin,
  userController.deactivateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (hard delete)
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authenticate,
  apiLimiter,
  validateMongoId('id'),
  handleValidationErrors,
  isAdmin,
  userController.deleteUser
);

/**
 * @route   GET /api/users/:id/statistics
 * @desc    Get user statistics
 * @access  Private (Admin, Manager, or own statistics)
 */
router.get(
  '/:id/statistics',
  authenticate,
  apiLimiter,
  validateMongoId('id'),
  handleValidationErrors,
  isSelfOrAdmin,
  userController.getUserStatistics
);

module.exports = router;
