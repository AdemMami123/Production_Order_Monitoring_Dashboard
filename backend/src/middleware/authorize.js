// Authorization middleware - check user roles

// Check if user has required role
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Insufficient permissions.',
        message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  return authorize('admin')(req, res, next);
};

// Check if user is admin or manager
const isAdminOrManager = (req, res, next) => {
  return authorize('admin', 'manager')(req, res, next);
};

// Check if user is accessing their own resource
const isSelfOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  const resourceUserId = parseInt(req.params.userId || req.params.id);
  
  // Allow if user is admin or accessing own resource
  if (req.user.role === 'admin' || req.user.id === resourceUserId) {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: 'Access denied. You can only access your own resources.',
  });
};

// Check if user can assign/manage orders
const canManageOrders = (req, res, next) => {
  return authorize('admin', 'manager')(req, res, next);
};

// Check if user can view order (workers can only see assigned orders)
const canViewOrder = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  // Admin and managers can view all orders
  if (req.user.role === 'admin' || req.user.role === 'manager') {
    return next();
  }

  // Workers can only view orders assigned to them
  // This check will be done in the controller
  req.workerRestricted = true;
  next();
};

// Check if user can update order
const canUpdateOrder = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  // Admin and managers can update any order
  if (req.user.role === 'admin' || req.user.role === 'manager') {
    return next();
  }

  // Workers can update orders assigned to them (limited fields)
  // This check will be done in the controller
  req.workerRestricted = true;
  next();
};

module.exports = {
  authorize,
  isAdmin,
  isAdminOrManager,
  isSelfOrAdmin,
  canManageOrders,
  canViewOrder,
  canUpdateOrder,
};
