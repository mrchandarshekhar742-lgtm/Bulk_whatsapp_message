const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { body, param, query, validationResult } = require('express-validator');
const { Device, DeviceLog, DeviceCommand, ExcelRecord } = require('../models');
const { verifyToken } = require('../middleware/auth');
const DeviceWebSocketManager = require('../services/DeviceWebSocketManager');
const DeviceRotationEngine = require('../services/DeviceRotationEngine');
const { sanitizeMessage, sanitizePhoneNumber, sanitizeName } = require('../utils/sanitizer');
const { Op } = require('sequelize');

// Rate limiting for campaign creation
const campaignCreateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each user to 10 campaign creations per windowMs
  message: {
    error: 'Too many campaigns created, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// ============================================================================
// 1. CREATE CAMPAIGN (Device-Based)
// ============================================================================
router.post('/',
  campaignCreateLimiter,
  verifyToken,
  [
    body('name').notEmpty().withMessage('Campaign name is required'),
    body('excel_record_id').isInt().withMessage('Excel record ID is required'),
    body('message_template').notEmpty().withMessage('Message template is required'),
    body('device_ids').isArray({ min: 1 }).withMessage('At least one device must be selected'),
    body('rotation_mode').optional().isIn(['SMART_ROTATION', 'RANDOM', 'ROUND_ROBIN', 'LEAST_USED', 'WARMUP_AWARE']),
  ],
  validate,
  async (req, res) => {
    try {
      const { name, excel_record_id, message_template, device_ids, rotation_mode = 'SMART_ROTATION' } = req.body;

      // Sanitize inputs
      const sanitizedName = sanitizeName(name);
      const sanitizedMessage = sanitizeMessage(message_template);
      
      if (!sanitizedName || !sanitizedMessage) {
        return res.status(400).json({ error: 'Invalid campaign name or message content' });
      }

      // Verify Excel record belongs to user
      const excelRecord = await ExcelRecord.findOne({
        where: {
          id: excel_record_id,
          user_id: req.user.id,
        },
      });

      if (!excelRecord) {
        return res.status(404).json({ error: 'Excel record not found' });
      }

      // Verify devices belong to user and are available
      const devices = await Device.findAll({
        where: {
          id: { [Op.in]: device_ids },
          user_id: req.user.id,
          is_active: true,
        },
      });

      if (devices.length === 0) {
        return res.status(400).json({ error: 'No valid devices selected' });
      }

      // Get recipients from Excel
      const recipients = excelRecord.rows || [];
      
      if (recipients.length === 0) {
        return res.status(400).json({ error: 'Excel file has no recipients' });
      }

      // Distribute messages across devices
      const distribution = await DeviceRotationEngine.distributeMessages(
        device_ids,
        recipients.length,
        rotation_mode
      );

      // Create campaign record (simplified - you can expand this)
      const campaign = {
        id: Date.now(), // Temporary ID
        name: sanitizedName, // Use sanitized name
        excel_record_id,
        message_template: sanitizedMessage, // Use sanitized message
        device_ids,
        rotation_mode,
        total_recipients: recipients.length,
        distribution,
        status: 'QUEUED',
        created_at: new Date(),
      };

      // Queue messages to devices with per-device delay management
      let assignedIndex = 0;
      const deviceIdsList = Object.keys(distribution);
      const deviceDelayTracker = new Map(); // Track cumulative delay per device

      for (const recipient of recipients) {
        // Select device based on rotation
        const deviceId = await DeviceRotationEngine.selectDevice(device_ids, rotation_mode);

        // Replace variables in message template
        let message = sanitizedMessage; // Use sanitized message
        Object.keys(recipient).forEach(key => {
          message = message.replace(new RegExp(`{{${key}}}`, 'g'), recipient[key] || '');
        });

        // Get phone number from recipient and sanitize it
        const rawPhoneNumber = recipient.phone || recipient.Phone || recipient.number || recipient.Number;
        const phoneNumber = sanitizePhoneNumber(rawPhoneNumber);

        if (!phoneNumber) {
          console.warn('Recipient has invalid phone number:', recipient);
          continue;
        }

        // Create device log
        await DeviceLog.create({
          device_id: deviceId,
          excel_record_id: excel_record_id,
          excel_row_index: assignedIndex,
          recipient_number: phoneNumber,
          message_content: message,
          status: 'QUEUED',
        });

        // Create device command
        const command = await DeviceCommand.create({
          device_id: deviceId,
          command_type: 'SEND_MESSAGE',
          payload: {
            recipient_number: phoneNumber,
            message: message,
            campaign_name: sanitizedName, // Use sanitized name
          },
          priority: 5,
        });

        // Send command with per-device delay management
        if (DeviceWebSocketManager.isDeviceOnline(deviceId)) {
          // Get current delay for this device (starts at 0)
          let currentDeviceDelay = deviceDelayTracker.get(deviceId) || 0;
          
          // Generate random delay between 2-10 seconds for this message
          const randomDelaySeconds = Math.floor(Math.random() * 9) + 2; // 2-10 seconds
          
          // If device is being reused, add extra delay to prevent spam detection
          if (currentDeviceDelay > 0) {
            const extraDelay = Math.floor(Math.random() * 8) + 5; // 5-12 seconds extra for reused device
            currentDeviceDelay += extraDelay * 1000;
          }
          
          // Add base delay
          currentDeviceDelay += randomDelaySeconds * 1000;
          
          // Update tracker
          deviceDelayTracker.set(deviceId, currentDeviceDelay);
          
          setTimeout(async () => {
            await DeviceWebSocketManager.sendCommand(deviceId, command);
          }, currentDeviceDelay);
        }

        assignedIndex++;
        
        // Add small delay between queuing messages to spread the load
        if (assignedIndex < recipients.length) {
          const queueDelay = Math.floor(Math.random() * 2) + 1; // 1-2 seconds between queue operations
          await new Promise(resolve => setTimeout(resolve, queueDelay * 1000));
        }
      }

      res.status(201).json({
        success: true,
        campaign,
        message: `Campaign created successfully. ${recipients.length} messages queued across ${deviceIdsList.length} devices.`,
        distribution,
      });

    } catch (error) {
      console.error('Error creating campaign:', error);
      res.status(500).json({ 
        error: 'Failed to create campaign',
        details: error.message,
      });
    }
  }
);

// ============================================================================
// 2. CREATE MANUAL CAMPAIGN (Without Excel)
// ============================================================================
router.post('/manual',
  campaignCreateLimiter,
  verifyToken,
  [
    body('name').notEmpty().withMessage('Campaign name is required'),
    body('phone_numbers').isArray({ min: 1 }).withMessage('At least one phone number is required'),
    body('message').notEmpty().withMessage('Message is required'),
    body('device_ids').isArray({ min: 1 }).withMessage('At least one device must be selected'),
    body('rotation_mode').optional().isIn(['SMART_ROTATION', 'RANDOM', 'ROUND_ROBIN', 'LEAST_USED', 'WARMUP_AWARE']),
  ],
  validate,
  async (req, res) => {
    try {
      const { name, phone_numbers, message, device_ids, rotation_mode = 'SMART_ROTATION' } = req.body;

      // Sanitize inputs
      const sanitizedName = sanitizeName(name);
      const sanitizedMessage = sanitizeMessage(message);
      
      if (!sanitizedName || !sanitizedMessage) {
        return res.status(400).json({ error: 'Invalid campaign name or message content' });
      }

      // Verify devices belong to user and are available
      const devices = await Device.findAll({
        where: {
          id: { [Op.in]: device_ids },
          user_id: req.user.id,
          is_active: true,
        },
      });

      if (devices.length === 0) {
        return res.status(400).json({ error: 'No valid devices selected' });
      }

      // Validate and sanitize phone numbers
      const validNumbers = phone_numbers
        .map(num => sanitizePhoneNumber(num))
        .filter(num => num !== null);
      
      if (validNumbers.length === 0) {
        return res.status(400).json({ error: 'No valid phone numbers provided' });
      }

      // Distribute messages across devices
      const distribution = await DeviceRotationEngine.distributeMessages(
        device_ids,
        validNumbers.length,
        rotation_mode
      );

      // Create campaign record
      const campaign = {
        id: Date.now(),
        name: sanitizedName, // Use sanitized name
        type: 'MANUAL',
        message: sanitizedMessage, // Use sanitized message
        device_ids,
        rotation_mode,
        total_recipients: validNumbers.length,
        distribution,
        status: 'QUEUED',
        created_at: new Date(),
      };

      // Queue messages to devices with per-device delay management
      let queuedCount = 0;
      const deviceDelayTracker = new Map(); // Track cumulative delay per device

      for (const phoneNumber of validNumbers) {
        // Select device based on rotation
        const deviceId = await DeviceRotationEngine.selectDevice(device_ids, rotation_mode);

        // Create device log
        await DeviceLog.create({
          device_id: deviceId,
          excel_record_id: null, // Manual campaign
          excel_row_index: queuedCount,
          recipient_number: phoneNumber, // Already sanitized
          message_content: sanitizedMessage, // Use sanitized message
          status: 'QUEUED',
        });

        // Create device command
        const command = await DeviceCommand.create({
          device_id: deviceId,
          command_type: 'SEND_MESSAGE',
          payload: {
            recipient_number: phoneNumber, // Already sanitized
            message: sanitizedMessage, // Use sanitized message
            campaign_name: sanitizedName, // Use sanitized name
          },
          priority: 5,
        });

        // Send command with per-device delay management
        if (DeviceWebSocketManager.isDeviceOnline(deviceId)) {
          // Get current delay for this device (starts at 0)
          let currentDeviceDelay = deviceDelayTracker.get(deviceId) || 0;
          
          // Generate random delay between 2-10 seconds for this message
          const randomDelaySeconds = Math.floor(Math.random() * 9) + 2; // 2-10 seconds
          
          // If device is being reused, add extra delay to prevent spam detection
          if (currentDeviceDelay > 0) {
            const extraDelay = Math.floor(Math.random() * 8) + 5; // 5-12 seconds extra for reused device
            currentDeviceDelay += extraDelay * 1000;
          }
          
          // Add base delay
          currentDeviceDelay += randomDelaySeconds * 1000;
          
          // Update tracker
          deviceDelayTracker.set(deviceId, currentDeviceDelay);
          
          setTimeout(async () => {
            await DeviceWebSocketManager.sendCommand(deviceId, command);
          }, currentDeviceDelay);
        }

        queuedCount++;
        
        // Add small delay between queuing messages to spread the load
        if (queuedCount < validNumbers.length) {
          const queueDelay = Math.floor(Math.random() * 2) + 1; // 1-2 seconds between queue operations
          await new Promise(resolve => setTimeout(resolve, queueDelay * 1000));
        }
      }

      res.status(201).json({
        success: true,
        campaign,
        message: `Manual campaign created successfully. ${queuedCount} messages queued across ${devices.length} devices.`,
        distribution,
      });

    } catch (error) {
      console.error('Error creating manual campaign:', error);
      res.status(500).json({ 
        error: 'Failed to create manual campaign',
        details: error.message,
      });
    }
  }
);

// ============================================================================
// 3. GET CAMPAIGN LOGS
// ============================================================================
router.get('/logs',
  verifyToken,
  [
    query('excel_record_id').optional().isInt().withMessage('Excel record ID must be an integer'),
    query('device_id').optional().isInt().withMessage('Device ID must be an integer'),
    query('status').optional().isIn(['QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'PENDING']).withMessage('Invalid status'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Filter out errors for empty values - allow empty strings for optional parameters
      const significantErrors = errors.array().filter(error => {
        const value = req.query[error.param];
        // Allow empty strings, null, undefined for optional parameters
        if (value === '' || value === undefined || value === null) {
          return false;
        }
        // For numeric fields, also check if it's a valid number when not empty
        if (['excel_record_id', 'device_id', 'page', 'limit'].includes(error.param)) {
          const numValue = parseInt(value, 10);
          if (isNaN(numValue)) {
            return true; // Keep this error - invalid number
          }
        }
        return true;
      });
      
      if (significantErrors.length > 0) {
        return res.status(400).json({ 
          errors: significantErrors,
          message: 'Validation failed',
          received_params: req.query
        });
      }
    }
    next();
  },
  async (req, res) => {
    try {
      const { excel_record_id, device_id, status, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      // Build where clause
      const where = {};
      
      // Only add filters if they have actual values (not empty strings)
      if (excel_record_id && excel_record_id !== '') {
        where.excel_record_id = parseInt(excel_record_id);
      }
      
      if (device_id && device_id !== '') {
        // Verify device belongs to user
        const device = await Device.findOne({
          where: { id: parseInt(device_id), user_id: req.user.id },
        });
        if (!device) {
          return res.status(404).json({ error: 'Device not found' });
        }
        where.device_id = parseInt(device_id);
      }
      
      if (status && status !== '') {
        where.status = status;
      }

      // If no device_id specified, get all user's devices
      if (!device_id || device_id === '') {
        const userDevices = await Device.findAll({
          where: { user_id: req.user.id },
          attributes: ['id'],
        });
        
        if (userDevices.length === 0) {
          return res.json({
            success: true,
            logs: [],
            pagination: {
              total: 0,
              page: parseInt(page),
              limit: parseInt(limit),
              totalPages: 0,
            },
          });
        }
        
        where.device_id = { [Op.in]: userDevices.map(d => d.id) };
      }

      const { count, rows: logs } = await DeviceLog.findAndCountAll({
        where,
        include: [
          {
            model: Device,
            attributes: ['id', 'device_label', 'phone_number'],
          },
          {
            model: ExcelRecord,
            attributes: ['id', 'file_name'],
            required: false, // LEFT JOIN for manual campaigns
          },
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset,
      });

      res.json({
        success: true,
        logs,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
        },
      });

    } catch (error) {
      console.error('Error fetching campaign logs:', error);
      res.status(500).json({ 
        error: 'Failed to fetch campaign logs',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// ============================================================================
// 4. GET CAMPAIGN STATISTICS
// ============================================================================
router.get('/stats',
  verifyToken,
  async (req, res) => {
    try {
      // Get all user's devices
      const userDevices = await Device.findAll({
        where: { user_id: req.user.id },
        attributes: ['id'],
      });

      const deviceIds = userDevices.map(d => d.id);

      if (deviceIds.length === 0) {
        return res.json({
          success: true,
          stats: {
            total_queued: 0,
            total_sent: 0,
            total_failed: 0,
            total_delivered: 0,
            devices_online: 0,
            devices_total: 0,
          },
        });
      }

      // Get counts by status
      const [queued, sent, failed, delivered] = await Promise.all([
        DeviceLog.count({ where: { device_id: { [Op.in]: deviceIds }, status: 'QUEUED' } }),
        DeviceLog.count({ where: { device_id: { [Op.in]: deviceIds }, status: 'SENT' } }),
        DeviceLog.count({ where: { device_id: { [Op.in]: deviceIds }, status: 'FAILED' } }),
        DeviceLog.count({ where: { device_id: { [Op.in]: deviceIds }, status: 'DELIVERED' } }),
      ]);

      const onlineDevices = await Device.count({
        where: { user_id: req.user.id, is_online: true },
      });

      res.json({
        success: true,
        stats: {
          total_queued: queued,
          total_sent: sent,
          total_failed: failed,
          total_delivered: delivered,
          devices_online: onlineDevices,
          devices_total: userDevices.length,
        },
      });

    } catch (error) {
      console.error('Error fetching campaign stats:', error);
      res.status(500).json({ error: 'Failed to fetch campaign stats' });
    }
  }
);

// ============================================================================
// 5. RETRY FAILED MESSAGES
// ============================================================================
router.post('/retry-failed',
  verifyToken,
  [
    body('device_id').optional().isInt(),
    body('excel_record_id').optional().isInt(),
  ],
  validate,
  async (req, res) => {
    try {
      const { device_id, excel_record_id } = req.body;

      const where = { status: 'FAILED' };

      if (device_id) {
        const device = await Device.findOne({
          where: { id: device_id, user_id: req.user.id },
        });
        if (!device) {
          return res.status(404).json({ error: 'Device not found' });
        }
        where.device_id = device_id;
      } else {
        // Get all user's devices
        const userDevices = await Device.findAll({
          where: { user_id: req.user.id },
          attributes: ['id'],
        });
        where.device_id = { [Op.in]: userDevices.map(d => d.id) };
      }

      if (excel_record_id) {
        where.excel_record_id = excel_record_id;
      }

      // Get failed logs
      const failedLogs = await DeviceLog.findAll({ where });

      if (failedLogs.length === 0) {
        return res.json({
          success: true,
          message: 'No failed messages to retry',
          retried_count: 0,
        });
      }

      // Retry each failed message with per-device delay management
      let retriedCount = 0;
      const deviceDelayTracker = new Map(); // Track cumulative delay per device for retries
      
      for (const log of failedLogs) {
        // Check if device can send
        const canSend = await DeviceRotationEngine.canDeviceSend(log.device_id);
        
        if (!canSend.canSend) {
          continue;
        }

        // Create new command
        const command = await DeviceCommand.create({
          device_id: log.device_id,
          command_type: 'SEND_MESSAGE',
          payload: {
            recipient_number: log.recipient_number,
            message: log.message_content,
          },
          priority: 3,
        });

        // Update log status
        await log.update({ status: 'QUEUED', error_message: null });

        // Send command with per-device delay management for retry
        if (DeviceWebSocketManager.isDeviceOnline(log.device_id)) {
          // Get current delay for this device (starts at 0)
          let currentDeviceDelay = deviceDelayTracker.get(log.device_id) || 0;
          
          // Generate random delay between 3-12 seconds for retry (slightly longer)
          const randomDelaySeconds = Math.floor(Math.random() * 10) + 3; // 3-12 seconds
          
          // If device is being reused for retry, add extra delay
          if (currentDeviceDelay > 0) {
            const extraDelay = Math.floor(Math.random() * 10) + 8; // 8-17 seconds extra for reused device retry
            currentDeviceDelay += extraDelay * 1000;
          }
          
          // Add base delay
          currentDeviceDelay += randomDelaySeconds * 1000;
          
          // Update tracker
          deviceDelayTracker.set(log.device_id, currentDeviceDelay);
          
          setTimeout(async () => {
            await DeviceWebSocketManager.sendCommand(log.device_id, command);
          }, currentDeviceDelay);
        }

        retriedCount++;
        
        // Add delay between retry operations
        if (retriedCount < failedLogs.length) {
          const retryDelay = Math.floor(Math.random() * 3) + 2; // 2-4 seconds between retries
          await new Promise(resolve => setTimeout(resolve, retryDelay * 1000));
        }
      }

      res.json({
        success: true,
        message: `${retriedCount} failed messages queued for retry`,
        retried_count: retriedCount,
        total_failed: failedLogs.length,
      });

    } catch (error) {
      console.error('Error retrying failed messages:', error);
      res.status(500).json({ error: 'Failed to retry messages' });
    }
  }
);

module.exports = router;
