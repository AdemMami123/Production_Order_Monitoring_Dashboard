# Odoo Integration - Quick Start Checklist

Use this checklist to get your Odoo integration running in 10 minutes.

---

## ☑️ Prerequisites (2 minutes)

- [ ] Odoo 17.0+ installed and running at `http://localhost:8069`
- [ ] Dashboard backend code has all new files
- [ ] `node-cron` package installed (`npm install` should handle this)

---

## ☑️ Odoo Setup (3 minutes)

### 1. Install Manufacturing Module

- [ ] Login to Odoo as Administrator
- [ ] Navigate to **Apps** menu
- [ ] Search for "Manufacturing" or "MRP"
- [ ] Click **Install** (wait 1-2 minutes)

### 2. Generate API Key

- [ ] Go to user icon (top right) → **Preferences**
- [ ] Click **Account Security** tab
- [ ] Under **API Keys**, click **New API Key**
- [ ] Name it: `Dashboard Integration`
- [ ] **Copy the generated key** (save it somewhere safe)

### 3. Get Your Database Name

- [ ] Look at Odoo URL after login: `http://localhost:8069/web?db=YOUR_DB_NAME`
- [ ] Or check Odoo database manager: `http://localhost:8069/web/database/manager`

---

## ☑️ Dashboard Configuration (2 minutes)

### Update `.env` File

Edit `backend/.env` and add/update:

```bash
# Odoo Integration Configuration
ODOO_URL=http://localhost:8069
ODOO_DB=adem                              # ← Your database name
ODOO_USERNAME=ademmami92@gmail.com        # ← Your Odoo email
ODOO_API_KEY=3e518df28b9d1ec1fb7df7f8...  # ← Your API key

# Odoo Auto-Sync Configuration
ODOO_AUTO_SYNC=true
ODOO_SYNC_INTERVAL=*/5 * * * *
```

- [ ] `ODOO_URL` set correctly
- [ ] `ODOO_DB` matches your database
- [ ] `ODOO_USERNAME` is your Odoo user email
- [ ] `ODOO_API_KEY` is the generated key (full string)
- [ ] `ODOO_AUTO_SYNC` is `true`

---

## ☑️ Start Backend (1 minute)

```powershell
cd backend
npm install  # Install node-cron if needed
npm run dev
```

### Verify Startup

Check console for these messages:

- [ ] `[ODOO] Service initialized`
- [ ] `[ODOO SCHEDULER] Starting periodic sync...`
- [ ] `[ODOO SCHEDULER] Periodic sync job started successfully`
- [ ] `Server running on http://localhost:5000`

**If you see errors:**
- Connection refused → Check Odoo is running
- Auth failed → Double-check API key
- See troubleshooting section below

---

## ☑️ Test Connection (2 minutes)

### 1. Get Admin Token

```powershell
# Login as admin
curl -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@example.com","password":"admin123"}'
```

- [ ] Copy the `token` from response

### 2. Test Odoo Connection

```powershell
curl -X GET http://localhost:5000/api/odoo/test `
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected response:**
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

- [ ] Connection test passed ✅

### 3. Get Odoo Version

```powershell
curl -X GET http://localhost:5000/api/odoo/version `
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

- [ ] Version info returned ✅

---

## ☑️ Sync Initial Data (1 minute)

### Sync Products from Odoo

```powershell
curl -X POST http://localhost:5000/api/sync/products `
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected response:**
```json
{
  "success": true,
  "message": "Products synced successfully",
  "data": {
    "created": 5,
    "updated": 0,
    "total": 5
  }
}
```

- [ ] Products synced successfully

### Sync Users (Optional)

```powershell
curl -X POST http://localhost:5000/api/sync/users `
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

- [ ] Users synced (optional)

---

## ☑️ Test Order Creation (2 minutes)

### 1. Create Order in Dashboard

Use your dashboard UI or API:

```powershell
curl -X POST http://localhost:5000/api/orders `
  -H "Authorization: Bearer YOUR_TOKEN_HERE" `
  -H "Content-Type: application/json" `
  -d '{
    "order_number": "TEST-ODOO-001",
    "product_id": "YOUR_PRODUCT_ID",
    "quantity": 10,
    "priority": "high",
    "deadline": "2025-12-31T23:59:59Z"
  }'
```

### 2. Check Backend Logs

Look for:
```
[ORDER CONTROLLER] Order TEST-ODOO-001 synced to Odoo
[ODOO SYNC] Order created in Odoo with ID: 42
```

- [ ] Order creation logged ✅
- [ ] Odoo ID returned ✅

### 3. Verify in Odoo

1. Open Odoo: `http://localhost:8069`
2. Navigate: **Manufacturing** → **Operations** → **Manufacturing Orders**
3. Look for: `Dashboard-TEST-ODOO-001`

