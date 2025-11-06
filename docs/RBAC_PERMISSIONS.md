# 🔐 Role-Based Access Control (RBAC) System

## Role Definitions

### 👑 Admin
**Description**: Full system access with user management capabilities

**Permissions**:
- ✅ Full CRUD on all resources
- ✅ User management (create, update, deactivate users)
- ✅ Product management (create, update, delete, deactivate)
- ✅ Order management (create, update, delete, assign, block/unblock)
- ✅ View all analytics and reports
- ✅ Access all system settings
- ✅ View audit logs
- ✅ Manage system roles and permissions

**Restrictions**:
- ❌ Cannot delete their own account
- ❌ Must maintain at least one active admin

---

### 📊 Manager (Production Manager)
**Description**: Production oversight with order and product management

**Permissions**:
- ✅ Product management (create, update, deactivate)
- ✅ Order management (create, update, assign, block/unblock)
- ✅ View all orders and products
- ✅ View analytics and reports
- ✅ Assign orders to workers
- ✅ Update order status
- ✅ View worker productivity

**Restrictions**:
- ❌ Cannot manage users
- ❌ Cannot delete products (only deactivate)
- ❌ Cannot delete orders
- ❌ Cannot change user roles
- ❌ Cannot access admin-only settings

---

### 🔧 Worker
**Description**: Production execution with limited access to assigned tasks

**Permissions**:
- ✅ View assigned orders only
- ✅ Update status of assigned orders
- ✅ Add notes to assigned orders
- ✅ View assigned order details and history
- ✅ View product catalog (read-only)
- ✅ Update own profile

**Restrictions**:
- ❌ Cannot view other workers' orders
- ❌ Cannot create orders
- ❌ Cannot assign/reassign orders
- ❌ Cannot block/unblock orders
- ❌ Cannot delete any resources
- ❌ Cannot access analytics
- ❌ Cannot manage products
- ❌ Cannot view other users

---

## Permission Matrix

| Resource | Action | Admin | Manager | Worker |
|----------|--------|-------|---------|--------|
| **Users** | Create | ✅ | ❌ | ❌ |
| | View All | ✅ | ❌ | ❌ |
| | View Self | ✅ | ✅ | ✅ |
| | Update Self | ✅ | ✅ | ✅ |
| | Update Others | ✅ | ❌ | ❌ |
| | Deactivate | ✅ | ❌ | ❌ |
| | Delete | ✅ | ❌ | ❌ |
| | Change Role | ✅ | ❌ | ❌ |
| **Products** | Create | ✅ | ✅ | ❌ |
| | View All | ✅ | ✅ | ✅ |
| | View Details | ✅ | ✅ | ✅ |
| | Update | ✅ | ✅ | ❌ |
| | Deactivate | ✅ | ✅ | ❌ |
| | Delete | ✅ | ❌ | ❌ |
| **Orders** | Create | ✅ | ✅ | ❌ |
| | View All | ✅ | ✅ | ❌ |
| | View Assigned | ✅ | ✅ | ✅ |
| | View Details | ✅ | ✅ | ✅* |
| | Update | ✅ | ✅ | ✅* |
| | Update Status | ✅ | ✅ | ✅* |
| | Assign | ✅ | ✅ | ❌ |
| | Block/Unblock | ✅ | ✅ | ❌ |
| | Complete | ✅ | ✅ | ✅* |
| | Delete | ✅ | ✅ | ❌ |
| | Add Notes | ✅ | ✅ | ✅* |
| **Analytics** | View KPIs | ✅ | ✅ | ❌ |
| | View Charts | ✅ | ✅ | ❌ |
| | Export Reports | ✅ | ✅ | ❌ |
| | Worker Stats | ✅ | ✅ | ❌ |

**Note**: ✅* = Allowed only for assigned orders

---

## API Endpoint Protection

### Authentication Required (All Endpoints)
```javascript
// All API routes require valid JWT token
router.use(authenticate);
```

### User Endpoints
```javascript
POST   /api/users              // Admin only
GET    /api/users              // Admin only
GET    /api/users/:id          // Self or Admin
PUT    /api/users/:id          // Self or Admin
PATCH  /api/users/:id          // Admin only (role/status changes)
DELETE /api/users/:id          // Admin only
```

### Product Endpoints
```javascript
POST   /api/products           // Admin, Manager
GET    /api/products           // All authenticated users
GET    /api/products/:id       // All authenticated users
PUT    /api/products/:id       // Admin, Manager
PATCH  /api/products/:id/deactivate  // Admin, Manager
DELETE /api/products/:id       // Admin only
```

### Order Endpoints
```javascript
POST   /api/orders             // Admin, Manager
GET    /api/orders             // Admin/Manager: all, Worker: assigned only
GET    /api/orders/statistics  // Admin, Manager
GET    /api/orders/:id         // Admin/Manager: all, Worker: assigned only
PUT    /api/orders/:id         // Admin/Manager: full, Worker: limited
PATCH  /api/orders/:id/status  // Admin/Manager: all, Worker: assigned only
PATCH  /api/orders/:id/assign  // Admin, Manager
PATCH  /api/orders/:id/block   // Admin, Manager
PATCH  /api/orders/:id/unblock // Admin, Manager
PATCH  /api/orders/:id/complete // Admin/Manager: all, Worker: assigned only
DELETE /api/orders/:id         // Admin, Manager
GET    /api/orders/:id/logs    // Admin/Manager: all, Worker: assigned only
```

