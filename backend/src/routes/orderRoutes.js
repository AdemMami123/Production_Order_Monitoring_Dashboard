const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');
const { canManageOrders, canViewOrder, canUpdateOrder } = require('../middleware/authorize');
const { validate } = require('../middleware/errorHandler');
const {
  createOrderValidation,
  updateOrderValidation,
  idValidation,
} = require('../utils/validators');
const { apiLimiter, orderCreationLimiter } = require('../middleware/rateLimiter');
const {
  validateOrderCreation,
  validateOrderUpdate,
  validateOrderStatusUpdate,
  validateOrderAssignment,
  validateOrderBlock,
  validateOrderUnblock,
  validateMongoId,
  handleValidationErrors,
} = require('../middleware/validation');

/**
 * @route   POST /api/orders
 * @desc    Create a new production order
 * @access  Private (Admin, Manager)
 */
router.post(
  '/',
  authenticate,
  canManageOrders,
  orderCreationLimiter,
  validateOrderCreation,
  handleValidationErrors,
  orderController.createOrder
);

/**
 * @route   GET /api/orders
 * @desc    Get all orders (with filters)
 * @access  Private (All authenticated users)
 * @query   status, product_id, assigned_to, created_by, priority, start_date, end_date, search
 */
router.get('/', authenticate, apiLimiter, orderController.getAllOrders);

/**
 * @route   GET /api/orders/statistics
 * @desc    Get order statistics
 * @access  Private (All authenticated users)
 */
router.get('/statistics', authenticate, apiLimiter, orderController.getOrderStatistics);

/**
 * @route   GET /api/orders/:id
 * @desc    Get order by ID
 * @access  Private (All authenticated users - workers see only assigned)
 */
router.get(
  '/:id',
  authenticate,
  apiLimiter,
  validateMongoId('id'),
  handleValidationErrors,
  canViewOrder,
  orderController.getOrderById
);

/**
 * @route   PUT /api/orders/:id
 * @desc    Update order
 * @access  Private (Admin, Manager - full update; Worker - limited fields)
 */
router.put(
  '/:id',
  authenticate,
  apiLimiter,
  validateMongoId('id'),
  validateOrderUpdate,
  handleValidationErrors,
  canUpdateOrder,
  orderController.updateOrder
);

/**
 * @route   PATCH /api/orders/:id/status
 * @desc    Update order status
 * @access  Private (All authenticated users - workers update assigned orders)
 */
router.patch(
  '/:id/status',
  authenticate,
  apiLimiter,
  validateMongoId('id'),
  validateOrderStatusUpdate,
  handleValidationErrors,
  orderController.updateOrderStatus
);

/**
 * @route   PATCH /api/orders/:id/assign
 * @desc    Assign/reassign order to a user
 * @access  Private (Admin, Manager)
 */
router.patch(
  '/:id/assign',
  authenticate,
  apiLimiter,
  validateMongoId('id'),
  validateOrderAssignment,
  handleValidationErrors,
  canManageOrders,
  orderController.assignOrder
);

/**
 * @route   PATCH /api/orders/:id/block
 * @desc    Block an order
 * @access  Private (Admin, Manager)
 */
router.patch(
  '/:id/block',
  authenticate,
  apiLimiter,
  validateMongoId('id'),
  validateOrderBlock,
  handleValidationErrors,
  canManageOrders,
  orderController.blockOrder
);

/**
 * @route   PATCH /api/orders/:id/unblock
 * @desc    Unblock an order
 * @access  Private (Admin, Manager)
 */
router.patch(
  '/:id/unblock',
  authenticate,
  apiLimiter,
  validateMongoId('id'),
  validateOrderUnblock,
  handleValidationErrors,
  canManageOrders,
  orderController.unblockOrder
);

/**
 * @route   PATCH /api/orders/:id/complete
 * @desc    Mark order as completed
 * @access  Private (All authenticated users - workers complete assigned orders)
 */
router.patch(
  '/:id/complete',
  authenticate,
  apiLimiter,
  validateMongoId('id'),
  handleValidationErrors,
  orderController.completeOrder
);

/**
 * @route   DELETE /api/orders/:id
 * @desc    Delete order
 * @access  Private (Admin, Manager)
 */
router.delete(
  '/:id',
  authenticate,
  apiLimiter,
  validateMongoId('id'),
  handleValidationErrors,
  canManageOrders,
  orderController.deleteOrder
);

/**
 * @route   GET /api/orders/:id/logs
 * @desc    Get order activity logs
 * @access  Private (All authenticated users - workers see assigned orders)
 */
router.get(
  '/:id/logs',
  authenticate,
  idValidation,
  validate,
  canViewOrder,
  orderController.getOrderLogs
);

module.exports = router;
