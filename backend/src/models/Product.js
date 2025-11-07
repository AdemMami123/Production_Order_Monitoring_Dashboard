const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  reference: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  unit: {
    type: String,
    default: 'pieces',
    trim: true,
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
  timestamps: true,
});

// Indexes (reference already has unique:true which creates an index)
productSchema.index({ name: 1 });
productSchema.index({ is_active: 1 });

// Static methods
productSchema.statics = {
  // Create a new product
  async create({ name, reference, description, unit = 'pieces' }) {
    const product = new this({ name, reference, description, unit });
    await product.save();
    return product.toObject();
  },

  // Find product by ID
  async findById(id) {
    return await this.findOne({ _id: id }).lean();
  },

  // Find product by reference
  async findByReference(reference) {
    return await this.findOne({ reference }).lean();
  },

  // Check if reference exists
  async referenceExists(reference) {
    const count = await this.countDocuments({ reference });
    return count > 0;
  },

  // Get all products
  async findAll(filters = {}) {
    const query = {};

    if (filters.is_active !== undefined) {
      query.is_active = filters.is_active;
    }

    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { reference: { $regex: filters.search, $options: 'i' } },
      ];
    }

    return await this.find(query).sort({ name: 1 }).lean();
  },

  // Update product
  async update(id, updates) {
    const allowedFields = ['name', 'reference', 'description', 'unit', 'is_active'];
    const updateData = {};

    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key)) {
        updateData[key] = updates[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      throw new Error('No valid fields to update');
    }

    const product = await this.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    return product;
  },

  // Soft delete product (deactivate)
  async deactivate(id) {
    const product = await this.findByIdAndUpdate(
      id,
      { is_active: false },
      { new: true }
    ).select('_id name reference is_active').lean();
    return product;
  },

  // Delete product
  async delete(id) {
    const product = await this.findByIdAndDelete(id).select('_id').lean();
    return product;
  },
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
