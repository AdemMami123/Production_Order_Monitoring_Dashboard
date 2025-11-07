# Odoo Integration Guide

## Overview
This guide explains how to integrate your Production Orders Monitoring Dashboard with Odoo ERP using secure JSON-RPC authentication with API keys.

---

## Security Features ✅

1. **✅ Dedicated API User** - Uses a specific Odoo user (not admin)
2. **✅ API Key Authentication** - API key stored securely in environment variables
3. **✅ HTTPS Communication** - All requests use HTTPS endpoints
4. **✅ Environment Variables** - Never hardcoded credentials
5. **✅ Comprehensive Error Handling** - Detailed error messages and logging
6. **✅ JSON-RPC Protocol** - Modern, efficient communication

---

## Setup Instructions

### Step 1: Create Odoo API User

1. **Login to Odoo** as administrator
2. **Navigate to**: Settings → Users & Companies → Users
3. **Create New User**:
   - Name: `API Integration User`
   - Email: `api@yourcompany.com`
   - Access Rights: Grant necessary permissions (Manufacturing, Inventory, Sales)
   - ⚠️ **DO NOT** use the admin account

4. **Generate API Key**:
   - Click on the user
   - Go to "Account Security" tab
   - Click "New API Key"
   - Give it a name: `Production Dashboard`
   - **Copy the API key** (you won't see it again!)

### Step 2: Configure Environment Variables

**Edit `backend/.env`**:
```bash
# Odoo Integration Configuration
ODOO_URL=https://your-instance.odoo.com
ODOO_DB=your-database-name
ODOO_USERNAME=api@yourcompany.com
ODOO_API_KEY=your_api_key_here
```

**Important Notes**:
- Replace `your-instance.odoo.com` with your actual Odoo URL
- Replace `your-database-name` with your Odoo database name
- Replace `api@yourcompany.com` with your API user's email
- Replace `your_api_key_here` with the API key you copied
- **NEVER** commit the `.env` file to Git!

### Step 3: Install Dependencies

If not already installed, add axios:
```bash
cd backend
npm install axios
```

### Step 4: Restart Backend Server

```bash
cd backend
npm run dev
```

You should see:
```
[ODOO] Service initialized
```

---

## API Endpoints

### Authentication & Testing

#### Test Connection
```http
GET /api/odoo/test
Authorization: Bearer <your_jwt_token>
```

**Response**:
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

#### Get Odoo Version
```http
GET /api/odoo/version
Authorization: Bearer <your_jwt_token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "server_version": "16.0",
    "server_version_info": [16, 0, 0, "final", 0],
    "server_serie": "16.0",
    "protocol_version": 1
  }
}
```

---

### Products

#### Get All Products
```http
GET /api/odoo/products?limit=100&offset=0
Authorization: Bearer <your_jwt_token>
```

**Response**:
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "id": 5,
      "name": "Product Name",
      "default_code": "PROD-001",
      "barcode": "1234567890",
      "list_price": 100.00,
      "standard_price": 75.00,
      "type": "product",
      "categ_id": [1, "All / Products"],
      "uom_id": [1, "Unit(s)"],
      "qty_available": 50,
      "virtual_available": 45,
      "description": "Product description",
      "active": true
    }
  ]
}
```

#### Get Single Product
```http
GET /api/odoo/products/:id
Authorization: Bearer <your_jwt_token>
```

---

### Manufacturing Orders

#### Get All Manufacturing Orders
```http
GET /api/odoo/manufacturing-orders?limit=100&offset=0&state=confirmed
Authorization: Bearer <your_jwt_token>
```

**Query Parameters**:
- `limit` - Number of records (default: 100)
- `offset` - Skip records (default: 0)
- `state` - Filter by state: `draft`, `confirmed`, `progress`, `to_close`, `done`, `cancel`

**Response**:
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": 12,
      "name": "MO/00012",
      "product_id": [45, "Product Name"],
      "product_qty": 100.0,
      "product_uom_id": [1, "Unit(s)"],
      "state": "confirmed",
      "date_planned_start": "2025-11-10 08:00:00",
      "date_deadline": "2025-11-15 17:00:00",
      "priority": "1",
      "user_id": [2, "John Doe"],
      "company_id": [1, "My Company"],
      "origin": "SO/00123",
      "qty_produced": 0.0,
      "qty_producing": 0.0
    }
  ]
}
```

