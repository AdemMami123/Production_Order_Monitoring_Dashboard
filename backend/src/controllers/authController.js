const AuthService = require('../services/authService');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// Register new user
const register = asyncHandler(async (req, res) => {
  const { username, email, password, role } = req.body;

  const result = await AuthService.register({
    username,
    email,
    password,
    role,
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: result,
  });
});

// Login user
const login = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  const result = await AuthService.login({ email, username, password });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: result,
  });
});

// Get current user profile
const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const user = await AuthService.getProfile(userId);

  res.status(200).json({
    success: true,
    data: user,
  });
});

// Update password
const updatePassword = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { oldPassword, newPassword } = req.body;

  const result = await AuthService.updatePassword(userId, oldPassword, newPassword);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

// Logout (client-side token removal, server can implement token blacklist if needed)
const logout = asyncHandler(async (req, res) => {
  // In a JWT-based system, logout is typically handled client-side by removing the token
  // For enhanced security, you could implement a token blacklist here
  res.status(200).json({
    success: true,
    message: 'Logout successful. Please remove the token from client storage.',
  });
});

// Verify token (useful for frontend to check if token is still valid)
const verifyToken = asyncHandler(async (req, res) => {
  // If middleware passes, token is valid
  res.status(200).json({
    success: true,
    message: 'Token is valid',
    data: {
      user: req.user,
    },
  });
});

module.exports = {
  register,
  login,
  getProfile,
  updatePassword,
  logout,
  verifyToken,
};
