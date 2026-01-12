const { Device, DeviceLog, Campaign } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class SmartScheduler {
  constructor() {
    this.scheduledTasks = new Map(); // taskId -> task details
    this.deviceSchedules = new Map(); // deviceId -> schedule
    this.optimalTimes = {
      // Best times to send messages (hours in 24h format)
      business: [9, 10, 11, 14, 15, 16, 17], // Business hours
      personal: [10, 11, 12, 18, 19, 20], // Personal messaging
      international: [8, 9, 10, 11, 12, 13, 14, 15, 16], // Broader range for international
    };
  }

  /**
   * Calculate optimal sending time based on historical data
   */
  async calculateOptimalTiming(deviceId, messageType = 'business') {
    try {
      // Get historical success data for this device
      const historicalData = await DeviceLog.findAll({
        where: {
          device_id: deviceId,
          status: { [Op.in]: ['SENT', 'DELIVERED'] },
          sent_at: { [Op.not]: null },
          created_at: { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
        },
        order: [['sent_at', 'ASC']],
      });

      if (historicalData.length < 10) {
        // Not enough data, use default optimal times
        return this.getDefaultOptimalTimes(messageType);
      }

      // Analyze success rates by hour
      const hourlyStats = new Array(24).fill(null).map(() => ({
        sent: 0,
        delivered: 0,
        failed: 0,
        successRate: 0,
        avgDeliveryTime: 0,
      }));

      for (const log of historicalData) {
        const hour = log.sent_at.getHours();
        hourlyStats[hour].sent++;
        
        if (log.status === 'DELIVERED') {
          hourlyStats[hour].delivered++;
          if (log.delivery_time_ms) {
            hourlyStats[hour].avgDeliveryTime += log.delivery_time_ms;
          }
        }
      }

      // Calculate success rates and average delivery times
      for (let hour = 0; hour < 24; hour++) {
        const stats = hourlyStats[hour];
        if (stats.sent > 0) {
          stats.successRate = (stats.delivered / stats.sent) * 100;
          stats.avgDeliveryTime = stats.avgDeliveryTime / stats.delivered || 0;
        }
      }

      // Find optimal hours (high success rate + fast delivery)
      const optimalHours = hourlyStats
        .map((stats, hour) => ({ hour, ...stats }))
        .filter(stats => stats.sent >= 3) // Minimum data points
        .sort((a, b) => {
          // Score based on success rate (70%) and delivery speed (30%)
          const scoreA = (a.successRate * 0.7) + ((60000 - a.avgDeliveryTime) / 60000 * 30);
          const scoreB = (b.successRate * 0.7) + ((60000 - b.avgDeliveryTime) / 60000 * 30);
          return scoreB - scoreA;
        })
        .slice(0, 6) // Top 6 hours
        .map(stats => stats.hour);

      return {
        optimalHours: optimalHours.length > 0 ? optimalHours : this.optimalTimes[messageType],
        confidence: this.calculateConfidence(historicalData.length),
        basedOnData: historicalData.length,
        recommendation: this.generateTimingRecommendation(optimalHours, hourlyStats),
      };

    } catch (error) {
      logger.error(`Error calculating optimal timing for device ${deviceId}:`, error);
      return this.getDefaultOptimalTimes(messageType);
    }
  }

  getDefaultOptimalTimes(messageType) {
    return {
      optimalHours: this.optimalTimes[messageType] || this.optimalTimes.business,
      confidence: 'LOW',
      basedOnData: 0,
      recommendation: 'Using default optimal times. More data needed for personalized recommendations.',
    };
  }

  calculateConfidence(dataPoints) {
    if (dataPoints >= 100) return 'HIGH';
    if (dataPoints >= 50) return 'MEDIUM';
    if (dataPoints >= 20) return 'LOW';
    return 'VERY_LOW';
  }

  generateTimingRecommendation(optimalHours, hourlyStats) {
    if (optimalHours.length === 0) {
      return 'Insufficient data for timing recommendations.';
    }

    const bestHour = optimalHours[0];
    const bestStats = hourlyStats[bestHour];
    
    return `Best time to send: ${bestHour}:00-${bestHour + 1}:00 (${bestStats.successRate.toFixed(1)}% success rate)`;
  }

  /**
   * Schedule campaign with smart timing
   */
  async scheduleSmartCampaign(campaignId, options = {}) {
    try {
      const {
        messageType = 'business',
        timezone = 'UTC',
        respectOptimalTimes = true,
        maxDailyMessages = null,
        startDate = new Date(),
        endDate = null,
      } = options;

      const campaign = await Campaign.findByPk(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Get campaign devices
      const devices = await Device.findAll({
        where: {
          id: { [Op.in]: campaign.selected_devices || [] },
          is_active: true,
        },
      });

      if (devices.length === 0) {
        throw new Error('No active devices found for campaign');
      }

      // Calculate optimal timing for each device
      const deviceTimings = new Map();
      for (const device of devices) {
        const timing = await this.calculateOptimalTiming(device.id, messageType);
        deviceTimings.set(device.id, timing);
      }

      // Create smart schedule
      const schedule = await this.createSmartSchedule({
        campaignId,
        devices,
        deviceTimings,
        totalMessages: campaign.total_contacts,
        startDate,
        endDate,
        respectOptimalTimes,
        maxDailyMessages,
      });

      // Store schedule
      this.scheduledTasks.set(campaignId, {
        campaignId,
        schedule,
        status: 'SCHEDULED',
        createdAt: new Date(),
        options,
      });

      return {
        success: true,
        campaignId,
        schedule: {
          totalMessages: schedule.totalMessages,
          estimatedDuration: schedule.estimatedDuration,
          devicesUsed: schedule.devicesUsed,
          optimalTimeSlots: schedule.optimalTimeSlots,
          dailyDistribution: schedule.dailyDistribution,
        },
        recommendations: this.generateScheduleRecommendations(schedule, deviceTimings),
      };

    } catch (error) {
      logger.error(`Error scheduling smart campaign ${campaignId}:`, error);
      throw error;
    }
  }

  async createSmartSchedule(params) {
    const {
      campaignId,
      devices,
      deviceTimings,
      totalMessages,
      startDate,
      endDate,
      respectOptimalTimes,
      maxDailyMessages,
    } = params;

    const schedule = {
      campaignId,
      totalMessages,
      devicesUsed: devices.length,
      optimalTimeSlots: [],
      dailyDistribution: {},
      messageSchedule: [],
      estimatedDuration: 0,
    };

    // Calculate daily capacity
    const totalDailyCapacity = devices.reduce((sum, device) => {
      const remaining = device.daily_limit - device.messages_sent_today;
      return sum + Math.max(0, remaining);
    }, 0);

    const effectiveDailyLimit = maxDailyMessages 
      ? Math.min(maxDailyMessages, totalDailyCapacity)
      : totalDailyCapacity;

    if (effectiveDailyLimit <= 0) {
      throw new Error('No daily capacity available');
    }

    // Calculate number of days needed
    const daysNeeded = Math.ceil(totalMessages / effectiveDailyLimit);
    schedule.estimatedDuration = daysNeeded;

    // Generate daily schedules
    let remainingMessages = totalMessages;
    let currentDate = new Date(startDate);

    for (let day = 0; day < daysNeeded && remainingMessages > 0; day++) {
      const dailyMessages = Math.min(remainingMessages, effectiveDailyLimit);
      const dateKey = currentDate.toISOString().split('T')[0];
      
      schedule.dailyDistribution[dateKey] = {
        date: new Date(currentDate),
        plannedMessages: dailyMessages,
        timeSlots: [],
      };

      // Distribute messages across optimal time slots
      if (respectOptimalTimes) {
        const timeSlots = this.generateOptimalTimeSlots(deviceTimings, currentDate);
        schedule.dailyDistribution[dateKey].timeSlots = timeSlots;
        
        // Add to overall optimal time slots
        schedule.optimalTimeSlots.push(...timeSlots);
      }

      remainingMessages -= dailyMessages;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return schedule;
  }

  generateOptimalTimeSlots(deviceTimings, date) {
    const timeSlots = [];
    const hourCounts = new Map();

    // Aggregate optimal hours from all devices
    for (const [deviceId, timing] of deviceTimings) {
      for (const hour of timing.optimalHours) {
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
      }
    }

    // Sort hours by popularity (how many devices prefer this hour)
    const sortedHours = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([hour]) => hour);

    // Create time slots
    for (const hour of sortedHours.slice(0, 8)) { // Top 8 hours
      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);
      
      const slotEnd = new Date(slotStart);
      slotEnd.setHours(hour + 1, 0, 0, 0);

      timeSlots.push({
        startTime: slotStart,
        endTime: slotEnd,
        hour,
        deviceCount: hourCounts.get(hour),
        priority: sortedHours.indexOf(hour) + 1,
      });
    }

    return timeSlots;
  }

  generateScheduleRecommendations(schedule, deviceTimings) {
    const recommendations = [];

    // Check if schedule is too aggressive
    if (schedule.estimatedDuration === 1 && schedule.totalMessages > 500) {
      recommendations.push({
        type: 'WARNING',
        title: 'Aggressive Schedule',
        message: 'Sending all messages in one day may trigger spam detection. Consider spreading over multiple days.',
        action: 'EXTEND_DURATION',
      });
    }

    // Check device timing confidence
    const lowConfidenceDevices = Array.from(deviceTimings.entries())
      .filter(([_, timing]) => timing.confidence === 'LOW' || timing.confidence === 'VERY_LOW')
      .length;

    if (lowConfidenceDevices > 0) {
      recommendations.push({
        type: 'INFO',
        title: 'Limited Historical Data',
        message: `${lowConfidenceDevices} devices have limited historical data. Timing optimization will improve over time.`,
        action: 'COLLECT_MORE_DATA',
      });
    }

    // Check optimal time coverage
    if (schedule.optimalTimeSlots.length < 4) {
      recommendations.push({
        type: 'INFO',
        title: 'Limited Time Slots',
        message: 'Consider adding more devices or adjusting timing preferences for better distribution.',
        action: 'ADD_DEVICES',
      });
    }

    return recommendations;
  }

  /**
   * Get schedule status and progress
   */
  async getScheduleStatus(campaignId) {
    try {
      const task = this.scheduledTasks.get(campaignId);
      if (!task) {
        return { error: 'Schedule not found' };
      }

      // Get current progress
      const logs = await DeviceLog.findAll({
        where: { campaign_id: campaignId },
      });

      const progress = {
        totalScheduled: task.schedule.totalMessages,
        completed: logs.filter(log => ['SENT', 'DELIVERED'].includes(log.status)).length,
        failed: logs.filter(log => log.status === 'FAILED').length,
        pending: logs.filter(log => ['QUEUED', 'PENDING'].includes(log.status)).length,
      };

      progress.completionRate = (progress.completed / progress.totalScheduled) * 100;

      return {
        campaignId,
        status: task.status,
        schedule: task.schedule,
        progress,
        createdAt: task.createdAt,
        nextOptimalTime: this.getNextOptimalTime(task.schedule),
      };

    } catch (error) {
      logger.error(`Error getting schedule status for ${campaignId}:`, error);
      throw error;
    }
  }

  getNextOptimalTime(schedule) {
    const now = new Date();
    
    for (const timeSlot of schedule.optimalTimeSlots) {
      if (timeSlot.startTime > now) {
        return {
          nextSlot: timeSlot.startTime,
          hour: timeSlot.hour,
          priority: timeSlot.priority,
        };
      }
    }

    return null; // No more optimal times
  }

  /**
   * Adjust schedule based on real-time performance
   */
  async adjustSchedule(campaignId, adjustments) {
    try {
      const task = this.scheduledTasks.get(campaignId);
      if (!task) {
        throw new Error('Schedule not found');
      }

      const {
        newDailyLimit,
        excludeHours,
        prioritizeDevices,
        adjustTiming,
      } = adjustments;

      // Apply adjustments
      if (newDailyLimit) {
        // Recalculate daily distribution
        task.schedule = await this.recalculateDailyDistribution(task.schedule, newDailyLimit);
      }

      if (excludeHours && excludeHours.length > 0) {
        // Remove excluded hours from optimal time slots
        task.schedule.optimalTimeSlots = task.schedule.optimalTimeSlots.filter(
          slot => !excludeHours.includes(slot.hour)
        );
      }

      if (prioritizeDevices && prioritizeDevices.length > 0) {
        // Adjust device priorities
        task.schedule.devicePriorities = prioritizeDevices;
      }

      // Update task
      this.scheduledTasks.set(campaignId, {
        ...task,
        lastAdjusted: new Date(),
        adjustments: [...(task.adjustments || []), adjustments],
      });

      return {
        success: true,
        campaignId,
        adjustedSchedule: task.schedule,
        message: 'Schedule adjusted successfully',
      };

    } catch (error) {
      logger.error(`Error adjusting schedule for ${campaignId}:`, error);
      throw error;
    }
  }

  async recalculateDailyDistribution(schedule, newDailyLimit) {
    // Recalculate based on new daily limit
    const totalMessages = schedule.totalMessages;
    const daysNeeded = Math.ceil(totalMessages / newDailyLimit);
    
    const newDistribution = {};
    let remainingMessages = totalMessages;
    const startDate = new Date();

    for (let day = 0; day < daysNeeded; day++) {
      const dailyMessages = Math.min(remainingMessages, newDailyLimit);
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day);
      
      const dateKey = currentDate.toISOString().split('T')[0];
      newDistribution[dateKey] = {
        date: currentDate,
        plannedMessages: dailyMessages,
        timeSlots: schedule.dailyDistribution[dateKey]?.timeSlots || [],
      };

      remainingMessages -= dailyMessages;
    }

    return {
      ...schedule,
      dailyDistribution: newDistribution,
      estimatedDuration: daysNeeded,
    };
  }
}

module.exports = new SmartScheduler();