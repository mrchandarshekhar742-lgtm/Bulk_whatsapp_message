const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { body, param, query, validationResult } = require('express-validator');
const { Device, DeviceLog, DeviceCommand, ExcelRecord, Campaign, DeviceCampaign } = require('../models');
const { verifyToken } = require('../middleware/auth');
const DeviceWebSocketManager = require('../services/DeviceWebSocketManager');
const DeviceRotationEngine = require('../services/DeviceRotationEngine');
const { sanitizeMessage, sanitizePhoneNumber, sanitizeName } = require('../utils/sanitizer');
const { Op } = require('sequelize');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/campaign.log' })
  ]
});

// Rate limiting for campaign creation - More lenient for testing
const campaignCreateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Increased from 10 to 50 campaigns per window
  message: {
    error: 'Too many campaigns created, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for localhost/development
    return req.ip === '127.0.0.1' || req.ip === '::1' || process.env.NODE_ENV === 'development';
  },
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
// 1. GET ALL CAMPAIGNS
// ============================================================================
router.get('/',
  verifyToken,
  async (req, res) => {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const offset = (page - 1) * limit;

      // Build where clause
      const where = { user_id: req.user.id };
      if (status) {
        where.status = status;
      }

      const { count, rows: campaigns } = await Campaign.findAndCountAll({
        where,
        include: [
          {
            model: ExcelRecord,
            attributes: ['id', 'file_name', 'total_rows'],
            required: false
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        campaigns,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      });

    } catch (error) {
      logger.error('Error fetching campaigns:', error);
      res.status(500).json({ 
        error: 'Failed to fetch campaigns',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

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

      // Create campaign record in database
      const campaignRecord = await Campaign.create({
        user_id: req.user.id,
        name: sanitizedName,
        description: `Excel campaign with ${recipients.length} recipients`,
        excel_record_id,
        campaign_type: 'STANDARD',
        status: 'RUNNING',
        message_content: sanitizedMessage,
        total_contacts: recipients.length,
        sent_count: 0,
        failed_count: 0,
        selected_devices: device_ids,
        rotation_mode,
        device_message_distribution: distribution,
      });

      // Create campaign object for response
      const campaign = {
        id: campaignRecord.id, // Use database ID
        name: sanitizedName,
        excel_record_id,
        message_template: sanitizedMessage,
        device_ids,
        rotation_mode,
        total_recipients: recipients.length,
        distribution,
        status: 'RUNNING',
        created_at: campaignRecord.created_at,
      };

      // Queue messages to devices - Process asynchronously to avoid timeout
      const deviceIdsList = Object.keys(distribution);
      const deviceDelayTracker = new Map(); // Track cumulative delay per device
      
      // Process messages in background to avoid request timeout
      setImmediate(async () => {
        let assignedIndex = 0;
        
        for (const recipient of recipients) {
          try {
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
              logger.warn('Recipient has invalid phone number:', recipient);
              assignedIndex++;
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
              
              // Generate random delay between 9-25 seconds for this message
              const randomDelaySeconds = Math.floor(Math.random() * 17) + 9; // 9-25 seconds
              
              // If device is being reused, add extra delay to prevent spam detection
              if (currentDeviceDelay > 0) {
                const extraDelay = Math.floor(Math.random() * 10) + 5; // 5-14 seconds extra for reused device
                currentDeviceDelay += extraDelay * 1000;
              }
              
              // Add base delay
              currentDeviceDelay += randomDelaySeconds * 1000;
              
              // Update tracker
              deviceDelayTracker.set(deviceId, currentDeviceDelay);
              
              setTimeout(async () => {
                try {
                  await DeviceWebSocketManager.sendCommand(deviceId, command);
                  logger.info(`Command sent to device ${deviceId} for ${phoneNumber}`);
                  
                  // Auto-update status to SENT after 30 seconds (assuming message was sent)
                  setTimeout(async () => {
                    try {
                      const log = await DeviceLog.findOne({
                        where: {
                          device_id: deviceId,
                          recipient_number: phoneNumber,
                          status: 'QUEUED'
                        }
                      });
                      
                      if (log) {
                        await log.update({
                          status: 'SENT',
                          sent_at: new Date()
                        });
                        logger.info(`Auto-updated status to SENT for ${phoneNumber}`);
                      }
                    } catch (err) {
                      logger.error(`Failed to auto-update status: ${err.message}`);
                    }
                  }, 30000); // 30 seconds after command sent
                  
                } catch (error) {
                  logger.error(`Failed to send command to device ${deviceId}:`, error);
                }
              }, currentDeviceDelay);
            }

            assignedIndex++;
            
            // Small delay between operations (non-blocking)
            if (assignedIndex < recipients.length) {
              await new Promise(resolve => setTimeout(resolve, 100)); // Reduced to 100ms
            }
          } catch (error) {
            logger.error(`Error queuing message for recipient:`, error);
            assignedIndex++;
          }
        }
        
        logger.info(`Background processing completed: ${assignedIndex} messages queued`);
      });

      // Return success immediately - messages will be processed in background
      res.status(201).json({
        success: true,
        campaign,
        message: `Campaign created successfully. ${recipients.length} messages are being queued across ${deviceIdsList.length} devices.`,
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

      // Create campaign record in database
      const campaignRecord = await Campaign.create({
        user_id: req.user.id,
        name: sanitizedName,
        description: `Manual campaign with ${validNumbers.length} recipients`,
        campaign_type: 'STANDARD',
        status: 'RUNNING',
        message_content: sanitizedMessage,
        total_contacts: validNumbers.length,
        sent_count: 0,
        failed_count: 0,
        selected_devices: device_ids,
        rotation_mode,
        device_message_distribution: distribution,
      });

      // Create campaign object for response
      const campaign = {
        id: campaignRecord.id, // Use database ID
        name: sanitizedName,
        type: 'MANUAL',
        message: sanitizedMessage,
        device_ids,
        rotation_mode,
        total_recipients: validNumbers.length,
        distribution,
        status: 'RUNNING',
        created_at: campaignRecord.created_at,
      };

      // Queue messages to devices - Process asynchronously to avoid timeout
      const deviceDelayTracker = new Map(); // Track cumulative delay per device
      
      // Process messages in background to avoid request timeout
      setImmediate(async () => {
        let queuedCount = 0;
        
        for (const phoneNumber of validNumbers) {
          try {
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
              
              // Generate random delay between 9-25 seconds for this message
              const randomDelaySeconds = Math.floor(Math.random() * 17) + 9; // 9-25 seconds
              
              // If device is being reused, add extra delay to prevent spam detection
              if (currentDeviceDelay > 0) {
                const extraDelay = Math.floor(Math.random() * 10) + 5; // 5-14 seconds extra for reused device
                currentDeviceDelay += extraDelay * 1000;
              }
              
              // Add base delay
              currentDeviceDelay += randomDelaySeconds * 1000;
              
              // Update tracker
              deviceDelayTracker.set(deviceId, currentDeviceDelay);
              
              setTimeout(async () => {
                try {
                  await DeviceWebSocketManager.sendCommand(deviceId, command);
                  logger.info(`Command sent to online device ${deviceId} for ${phoneNumber}`);
                  
                  // Auto-update status to SENT after 30 seconds (assuming message was sent)
                  setTimeout(async () => {
                    try {
                      const log = await DeviceLog.findOne({
                        where: {
                          device_id: deviceId,
                          recipient_number: phoneNumber,
                          status: 'QUEUED'
                        }
                      });
                      
                      if (log) {
                        await log.update({
                          status: 'SENT',
                          sent_at: new Date()
                        });
                        logger.info(`Auto-updated status to SENT for ${phoneNumber}`);
                      }
                    } catch (err) {
                      logger.error(`Failed to auto-update status: ${err.message}`);
                    }
                  }, 30000); // 30 seconds after command sent
                  
                } catch (error) {
                  logger.error(`Failed to send command to device ${deviceId}:`, error);
                  // Update log status to failed if command sending fails
                  await DeviceLog.update(
                    { status: 'FAILED', error_message: error.message },
                    { where: { device_id: deviceId, recipient_number: phoneNumber, status: 'QUEUED' } }
                  );
                }
              }, currentDeviceDelay);
            } else {
              // Device is offline - command will be sent when device comes online
              logger.info(`Device ${deviceId} is offline, command queued for ${phoneNumber}`);
            }

            queuedCount++;
            
            // Small delay between operations (non-blocking)
            if (queuedCount < validNumbers.length) {
              await new Promise(resolve => setTimeout(resolve, 100)); // Reduced to 100ms
            }
          } catch (error) {
            logger.error(`Error queuing message to ${phoneNumber}:`, error);
          }
        }
        
        logger.info(`Background processing completed: ${queuedCount} messages queued`);
      });
      
      // Return success immediately - messages will be processed in background
      res.status(201).json({
        success: true,
        campaign,
        message: `Manual campaign created successfully. ${validNumbers.length} messages are being queued across ${devices.length} devices.`,
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
  async (req, res) => {
    try {
      // Extract and validate query parameters manually to handle empty strings
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);
      const offset = (page - 1) * limit;

      // Build where clause - only include non-empty values
      const where = {};
      
      // Only add filters if they have actual values (not empty strings)
      if (req.query.excel_record_id && req.query.excel_record_id.trim() !== '') {
        const excelRecordId = parseInt(req.query.excel_record_id);
        if (!isNaN(excelRecordId)) {
          where.excel_record_id = excelRecordId;
        }
      }
      
      if (req.query.device_id && req.query.device_id.trim() !== '') {
        const deviceId = parseInt(req.query.device_id);
        if (!isNaN(deviceId)) {
          // Verify device belongs to user
          const device = await Device.findOne({
            where: { id: deviceId, user_id: req.user.id },
          });
          if (!device) {
            return res.status(404).json({ error: 'Device not found' });
          }
          where.device_id = deviceId;
        }
      }
      
      if (req.query.status && req.query.status.trim() !== '') {
        const validStatuses = ['QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'PENDING'];
        if (validStatuses.includes(req.query.status)) {
          where.status = req.query.status;
        }
      }

      // If no device_id specified, get all user's devices
      if (!req.query.device_id || req.query.device_id.trim() === '') {
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
              page: page,
              limit: limit,
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
        limit: limit,
        offset,
      });

      res.json({
        success: true,
        logs,
        pagination: {
          total: count,
          page: page,
          limit: limit,
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

const CampaignAnalytics = require('../services/CampaignAnalytics');
const SmartScheduler = require('../services/SmartScheduler');

// ============================================================================
// GENERAL CAMPAIGNS INSIGHTS ENDPOINT
// ============================================================================
router.get('/insights', verifyToken, async (req, res) => {
  try {
    // Get user's campaigns
    const campaigns = await Campaign.findAll({
      where: { user_id: req.user.id },
      limit: 5,
      order: [['created_at', 'DESC']]
    });

    if (campaigns.length === 0) {
      return res.json({
        success: true,
        campaigns_insights: {
          total_campaigns: 0,
          active_campaigns: 0,
          completed_campaigns: 0,
          average_success_rate: 0,
          total_messages_sent: 0,
          recommendations: []
        }
      });
    }

    let totalMessages = 0;
    let totalSuccessful = 0;
    let activeCampaigns = 0;
    let completedCampaigns = 0;

    for (const campaign of campaigns) {
      if (campaign.status === 'RUNNING' || campaign.status === 'QUEUED') {
        activeCampaigns++;
      } else if (campaign.status === 'COMPLETED') {
        completedCampaigns++;
      }

      // Get campaign stats if available
      if (campaign.total_recipients) {
        totalMessages += campaign.total_recipients;
        // Estimate success rate (you can improve this with actual data)
        totalSuccessful += Math.round(campaign.total_recipients * 0.85); // Assume 85% success rate
      }
    }

    const averageSuccessRate = totalMessages > 0 ? Math.round((totalSuccessful / totalMessages) * 100) : 0;

    const recommendations = [];
    if (activeCampaigns === 0) {
      recommendations.push({
        type: 'INFO',
        title: 'No Active Campaigns',
        message: 'Consider creating a new campaign to start sending messages.',
        action: 'CREATE_CAMPAIGN'
      });
    }

    if (averageSuccessRate < 70) {
      recommendations.push({
        type: 'WARNING',
        title: 'Low Success Rate',
        message: 'Your campaign success rate is below 70%. Consider reviewing your message content and device health.',
        action: 'REVIEW_CAMPAIGNS'
      });
    }

    res.json({
      success: true,
      campaigns_insights: {
        total_campaigns: campaigns.length,
        active_campaigns: activeCampaigns,
        completed_campaigns: completedCampaigns,
        average_success_rate: averageSuccessRate,
        total_messages_sent: totalMessages,
        recommendations: recommendations
      }
    });

  } catch (error) {
    console.error('Error fetching campaigns insights:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns insights' });
  }
});

module.exports = router;

// ============================================================================
// NEW: DEVICE MANAGEMENT ENDPOINTS
// ============================================================================

// Update device allocation for a campaign
router.put('/:id/device-allocation',
  verifyToken,
  [
    param('id').isInt().withMessage('Campaign ID must be an integer'),
    body('device_allocations').isObject().withMessage('Device allocations must be an object'),
  ],
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { device_allocations } = req.body; // {deviceId: messageCount}

      // Verify campaign belongs to user
      const campaign = await Campaign.findOne({
        where: {
          id,
          user_id: req.user.id,
        },
      });

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      // Verify all devices belong to user
      const deviceIds = Object.keys(device_allocations).map(id => parseInt(id));
      const devices = await Device.findAll({
        where: {
          id: { [Op.in]: deviceIds },
          user_id: req.user.id,
          is_active: true,
        },
      });

      if (devices.length !== deviceIds.length) {
        return res.status(400).json({ error: 'Some devices not found or not active' });
      }

      // Update campaign with device allocation
      await campaign.update({
        device_message_distribution: device_allocations,
      });

      // Update or create device_campaigns records
      for (const [deviceId, messageCount] of Object.entries(device_allocations)) {
        await DeviceCampaign.upsert({
          campaign_id: id,
          device_id: parseInt(deviceId),
          assigned_message_count: parseInt(messageCount),
        });
      }

      res.json({
        success: true,
        message: 'Device allocation updated successfully',
        device_allocations,
      });

    } catch (error) {
      logger.error('Error updating device allocation:', error);
      res.status(500).json({ error: 'Failed to update device allocation' });
    }
  }
);

// Get device allocation for a campaign
router.get('/:id/device-allocation',
  verifyToken,
  [
    param('id').isInt().withMessage('Campaign ID must be an integer'),
  ],
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Verify campaign belongs to user
      const campaign = await Campaign.findOne({
        where: {
          id,
          user_id: req.user.id,
        },
      });

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      // Get device campaigns with device info
      const deviceCampaigns = await DeviceCampaign.findAll({
        where: { campaign_id: id },
        include: [{
          model: Device,
          attributes: ['id', 'device_label', 'phone_number', 'daily_limit', 'messages_sent_today'],
        }],
      });

      res.json({
        success: true,
        device_allocations: campaign.device_message_distribution || {},
        device_campaigns: deviceCampaigns.map(dc => ({
          device_id: dc.device_id,
          device_label: dc.Device.device_label,
          phone_number: dc.Device.phone_number,
          assigned_message_count: dc.assigned_message_count,
          messages_sent_in_campaign: dc.messages_sent_in_campaign,
          daily_limit: dc.Device.daily_limit,
          messages_sent_today: dc.Device.messages_sent_today,
          capacity_remaining: dc.Device.daily_limit - dc.Device.messages_sent_today,
        })),
      });

    } catch (error) {
      logger.error('Error fetching device allocation:', error);
      res.status(500).json({ error: 'Failed to fetch device allocation' });
    }
  }
);

// ============================================================================
// NEW: TIMING ANALYTICS ENDPOINTS
// ============================================================================

// Get timing analytics for a campaign
router.get('/:id/timing-analytics',
  verifyToken,
  [
    param('id').isInt().withMessage('Campaign ID must be an integer'),
  ],
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Verify campaign belongs to user
      const campaign = await Campaign.findOne({
        where: {
          id,
          user_id: req.user.id,
        },
      });

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      // Get device logs with timing data
      const deviceLogs = await DeviceLog.findAll({
        where: { 
          campaign_id: id,
          status: { [Op.in]: ['SENT', 'DELIVERED'] },
          time_gap_ms: { [Op.not]: null },
        },
        order: [['sent_at', 'ASC']],
        include: [{
          model: Device,
          attributes: ['id', 'device_label'],
        }],
      });

      if (deviceLogs.length === 0) {
        return res.json({
          success: true,
          timing_analytics: {
            total_messages: 0,
            avg_time_gap: 0,
            min_time_gap: 0,
            max_time_gap: 0,
            avg_delivery_time: 0,
            per_device_analytics: {},
          },
        });
      }

      // Calculate overall timing analytics
      const timeGaps = deviceLogs.map(log => log.time_gap_ms).filter(gap => gap !== null);
      const deliveryTimes = deviceLogs.map(log => log.delivery_time_ms).filter(time => time !== null);

      const timingAnalytics = {
        total_messages: deviceLogs.length,
        avg_time_gap: timeGaps.length > 0 ? Math.round(timeGaps.reduce((a, b) => a + b, 0) / timeGaps.length) : 0,
        min_time_gap: timeGaps.length > 0 ? Math.min(...timeGaps) : 0,
        max_time_gap: timeGaps.length > 0 ? Math.max(...timeGaps) : 0,
        avg_delivery_time: deliveryTimes.length > 0 ? Math.round(deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length) : 0,
        per_device_analytics: {},
      };

      // Calculate per-device analytics
      const deviceGroups = deviceLogs.reduce((groups, log) => {
        const deviceId = log.device_id;
        if (!groups[deviceId]) {
          groups[deviceId] = {
            device_label: log.Device.device_label,
            messages: [],
          };
        }
        groups[deviceId].messages.push(log);
        return groups;
      }, {});

      for (const [deviceId, data] of Object.entries(deviceGroups)) {
        const deviceTimeGaps = data.messages.map(log => log.time_gap_ms).filter(gap => gap !== null);
        const deviceDeliveryTimes = data.messages.map(log => log.delivery_time_ms).filter(time => time !== null);

        timingAnalytics.per_device_analytics[deviceId] = {
          device_label: data.device_label,
          message_count: data.messages.length,
          avg_time_gap: deviceTimeGaps.length > 0 ? Math.round(deviceTimeGaps.reduce((a, b) => a + b, 0) / deviceTimeGaps.length) : 0,
          min_time_gap: deviceTimeGaps.length > 0 ? Math.min(...deviceTimeGaps) : 0,
          max_time_gap: deviceTimeGaps.length > 0 ? Math.max(...deviceTimeGaps) : 0,
          avg_delivery_time: deviceDeliveryTimes.length > 0 ? Math.round(deviceDeliveryTimes.reduce((a, b) => a + b, 0) / deviceDeliveryTimes.length) : 0,
        };
      }

      // Update campaign timing analytics
      await campaign.update({
        timing_analytics: timingAnalytics,
      });

      res.json({
        success: true,
        timing_analytics: timingAnalytics,
      });

    } catch (error) {
      logger.error('Error fetching timing analytics:', error);
      res.status(500).json({ error: 'Failed to fetch timing analytics' });
    }
  }
);

// Update timing configuration for a campaign
router.put('/:id/timing-config',
  verifyToken,
  [
    param('id').isInt().withMessage('Campaign ID must be an integer'),
    body('timing_config').isObject().withMessage('Timing config must be an object'),
  ],
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { timing_config } = req.body;

      // Validate timing config structure
      const validStrategies = ['CONSTANT', 'RANDOM', 'EXPONENTIAL_BACKOFF', 'CUSTOM'];
      if (timing_config.strategy && !validStrategies.includes(timing_config.strategy)) {
        return res.status(400).json({ error: 'Invalid timing strategy' });
      }

      // Verify campaign belongs to user
      const campaign = await Campaign.findOne({
        where: {
          id,
          user_id: req.user.id,
        },
      });

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      // Update campaign timing config
      await campaign.update({
        timing_config,
      });

      res.json({
        success: true,
        message: 'Timing configuration updated successfully',
        timing_config,
      });

    } catch (error) {
      logger.error('Error updating timing config:', error);
      res.status(500).json({ error: 'Failed to update timing configuration' });
    }
  }
);

// ============================================================================
// NEW: ENHANCED CAMPAIGN ANALYTICS ENDPOINTS
// ============================================================================

// Get comprehensive campaign analytics
router.get('/:id/analytics',
  verifyToken,
  [
    param('id').isInt().withMessage('Campaign ID must be an integer'),
  ],
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;

      const analytics = await CampaignAnalytics.getCampaignAnalytics(id, req.user.id);

      res.json({
        success: true,
        campaign_analytics: analytics,
      });

    } catch (error) {
      console.error('Error fetching campaign analytics:', error);
      res.status(500).json({ error: 'Failed to fetch campaign analytics' });
    }
  }
);

// Compare multiple campaigns
router.post('/compare',
  verifyToken,
  [
    body('campaign_ids').isArray({ min: 2, max: 5 }).withMessage('Provide 2-5 campaign IDs for comparison'),
  ],
  validate,
  async (req, res) => {
    try {
      const { campaign_ids } = req.body;

      const comparison = await CampaignAnalytics.compareCampaigns(campaign_ids, req.user.id);

      res.json({
        success: true,
        campaign_comparison: comparison,
      });

    } catch (error) {
      console.error('Error comparing campaigns:', error);
      res.status(500).json({ error: 'Failed to compare campaigns' });
    }
  }
);

// Schedule campaign with smart timing
router.post('/:id/smart-schedule',
  verifyToken,
  [
    param('id').isInt().withMessage('Campaign ID must be an integer'),
    body('message_type').optional().isIn(['business', 'personal', 'international']),
    body('timezone').optional().isString(),
    body('respect_optimal_times').optional().isBoolean(),
    body('max_daily_messages').optional().isInt({ min: 1 }),
    body('start_date').optional().isISO8601(),
    body('end_date').optional().isISO8601(),
  ],
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const options = req.body;

      // Verify campaign belongs to user
      const campaign = await Campaign.findOne({
        where: {
          id,
          user_id: req.user.id,
        },
      });

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      const scheduleResult = await SmartScheduler.scheduleSmartCampaign(id, options);

      res.json({
        success: true,
        smart_schedule: scheduleResult,
      });

    } catch (error) {
      console.error('Error creating smart schedule:', error);
      res.status(500).json({ error: 'Failed to create smart schedule' });
    }
  }
);

