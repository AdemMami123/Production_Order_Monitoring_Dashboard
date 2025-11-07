const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/authorize');
const { apiLimiter } = require('../middleware/rateLimiter');

/**
 * @route   POST /api/sync/full
 * @desc    Trigger full bidirectional sync
 * @access  Private (Admin only)
 */
router.post('/full', authenticate, isAdmin, apiLimiter, syncController.triggerFullSync);

/**
 * @route   POST /api/sync/products
 * @desc    Sync products from Odoo
 * @access  Private (Admin only)
 */
router.post('/products', authenticate, isAdmin, apiLimiter, syncController.syncProducts);

/**
 * @route   POST /api/sync/users
 * @desc    Sync users from Odoo
 * @access  Private (Admin only)
 */
router.post('/users', authenticate, isAdmin, apiLimiter, syncController.syncUsers);

/**
 * @route   POST /api/sync/orders
 * @desc    Sync orders from Odoo
 * @access  Private (Admin only)
 */
router.post('/orders', authenticate, isAdmin, apiLimiter, syncController.syncOrders);

/**
 * @route   GET /api/sync/status
 * @desc    Get sync status
 * @access  Private (Admin only)
 */
router.get('/status', authenticate, isAdmin, syncController.getSyncStatus);

/**
 * @route   POST /api/sync/scheduler/start
 * @desc    Start auto-sync scheduler
 * @access  Private (Admin only)
 */
router.post('/scheduler/start', authenticate, isAdmin, syncController.startScheduler);

/**
 * @route   POST /api/sync/scheduler/stop
 * @desc    Stop auto-sync scheduler
 * @access  Private (Admin only)
 */
router.post('/scheduler/stop', authenticate, isAdmin, syncController.stopScheduler);

module.exports = router;
