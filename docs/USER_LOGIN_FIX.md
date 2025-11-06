# User Login Issue - Investigation & Fix

## Problem
Users created through the "Add User" modal cannot login with their credentials - the system returns "Invalid credentials" error.

---

## Investigation Summary

### Issue Identified
The login failure could be caused by several potential issues:
1. Password not being hashed correctly during user creation
2. Username/email mismatch during login lookup
3. User account marked as inactive
4. Password hash comparison failing

### Code Flow Analysis

#### User Creation Flow (`/auth/register`)
1. Frontend calls `POST /auth/register` with `{ username, email, password, role }`
2. Backend `authService.register()`:
   - Validates email and username are unique
   - **Hashes password** using bcrypt (10 salt rounds)
   - Creates user in database with `password_hash`
   - Returns token and user data

#### Login Flow (`/auth/login`)
1. Frontend calls `POST /auth/login` with `{ username, password }`
2. Backend `authService.login()`:
   - Looks up user by username (or email if provided)
   - Checks if user is active
   - **Compares password** with stored `password_hash` using bcrypt
   - Returns token and user data if valid

---

## Changes Made

### 1. Added PATCH Route for User Updates
**File**: `backend/src/routes/userRoutes.js`

**Problem**: Frontend was calling `PATCH /users/:id` to toggle user status, but only `PUT /users/:id` route existed.

**Fix**: Added PATCH route that reuses the same controller:
```javascript
/**
 * @route   PATCH /api/users/:id
 * @desc    Update user (partial update)
 * @access  Private (Admin only)
 */
router.patch(
  '/:id',
  authenticate,
  apiLimiter,
  validateMongoId('id'),
  validateUserUpdate,
  handleValidationErrors,
  isAdmin,
  userController.updateUser
);
```

### 2. Added Debug Logging
**File**: `backend/src/services/authService.js`

**Purpose**: Track the authentication flow to identify where login failures occur.

**Register Logging**:
```javascript
// Hash password
const password_hash = await this.hashPassword(password);
console.log('[AUTH] Registering user:', username, 'Password hash length:', password_hash.length);

// Create user
const user = await User.create({...});
console.log('[AUTH] User created successfully:', user._id);
```

**Login Logging**:
```javascript
console.log('[AUTH] Login attempt - email:', email, 'username:', username);

// After user lookup
console.log('[AUTH] User found:', user.username, 'Active:', user.is_active, 'Has password_hash:', !!user.password_hash);

// After password comparison
const isPasswordValid = await this.comparePassword(password, user.password_hash);
console.log('[AUTH] Password valid:', isPasswordValid);
```

---

## Testing Instructions

### 1. Restart Backend Server
The changes require restarting the backend:
```bash
cd backend
npm run dev
```

### 2. Create a Test User
1. Login as admin
2. Go to Users page
3. Click "Add User"
4. Fill in form:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `Test123!`
   - Role: `worker`
5. Click "Create User"

### 3. Check Backend Console
You should see logs like:
```
[AUTH] Registering user: testuser Password hash length: 60
[AUTH] User created successfully: 507f1f77bcf86cd799439011
```

### 4. Test Login
1. Logout
2. Try to login with:
   - Username: `testuser`
   - Password: `Test123!`

### 5. Check Login Logs
You should see:
```
[AUTH] Login attempt - email: undefined username: testuser
[AUTH] User found: testuser Active: true Has password_hash: true
[AUTH] Password valid: true
```

---

## Common Issues & Solutions

### Issue 1: "User not found" in logs
**Symptom**: `[AUTH] User not found` appears after login attempt

**Causes**:
- Username was entered incorrectly
- User was not actually created (check database)
- Username case sensitivity mismatch

**Solution**:
- Verify user exists in database
- Check exact username used during creation
- Ensure MongoDB is running

### Issue 2: "Password valid: false" in logs
**Symptom**: User is found but password comparison fails

