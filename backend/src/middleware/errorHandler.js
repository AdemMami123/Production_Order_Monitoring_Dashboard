const { validationResult } = require('express-validator');

// Centralized error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = null;

  // Validation errors from express-validator
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = err.errors;
  }

  // Database errors
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        statusCode = 409;
        message = 'Duplicate entry. Resource already exists.';
        break;
      case '23503': // Foreign key violation
        statusCode = 400;
        message = 'Invalid reference. Referenced resource does not exist.';
        break;
      case '23502': // Not null violation
        statusCode = 400;
        message = 'Required field is missing.';
        break;
      case '22P02': // Invalid text representation
        statusCode = 400;
        message = 'Invalid data format.';
        break;
      default:
        statusCode = 500;
        message = 'Database error occurred.';
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired.';
  }

  // Custom application errors
  if (err.isOperational) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// Validation result handler
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

// Not found handler
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

// Async handler wrapper to catch errors in async routes
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Custom error class
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  errorHandler,
  validate,
  notFound,
  asyncHandler,
  AppError,
};
