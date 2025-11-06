# Sprint 2 API Documentation - Products & Orders

## Base URL
```
http://localhost:5000/api
```

## Authentication
All endpoints require JWT authentication in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Product Endpoints

### Create Product
Create a new product in the catalog.

**Endpoint:** `POST /products`  
**Access:** Admin, Manager

**Request Body:**
```json
{
  "name": "Cotton T-Shirt Fabric",
  "reference": "FAB-CT-001",
  "description": "Premium 100% cotton jersey fabric for t-shirts",
  "unit": "meters"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": 1,
    "name": "Cotton T-Shirt Fabric",
    "reference": "FAB-CT-001",
    "description": "Premium 100% cotton jersey fabric for t-shirts",
    "unit": "meters",
    "is_active": true,
    "created_at": "2025-11-04T10:00:00.000Z",
    "updated_at": "2025-11-04T10:00:00.000Z"
  }
}
```

---

### Get All Products
Retrieve list of all products with optional filters.

**Endpoint:** `GET /products`  
**Access:** All authenticated users

**Query Parameters:**
- `is_active` (optional): Filter by active status (true/false)
- `search` (optional): Search in product name or reference

**Example:** `GET /products?is_active=true&search=cotton`

**Response:** `200 OK`
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 1,
      "name": "Cotton T-Shirt Fabric",
      "reference": "FAB-CT-001",
      "description": "Premium 100% cotton jersey fabric",
      "unit": "meters",
      "is_active": true,
      "created_at": "2025-11-04T10:00:00.000Z",
      "updated_at": "2025-11-04T10:00:00.000Z"
    }
  ]
}
```

---

### Get Product by ID
Get details of a specific product.

**Endpoint:** `GET /products/:id`  
**Access:** All authenticated users

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Cotton T-Shirt Fabric",
    "reference": "FAB-CT-001",
    "description": "Premium 100% cotton jersey fabric",
    "unit": "meters",
    "is_active": true,
    "created_at": "2025-11-04T10:00:00.000Z",
    "updated_at": "2025-11-04T10:00:00.000Z"
  }
}
```

---

### Update Product
Update product information.

**Endpoint:** `PUT /products/:id`  
**Access:** Admin, Manager

**Request Body:**
```json
{
  "name": "Premium Cotton T-Shirt Fabric",
  "description": "Updated description",
  "unit": "meters"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "id": 1,
    "name": "Premium Cotton T-Shirt Fabric",
    "reference": "FAB-CT-001",
    "description": "Updated description",
    "unit": "meters",
    "is_active": true,
    "created_at": "2025-11-04T10:00:00.000Z",
    "updated_at": "2025-11-04T11:00:00.000Z"
  }
}
```

---

### Deactivate Product
Soft delete a product (sets is_active to false).

**Endpoint:** `PATCH /products/:id/deactivate`  
**Access:** Admin, Manager

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Product deactivated successfully",
  "data": {
    "id": 1,
    "name": "Cotton T-Shirt Fabric",
    "reference": "FAB-CT-001",
    "is_active": false
  }
}
```

---

### Delete Product
Permanently delete a product.

**Endpoint:** `DELETE /products/:id`  
**Access:** Admin only

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

**Note:** Cannot delete products that are referenced by existing orders.

---

## Order Endpoints

### Create Order
Create a new production order.

**Endpoint:** `POST /orders`  
**Access:** Admin, Manager

**Request Body:**
```json
{
  "order_number": "ORD-2025-001",
  "product_id": 1,
  "assigned_to": 4,
  "quantity": 500,
  "priority": 3,
  "deadline": "2025-11-15T17:00:00.000Z",
  "notes": "Urgent order for new client"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": 1,
    "order_number": "ORD-2025-001",
    "status": "pending",
    "quantity": 500,
    "priority": 3,
    "start_date": null,
    "end_date": null,
    "deadline": "2025-11-15T17:00:00.000Z",
    "last_update": "2025-11-04T10:00:00.000Z",
    "notes": "Urgent order for new client",
    "product_name": "Cotton T-Shirt Fabric",
    "product_reference": "FAB-CT-001",
    "product_unit": "meters",
    "assigned_to_username": "worker1",
    "assigned_to_email": "worker1@production.com",
    "created_by_username": "manager1",
    "created_at": "2025-11-04T10:00:00.000Z"
  }
}
```

---

### Get All Orders
Retrieve list of orders with filters.

**Endpoint:** `GET /orders`  
**Access:** All authenticated users (workers see only assigned orders)

**Query Parameters:**
- `status` (optional): Filter by status (pending, in_progress, done, blocked)
- `product_id` (optional): Filter by product ID
- `assigned_to` (optional): Filter by assigned user ID
- `created_by` (optional): Filter by creator user ID
- `priority` (optional): Filter by priority (1-5)
- `start_date` (optional): Filter by start date
- `end_date` (optional): Filter by end date
- `search` (optional): Search in order_number or product_name

**Example:** `GET /orders?status=in_progress&priority=5&search=ORD-2025`

**Response:** `200 OK`
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 1,
      "order_number": "ORD-2025-001",
      "status": "in_progress",
      "quantity": 500,
      "priority": 5,
      "start_date": "2025-11-04T08:00:00.000Z",
      "end_date": null,
      "deadline": "2025-11-15T17:00:00.000Z",
      "product_name": "Cotton T-Shirt Fabric",
      "assigned_to_username": "worker1",
      "created_by_username": "manager1",
      "created_at": "2025-11-04T10:00:00.000Z"
    }
  ]
}
```

