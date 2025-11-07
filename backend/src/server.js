require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const odooRoutes = require('./routes/odooRoutes');
const syncRoutes = require('./routes/syncRoutes');

// Import middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Import database configuration
const connectDB = require('./config/database');

// Import Odoo scheduler
const odooScheduler = require('./services/odooScheduler');

// Initialize express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/odoo', odooRoutes);
app.use('/api/sync', syncRoutes);

// Welcome route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Production Orders Monitoring Dashboard API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      products: '/api/products',
      orders: '/api/orders',
      analytics: '/api/analytics',
      odoo: '/api/odoo',
      sync: '/api/sync',
    },
  });
});

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

// Server configuration
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';

// Connect to MongoDB and start server
const startServer = async () => {
  // Connect to MongoDB first
  await connectDB();
  
  // Then start the server
  const server = app.listen(PORT, HOST, () => {
    console.log('\n🚀 Production Orders Dashboard API');
    console.log('=====================================');
    console.log(`📡 Server running on http://${HOST}:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
    console.log('=====================================\n');
    
    // Start Odoo auto-sync scheduler (if enabled)
    try {
      odooScheduler.start();
    } catch (error) {
      console.error('[ODOO SCHEDULER] Failed to start:', error.message);
    }
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    odooScheduler.stop(); // Stop scheduler
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('\nSIGINT signal received: closing HTTP server');
    odooScheduler.stop(); // Stop scheduler
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });
};

// Start the application
startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

module.exports = app;
