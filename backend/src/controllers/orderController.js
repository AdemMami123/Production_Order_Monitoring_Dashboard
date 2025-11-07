const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const odooSyncService = require('../services/odooSyncService');

// Create new order
const createOrder = asyncHandler(async (req, res) => {
  const {
    order_number,
    product_id,
    assigned_to,
    quantity,
    priority,
    start_date,
    end_date,
    deadline,
    notes,
  } = req.body;

  // Verify product exists
  const product = await Product.findById(product_id);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Verify assigned user exists if provided
  if (assigned_to) {
    const assignedUser = await User.findById(assigned_to);
    if (!assignedUser) {
      throw new AppError('Assigned user not found', 404);
    }
    if (assignedUser.role !== 'worker' && assignedUser.role !== 'manager') {
      throw new AppError('Orders can only be assigned to workers or managers', 400);
    }
  }

  // Ensure we have a valid, unique order number. If none provided, auto-generate one.
  let finalOrderNumber = order_number;
  if (!finalOrderNumber || String(finalOrderNumber).trim() === '') {
    // Try to generate a reasonably short unique order number. Retry a few times if collision occurs.
    let attempt = 0;
    do {
      // e.g. ORD-k9x7z5-1a2b
      finalOrderNumber = `ORD-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`;
      attempt += 1;
    } while (await Order.orderNumberExists(finalOrderNumber) && attempt < 6);
  }

  // Check if final order number already exists
  const existingOrder = await Order.findByOrderNumber(finalOrderNumber);
  if (existingOrder) {
    throw new AppError('Order number already exists', 409);
  }

  // Create order
  const order = await Order.create({
    order_number: finalOrderNumber,
    product_id,
    assigned_to: assigned_to || null,
    status: 'pending',
    quantity,
    priority: priority || 1,
    start_date: start_date || null,
    end_date: end_date || null,
    deadline: deadline || null,
    created_by: req.user.id,
    notes: notes || null,
  });

  // Log order creation
  await Order.addLog({
    order_id: order.id,
    user_id: req.user.id,
    action: 'created',
    old_status: null,
    new_status: 'pending',
    details: `Order created by ${req.user.username}`,
  });

  // ========== ODOO SYNC: Create order in Odoo ==========
  try {
    await odooSyncService.createOrderInOdoo(order);
    console.log(`[ORDER CONTROLLER] Order ${order.order_number} synced to Odoo`);
  } catch (error) {
    console.error(`[ORDER CONTROLLER] Failed to sync order to Odoo:`, error.message);
    // Don't fail the request - order is created locally
  }
  // ====================================================

  // Get order with details
  const orderDetails = await Order.findByIdWithDetails(order.id);

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: orderDetails,
  });
});

// Get all orders with filters
const getAllOrders = asyncHandler(async (req, res) => {
  const {
    status,
    product_id,
    assigned_to,
    created_by,
    priority,
    start_date,
    end_date,
    search,
  } = req.query;

  const filters = {};

  // Apply role-based filtering
  if (req.user.role === 'worker') {
    // Workers can only see orders assigned to them
    filters.assigned_to = req.user.id;
  } else {
    // Admins and managers can see all orders, with optional filters
    if (status) filters.status = status;
    if (product_id) filters.product_id = product_id;
    if (assigned_to) filters.assigned_to = assigned_to;
    if (created_by) filters.created_by = created_by;
    if (priority) filters.priority = priority;
  }

  // Date range filtering
  if (start_date) filters.start_date = start_date;
  if (end_date) filters.end_date = end_date;

  const orders = await Order.findAll(filters);

  // Apply search filter if provided (search in order_number or product_name)
  let filteredOrders = orders;
  if (search) {
    filteredOrders = orders.filter(
      (order) =>
        order.order_number.toLowerCase().includes(search.toLowerCase()) ||
        order.product_name.toLowerCase().includes(search.toLowerCase())
    );
  }

  res.status(200).json({
    success: true,
    count: filteredOrders.length,
    data: filteredOrders,
  });
});

