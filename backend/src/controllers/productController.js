const Product = require('../models/Product');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// Create new product
const createProduct = asyncHandler(async (req, res) => {
  const { name, reference, description, unit } = req.body;

  // Check if reference already exists
  const existingProduct = await Product.findByReference(reference);
  if (existingProduct) {
    throw new AppError('Product reference already exists', 409);
  }

  const product = await Product.create({
    name,
    reference,
    description: description || null,
    unit: unit || 'pieces',
  });

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: product,
  });
});

// Get all products
const getAllProducts = asyncHandler(async (req, res) => {
  const { is_active, search } = req.query;

  const filters = {};
  if (is_active !== undefined) {
    filters.is_active = is_active === 'true';
  }
  if (search) {
    filters.search = search;
  }

  const products = await Product.findAll(filters);

  res.status(200).json({
    success: true,
    count: products.length,
    data: products,
  });
});

// Get product by ID
const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findById(id);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  res.status(200).json({
    success: true,
    data: product,
  });
});

// Update product
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const existingProduct = await Product.findById(id);
  if (!existingProduct) {
    throw new AppError('Product not found', 404);
  }

  // Check reference uniqueness if being updated
  if (updates.reference && updates.reference !== existingProduct.reference) {
    const referenceExists = await Product.referenceExists(updates.reference);
    if (referenceExists) {
      throw new AppError('Product reference already in use', 409);
    }
  }

  const updatedProduct = await Product.update(id, updates);

  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    data: updatedProduct,
  });
});

// Deactivate product
const deactivateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findById(id);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (!product.is_active) {
    throw new AppError('Product is already deactivated', 400);
  }

  const deactivatedProduct = await Product.deactivate(id);

  res.status(200).json({
    success: true,
    message: 'Product deactivated successfully',
    data: deactivatedProduct,
  });
});

// Delete product
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findById(id);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Note: This might fail if there are orders referencing this product
  // due to foreign key constraints
  try {
    await Product.delete(id);
  } catch (error) {
    if (error.code === '23503') {
      throw new AppError(
        'Cannot delete product. It is referenced by existing orders. Consider deactivating instead.',
        400
      );
    }
    throw error;
  }

  res.status(200).json({
    success: true,
    message: 'Product deleted successfully',
  });
});

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deactivateProduct,
  deleteProduct,
};
