const odooService = require('../services/odooService');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const Order = require('../models/Order');
const Product = require('../models/Product');

/**
 * Test Odoo connection
 * @route GET /api/odoo/test
 */
const testConnection = asyncHandler(async (req, res) => {
  console.log('[ODOO CONTROLLER] Testing connection...');
  
  const isConnected = await odooService.testConnection();
  
  if (!isConnected) {
    throw new AppError('Failed to connect to Odoo. Check server logs for details.', 500);
  }

  res.status(200).json({
    success: true,
    message: 'Successfully connected to Odoo',
    data: {
      connected: true,
      uid: odooService.uid,
    },
  });
});

/**
 * Get Odoo version information
 * @route GET /api/odoo/version
 */
const getVersion = asyncHandler(async (req, res) => {
  console.log('[ODOO CONTROLLER] Getting version...');
  
  const version = await odooService.getVersion();

  res.status(200).json({
    success: true,
    data: version,
  });
});

/**
 * Sync products from Odoo
 * @route GET /api/odoo/products
 */
const getProducts = asyncHandler(async (req, res) => {
  console.log('[ODOO CONTROLLER] Fetching products from Odoo...');
  
  const { limit = 100, offset = 0 } = req.query;

  // Search for active products
  const products = await odooService.searchRead(
    'product.product',
    [['active', '=', true]], // Only active products
    [
      'id',
      'name',
      'default_code', // Internal reference
      'barcode',
      'list_price',
      'standard_price',
      'type',
      'categ_id',
      'uom_id',
      'qty_available',
      'virtual_available',
      'description',
      'active',
    ],
    { limit: parseInt(limit), offset: parseInt(offset) }
  );

  res.status(200).json({
    success: true,
    count: products.length,
    data: products,
  });
});

/**
 * Get a specific product from Odoo
 * @route GET /api/odoo/products/:id
 */
const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log(`[ODOO CONTROLLER] Fetching product ${id} from Odoo...`);

  const products = await odooService.read(
    'product.product',
    [parseInt(id)],
    [
      'id',
      'name',
      'default_code',
      'barcode',
      'list_price',
      'standard_price',
      'type',
      'categ_id',
      'uom_id',
      'qty_available',
      'virtual_available',
      'description',
      'active',
    ]
  );

  if (!products || products.length === 0) {
    throw new AppError('Product not found in Odoo', 404);
  }

  res.status(200).json({
    success: true,
    data: products[0],
  });
});

/**
 * Sync manufacturing orders from Odoo
 * @route GET /api/odoo/manufacturing-orders
 */
const getManufacturingOrders = asyncHandler(async (req, res) => {
  console.log('[ODOO CONTROLLER] Fetching manufacturing orders from Odoo...');
  
  const { limit = 100, offset = 0, state } = req.query;

  // Build domain (filters)
  const domain = [];
  if (state) {
    domain.push(['state', '=', state]);
  }

  // Fetch MRP orders (Manufacturing Resource Planning)
  // Note: Odoo 18 uses 'date_start' instead of 'date_planned_start'
  const orders = await odooService.searchRead(
    'mrp.production',
    domain,
    [
      'id',
      'name',
      'product_id',
      'product_qty',
      'product_uom_id',
      'state',
      'date_start',          // Changed from date_planned_start in Odoo 18
      'date_deadline',
      'priority',
      'user_id',
      'company_id',
      'origin',
      'qty_produced',
      'qty_producing',
    ],
    { limit: parseInt(limit), offset: parseInt(offset), order: 'date_deadline desc' }
  );

  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders,
  });
});

/**
 * Get a specific manufacturing order from Odoo
 * @route GET /api/odoo/manufacturing-orders/:id
 */
const getManufacturingOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log(`[ODOO CONTROLLER] Fetching manufacturing order ${id} from Odoo...`);

  const orders = await odooService.read(
    'mrp.production',
    [parseInt(id)],
    [
      'id',
      'name',
      'product_id',
      'product_qty',
      'product_uom_id',
      'state',
      'date_start',          // Changed from date_planned_start in Odoo 18
      'date_deadline',
      'priority',
      'user_id',
      'company_id',
      'origin',
      'qty_produced',
      'qty_producing',
      'bom_id',
      'move_raw_ids',
      'move_finished_ids',
    ]
  );

  if (!orders || orders.length === 0) {
    throw new AppError('Manufacturing order not found in Odoo', 404);
  }

  res.status(200).json({
    success: true,
    data: orders[0],
  });
});

