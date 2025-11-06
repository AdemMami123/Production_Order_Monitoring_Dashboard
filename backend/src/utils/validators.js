const { body, param, query } = require('express-validator');

// User validation rules
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('role')
    .optional()
    .isIn(['admin', 'manager', 'worker'])
    .withMessage('Role must be one of: admin, manager, worker'),
];

const loginValidation = [
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  // Custom validation: either email or username must be provided
  body().custom((value, { req }) => {
    if (!req.body.email && !req.body.username) {
      throw new Error('Either email or username is required');
    }
    return true;
  }),
];

const updatePasswordValidation = [
  body('oldPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
];

// Product validation rules
const createProductValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  
  body('reference')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Reference must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9-_]+$/)
    .withMessage('Reference can only contain letters, numbers, hyphens, and underscores'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('unit')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Unit cannot exceed 20 characters'),
];

const updateProductValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  
  body('reference')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Reference must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9-_]+$/)
    .withMessage('Reference can only contain letters, numbers, hyphens, and underscores'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('unit')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Unit cannot exceed 20 characters'),
  
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),
];

// Order validation rules
const createOrderValidation = [
  // order_number is optional — backend will auto-generate when omitted
  body('order_number')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Order number must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9-_]+$/)
    .withMessage('Order number can only contain letters, numbers, hyphens, and underscores'),
  
  body('product_id')
    .trim()
    .isLength({ min: 24, max: 24 })
    .withMessage('Product ID must be a valid MongoDB ObjectId')
    .matches(/^[a-f0-9]{24}$/i)
    .withMessage('Product ID must be a valid 24-character hex string'),
  
  body('assigned_to')
    .optional()
    .trim()
    .isLength({ min: 24, max: 24 })
    .withMessage('Assigned user ID must be a valid MongoDB ObjectId')
    .matches(/^[a-f0-9]{24}$/i)
    .withMessage('Assigned user ID must be a valid 24-character hex string'),
  
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'done', 'blocked'])
    .withMessage('Status must be one of: pending, in_progress, done, blocked'),
  
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  
  body('priority')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Priority must be between 1 and 5'),
  
  body('start_date')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  
  body('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Deadline must be a valid ISO 8601 date'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
];

const updateOrderValidation = [
  body('product_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positive integer'),
  
  body('assigned_to')
    .optional()
    .custom((value) => value === null || (Number.isInteger(value) && value > 0))
    .withMessage('Assigned user ID must be a positive integer or null'),
  
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'done', 'blocked'])
    .withMessage('Status must be one of: pending, in_progress, done, blocked'),
  
  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  
  body('priority')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Priority must be between 1 and 5'),
  
  body('start_date')
    .optional()
    .custom((value) => value === null || !isNaN(Date.parse(value)))
    .withMessage('Start date must be a valid date or null'),
  
  body('end_date')
    .optional()
    .custom((value) => value === null || !isNaN(Date.parse(value)))
    .withMessage('End date must be a valid date or null'),
  
  body('deadline')
    .optional()
    .custom((value) => value === null || !isNaN(Date.parse(value)))
    .withMessage('Deadline must be a valid date or null'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
];

// ID parameter validation (MongoDB ObjectId)
const idValidation = [
  param('id')
    .trim()
    .isLength({ min: 24, max: 24 })
    .withMessage('ID must be a valid MongoDB ObjectId')
    .matches(/^[a-f0-9]{24}$/i)
    .withMessage('ID must be a valid 24-character hex string'),
];

module.exports = {
  registerValidation,
  loginValidation,
  updatePasswordValidation,
  createProductValidation,
  updateProductValidation,
  createOrderValidation,
  updateOrderValidation,
  idValidation,
};
