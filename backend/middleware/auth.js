const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authentication middleware
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token. User not found.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired.' });
    }
    res.status(500).json({ message: 'Server error during authentication.' });
  }
};

// Role-based authorization middleware
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.',
        requiredRoles: roles,
        userRole: req.user.role
      });
    }

    next();
  };
};

// Specific role middlewares
const requireSuperAdmin = requireRole('super_admin');
const requireInventoryManager = requireRole('super_admin', 'inventory_manager');
const requireSalesExecutive = requireRole('super_admin', 'inventory_manager', 'sales_executive');
const requireAccountant = requireRole('super_admin', 'accountant');

// Check if user can manage users
const canManageUsers = requireRole('super_admin');

// Check if user can manage inventory
const canManageInventory = requireRole('super_admin', 'inventory_manager');

// Check if user can make sales
const canMakeSales = requireRole('super_admin', 'inventory_manager', 'sales_executive');

// Check if user can view reports
const canViewReports = requireRole('super_admin', 'inventory_manager', 'accountant');

module.exports = {
  authMiddleware,
  requireRole,
  requireSuperAdmin,
  requireInventoryManager,
  requireSalesExecutive,
  requireAccountant,
  canManageUsers,
  canManageInventory,
  canMakeSales,
  canViewReports
};