// Get campaign schedule status
router.get('/:id/schedule-status',
  verifyToken,
  [
    param('id').isInt().withMessage('Campaign ID must be an integer'),
  ],
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Verify campaign belongs to user
      const campaign = await Campaign.findOne({
        where: {
          id,
          user_id: req.user.id,
        },
      });

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      const scheduleStatus = await SmartScheduler.getScheduleStatus(id);

      res.json({
        success: true,
        schedule_status: scheduleStatus,
      });

    } catch (error) {
      console.error('Error fetching schedule status:', error);
      res.status(500).json({ error: 'Failed to fetch schedule status' });
    }
  }
);

// Adjust campaign schedule
router.put('/:id/adjust-schedule',
  verifyToken,
  [
    param('id').isInt().withMessage('Campaign ID must be an integer'),
    body('new_daily_limit').optional().isInt({ min: 1 }),
    body('exclude_hours').optional().isArray(),
    body('prioritize_devices').optional().isArray(),
    body('adjust_timing').optional().isBoolean(),
  ],
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const adjustments = req.body;

      // Verify campaign belongs to user
      const campaign = await Campaign.findOne({
        where: {
          id,
          user_id: req.user.id,
        },
      });

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      const adjustResult = await SmartScheduler.adjustSchedule(id, adjustments);

      res.json({
        success: true,
        schedule_adjustment: adjustResult,
      });

    } catch (error) {
      console.error('Error adjusting schedule:', error);
      res.status(500).json({ error: 'Failed to adjust schedule' });
    }
  }
);

