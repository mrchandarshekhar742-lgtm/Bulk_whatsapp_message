require('dotenv').config();
const app = require('./src/app');
const { sequelize } = require('./src/models');
const logger = require('./src/utils/logger');
const DeviceWebSocketManager = require('./src/services/DeviceWebSocketManager');

const PORT = process.env.APP_PORT || 5000;

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  logger.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

// Test database connection before starting server
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('✓ Database connection successful');

    // Sync database
    const enableDbAlter = (process.env.ENABLE_DB_ALTER === 'true');
    await sequelize.sync({ alter: enableDbAlter });
    logger.info('✓ Database synced');

    // Start server
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Server running on http://0.0.0.0:${PORT}`);
      logger.info(`🌐 Accessible at: http://localhost:${PORT} (local)`);
      logger.info(`🌐 Accessible at: http://192.168.1.100:${PORT} (network)`);
      logger.info(`📱 For Android emulator: ws://10.0.2.2:${PORT}`);
      
      // Initialize WebSocket for device connections
      try {
        DeviceWebSocketManager.initialize(server);
        DeviceWebSocketManager.startHeartbeat();
        logger.info(`✓ Device WebSocket server initialized on ws://0.0.0.0:${PORT}/ws/device`);
      } catch (wsError) {
        logger.error('WebSocket initialization failed:', wsError);
      }
    });

    // Graceful shutdown handlers
    const gracefulShutdown = (signal) => {
      logger.info(`${signal} received, shutting down gracefully...`);
      server.close(async () => {
        try {
          await sequelize.close();
          logger.info('Database connection closed');
        } catch (error) {
          logger.error('Error closing database:', error);
        }
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Unhandled promise rejection
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection:', { reason, promise });
      console.error('Unhandled Rejection Details:', reason);
    });

    // Uncaught exception
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      console.error('Uncaught Exception Details:', error);
      process.exit(1);
    });

    return server;

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer().catch((error) => {
  logger.error('Server startup failed:', error);
  process.exit(1);
});

module.exports = { startServer };