// Get order by ID
const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findByIdWithDetails(id);

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Workers can only view their assigned orders
  if (req.user.role === 'worker' && order.assigned_to?.toString() !== req.user.id.toString()) {
    throw new AppError('Access denied. You can only view orders assigned to you.', 403);
  }

  res.status(200).json({
    success: true,
    data: order,
  });
});

// Helper: normalize incoming status values (allow 'completed' as alias for 'done')
function normalizeStatus(status) {
  if (!status) return status;
  const s = String(status).toLowerCase();
  if (s === 'completed' || s === 'complete') return 'done';
  if (s === 'in progress' || s === 'in_progress' || s === 'inprogress') return 'in_progress';
  if (s === 'blocked') return 'blocked';
  if (s === 'pending') return 'pending';
  return status;
}

// Update order
const updateOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };

  // Normalize status if provided (accept synonyms from frontend)
  if (updates.status) {
    updates.status = normalizeStatus(updates.status);
  }

  // Get existing order
  const existingOrder = await Order.findById(id);
  if (!existingOrder) {
    throw new AppError('Order not found', 404);
  }

  // Workers have limited update permissions
  if (req.user.role === 'worker') {
    // Workers can only update orders assigned to them
    if (existingOrder.assigned_to?.toString() !== req.user.id.toString()) {
      throw new AppError('Access denied. You can only update orders assigned to you.', 403);
    }
    // Workers can only update specific fields
    const allowedFields = ['notes'];
    const attemptedFields = Object.keys(updates);
    const invalidFields = attemptedFields.filter((field) => !allowedFields.includes(field));
    if (invalidFields.length > 0) {
      throw new AppError(
        `Workers can only update: ${allowedFields.join(', ')}. Invalid fields: ${invalidFields.join(', ')}`,
        403
      );
    }
  }

  // Validate product if being updated
  if (updates.product_id) {
    const product = await Product.findById(updates.product_id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }
  }

  // Validate assigned user if being updated
  if (updates.assigned_to !== undefined) {
    if (updates.assigned_to !== null) {
      const assignedUser = await User.findById(updates.assigned_to);
      if (!assignedUser) {
        throw new AppError('Assigned user not found', 404);
      }
      if (assignedUser.role !== 'worker' && assignedUser.role !== 'manager') {
        throw new AppError('Orders can only be assigned to workers or managers', 400);
      }
    }
  }

  // Update order
  const updatedOrder = await Order.update(id, updates);

  // Log the update
  await Order.addLog({
    order_id: id,
    user_id: req.user.id,
    action: 'updated',
    old_status: existingOrder.status,
    new_status: updatedOrder.status,
    details: `Order updated by ${req.user.username}`,
  });

  // ========== ODOO SYNC: Update order in Odoo ==========
  try {
    const fullOrder = await Order.findById(id);
    await odooSyncService.updateOrderInOdoo(fullOrder);
    console.log(`[ORDER CONTROLLER] Order ${fullOrder.order_number} updated in Odoo`);
  } catch (error) {
    console.error(`[ORDER CONTROLLER] Failed to sync order update to Odoo:`, error.message);
    // Don't fail the request - order is updated locally
  }
  // ====================================================

  // Get updated order with details
  const orderDetails = await Order.findByIdWithDetails(id);

  res.status(200).json({
    success: true,
    message: 'Order updated successfully',
    data: orderDetails,
  });
});

