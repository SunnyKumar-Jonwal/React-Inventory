const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { canManageUsers, requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const userValidation = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('fullName')
    .isLength({ min: 2, max: 50 })
    .withMessage('Full name must be between 2 and 50 characters')
    .trim(),
  body('role')
    .isIn(['super_admin', 'inventory_manager', 'sales_executive', 'accountant'])
    .withMessage('Invalid role specified')
];

// @route   GET /api/users
// @desc    Get all users
// @access  Private (Super Admin only)
router.get('/', requireSuperAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    
    if (role) query.role = role;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const users = await User.find(query)
      .populate('createdBy', 'username fullName')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    // Get role statistics
    const roleStats = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      },
      stats: {
        roleStats,
        totalActiveUsers: await User.countDocuments({ isActive: true }),
        totalInactiveUsers: await User.countDocuments({ isActive: false })
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
});

// @route   GET /api/users/:id
// @desc    Get single user by ID
// @access  Private (Super Admin only)
router.get('/:id', requireSuperAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('createdBy', 'username fullName');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ message: 'Server error while fetching user' });
  }
});

// @route   POST /api/users
// @desc    Create new user
// @access  Private (Super Admin only)
router.post('/', requireSuperAdmin, userValidation.concat([
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
]), async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, email, password, fullName, role, phone, address, isActive = true } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email 
          ? 'User with this email already exists' 
          : 'Username is already taken'
      });
    }

    // Create user
    const userData = {
      username,
      email,
      password,
      fullName,
      role,
      phone,
      address,
      isActive,
      createdBy: req.user._id
    };

    const user = new User(userData);
    await user.save();

    const populatedUser = await User.findById(user._id)
      .populate('createdBy', 'username fullName');

    res.status(201).json({
      message: 'User created successfully',
      user: populatedUser
    });
  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ 
        message: `User with this ${field} already exists` 
      });
    }
    res.status(500).json({ message: 'Server error while creating user' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Super Admin only)
router.put('/:id', requireSuperAdmin, userValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email/username already exists (excluding current user)
    if (req.body.email && req.body.email !== user.email) {
      const existingUser = await User.findOne({ 
        email: req.body.email,
        _id: { $ne: req.params.id }
      });
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }
    }

    if (req.body.username && req.body.username !== user.username) {
      const existingUser = await User.findOne({ 
        username: req.body.username,
        _id: { $ne: req.params.id }
      });
      if (existingUser) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
    }

    // Prevent user from updating their own role or status
    if (req.params.id === req.user._id.toString()) {
      delete req.body.role;
      delete req.body.isActive;
    }

    // Update user (exclude password from direct update)
    const updateData = { ...req.body };
    delete updateData.password;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('createdBy', 'username fullName');

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'User not found' });
    }
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ 
        message: `User with this ${field} already exists` 
      });
    }
    res.status(500).json({ message: 'Server error while updating user' });
  }
});

// @route   PATCH /api/users/:id/password
// @desc    Update user password
// @access  Private (Super Admin only)
router.patch('/:id/password', requireSuperAdmin, [
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { newPassword } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ message: 'Server error while updating password' });
  }
});

// @route   PATCH /api/users/:id/status
// @desc    Toggle user active status
// @access  Private (Super Admin only)
router.patch('/:id/status', requireSuperAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent user from deactivating themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ 
        message: 'You cannot change your own account status' 
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ message: 'Server error while updating user status' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (soft delete by deactivating)
// @access  Private (Super Admin only)
router.delete('/:id', requireSuperAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent user from deleting themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ 
        message: 'You cannot delete your own account' 
      });
    }

    // Soft delete by deactivating
    user.isActive = false;
    await user.save();

    res.json({
      message: 'User deleted successfully',
      user
    });
  } catch (error) {
    console.error('Delete user error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ message: 'Server error while deleting user' });
  }
});

module.exports = router;
