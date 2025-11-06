const mongoose = require('mongoose');

// Order Log Schema (embedded subdocument)
const orderLogSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  old_status: {
    type: String,
    enum: ['pending', 'in_progress', 'done', 'blocked', null],
  },
  new_status: {
    type: String,
    enum: ['pending', 'in_progress', 'done', 'blocked', null],
  },
  details: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, { _id: true });

// Order Schema
const orderSchema = new mongoose.Schema({
  order_number: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'done', 'blocked'],
    default: 'pending',
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 5,
  },
  start_date: {
    type: Date,
  },
  end_date: {
    type: Date,
  },
  deadline: {
    type: Date,
  },
  last_update: {
    type: Date,
    default: Date.now,
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  notes: {
    type: String,
  },
  logs: [orderLogSchema], // Embedded logs
}, {
  timestamps: true,
});

// Indexes (order_number already has unique:true which creates an index)
orderSchema.index({ status: 1 });
orderSchema.index({ assigned_to: 1 });
orderSchema.index({ created_by: 1 });
orderSchema.index({ product_id: 1 });
orderSchema.index({ deadline: 1 });

// Middleware to update last_update on save
orderSchema.pre('save', function(next) {
  this.last_update = new Date();
  next();
});

// Static methods
orderSchema.statics = {
  // Create a new order
  async create(orderData) {
    const {
      order_number,
      product_id,
      assigned_to,
      status = 'pending',
      quantity,
      priority = 1,
      start_date,
      end_date,
      deadline,
      created_by,
      notes,
    } = orderData;

    const order = new this({
      order_number,
      product_id,
      assigned_to,
      status,
      quantity,
      priority,
      start_date,
      end_date,
      deadline,
      created_by,
      notes,
    });

    await order.save();
    return order.toObject();
  },

  // Find order by ID
  async findById(id) {
    return await this.findOne({ _id: id }).lean();
  },

  // Find order with details (populate references)
  async findByIdWithDetails(id) {
    return await this.findOne({ _id: id })
      .populate('product_id', 'name reference unit')
      .populate('assigned_to', 'username email')
      .populate('created_by', 'username')
      .lean();
  },

  // Find order by order number
  async findByOrderNumber(order_number) {
    return await this.findOne({ order_number })
      .populate('product_id', 'name reference unit')
      .populate('assigned_to', 'username email')
      .populate('created_by', 'username')
      .lean();
  },

  // Check if order number exists
  async orderNumberExists(order_number) {
    const count = await this.countDocuments({ order_number });
    return count > 0;
  },

  // Get all orders with filters
  async findAll(filters = {}) {
    const query = {};

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.product_id) {
      query.product_id = filters.product_id;
    }

    if (filters.assigned_to) {
      query.assigned_to = filters.assigned_to;
    }

    if (filters.created_by) {
      query.created_by = filters.created_by;
    }

    if (filters.priority) {
      query.priority = filters.priority;
    }

    if (filters.start_date) {
      query.start_date = { $gte: new Date(filters.start_date) };
    }

    if (filters.end_date) {
      query.end_date = { $lte: new Date(filters.end_date) };
    }

    if (filters.search) {
      query.$or = [
        { order_number: { $regex: filters.search, $options: 'i' } },
      ];
    }

    return await this.find(query)
      .populate('product_id', 'name reference unit')
      .populate('assigned_to', 'username email')
      .populate('created_by', 'username')
      .sort({ createdAt: -1 })
      .lean();
  },

  // Update order
  async update(id, updates) {
    const allowedFields = [
      'product_id',
      'assigned_to',
      'status',
      'quantity',
      'priority',
      'start_date',
      'end_date',
      'deadline',
      'notes',
    ];
    
    const updateData = {};

    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key)) {
        updateData[key] = updates[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      throw new Error('No valid fields to update');
    }

    updateData.last_update = new Date();

    const order = await this.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('product_id', 'name reference unit')
    .populate('assigned_to', 'username email')
    .populate('created_by', 'username')
    .lean();

    return order;
  },

  // Delete order
  async delete(id) {
    const order = await this.findByIdAndDelete(id).select('_id').lean();
    return order;
  },

  // Get order logs
  async getLogs(orderId) {
    const order = await this.findById(orderId)
      .populate('logs.user_id', 'username role')
      .lean();
    
    if (!order) return [];

    // Transform logs to match expected format
    return order.logs.map(log => ({
      id: log._id,
      order_id: order._id,
      user_id: log.user_id._id,
      username: log.user_id.username,
      role: log.user_id.role,
      action: log.action,
      old_status: log.old_status,
      new_status: log.new_status,
      details: log.details,
      timestamp: log.timestamp,
    })).sort((a, b) => b.timestamp - a.timestamp);
  },

  // Add log entry
  async addLog(logData) {
    const { order_id, user_id, action, old_status, new_status, details } = logData;
    // Fetch a Mongoose document (not the lean/plain object) so we can push to subdocs and save
    const order = await this.findOne({ _id: order_id });
    if (!order) {
      throw new Error('Order not found');
    }

    order.logs.push({
      user_id,
      action,
      old_status,
      new_status,
      details,
    });

    await order.save();

    // Return the last added log
    const addedLog = order.logs[order.logs.length - 1];
    return {
      id: addedLog._id,
      order_id,
      user_id,
      action,
      old_status,
      new_status,
      details,
      timestamp: addedLog.timestamp,
    };
  },

  // Get orders statistics
  async getStatistics(filters = {}) {
    const matchQuery = {};

    if (filters.assigned_to) {
      matchQuery.assigned_to = mongoose.Types.ObjectId(filters.assigned_to);
    }

    if (filters.created_by) {
      matchQuery.created_by = mongoose.Types.ObjectId(filters.created_by);
    }

    const stats = await this.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          total_orders: { $sum: 1 },
          pending_orders: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          in_progress_orders: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
          },
          completed_orders: {
            $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] }
          },
          blocked_orders: {
            $sum: { $cond: [{ $eq: ['$status', 'blocked'] }, 1, 0] }
          },
          total_quantity: { $sum: '$quantity' },
          avg_priority: { $avg: '$priority' },
        }
      }
    ]);

    if (stats.length === 0) {
      return {
        total_orders: 0,
        pending_orders: 0,
        in_progress_orders: 0,
        completed_orders: 0,
        blocked_orders: 0,
        total_quantity: 0,
        avg_priority: 0,
      };
    }

    const result = stats[0];
    delete result._id;
    return result;
  },
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
