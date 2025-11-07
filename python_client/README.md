# Odoo Python Client

A comprehensive Python client library for interacting with Odoo ERP via JSON-RPC and XML-RPC protocols.

## Features

- ✅ **Dual Protocol Support**: JSON-RPC (default) and XML-RPC
- ✅ **API Key Authentication**: Secure authentication using Odoo API keys
- ✅ **Complete CRUD Operations**: Create, Read, Update, Delete for all Odoo models
- ✅ **Specialized Methods**: Pre-built functions for Manufacturing Orders, Products, and Users
- ✅ **Environment Variable Support**: Configure via .env file
- ✅ **Comprehensive Error Handling**: Custom exceptions and detailed logging
- ✅ **Type-Safe**: Detailed docstrings for all methods
- ✅ **Production-Ready**: Battle-tested patterns and best practices

## Installation

### 1. Install Dependencies

```bash
cd python_client
pip install -r requirements.txt
```

### 2. Configure Environment Variables

The client loads configuration from environment variables. You can either:

**Option A: Use existing backend .env file**
```python
# examples.py already loads from ../backend/.env
from dotenv import load_dotenv
load_dotenv("../backend/.env")
```

**Option B: Create local .env file**
```bash
# Create python_client/.env
ODOO_URL=http://localhost:8069
ODOO_DB=adem
ODOO_USERNAME=ademmami92@gmail.com
ODOO_API_KEY=3e518df28b9d1ec1fb7df7f8052aa44206b5bac9
```

**Option C: Set system environment variables**
```powershell
# Windows PowerShell
$env:ODOO_URL="http://localhost:8069"
$env:ODOO_DB="adem"
$env:ODOO_USERNAME="ademmami92@gmail.com"
$env:ODOO_API_KEY="3e518df28b9d1ec1fb7df7f8052aa44206b5bac9"
```

## Quick Start

### Basic Connection Test

```python
from odoo_client import OdooClient

# Initialize client (loads from environment variables)
client = OdooClient()

# Test connection
if client.test_connection():
    print("✅ Connected to Odoo!")
    version = client.get_version()
    print(f"Odoo Version: {version}")
```

### Manufacturing Orders

```python
# Search manufacturing orders
orders = client.search_manufacturing_orders(
    domain=[['state', 'in', ['confirmed', 'progress']]],
    limit=10
)

# Get specific order details
order = client.get_manufacturing_order(order_id=42)
print(f"Order: {order['name']} - {order['product_id'][1]}")

# Create new manufacturing order
new_order = client.create_manufacturing_order({
    'product_id': 15,
    'product_qty': 100,
    'product_uom_id': 1,
    'bom_id': 5
})
```

### Products

```python
# Search products
products = client.search_products(
    domain=[['type', '=', 'product']],
    fields=['name', 'default_code', 'list_price', 'qty_available']
)

# Get product details
product = client.get_product(product_id=15)
```

### Generic Operations (Any Odoo Model)

```python
# Search any model
partners = client.search_read(
    'res.partner',
    domain=[['is_company', '=', True]],
    fields=['name', 'email', 'phone']
)

# Create record
new_partner = client.create('res.partner', {
    'name': 'New Company',
    'email': 'contact@newcompany.com'
})

# Update record
client.write('res.partner', [new_partner], {
    'phone': '+1234567890'
})

# Delete record
client.unlink('res.partner', [new_partner])
```

## Running Examples

```bash
# Run all examples
python examples.py

# Or run individual examples by modifying examples.py
```

## Available Methods

### Connection & Authentication
- `__init__(url, db, username, api_key, protocol)` - Initialize client
- `authenticate()` - Authenticate with Odoo
- `test_connection()` - Test if connection works
- `get_version()` - Get Odoo server version

### Generic CRUD Operations
- `execute(model, method, args, kwargs)` - Execute any Odoo method
- `search(model, domain, offset, limit, order)` - Search for record IDs
- `read(model, ids, fields)` - Read record data
- `search_read(model, domain, fields, offset, limit, order)` - Search and read in one call
- `create(model, values)` - Create new record
- `write(model, ids, values)` - Update existing records
- `unlink(model, ids)` - Delete records