### Analytics Endpoints
```javascript
GET    /api/analytics/kpis                  // Admin, Manager
GET    /api/analytics/order-volume          // Admin, Manager
GET    /api/analytics/status-distribution   // Admin, Manager
GET    /api/analytics/worker-productivity   // Admin, Manager
```

---

## Frontend Route Protection

### Public Routes (No Auth Required)
- `/login`
- `/register` (if enabled)

### Protected Routes (Auth Required)
- `/dashboard` - All authenticated users
- `/orders` - All authenticated users (filtered by role)
- `/orders/new` - Admin, Manager only
- `/orders/:id` - Admin/Manager: all, Worker: assigned only
- `/products` - Admin, Manager only
- `/users` - Admin only

### Route Guards Implementation
```typescript
// Redirect to login if not authenticated
useEffect(() => {
  if (!authLoading && !isAuthenticated) {
    router.push('/login');
  }
}, [authLoading, isAuthenticated]);

// Redirect if insufficient permissions
useEffect(() => {
  if (!authLoading && (!isAuthenticated || (!isAdmin && !isManager))) {
    router.push('/dashboard');
  }
}, [authLoading, isAuthenticated, isAdmin, isManager]);
```

---

## Security Measures

### 1. JWT Token Security
- **Expiration**: Tokens expire after 24 hours
- **Storage**: Stored in httpOnly cookies (not localStorage)
- **Validation**: Token validated on every request
- **Refresh**: Automatic refresh before expiration (if implemented)

### 2. Input Validation
**Backend**:
- Express-validator for all input
- Sanitization to prevent XSS
- Type checking and constraints
- SQL/NoSQL injection prevention

**Frontend**:
- Client-side validation before submission
- Real-time validation feedback
- Sanitization of user input
- Format validation (email, phone, etc.)

### 3. CSRF Protection
- Token-based CSRF protection for state-changing operations
- SameSite cookie attribute
- Origin validation

### 4. Rate Limiting
- Login attempts: 5 per 15 minutes per IP
- API requests: 100 per 15 minutes per user
- Analytics: 20 per minute per user

### 5. Password Security
- Minimum 8 characters
- Required: uppercase, lowercase, number
- Bcrypt hashing (cost factor 12)
- No password history reuse

---

## Error Handling

### Standardized Error Responses

**401 Unauthorized** - Authentication Required
```json
{
  "success": false,
  "error": "Authentication required",
  "message": "Please log in to access this resource"
}
```

**403 Forbidden** - Insufficient Permissions
```json
{
  "success": false,
  "error": "Access denied. Insufficient permissions.",
  "message": "This action requires one of the following roles: admin, manager"
}
```

**400 Bad Request** - Validation Error
```json
{
  "success": false,
  "error": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ]
}
```

**404 Not Found** - Resource Not Found
```json
{
  "success": false,
  "error": "Resource not found",
  "message": "Order with ID 123 not found"
}
```

---

## Testing Checklist

### Authentication Tests
- [ ] Login with valid credentials (all roles)
- [ ] Login with invalid credentials
- [ ] Token expiration handling
- [ ] Token refresh mechanism
- [ ] Logout functionality
- [ ] Session persistence

### Authorization Tests
- [ ] Admin can access all resources
- [ ] Manager cannot access user management
- [ ] Worker can only view assigned orders
- [ ] Direct URL access blocked for unauthorized users
- [ ] API returns 403 for unauthorized actions

### Input Validation Tests
- [ ] Invalid email format rejected
- [ ] Short passwords rejected
- [ ] XSS attempts sanitized
- [ ] SQL injection attempts blocked
- [ ] Required fields validated
- [ ] Type mismatches caught

### UI/UX Tests
- [ ] Unauthorized actions hidden in UI
- [ ] Role-appropriate navigation displayed
- [ ] Error messages clear and helpful
- [ ] Loading states during auth checks
- [ ] Redirect flows work correctly

---

## Audit Log

All sensitive operations are logged:

```javascript
{
  action: 'order_created',
  userId: 'user123',
  userRole: 'manager',
  resourceType: 'order',
  resourceId: 'order456',
  timestamp: '2025-11-06T10:30:00Z',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...'
}
```

**Logged Actions**:
- User login/logout
- Order creation/update/deletion
- User creation/update/deactivation
- Role changes
- Permission denied attempts
- Failed login attempts

---

## Implementation Checklist

### Backend
- [x] Authentication middleware (`authenticate`)
- [x] Authorization middleware (`authorize`, `isAdmin`, etc.)
- [x] Role-based route protection
- [ ] Input validation middleware
- [ ] Rate limiting middleware
- [ ] CSRF protection
- [ ] Audit logging middleware

### Frontend
- [x] Auth context with role checking
- [x] Protected route wrapper
- [ ] Role-based component rendering
- [ ] Permission hooks (`usePermission`)
- [ ] Input validation on forms
- [ ] Error boundary component

### Documentation
- [ ] Role definitions
- [ ] Permission matrix
- [ ] API endpoint security guide
- [ ] Testing procedures
- [ ] Security best practices

---

**Last Updated**: November 6, 2025  
**Version**: 1.0.0  
**Status**: Sprint 5 - In Progress