// Update order status
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let { status, notes } = req.body;

  // Accept synonyms (e.g. 'completed') from client
  status = normalizeStatus(status);

  const existingOrder = await Order.findById(id);
  if (!existingOrder) {
    throw new AppError('Order not found', 404);
  }

  // Workers can update status of their assigned orders
  if (req.user.role === 'worker' && existingOrder.assigned_to?.toString() !== req.user.id.toString()) {
    throw new AppError('Access denied. You can only update orders assigned to you.', 403);
  }

  // Validate status transition
  const validStatuses = ['pending', 'in_progress', 'done', 'blocked'];
  if (!validStatuses.includes(status)) {
    throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
  }

  // Auto-set dates based on status
  const statusUpdates = { status };
  if (status === 'in_progress' && !existingOrder.start_date) {
    statusUpdates.start_date = new Date();
  }
  if (status === 'done' && !existingOrder.end_date) {
    statusUpdates.end_date = new Date();
  }
  if (notes) {
    statusUpdates.notes = notes;
  }

  // Update order
  const updatedOrder = await Order.update(id, statusUpdates);

  // Log status change
  await Order.addLog({
    order_id: id,
    user_id: req.user.id,
    action: 'status_change',
    old_status: existingOrder.status,
    new_status: status,
    details: notes || `Status changed from ${existingOrder.status} to ${status} by ${req.user.username}`,
  });

  // ========== ODOO SYNC: Update order status in Odoo ==========
  try {
    const fullOrder = await Order.findById(id);
    await odooSyncService.updateOrderInOdoo(fullOrder);
    console.log(`[ORDER CONTROLLER] Order status updated in Odoo: ${fullOrder.order_number}`);
  } catch (error) {
    console.error(`[ORDER CONTROLLER] Failed to sync status update to Odoo:`, error.message);
    // Don't fail the request - order is updated locally
  }
  // ===========================================================

  // Get updated order with details
  const orderDetails = await Order.findByIdWithDetails(id);

  res.status(200).json({
    success: true,
    message: 'Order status updated successfully',
    data: orderDetails,
  });
});

// Assign order to user
const assignOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { assigned_to, notes } = req.body;

  const existingOrder = await Order.findById(id);
  if (!existingOrder) {
    throw new AppError('Order not found', 404);
  }

  // Verify user exists
  let assignedUser = null;
  if (assigned_to) {
    assignedUser = await User.findById(assigned_to);
    if (!assignedUser) {
      throw new AppError('User not found', 404);
    }
    if (assignedUser.role !== 'worker' && assignedUser.role !== 'manager') {
      throw new AppError('Orders can only be assigned to workers or managers', 400);
    }
  }

  const oldAssignedTo = existingOrder.assigned_to;

  // Update assignment
  const updatedOrder = await Order.update(id, {
    assigned_to: assigned_to || null,
    notes: notes || existingOrder.notes,
  });

  // Log assignment change
  const logDetails = assigned_to
    ? `Order assigned to ${assignedUser.username} by ${req.user.username}`
    : `Order unassigned by ${req.user.username}`;

  await Order.addLog({
    order_id: id,
    user_id: req.user.id,
    action: 'assignment_change',
    old_status: existingOrder.status,
    new_status: existingOrder.status,
    details: logDetails,
  });

  // Get updated order with details
  const orderDetails = await Order.findByIdWithDetails(id);

  res.status(200).json({
    success: true,
    message: 'Order assignment updated successfully',
    data: orderDetails,
  });
});

// Block order
const blockOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const existingOrder = await Order.findById(id);
  if (!existingOrder) {
    throw new AppError('Order not found', 404);
  }

  if (existingOrder.status === 'blocked') {
    throw new AppError('Order is already blocked', 400);
  }

  if (existingOrder.status === 'done') {
    throw new AppError('Cannot block a completed order', 400);
  }

  // Update to blocked status
  await Order.update(id, {
    status: 'blocked',
    notes: reason || 'Order blocked',
  });

  // Log the block
  await Order.addLog({
    order_id: id,
    user_id: req.user.id,
    action: 'blocked',
    old_status: existingOrder.status,
    new_status: 'blocked',
    details: reason || `Order blocked by ${req.user.username}`,
  });

  const orderDetails = await Order.findByIdWithDetails(id);

  res.status(200).json({
    success: true,
    message: 'Order blocked successfully',
    data: orderDetails,
  });
});

