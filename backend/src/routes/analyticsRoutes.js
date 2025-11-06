const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/auth');
const { analyticsLimiter } = require('../middleware/rateLimiter');

// Middleware to check if user is admin or manager
const canViewAnalytics = (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'manager') {
    next();
  } else {
    res.status(403).json({
      success: false,
      error: 'Access denied. Only admins and managers can view analytics.'
    });
  }
};

// All routes require authentication, rate limiting, and admin/manager role
router.use(authenticate);
router.use(analyticsLimiter);
router.use(canViewAnalytics);

// @route   GET /api/analytics/kpis
// @desc    Get aggregated KPI metrics
// @access  Admin, Manager
router.get('/kpis', analyticsController.getKPIs);

// @route   GET /api/analytics/order-volume
// @desc    Get order volume over time
// @access  Admin, Manager
router.get('/order-volume', analyticsController.getOrderVolume);

// @route   GET /api/analytics/status-distribution
// @desc    Get order status distribution
// @access  Admin, Manager
router.get('/status-distribution', analyticsController.getStatusDistribution);

// @route   GET /api/analytics/worker-productivity
// @desc    Get worker productivity metrics
// @access  Admin, Manager
router.get('/worker-productivity', analyticsController.getWorkerProductivity);

module.exports = router;
