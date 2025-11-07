# Odoo Dashboard Setup Guide

Complete step-by-step guide to configure Odoo ERP to display and manage data from your Production Orders Monitoring Dashboard.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step 1: Install Required Odoo Modules](#step-1-install-required-odoo-modules)
4. [Step 2: Configure Odoo User & API Access](#step-2-configure-odoo-user--api-access)
5. [Step 3: Create Product Categories](#step-3-create-product-categories)
6. [Step 4: Set Up Products](#step-4-set-up-products)
7. [Step 5: Configure Manufacturing Module](#step-5-configure-manufacturing-module)
8. [Step 6: Create Manufacturing Orders](#step-6-create-manufacturing-orders)
9. [Step 7: Sync Dashboard Data with Odoo](#step-7-sync-dashboard-data-with-odoo)
10. [Step 8: View Synced Data in Odoo](#step-8-view-synced-data-in-odoo)
11. [Step 9: Bidirectional Updates](#step-9-bidirectional-updates)
12. [Troubleshooting](#troubleshooting)
13. [Advanced Configuration](#advanced-configuration)

---

## Overview

This guide will help you:
- ✅ Configure Odoo ERP to receive production orders from your dashboard
- ✅ Set up bidirectional synchronization
- ✅ View dashboard data in Odoo's Manufacturing module
- ✅ Enable real-time updates between both systems

**Sync Architecture:**
```
Dashboard (MongoDB) ←→ Node.js Backend ←→ Odoo API (PostgreSQL)
         ↓                    ↓                    ↓
   Local Orders        JSON-RPC Client      mrp.production
   Local Products      Auto-Sync (5min)     product.product
   Local Users         Manual Sync          res.users
```

---

## Prerequisites

Before starting, ensure you have:

- [x] Odoo 17.0+ installed and running
- [x] Access to Odoo as Administrator
- [x] Dashboard backend running (`npm run dev`)
- [x] `.env` file configured with Odoo credentials
- [x] Network connectivity between dashboard and Odoo

---

## Step 1: Install Required Odoo Modules

### 1.1 Access Odoo Apps

1. Login to Odoo as **Administrator**
2. Navigate to **Apps** (main menu, top left)
3. Remove the "Apps" filter to see all modules

### 1.2 Install Manufacturing Module

1. Search for: **"Manufacturing"** or **"MRP"**
2. Click **Install** on the **Manufacturing** module
3. Wait for installation to complete (may take 1-2 minutes)
4. Odoo will reload automatically

### 1.3 Install Inventory Module (if not already installed)

1. Search for: **"Inventory"**
2. Click **Install** on the **Inventory** module
3. This is required for stock management

### 1.4 Verify Installation

Navigate to **Manufacturing** from the main menu. You should see:
- Manufacturing Orders
- Products
- Bills of Materials
- Work Centers

---

## Step 2: Configure Odoo User & API Access

### 2.1 Create Dedicated API User (Recommended)

1. Navigate to **Settings** → **Users & Companies** → **Users**
2. Click **Create**
3. Fill in user details:
   - **Name**: `Dashboard API User`
   - **Email**: `ademmami92@gmail.com` (or your email)
   - **Access Rights**:
     - Check **Manufacturing / User**
     - Check **Inventory / User**
     - Check **Sales / User** (optional)
4. Click **Save**

### 2.2 Generate API Key

1. Go to user's **Preferences** (user icon → Preferences)
2. Navigate to **Account Security** tab
3. Under **API Keys**, click **New API Key**
4. Give it a name: `Dashboard Integration`
5. Copy the generated key (e.g., `3e518df28b9d1ec1fb7df7f8052aa44206b5bac9`)
6. ⚠️ **Save this key securely** - it won't be shown again

### 2.3 Update Dashboard Configuration

Update your `backend/.env`:

```bash
ODOO_URL=http://localhost:8069
ODOO_DB=adem
ODOO_USERNAME=ademmami92@gmail.com
ODOO_API_KEY=3e518df28b9d1ec1fb7df7f8052aa44206b5bac9
```

### 2.4 Test Connection

```bash
# From backend directory
npm run dev

# The console should show:
# [ODOO] Service initialized
# [ODOO SCHEDULER] Starting periodic sync...
```

Or test via API:

```bash
# Get JWT token first (login as admin)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Test Odoo connection
curl -X GET http://localhost:5000/api/odoo/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Step 3: Create Product Categories

### 3.1 Navigate to Product Categories

1. Go to **Manufacturing** → **Configuration** → **Product Categories**
2. Or go to **Inventory** → **Configuration** → **Product Categories**

### 3.2 Create Categories

Create the following categories (or customize as needed):

| Category Name | Parent Category | Route | Description |
|--------------|----------------|-------|-------------|
| Manufacturing | None | Manufacture | Products to be manufactured |
| Raw Materials | None | Buy | Materials for production |
| Finished Goods | Manufacturing | Manufacture | Completed products |
| Components | Manufacturing | Manufacture | Sub-assemblies |

**Steps to create:**
1. Click **Create**
2. Enter **Category Name**
3. Select **Parent Category** (if applicable)
4. Under **Logistics** tab:
   - Check **Manufacture** route for manufactured items
   - Check **Buy** route for purchased items
5. Click **Save**

---

## Step 4: Set Up Products

### 4.1 Create Products from Dashboard

Products can be created in two ways:

#### Option A: Create in Dashboard (Recommended)

1. Login to your dashboard frontend
2. Navigate to **Products** page
3. Click **Add Product**
4. Fill in product details:
   - Name: `Widget Pro 2000`
   - SKU: `WGT-2000`
   - Description: `High-quality widget`
   - Category: `Manufacturing`
   - Unit Price: `100.00`
   - Stock Quantity: `50`
5. Click **Save**

#### Option B: Create Directly in Odoo

1. Navigate to **Manufacturing** → **Products** → **Products**
2. Click **Create**
3. Fill in:
   - **Product Name**: `Widget Pro 2000`
   - **Internal Reference**: `WGT-2000`
   - **Product Type**: `Storable Product`
   - **Category**: `Finished Goods`
   - **Sales Price**: `100.00`
   - **Cost**: `60.00`
4. Under **Inventory** tab:
   - Set **Route**: `Manufacture`
5. Click **Save**

### 4.2 Sync Products to Dashboard

If you created products in Odoo, sync them to dashboard:

```bash
# Via API (as admin)
curl -X POST http://localhost:5000/api/sync/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Or wait for automatic sync (every 5 minutes).

### 4.3 Verify Product Sync

Check that products have `odoo_id`:

```bash
# In MongoDB (using MongoDB Compass or shell)
db.products.find({}, { name: 1, odoo_id: 1 })
```

---

## Step 5: Configure Manufacturing Module

### 5.1 Set Up Work Centers (Optional)

1. Navigate to **Manufacturing** → **Configuration** → **Work Centers**
2. Click **Create**
3. Configure work center:
   - **Name**: `Assembly Line 1`
   - **Working Hours**: Set your working schedule
   - **Capacity**: `1` (or number of parallel operations)
4. Click **Save**

### 5.2 Create Bills of Materials (Optional)

For products that require specific materials:

1. Navigate to **Manufacturing** → **Products** → **Bills of Materials**
2. Click **Create**
3. Fill in:
   - **Product**: Select your product (e.g., `Widget Pro 2000`)
   - **BoM Type**: `Manufacture this product`
   - **Quantity**: `1`
4. Under **Components** tab:
   - Click **Add a line**
   - Select component products
   - Set quantities
5. Click **Save**

### 5.3 Configure Manufacturing Settings

1. Navigate to **Manufacturing** → **Configuration** → **Settings**
2. Enable options:
   - ✅ **Work Orders** (for detailed tracking)
   - ✅ **By-Products** (if applicable)
   - ✅ **Maintenance** (optional)
3. Click **Save**

---

## Step 6: Create Manufacturing Orders

### 6.1 Create Order in Dashboard

1. Login to dashboard frontend
2. Navigate to **Orders** page
3. Click **Create Order**
4. Fill in:
   - **Product**: Select `Widget Pro 2000`
   - **Quantity**: `100`
   - **Priority**: `High`
   - **Deadline**: `2025-12-31`
   - **Assigned To**: Select a user
   - **Notes**: `Urgent customer order`
5. Click **Create**

**What happens:**
- Order is created in MongoDB
- Backend automatically calls Odoo API
- Manufacturing order is created in Odoo (`mrp.production`)
- `odoo_id` is stored in dashboard order

### 6.2 Verify in Odoo

1. Navigate to **Manufacturing** → **Operations** → **Manufacturing Orders**
2. You should see your order:
   - **Reference**: `Dashboard-ORD-xxxxx`
   - **Product**: `Widget Pro 2000`
   - **Quantity**: `100`
   - **Deadline**: `2025-12-31`
   - **Status**: `Draft` (Odoo state for "pending")

---

## Step 7: Sync Dashboard Data with Odoo

### 7.1 Automatic Sync

The backend automatically syncs every 5 minutes:

```
[ODOO SCHEDULER] Running scheduled sync...
[ODOO SYNC] Starting full bidirectional sync...
[ODOO SYNC] Products sync complete: 0 created, 15 updated
[ODOO SYNC] Users sync complete: 0 created, 5 updated
[ODOO SYNC] Orders sync complete: 2 created, 8 updated
[ODOO SYNC] Sync completed successfully
```

### 7.2 Manual Sync

Trigger sync manually via API:

```bash
# Full sync (all data)
curl -X POST http://localhost:5000/api/sync/full \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Sync only products
curl -X POST http://localhost:5000/api/sync/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Sync only orders
curl -X POST http://localhost:5000/api/sync/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Sync only users
curl -X POST http://localhost:5000/api/sync/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 7.3 Check Sync Status

```bash
curl -X GET http://localhost:5000/api/sync/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:
```json
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
      "running": true,
      "lastSync": "2025-11-06T10:30:00.000Z",
      "syncInProgress": false
    }
  }
}
```

---

## Step 8: View Synced Data in Odoo

### 8.1 View Manufacturing Orders

1. Navigate to **Manufacturing** → **Operations** → **Manufacturing Orders**
2. All dashboard orders are visible with:
   - **Reference**: Shows origin (e.g., `Dashboard-ORD-123`)
   - **Product**: Linked product
   - **Status**: Synced state (`draft`, `progress`, `done`, etc.)
   - **Responsible**: Assigned user (if synced)
   - **Deadline**: Target completion date

### 8.2 Filter Orders

Use Odoo's built-in filters:
- **My Manufacturing Orders**: Orders assigned to you
- **To Do**: Orders in `confirmed` or `progress` state
- **Late Orders**: Past deadline
- **Done**: Completed orders

### 8.3 View Products

1. Navigate to **Manufacturing** → **Products** → **Products**
2. Synced products show:
   - **Name**: Product name
   - **Internal Reference**: SKU from dashboard
   - **On Hand**: Stock quantity
   - **Category**: Product category

### 8.4 Kanban View

Switch to **Kanban** view for visual management:
1. Click the **Kanban** icon (top right)
2. Drag and drop orders between status columns
3. Status changes sync back to dashboard automatically

---

## Step 9: Bidirectional Updates

### 9.1 Dashboard → Odoo

**When you update an order in the dashboard:**

1. Edit order in dashboard (change status, deadline, etc.)
2. Click **Save**
3. Backend calls Odoo API automatically
4. Odoo order is updated immediately

**Synced fields:**
- Status → State mapping
- Deadline → `date_deadline`
- Start Date → `date_planned_start`
- Priority → `priority`
- Assigned User → `user_id`

### 9.2 Odoo → Dashboard

**When you update an order in Odoo:**

1. Edit manufacturing order in Odoo
2. Change status, deadline, or other fields
3. Click **Save**
4. Changes are pulled to dashboard on next sync (max 5 minutes)

**Automatic sync pulls:**
- New orders created in Odoo
- Status changes in Odoo
- Updated deadlines
- User assignments
- Product changes

### 9.3 Status Mapping

| Dashboard Status | Odoo State | Description |
|-----------------|------------|-------------|
| `pending` | `draft` | Order created, not started |
| `on_hold` | `confirmed` | Order confirmed, waiting |
| `in_progress` | `progress` | Currently manufacturing |
| `completed` | `done` | Manufacturing complete |
| `cancelled` | `cancel` | Order cancelled |

### 9.4 Conflict Resolution

If both systems are updated simultaneously:
- **Last write wins**: Odoo's `write_date` is compared with dashboard `updated_at`
- **Odoo takes precedence**: If Odoo was modified more recently
- **Manual sync**: Can force overwrite from either direction

---

## Step 10: Dashboard Integration Features

### 10.1 Real-Time Product Dropdown

When creating an order in the dashboard, products are fetched from Odoo:

```javascript
// Frontend fetches products from Odoo
GET /api/odoo/products

// Returns real-time Odoo data:
{
  "success": true,
  "data": [
    {
      "id": 45,
      "name": "Widget Pro 2000",
      "default_code": "WGT-2000",
      "qty_available": 50,
      "list_price": 100.00
    }
  ]
}
```

### 10.2 Real-Time User Dropdown

Assigned users are fetched from Odoo:

```javascript
GET /api/odoo/users

// Returns Odoo users:
{
  "success": true,
  "data": [
    {
      "id": 2,
      "name": "John Doe",
      "email": "john@company.com",
      "login": "john.doe"
    }
  ]
}
```

### 10.3 Sync Indicators

Dashboard shows sync status for each order:
- ✅ **Synced**: Green checkmark, `odoo_id` present
- ⏳ **Pending Sync**: Yellow indicator, waiting for next sync
- ❌ **Sync Failed**: Red indicator, check logs

---

## Troubleshooting

### Issue 1: Connection Failed

**Symptom:**
```
[ODOO SYNC] Error pulling orders from Odoo: connect ECONNREFUSED
```

**Solution:**
1. Verify Odoo is running: `http://localhost:8069`
2. Check `ODOO_URL` in `.env`
3. Test network connectivity
4. Ensure Odoo accepts external API calls

### Issue 2: Authentication Failed

**Symptom:**
```
[ODOO] Authentication failed: Invalid credentials
```

**Solution:**
1. Verify `ODOO_USERNAME` matches Odoo user email
2. Regenerate API key in Odoo user preferences
3. Update `ODOO_API_KEY` in `.env`
4. Restart backend: `npm run dev`

### Issue 3: Product Not Found

**Symptom:**
```
[ODOO SYNC] Product has no Odoo ID. Skipping sync.
```

**Solution:**
1. Run product sync: `POST /api/sync/products`
2. Verify products exist in Odoo
3. Check `odoo_id` field in MongoDB:
   ```javascript
   db.products.find({ odoo_id: { $exists: false } })
   ```
4. Manually link products if needed

### Issue 4: Orders Not Appearing in Odoo

**Symptom:** Order created in dashboard but not visible in Odoo

**Solution:**
1. Check backend logs for sync errors
2. Verify product has `odoo_id`
3. Check user has `odoo_id` (if assigned)
4. Trigger manual sync: `POST /api/sync/full`
5. Check Odoo filters (remove "My Orders" filter)

### Issue 5: Sync Errors

**Symptom:**
```
[ODOO SYNC] Errors: 3
```

**Solution:**
1. Check sync status: `GET /api/sync/status`
2. Review error details in response
3. Common errors:
   - Missing product in Odoo → Sync products first
   - Missing user → Sync users or leave unassigned
   - Invalid field values → Check data types
4. Check Odoo logs: `Settings` → `Technical` → `Logging`

### Issue 6: Slow Sync Performance

**Symptom:** Sync takes >30 seconds

**Solution:**
1. Reduce sync batch size in `odooSyncService.js`:
   ```javascript
   pullOrdersFromOdoo(limit = 50) // Reduce from 100
   ```
2. Increase sync interval to 10 minutes:
   ```bash
   ODOO_SYNC_INTERVAL=*/10 * * * *
   ```
3. Disable auto-sync temporarily:
   ```bash
   ODOO_AUTO_SYNC=false
   ```
4. Use manual sync for large datasets

---

## Advanced Configuration

### Enable Webhooks (Future Enhancement)

For real-time sync instead of polling:

1. **Install Odoo Webhook Module** (custom module required)
2. **Configure Webhook URL**: Point to dashboard API
3. **Set Triggers**: On `mrp.production` create/update
4. **Handle Incoming Webhooks**: Create endpoint in dashboard

### Custom Field Mapping

Modify `odooSyncService.js` to sync additional fields:

```javascript
// Add custom fields to sync
const odooOrderData = {
  product_id: product.odoo_id,
  product_qty: order.quantity,
  // Add custom fields:
  x_custom_field: order.custom_field,
  x_reference: order.reference_number,
};
```

### Multi-Company Setup

For Odoo multi-company environments:

1. Add company filter to sync:
   ```javascript
   const domain = [['company_id', '=', COMPANY_ID]];
   ```
2. Configure `ODOO_COMPANY_ID` in `.env`
3. Filter products/orders by company

### Performance Optimization

1. **Index Optimization**: Ensure `odoo_id` is indexed in MongoDB
2. **Batch Updates**: Sync in smaller batches
3. **Selective Sync**: Only sync recent orders (e.g., last 30 days)
4. **Caching**: Cache product/user data in Redis

---

## Summary Checklist

✅ Odoo Manufacturing module installed  
✅ API user created with proper permissions  
✅ API key generated and added to `.env`  
✅ Product categories configured  
✅ Products created and synced  
✅ Manufacturing orders created in dashboard  
✅ Orders visible in Odoo Manufacturing module  
✅ Auto-sync running (every 5 minutes)  
✅ Bidirectional updates working  
✅ Sync status monitored  

---

## Next Steps

1. **Customize Odoo Views**: Modify Manufacturing Order views to show dashboard-specific fields
2. **Create Dashboards**: Use Odoo's reporting tools to analyze production data
3. **Set Up Notifications**: Configure Odoo to send email alerts on order status changes
4. **Integrate Quality Control**: Use Odoo Quality module for inspection checkpoints
5. **Advanced Reporting**: Create custom Odoo reports combining dashboard and ERP data

---

## Support & Resources

- **Odoo Documentation**: https://www.odoo.com/documentation/17.0/
- **Odoo API Reference**: https://www.odoo.com/documentation/17.0/developer/reference/external_api.html
- **Dashboard API Docs**: See `docs/ODOO_INTEGRATION_GUIDE.md`
- **Odoo Community**: https://www.odoo.com/forum

---

**Document Version**: 1.0  
**Last Updated**: November 6, 2025  
**Author**: Production Dashboard Team