### Manufacturing Orders (mrp.production)
- `search_manufacturing_orders(domain, fields, offset, limit, order)` - Search MOs
- `get_manufacturing_order(order_id)` - Get specific MO
- `create_manufacturing_order(values)` - Create new MO
- `update_manufacturing_order(order_id, values)` - Update existing MO

### Products (product.product)
- `search_products(domain, fields, offset, limit, order)` - Search products
- `get_product(product_id)` - Get specific product
- `create_product(values)` - Create new product

### Users (res.users)
- `search_users(domain, fields, offset, limit, order)` - Search users
- `get_user(user_id)` - Get specific user
- `create_user(values)` - Create new user

## Protocol Switching

```python
# Use JSON-RPC (default, recommended)
client = OdooClient(protocol='jsonrpc')

# Use XML-RPC (alternative)
client = OdooClient(protocol='xmlrpc')
```

## Error Handling

```python
from odoo_client import OdooClient, OdooAPIError

try:
    client = OdooClient()
    orders = client.search_manufacturing_orders()
except OdooAPIError as e:
    print(f"Odoo API Error: {e}")
except Exception as e:
    print(f"Unexpected error: {e}")
```

## Configuration Options

| Environment Variable | Description | Example |
|---------------------|-------------|---------|
| `ODOO_URL` | Odoo server URL | `http://localhost:8069` |
| `ODOO_DB` | Database name | `adem` |
| `ODOO_USERNAME` | Username/email | `ademmami92@gmail.com` |
| `ODOO_API_KEY` | API key (external identifier) | `3e518df28b9d1ec...` |

## Common Domain Filters

```python
# Equal
[['state', '=', 'confirmed']]

# Not equal
[['state', '!=', 'done']]

# In list
[['state', 'in', ['confirmed', 'progress']]]

# Greater than / Less than
[['product_qty', '>', 50]]
[['date_planned_start', '<', '2024-12-31']]

# Like (case-insensitive)
[['name', 'ilike', 'MO/%']]

# Multiple conditions (AND)
[['state', '=', 'confirmed'], ['product_qty', '>', 10]]

# OR conditions
['|', ['state', '=', 'confirmed'], ['state', '=', 'progress']]
```

## Troubleshooting

### Connection Issues

```python
# Enable detailed logging
import logging
logging.basicConfig(level=logging.DEBUG)

# Test connection
client = OdooClient()
if not client.test_connection():
    print("❌ Connection failed - check URL, DB, and credentials")
```

### Authentication Errors

- Verify API key is correct (from Odoo user preferences)
- Check database name matches exactly
- Ensure username/email is correct
- Verify Odoo instance is running

### HTTPS/Certificate Warnings

If using HTTPS with self-signed certificates, the client will warn but continue. For production:

```python
# Modify odoo_client.py to verify SSL
response = requests.post(url, json=payload, timeout=30, verify=True)
```

## Integration with Node.js Backend

This Python client complements the Node.js backend API:

- **Node.js**: Serves REST API endpoints for frontend (`/api/odoo/*`)
- **Python**: Batch operations, scripts, data migrations, analytics

Both share the same `.env` configuration for consistency.

## Next Steps

1. **Test the client**: `python examples.py`
2. **Create custom scripts**: Use the client for batch operations
3. **Integrate with backend**: Call from Python scripts or services
4. **Add to CI/CD**: Automate Odoo data synchronization

## Documentation

- [Full Integration Guide](../docs/ODOO_INTEGRATION_GUIDE.md)
- [Quick Setup Guide](../docs/ODOO_QUICK_SETUP.md)
- [Odoo API Documentation](https://www.odoo.com/documentation/17.0/developer/reference/external_api.html)

## License

Part of Production Orders Monitoring Dashboard project.