// Get campaign performance insights
router.get('/:id/insights',
  verifyToken,
  [
    param('id').isInt().withMessage('Campaign ID must be an integer'),
  ],
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;

      const analytics = await CampaignAnalytics.getCampaignAnalytics(id, req.user.id);
      
      // Extract key insights
      const insights = {
        performance: {
          score: analytics.overallStats.successRate,
          status: analytics.overallStats.successRate >= 90 ? 'EXCELLENT' : 
                  analytics.overallStats.successRate >= 75 ? 'GOOD' : 
                  analytics.overallStats.successRate >= 60 ? 'FAIR' : 'POOR',
          totalMessages: analytics.overallStats.totalMessages,
          successRate: analytics.overallStats.successRate,
        },
        timing: {
          avgDeliveryTime: analytics.overallStats.avgDeliveryTime,
          avgTimeGap: analytics.overallStats.avgTimeGap,
          peakHours: analytics.timeAnalytics.peakHours,
        },
        devices: {
          totalDevices: analytics.devicePerformance.length,
          bestPerformer: analytics.devicePerformance[0],
          avgDeviceSuccess: Math.round(
            analytics.devicePerformance.reduce((sum, d) => sum + d.successRate, 0) / 
            analytics.devicePerformance.length
          ),
        },
        recommendations: analytics.recommendations,
        realTime: analytics.realTimeMetrics,
      };

      res.json({
        success: true,
        campaign_insights: insights,
      });

    } catch (error) {
      console.error('Error fetching campaign insights:', error);
      res.status(500).json({ error: 'Failed to fetch campaign insights' });
    }
  }
);

