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

/**
 * @route   POST /api/products
 * @desc    Create a new product
 * @access  Private (Admin, Manager)
 */
router.post(
  '/',
  authenticate,
  isAdminOrManager,
  createProductValidation,
  validate,
  productController.createProduct
);

/**
 * @route   GET /api/products
 * @desc    Get all products
 * @access  Private (All authenticated users)
 * @query   is_active, search
 */
router.get('/', authenticate, productController.getAllProducts);

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 * @access  Private (All authenticated users)
 */
router.get(
  '/:id',
  authenticate,
  idValidation,
  validate,
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
  idValidation,
  updateProductValidation,
  validate,
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
  idValidation,
  validate,
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
  idValidation,
  validate,
  isAdmin,
  productController.deleteProduct
);

module.exports = router;
