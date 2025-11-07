const odooService = require('./odooService');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

/**
 * Odoo Sync Service
 * Handles bidirectional synchronization between dashboard and Odoo ERP
 */
class OdooSyncService {
  constructor() {
    this.syncInProgress = false;
    this.lastSyncTime = null;
    this.syncErrors = [];
  }

  /**
   * Map dashboard order status to Odoo state
   */
  mapStatusToOdooState(status) {
    const statusMap = {
      'pending': 'draft',
      'in_progress': 'progress',
      'completed': 'done',
      'on_hold': 'confirmed',
      'cancelled': 'cancel',
    };
    return statusMap[status] || 'draft';
  }

  /**
   * Map Odoo state to dashboard status
   */
  mapOdooStateToStatus(state) {
    const stateMap = {
      'draft': 'pending',
      'confirmed': 'on_hold',
      'progress': 'in_progress',
      'to_close': 'in_progress',
      'done': 'completed',
      'cancel': 'cancelled',
    };
    return stateMap[state] || 'pending';
  }

  /**
   * Create production order in Odoo when created in dashboard
   */
  async createOrderInOdoo(order) {
    try {
      console.log(`[ODOO SYNC] Creating order ${order.order_number} in Odoo...`);

      // Validate required fields
      if (!order.product_id) {
        throw new Error('Product ID is required to sync with Odoo');
      }

      // Get product to find Odoo product ID
      const product = await Product.findById(order.product_id);
      if (!product || !product.odoo_id) {
        console.warn(`[ODOO SYNC] Product ${order.product_id} has no Odoo ID. Skipping sync.`);
        return null;
      }

      // Get assigned user's Odoo ID
      let odooUserId = null;
      if (order.assigned_to) {
        const user = await User.findById(order.assigned_to);
        if (user && user.odoo_id) {
          odooUserId = user.odoo_id;
        }
      }

      // Prepare Odoo manufacturing order data
      // Note: Odoo 18 uses 'date_start' instead of 'date_planned_start'
      const odooOrderData = {
        product_id: product.odoo_id,
        product_qty: order.quantity || 1,
        origin: `Dashboard-${order.order_number}`,
        date_deadline: order.deadline ? new Date(order.deadline).toISOString() : undefined,
        date_start: order.start_date ? new Date(order.start_date).toISOString() : undefined,  // Changed from date_planned_start
        priority: order.priority === 'high' ? '1' : '0',
      };

      // Add user if available
      if (odooUserId) {
        odooOrderData.user_id = odooUserId;
      }

      // Create in Odoo
      const odooId = await odooService.create('mrp.production', odooOrderData);

      console.log(`[ODOO SYNC] Order created in Odoo with ID: ${odooId}`);

      // Update local order with Odoo ID
      order.odoo_id = odooId;
      order.last_synced_at = new Date();
      await order.save();

      return odooId;
    } catch (error) {
      console.error(`[ODOO SYNC] Error creating order in Odoo:`, error.message);
      this.syncErrors.push({
        type: 'create_order',
        order_id: order._id,
        error: error.message,
        timestamp: new Date(),
      });
      throw error;
    }
  }

  /**
   * Update production order in Odoo when updated in dashboard
   */
  async updateOrderInOdoo(order) {
    try {
      console.log(`[ODOO SYNC] Updating order ${order.order_number} in Odoo...`);

      // If no Odoo ID, create it first
      if (!order.odoo_id) {
        return await this.createOrderInOdoo(order);
      }

      // Get assigned user's Odoo ID
      let odooUserId = null;
      if (order.assigned_to) {
        const user = await User.findById(order.assigned_to);
        if (user && user.odoo_id) {
          odooUserId = user.odoo_id;
        }
      }

      // Prepare update data
      // Note: Odoo 18 uses 'date_start' instead of 'date_planned_start'
      const updateData = {
        state: this.mapStatusToOdooState(order.status),
        date_deadline: order.deadline ? new Date(order.deadline).toISOString() : undefined,
        date_start: order.start_date ? new Date(order.start_date).toISOString() : undefined,  // Changed from date_planned_start
        priority: order.priority === 'high' ? '1' : '0',
      };

      // Add user if available
      if (odooUserId) {
        updateData.user_id = odooUserId;
      }

      // Update in Odoo
      const success = await odooService.write('mrp.production', [order.odoo_id], updateData);

      if (success) {
        console.log(`[ODOO SYNC] Order updated in Odoo: ${order.odoo_id}`);
        order.last_synced_at = new Date();
        await order.save();
      }

      return success;
    } catch (error) {
      console.error(`[ODOO SYNC] Error updating order in Odoo:`, error.message);
      this.syncErrors.push({
        type: 'update_order',
        order_id: order._id,
        odoo_id: order.odoo_id,
        error: error.message,
        timestamp: new Date(),
      });
      // Don't throw - allow local update to succeed even if Odoo sync fails
      return false;
    }
  }

