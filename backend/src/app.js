const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const excelRoutes = require('./routes/excel.routes');
const deviceRoutes = require('./routes/device.routes');
const campaignRoutes = require('./routes/campaign.routes');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();

/* ============================================================================
   IMPORTANT FOR NGINX + HTTPS
============================================================================ */
app.set('trust proxy', 1);

/* ============================================================================
   SECURITY
============================================================================ */
app.use(helmet());

/* ============================================================================
   CORS CONFIG (PUBLIC + LOCAL)
============================================================================ */
const allowedOrigins = [
  'https://wxon.in',
  'https://www.wxon.in',
  'http://localhost:5173',
  'http://localhost:5174',
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow server-to-server / curl / postman
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS not allowed from this origin'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

/* ============================================================================
   RATE LIMITING
============================================================================ */
const globalWindowMs =
  parseInt(process.env.RATE_LIMIT_WINDOW || 15, 10) * 60 * 1000;

const defaultGlobalMax =
  process.env.NODE_ENV === 'development' ? 2000 : 1000; // Increased from 300 to 1000

const globalLimiter = rateLimit({
  windowMs: globalWindowMs,
  max: parseInt(
    process.env.RATE_LIMIT_MAX_REQUESTS || defaultGlobalMax,
    10
  ),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests, please try again later.',
  },
  // Skip rate limiting for dashboard API calls
  skip: (req) => {
    // Skip for dashboard endpoints
    const dashboardEndpoints = ['/api/campaigns/stats', '/api/devices', '/api/campaigns/logs'];
    return dashboardEndpoints.some(endpoint => req.path.startsWith(endpoint));
  },
});

app.use(globalLimiter);

/* ============================================================================
   BODY PARSERS
============================================================================ */
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

/* ============================================================================
   REQUEST LOGGING
============================================================================ */
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
  next();
});

/* ============================================================================
   ROUTES
============================================================================ */
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const { sequelize } = require('./models');
    await sequelize.authenticate();
    
    res.json({
      status: 'ok',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      database: 'connected',
      port: process.env.APP_PORT || 5000,
    });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      status: 'error',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message,
    });
  }
});

// Database test endpoint
app.get('/api/test/db', async (req, res) => {
  try {
    const { sequelize, User, Device, ExcelRecord } = require('./models');
    
    // Test connection
    await sequelize.authenticate();
    
    // Test table access
    const userCount = await User.count();
    const deviceCount = await Device.count();
    const excelCount = await ExcelRecord.count();
    
    res.json({
      success: true,
      database: 'connected',
      tables: {
        users: userCount,
        devices: deviceCount,
        excel_records: excelCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Database test failed', { error: error.message });
    res.status(503).json({
      success: false,
      database: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/excel', excelRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/campaigns', campaignRoutes);

/* ============================================================================
   404 HANDLER
============================================================================ */
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

/* ============================================================================
   GLOBAL ERROR HANDLER
============================================================================ */
app.use(errorHandler);

module.exports = app;
