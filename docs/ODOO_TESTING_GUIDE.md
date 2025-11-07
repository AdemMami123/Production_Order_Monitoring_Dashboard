# Odoo Integration - Quick Testing Guide

Fast reference for testing the complete Odoo integration.

---

## 🚀 Quick Start

### 1. Start Backend

```powershell
cd backend
npm run dev
```

**Expected Output:**
```
[ODOO] Service initialized
[ODOO SCHEDULER] Starting periodic sync (interval: */5 * * * *)
[ODOO SCHEDULER] Periodic sync job started successfully
Server running on http://localhost:5000
```

### 2. Get Admin JWT Token

```powershell
# Login as admin
curl -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@example.com","password":"admin123"}'

# Response will contain token:
# "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Save the token** for subsequent requests.

---

## ✅ Test Connection

### Test Odoo Connection

```powershell
curl -X GET http://localhost:5000/api/odoo/test `
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Successfully connected to Odoo",
  "data": {
    "connected": true,
    "uid": 2
  }
}
```

### Get Odoo Version

```powershell
curl -X GET http://localhost:5000/api/odoo/version `
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📦 Test Product Sync

### Get Products from Odoo

```powershell
curl -X GET "http://localhost:5000/api/odoo/products?limit=10" `
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Sync Products to Dashboard

```powershell
curl -X POST http://localhost:5000/api/sync/products `
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Products synced successfully",
  "data": {
    "created": 5,
    "updated": 3,
    "total": 8
  }
}
```

---

## 📋 Test Order Sync

### Create Order in Dashboard

```powershell
curl -X POST http://localhost:5000/api/orders `
  -H "Authorization: Bearer YOUR_JWT_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{
    "order_number": "ORD-TEST-001",
    "product_id": "PRODUCT_ID_HERE",
    "quantity": 100,
    "priority": "high",
    "deadline": "2025-12-31T23:59:59Z",
    "notes": "Test order for Odoo sync"
  }'
```

**Check Backend Logs:**
```
[ORDER CONTROLLER] Order ORD-TEST-001 synced to Odoo
[ODOO SYNC] Order created in Odoo with ID: 42
```

### Update Order Status

```powershell
curl -X PATCH "http://localhost:5000/api/orders/ORDER_ID/status" `
  -H "Authorization: Bearer YOUR_JWT_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{
    "status": "in_progress",
    "notes": "Starting production"
  }'
```

**Check Backend Logs:**
```
[ORDER CONTROLLER] Order status updated in Odoo: ORD-TEST-001
```

### Pull Orders from Odoo

```powershell
curl -X POST http://localhost:5000/api/sync/orders `
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Orders synced successfully",
  "data": {
    "created": 2,
    "updated": 5,
    "skipped": 3,
    "total": 10
  }
}
```

---

## 🔄 Test Full Sync

### Trigger Full Bidirectional Sync

```powershell
curl -X POST http://localhost:5000/api/sync/full `
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Full sync completed successfully",
  "data": {
    "success": true,
    "timestamp": "2025-11-06T10:30:00.000Z",
    "duration": "12.5s",
    "products": {
      "created": 0,
      "updated": 15,
      "total": 15
    },
    "users": {
      "created": 0,
      "updated": 5,
      "total": 5
    },
    "orders": {
      "created": 2,
      "updated": 8,
      "skipped": 10,
      "total": 20
    },
    "pushedOrders": 3,
    "errors": 0
  }
}
```

---

## 📊 Check Sync Status

```powershell
curl -X GET http://localhost:5000/api/sync/status `
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
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

## ⏱️ Test Scheduler

### Stop Auto-Sync

```powershell
curl -X POST http://localhost:5000/api/sync/scheduler/stop `
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Start Auto-Sync

```powershell
curl -X POST http://localhost:5000/api/sync/scheduler/start `
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🔍 Verify in Odoo

### 1. View Manufacturing Orders

1. Open Odoo: `http://localhost:8069`
2. Login with your credentials
3. Navigate to: **Manufacturing** → **Operations** → **Manufacturing Orders**
4. Look for orders with origin: `Dashboard-ORD-TEST-001`

### 2. Check Product Sync

1. Navigate to: **Manufacturing** → **Products** → **Products**
2. Filter by: **Internal Reference** (your SKU)
3. Verify products have correct details

### 3. View Order Details

1. Click on any manufacturing order
2. Verify fields:
   - Product
   - Quantity
   - Deadline
   - Responsible (if user synced)
   - Status/State

---

## 🐛 Troubleshooting

### Check Backend Logs

Monitor logs for sync activity:

```powershell
# Backend console shows:
[ODOO SYNC] Starting full bidirectional sync...
[ODOO SYNC] Products sync complete: 0 created, 15 updated
[ODOO SYNC] Users sync complete: 0 created, 5 updated
[ODOO SYNC] Orders sync complete: 2 created, 8 updated
[ODOO SYNC] Sync completed successfully
```

### Common Issues

#### Connection Failed
```
Error: connect ECONNREFUSED 127.0.0.1:8069
```
**Solution:** Ensure Odoo is running at `http://localhost:8069`

#### Authentication Failed
```
[ODOO] Authentication failed: Invalid credentials
```
**Solution:** 
1. Verify API key in Odoo user preferences
2. Update `ODOO_API_KEY` in `.env`
3. Restart backend

#### Product Not Found
```
[ODOO SYNC] Product has no Odoo ID. Skipping sync.
```
**Solution:** Run product sync first:
```powershell
curl -X POST http://localhost:5000/api/sync/products `
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📝 Test Scenarios

### Scenario 1: Dashboard → Odoo

1. Create order in dashboard
2. Check backend logs for sync confirmation
3. Verify order appears in Odoo Manufacturing
4. Update order status in dashboard
5. Verify status updates in Odoo

### Scenario 2: Odoo → Dashboard

1. Create manufacturing order in Odoo
2. Wait 5 minutes for auto-sync (or trigger manual sync)
3. Check dashboard for new order
4. Update order in Odoo
5. Sync again and verify updates in dashboard

### Scenario 3: Bidirectional Updates

1. Create order in dashboard
2. Edit in Odoo (change deadline)
3. Sync to dashboard
4. Edit in dashboard (change status)
5. Sync to Odoo
6. Verify both systems have latest data

---

## 🎯 Success Criteria

✅ Backend starts without errors  
✅ Odoo connection test passes  
✅ Products sync bidirectionally  
✅ Orders created in dashboard appear in Odoo  
✅ Order updates sync automatically  
✅ Odoo orders pull into dashboard  
✅ Auto-sync runs every 5 minutes  
✅ No sync errors in status endpoint  

---

## 📚 Additional Resources

- **Full Setup Guide**: `docs/ODOO_DASHBOARD_SETUP.md`
- **Integration Guide**: `docs/ODOO_INTEGRATION_GUIDE.md`
- **Python Client**: `python_client/README.md`
- **API Documentation**: See Postman collection

---

**Quick Reference Version**: 1.0  
**Last Updated**: November 6, 2025
