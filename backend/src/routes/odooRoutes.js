const express = require('express');
const router = express.Router();
const odooController = require('../controllers/odooController');
const { authenticate } = require('../middleware/auth');
// Note: the authorize middleware exports `isAdminOrManager` (not `isManagerOrAdmin`)
const { isAdmin, isAdminOrManager } = require('../middleware/authorize');
const { apiLimiter } = require('../middleware/rateLimiter');

/**
 * @route   GET /api/odoo/test
 * @desc    Test Odoo connection
 * @access  Private (Admin only)
 */
router.get('/test', authenticate, isAdmin, apiLimiter, odooController.testConnection);

/**
 * @route   GET /api/odoo/version
 * @desc    Get Odoo version information
 * @access  Private (Admin only)
 */
router.get('/version', authenticate, isAdmin, apiLimiter, odooController.getVersion);

/**
 * @route   GET /api/odoo/products
 * @desc    Get products from Odoo
 * @access  Private (Manager or Admin)
 */
router.get('/products', authenticate, isAdminOrManager, apiLimiter, odooController.getProducts);

/**
 * @route   GET /api/odoo/products/:id
 * @desc    Get a specific product from Odoo
 * @access  Private (Manager or Admin)
 */
router.get('/products/:id', authenticate, isAdminOrManager, apiLimiter, odooController.getProductById);

/**
 * @route   GET /api/odoo/manufacturing-orders
 * @desc    Get manufacturing orders from Odoo
 * @access  Private (Manager or Admin)
 */
router.get('/manufacturing-orders', authenticate, isAdminOrManager, apiLimiter, odooController.getManufacturingOrders);

/**
 * @route   GET /api/odoo/manufacturing-orders/:id
 * @desc    Get a specific manufacturing order from Odoo
 * @access  Private (Manager or Admin)
 */
router.get('/manufacturing-orders/:id', authenticate, isAdminOrManager, apiLimiter, odooController.getManufacturingOrderById);

/**
 * @route   POST /api/odoo/manufacturing-orders
 * @desc    Create a manufacturing order in Odoo
 * @access  Private (Manager or Admin)
 */
router.post('/manufacturing-orders', authenticate, isAdminOrManager, apiLimiter, odooController.createManufacturingOrder);

/**
 * @route   PUT /api/odoo/manufacturing-orders/:id
 * @desc    Update a manufacturing order in Odoo
 * @access  Private (Manager or Admin)
 */
router.put('/manufacturing-orders/:id', authenticate, isAdminOrManager, apiLimiter, odooController.updateManufacturingOrder);

/**
 * @route   GET /api/odoo/partners
 * @desc    Get partners/customers from Odoo
 * @access  Private (Manager or Admin)
 */
router.get('/partners', authenticate, isAdminOrManager, apiLimiter, odooController.getPartners);

/**
 * @route   GET /api/odoo/stock
 * @desc    Get stock/inventory from Odoo
 * @access  Private (Manager or Admin)
 */
router.get('/stock', authenticate, isAdminOrManager, apiLimiter, odooController.getStock);

/**
 * @route   POST /api/odoo/orders/create
 * @desc    Create a sale order in Odoo from local order
 * @access  Private (Manager or Admin)
 */
router.post('/orders/create', authenticate, isAdminOrManager, apiLimiter, odooController.createSaleOrder);

/**
 * @route   PUT /api/odoo/orders/:id
 * @desc    Update a sale order in Odoo from local order ID
 * @access  Private (Manager or Admin)
 */
router.put('/orders/:id', authenticate, isAdminOrManager, apiLimiter, odooController.updateSaleOrder);

module.exports = router;

