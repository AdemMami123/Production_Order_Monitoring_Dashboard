const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation middleware to handle express-validator errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  
  next();
};

/**
 * User registration validation
 */
const validateUserRegistration = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
  
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('role')
    .optional()
    .isIn(['admin', 'manager', 'worker'])
    .withMessage('Role must be admin, manager, or worker'),
  
  handleValidationErrors
];

/**
 * User login validation
 */
const validateUserLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

/**
 * User update validation
 */
const validateUserUpdate = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  
  body('role')
    .optional()
    .isIn(['admin', 'manager', 'worker'])
    .withMessage('Role must be admin, manager, or worker'),
  
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),
  
  handleValidationErrors
];

/**
 * Product creation validation
 */
const validateProductCreation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  
  body('reference')
    .trim()
    .notEmpty()
    .withMessage('Product reference is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Product reference must be between 2 and 50 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  
  body('unit')
    .trim()
    .notEmpty()
    .withMessage('Unit is required')
    .isIn(['pcs', 'kg', 'm', 'm2', 'l', 'box', 'roll'])
    .withMessage('Invalid unit type'),
  
  handleValidationErrors
];

/**
 * Product update validation
 */
const validateProductUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  
  body('reference')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Product reference must be between 2 and 50 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  
  body('unit')
    .optional()
    .trim()
    .isIn(['pcs', 'kg', 'm', 'm2', 'l', 'box', 'roll'])
    .withMessage('Invalid unit type'),
  
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),
  
  handleValidationErrors
];

/**
 * Order creation validation
 */
const validateOrderCreation = [
  body('order_number')
    .trim()
    .notEmpty()
    .withMessage('Order number is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Order number must be between 3 and 50 characters'),
  
  body('product_id')
    .notEmpty()
    .withMessage('Product ID is required')
    .isMongoId()
    .withMessage('Invalid product ID format'),
  
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  
  body('priority')
    .isInt({ min: 1, max: 5 })
    .withMessage('Priority must be between 1 and 5'),
  
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Deadline must be a valid date'),
  
  body('assigned_to')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID format'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
  
  handleValidationErrors
];

/**
 * Order update validation
 */
const validateOrderUpdate = [
  body('order_number')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Order number must be between 3 and 50 characters'),
  
  body('product_id')
    .optional()
    .isMongoId()
    .withMessage('Invalid product ID format'),
  
  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  
  body('priority')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Priority must be between 1 and 5'),
  
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Deadline must be a valid date'),
  
  body('assigned_to')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID format'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
  
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed', 'blocked', 'cancelled'])
    .withMessage('Invalid status value'),
  
  handleValidationErrors
];

/**
 * Order status update validation
 */
const validateOrderStatusUpdate = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['pending', 'in_progress', 'completed', 'blocked', 'cancelled'])
    .withMessage('Invalid status value'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
  
  handleValidationErrors
];

/**
 * Order assignment validation
 */
const validateOrderAssignment = [
  body('assigned_to')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID format'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
  
  handleValidationErrors
];

/**
 * Order block validation
 */
const validateOrderBlock = [
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Reason is required when blocking an order')
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason must be between 5 and 500 characters'),
  
  handleValidationErrors
];

/**
 * Order unblock validation
 */
const validateOrderUnblock = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['pending', 'in_progress'])
    .withMessage('Status must be pending or in_progress after unblocking'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
  
  handleValidationErrors
];

/**
 * MongoDB ID parameter validation
 */
const validateMongoId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName} format`),
  
  handleValidationErrors
];

/**
 * Query parameter validation for pagination
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

/**
 * Sanitize string to prevent XSS
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  return str
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .trim();
};

/**
 * Sanitize request body
 */
const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    });
  }
  next();
};

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validateProductCreation,
  validateProductUpdate,
  validateOrderCreation,
  validateOrderUpdate,
  validateOrderStatusUpdate,
  validateOrderAssignment,
  validateOrderBlock,
  validateOrderUnblock,
  validateMongoId,
  validatePagination,
  sanitizeBody,
  sanitizeString,
};
