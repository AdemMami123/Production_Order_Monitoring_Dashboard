# Odoo ERP Integration - Complete Implementation

Complete bidirectional integration between Production Orders Monitoring Dashboard and Odoo ERP.

---

## 🎯 Features Implemented

### ✅ Automatic Order Sync
- **Dashboard → Odoo**: Orders automatically create `mrp.production` records in Odoo
- **Odoo → Dashboard**: Manufacturing orders sync to local MongoDB
- **Status Mapping**: Dashboard statuses map to Odoo states
- **Real-time Updates**: Changes propagate automatically

### ✅ Product Integration
- **Real-time Fetch**: Product dropdowns fetch from Odoo API
- **Bidirectional Sync**: Products sync between systems
- **Stock Tracking**: Quantity available synced from Odoo
- **Category Mapping**: Categories synchronized

### ✅ User Management
- **User Sync**: Odoo users link to dashboard users
- **Assignment Tracking**: Assigned users synced to Odoo `user_id`
- **Real-time Dropdowns**: User lists fetched from Odoo

### ✅ Periodic Auto-Sync
- **Scheduled Sync**: Every 5 minutes (configurable)
- **Full Sync**: Products, users, and orders
- **Error Handling**: Graceful failure with logging
- **Manual Trigger**: API endpoints for on-demand sync

### ✅ Comprehensive Error Handling
- **Connection Failures**: Fallback to local data
- **Sync Errors**: Logged with timestamps
- **Status Monitoring**: Real-time sync status API
- **Graceful Degradation**: Dashboard works without Odoo

---

## 📁 Files Created/Modified

### New Files

#### Services
- `backend/src/services/odooSyncService.js` - Bidirectional sync logic (700+ lines)
- `backend/src/services/odooScheduler.js` - Cron job scheduler for periodic sync

#### Controllers
- `backend/src/controllers/syncController.js` - Sync API endpoints

#### Routes
- `backend/src/routes/syncRoutes.js` - Sync route definitions

#### Documentation
- `docs/ODOO_DASHBOARD_SETUP.md` - Complete step-by-step Odoo setup guide (500+ lines)
- `docs/ODOO_TESTING_GUIDE.md` - Quick testing reference
- `docs/ODOO_INTEGRATION_README.md` - This file

### Modified Files

#### Models
- `backend/src/models/Order.js` - Added `odoo_id`, `last_synced_at` fields
- `backend/src/models/Product.js` - Added `odoo_id`, `last_synced_at` fields
- `backend/src/models/User.js` - Added `odoo_id`, `last_synced_at` fields

#### Controllers
- `backend/src/controllers/orderController.js` - Auto-sync on create/update

#### Configuration
- `backend/src/server.js` - Register sync routes, start scheduler
- `backend/.env` - Add `ODOO_AUTO_SYNC`, `ODOO_SYNC_INTERVAL`
- `backend/package.json` - Add `node-cron` dependency

---

## 🔧 Configuration

### Environment Variables

```bash
# Odoo Connection
ODOO_URL=http://localhost:8069
ODOO_DB=adem
ODOO_USERNAME=ademmami92@gmail.com
ODOO_API_KEY=3e518df28b9d1ec1fb7df7f8052aa44206b5bac9

# Auto-Sync Settings
ODOO_AUTO_SYNC=true                # Enable/disable auto-sync
ODOO_SYNC_INTERVAL=*/5 * * * *     # Cron expression (every 5 minutes)
```

### Cron Interval Examples

```bash
*/5 * * * *    # Every 5 minutes
*/10 * * * *   # Every 10 minutes
0 * * * *      # Every hour
0 0 * * *      # Daily at midnight
0 */6 * * *    # Every 6 hours
```

---

## 🚀 API Endpoints

### Odoo Direct Access

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/odoo/test` | Test Odoo connection | Admin |
| GET | `/api/odoo/version` | Get Odoo version | Admin |
| GET | `/api/odoo/products` | Get products from Odoo | Manager/Admin |
| GET | `/api/odoo/products/:id` | Get specific product | Manager/Admin |
| GET | `/api/odoo/manufacturing-orders` | Get manufacturing orders | Manager/Admin |
| GET | `/api/odoo/manufacturing-orders/:id` | Get specific order | Manager/Admin |
| POST | `/api/odoo/manufacturing-orders` | Create order in Odoo | Manager/Admin |
| PUT | `/api/odoo/manufacturing-orders/:id` | Update order in Odoo | Manager/Admin |
| GET | `/api/odoo/partners` | Get partners/customers | Manager/Admin |
| GET | `/api/odoo/stock` | Get stock/inventory | Manager/Admin |

### Sync Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/sync/full` | Trigger full bidirectional sync | Admin |
| POST | `/api/sync/products` | Sync products only | Admin |
| POST | `/api/sync/users` | Sync users only | Admin |
| POST | `/api/sync/orders` | Sync orders only | Admin |
| GET | `/api/sync/status` | Get sync status | Admin |
| POST | `/api/sync/scheduler/start` | Start auto-sync | Admin |
| POST | `/api/sync/scheduler/stop` | Stop auto-sync | Admin |