#### Get Single Manufacturing Order
```http
GET /api/odoo/manufacturing-orders/:id
Authorization: Bearer <your_jwt_token>
```

#### Create Manufacturing Order
```http
POST /api/odoo/manufacturing-orders
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "product_id": 45,
  "product_qty": 100,
  "date_planned_start": "2025-11-10 08:00:00",
  "date_deadline": "2025-11-15 17:00:00",
  "origin": "Dashboard Order #123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Manufacturing order created successfully in Odoo",
  "data": {
    "id": 13,
    "name": "MO/00013",
    ...
  }
}
```

#### Update Manufacturing Order
```http
PUT /api/odoo/manufacturing-orders/:id
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "state": "progress",
  "qty_producing": 50,
  "date_deadline": "2025-11-20 17:00:00"
}
```

---

### Partners/Customers

#### Get All Partners
```http
GET /api/odoo/partners?limit=100&offset=0&is_company=true
Authorization: Bearer <your_jwt_token>
```

**Response**:
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": 8,
      "name": "Company Name",
      "email": "contact@company.com",
      "phone": "+1234567890",
      "mobile": false,
      "street": "123 Main St",
      "city": "New York",
      "zip": "10001",
      "country_id": [233, "United States"],
      "is_company": true,
      "vat": "US123456789",
      "ref": "CUST-001"
    }
  ]
}
```

---

### Stock/Inventory

#### Get Stock Levels
```http
GET /api/odoo/stock?product_id=45&location_id=8
Authorization: Bearer <your_jwt_token>
```

**Response**:
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": 123,
      "product_id": [45, "Product Name"],
      "location_id": [8, "WH/Stock"],
      "quantity": 50.0,
      "reserved_quantity": 5.0,
      "available_quantity": 45.0,
      "lot_id": false,
      "package_id": false
    }
  ]
}
```

---

## Code Structure

### Files Created/Modified

1. **`backend/.env`** - Environment variables (API credentials)
2. **`backend/.env.example`** - Template with documentation
3. **`backend/src/services/odooService.js`** - Core Odoo integration service
4. **`backend/src/controllers/odooController.js`** - API controllers
5. **`backend/src/routes/odooRoutes.js`** - Express routes
6. **`backend/src/server.js`** - Updated to include Odoo routes

### Service Layer (`odooService.js`)

**Key Methods**:
- `authenticate()` - Authenticate with Odoo using API key
- `execute()` - Execute methods on Odoo models
- `search()` - Search for records
- `read()` - Read specific records
- `searchRead()` - Combined search and read
- `create()` - Create new records
- `write()` - Update existing records
- `unlink()` - Delete records
- `testConnection()` - Test Odoo connectivity

**Security Features**:
- Environment variable validation
- HTTPS enforcement warning
- API key length validation
- Comprehensive error messages
- Request/response logging

---

## Usage Examples

### Example 1: Sync Products from Odoo

```javascript
// In your frontend
const response = await api.get('/odoo/products?limit=50');
const odooProducts = response.data.data;

// Map to your local products
odooProducts.forEach(async (odooProduct) => {
  await api.post('/products', {
    name: odooProduct.name,
    reference: odooProduct.default_code,
    unit: odooProduct.uom_id[1],
    description: odooProduct.description,
    odoo_id: odooProduct.id, // Store Odoo ID for sync
  });
});
```

### Example 2: Create Manufacturing Order in Odoo

```javascript
// When creating an order in your dashboard
const localOrder = await api.post('/orders', {
  order_number: 'ORD-001',
  product_id: productId,
  quantity: 100,
  deadline: '2025-11-15',
});

// Also create in Odoo
const odooOrder = await api.post('/odoo/manufacturing-orders', {
  product_id: product.odoo_id, // Use Odoo product ID
  product_qty: 100,
  date_deadline: '2025-11-15 17:00:00',
  origin: `Dashboard Order ${localOrder.data.order_number}`,
});

// Update local order with Odoo MO reference
await api.patch(`/orders/${localOrder.data._id}`, {
  odoo_mo_id: odooOrder.data.id,
  odoo_mo_name: odooOrder.data.name,
});
```