  /**
   * Pull manufacturing orders from Odoo and sync to local DB
   */
  async pullOrdersFromOdoo(limit = 100) {
    try {
      console.log(`[ODOO SYNC] Pulling manufacturing orders from Odoo...`);

      // Fetch recent orders from Odoo
      // Note: Odoo 18 uses 'date_start' instead of 'date_planned_start'
      const odooOrders = await odooService.searchRead(
        'mrp.production',
        [], // No domain filter - get all orders
        [
          'id',
          'name',
          'product_id',
          'product_qty',
          'state',
          'date_start',        // Changed from date_planned_start in Odoo 18
          'date_deadline',
          'priority',
          'user_id',
          'origin',
          'qty_produced',
          'create_date',
          'write_date',
        ],
        { limit, order: 'write_date desc' }
      );

      console.log(`[ODOO SYNC] Found ${odooOrders.length} orders in Odoo`);

      let created = 0;
      let updated = 0;
      let skipped = 0;

      for (const odooOrder of odooOrders) {
        try {
          // Find or create product
          let product = await Product.findOne({ odoo_id: odooOrder.product_id[0] });
          if (!product) {
            // Create placeholder product
            product = await Product.create({
              name: odooOrder.product_id[1],
              sku: `ODOO-${odooOrder.product_id[0]}`,
              odoo_id: odooOrder.product_id[0],
              category: 'Manufacturing',
              stock_quantity: 0,
            });
            console.log(`[ODOO SYNC] Created product: ${product.name}`);
          }

          // Find or create user
          let assignedUser = null;
          if (odooOrder.user_id) {
            assignedUser = await User.findOne({ odoo_id: odooOrder.user_id[0] });
          }

          // Check if order exists locally
          let localOrder = await Order.findOne({ odoo_id: odooOrder.id });

          const orderData = {
            order_number: odooOrder.name,
            product_id: product._id,
            quantity: odooOrder.product_qty || 1,
            status: this.mapOdooStateToStatus(odooOrder.state),
            priority: odooOrder.priority === '1' ? 'high' : 'normal',
            deadline: odooOrder.date_deadline || null,
            start_date: odooOrder.date_start || null,  // Changed from date_planned_start
            assigned_to: assignedUser?._id || null,
            notes: odooOrder.origin || '',
            odoo_id: odooOrder.id,
            last_synced_at: new Date(),
          };

          if (localOrder) {
            // Update existing order (only if Odoo was modified more recently)
            const odooModified = new Date(odooOrder.write_date);
            const localModified = localOrder.updated_at;

            if (odooModified > localModified) {
              await Order.findByIdAndUpdate(localOrder._id, orderData);
              updated++;
              console.log(`[ODOO SYNC] Updated order: ${odooOrder.name}`);
            } else {
              skipped++;
            }
          } else {
            // Create new order
            await Order.create(orderData);
            created++;
            console.log(`[ODOO SYNC] Created order: ${odooOrder.name}`);
          }
        } catch (error) {
          console.error(`[ODOO SYNC] Error syncing order ${odooOrder.name}:`, error.message);
          this.syncErrors.push({
            type: 'pull_order',
            odoo_id: odooOrder.id,
            error: error.message,
            timestamp: new Date(),
          });
        }
      }

      console.log(`[ODOO SYNC] Orders sync complete: ${created} created, ${updated} updated, ${skipped} skipped`);

      return { created, updated, skipped, total: odooOrders.length };
    } catch (error) {
      console.error(`[ODOO SYNC] Error pulling orders from Odoo:`, error.message);
      throw error;
    }
  }

