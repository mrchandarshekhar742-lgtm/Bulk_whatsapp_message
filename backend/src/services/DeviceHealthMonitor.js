const { Device, DeviceLog } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class DeviceHealthMonitor {
  constructor() {
    this.healthScores = new Map(); // deviceId -> healthScore
    this.performanceMetrics = new Map(); // deviceId -> metrics
    this.alertThresholds = {
      failureRate: 0.15, // 15% failure rate threshold
      responseTime: 30000, // 30 seconds response time threshold
      batteryLevel: 20, // 20% battery threshold
      consecutiveFailures: 5, // 5 consecutive failures
    };
  }

  /**
   * Calculate device health score (0-100)
   */
  async calculateHealthScore(deviceId) {
    try {
      const device = await Device.findByPk(deviceId);
      if (!device) return 0;

      // Get recent performance data (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const recentLogs = await DeviceLog.findAll({
        where: {
          device_id: deviceId,
          created_at: { [Op.gte]: yesterday },
        },
        order: [['created_at', 'DESC']],
      });

      let healthScore = 100;
      const metrics = {
        totalMessages: recentLogs.length,
        successfulMessages: 0,
        failedMessages: 0,
        avgResponseTime: 0,
        consecutiveFailures: 0,
        batteryLevel: device.battery_level || 100,
        isOnline: device.is_online,
        lastSeen: device.last_seen,
      };

      // Calculate success/failure rates
      let consecutiveFailures = 0;
      let maxConsecutiveFailures = 0;
      let totalResponseTime = 0;
      let responseTimeCount = 0;

      for (const log of recentLogs) {
        if (log.status === 'SENT' || log.status === 'DELIVERED') {
          metrics.successfulMessages++;
          consecutiveFailures = 0;
          
          // Calculate response time
          if (log.sent_at && log.created_at) {
            const responseTime = log.sent_at.getTime() - log.created_at.getTime();
            totalResponseTime += responseTime;
            responseTimeCount++;
          }
        } else if (log.status === 'FAILED') {
          metrics.failedMessages++;
          consecutiveFailures++;
          maxConsecutiveFailures = Math.max(maxConsecutiveFailures, consecutiveFailures);
        }
      }

      metrics.consecutiveFailures = maxConsecutiveFailures;
      metrics.avgResponseTime = responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0;

      // Health score calculations
      
      // 1. Success Rate (40% weight)
      if (metrics.totalMessages > 0) {
        const successRate = metrics.successfulMessages / metrics.totalMessages;
        const failureRate = 1 - successRate;
        
        if (failureRate > this.alertThresholds.failureRate) {
          healthScore -= (failureRate - this.alertThresholds.failureRate) * 200; // Penalty for high failure rate
        }
      }

      // 2. Response Time (20% weight)
      if (metrics.avgResponseTime > this.alertThresholds.responseTime) {
        const timeoutPenalty = Math.min(30, (metrics.avgResponseTime - this.alertThresholds.responseTime) / 1000);
        healthScore -= timeoutPenalty;
      }

      // 3. Battery Level (15% weight)
      if (metrics.batteryLevel < this.alertThresholds.batteryLevel) {
        const batteryPenalty = (this.alertThresholds.batteryLevel - metrics.batteryLevel) * 2;
        healthScore -= batteryPenalty;
      }

      // 4. Consecutive Failures (15% weight)
      if (metrics.consecutiveFailures > this.alertThresholds.consecutiveFailures) {
        const failurePenalty = (metrics.consecutiveFailures - this.alertThresholds.consecutiveFailures) * 5;
        healthScore -= failurePenalty;
      }

      // 5. Online Status (10% weight)
      if (!metrics.isOnline) {
        healthScore -= 20;
      } else if (metrics.lastSeen) {
        const timeSinceLastSeen = Date.now() - metrics.lastSeen.getTime();
        if (timeSinceLastSeen > 300000) { // 5 minutes
          healthScore -= Math.min(15, timeSinceLastSeen / 60000); // Penalty for being offline
        }
      }

      // Ensure score is between 0-100
      healthScore = Math.max(0, Math.min(100, healthScore));

      // Store metrics
      this.healthScores.set(deviceId, healthScore);
      this.performanceMetrics.set(deviceId, metrics);

      return {
        healthScore: Math.round(healthScore),
        metrics,
        status: this.getHealthStatus(healthScore),
        recommendations: this.getRecommendations(healthScore, metrics),
      };

    } catch (error) {
      logger.error(`Error calculating health score for device ${deviceId}:`, error);
      return { healthScore: 0, metrics: {}, status: 'ERROR', recommendations: [] };
    }
  }

  /**
   * Get health status based on score
   */
  getHealthStatus(score) {
    if (score >= 90) return 'EXCELLENT';
    if (score >= 75) return 'GOOD';
    if (score >= 60) return 'FAIR';
    if (score >= 40) return 'POOR';
    return 'CRITICAL';
  }

  /**
   * Get recommendations based on health metrics
   */
  getRecommendations(score, metrics) {
    const recommendations = [];

    if (metrics.failedMessages / metrics.totalMessages > 0.1) {
      recommendations.push({
        type: 'WARNING',
        message: 'High failure rate detected. Check WhatsApp connection and permissions.',
        action: 'CHECK_WHATSAPP',
      });
    }

    if (metrics.batteryLevel < 30) {
      recommendations.push({
        type: 'ALERT',
        message: 'Low battery level. Device may go offline soon.',
        action: 'CHARGE_DEVICE',
      });
    }

    if (metrics.consecutiveFailures > 3) {
      recommendations.push({
        type: 'WARNING',
        message: 'Multiple consecutive failures. Consider restarting the device.',
        action: 'RESTART_DEVICE',
      });
    }

    if (!metrics.isOnline) {
      recommendations.push({
        type: 'CRITICAL',
        message: 'Device is offline. Check internet connection.',
        action: 'CHECK_CONNECTION',
      });
    }

    if (metrics.avgResponseTime > 20000) {
      recommendations.push({
        type: 'INFO',
        message: 'Slow response time. Consider reducing message frequency.',
        action: 'REDUCE_FREQUENCY',
      });
    }

    return recommendations;
  }

  /**
   * Get all devices health summary
   */
  async getHealthSummary(userId) {
    try {
      const devices = await Device.findAll({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
      });

      const healthData = [];
      let totalScore = 0;
      let criticalDevices = 0;
      let offlineDevices = 0;

      for (const device of devices) {
        const health = await this.calculateHealthScore(device.id);
        
        healthData.push({
          deviceId: device.id,
          deviceLabel: device.device_label,
          phoneNumber: device.phone_number,
          isOnline: device.is_online,
          batteryLevel: device.battery_level,
          ...health,
        });

        totalScore += health.healthScore;
        if (health.healthScore < 40) criticalDevices++;
        if (!device.is_online) offlineDevices++;
      }

      const avgHealthScore = devices.length > 0 ? Math.round(totalScore / devices.length) : 0;

      return {
        overallHealth: {
          avgHealthScore,
          status: this.getHealthStatus(avgHealthScore),
          totalDevices: devices.length,
          criticalDevices,
          offlineDevices,
          onlineDevices: devices.length - offlineDevices,
        },
        deviceHealth: healthData,
        timestamp: new Date(),
      };

    } catch (error) {
      logger.error('Error getting health summary:', error);
      throw error;
    }
  }

  /**
   * Auto-heal devices with issues
   */
  async autoHealDevice(deviceId) {
    try {
      const health = await this.calculateHealthScore(deviceId);
      const actions = [];

      // Auto-restart if too many consecutive failures
      if (health.metrics.consecutiveFailures > 5) {
        actions.push(await this.sendRestartCommand(deviceId));
      }

      // Reduce message frequency if response time is slow
      if (health.metrics.avgResponseTime > 30000) {
        actions.push(await this.adjustMessageFrequency(deviceId, 'REDUCE'));
      }

      // Send status sync command if device seems unresponsive
      if (!health.metrics.isOnline && health.metrics.lastSeen) {
        const timeSinceLastSeen = Date.now() - health.metrics.lastSeen.getTime();
        if (timeSinceLastSeen > 600000) { // 10 minutes
          actions.push(await this.sendSyncCommand(deviceId));
        }
      }

      return {
        deviceId,
        healthScore: health.healthScore,
        actionsPerformed: actions,
        timestamp: new Date(),
      };

    } catch (error) {
      logger.error(`Error auto-healing device ${deviceId}:`, error);
      throw error;
    }
  }

  async sendRestartCommand(deviceId) {
    const { DeviceCommand } = require('../models');
    const DeviceWebSocketManager = require('./DeviceWebSocketManager');

    const command = await DeviceCommand.create({
      device_id: deviceId,
      command_type: 'RESTART',
      payload: { reason: 'Auto-heal: Too many failures' },
      priority: 1,
    });

    await DeviceWebSocketManager.sendCommand(deviceId, command);
    return { action: 'RESTART_SENT', commandId: command.id };
  }

  async sendSyncCommand(deviceId) {
    const { DeviceCommand } = require('../models');
    const DeviceWebSocketManager = require('./DeviceWebSocketManager');

    const command = await DeviceCommand.create({
      device_id: deviceId,
      command_type: 'SYNC_STATUS',
      payload: { reason: 'Auto-heal: Device unresponsive' },
      priority: 2,
    });

    await DeviceWebSocketManager.sendCommand(deviceId, command);
    return { action: 'SYNC_SENT', commandId: command.id };
  }

  async adjustMessageFrequency(deviceId, action) {
    // This would integrate with campaign management to adjust delays
    logger.info(`Adjusting message frequency for device ${deviceId}: ${action}`);
    return { action: `FREQUENCY_${action}`, deviceId };
  }
}

module.exports = new DeviceHealthMonitor();