---

### Get Order by ID
Get details of a specific order.

**Endpoint:** `GET /orders/:id`  
**Access:** All authenticated users (workers only see assigned orders)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": 1,
    "order_number": "ORD-2025-001",
    "status": "in_progress",
    "quantity": 500,
    "priority": 3,
    "start_date": "2025-11-04T08:00:00.000Z",
    "end_date": null,
    "deadline": "2025-11-15T17:00:00.000Z",
    "last_update": "2025-11-04T10:00:00.000Z",
    "notes": "Urgent order for new client",
    "product_name": "Cotton T-Shirt Fabric",
    "product_reference": "FAB-CT-001",
    "product_unit": "meters",
    "assigned_to_username": "worker1",
    "assigned_to_email": "worker1@production.com",
    "created_by_username": "manager1",
    "created_at": "2025-11-04T10:00:00.000Z"
  }
}
```

---

### Update Order
Update order information.

**Endpoint:** `PUT /orders/:id`  
**Access:** Admin, Manager (full update); Worker (notes only, assigned orders)

**Request Body (Admin/Manager):**
```json
{
  "quantity": 600,
  "priority": 5,
  "deadline": "2025-11-12T17:00:00.000Z",
  "notes": "Deadline moved up - high priority"
}
```

**Request Body (Worker):**
```json
{
  "notes": "Progress update: 50% complete"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Order updated successfully",
  "data": {
    "id": 1,
    "order_number": "ORD-2025-001",
    "status": "in_progress",
    "quantity": 600,
    "priority": 5,
    "deadline": "2025-11-12T17:00:00.000Z",
    "notes": "Deadline moved up - high priority"
  }
}
```

---

### Update Order Status
Change the status of an order.

**Endpoint:** `PATCH /orders/:id/status`  
**Access:** All authenticated users (workers update assigned orders)

**Request Body:**
```json
{
  "status": "in_progress",
  "notes": "Started working on this order"
}
```

**Valid Statuses:**
- `pending`: Not started
- `in_progress`: Work in progress
- `done`: Completed
- `blocked`: Blocked by issues

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Order status updated successfully",
  "data": {
    "id": 1,
    "order_number": "ORD-2025-001",
    "status": "in_progress",
    "start_date": "2025-11-04T10:30:00.000Z",
    "notes": "Started working on this order"
  }
}
```

**Auto-set Dates:**
- Setting to `in_progress`: auto-sets `start_date` if null
- Setting to `done`: auto-sets `end_date` if null

---

### Assign Order
Assign or reassign an order to a user.

**Endpoint:** `PATCH /orders/:id/assign`  
**Access:** Admin, Manager

**Request Body:**
```json
{
  "assigned_to": 5,
  "notes": "Reassigned to worker2 due to workload"
}
```

**Unassign Order:**
```json
{
  "assigned_to": null,
  "notes": "Unassigned for reassignment"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Order assignment updated successfully",
  "data": {
    "id": 1,
    "order_number": "ORD-2025-001",
    "assigned_to_username": "worker2",
    "assigned_to_email": "worker2@production.com",
    "notes": "Reassigned to worker2 due to workload"
  }
}
```

---

### Block Order
Block an order due to issues.

**Endpoint:** `PATCH /orders/:id/block`  
**Access:** Admin, Manager

**Request Body:**
```json
{
  "reason": "Material shortage - waiting for fabric delivery"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Order blocked successfully",
  "data": {
    "id": 1,
    "order_number": "ORD-2025-001",
    "status": "blocked",
    "notes": "Material shortage - waiting for fabric delivery"
  }
}
```

**Restrictions:**
- Cannot block orders that are already blocked
- Cannot block completed orders

---

### Unblock Order
Unblock a blocked order.

**Endpoint:** `PATCH /orders/:id/unblock`  
**Access:** Admin, Manager

**Request Body:**
```json
{
  "status": "in_progress",
  "notes": "Material arrived - resuming production"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Order unblocked successfully",
  "data": {
    "id": 1,
    "order_number": "ORD-2025-001",
    "status": "in_progress",
    "notes": "Material arrived - resuming production"
  }
}
```

