# Production Orders Monitoring Dashboard

A full-stack web application for simulating SAP PP (Production Planning) functionality, enabling production order management, real-time monitoring, and productivity analytics.

## 🚀 Project Status

- ✅ **Sprint 0:** Complete README and project setup
- ✅ **Sprint 1:** Database schema, authentication, user management
- ✅ **Sprint 2:** Production orders management (JUST COMPLETED!)
- 🔜 **Sprint 3:** Frontend development (Next)

### Quick Links
- 📖 [Sprint 2 Complete Summary](./SPRINT_2_COMPLETE.md)
- 📖 [Sprint 2 API Documentation](./docs/api/SPRINT_2_API.md)
- 📖 [Quick Start Guide](./QUICK_START.md)
- 📖 [Full API Documentation](./docs/api/API_DOCUMENTATION.md)

## 🎯 Project Vision

This application provides a comprehensive solution for managing production operations, from order creation to completion tracking. It simulates key SAP PP functionalities in a modern, user-friendly interface, allowing different user roles to collaborate efficiently in a production environment.

## 📋 Project Scope

The Production Orders Monitoring Dashboard is designed to:
- Simulate core SAP Production Planning (PP) module workflows
- Enable multi-role user management (Admin, Production Manager, Worker)
- Provide real-time production order tracking and status updates
- Generate actionable KPIs and productivity statistics
- Offer visual analytics through interactive charts and dashboards

## ✨ Key Features

### 🔐 Authentication & Authorization
- Role-based access control (RBAC)
- Secure login/logout functionality
- User session management
- Password encryption and security

### 📊 Production Order Management
- Create, read, update, and delete production orders
- Order status tracking (Planned, In Progress, Completed, Cancelled)
- Priority assignment and deadline management
- Material and resource allocation
- Order history and audit trails

### 👥 Multi-Role User Interface

**Admin:**
- User management (create, edit, delete users)
- System configuration and settings
- Full access to all production orders
- Generate system-wide reports

**Production Manager:**
- Create and assign production orders
- Monitor all ongoing production activities
- View comprehensive KPIs and analytics
- Approve/reject order modifications
- Resource allocation and planning

**Worker:**
- View assigned production orders
- Update order status and progress
- Log production quantities and time
- Report issues and delays
- View personal productivity metrics

### 📈 Analytics & Reporting
- Real-time KPI dashboard
- Production efficiency metrics
- Order completion rates
- Resource utilization statistics
- Time tracking and analysis
- Customizable date range filtering
- Export reports to CSV/PDF

### 📉 Key Performance Indicators (KPIs)
- Total orders vs. completed orders
- Average production time per order
- On-time delivery percentage
- Worker productivity rates
- Material consumption efficiency
- Order backlog analysis

## 🛠️ Technology Stack

### Frontend
- **React** (v18+) - UI framework
- **React Router** - Navigation and routing
- **Axios** - HTTP client for API calls
- **Chart.js** / **React-Chartjs-2** - Data visualization
- **CSS3** / **Styled Components** - Styling
- **Material-UI** or **Bootstrap** - Component library (optional)

### Backend
- **Node.js** (v16+) - Runtime environment
- **Express.js** - Web framework
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variable management

### Database
- **PostgreSQL** (v13+) - Relational database
- **pg** / **node-postgres** - PostgreSQL client for Node.js
- **Database migrations** - Schema version control

### Development Tools
- **Git** - Version control
- **Postman** - API testing
- **pgAdmin** - Database management
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 👤 User Personas

### 1. Admin - System Administrator
**Name:** Sarah Admin  
**Role:** System Administrator  
**Goals:**
- Maintain system integrity and security
- Manage user accounts and permissions
- Monitor overall system performance
- Generate compliance reports

**Pain Points:**
- Need centralized user management
- Require audit trails for accountability
- Need to quickly identify system issues

### 2. Production Manager - Operations Lead
**Name:** Michael Manager  
**Role:** Production Manager  
**Goals:**
- Optimize production scheduling
- Meet delivery deadlines
- Maximize resource utilization
- Monitor team performance

**Pain Points:**
- Difficulty tracking multiple orders simultaneously
- Lack of real-time production visibility
- Manual reporting is time-consuming
- Bottleneck identification challenges

### 3. Worker - Production Floor Operator
**Name:** John Worker  
**Role:** Production Worker  
**Goals:**
- Complete assigned orders efficiently
- Understand priorities clearly
- Report progress accurately
- Achieve productivity targets

**Pain Points:**
- Unclear order priorities
- Manual time logging is tedious
- Difficulty reporting issues
- Limited visibility of own performance