  /**
   * Pull products from Odoo and sync to local DB
   */
  async pullProductsFromOdoo(limit = 100) {
    try {
      console.log(`[ODOO SYNC] Pulling products from Odoo...`);

      const odooProducts = await odooService.searchRead(
        'product.product',
        [['active', '=', true]],
        [
          'id',
          'name',
          'default_code',
          'barcode',
          'list_price',
          'standard_price',
          'type',
          'categ_id',
          'qty_available',
          'description',
        ],
        { limit }
      );

      console.log(`[ODOO SYNC] Found ${odooProducts.length} products in Odoo`);

      let created = 0;
      let updated = 0;

      for (const odooProduct of odooProducts) {
        try {
          // Generate SKU/reference - required field
          const sku = odooProduct.default_code || odooProduct.barcode || `ODOO-${odooProduct.id}`;
          
          const productData = {
            name: odooProduct.name,
            sku: sku,
            reference: sku, // Add reference field (required by Product model)
            description: odooProduct.description || '',
            category: odooProduct.categ_id ? odooProduct.categ_id[1] : 'General',
            unit_price: odooProduct.list_price || 0,
            stock_quantity: odooProduct.qty_available || 0,
            odoo_id: odooProduct.id,
            last_synced_at: new Date(),
          };

          // Try to find existing product by Odoo ID first
          let existingProduct = await Product.findOne({ odoo_id: odooProduct.id });

          // If not found by odoo_id, try to find by reference (sku) to avoid duplicates
          if (!existingProduct) {
            existingProduct = await Product.findOne({ reference: productData.reference });
            if (existingProduct) {
              // Link local product to Odoo record if it wasn't linked
              console.log(`[ODOO SYNC] Found existing product by reference (${productData.reference}) - linking to Odoo ID ${odooProduct.id}`);
              productData.odoo_id = odooProduct.id;
            }
          }

          if (existingProduct) {
            await Product.findByIdAndUpdate(existingProduct._id, productData);
            updated++;
          } else {
            await Product.create(productData);
            created++;
          }
        } catch (error) {
          console.error(`[ODOO SYNC] Error syncing product ${odooProduct.name}:`, error.message);
          this.syncErrors.push({
            type: 'pull_product',
            odoo_id: odooProduct.id,
            error: error.message,
            timestamp: new Date(),
          });
        }
      }

      console.log(`[ODOO SYNC] Products sync complete: ${created} created, ${updated} updated`);

      return { created, updated, total: odooProducts.length };
    } catch (error) {
      console.error(`[ODOO SYNC] Error pulling products from Odoo:`, error.message);
      throw error;
    }
  }

  /**
   * Pull users from Odoo and sync to local DB
   */
  async pullUsersFromOdoo(limit = 100) {
    try {
      console.log(`[ODOO SYNC] Pulling users from Odoo...`);

      const odooUsers = await odooService.searchRead(
        'res.users',
        [['active', '=', true]],
        [
          'id',
          'name',
          'login',
          'email',
          'phone',
          'mobile',
        ],
        { limit }
      );

      console.log(`[ODOO SYNC] Found ${odooUsers.length} users in Odoo`);

      let created = 0;
      let updated = 0;

      for (const odooUser of odooUsers) {
        try {
          // Check if user already exists by Odoo ID
          let localUser = await User.findOne({ odoo_id: odooUser.id });

          if (localUser) {
            // Update existing user (only sync specific fields)
            localUser.first_name = odooUser.name.split(' ')[0] || odooUser.name;
            localUser.last_name = odooUser.name.split(' ').slice(1).join(' ') || '';
            localUser.email = odooUser.email || odooUser.login;
            localUser.last_synced_at = new Date();
            await localUser.save();
            updated++;
          } else {
            // Check if user exists by email
            localUser = await User.findOne({ email: odooUser.email || odooUser.login });
            
            if (localUser) {
              // Link existing user to Odoo
              localUser.odoo_id = odooUser.id;
              localUser.last_synced_at = new Date();
              await localUser.save();
              updated++;
              console.log(`[ODOO SYNC] Linked user ${localUser.email} to Odoo ID ${odooUser.id}`);
            } else {
              // Skip creating new users - only sync existing ones
              console.log(`[ODOO SYNC] Skipping new user creation: ${odooUser.login} (manual creation required)`);
            }
          }
        } catch (error) {
          console.error(`[ODOO SYNC] Error syncing user ${odooUser.login}:`, error.message);
          this.syncErrors.push({
            type: 'pull_user',
            odoo_id: odooUser.id,
            error: error.message,
            timestamp: new Date(),
          });
        }
      }

      console.log(`[ODOO SYNC] Users sync complete: ${created} created, ${updated} updated`);

      return { created, updated, total: odooUsers.length };
    } catch (error) {
      console.error(`[ODOO SYNC] Error pulling users from Odoo:`, error.message);
      throw error;
    }
  }

