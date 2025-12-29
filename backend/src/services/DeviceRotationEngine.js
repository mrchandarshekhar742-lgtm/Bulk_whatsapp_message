const { Device } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class DeviceRotationEngine {
  constructor() {
    this.lastUsedIndex = 0; // For round-robin
    this.deviceLastUsed = new Map(); // Track when each device was last used
    this.deviceMessageCount = new Map(); // Track messages sent per device in current session
  }

  /**
   * Select next device based on rotation mode
   * @param {Array} deviceIds - Array of device IDs to choose from
   * @param {String} mode - RANDOM, ROUND_ROBIN, LEAST_USED, WARMUP_AWARE
   * @returns {Number} - Selected device ID
   */
  async selectDevice(deviceIds, mode = 'SMART_ROTATION') {
    if (!deviceIds || deviceIds.length === 0) {
      throw new Error('No devices available');
    }

    // Get devices with current status - Allow offline devices for campaign creation
    const devices = await Device.findAll({
      where: {
        id: { [Op.in]: deviceIds },
        is_active: true,
        // Removed is_online requirement - devices can be offline during campaign creation
      },
    });

    if (devices.length === 0) {
      throw new Error('No active devices available');
    }

    // Filter devices that haven't reached daily limit
    const availableDevices = devices.filter(device => 
      device.messages_sent_today < device.daily_limit
    );

    if (availableDevices.length === 0) {
      // If all devices reached limit, use the one with lowest usage
      const deviceWithLowestUsage = devices.reduce((prev, current) => 
        (prev.messages_sent_today < current.messages_sent_today) ? prev : current
      );
      logger.warn(`All devices reached daily limit, using device ${deviceWithLowestUsage.id} with lowest usage`);
      return deviceWithLowestUsage.id;
    }

    let selectedDevice;

    switch (mode) {
      case 'SMART_ROTATION':
        selectedDevice = this.selectSmartRotation(availableDevices);
        break;

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
        selectedDevice = this.selectSmartRotation(availableDevices);
    }

    logger.info(`Selected device ${selectedDevice.id} (${selectedDevice.device_label}) using ${mode} mode`);
    return selectedDevice.id;
  }

  /**
   * Smart rotation - combines all best practices
   * Considers warmup stage, capacity, usage, and adds randomness
   */
  selectSmartRotation(devices) {
    // Calculate scores for each device
    const devicesWithScores = devices.map(device => {
      const remainingCapacity = device.daily_limit - device.messages_sent_today;
      const utilizationRate = device.messages_sent_today / device.daily_limit;
      const lastUsedTime = this.deviceLastUsed.get(device.id) || 0;
      const timeSinceLastUse = Date.now() - lastUsedTime;
      const sessionMessageCount = this.deviceMessageCount.get(device.id) || 0;

      // Warmup stage score (higher is better)
      const stageScores = { STAGE_4: 4, STAGE_3: 3, STAGE_2: 2, STAGE_1: 1 };
      const warmupScore = stageScores[device.warmup_stage] || 1;

      // Capacity score (more remaining capacity = higher score)
      const capacityScore = remainingCapacity / device.daily_limit;

      // Usage score (less used today = higher score)
      const usageScore = 1 - utilizationRate;

      // Time score (longer since last use = higher score)
      const timeScore = Math.min(timeSinceLastUse / (5 * 60 * 1000), 1); // Max score after 5 minutes

      // Session usage penalty (less used in current session = higher score)
      const sessionScore = Math.max(0, 1 - (sessionMessageCount * 0.1));

      // Random factor to prevent predictable patterns
      const randomFactor = Math.random() * 0.3; // 30% randomness

      // Combined score with weights
      const totalScore = (
        warmupScore * 0.25 +      // 25% warmup stage
        capacityScore * 0.25 +    // 25% remaining capacity
        usageScore * 0.20 +       // 20% daily usage
        timeScore * 0.15 +        // 15% time since last use
        sessionScore * 0.10 +     // 10% session usage
        randomFactor * 0.05       // 5% randomness
      );

      return {
        device,
        score: totalScore,
        remainingCapacity,
        utilizationRate,
        timeSinceLastUse,
        sessionMessageCount,
      };
    });

    // Sort by score (highest first)
    devicesWithScores.sort((a, b) => b.score - a.score);

    // Select the best device
    const selectedDevice = devicesWithScores[0].device;

    // Update tracking
    this.deviceLastUsed.set(selectedDevice.id, Date.now());
    this.deviceMessageCount.set(selectedDevice.id, 
      (this.deviceMessageCount.get(selectedDevice.id) || 0) + 1
    );

    return selectedDevice;
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
  async distributeMessages(deviceIds, messageCount, mode = 'SMART_ROTATION') {
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
    if (mode === 'SMART_ROTATION' || mode === 'WARMUP_AWARE') {
      // Smart distribution based on capacity and warmup stages
      let remainingMessages = messageCount;

      // Sort devices by smart score for distribution
      const devicesWithScores = availableDevices.map(device => {
        const remainingCapacity = device.daily_limit - device.messages_sent_today;
        const utilizationRate = device.messages_sent_today / device.daily_limit;
        const stageScores = { STAGE_4: 4, STAGE_3: 3, STAGE_2: 2, STAGE_1: 1 };
        const warmupScore = stageScores[device.warmup_stage] || 1;
        
        // Smart score for distribution
        const score = (warmupScore * 0.4) + (remainingCapacity / device.daily_limit * 0.6);
        
        return { device, score, remainingCapacity };
      });

      // Sort by score (highest first)
      devicesWithScores.sort((a, b) => b.score - a.score);

      // Distribute proportionally based on scores
      const totalScore = devicesWithScores.reduce((sum, item) => sum + item.score, 0);

      for (const item of devicesWithScores) {
        const proportion = item.score / totalScore;
        const assignedCount = Math.min(
          Math.floor(messageCount * proportion),
          item.remainingCapacity,
          remainingMessages
        );

        if (assignedCount > 0) {
          distribution[item.device.id] = assignedCount;
          remainingMessages -= assignedCount;
        }
      }

      // Assign remaining messages to best device
      if (remainingMessages > 0) {
        const bestDevice = devicesWithScores[0].device;
        distribution[bestDevice.id] = (distribution[bestDevice.id] || 0) + remainingMessages;
      }

    } else {
      // Simple round-robin distribution for other modes
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
