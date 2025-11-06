# Production Orders Dashboard API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Authentication Endpoints

### Register User
Creates a new user account.

**Endpoint:** `POST /auth/register`  
**Access:** Public (or Admin only)

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "role": "worker"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "role": "worker",
      "is_active": true,
      "created_at": "2025-11-03T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Login
Authenticate user and receive JWT token.

**Endpoint:** `POST /auth/login`  
**Access:** Public

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "role": "worker",
      "is_active": true,
      "created_at": "2025-11-03T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Get Profile
Get current authenticated user's profile.

**Endpoint:** `GET /auth/profile`  
**Access:** Private

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "role": "worker",
    "is_active": true,
    "created_at": "2025-11-03T10:00:00.000Z",
    "updated_at": "2025-11-03T10:00:00.000Z"
  }
}
```

---

### Update Password
Change user's password.

**Endpoint:** `PUT /auth/password`  
**Access:** Private

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "oldPassword": "SecurePass123",
  "newPassword": "NewSecurePass456"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

---

### Verify Token
Check if JWT token is still valid.

**Endpoint:** `GET /auth/verify`  
**Access:** Private

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "role": "worker",
      "is_active": true
    }
  }
}
```

---

### Logout
Logout user (client removes token).

**Endpoint:** `POST /auth/logout`  
**Access:** Private

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Logout successful. Please remove the token from client storage."
}
```

---

## User Management Endpoints

### Get All Users
Retrieve list of all users.

**Endpoint:** `GET /users`  
**Access:** Admin only

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `role` (optional): Filter by role (admin, manager, worker)
- `is_active` (optional): Filter by active status (true, false)

**Example:** `GET /users?role=worker&is_active=true`

**Response:** `200 OK`
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": 4,
      "username": "worker1",
      "email": "worker1@example.com",
      "role": "worker",
      "is_active": true,
      "created_at": "2025-11-03T10:00:00.000Z",
      "updated_at": "2025-11-03T10:00:00.000Z"
    },
    // ... more users
  ]
}
```

---

### Get User by ID
Get specific user details.

**Endpoint:** `GET /users/:id`  
**Access:** Admin or self

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": 4,
    "username": "worker1",
    "email": "worker1@example.com",
    "role": "worker",
    "is_active": true,
    "created_at": "2025-11-03T10:00:00.000Z",
    "updated_at": "2025-11-03T10:00:00.000Z"
  }
}
```

---

### Update User
Update user information.

**Endpoint:** `PUT /users/:id`  
**Access:** Admin only

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "username": "newusername",
  "email": "newemail@example.com",
  "role": "manager",
  "is_active": true
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": 4,
    "username": "newusername",
    "email": "newemail@example.com",
    "role": "manager",
    "is_active": true,
    "created_at": "2025-11-03T10:00:00.000Z",
    "updated_at": "2025-11-03T12:00:00.000Z"
  }
}
```

---

### Deactivate User
Soft delete a user (sets is_active to false).

**Endpoint:** `PATCH /users/:id/deactivate`  
**Access:** Admin only

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "User deactivated successfully",
  "data": {
    "id": 4,
    "username": "worker1",
    "email": "worker1@example.com",
    "role": "worker",
    "is_active": false
  }
}
```

---

### Delete User
Permanently delete a user.

**Endpoint:** `DELETE /users/:id`  
**Access:** Admin only

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

### Get User Statistics
Get user's production statistics.

**Endpoint:** `GET /users/:id/statistics`  
**Access:** Admin or self

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": 4,
    "username": "worker1",
    "role": "worker",
    "total_orders_assigned": 15,
    "completed_orders": 8,
    "active_orders": 5,
    "pending_orders": 2
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation failed",
  "errors": [
    {
      "msg": "Password must be at least 8 characters long",
      "param": "password",
      "location": "body"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Access denied. Insufficient permissions.",
  "message": "This action requires one of the following roles: admin"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "User not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "error": "Email already registered"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal Server Error"
}
```

---

## Validation Rules

### Username
- 3-50 characters
- Letters, numbers, and underscores only

### Email
- Valid email format
- Unique in system

### Password
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

### Role
- Must be: `admin`, `manager`, or `worker`

---

## Rate Limiting
*(To be implemented in future sprint)*

---

## Postman Collection
Import the API into Postman for easy testing:
1. Create new collection: "Production Dashboard API"
2. Add environment variables:
   - `base_url`: http://localhost:5000/api
   - `token`: (will be set after login)
3. Use `{{base_url}}` and `{{token}}` in requests

---

**Last Updated:** November 3, 2025  
**API Version:** 1.0.0