// Pause/Resume campaign
router.post('/:id/pause',
  verifyToken,
  [
    param('id').isInt().withMessage('Campaign ID must be an integer'),
  ],
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;

      const campaign = await Campaign.findOne({
        where: {
          id,
          user_id: req.user.id,
        },
      });

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      const newStatus = campaign.status === 'PAUSED' ? 'RUNNING' : 'PAUSED';
      await campaign.update({ status: newStatus });

      res.json({
        success: true,
        campaign: {
          id: campaign.id,
          name: campaign.name,
          status: newStatus,
        },
        message: `Campaign ${newStatus.toLowerCase()} successfully`,
      });

    } catch (error) {
      console.error('Error pausing/resuming campaign:', error);
      res.status(500).json({ error: 'Failed to pause/resume campaign' });
    }
  }
);

// Get campaign health check
router.get('/:id/health-check',
  verifyToken,
  [
    param('id').isInt().withMessage('Campaign ID must be an integer'),
  ],
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;

      const campaign = await Campaign.findOne({
        where: {
          id,
          user_id: req.user.id,
        },
      });

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      // Get campaign devices and their health
      const DeviceHealthMonitor = require('../services/DeviceHealthMonitor');
      const devices = await Device.findAll({
        where: {
          id: { [Op.in]: campaign.selected_devices || [] },
        },
      });

      const deviceHealthChecks = [];
      for (const device of devices) {
        const health = await DeviceHealthMonitor.calculateHealthScore(device.id);
        deviceHealthChecks.push({
          deviceId: device.id,
          deviceLabel: device.device_label,
          isOnline: device.is_online,
          healthScore: health.healthScore,
          status: health.status,
          recommendations: health.recommendations,
        });
      }

      // Overall campaign health
      const avgHealthScore = deviceHealthChecks.length > 0 
        ? Math.round(deviceHealthChecks.reduce((sum, d) => sum + d.healthScore, 0) / deviceHealthChecks.length)
        : 0;

      const onlineDevices = deviceHealthChecks.filter(d => d.isOnline).length;
      const healthyDevices = deviceHealthChecks.filter(d => d.healthScore >= 75).length;

      const campaignHealth = {
        overallScore: avgHealthScore,
        status: avgHealthScore >= 90 ? 'EXCELLENT' : 
                avgHealthScore >= 75 ? 'GOOD' : 
                avgHealthScore >= 60 ? 'FAIR' : 'POOR',
        totalDevices: devices.length,
        onlineDevices,
        healthyDevices,
        criticalDevices: deviceHealthChecks.filter(d => d.healthScore < 40).length,
        deviceHealth: deviceHealthChecks,
        recommendations: this.generateCampaignHealthRecommendations(deviceHealthChecks, campaign),
      };

      res.json({
        success: true,
        campaign_health: campaignHealth,
      });

    } catch (error) {
      console.error('Error checking campaign health:', error);
      res.status(500).json({ error: 'Failed to check campaign health' });
    }
  }
);