## 🔄 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (React App)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Login Page  │  │  Dashboard   │  │  Analytics   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/HTTPS (REST API)
                             │ JSON + JWT Token
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    SERVER (Express.js)                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   API Routes Layer                        │   │
│  │  /auth  /users  /orders  /analytics  /reports            │   │
│  └────────────────────────┬─────────────────────────────────┘   │
│                           │                                      │
│  ┌────────────────────────┴─────────────────────────────────┐   │
│  │              Middleware Layer                             │   │
│  │  Authentication │ Authorization │ Validation │ Logging    │   │
│  └────────────────────────┬─────────────────────────────────┘   │
│                           │                                      │
│  ┌────────────────────────┴─────────────────────────────────┐   │
│  │              Business Logic Layer                         │   │
│  │  Controllers │ Services │ Validators │ Utils              │   │
│  └────────────────────────┬─────────────────────────────────┘   │
└───────────────────────────┼──────────────────────────────────────┘
                            │ SQL Queries
                            │ pg (node-postgres)
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE (PostgreSQL)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  users   │  │  orders  │  │  logs    │  │ analytics│        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │  roles   │  │materials │  │resources │                      │
│  └──────────┘  └──────────┘  └──────────┘                      │
└─────────────────────────────────────────────────────────────────┘

Data Flow:
1. User authenticates → Server validates → JWT issued
2. User requests data → Server validates JWT → Query database
3. Database returns data → Server processes → Client renders
4. User creates/updates order → Server validates → Database persists
5. Analytics engine aggregates data → Server computes KPIs → Client visualizes
```

## 🗄️ Database Schema Overview

### Users Table
- id (PK), username, email, password_hash, role, created_at, updated_at

### Production Orders Table
- id (PK), order_number, product_name, quantity, status, priority, assigned_to (FK), created_by (FK), start_date, end_date, deadline, created_at, updated_at

### Order Logs Table
- id (PK), order_id (FK), user_id (FK), action, details, timestamp

### Materials Table
- id (PK), material_name, quantity_available, unit

### Resources Table
- id (PK), resource_name, status, capacity

## 🚀 Setup Instructions

### Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v16 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version` and `npm --version`

2. **PostgreSQL** (v13 or higher)
   - Download from: https://www.postgresql.org/download/
   - Verify installation: `psql --version`

3. **Git**
   - Download from: https://git-scm.com/
   - Verify installation: `git --version`

4. **Code Editor** (recommended: VS Code)
   - Download from: https://code.visualstudio.com/

### Installation Steps

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/production_orders_monitoring_dashboard.git
cd production_orders_monitoring_dashboard
```

#### 2. Database Setup

**Create PostgreSQL Database:**

```bash
# Open PostgreSQL shell
psql -U postgres

# In PostgreSQL shell, create database
CREATE DATABASE production_dashboard;

# Create a user (optional but recommended)
CREATE USER dashboard_user WITH PASSWORD 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE production_dashboard TO dashboard_user;

# Exit PostgreSQL shell
\q
```

**Run Database Migrations:**

```bash
# Navigate to backend directory
cd backend

# Run migration scripts (will be created in later sprints)
npm run migrate
```

#### 3. Backend Setup

```bash
# From project root, navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file
# Copy .env.example to .env and configure
cp .env.example .env

# Edit .env with your configuration:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=production_dashboard
# DB_USER=dashboard_user
# DB_PASSWORD=your_secure_password
# JWT_SECRET=your_jwt_secret_key
# PORT=5000

# Start the development server
npm run dev
```

The backend server should now be running on `http://localhost:5000`

#### 4. Frontend Setup

```bash
# From project root, navigate to frontend
cd frontend

# Install dependencies
npm install

# Create .env file
# Copy .env.example to .env and configure
cp .env.example .env

# Edit .env with your configuration:
# REACT_APP_API_URL=http://localhost:5000

# Start the development server
npm start
```

The frontend application should now be running on `http://localhost:3000`

### 5. Verify Installation

1. Open your browser and navigate to `http://localhost:3000`
2. You should see the login page
3. Test API connection by checking `http://localhost:5000/health` (if health endpoint exists)

## 📁 Project Structure

