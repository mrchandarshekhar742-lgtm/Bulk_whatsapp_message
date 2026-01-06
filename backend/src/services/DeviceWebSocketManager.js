const WebSocket = require('ws');
const logger = require('../utils/logger');
const { Device, DeviceCommand } = require('../models');

class DeviceWebSocketManager {
  constructor() {
    this.wss = null;
    this.deviceConnections = new Map(); // deviceId -> WebSocket
    this.deviceTokens = new Map(); // token -> deviceId
  }

  initialize(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws/device'
    });

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    logger.info('✓ Device WebSocket Manager initialized');
  }

  async handleConnection(ws, req) {
    let deviceId = null;
    
    try {
      const token = this.extractToken(req);
      
      if (!token) {
        ws.close(4001, 'No token provided');
        return;
      }

      // Verify device token
      const device = await Device.findOne({ where: { device_token: token } });
      
      if (!device) {
        ws.close(4002, 'Invalid token');
        return;
      }

      deviceId = device.id;
      
      // Check if device is already connected
      if (this.deviceConnections.has(deviceId)) {
        // Close existing connection
        const existingWs = this.deviceConnections.get(deviceId);
        if (existingWs && existingWs.readyState === WebSocket.OPEN) {
          existingWs.close(4003, 'New connection established');
        }
      }
      
      // Store connection
      this.deviceConnections.set(deviceId, ws);
      this.deviceTokens.set(token, deviceId);

      // Update device status
      await device.update({
        is_online: true,
        last_seen: new Date(),
        device_ip: this.extractIP(req),
      });

      logger.info(`Device ${deviceId} (${device.device_label}) connected`);

      // Send welcome message
      this.sendToDevice(deviceId, {
        type: 'CONNECTED',
        message: 'Connected to server',
        deviceId: deviceId,
      });

      // Send pending commands
      await this.sendPendingCommands(deviceId);

      // Handle messages from device
      ws.on('message', async (data) => {
        try {
          await this.handleDeviceMessage(deviceId, data);
        } catch (error) {
          logger.error(`Error handling message from device ${deviceId}:`, error);
        }
      });

      // Handle disconnection
      ws.on('close', async (code, reason) => {
        try {
          await this.handleDisconnection(deviceId);
        } catch (error) {
          logger.error(`Error handling disconnection for device ${deviceId}:`, error);
        }
      });

      ws.on('error', (error) => {
        logger.error(`WebSocket error for device ${deviceId}:`, error);
        try {
          this.handleDisconnection(deviceId);
        } catch (cleanupError) {
          logger.error(`Error during cleanup for device ${deviceId}:`, cleanupError);
        }
      });

      // Heartbeat
      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
      });

    } catch (error) {
      logger.error('Device connection error:', error);
      if (deviceId) {
        try {
          await this.handleDisconnection(deviceId);
        } catch (cleanupError) {
          logger.error(`Error during cleanup for device ${deviceId}:`, cleanupError);
        }
      }
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(4003, 'Server error');
      }
    }
  }

  async handleDeviceMessage(deviceId, data) {
    try {
      const message = JSON.parse(data.toString());
      logger.info(`Message from device ${deviceId}:`, message.type);

      switch (message.type) {
        case 'STATUS_UPDATE':
          await this.handleStatusUpdate(deviceId, message.data);
          break;

        case 'MESSAGE_SENT':
          await this.handleMessageSent(deviceId, message.data);
          break;

        case 'MESSAGE_FAILED':
          await this.handleMessageFailed(deviceId, message.data);
          break;

        case 'MESSAGE_DELIVERED':
          await this.handleMessageDelivered(deviceId, message.data);
          break;

        case 'COMMAND_ACK':
          await this.handleCommandAck(deviceId, message.data);
          break;

        case 'HEARTBEAT':
          await this.handleHeartbeat(deviceId, message.data);
          break;

        default:
          logger.warn(`Unknown message type from device ${deviceId}: ${message.type}`);
      }
    } catch (error) {
      logger.error(`Error handling message from device ${deviceId}:`, error);
    }
  }

  async handleStatusUpdate(deviceId, data) {
    const device = await Device.findByPk(deviceId);
    if (!device) return;

    await device.update({
      battery_level: data.battery_level,
      network_type: data.network_type,
      android_version: data.android_version,
      app_version: data.app_version,
      phone_number: data.phone_number || device.phone_number,
      last_seen: new Date(),
    });

    logger.info(`Device ${deviceId} status updated`);
  }

  async handleMessageSent(deviceId, data) {
    const { DeviceLog, DeviceCampaign } = require('../models');
    
    // Update device log
    const log = await DeviceLog.findOne({
      where: {
        device_id: deviceId,
        recipient_number: data.recipient_number,
        status: 'QUEUED',
      },
      order: [['created_at', 'DESC']],
    });

    if (log) {
      const sentAt = new Date();
      
      // Calculate time gap from previous message from same device
      let timeGapMs = null;
      const previousLog = await DeviceLog.findOne({
        where: {
          device_id: deviceId,
          status: { [Op.in]: ['SENT', 'DELIVERED'] },
          sent_at: { [Op.not]: null },
        },
        order: [['sent_at', 'DESC']],
      });

      if (previousLog && previousLog.sent_at) {
        timeGapMs = sentAt.getTime() - previousLog.sent_at.getTime();
      }

      await log.update({
        status: 'SENT',
        sent_at: sentAt,
        time_gap_ms: timeGapMs,
        device_ip: data.device_ip,
        network_type: data.network_type,
      });

      // Update device campaign progress if this is part of a campaign
      if (log.campaign_id) {
        const deviceCampaign = await DeviceCampaign.findOne({
          where: {
            campaign_id: log.campaign_id,
            device_id: deviceId,
          },
        });

        if (deviceCampaign) {
          await deviceCampaign.update({
            messages_sent_in_campaign: deviceCampaign.messages_sent_in_campaign + 1,
            sent_count: deviceCampaign.sent_count + 1,
          });
        }
      }
    }

    // Update device stats
    const device = await Device.findByPk(deviceId);
    if (device) {
      await device.update({
        messages_sent_today: device.messages_sent_today + 1,
        total_messages_sent: device.total_messages_sent + 1,
        last_message_sent_at: new Date(),
      });
    }

    logger.info(`Message sent from device ${deviceId} to ${data.recipient_number}`);
  }

  async handleMessageFailed(deviceId, data) {
    const { DeviceLog, DeviceCampaign } = require('../models');
    
    // Update device log
    const log = await DeviceLog.findOne({
      where: {
        device_id: deviceId,
        recipient_number: data.recipient_number,
        status: ['QUEUED', 'SENT'],
      },
      order: [['created_at', 'DESC']],
    });

    if (log) {
      await log.update({
        status: 'FAILED',
        error_message: data.error_message,
      });

      // Update device campaign progress if this is part of a campaign
      if (log.campaign_id) {
        const deviceCampaign = await DeviceCampaign.findOne({
          where: {
            campaign_id: log.campaign_id,
            device_id: deviceId,
          },
        });

        if (deviceCampaign) {
          await deviceCampaign.update({
            failed_count: deviceCampaign.failed_count + 1,
          });
        }
      }
    }

    // Update device stats
    const device = await Device.findByPk(deviceId);
    if (device) {
      await device.update({
        total_messages_failed: device.total_messages_failed + 1,
      });
    }

    logger.error(`Message failed from device ${deviceId}: ${data.error_message}`);
  }

  async handleMessageDelivered(deviceId, data) {
    const { DeviceLog } = require('../models');
    
    // Update device log
    const log = await DeviceLog.findOne({
      where: {
        device_id: deviceId,
        recipient_number: data.recipient_number,
        status: 'SENT',
      },
      order: [['sent_at', 'DESC']],
    });

    if (log) {
      const deliveredAt = new Date();
      let deliveryTimeMs = null;

      // Calculate delivery time if sent_at exists
      if (log.sent_at) {
        deliveryTimeMs = deliveredAt.getTime() - log.sent_at.getTime();
      }

      await log.update({
        status: 'DELIVERED',
        delivered_at: deliveredAt,
        delivery_time_ms: deliveryTimeMs,
      });
    }

    logger.info(`Message delivered from device ${deviceId} to ${data.recipient_number}`);
  }

  async handleCommandAck(deviceId, data) {
    const command = await DeviceCommand.findByPk(data.command_id);
    if (command) {
      await command.update({
        status: 'ACKNOWLEDGED',
      });
    }
  }

  async handleHeartbeat(deviceId, data) {
    const device = await Device.findByPk(deviceId);
    if (device) {
      await device.update({
        last_seen: new Date(),
        battery_level: data.battery_level,
        network_type: data.network_type,
      });
    }
  }

  async handleDisconnection(deviceId) {
    this.deviceConnections.delete(deviceId);
    
    const device = await Device.findByPk(deviceId);
    if (device) {
      await device.update({
        is_online: false,
      });
      logger.info(`Device ${deviceId} (${device.device_label}) disconnected`);
    }
  }

  async sendPendingCommands(deviceId) {
    const commands = await DeviceCommand.findAll({
      where: {
        device_id: deviceId,
        status: 'PENDING',
      },
      order: [['priority', 'ASC'], ['created_at', 'ASC']],
      limit: 10,
    });

    for (const command of commands) {
      await this.sendCommand(deviceId, command);
    }
  }

  async sendCommand(deviceId, command) {
    const ws = this.deviceConnections.get(deviceId);
    
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      logger.warn(`Device ${deviceId} not connected, cannot send command`);
      return false;
    }

    try {
      ws.send(JSON.stringify({
        type: 'COMMAND',
        command_id: command.id,
        command_type: command.command_type,
        payload: command.payload,
      }));

      await command.update({
        status: 'SENT',
        sent_at: new Date(),
      });

      logger.info(`Command ${command.id} sent to device ${deviceId}`);
      return true;
    } catch (error) {
      logger.error(`Error sending command to device ${deviceId}:`, error);
      return false;
    }
  }

  sendToDevice(deviceId, message) {
    const ws = this.deviceConnections.get(deviceId);
    
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      logger.error(`Error sending message to device ${deviceId}:`, error);
      return false;
    }
  }

  isDeviceOnline(deviceId) {
    const ws = this.deviceConnections.get(deviceId);
    return ws && ws.readyState === WebSocket.OPEN;
  }

  getOnlineDevices() {
    return Array.from(this.deviceConnections.keys());
  }

  extractToken(req) {
    const url = new URL(req.url, 'http://localhost');
    return url.searchParams.get('token');
  }

  extractIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0] || 
           req.socket.remoteAddress;
  }

  // Heartbeat to detect dead connections
  startHeartbeat() {
    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds
  }
}

module.exports = new DeviceWebSocketManager();
