const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate } = require('../middleware/auth');
const { isAdminOrManager, isAdmin } = require('../middleware/authorize');
const { validate } = require('../middleware/errorHandler');
const {
  createProductValidation,
  updateProductValidation,
  idValidation,
} = require('../utils/validators');
const { apiLimiter } = require('../middleware/rateLimiter');
const {
  validateProductCreation,
  validateProductUpdate,
  validateMongoId,
  handleValidationErrors,
} = require('../middleware/validation');

/**
 * @route   POST /api/products
 * @desc    Create a new product
 * @access  Private (Admin, Manager)
 */
router.post(
  '/',
  authenticate,
  isAdminOrManager,
  apiLimiter,
  validateProductCreation,
  handleValidationErrors,
  productController.createProduct
);

/**
 * @route   GET /api/products
 * @desc    Get all products
 * @access  Private (All authenticated users)
 * @query   is_active, search
 */
router.get('/', authenticate, apiLimiter, productController.getAllProducts);

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 * @access  Private (All authenticated users)
 */
router.get(
  '/:id',
  authenticate,
  apiLimiter,
  validateMongoId('id'),
  handleValidationErrors,
  productController.getProductById
);

/**
 * @route   PUT /api/products/:id
 * @desc    Update product
 * @access  Private (Admin, Manager)
 */
router.put(
  '/:id',
  authenticate,
  apiLimiter,
  validateMongoId('id'),
  validateProductUpdate,
  handleValidationErrors,
  isAdminOrManager,
  productController.updateProduct
);

/**
 * @route   PATCH /api/products/:id/deactivate
 * @desc    Deactivate product
 * @access  Private (Admin, Manager)
 */
router.patch(
  '/:id/deactivate',
  authenticate,
  apiLimiter,
  validateMongoId('id'),
  handleValidationErrors,
  isAdminOrManager,
  productController.deactivateProduct
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authenticate,
  apiLimiter,
  validateMongoId('id'),
  handleValidationErrors,
  isAdmin,
  productController.deleteProduct
);

module.exports = router;