---

## 🔄 Sync Flow

### Order Creation Flow

```
User creates order in Dashboard
         ↓
orderController.createOrder()
         ↓
Order saved to MongoDB
         ↓
odooSyncService.createOrderInOdoo()
         ↓
Odoo API called (JSON-RPC)
         ↓
mrp.production created in Odoo
         ↓
odoo_id saved to order
         ↓
Response returned to user
```

### Auto-Sync Flow

```
Every 5 minutes (cron job)
         ↓
odooScheduler triggers
         ↓
odooSyncService.performFullSync()
         ↓
┌────────────────────────────────┐
│ 1. Pull products from Odoo     │
│ 2. Pull users from Odoo        │
│ 3. Pull orders from Odoo       │
│ 4. Push pending local orders   │
└────────────────────────────────┘
         ↓
Update MongoDB with Odoo data
         ↓
Log sync results
```

---

## 📊 Data Mapping

### Order Fields

| Dashboard | Odoo | Type | Notes |
|-----------|------|------|-------|
| `order_number` | `origin` | String | Prefixed with "Dashboard-" |
| `product_id` | `product_id` | Ref | Requires product.odoo_id |
| `quantity` | `product_qty` | Float | Units to manufacture |
| `status` | `state` | String | See status mapping below |
| `priority` | `priority` | String | "high" → "1", else "0" |
| `deadline` | `date_deadline` | DateTime | ISO format |
| `start_date` | `date_planned_start` | DateTime | ISO format |
| `assigned_to` | `user_id` | Ref | Requires user.odoo_id |
| `notes` | `origin` | String | Additional context |

### Status Mapping

| Dashboard | Odoo | Description |
|-----------|------|-------------|
| `pending` | `draft` | Order created, not confirmed |
| `on_hold` | `confirmed` | Confirmed, waiting to start |
| `in_progress` | `progress` | Currently manufacturing |
| `completed` | `done` | Manufacturing complete |
| `cancelled` | `cancel` | Order cancelled |

### Product Fields

| Dashboard | Odoo | Type |
|-----------|------|------|
| `name` | `name` | String |
| `sku` | `default_code` | String |
| `description` | `description` | Text |
| `category` | `categ_id` | Ref |
| `unit_price` | `list_price` | Float |
| `stock_quantity` | `qty_available` | Float |

---

## 🛠️ Installation

### 1. Install Dependencies

```powershell
cd backend
npm install node-cron
```

### 2. Configure Environment

Update `backend/.env`:

```bash
ODOO_URL=http://localhost:8069
ODOO_DB=your_database_name
ODOO_USERNAME=your_email@example.com
ODOO_API_KEY=your_generated_api_key
ODOO_AUTO_SYNC=true
ODOO_SYNC_INTERVAL=*/5 * * * *
```

### 3. Generate Odoo API Key

1. Login to Odoo as admin
2. Go to user preferences (top right menu)
3. Navigate to **Account Security** tab
4. Click **New API Key**
5. Copy the generated key
6. Paste into `.env` file

### 4. Start Backend

```powershell
npm run dev
```

**Verify startup:**
```
[ODOO] Service initialized
[ODOO SCHEDULER] Starting periodic sync...
[ODOO SCHEDULER] Periodic sync job started successfully
```

---

## 📖 Usage Examples

### Example 1: Create Order with Odoo Sync

```javascript
// POST /api/orders
{
  "order_number": "ORD-2025-001",
  "product_id": "673b8f9c1234567890abcdef", // MongoDB ID
  "quantity": 100,
  "priority": "high",
  "deadline": "2025-12-31T23:59:59Z",
  "assigned_to": "673b8f9c0987654321fedcba",
  "notes": "Urgent customer order"
}

// Backend automatically:
// 1. Creates order in MongoDB
// 2. Calls odooSyncService.createOrderInOdoo()
// 3. Creates mrp.production in Odoo
// 4. Stores odoo_id in order document

// Response:
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "_id": "673b8f9c...",
    "order_number": "ORD-2025-001",
    "odoo_id": 42,  // ← Odoo manufacturing order ID
    "last_synced_at": "2025-11-06T10:30:00.000Z"
  }
}
```

### Example 2: Manual Sync

```javascript
// Trigger full sync
POST /api/sync/full
Authorization: Bearer <admin_token>

// Response:
{
  "success": true,
  "message": "Full sync completed successfully",
  "data": {
    "products": { "created": 0, "updated": 15 },
    "users": { "created": 0, "updated": 5 },
    "orders": { "created": 2, "updated": 8, "skipped": 10 },
    "pushedOrders": 3,
    "errors": 0,
    "duration": "12.5s"
  }
}
```

### Example 3: Check Sync Status

```javascript
GET /api/sync/status
Authorization: Bearer <admin_token>

// Response:
{
  "success": true,
  "data": {
    "sync": {
      "syncInProgress": false,
      "lastSyncTime": "2025-11-06T10:30:00.000Z",
      "errors": [],
      "totalErrors": 0
    },
    "scheduler": {
      "enabled": true,
      "interval": "*/5 * * * *",
      "running": true
    }
  }
}
```

