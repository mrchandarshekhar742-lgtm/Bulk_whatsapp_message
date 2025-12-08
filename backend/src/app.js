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

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}));

// Rate limiting
const globalWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW || 15, 10) * 60 * 1000;
const defaultGlobalMax = process.env.NODE_ENV === 'development' ? 1000 : 100;
const globalLimiter = rateLimit({
  windowMs: globalWindowMs,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || defaultGlobalMax, 10),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip });
  next();
});

// ============================================================================
// ROUTES
// ============================================================================

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Excel routes
app.use('/api/excel', excelRoutes);

// Device routes
app.use('/api/devices', deviceRoutes);

// Campaign routes
app.use('/api/campaigns', campaignRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