- [ ] Order visible in Odoo ✅

---

## ☑️ Verify Auto-Sync (Wait 5 minutes)

### Check Sync Status

```powershell
curl -X GET http://localhost:5000/api/sync/status `
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "sync": {
      "syncInProgress": false,
      "lastSyncTime": "2025-11-06T10:30:00.000Z",
      "errors": []
    },
    "scheduler": {
      "enabled": true,
      "interval": "*/5 * * * *",
      "running": true
    }
  }
}
```

- [ ] `scheduler.running` is `true`
- [ ] `lastSyncTime` is recent (within last 5 minutes)
- [ ] `errors` array is empty

### Watch Console Logs

After 5 minutes, you should see:

```
[ODOO SCHEDULER] Running scheduled sync...
[ODOO SYNC] Starting full bidirectional sync...
[ODOO SYNC] Products sync complete: 0 created, 5 updated
[ODOO SYNC] Users sync complete: 0 created, 2 updated
[ODOO SYNC] Orders sync complete: 0 created, 1 updated
[ODOO SYNC] Sync completed successfully
```

- [ ] Auto-sync running every 5 minutes ✅

---

## ✅ Success!

If all checkboxes are checked, your integration is working! 🎉

**You can now:**
- ✅ Create orders in dashboard → they appear in Odoo
- ✅ Update orders in dashboard → changes sync to Odoo
- ✅ Create orders in Odoo → they sync to dashboard
- ✅ Auto-sync runs every 5 minutes
- ✅ Products/Users fetched from Odoo in real-time

---

## 🐛 Troubleshooting

### Connection Refused Error

```
Error: connect ECONNREFUSED 127.0.0.1:8069
```

**Fix:**
- [ ] Verify Odoo is running: `http://localhost:8069`
- [ ] Check `ODOO_URL` in `.env` is correct
- [ ] Restart Odoo if needed

### Authentication Failed

```
[ODOO] Authentication failed: Invalid credentials
```

**Fix:**
- [ ] Regenerate API key in Odoo (Preferences → Account Security)
- [ ] Copy **entire** key (it's long, like 40 characters)
- [ ] Update `ODOO_API_KEY` in `.env`
- [ ] Restart backend: `npm run dev`

### No Products to Sync

```
{
  "data": {
    "created": 0,
    "updated": 0,
    "total": 0
  }
}
```

**Fix:**
- [ ] Create products in Odoo first:
  - Manufacturing → Products → Create
  - Add at least 1 product with name, SKU, type = "Storable"
- [ ] Run sync again

### Order Not Appearing in Odoo

**Fix:**
- [ ] Check backend logs for errors
- [ ] Ensure product has `odoo_id` (run product sync first)
- [ ] Verify Odoo user has Manufacturing permissions
- [ ] Check Odoo filters (remove "My Orders" filter)

### Auto-Sync Not Running

**Fix:**
- [ ] Check `ODOO_AUTO_SYNC=true` in `.env`
- [ ] Restart backend
- [ ] Verify scheduler started:
  ```
  [ODOO SCHEDULER] Periodic sync job started successfully
  ```
- [ ] Check sync status API

---

## 📚 Next Steps

### Explore Features

- [ ] Read: `docs/ODOO_DASHBOARD_SETUP.md` (complete Odoo configuration)
- [ ] Read: `docs/ODOO_TESTING_GUIDE.md` (advanced testing)
- [ ] Read: `docs/ODOO_INTEGRATION_README.md` (technical details)

### Create More Test Data

- [ ] Create multiple products in Odoo
- [ ] Create manufacturing orders in dashboard
- [ ] Update orders in both systems
- [ ] Monitor bidirectional sync

### Frontend Integration (Optional)

- [ ] Add "Sync with Odoo" button to UI
- [ ] Show sync status indicator
- [ ] Display last sync time
- [ ] Add manual sync trigger

---

## 📞 Need Help?

**Check Documentation:**
- Setup Guide: `docs/ODOO_DASHBOARD_SETUP.md`
- Testing Guide: `docs/ODOO_TESTING_GUIDE.md`
- Technical Docs: `docs/ODOO_INTEGRATION_README.md`

**Check Logs:**
- Backend console shows all sync activity
- Use `GET /api/sync/status` for error details
- MongoDB stores `odoo_id` for tracking

**Common Issues:**
- Most errors are authentication or connection related
- Ensure Odoo is accessible at the URL
- Verify API key is complete and correct
- Check database name matches exactly

---

**Estimated Time**: 10-15 minutes  
**Last Updated**: November 6, 2025  
**Status**: Ready to use ✅