  /**
   * Perform full bidirectional sync
   */
  async performFullSync() {
    if (this.syncInProgress) {
      console.log('[ODOO SYNC] Sync already in progress, skipping...');
      return { skipped: true, reason: 'Sync in progress' };
    }

    try {
      this.syncInProgress = true;
      this.syncErrors = [];
      const startTime = new Date();

      console.log('[ODOO SYNC] ========================================');
      console.log('[ODOO SYNC] Starting full bidirectional sync...');
      console.log('[ODOO SYNC] ========================================');

      // Test connection first
      const isConnected = await odooService.testConnection();
      if (!isConnected) {
        throw new Error('Cannot connect to Odoo. Check configuration and network.');
      }

      // Pull data from Odoo
      const productsResult = await this.pullProductsFromOdoo();
      const usersResult = await this.pullUsersFromOdoo();
      const ordersResult = await this.pullOrdersFromOdoo();

      // Push pending local changes to Odoo
      const pendingSyncOrders = await Order.find({
        $or: [
          { odoo_id: { $exists: false } },
          { odoo_id: null },
          { 
            last_synced_at: { $lt: new Date(Date.now() - 5 * 60 * 1000) } // Not synced in last 5 minutes
          }
        ]
      }).limit(50);

      let pushedOrders = 0;
      for (const order of pendingSyncOrders) {
        try {
          if (order.odoo_id) {
            await this.updateOrderInOdoo(order);
          } else {
            await this.createOrderInOdoo(order);
          }
          pushedOrders++;
        } catch (error) {
          console.error(`[ODOO SYNC] Failed to push order ${order.order_number}:`, error.message);
        }
      }

      const endTime = new Date();
      const duration = (endTime - startTime) / 1000;

      this.lastSyncTime = endTime;

      const result = {
        success: true,
        timestamp: endTime,
        duration: `${duration}s`,
        products: productsResult,
        users: usersResult,
        orders: ordersResult,
        pushedOrders,
        errors: this.syncErrors.length,
      };

      console.log('[ODOO SYNC] ========================================');
      console.log('[ODOO SYNC] Sync completed successfully');
      console.log(`[ODOO SYNC] Duration: ${duration}s`);
      console.log(`[ODOO SYNC] Products: ${productsResult.created} created, ${productsResult.updated} updated`);
      console.log(`[ODOO SYNC] Users: ${usersResult.created} created, ${usersResult.updated} updated`);
      console.log(`[ODOO SYNC] Orders: ${ordersResult.created} created, ${ordersResult.updated} updated`);
      console.log(`[ODOO SYNC] Pushed ${pushedOrders} orders to Odoo`);
      console.log(`[ODOO SYNC] Errors: ${this.syncErrors.length}`);
      console.log('[ODOO SYNC] ========================================');

      return result;
    } catch (error) {
      console.error('[ODOO SYNC] Full sync failed:', error.message);
      this.syncErrors.push({
        type: 'full_sync',
        error: error.message,
        timestamp: new Date(),
      });
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Get sync status and errors
   */
  getSyncStatus() {
    return {
      syncInProgress: this.syncInProgress,
      lastSyncTime: this.lastSyncTime,
      errors: this.syncErrors.slice(-10), // Last 10 errors
      totalErrors: this.syncErrors.length,
    };
  }
}

// Export singleton instance
module.exports = new OdooSyncService();