---

## 🧪 Testing

### Quick Test Commands

```powershell
# 1. Test connection
curl -X GET http://localhost:5000/api/odoo/test `
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Sync products
curl -X POST http://localhost:5000/api/sync/products `
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Create test order
curl -X POST http://localhost:5000/api/orders `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{
    "order_number": "TEST-001",
    "product_id": "PRODUCT_ID",
    "quantity": 10
  }'

# 4. Check sync status
curl -X GET http://localhost:5000/api/sync/status `
  -H "Authorization: Bearer YOUR_TOKEN"
```

See `docs/ODOO_TESTING_GUIDE.md` for complete test scenarios.

---

## 🔍 Monitoring

### Backend Logs

Monitor sync activity in console:

```
[ODOO SCHEDULER] Running scheduled sync...
[ODOO SYNC] Starting full bidirectional sync...
[ODOO SYNC] Products sync complete: 0 created, 15 updated
[ODOO SYNC] Users sync complete: 0 created, 5 updated
[ODOO SYNC] Orders sync complete: 2 created, 8 updated
[ODOO SYNC] Pushed 3 orders to Odoo
[ODOO SYNC] Sync completed successfully
[ODOO SYNC] Duration: 12.5s
```

### Sync Status API

Query sync status:

```javascript
GET /api/sync/status

// Returns:
- syncInProgress: boolean
- lastSyncTime: timestamp
- errors: array of recent errors
- scheduler.running: boolean
- scheduler.interval: cron expression
```

### Error Tracking

Errors are logged with context:

```javascript
{
  type: 'create_order',
  order_id: '673b8f9c...',
  odoo_id: 42,
  error: 'Product not found in Odoo',
  timestamp: '2025-11-06T10:30:00.000Z'
}
```

Access via `GET /api/sync/status` - returns last 10 errors.

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Connection Refused

**Error:** `connect ECONNREFUSED 127.0.0.1:8069`

**Solutions:**
- Verify Odoo is running: `http://localhost:8069`
- Check `ODOO_URL` in `.env`
- Test network connectivity
- Check firewall settings

#### 2. Authentication Failed

**Error:** `Authentication failed: Invalid credentials`

**Solutions:**
- Verify `ODOO_USERNAME` matches user email
- Regenerate API key in Odoo user preferences
- Update `ODOO_API_KEY` in `.env`
- Restart backend

#### 3. Product Not Found

**Error:** `Product has no Odoo ID. Skipping sync.`

**Solutions:**
- Run product sync: `POST /api/sync/products`
- Verify products exist in Odoo
- Check MongoDB for missing `odoo_id`:
  ```javascript
  db.products.find({ odoo_id: { $exists: false } })
  ```

#### 4. Sync Timeout

**Error:** `Sync timeout after 30 seconds`

**Solutions:**
- Reduce batch size in `odooSyncService.js`
- Increase sync interval to 10 minutes
- Check Odoo server performance
- Optimize Odoo database

---

## 📚 Documentation

- **Setup Guide**: `docs/ODOO_DASHBOARD_SETUP.md` - Complete step-by-step Odoo configuration
- **Testing Guide**: `docs/ODOO_TESTING_GUIDE.md` - Quick test reference
- **Integration Guide**: `docs/ODOO_INTEGRATION_GUIDE.md` - Technical implementation details
- **Python Client**: `python_client/README.md` - Python Odoo client library

---

## 🎯 Next Steps

1. **Test Integration**: Follow `docs/ODOO_TESTING_GUIDE.md`
2. **Configure Odoo**: Follow `docs/ODOO_DASHBOARD_SETUP.md`
3. **Monitor Sync**: Use `GET /api/sync/status` regularly
4. **Customize Mapping**: Modify `odooSyncService.js` for custom fields
5. **Frontend Integration**: Add sync buttons to dashboard UI

---

## 🔒 Security

- ✅ API key stored in `.env` (never committed to git)
- ✅ HTTPS recommended for production
- ✅ Role-based access (Admin only for sync endpoints)
- ✅ Rate limiting on all endpoints
- ✅ JWT authentication required

---

## 📊 Performance

- **Sync Interval**: 5 minutes (configurable)
- **Batch Size**: 100 records per sync (configurable)
- **Timeout**: 30 seconds per API call
- **Retry Logic**: Built-in error handling
- **Graceful Degradation**: Works without Odoo connection

---

## 🤝 Contributing

To extend the integration:

1. **Add Custom Fields**: Modify `odooSyncService.js` data mapping
2. **New Endpoints**: Add to `syncController.js` and `syncRoutes.js`
3. **Custom Sync Logic**: Extend `OdooSyncService` class
4. **Webhooks**: Implement real-time sync (future enhancement)

---

**Version**: 1.0.0  
**Last Updated**: November 6, 2025  
**Status**: Production Ready ✅
