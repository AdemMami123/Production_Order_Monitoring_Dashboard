const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

class AuthService {
  // Hash password
  static async hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
  }

  // Compare password with hash
  static async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  // Generate JWT token
  static generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
  }

  // Verify JWT token
  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // Register new user
  static async register({ username, email, password, role = 'worker' }) {
    // Check if email already exists
    const emailExists = await User.emailExists(email);
    if (emailExists) {
      throw new Error('Email already registered');
    }

    // Check if username already exists
    const usernameExists = await User.usernameExists(username);
    if (usernameExists) {
      throw new Error('Username already taken');
    }

    // Hash password
    const password_hash = await this.hashPassword(password);
    console.log('[AUTH] Registering user:', username, 'Password hash length:', password_hash.length);

    // Create user
    const user = await User.create({
      username,
      email,
      password_hash,
      role,
    });

    console.log('[AUTH] User created successfully:', user._id);

    // Generate token
    const token = this.generateToken({
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
    });

    // Return user (without password) and token
    return {
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        created_at: user.createdAt,
      },
      token,
    };
  }

  // Login user
  static async login({ email, username, password }) {
    console.log('[AUTH] Login attempt - email:', email, 'username:', username);
    
    // Find user by email or username
    let user;
    if (email) {
      user = await User.findByEmail(email);
    } else if (username) {
      user = await User.findByUsername(username);
    }
    
    if (!user) {
      console.log('[AUTH] User not found');
      throw new Error('Invalid credentials');
    }

    console.log('[AUTH] User found:', user.username, 'Active:', user.is_active, 'Has password_hash:', !!user.password_hash);

    // Check if user is active
    if (!user.is_active) {
      throw new Error('Account is deactivated. Please contact administrator.');
    }

    // Compare password
    const isPasswordValid = await this.comparePassword(password, user.password_hash);
    console.log('[AUTH] Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = this.generateToken({
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
    });

    // Return user (without password) and token
    return {
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        created_at: user.createdAt,
      },
      token,
    };
  }

  // Get user profile
  static async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  // Update password
  static async updatePassword(userId, oldPassword, newPassword) {
    // Get user with password hash
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get full user data including password hash
    const userWithPassword = await User.findByEmail(user.email);

    // Verify old password
    const isPasswordValid = await this.comparePassword(
      oldPassword,
      userWithPassword.password_hash
    );
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await this.hashPassword(newPassword);

    // Update password
    await User.updatePassword(userId, newPasswordHash);

    return { message: 'Password updated successfully' };
  }

  // Validate token and return user
  static async validateToken(token) {
    const decoded = this.verifyToken(token);
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    // Ensure id field is present (lean() returns _id)
    return {
      ...user,
      id: user._id.toString(),
    };
  }
}

module.exports = AuthService;
