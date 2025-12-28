const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { Device, DeviceLog, DeviceCommand } = require('../models');
const { verifyToken } = require('../middleware/auth');
const DeviceWebSocketManager = require('../services/DeviceWebSocketManager');
const DeviceRotationEngine = require('../services/DeviceRotationEngine');
const crypto = require('crypto');
const { Op } = require('sequelize');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// ============================================================================
// 1. GET ALL DEVICES (for current user)
// ============================================================================
router.get('/', verifyToken, async (req, res) => {
  try {
    // Check if Device table exists, if not return empty array
    try {
      const devices = await Device.findAll({
        where: { user_id: req.user.id },
        order: [['created_at', 'DESC']],
      });

      res.json({
        success: true,
        devices: devices.map(device => ({
          id: device.id,
          device_label: device.device_label,
          phone_number: device.phone_number,
          device_ip: device.device_ip,
          is_online: device.is_online,
          is_active: device.is_active,
          warmup_stage: device.warmup_stage,
          messages_sent_today: device.messages_sent_today,
          daily_limit: device.daily_limit,
          battery_level: device.battery_level,
          network_type: device.network_type,
          last_seen: device.last_seen,
          total_messages_sent: device.total_messages_sent,
          total_messages_failed: device.total_messages_failed,
          created_at: device.created_at,
        })),
      });
    } catch (dbError) {
      // If table doesn't exist or other DB error, return empty array
      console.error('Device table access failed:', dbError.message);
      res.json({
        success: true,
        devices: [],
      });
    }
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

// ============================================================================
// 2. CREATE NEW DEVICE
// ============================================================================
router.post('/',
  verifyToken,
  [
    body('device_label').notEmpty().withMessage('Device label is required'),
    body('phone_number').optional().isMobilePhone(),
  ],
  validate,
  async (req, res) => {
    try {
      const { device_label, phone_number } = req.body;

      // Generate unique device token
      const device_token = crypto.randomBytes(32).toString('hex');

      const device = await Device.create({
        user_id: req.user.id,
        device_label,
        phone_number,
        device_token,
        warmup_started_at: new Date(), // Start warmup immediately
      });

      res.status(201).json({
        success: true,
        device: {
          id: device.id,
          device_label: device.device_label,
          device_token: device.device_token, // Return token once for app setup
          phone_number: device.phone_number,
          warmup_stage: device.warmup_stage,
          daily_limit: device.daily_limit,
        },
        message: 'Device created successfully. Save the device_token in your Android app.',
      });
    } catch (error) {
      console.error('Error creating device:', error);
      res.status(500).json({ error: 'Failed to create device' });
    }
  }
);

// ============================================================================
// 3. GET DEVICE BY ID
// ============================================================================
router.get('/:id',
  verifyToken,
  param('id').isInt(),
  validate,
  async (req, res) => {
    try {
      const device = await Device.findOne({
        where: {
          id: req.params.id,
          user_id: req.user.id,
        },
      });

      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }

      res.json({
        success: true,
        device: {
          id: device.id,
          device_label: device.device_label,
          phone_number: device.phone_number,
          device_ip: device.device_ip,
          is_online: device.is_online,
          is_active: device.is_active,
          warmup_stage: device.warmup_stage,
          warmup_started_at: device.warmup_started_at,
          messages_sent_today: device.messages_sent_today,
          daily_limit: device.daily_limit,
          battery_level: device.battery_level,
          network_type: device.network_type,
          android_version: device.android_version,
          app_version: device.app_version,
          last_seen: device.last_seen,
          last_message_sent_at: device.last_message_sent_at,
          total_messages_sent: device.total_messages_sent,
          total_messages_failed: device.total_messages_failed,
          created_at: device.created_at,
        },
      });
    } catch (error) {
      console.error('Error fetching device:', error);
      res.status(500).json({ error: 'Failed to fetch device' });
    }
  }
);

// ============================================================================
// 4. UPDATE DEVICE
// ============================================================================
router.put('/:id',
  verifyToken,
  [
    param('id').isInt(),
    body('device_label').optional().notEmpty(),
    body('phone_number').optional().isMobilePhone(),
    body('is_active').optional().isBoolean(),
  ],
  validate,
  async (req, res) => {
    try {
      const device = await Device.findOne({
        where: {
          id: req.params.id,
          user_id: req.user.id,
        },
      });

      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }

      const { device_label, phone_number, is_active } = req.body;

      await device.update({
        ...(device_label && { device_label }),
        ...(phone_number && { phone_number }),
        ...(is_active !== undefined && { is_active }),
      });

      res.json({
        success: true,
        device: {
          id: device.id,
          device_label: device.device_label,
          phone_number: device.phone_number,
          is_active: device.is_active,
        },
        message: 'Device updated successfully',
      });
    } catch (error) {
      console.error('Error updating device:', error);
      res.status(500).json({ error: 'Failed to update device' });
    }
  }
);

// ============================================================================
// 5. DELETE DEVICE
// ============================================================================
router.delete('/:id',
  verifyToken,
  param('id').isInt(),
  validate,
  async (req, res) => {
    try {
      const device = await Device.findOne({
        where: {
          id: req.params.id,
          user_id: req.user.id,
        },
      });

      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }

      // Close WebSocket connection if online
      if (device.is_online) {
        DeviceWebSocketManager.sendToDevice(device.id, {
          type: 'DISCONNECT',
          message: 'Device removed from system',
        });
      }

      await device.destroy();

      res.json({
        success: true,
        message: 'Device deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting device:', error);
      res.status(500).json({ error: 'Failed to delete device' });
    }
  }
);

// ============================================================================
// 6. GET DEVICE LOGS
// ============================================================================
router.get('/:id/logs',
  verifyToken,
  [
    param('id').isInt(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  async (req, res) => {
    try {
      const device = await Device.findOne({
        where: {
          id: req.params.id,
          user_id: req.user.id,
        },
      });

      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const { count, rows: logs } = await DeviceLog.findAndCountAll({
        where: { device_id: device.id },
        order: [['created_at', 'DESC']],
        limit,
        offset,
      });

      res.json({
        success: true,
        logs,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      console.error('Error fetching device logs:', error);
      res.status(500).json({ error: 'Failed to fetch device logs' });
    }
  }
);

// ============================================================================
// 7. GET DEVICE STATISTICS
// ============================================================================
router.get('/:id/stats',
  verifyToken,
  param('id').isInt(),
  validate,
  async (req, res) => {
    try {
      const device = await Device.findOne({
        where: {
          id: req.params.id,
          user_id: req.user.id,
        },
      });

      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }

      // Get today's stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayLogs = await DeviceLog.count({
        where: {
          device_id: device.id,
          created_at: { [Op.gte]: today },
        },
      });

      const todaySent = await DeviceLog.count({
        where: {
          device_id: device.id,
          status: 'SENT',
          created_at: { [Op.gte]: today },
        },
      });

      const todayFailed = await DeviceLog.count({
        where: {
          device_id: device.id,
          status: 'FAILED',
          created_at: { [Op.gte]: today },
        },
      });

      res.json({
        success: true,
        stats: {
          device_id: device.id,
          device_label: device.device_label,
          is_online: device.is_online,
          warmup_stage: device.warmup_stage,
          daily_limit: device.daily_limit,
          messages_sent_today: device.messages_sent_today,
          remaining_capacity: device.daily_limit - device.messages_sent_today,
          utilization_rate: ((device.messages_sent_today / device.daily_limit) * 100).toFixed(2) + '%',
          total_messages_sent: device.total_messages_sent,
          total_messages_failed: device.total_messages_failed,
          success_rate: device.total_messages_sent > 0 
            ? ((device.total_messages_sent / (device.total_messages_sent + device.total_messages_failed)) * 100).toFixed(2) + '%'
            : '0%',
          today_logs: todayLogs,
          today_sent: todaySent,
          today_failed: todayFailed,
        },
      });
    } catch (error) {
      console.error('Error fetching device stats:', error);
      res.status(500).json({ error: 'Failed to fetch device stats' });
    }
  }
);

// ============================================================================
// 8. SEND TEST MESSAGE
// ============================================================================
router.post('/:id/test',
  verifyToken,
  [
    param('id').isInt(),
    body('recipient_number').notEmpty().withMessage('Recipient number is required'),
    body('message').notEmpty().withMessage('Message is required'),
  ],
  validate,
  async (req, res) => {
    try {
      const device = await Device.findOne({
        where: {
          id: req.params.id,
          user_id: req.user.id,
        },
      });

      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }

      if (!device.is_online) {
        return res.status(400).json({ error: 'Device is offline' });
      }

      const { recipient_number, message } = req.body;

      // Create command
      const command = await DeviceCommand.create({
        device_id: device.id,
        command_type: 'SEND_MESSAGE',
        payload: {
          recipient_number,
          message,
        },
        priority: 1, // High priority for test
      });

      // Send via WebSocket
      const sent = await DeviceWebSocketManager.sendCommand(device.id, command);

      if (!sent) {
        return res.status(500).json({ error: 'Failed to send command to device' });
      }

      // Create log entry
      await DeviceLog.create({
        device_id: device.id,
        recipient_number,
        message_content: message,
        status: 'QUEUED',
      });

      res.json({
        success: true,
        message: 'Test message queued successfully',
        command_id: command.id,
      });
    } catch (error) {
      console.error('Error sending test message:', error);
      res.status(500).json({ error: 'Failed to send test message' });
    }
  }
);

// ============================================================================
// 9. GET ONLINE DEVICES
// ============================================================================
router.get('/status/online', verifyToken, async (req, res) => {
  try {
    const onlineDeviceIds = DeviceWebSocketManager.getOnlineDevices();
    
    const devices = await Device.findAll({
      where: {
        user_id: req.user.id,
        id: { [Op.in]: onlineDeviceIds },
      },
    });

    res.json({
      success: true,
      online_count: devices.length,
      devices: devices.map(d => ({
        id: d.id,
        device_label: d.device_label,
        phone_number: d.phone_number,
        warmup_stage: d.warmup_stage,
        messages_sent_today: d.messages_sent_today,
        daily_limit: d.daily_limit,
      })),
    });
  } catch (error) {
    console.error('Error fetching online devices:', error);
    res.status(500).json({ error: 'Failed to fetch online devices' });
  }
});

module.exports = router;