```
production_orders_monitoring_dashboard/
│
├── frontend/                      # React application
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   │   ├── common/            # Buttons, inputs, modals
│   │   │   ├── auth/              # Login, register forms
│   │   │   ├── dashboard/         # Dashboard widgets
│   │   │   ├── orders/            # Order list, form, details
│   │   │   └── analytics/         # Charts, KPI cards
│   │   ├── pages/                 # Page components
│   │   │   ├── LoginPage.js
│   │   │   ├── DashboardPage.js
│   │   │   ├── OrdersPage.js
│   │   │   ├── AnalyticsPage.js
│   │   │   └── UsersPage.js
│   │   ├── services/              # API calls
│   │   │   ├── authService.js
│   │   │   ├── orderService.js
│   │   │   └── analyticsService.js
│   │   ├── context/               # React Context API
│   │   │   └── AuthContext.js
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── utils/                 # Helper functions
│   │   ├── styles/                # CSS/styled components
│   │   ├── App.js                 # Main app component
│   │   └── index.js               # Entry point
│   ├── package.json
│   └── .env.example
│
├── backend/                       # Express.js application
│   ├── src/
│   │   ├── config/                # Configuration files
│   │   │   ├── database.js        # DB connection
│   │   │   └── auth.js            # JWT config
│   │   ├── middleware/            # Express middleware
│   │   │   ├── auth.js            # JWT verification
│   │   │   ├── authorize.js       # Role-based access
│   │   │   └── errorHandler.js    # Error handling
│   │   ├── routes/                # API routes
│   │   │   ├── authRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── orderRoutes.js
│   │   │   └── analyticsRoutes.js
│   │   ├── controllers/           # Route handlers
│   │   │   ├── authController.js
│   │   │   ├── userController.js
│   │   │   ├── orderController.js
│   │   │   └── analyticsController.js
│   │   ├── models/                # Database models
│   │   │   ├── User.js
│   │   │   ├── Order.js
│   │   │   └── OrderLog.js
│   │   ├── services/              # Business logic
│   │   │   ├── authService.js
│   │   │   ├── orderService.js
│   │   │   └── analyticsService.js
│   │   ├── utils/                 # Helper functions
│   │   │   ├── validators.js
│   │   │   └── helpers.js
│   │   └── server.js              # Express app setup
│   ├── migrations/                # Database migrations
│   ├── seeds/                     # Seed data
│   ├── package.json
│   └── .env.example
│
├── database/                      # Database scripts
│   ├── schema.sql                 # Database schema
│   ├── seed.sql                   # Initial data
│   └── migrations/                # Migration files
│
├── docs/                          # Documentation
│   ├── api/                       # API documentation
│   ├── architecture/              # System architecture
│   ├── sprints/                   # Sprint documentation
│   │   ├── sprint-1.md
│   │   ├── sprint-2.md
│   │   └── ...
│   └── user-stories/              # User stories
│
├── .gitignore
├── README.md
└── package.json                   # Root package.json (optional)
```

## 🏃‍♂️ Running the Application

### Development Mode

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm start
```

### Production Mode

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
# Serve the build folder using a static server
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Run all tests
npm run test:all
```

## 📅 Agile Backlog Organization

This project follows Agile methodology with sprint-based development:

### Sprint Structure

- **Sprint 0:** Vision & Setup (✅ Current)
- **Sprint 1:** Database Schema & Backend Foundation
- **Sprint 2:** Authentication & User Management
- **Sprint 3:** Production Orders CRUD
- **Sprint 4:** Role-Based UI & Authorization
- **Sprint 5:** Analytics & KPIs
- **Sprint 6:** Testing, Refinement & Deployment

### User Roles

- **Product Owner:** Defines features and priorities
- **Developer:** Implements features (full-stack)
- **QA Tester:** Tests functionality and reports bugs
- **End Users:** Admin, Production Manager, Worker

### User Stories Location

Detailed user stories for each sprint can be found in:
- `docs/sprints/sprint-[number].md` - Sprint-specific documentation
- `docs/user-stories/` - Comprehensive user story repository

### Example User Stories

**As an Admin:**
- I want to create user accounts so that team members can access the system
- I want to assign roles to users so that they have appropriate permissions

**As a Production Manager:**
- I want to create production orders so that workers know what to produce
- I want to view analytics so that I can optimize production efficiency

**As a Worker:**
- I want to see my assigned orders so that I know what tasks to complete
- I want to update order status so that managers can track progress

## 🤝 Contributing

This is a solo project, but contributions and suggestions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📧 Contact

Project Link: [https://github.com/yourusername/production_orders_monitoring_dashboard](https://github.com/yourusername/production_orders_monitoring_dashboard)

## 🙏 Acknowledgments

- Inspired by SAP PP (Production Planning) module
- React documentation and community
- Express.js best practices
- PostgreSQL documentation
- Chart.js for visualization capabilities

---

## 🎉 Sprint 1 Completed!

### ✅ What's Done:
- **Database Schema**: PostgreSQL tables for Users, Products, Orders, and Order Logs
- **Backend API**: Node.js/Express REST API with JWT authentication
- **Authentication System**: User registration, login, password hashing with bcrypt
- **Authorization**: Role-based access control (Admin, Manager, Worker)
- **Validation**: Input validation and error handling middleware
- **Documentation**: Full API documentation and setup guides

### � Quick Links:
- **[Quick Start Guide](QUICK_START.md)** - Get up and running in 5 minutes
- **[API Documentation](docs/api/API_DOCUMENTATION.md)** - Complete API reference
- **[Sprint 1 Details](docs/sprints/sprint-1.md)** - What was built in Sprint 1

### 🚀 Ready to Use:
```bash
# Install dependencies
cd backend && npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Run migration
npm run migrate

# Start server
npm run dev
```

Server will be running at `http://localhost:5000`

---

**Status:** 🚀 Sprint 1 Complete - Backend API Ready  
**Last Updated:** November 3, 2025  
**Current Sprint:** Sprint 1 - Data Modeling & Authentication ✅  
**Next Sprint:** Sprint 2 - Product & Order Endpoints