// Helper function for campaign health recommendations
function generateCampaignHealthRecommendations(deviceHealthChecks, campaign) {
  const recommendations = [];

  const offlineDevices = deviceHealthChecks.filter(d => !d.isOnline).length;
  const criticalDevices = deviceHealthChecks.filter(d => d.healthScore < 40).length;
  const lowHealthDevices = deviceHealthChecks.filter(d => d.healthScore < 60).length;

  if (offlineDevices > 0) {
    recommendations.push({
      type: 'CRITICAL',
      title: 'Devices Offline',
      message: `${offlineDevices} devices are offline. Campaign delivery may be affected.`,
      action: 'CHECK_DEVICE_CONNECTIVITY',
    });
  }

  if (criticalDevices > 0) {
    recommendations.push({
      type: 'WARNING',
      title: 'Critical Device Health',
      message: `${criticalDevices} devices have critical health issues. Consider auto-healing or manual intervention.`,
      action: 'AUTO_HEAL_DEVICES',
    });
  }

  if (lowHealthDevices > deviceHealthChecks.length * 0.5) {
    recommendations.push({
      type: 'INFO',
      title: 'Overall Health Concern',
      message: 'More than half of your devices have health issues. Consider reviewing device management.',
      action: 'REVIEW_DEVICE_MANAGEMENT',
    });
  }

  if (campaign.status === 'RUNNING' && offlineDevices === deviceHealthChecks.length) {
    recommendations.push({
      type: 'CRITICAL',
      title: 'Campaign Stalled',
      message: 'All devices are offline. Campaign cannot proceed.',
      action: 'PAUSE_CAMPAIGN',
    });
  }

  return recommendations;
}