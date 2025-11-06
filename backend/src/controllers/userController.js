const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// Get all users
const getAllUsers = asyncHandler(async (req, res) => {
  const { role, is_active } = req.query;

  const filters = {};
  if (role) filters.role = role;
  if (is_active !== undefined) filters.is_active = is_active === 'true';

  const users = await User.findAll(filters);

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
});

// Get user by ID
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

// Update user
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Check if user exists
  const existingUser = await User.findById(id);
  if (!existingUser) {
    throw new AppError('User not found', 404);
  }

  // Check for email uniqueness if email is being updated
  if (updates.email && updates.email !== existingUser.email) {
    const emailExists = await User.emailExists(updates.email);
    if (emailExists) {
      throw new AppError('Email already in use', 409);
    }
  }

  // Check for username uniqueness if username is being updated
  if (updates.username && updates.username !== existingUser.username) {
    const usernameExists = await User.usernameExists(updates.username);
    if (usernameExists) {
      throw new AppError('Username already in use', 409);
    }
  }

  const updatedUser = await User.update(id, updates);

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: updatedUser,
  });
});

// Deactivate user (soft delete)
const deactivateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const deactivatedUser = await User.deactivate(id);

  res.status(200).json({
    success: true,
    message: 'User deactivated successfully',
    data: deactivatedUser,
  });
});

// Delete user (hard delete)
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  await User.delete(id);

  res.status(200).json({
    success: true,
    message: 'User deleted successfully',
  });
});

// Get user statistics
const getUserStatistics = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const statistics = await User.getStatistics(id);

  res.status(200).json({
    success: true,
    data: statistics,
  });
});

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deactivateUser,
  deleteUser,
  getUserStatistics,
};
