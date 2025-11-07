const odooSyncService = require('../services/odooSyncService');
const odooScheduler = require('../services/odooScheduler');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

/**
 * Trigger manual full sync
 * @route POST /api/sync/full
 */
const triggerFullSync = asyncHandler(async (req, res) => {
  console.log('[SYNC CONTROLLER] Triggering full sync...');

  const result = await odooSyncService.performFullSync();

  res.status(200).json({
    success: true,
    message: 'Full sync completed successfully',
    data: result,
  });
});

/**
 * Sync products only
 * @route POST /api/sync/products
 */
const syncProducts = asyncHandler(async (req, res) => {
  console.log('[SYNC CONTROLLER] Syncing products...');

  const result = await odooSyncService.pullProductsFromOdoo();

  res.status(200).json({
    success: true,
    message: 'Products synced successfully',
    data: result,
  });
});

/**
 * Sync users only
 * @route POST /api/sync/users
 */
const syncUsers = asyncHandler(async (req, res) => {
  console.log('[SYNC CONTROLLER] Syncing users...');

  const result = await odooSyncService.pullUsersFromOdoo();

  res.status(200).json({
    success: true,
    message: 'Users synced successfully',
    data: result,
  });
});

/**
 * Sync orders only
 * @route POST /api/sync/orders
 */
const syncOrders = asyncHandler(async (req, res) => {
  console.log('[SYNC CONTROLLER] Syncing orders...');

  const result = await odooSyncService.pullOrdersFromOdoo();

  res.status(200).json({
    success: true,
    message: 'Orders synced successfully',
    data: result,
  });
});

/**
 * Get sync status
 * @route GET /api/sync/status
 */
const getSyncStatus = asyncHandler(async (req, res) => {
  const syncStatus = odooSyncService.getSyncStatus();
  const schedulerStatus = odooScheduler.getStatus();

  res.status(200).json({
    success: true,
    data: {
      sync: syncStatus,
      scheduler: schedulerStatus,
    },
  });
});

/**
 * Start auto-sync scheduler
 * @route POST /api/sync/scheduler/start
 */
const startScheduler = asyncHandler(async (req, res) => {
  odooScheduler.start();

  res.status(200).json({
    success: true,
    message: 'Auto-sync scheduler started',
    data: odooScheduler.getStatus(),
  });
});

/**
 * Stop auto-sync scheduler
 * @route POST /api/sync/scheduler/stop
 */
const stopScheduler = asyncHandler(async (req, res) => {
  odooScheduler.stop();

  res.status(200).json({
    success: true,
    message: 'Auto-sync scheduler stopped',
    data: odooScheduler.getStatus(),
  });
});

module.exports = {
  triggerFullSync,
  syncProducts,
  syncUsers,
  syncOrders,
  getSyncStatus,
  startScheduler,
  stopScheduler,
};
