require('dotenv').config();
const app = require('./src/app');
const { sequelize } = require('./src/models');
const logger = require('./src/utils/logger');
const DeviceWebSocketManager = require('./src/services/DeviceWebSocketManager');

const PORT = process.env.APP_PORT || 5000;

// Sync database
// By default we don't alter the DB schema automatically. For dev schema changes,
// set ENABLE_DB_ALTER=true in your .env explicitly when needed. This avoids hitting
// DB limits unexpectedly during development.
const enableDbAlter = (process.env.ENABLE_DB_ALTER === 'true');
sequelize.sync({ alter: enableDbAlter })
  .then(() => {
    logger.info('✓ Database synced');
  })
  .catch((err) => {
    logger.error('Database sync failed', { error: err.message ?? err });
    // For development we don't want the server to exit just because sync altered failed; log and continue.
  });

// Start server - bind to 0.0.0.0 to allow access from any interface (localhost, 192.168.x.x, etc)
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Server running on http://0.0.0.0:${PORT}`);
  logger.info(`🌐 Accessible at: http://localhost:${PORT} (local)`);
  logger.info(`🌐 Accessible at: http://192.168.1.100:${PORT} (network)`);
  logger.info(`📱 For Android emulator: ws://10.0.2.2:${PORT}`);
  
  // Initialize WebSocket for device connections
  DeviceWebSocketManager.initialize(server);
  DeviceWebSocketManager.startHeartbeat();
  logger.info(`✓ Device WebSocket server initialized on ws://0.0.0.0:${PORT}/ws/device`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Unhandled promise rejection
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', reason);
  console.error('Unhandled Rejection Details:', reason);
});

module.exports = server;
