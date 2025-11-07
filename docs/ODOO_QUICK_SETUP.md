# Odoo Integration - Quick Setup

## 🚀 Quick Start (5 Minutes)

### Step 1: Update Environment Variables

Open `backend/.env` and update these values with YOUR Odoo details:

```bash
# Replace these with your actual Odoo instance details
ODOO_URL=https://your-instance.odoo.com
ODOO_DB=your-database-name
ODOO_USERNAME=your-api-user@email.com
ODOO_API_KEY=3e518df28b9d1ec1fb7df7f8052aa44206b5bac9  # Your API key is already here!
```

**Where to find these values:**

1. **ODOO_URL**: Your Odoo login page URL (e.g., `https://mycompany.odoo.com`)
2. **ODOO_DB**: Usually your company name or visible in Odoo URL after login
3. **ODOO_USERNAME**: The email of your API user in Odoo
4. **ODOO_API_KEY**: Already provided (3e518df28b9d1ec1fb7df7f8052aa44206b5bac9)

### Step 2: Restart Backend Server

```bash
cd backend
npm run dev
```

You should see:
```
[ODOO] Service initialized
🚀 Production Orders Dashboard API
```

### Step 3: Test the Connection

**Open Postman or your browser and test:**

```http
GET http://localhost:5000/api/odoo/test
Authorization: Bearer <your-jwt-token>
```

Or use curl:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:5000/api/odoo/test
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

---

## ✅ What's Been Set Up

### Backend Files Created:
1. ✅ `backend/src/services/odooService.js` - Core Odoo integration
2. ✅ `backend/src/controllers/odooController.js` - API endpoints
3. ✅ `backend/src/routes/odooRoutes.js` - Express routes
4. ✅ `backend/.env` - Environment variables (with your API key)
5. ✅ `backend/.env.example` - Template file

### Backend Files Modified:
1. ✅ `backend/src/server.js` - Added Odoo routes

### Available Endpoints:
- `GET /api/odoo/test` - Test connection
- `GET /api/odoo/version` - Get Odoo version
- `GET /api/odoo/products` - Get all products
- `GET /api/odoo/products/:id` - Get single product
- `GET /api/odoo/manufacturing-orders` - Get all MOs
- `GET /api/odoo/manufacturing-orders/:id` - Get single MO
- `POST /api/odoo/manufacturing-orders` - Create MO
- `PUT /api/odoo/manufacturing-orders/:id` - Update MO
- `GET /api/odoo/partners` - Get customers
- `GET /api/odoo/stock` - Get inventory

---

## 🔐 Security Features

✅ **API Key Authentication** - No plain passwords  
✅ **Environment Variables** - Credentials never hardcoded  
✅ **HTTPS Only** - Secure communication  
✅ **Dedicated API User** - Not using admin account  
✅ **JWT Protected** - All endpoints require authentication  
✅ **Role-Based Access** - Only Admins/Managers can access  
✅ **Error Handling** - Comprehensive error messages  
✅ **Request Logging** - All API calls logged for debugging  

---

## 📝 Common Tasks

### Get Products from Odoo
```javascript
const response = await api.get('/odoo/products?limit=50');
console.log(response.data.data); // Array of products
```

### Create Manufacturing Order
```javascript
const mo = await api.post('/odoo/manufacturing-orders', {
  product_id: 45,
  product_qty: 100,
  date_deadline: '2025-11-15 17:00:00',
  origin: 'Dashboard Order #123'
});
```

### Check Inventory
```javascript
const stock = await api.get('/odoo/stock?product_id=45');
console.log(stock.data.data); // Stock levels
```

---

## 🐛 Troubleshooting

### "Missing required environment variables"
**Fix**: Update all 4 variables in `backend/.env`:
- ODOO_URL
- ODOO_DB  
- ODOO_USERNAME
- ODOO_API_KEY

### "Authentication failed"
**Fix**: 
1. Verify ODOO_USERNAME matches your Odoo user email
2. Check ODOO_DB is correct (your database name)
3. Ensure API key is still valid in Odoo
4. Make sure the API user has proper permissions

### "No response from Odoo server"
**Fix**:
1. Verify ODOO_URL is correct (should start with https://)
2. Check your internet connection
3. Verify Odoo server is running

### "ODOO_URL is not using HTTPS"
**Fix**: Change `http://` to `https://` in ODOO_URL

---

## 📚 Full Documentation

For detailed information, see:
- `docs/ODOO_INTEGRATION_GUIDE.md` - Complete integration guide
- API endpoint details, code examples, best practices

---

## 🎯 Next Steps

1. ✅ Update `.env` with your Odoo details
2. ✅ Restart backend server
3. ✅ Test connection endpoint
4. ⏳ Implement frontend integration
5. ⏳ Setup automatic syncing
6. ⏳ Add Odoo sync buttons to UI

---

**Need Help?**
- Check server logs for `[ODOO]` prefix messages
- All requests and errors are logged
- Review `docs/ODOO_INTEGRATION_GUIDE.md` for detailed troubleshooting

---

**Status**: ✅ Backend Ready  
**Your API Key**: Already configured!  
**Next**: Update ODOO_URL, ODOO_DB, and ODOO_USERNAME in `.env`
