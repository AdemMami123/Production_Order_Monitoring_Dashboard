# Quick Start Guide - Sprint 1

This guide will help you set up and run the Production Orders Monitoring Dashboard backend API.

## Prerequisites

Before starting, ensure you have:
- ✅ Node.js (v16+) installed
- ✅ PostgreSQL (v13+) installed and running
- ✅ npm or yarn package manager
- ✅ A code editor (VS Code recommended)

## Setup Steps

### 1. Database Setup

Open PostgreSQL command line (psql):

```bash
psql -U postgres
```

Create the database and user:

```sql
-- Create database
CREATE DATABASE production_dashboard;

-- Create user
CREATE USER dashboard_user WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE production_dashboard TO dashboard_user;

-- Grant schema privileges
\c production_dashboard
GRANT ALL ON SCHEMA public TO dashboard_user;

-- Exit psql
\q
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create environment file:

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` file with your settings:

```env
NODE_ENV=development
PORT=5000
HOST=localhost

# Update these with your database credentials
DB_HOST=localhost
DB_PORT=5432
DB_NAME=production_dashboard
DB_USER=dashboard_user
DB_PASSWORD=your_secure_password

# Generate a strong JWT secret (use a random string generator)
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
JWT_EXPIRES_IN=24h

CORS_ORIGIN=http://localhost:3000
```

### 3. Run Database Migration

Create the database tables:

```bash
npm run migrate
```

You should see:
```
✅ Database schema created successfully!
✅ Tables created:
   - users
   - products
   - orders
   - order_logs
```

### 4. Seed Database (Optional)

Load sample data for testing:

```bash
npm run seed
```

**Important:** The seed file contains placeholder password hashes. For testing, you'll need to:

1. Generate a real bcrypt hash:
```javascript
// In Node.js console or create a script
const bcrypt = require('bcrypt');
bcrypt.hash('password123', 10).then(hash => console.log(hash));
```

2. Update the password hashes in `database/seed.sql`

3. Run the seed again

### 5. Start the Server

Development mode (with auto-reload):

```bash
npm run dev
```

Production mode:

```bash
npm start
```

You should see:

```
🚀 Production Orders Dashboard API
=====================================
📡 Server running on http://localhost:5000
🌍 Environment: development
📊 CORS enabled for: http://localhost:3000
=====================================

✅ Database connection successful
```

## Testing the API

### 1. Health Check

```bash
curl http://localhost:5000/health
```

### 2. Register a User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123",
    "role": "worker"
  }'
```

### 3. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

Save the token from the response!

### 4. Get Profile

Replace `YOUR_TOKEN_HERE` with the token from login:

```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Using Postman

1. Open Postman
2. Create a new collection: "Production Dashboard"
3. Add environment:
   - Variable: `baseUrl` = `http://localhost:5000/api`
   - Variable: `token` = (will be set after login)
4. Import requests:
   - POST `{{baseUrl}}/auth/register`
   - POST `{{baseUrl}}/auth/login`
   - GET `{{baseUrl}}/auth/profile`
   - etc.

## Troubleshooting

### Database Connection Failed

**Error:** `Database connection failed`

**Solution:**
1. Check PostgreSQL is running: `pg_isready`
2. Verify credentials in `.env`
3. Check database exists: `psql -U postgres -l`
4. Test connection: `psql -U dashboard_user -d production_dashboard`

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::5000`

**Solution:**
1. Change PORT in `.env` to a different number (e.g., 5001)
2. Or stop the process using port 5000

### JWT Secret Error

**Error:** `JWT secret not defined`

**Solution:**
1. Make sure `JWT_SECRET` is set in `.env`
2. Use a strong random string (at least 32 characters)

### Migration Error

**Error:** `relation "users" already exists`

**Solution:**
1. Drop existing tables:
```sql
psql -U dashboard_user -d production_dashboard
DROP TABLE IF EXISTS order_logs, orders, products, users CASCADE;
\q
```
2. Run migration again: `npm run migrate`

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── models/          # Database models
│   ├── controllers/     # Request handlers
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions
│   └── server.js        # Express app
├── package.json
└── .env

database/
├── schema.sql          # Database structure
├── seed.sql            # Sample data
├── migrate.js          # Migration script
└── seed-runner.js      # Seed script
```

## Available Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get profile
- `PUT /api/auth/password` - Update password
- `GET /api/auth/verify` - Verify token
- `POST /api/auth/logout` - Logout

### Users (Admin only)
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `PATCH /api/users/:id/deactivate` - Deactivate user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/:id/statistics` - User stats

## Next Steps

1. ✅ Backend API is running
2. 📝 Read the full API documentation: `docs/api/API_DOCUMENTATION.md`
3. 🧪 Test all endpoints with Postman
4. 🚀 Move to Sprint 2: Build the frontend
5. 📊 Implement product and order endpoints

## Support

For issues or questions:
1. Check `docs/sprints/sprint-1.md` for detailed documentation
2. Review error messages in the console
3. Check database logs: `tail -f /var/log/postgresql/postgresql.log`

---

**Ready to start building!** 🚀

The backend is now set up and ready for development. You can proceed with Sprint 2 to build the frontend or continue adding more backend features.