### Example 3: Sync Order Status from Odoo

```javascript
// Periodic sync (every 5 minutes)
setInterval(async () => {
  // Get orders with Odoo references
  const localOrders = await api.get('/orders?has_odoo_mo=true');
  
  for (const order of localOrders.data) {
    // Get current status from Odoo
    const odooOrder = await api.get(`/odoo/manufacturing-orders/${order.odoo_mo_id}`);
    
    // Map Odoo state to your status
    const statusMap = {
      'draft': 'pending',
      'confirmed': 'pending',
      'progress': 'in_progress',
      'to_close': 'in_progress',
      'done': 'completed',
      'cancel': 'cancelled',
    };
    
    const newStatus = statusMap[odooOrder.data.state];
    
    // Update if changed
    if (order.status !== newStatus) {
      await api.patch(`/orders/${order._id}`, {
        status: newStatus,
        qty_produced: odooOrder.data.qty_produced,
      });
    }
  }
}, 5 * 60 * 1000); // 5 minutes
```

---

## Troubleshooting

### Error: "Missing required environment variables"

**Solution**: Check your `.env` file has all four variables:
```bash
ODOO_URL=...
ODOO_DB=...
ODOO_USERNAME=...
ODOO_API_KEY=...
```

### Error: "Authentication failed: Invalid credentials"

**Possible causes**:
1. API key is incorrect or expired
2. Username/email is wrong
3. Database name is incorrect
4. User doesn't have API access enabled

**Solution**:
- Regenerate API key in Odoo
- Verify username matches Odoo user email
- Check database name (usually your-company-db)
- Ensure user has "Technical Settings" access

### Error: "No response from Odoo server"

**Possible causes**:
1. ODOO_URL is incorrect
2. Network connectivity issues
3. Odoo server is down

**Solution**:
- Verify URL format: `https://your-instance.odoo.com`
- Test URL in browser
- Check firewall/proxy settings

### Error: "ODOO_URL is not using HTTPS"

**Solution**: Update ODOO_URL to use `https://` instead of `http://`

### Enable Debug Logging

All Odoo requests are logged with `[ODOO]` prefix. Check your server console for detailed information.

---

## Best Practices

### 1. API User Permissions

Grant only necessary permissions:
- ✅ Manufacturing / User
- ✅ Inventory / User
- ✅ Sales / User
- ❌ Settings / Administrator (NOT needed)

### 2. Error Handling

Always wrap Odoo calls in try-catch:
```javascript
try {
  const products = await api.get('/odoo/products');
} catch (error) {
  console.error('Odoo sync failed:', error.message);
  // Fallback to local data
}
```

### 3. Rate Limiting

Avoid excessive API calls:
- Cache Odoo data locally
- Sync periodically (e.g., every 5-10 minutes)
- Use webhooks if available

### 4. Data Mapping

Maintain a mapping table:
```javascript
// products table
{
  _id: 'local-id',
  name: 'Product Name',
  odoo_id: 45, // Odoo product ID
  last_synced: '2025-11-06T10:00:00Z'
}
```

### 5. Sync Strategy

Implement bidirectional sync:
- **Dashboard → Odoo**: Create MOs when orders are created
- **Odoo → Dashboard**: Update order status from MO state

---

## Security Checklist

- ✅ API key stored in `.env` file
- ✅ `.env` file in `.gitignore`
- ✅ Using dedicated API user (not admin)
- ✅ HTTPS URLs only
- ✅ JWT authentication for dashboard API
- ✅ Role-based access (Admin/Manager only)
- ✅ Rate limiting enabled
- ✅ Error messages don't expose sensitive info
- ✅ API key never logged or displayed

---

## Next Steps

1. **Update `.env`** with your Odoo credentials
2. **Restart backend server**
3. **Test connection**: `GET /api/odoo/test`
4. **Implement frontend integration** (see Frontend Guide)
5. **Setup periodic sync jobs**
6. **Monitor logs for errors**

---

**Status**: ✅ Backend Integration Complete  
**Version**: 1.0  
**Last Updated**: November 6, 2025
