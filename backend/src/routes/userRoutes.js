const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { isAdmin, isSelfOrAdmin } = require('../middleware/authorize');
const { idValidation } = require('../utils/validators');
const { validate } = require('../middleware/errorHandler');

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private (Admin only)
 */
router.get('/', authenticate, isAdmin, userController.getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin or own profile)
 */
router.get(
  '/:id',
  authenticate,
  idValidation,
  validate,
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
  idValidation,
  validate,
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
  idValidation,
  validate,
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
  idValidation,
  validate,
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
  idValidation,
  validate,
  isSelfOrAdmin,
  userController.getUserStatistics
);

module.exports = router;