**Valid Status After Unblock:**
- `pending`
- `in_progress`

---

### Complete Order
Mark an order as completed.

**Endpoint:** `PATCH /orders/:id/complete`  
**Access:** All authenticated users (workers complete assigned orders)

**Request Body:**
```json
{
  "notes": "Order completed successfully - quality checked"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Order completed successfully",
  "data": {
    "id": 1,
    "order_number": "ORD-2025-001",
    "status": "done",
    "end_date": "2025-11-04T16:00:00.000Z",
    "notes": "Order completed successfully - quality checked"
  }
}
```

**Restrictions:**
- Cannot complete already completed orders
- Cannot complete blocked orders (must unblock first)
- Auto-sets `end_date` to current timestamp

---

### Delete Order
Permanently delete an order.

**Endpoint:** `DELETE /orders/:id`  
**Access:** Admin, Manager

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Order deleted successfully"
}
```

**Note:** Order logs are cascade deleted with the order.

---

### Get Order Logs
Get activity/audit logs for an order.

**Endpoint:** `GET /orders/:id/logs`  
**Access:** All authenticated users (workers see assigned orders)

**Response:** `200 OK`
```json
{
  "success": true,
  "count": 4,
  "data": [
    {
      "id": 4,
      "order_id": 1,
      "user_id": 4,
      "action": "status_change",
      "old_status": "in_progress",
      "new_status": "done",
      "details": "Order completed by worker1",
      "timestamp": "2025-11-04T16:00:00.000Z",
      "username": "worker1",
      "role": "worker"
    },
    {
      "id": 3,
      "order_id": 1,
      "user_id": 4,
      "action": "status_change",
      "old_status": "pending",
      "new_status": "in_progress",
      "details": "Started working on order",
      "timestamp": "2025-11-04T08:00:00.000Z",
      "username": "worker1",
      "role": "worker"
    },
    {
      "id": 2,
      "order_id": 1,
      "user_id": 2,
      "action": "assignment_change",
      "old_status": "pending",
      "new_status": "pending",
      "details": "Order assigned to worker1 by manager1",
      "timestamp": "2025-11-04T07:00:00.000Z",
      "username": "manager1",
      "role": "manager"
    },
    {
      "id": 1,
      "order_id": 1,
      "user_id": 2,
      "action": "created",
      "old_status": null,
      "new_status": "pending",
      "details": "Order created by manager1",
      "timestamp": "2025-11-04T06:00:00.000Z",
      "username": "manager1",
      "role": "manager"
    }
  ]
}
```

---

### Get Order Statistics
Get statistics about orders.

**Endpoint:** `GET /orders/statistics`  
**Access:** All authenticated users (workers see own statistics)

**Query Parameters (Admin/Manager):**
- `assigned_to` (optional): Get stats for specific user
- `created_by` (optional): Get stats for orders created by user

**Example:** `GET /orders/statistics?assigned_to=4`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "total_orders": 15,
    "pending_orders": 3,
    "in_progress_orders": 5,
    "completed_orders": 6,
    "blocked_orders": 1,
    "total_quantity": 7500,
    "avg_priority": 2.8
  }
}
```

---

## Role-Based Access Summary

### Admin
- ✅ Full access to all endpoints
- ✅ Create, update, delete products
- ✅ Create, update, delete, assign orders
- ✅ Block/unblock orders
- ✅ View all orders and statistics

### Manager
- ✅ Create, update products (cannot delete)
- ✅ Create, update, assign orders
- ✅ Block/unblock orders
- ✅ View all orders and statistics
- ❌ Cannot delete products

### Worker
- ✅ View all products
- ✅ View assigned orders only
- ✅ Update status of assigned orders
- ✅ Complete assigned orders
- ✅ Update notes on assigned orders
- ❌ Cannot create/delete orders
- ❌ Cannot assign orders
- ❌ Cannot block/unblock orders
- ❌ View only own statistics

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Order is already completed"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Access denied. You can only view orders assigned to you."
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Product not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "error": "Order number already exists"
}
```

---

## Testing with cURL

### Create Order
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "order_number": "ORD-2025-001",
    "product_id": 1,
    "assigned_to": 4,
    "quantity": 500,
    "priority": 3,
    "deadline": "2025-11-15T17:00:00.000Z",
    "notes": "Urgent order"
  }'
```

### Get All Orders
```bash
curl -X GET "http://localhost:5000/api/orders?status=in_progress" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update Order Status
```bash
curl -X PATCH http://localhost:5000/api/orders/1/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "notes": "Started production"
  }'
```

### Complete Order
```bash
curl -X PATCH http://localhost:5000/api/orders/1/complete \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Production completed successfully"
  }'
```

---

**Last Updated:** November 4, 2025  
**API Version:** 2.0.0  
**Sprint:** Sprint 2 - Production Orders Logic