**Causes**:
- Password entered incorrectly
- Password hash was corrupted during save
- bcrypt version mismatch

**Solution**:
- Verify password is typed correctly
- Check if `password_hash` field exists in database
- Delete user and recreate with new password

### Issue 3: "Active: false" in logs
**Symptom**: User account is deactivated

**Cause**: User was deactivated after creation

**Solution**:
- Go to Users page as admin
- Click "Activate" button for the user
- Try logging in again

### Issue 4: No logs appear
**Symptom**: Console shows no authentication logs

**Causes**:
- Backend server not restarted
- Wrong terminal window
- Server crashed

**Solution**:
- Restart backend server
- Check correct terminal/console
- Look for error messages in server logs

---

## Database Verification

### Check User in MongoDB
```bash
# Connect to MongoDB
mongosh

# Switch to your database
use production_orders_db

# Find the user
db.users.findOne({ username: "testuser" })
```

### Verify Password Hash
The output should include:
```javascript
{
  _id: ObjectId("..."),
  username: "testuser",
  email: "test@example.com",
  password_hash: "$2b$10$...", // Should start with $2b$10$
  role: "worker",
  is_active: true,
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

**Important**: `password_hash` should:
- Be exactly 60 characters long
- Start with `$2b$10$` (bcrypt format)
- Look like random characters after the prefix

---

## Additional Debugging

### Enable More Detailed Logs
If the issue persists, add more logging:

**In `authService.js` > `comparePassword`**:
```javascript
static async comparePassword(password, hash) {
  console.log('[AUTH] Comparing - Password length:', password.length, 'Hash length:', hash.length);
  const result = await bcrypt.compare(password, hash);
  console.log('[AUTH] bcrypt.compare result:', result);
  return result;
}
```

### Check Request Body
**In `authController.js` > `login`**:
```javascript
const login = asyncHandler(async (req, res) => {
  console.log('[AUTH CONTROLLER] Login request body:', req.body);
  const { email, username, password } = req.body;
  //...
});
```

---

## Expected Behavior After Fix

### ✅ User Creation
1. User is created successfully
2. Password is hashed with bcrypt
3. User appears in Users table
4. Console shows: `[AUTH] User created successfully: <user_id>`

### ✅ User Login
1. User enters username and password
2. Backend finds user by username
3. Password comparison succeeds
4. Token is generated
5. User is redirected to dashboard
6. Console shows: `[AUTH] Password valid: true`

### ✅ Toggle User Status
1. Admin can activate/deactivate users
2. PATCH request to `/users/:id` works
3. User status updates in table

---

## Root Cause Analysis

### Most Likely Causes (in order)

1. **Missing PATCH Route** ✅ FIXED
   - Frontend was trying to update user status via PATCH
   - Only PUT route existed
   - Added PATCH route

2. **Password Hash Issue** 🔍 INVESTIGATING
   - Need to verify password is hashed correctly
   - Debug logs will reveal if hash is valid
   - Compare function may be failing

3. **User Not Actually Created** 🔍 INVESTIGATING
   - Registration may fail silently
   - Check if user exists in database
   - Verify email/username uniqueness

4. **Active Status** 🔍 INVESTIGATING
   - User may be created as inactive
   - Check `is_active` field in database
   - Default should be `true`

---

## Next Steps

1. **Restart Backend Server** with new code
2. **Create Test User** and watch console logs
3. **Attempt Login** and monitor authentication flow
4. **Share Logs** if issue persists:
   - Copy console output from user creation
   - Copy console output from login attempt
   - Check MongoDB for user document

---

## Files Modified

1. `backend/src/routes/userRoutes.js` - Added PATCH route
2. `backend/src/services/authService.js` - Added debug logging

**Status**: 🔧 Ready for Testing  
**Changes**: 2 files modified  
**Errors**: 0

---

**Last Updated**: November 6, 2025
