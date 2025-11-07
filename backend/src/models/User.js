const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password_hash: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'worker'],
    default: 'worker',
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  // Odoo Integration Fields
  odoo_id: {
    type: Number,
    index: true,
    sparse: true,
  },
  last_synced_at: {
    type: Date,
  },
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
});

// Index for role (email and username already have unique:true which creates indexes)
userSchema.index({ role: 1 });

// Static methods
userSchema.statics = {
  // Create a new user
  async create({ username, email, password_hash, role = 'worker' }) {
    const user = new this({ username, email, password_hash, role });
    await user.save();
    return user.toObject();
  },

  // Find user by ID
  async findById(id) {
    return await this.findOne({ _id: id }).select('-password_hash').lean();
  },

  // Find user by email (includes password_hash for authentication)
  async findByEmail(email) {
    return await this.findOne({ email }).lean();
  },

  // Find user by username (includes password_hash for authentication)
  async findByUsername(username) {
    return await this.findOne({ username }).lean();
  },

  // Check if email exists
  async emailExists(email) {
    const count = await this.countDocuments({ email });
    return count > 0;
  },

  // Check if username exists
  async usernameExists(username) {
    const count = await this.countDocuments({ username });
    return count > 0;
  },

  // Get all users (without password_hash)
  async findAll(filters = {}) {
    const query = {};
    
    if (filters.role) {
      query.role = filters.role;
    }

    if (filters.is_active !== undefined) {
      query.is_active = filters.is_active;
    }

    return await this.find(query)
      .select('-password_hash')
      .sort({ createdAt: -1 })
      .lean();
  },

  // Update user
  async update(id, updates) {
    const allowedFields = ['username', 'email', 'role', 'is_active'];
    const updateData = {};

    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key)) {
        updateData[key] = updates[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      throw new Error('No valid fields to update');
    }

    const user = await this.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password_hash').lean();

    return user;
  },

  // Update password
  async updatePassword(id, password_hash) {
    const user = await this.findByIdAndUpdate(
      id,
      { password_hash },
      { new: true }
    ).select('_id').lean();
    return user;
  },

  // Soft delete user (deactivate)
  async deactivate(id) {
    const user = await this.findByIdAndUpdate(
      id,
      { is_active: false },
      { new: true }
    ).select('_id username email role is_active').lean();
    return user;
  },

  // Hard delete user
  async delete(id) {
    const user = await this.findByIdAndDelete(id).select('_id').lean();
    return user;
  },

  // Get user statistics
  async getStatistics(userId) {
    const Order = mongoose.model('Order');
    
    const user = await this.findById(userId).select('-password_hash').lean();
    if (!user) return null;

    // Calculate statistics
    const totalOrders = await Order.countDocuments({ assigned_to: userId });
    const completedOrders = await Order.countDocuments({ 
      assigned_to: userId, 
      status: 'done' 
    });
    const inProgressOrders = await Order.countDocuments({ 
      assigned_to: userId, 
      status: 'in_progress' 
    });
    const pendingOrders = await Order.countDocuments({ 
      assigned_to: userId, 
      status: 'pending' 
    });

    return {
      ...user,
      total_orders: totalOrders,
      completed_orders: completedOrders,
      in_progress_orders: inProgressOrders,
      pending_orders: pendingOrders,
    };
  },
};

const User = mongoose.model('User', userSchema);

module.exports = User;
