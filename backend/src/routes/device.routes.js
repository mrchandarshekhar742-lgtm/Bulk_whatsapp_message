const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { Device, DeviceLog, DeviceCommand } = require('../models');
const { verifyToken } = require('../middleware/auth');
const DeviceWebSocketManager = require('../services/DeviceWebSocketManager');
const DeviceRotationEngine = require('../services/DeviceRotationEngine');
const { sanitizeDeviceLabel, sanitizePhoneNumber, sanitizeMessage } = require('../utils/sanitizer');
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

      // Sanitize inputs
      const sanitizedLabel = sanitizeDeviceLabel(device_label);
      const sanitizedPhone = phone_number ? sanitizePhoneNumber(phone_number) : null;
      
      if (!sanitizedLabel) {
        return res.status(400).json({ error: 'Invalid device label' });
      }

      // Generate unique device token
      const device_token = crypto.randomBytes(32).toString('hex');

      const device = await Device.create({
        user_id: req.user.id,
        device_label: sanitizedLabel,
        phone_number: sanitizedPhone,
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

      // Sanitize inputs
      const sanitizedLabel = device_label ? sanitizeDeviceLabel(device_label) : null;
      const sanitizedPhone = phone_number ? sanitizePhoneNumber(phone_number) : null;

      const updateData = {};
      if (sanitizedLabel) updateData.device_label = sanitizedLabel;
      if (sanitizedPhone) updateData.phone_number = sanitizedPhone;
      if (is_active !== undefined) updateData.is_active = is_active;

      await device.update(updateData);

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

      // Sanitize inputs
      const sanitizedPhone = sanitizePhoneNumber(recipient_number);
      const sanitizedMessage = sanitizeMessage(message);
      
      if (!sanitizedPhone || !sanitizedMessage) {
        return res.status(400).json({ error: 'Invalid phone number or message' });
      }

      // Create command
      const command = await DeviceCommand.create({
        device_id: device.id,
        command_type: 'SEND_MESSAGE',
        payload: {
          recipient_number: sanitizedPhone,
          message: sanitizedMessage,
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
        recipient_number: sanitizedPhone,
        message_content: sanitizedMessage,
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
// ============================================================================
// NEW: DEVICE TIMING ANALYTICS ENDPOINTS
// ============================================================================

// Get timing analytics for a specific device
router.get('/:id/timing-analytics',
  verifyToken,
  [
    param('id').isInt().withMessage('Device ID must be an integer'),
    query('days').optional().isInt({ min: 1, max: 90 }).withMessage('Days must be between 1 and 90'),
  ],
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const days = parseInt(req.query.days) || 7; // Default to 7 days

      // Verify device belongs to user
      const device = await Device.findOne({
        where: {
          id,
          user_id: req.user.id,
        },
      });

      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }

      // Get device logs from last N days with timing data
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const deviceLogs = await DeviceLog.findAll({
        where: {
          device_id: id,
          status: { [Op.in]: ['SENT', 'DELIVERED'] },
          sent_at: { [Op.gte]: startDate },
          time_gap_ms: { [Op.not]: null },
        },
        order: [['sent_at', 'ASC']],
      });

      if (deviceLogs.length === 0) {
        return res.json({
          success: true,
          device_timing_analytics: {
            device_id: id,
            device_label: device.device_label,
            period_days: days,
            total_messages: 0,
            avg_time_gap: 0,
            min_time_gap: 0,
            max_time_gap: 0,
            avg_delivery_time: 0,
            daily_breakdown: {},
            hourly_pattern: {},
          },
        });
      }

      // Calculate timing analytics
      const timeGaps = deviceLogs.map(log => log.time_gap_ms).filter(gap => gap !== null);
      const deliveryTimes = deviceLogs.map(log => log.delivery_time_ms).filter(time => time !== null);

      const analytics = {
        device_id: id,
        device_label: device.device_label,
        period_days: days,
        total_messages: deviceLogs.length,
        avg_time_gap: timeGaps.length > 0 ? Math.round(timeGaps.reduce((a, b) => a + b, 0) / timeGaps.length) : 0,
        min_time_gap: timeGaps.length > 0 ? Math.min(...timeGaps) : 0,
        max_time_gap: timeGaps.length > 0 ? Math.max(...timeGaps) : 0,
        avg_delivery_time: deliveryTimes.length > 0 ? Math.round(deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length) : 0,
        daily_breakdown: {},
        hourly_pattern: {},
      };

      // Daily breakdown
      const dailyGroups = deviceLogs.reduce((groups, log) => {
        const date = log.sent_at.toISOString().split('T')[0];
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(log);
        return groups;
      }, {});

      for (const [date, logs] of Object.entries(dailyGroups)) {
        const dayTimeGaps = logs.map(log => log.time_gap_ms).filter(gap => gap !== null);
        analytics.daily_breakdown[date] = {
          message_count: logs.length,
          avg_time_gap: dayTimeGaps.length > 0 ? Math.round(dayTimeGaps.reduce((a, b) => a + b, 0) / dayTimeGaps.length) : 0,
        };
      }

      // Hourly pattern (0-23 hours)
      const hourlyGroups = deviceLogs.reduce((groups, log) => {
        const hour = log.sent_at.getHours();
        if (!groups[hour]) {
          groups[hour] = [];
        }
        groups[hour].push(log);
        return groups;
      }, {});

      for (const [hour, logs] of Object.entries(hourlyGroups)) {
        const hourTimeGaps = logs.map(log => log.time_gap_ms).filter(gap => gap !== null);
        analytics.hourly_pattern[hour] = {
          message_count: logs.length,
          avg_time_gap: hourTimeGaps.length > 0 ? Math.round(hourTimeGaps.reduce((a, b) => a + b, 0) / hourTimeGaps.length) : 0,
        };
      }

      res.json({
        success: true,
        device_timing_analytics: analytics,
      });

    } catch (error) {
      console.error('Error fetching device timing analytics:', error);
      res.status(500).json({ error: 'Failed to fetch device timing analytics' });
    }
  }
);

// Get device performance summary
router.get('/:id/performance-summary',
  verifyToken,
  [
    param('id').isInt().withMessage('Device ID must be an integer'),
  ],
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Verify device belongs to user
      const device = await Device.findOne({
        where: {
          id,
          user_id: req.user.id,
        },
      });

      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }

      // Get recent performance data (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const recentLogs = await DeviceLog.findAll({
        where: {
          device_id: id,
          created_at: { [Op.gte]: yesterday },
        },
      });

      // Get device campaigns
      const deviceCampaigns = await DeviceCampaign.findAll({
        where: { device_id: id },
        include: [{
          model: Campaign,
          attributes: ['id', 'name', 'status'],
        }],
      });

      const performanceSummary = {
        device_info: {
          id: device.id,
          device_label: device.device_label,
          phone_number: device.phone_number,
          is_online: device.is_online,
          warmup_stage: device.warmup_stage,
          daily_limit: device.daily_limit,
          messages_sent_today: device.messages_sent_today,
          capacity_remaining: device.daily_limit - device.messages_sent_today,
        },
        recent_activity: {
          messages_last_24h: recentLogs.length,
          successful_messages: recentLogs.filter(log => log.status === 'SENT' || log.status === 'DELIVERED').length,
          failed_messages: recentLogs.filter(log => log.status === 'FAILED').length,
          success_rate: recentLogs.length > 0 ? Math.round((recentLogs.filter(log => log.status === 'SENT' || log.status === 'DELIVERED').length / recentLogs.length) * 100) : 0,
        },
        campaign_participation: {
          active_campaigns: deviceCampaigns.filter(dc => dc.Campaign && dc.Campaign.status === 'RUNNING').length,
          total_campaigns: deviceCampaigns.length,
          total_assigned_messages: deviceCampaigns.reduce((sum, dc) => sum + dc.assigned_message_count, 0),
          total_sent_messages: deviceCampaigns.reduce((sum, dc) => sum + dc.messages_sent_in_campaign, 0),
        },
        overall_stats: {
          total_messages_sent: device.total_messages_sent,
          total_messages_failed: device.total_messages_failed,
          overall_success_rate: device.total_messages_sent + device.total_messages_failed > 0 ? 
            Math.round((device.total_messages_sent / (device.total_messages_sent + device.total_messages_failed)) * 100) : 0,
          last_message_sent_at: device.last_message_sent_at,
          last_seen: device.last_seen,
        },
      };

      res.json({
        success: true,
        performance_summary: performanceSummary,
      });

    } catch (error) {
      console.error('Error fetching device performance summary:', error);
      res.status(500).json({ error: 'Failed to fetch device performance summary' });
    }
  }
);