/**
 * Create a manufacturing order in Odoo
 * @route POST /api/odoo/manufacturing-orders
 */
const createManufacturingOrder = asyncHandler(async (req, res) => {
  console.log('[ODOO CONTROLLER] Creating manufacturing order in Odoo...');
  
  const {
    product_id,
    product_qty,
    date_start,              // Changed from date_planned_start for Odoo 18
    date_deadline,
    origin,
  } = req.body;

  // Validate required fields
  if (!product_id || !product_qty) {
    throw new AppError('product_id and product_qty are required', 400);
  }

  // Create the order in Odoo
  const values = {
    product_id: parseInt(product_id),
    product_qty: parseFloat(product_qty),
  };

  if (date_start) values.date_start = date_start;  // Changed from date_planned_start
  if (date_deadline) values.date_deadline = date_deadline;
  if (origin) values.origin = origin;

  const orderId = await odooService.create('mrp.production', values);

  // Fetch the created order
  const orders = await odooService.read('mrp.production', [orderId]);

  res.status(201).json({
    success: true,
    message: 'Manufacturing order created successfully in Odoo',
    data: orders[0],
  });
});

/**
 * Update a manufacturing order in Odoo
 * @route PUT /api/odoo/manufacturing-orders/:id
 */
const updateManufacturingOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log(`[ODOO CONTROLLER] Updating manufacturing order ${id} in Odoo...`);

  const { state, qty_producing, date_deadline } = req.body;

  const values = {};
  if (state) values.state = state;
  if (qty_producing !== undefined) values.qty_producing = parseFloat(qty_producing);
  if (date_deadline) values.date_deadline = date_deadline;

  if (Object.keys(values).length === 0) {
    throw new AppError('No fields to update', 400);
  }

  const success = await odooService.write('mrp.production', [parseInt(id)], values);

  if (!success) {
    throw new AppError('Failed to update manufacturing order in Odoo', 500);
  }

  // Fetch the updated order
  const orders = await odooService.read('mrp.production', [parseInt(id)]);

  res.status(200).json({
    success: true,
    message: 'Manufacturing order updated successfully in Odoo',
    data: orders[0],
  });
});

/**
 * Sync customers/partners from Odoo
 * @route GET /api/odoo/partners
 */
const getPartners = asyncHandler(async (req, res) => {
  console.log('[ODOO CONTROLLER] Fetching partners from Odoo...');
  
  const { limit = 100, offset = 0, is_company = true } = req.query;

  // Build domain
  const domain = [['active', '=', true]];
  if (is_company) {
    domain.push(['is_company', '=', true]);
  }

  const partners = await odooService.searchRead(
    'res.partner',
    domain,
    [
      'id',
      'name',
      'email',
      'phone',
      'mobile',
      'street',
      'city',
      'zip',
      'country_id',
      'is_company',
      'vat',
      'ref',
    ],
    { limit: parseInt(limit), offset: parseInt(offset) }
  );

  res.status(200).json({
    success: true,
    count: partners.length,
    data: partners,
  });
});

/**
 * Get stock inventory from Odoo
 * @route GET /api/odoo/stock
 */
const getStock = asyncHandler(async (req, res) => {
  console.log('[ODOO CONTROLLER] Fetching stock from Odoo...');
  
  const { product_id, location_id, limit = 100, offset = 0 } = req.query;

  // Build domain
  const domain = [];
  if (product_id) {
    domain.push(['product_id', '=', parseInt(product_id)]);
  }
  if (location_id) {
    domain.push(['location_id', '=', parseInt(location_id)]);
  }

  const stock = await odooService.searchRead(
    'stock.quant',
    domain,
    [
      'id',
      'product_id',
      'location_id',
      'quantity',
      'reserved_quantity',
      'available_quantity',
      'lot_id',
      'package_id',
    ],
    { limit: parseInt(limit), offset: parseInt(offset) }
  );

  res.status(200).json({
    success: true,
    count: stock.length,
    data: stock,
  });
});

/**
 * Create a sale order in Odoo
 * @route POST /api/odoo/orders/create
 */
