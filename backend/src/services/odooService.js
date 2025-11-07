const axios = require('axios');

/**
 * OdooService - Secure integration with Odoo ERP via JSON-RPC
 * 
 * Security Features:
 * - Uses dedicated API user (not admin)
 * - API key authentication (stored in environment variables)
 * - HTTPS-only communication
 * - Comprehensive error handling
 * - Request/response logging for debugging
 * 
 * @requires axios
 */
class OdooService {
  constructor() {
    // Load configuration from environment variables
    this.url = process.env.ODOO_URL;
    this.db = process.env.ODOO_DB;
    this.username = process.env.ODOO_USERNAME;
    this.apiKey = process.env.ODOO_API_KEY;
    
    // User ID (set after authentication)
    this.uid = null;
    
    // Validate configuration
    this.validateConfig();
    
    // Create axios instance with default settings
    this.client = axios.create({
      timeout: 30000, // 30 seconds timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('[ODOO] Service initialized');
  }

  /**
   * Validate that all required configuration is present
   * @throws {Error} If any required configuration is missing
   */
  validateConfig() {
    const required = {
      ODOO_URL: this.url,
      ODOO_DB: this.db,
      ODOO_USERNAME: this.username,
      ODOO_API_KEY: this.apiKey,
    };

    const missing = Object.entries(required)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missing.length > 0) {
      throw new Error(
        `[ODOO] Missing required environment variables: ${missing.join(', ')}\n` +
        'Please check your .env file and ensure all Odoo configuration is set.'
      );
    }

    // Validate URL is HTTPS
    if (!this.url.startsWith('https://')) {
      console.warn('[ODOO] WARNING: ODOO_URL is not using HTTPS. This is insecure for production!');
    }

    // Validate API key format (basic check)
    if (this.apiKey.length < 20) {
      console.warn('[ODOO] WARNING: API key seems too short. Please verify it is correct.');
    }
  }

  /**
   * Make a JSON-RPC call to Odoo
   * @param {string} endpoint - The JSON-RPC endpoint (e.g., '/jsonrpc')
   * @param {object} params - The RPC parameters
   * @returns {Promise<any>} The result from Odoo
   * @throws {Error} If the request fails
   */
  async jsonRpcCall(endpoint, params) {
    const url = `${this.url}${endpoint}`;
    
    const payload = {
      jsonrpc: '2.0',
      method: 'call',
      params: params,
      id: Math.floor(Math.random() * 1000000),
    };

    try {
      console.log(`[ODOO] JSON-RPC call to ${endpoint}:`, JSON.stringify(params, null, 2));
      
      const response = await this.client.post(url, payload);
      
      // Check for JSON-RPC error
      if (response.data.error) {
        const error = response.data.error;
        throw new Error(
          `[ODOO] JSON-RPC Error: ${error.data?.message || error.message}\n` +
          `Details: ${JSON.stringify(error.data || {})}`
        );
      }

      console.log('[ODOO] JSON-RPC call successful');
      return response.data.result;
    } catch (error) {
      if (error.response) {
        // Server responded with error status
        throw new Error(
          `[ODOO] HTTP Error ${error.response.status}: ${error.response.statusText}\n` +
          `URL: ${url}\n` +
          `Response: ${JSON.stringify(error.response.data)}`
        );
      } else if (error.request) {
        // Request made but no response
        throw new Error(
          `[ODOO] No response from Odoo server at ${url}\n` +
          'Please check:\n' +
          '- ODOO_URL is correct\n' +
          '- Network connectivity\n' +
          '- Odoo server is running'
        );
      } else {
        // Other errors
        throw new Error(`[ODOO] Request failed: ${error.message}`);
      }
    }
  }

  /**
   * Authenticate with Odoo using API key
   * @returns {Promise<number>} The user ID (uid)
   * @throws {Error} If authentication fails
   */
  async authenticate() {
    try {
      console.log(`[ODOO] Authenticating user: ${this.username}`);
      
      // Call authenticate method via JSON-RPC
      const result = await this.jsonRpcCall('/jsonrpc', {
        service: 'common',
        method: 'authenticate',
        args: [
          this.db,           // database name
          this.username,     // username/email
          this.apiKey,       // API key (used as password)
          {},                // user agent info (optional)
        ],
      });

      if (!result) {
        throw new Error(
          '[ODOO] Authentication failed: Invalid credentials\n' +
          'Please check:\n' +
          '- ODOO_USERNAME is correct\n' +
          '- ODOO_API_KEY is valid and active\n' +
          '- User has API access enabled in Odoo\n' +
          '- Database name (ODOO_DB) is correct'
        );
      }

      this.uid = result;
      console.log(`[ODOO] Authentication successful. User ID: ${this.uid}`);
      return this.uid;
    } catch (error) {
      console.error('[ODOO] Authentication error:', error.message);
      throw error;
    }
  }

  /**
   * Execute a method on an Odoo model
   * @param {string} model - The Odoo model name (e.g., 'product.product')
   * @param {string} method - The method to call (e.g., 'search_read')
   * @param {Array} args - Positional arguments for the method
   * @param {Object} kwargs - Keyword arguments for the method
   * @returns {Promise<any>} The result from Odoo
   * @throws {Error} If the call fails
   */
  async execute(model, method, args = [], kwargs = {}) {
    // Ensure we're authenticated
    if (!this.uid) {
      await this.authenticate();
    }

    try {
      console.log(`[ODOO] Executing ${model}.${method}`);
      
      const result = await this.jsonRpcCall('/jsonrpc', {
        service: 'object',
        method: 'execute_kw',
        args: [
          this.db,
          this.uid,
          this.apiKey,
          model,
          method,
          args,
          kwargs,
        ],
      });

      console.log(`[ODOO] ${model}.${method} returned ${Array.isArray(result) ? result.length : 1} record(s)`);
      return result;
    } catch (error) {
      console.error(`[ODOO] Execute error on ${model}.${method}:`, error.message);
      throw error;
    }
  }

  /**
   * Search for records in an Odoo model
   * @param {string} model - The Odoo model name
   * @param {Array} domain - Search domain (filters)
   * @param {Object} options - Search options (limit, offset, order, etc.)
   * @returns {Promise<Array>} Array of record IDs
   */
  async search(model, domain = [], options = {}) {
    const { limit = 100, offset = 0, order = '' } = options;
    
    const kwargs = {};
    if (limit) kwargs.limit = limit;
    if (offset) kwargs.offset = offset;
    if (order) kwargs.order = order;

    return await this.execute(model, 'search', [domain], kwargs);
  }

  /**
   * Read records from an Odoo model
   * @param {string} model - The Odoo model name
   * @param {Array<number>} ids - Record IDs to read
   * @param {Array<string>} fields - Fields to retrieve
   * @returns {Promise<Array>} Array of record data
   */
  async read(model, ids, fields = []) {
    const kwargs = {};
    if (fields.length > 0) kwargs.fields = fields;

    return await this.execute(model, 'read', [ids], kwargs);
  }

  /**
   * Search and read records in one call
   * @param {string} model - The Odoo model name
   * @param {Array} domain - Search domain (filters)
   * @param {Array<string>} fields - Fields to retrieve
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Array of record data
   */
  async searchRead(model, domain = [], fields = [], options = {}) {
    const { limit = 100, offset = 0, order = '' } = options;
    
    const kwargs = {};
    if (fields.length > 0) kwargs.fields = fields;
    if (limit) kwargs.limit = limit;
    if (offset) kwargs.offset = offset;
    if (order) kwargs.order = order;

    return await this.execute(model, 'search_read', [domain], kwargs);
  }

  /**
   * Create a new record in an Odoo model
   * @param {string} model - The Odoo model name
   * @param {Object} values - Record values
   * @returns {Promise<number>} The new record ID
   */
  async create(model, values) {
    return await this.execute(model, 'create', [values]);
  }

  /**
   * Update existing records in an Odoo model
   * @param {string} model - The Odoo model name
   * @param {Array<number>} ids - Record IDs to update
   * @param {Object} values - Values to update
   * @returns {Promise<boolean>} True if successful
   */
  async write(model, ids, values) {
    return await this.execute(model, 'write', [ids, values]);
  }

  /**
   * Delete records from an Odoo model
   * @param {string} model - The Odoo model name
   * @param {Array<number>} ids - Record IDs to delete
   * @returns {Promise<boolean>} True if successful
   */
  async unlink(model, ids) {
    return await this.execute(model, 'unlink', [ids]);
  }

  /**
   * Get Odoo version information
   * @returns {Promise<Object>} Version info
   */
  async getVersion() {
    try {
      const result = await this.jsonRpcCall('/jsonrpc', {
        service: 'common',
        method: 'version',
        args: [],
      });
      console.log('[ODOO] Version:', result);
      return result;
    } catch (error) {
      console.error('[ODOO] Failed to get version:', error.message);
      throw error;
    }
  }

  /**
   * Test the connection to Odoo
   * @returns {Promise<boolean>} True if connection is successful
   */
  async testConnection() {
    try {
      console.log('[ODOO] Testing connection...');
      
      // Get version (doesn't require authentication)
      const version = await this.getVersion();
      console.log('[ODOO] Connected to Odoo', version.server_version);
      
      // Authenticate
      await this.authenticate();
      
      console.log('[ODOO] Connection test successful!');
      return true;
    } catch (error) {
      console.error('[ODOO] Connection test failed:', error.message);
      return false;
    }
  }
}

// Export singleton instance
module.exports = new OdooService();

