const AuthService = require('../services/authService');

// Authentication middleware - verify JWT token
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'No token provided. Authorization header is required.',
      });
    }

    // Extract token (Bearer <token>)
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token format. Use: Bearer <token>',
      });
    }

    const token = parts[1];

    // Verify token and get user
    const user = await AuthService.validateToken(token);

    // Attach user to request object
    req.user = user;

    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      message: error.message,
    });
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1];
        const user = await AuthService.validateToken(token);
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuth,
};