const createSaleOrder = asyncHandler(async (req, res) => {
  console.log('[ODOO CONTROLLER] Creating sale order in Odoo...');
  
  const { orderId } = req.body;

  // Validate required fields
  if (!orderId) {
    throw new AppError('orderId is required', 400);
  }

  // Fetch order from MongoDB
  const order = await Order.findById(orderId).populate('product_id');
  if (!order) {
    throw new AppError('Order not found in database', 404);
  }

  // Check if product has odoo_id
  if (!order.product_id?.odoo_id) {
    throw new AppError('Product must be synced with Odoo first (missing odoo_id)', 400);
  }

  // Default partner_id (can be made dynamic based on customer field if you add one)
  // For now, using a default partner or you can pass it in the request
  const partner_id = req.body.partner_id || 1; // 1 is typically a default partner in Odoo

  // Map order status to Odoo sale.order state
  const statusToStateMap = {
    'pending': 'draft',
    'in_progress': 'sale',
    'done': 'done',
    'blocked': 'cancel',
  };
  const state = statusToStateMap[order.status] || 'draft';

  // Prepare order_line data
  // order_line format: [(0, 0, {field: value})] for create
  const order_line = [[0, 0, {
    product_id: order.product_id.odoo_id,
    product_uom_qty: order.quantity,
    name: order.product_id.name,
    price_unit: order.product_id.unit_price || 0,
  }]];

  // Create sale order in Odoo
  const values = {
    partner_id: parseInt(partner_id),
    order_line: order_line,
    state: state,
    client_order_ref: order.order_number,
    note: order.notes || '',
  };

  if (order.deadline) {
    values.commitment_date = new Date(order.deadline).toISOString().split('T')[0];
  }

  const odooOrderId = await odooService.create('sale.order', values);

  console.log(`✅ Order created in Odoo with ID: ${odooOrderId}`);

  // Save Odoo ID back to MongoDB
  order.odoo_id = odooOrderId;
  order.last_synced_at = new Date();
  await order.save();

  // Fetch the created order from Odoo to return full data
  const createdOrder = await odooService.read('sale.order', [odooOrderId], [
    'id', 'name', 'partner_id', 'state', 'amount_total', 'date_order'
  ]);

  res.status(201).json({
    success: true,
    message: 'Sale order created successfully in Odoo',
    data: {
      odoo_order_id: odooOrderId,
      odoo_order: createdOrder[0],
      local_order_id: order._id,
    },
  });
});

/**
 * Update a sale order in Odoo
 * @route PUT /api/odoo/orders/:id
 */
const updateSaleOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log(`[ODOO CONTROLLER] Updating sale order for local order ${id} in Odoo...`);

  // Fetch order from MongoDB
  const order = await Order.findById(id).populate('product_id');
  if (!order) {
    throw new AppError('Order not found in database', 404);
  }

  // Check if order has odoo_id
  if (!order.odoo_id) {
    throw new AppError('Order not linked to Odoo. Create it first using POST /api/odoo/orders/create', 400);
  }

  // Map order status to Odoo sale.order state
  const statusToStateMap = {
    'pending': 'draft',
    'in_progress': 'sale',
    'done': 'done',
    'blocked': 'cancel',
  };
  const state = statusToStateMap[order.status] || 'draft';

  // Prepare update values
  const values = {
    state: state,
    note: order.notes || '',
  };

  if (order.deadline) {
    values.commitment_date = new Date(order.deadline).toISOString().split('T')[0];
  }

  // Allow manual override of specific fields from request body
  if (req.body.partner_id) {
    values.partner_id = parseInt(req.body.partner_id);
  }

  const success = await odooService.write('sale.order', [order.odoo_id], values);

  if (!success) {
    throw new AppError('Failed to update sale order in Odoo', 500);
  }

  console.log(`✅ Order updated in Odoo: ${order.odoo_id}`);

  // Update sync timestamp
  order.last_synced_at = new Date();
  await order.save();

  // Fetch the updated order from Odoo
  const updatedOrder = await odooService.read('sale.order', [order.odoo_id], [
    'id', 'name', 'partner_id', 'state', 'amount_total', 'date_order'
  ]);

  res.status(200).json({
    success: true,
    message: 'Sale order updated successfully in Odoo',
    data: {
      odoo_order_id: order.odoo_id,
      odoo_order: updatedOrder[0],
      local_order_id: order._id,
    },
  });
});

module.exports = {
  testConnection,
  getVersion,
  getProducts,
  getProductById,
  getManufacturingOrders,
  getManufacturingOrderById,
  createManufacturingOrder,
  updateManufacturingOrder,
  getPartners,
  getStock,
  createSaleOrder,
  updateSaleOrder,
};