// Unblock order
const unblockOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  const existingOrder = await Order.findById(id);
  if (!existingOrder) {
    throw new AppError('Order not found', 404);
  }

  if (existingOrder.status !== 'blocked') {
    throw new AppError('Order is not blocked', 400);
  }

  const newStatus = status || 'pending';
  const validStatuses = ['pending', 'in_progress'];
  if (!validStatuses.includes(newStatus)) {
    throw new AppError(`When unblocking, status must be one of: ${validStatuses.join(', ')}`, 400);
  }

  // Update status
  await Order.update(id, {
    status: newStatus,
    notes: notes || existingOrder.notes,
  });

  // Log the unblock
  await Order.addLog({
    order_id: id,
    user_id: req.user.id,
    action: 'unblocked',
    old_status: 'blocked',
    new_status: newStatus,
    details: notes || `Order unblocked by ${req.user.username}`,
  });

  const orderDetails = await Order.findByIdWithDetails(id);

  res.status(200).json({
    success: true,
    message: 'Order unblocked successfully',
    data: orderDetails,
  });
});

// Complete order
const completeOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;

  const existingOrder = await Order.findById(id);
  if (!existingOrder) {
    throw new AppError('Order not found', 404);
  }

  // Workers can complete their assigned orders
  if (req.user.role === 'worker' && existingOrder.assigned_to?.toString() !== req.user.id.toString()) {
    throw new AppError('Access denied. You can only complete orders assigned to you.', 403);
  }

  if (existingOrder.status === 'done') {
    throw new AppError('Order is already completed', 400);
  }

  if (existingOrder.status === 'blocked') {
    throw new AppError('Cannot complete a blocked order. Unblock it first.', 400);
  }

  // Update to done status
  await Order.update(id, {
    status: 'done',
    end_date: new Date(),
    notes: notes || existingOrder.notes,
  });

  // Log completion
  await Order.addLog({
    order_id: id,
    user_id: req.user.id,
    action: 'completed',
    old_status: existingOrder.status,
    new_status: 'done',
    details: notes || `Order completed by ${req.user.username}`,
  });

  const orderDetails = await Order.findByIdWithDetails(id);

  res.status(200).json({
    success: true,
    message: 'Order completed successfully',
    data: orderDetails,
  });
});

// Delete order
const deleteOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existingOrder = await Order.findById(id);
  if (!existingOrder) {
    throw new AppError('Order not found', 404);
  }

  // Log deletion before deleting
  await Order.addLog({
    order_id: id,
    user_id: req.user.id,
    action: 'deleted',
    old_status: existingOrder.status,
    new_status: null,
    details: `Order deleted by ${req.user.username}`,
  });

  await Order.delete(id);

  res.status(200).json({
    success: true,
    message: 'Order deleted successfully',
  });
});

// Get order logs
const getOrderLogs = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findById(id);
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Workers can only view logs for their assigned orders
  if (req.user.role === 'worker' && order.assigned_to?.toString() !== req.user.id.toString()) {
    throw new AppError('Access denied. You can only view logs for orders assigned to you.', 403);
  }

  const logs = await Order.getLogs(id);

  res.status(200).json({
    success: true,
    count: logs.length,
    data: logs,
  });
});

// Get order statistics
const getOrderStatistics = asyncHandler(async (req, res) => {
  let filters = {};

  // Workers can only see their own statistics
  if (req.user.role === 'worker') {
    filters.assigned_to = req.user.id;
  } else if (req.query.assigned_to) {
    filters.assigned_to = req.query.assigned_to;
  } else if (req.query.created_by) {
    filters.created_by = req.query.created_by;
  }

  const statistics = await Order.getStatistics(filters);

  res.status(200).json({
    success: true,
    data: statistics,
  });
});

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  updateOrderStatus,
  assignOrder,
  blockOrder,
  unblockOrder,
  completeOrder,
  deleteOrder,
  getOrderLogs,
  getOrderStatistics,
};
