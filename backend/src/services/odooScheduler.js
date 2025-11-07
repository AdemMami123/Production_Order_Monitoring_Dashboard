const cron = require('node-cron');
const odooSyncService = require('../services/odooSyncService');

/**
 * Odoo Sync Scheduler
 * Periodically synchronizes data between dashboard and Odoo
 */
class OdooScheduler {
  constructor() {
    this.syncJob = null;
    this.isEnabled = process.env.ODOO_AUTO_SYNC !== 'false'; // Default: enabled
    this.syncInterval = process.env.ODOO_SYNC_INTERVAL || '*/5 * * * *'; // Default: every 5 minutes
  }

  /**
   * Start the periodic sync job
   */
  start() {
    if (!this.isEnabled) {
      console.log('[ODOO SCHEDULER] Auto-sync is disabled');
      return;
    }

    // Stop existing job if running
    this.stop();

    console.log(`[ODOO SCHEDULER] Starting periodic sync (interval: ${this.syncInterval})`);

    // Schedule the sync job
    this.syncJob = cron.schedule(this.syncInterval, async () => {
      try {
        console.log('[ODOO SCHEDULER] Running scheduled sync...');
        const result = await odooSyncService.performFullSync();
        console.log('[ODOO SCHEDULER] Scheduled sync completed:', result);
      } catch (error) {
        console.error('[ODOO SCHEDULER] Scheduled sync failed:', error.message);
      }
    });

    console.log('[ODOO SCHEDULER] Periodic sync job started successfully');
  }

  /**
   * Stop the periodic sync job
   */
  stop() {
    if (this.syncJob) {
      this.syncJob.stop();
      this.syncJob = null;
      console.log('[ODOO SCHEDULER] Periodic sync job stopped');
    }
  }

  /**
   * Trigger manual sync immediately
   */
  async syncNow() {
    console.log('[ODOO SCHEDULER] Triggering manual sync...');
    try {
      const result = await odooSyncService.performFullSync();
      console.log('[ODOO SCHEDULER] Manual sync completed:', result);
      return result;
    } catch (error) {
      console.error('[ODOO SCHEDULER] Manual sync failed:', error.message);
      throw error;
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      enabled: this.isEnabled,
      interval: this.syncInterval,
      running: this.syncJob !== null,
      lastSync: odooSyncService.lastSyncTime,
      syncInProgress: odooSyncService.syncInProgress,
    };
  }
}

// Export singleton instance
module.exports = new OdooScheduler();
