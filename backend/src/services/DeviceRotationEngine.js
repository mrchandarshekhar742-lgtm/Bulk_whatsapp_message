const { Device } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class DeviceRotationEngine {
  constructor() {
    this.lastUsedIndex = 0; // For round-robin
  }

  /**
   * Select next device based on rotation mode
   * @param {Array} deviceIds - Array of device IDs to choose from
   * @param {String} mode - RANDOM, ROUND_ROBIN, LEAST_USED, WARMUP_AWARE
   * @returns {Number} - Selected device ID
   */
  async selectDevice(deviceIds, mode = 'WARMUP_AWARE') {
    if (!deviceIds || deviceIds.length === 0) {
      throw new Error('No devices available');
    }

    // Get devices with current status
    const devices = await Device.findAll({
      where: {
        id: { [Op.in]: deviceIds },
        is_active: true,
        is_online: true,
      },
    });

    if (devices.length === 0) {
      throw new Error('No active online devices available');
    }

    // Filter devices that haven't reached daily limit
    const availableDevices = devices.filter(device => 
      device.messages_sent_today < device.daily_limit
    );

    if (availableDevices.length === 0) {
      throw new Error('All devices have reached their daily limit');
    }

    let selectedDevice;

    switch (mode) {
      case 'RANDOM':
        selectedDevice = this.selectRandom(availableDevices);
        break;

      case 'ROUND_ROBIN':
        selectedDevice = this.selectRoundRobin(availableDevices);
        break;

      case 'LEAST_USED':
        selectedDevice = this.selectLeastUsed(availableDevices);
        break;

      case 'WARMUP_AWARE':
        selectedDevice = this.selectWarmupAware(availableDevices);
        break;

      default:
        selectedDevice = this.selectWarmupAware(availableDevices);
    }

    logger.info(`Selected device ${selectedDevice.id} (${selectedDevice.device_label}) using ${mode} mode`);
    return selectedDevice.id;
  }

  /**
   * Random selection
   */
  selectRandom(devices) {
    const randomIndex = Math.floor(Math.random() * devices.length);
    return devices[randomIndex];
  }

  /**
   * Round-robin selection
   */
  selectRoundRobin(devices) {
    const device = devices[this.lastUsedIndex % devices.length];
    this.lastUsedIndex++;
    return device;
  }

  /**
   * Select device with least messages sent today
   */
  selectLeastUsed(devices) {
    return devices.reduce((least, current) => 
      current.messages_sent_today < least.messages_sent_today ? current : least
    );
  }

  /**
   * Warmup-aware selection (prioritizes devices with more capacity)
   */
  selectWarmupAware(devices) {
    // Calculate remaining capacity for each device
    const devicesWithCapacity = devices.map(device => ({
      device,
      remainingCapacity: device.daily_limit - device.messages_sent_today,
      utilizationRate: device.messages_sent_today / device.daily_limit,
    }));

    // Sort by:
    // 1. Warmup stage (higher stage = more mature)
    // 2. Remaining capacity (more capacity = better)
    // 3. Utilization rate (lower rate = less used)
    devicesWithCapacity.sort((a, b) => {
      // Priority 1: Warmup stage
      const stageOrder = { STAGE_4: 4, STAGE_3: 3, STAGE_2: 2, STAGE_1: 1 };
      const stageDiff = stageOrder[b.device.warmup_stage] - stageOrder[a.device.warmup_stage];
      if (stageDiff !== 0) return stageDiff;

      // Priority 2: Remaining capacity
      const capacityDiff = b.remainingCapacity - a.remainingCapacity;
      if (capacityDiff !== 0) return capacityDiff;

      // Priority 3: Utilization rate (lower is better)
      return a.utilizationRate - b.utilizationRate;
    });

    return devicesWithCapacity[0].device;
  }

  /**
   * Distribute messages across devices
   * @param {Array} deviceIds - Available device IDs
   * @param {Number} messageCount - Total messages to send
   * @param {String} mode - Rotation mode
   * @returns {Object} - Device distribution map { deviceId: messageCount }
   */
  async distributeMessages(deviceIds, messageCount, mode = 'WARMUP_AWARE') {
    const devices = await Device.findAll({
      where: {
        id: { [Op.in]: deviceIds },
        is_active: true,
        is_online: true,
      },
    });

    if (devices.length === 0) {
      throw new Error('No active online devices available');
    }

    const distribution = {};
    const availableDevices = devices.filter(device => 
      device.messages_sent_today < device.daily_limit
    );

    if (availableDevices.length === 0) {
      throw new Error('All devices have reached their daily limit');
    }

    // Calculate total available capacity
    const totalCapacity = availableDevices.reduce((sum, device) => 
      sum + (device.daily_limit - device.messages_sent_today), 0
    );

    if (totalCapacity < messageCount) {
      logger.warn(`Total capacity (${totalCapacity}) is less than message count (${messageCount})`);
    }

    // Distribute based on mode
    if (mode === 'WARMUP_AWARE') {
      // Distribute proportionally based on remaining capacity
      let remainingMessages = messageCount;

      for (const device of availableDevices) {
        const remainingCapacity = device.daily_limit - device.messages_sent_today;
        const proportion = remainingCapacity / totalCapacity;
        const assignedCount = Math.min(
          Math.floor(messageCount * proportion),
          remainingCapacity,
          remainingMessages
        );

        if (assignedCount > 0) {
          distribution[device.id] = assignedCount;
          remainingMessages -= assignedCount;
        }
      }

      // Assign remaining messages to device with most capacity
      if (remainingMessages > 0) {
        const deviceWithMostCapacity = availableDevices.reduce((max, device) => 
          (device.daily_limit - device.messages_sent_today) > 
          (max.daily_limit - max.messages_sent_today) ? device : max
        );
        distribution[deviceWithMostCapacity.id] = 
          (distribution[deviceWithMostCapacity.id] || 0) + remainingMessages;
      }

    } else {
      // Simple round-robin distribution
      let deviceIndex = 0;
      for (let i = 0; i < messageCount; i++) {
        const device = availableDevices[deviceIndex % availableDevices.length];
        distribution[device.id] = (distribution[device.id] || 0) + 1;
        deviceIndex++;
      }
    }

    logger.info(`Distributed ${messageCount} messages across ${Object.keys(distribution).length} devices`);
    return distribution;
  }

  /**
   * Check if device can send more messages
   */
  async canDeviceSend(deviceId) {
    const device = await Device.findByPk(deviceId);
    
    if (!device) {
      return { canSend: false, reason: 'Device not found' };
    }

    if (!device.is_active) {
      return { canSend: false, reason: 'Device is not active' };
    }

    if (!device.is_online) {
      return { canSend: false, reason: 'Device is offline' };
    }

    if (device.messages_sent_today >= device.daily_limit) {
      return { 
        canSend: false, 
        reason: `Daily limit reached (${device.daily_limit})`,
        resetAt: 'midnight',
      };
    }

    return { 
      canSend: true, 
      remainingCapacity: device.daily_limit - device.messages_sent_today,
    };
  }

  /**
   * Get device statistics
   */
  async getDeviceStats(deviceIds) {
    const devices = await Device.findAll({
      where: { id: { [Op.in]: deviceIds } },
    });

    return devices.map(device => ({
      id: device.id,
      label: device.device_label,
      isOnline: device.is_online,
      isActive: device.is_active,
      warmupStage: device.warmup_stage,
      messagesSentToday: device.messages_sent_today,
      dailyLimit: device.daily_limit,
      remainingCapacity: device.daily_limit - device.messages_sent_today,
      utilizationRate: (device.messages_sent_today / device.daily_limit * 100).toFixed(2) + '%',
      totalSent: device.total_messages_sent,
      totalFailed: device.total_messages_failed,
    }));
  }
}

module.exports = new DeviceRotationEngine();
