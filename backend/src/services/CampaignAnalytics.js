const { Campaign, DeviceLog, Device, DeviceCampaign } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class CampaignAnalytics {
  constructor() {
    this.analyticsCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get comprehensive campaign analytics
   */
  async getCampaignAnalytics(campaignId, userId) {
    try {
      const cacheKey = `campaign_${campaignId}_${userId}`;
      const cached = this.analyticsCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data;
      }

      // Verify campaign belongs to user
      const campaign = await Campaign.findOne({
        where: { id: campaignId, user_id: userId },
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Get all campaign logs
      const logs = await DeviceLog.findAll({
        where: { campaign_id: campaignId },
        include: [{
          model: Device,
          attributes: ['id', 'device_label', 'phone_number'],
        }],
        order: [['created_at', 'ASC']],
      });

      // Get device campaigns
      const deviceCampaigns = await DeviceCampaign.findAll({
        where: { campaign_id: campaignId },
        include: [{
          model: Device,
          attributes: ['id', 'device_label', 'phone_number'],
        }],
      });

      const analytics = {
        campaignInfo: {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          createdAt: campaign.created_at,
          startedAt: campaign.started_at,
          completedAt: campaign.completed_at,
          totalContacts: campaign.total_contacts,
        },
        
        // Overall Statistics
        overallStats: this.calculateOverallStats(logs),
        
        // Device Performance
        devicePerformance: this.calculateDevicePerformance(logs, deviceCampaigns),
        
        // Time-based Analytics
        timeAnalytics: this.calculateTimeAnalytics(logs),
        
        // Success/Failure Analysis
        deliveryAnalysis: this.calculateDeliveryAnalysis(logs),
        
        // Performance Trends
        performanceTrends: this.calculatePerformanceTrends(logs),
        
        // Recommendations
        recommendations: this.generateRecommendations(logs, campaign),
        
        // Real-time Metrics
        realTimeMetrics: this.calculateRealTimeMetrics(logs),
      };

      // Cache the results
      this.analyticsCache.set(cacheKey, {
        data: analytics,
        timestamp: Date.now(),
      });

      return analytics;

    } catch (error) {
      logger.error(`Error getting campaign analytics for ${campaignId}:`, error);
      throw error;
    }
  }

  calculateOverallStats(logs) {
    const stats = {
      totalMessages: logs.length,
      sentMessages: 0,
      deliveredMessages: 0,
      failedMessages: 0,
      queuedMessages: 0,
      pendingMessages: 0,
      successRate: 0,
      deliveryRate: 0,
      avgDeliveryTime: 0,
      avgTimeGap: 0,
    };

    let totalDeliveryTime = 0;
    let deliveryTimeCount = 0;
    let totalTimeGap = 0;
    let timeGapCount = 0;

    for (const log of logs) {
      switch (log.status) {
        case 'SENT':
          stats.sentMessages++;
          break;
        case 'DELIVERED':
          stats.deliveredMessages++;
          if (log.delivery_time_ms) {
            totalDeliveryTime += log.delivery_time_ms;
            deliveryTimeCount++;
          }
          break;
        case 'FAILED':
          stats.failedMessages++;
          break;
        case 'QUEUED':
          stats.queuedMessages++;
          break;
        case 'PENDING':
          stats.pendingMessages++;
          break;
      }

      if (log.time_gap_ms) {
        totalTimeGap += log.time_gap_ms;
        timeGapCount++;
      }
    }

    // Calculate rates
    const completedMessages = stats.sentMessages + stats.deliveredMessages + stats.failedMessages;
    if (completedMessages > 0) {
      stats.successRate = Math.round(((stats.sentMessages + stats.deliveredMessages) / completedMessages) * 100);
      stats.deliveryRate = Math.round((stats.deliveredMessages / completedMessages) * 100);
    }

    // Calculate averages
    stats.avgDeliveryTime = deliveryTimeCount > 0 ? Math.round(totalDeliveryTime / deliveryTimeCount) : 0;
    stats.avgTimeGap = timeGapCount > 0 ? Math.round(totalTimeGap / timeGapCount) : 0;

    return stats;
  }

  calculateDevicePerformance(logs, deviceCampaigns) {
    const deviceStats = new Map();

    // Initialize device stats
    for (const dc of deviceCampaigns) {
      deviceStats.set(dc.device_id, {
        deviceId: dc.device_id,
        deviceLabel: dc.Device.device_label,
        phoneNumber: dc.Device.phone_number,
        assignedMessages: dc.assigned_message_count,
        sentInCampaign: dc.messages_sent_in_campaign,
        sentCount: 0,
        deliveredCount: 0,
        failedCount: 0,
        avgResponseTime: 0,
        avgTimeGap: 0,
        successRate: 0,
        efficiency: 0,
      });
    }

    // Calculate stats from logs
    for (const log of logs) {
      const deviceStat = deviceStats.get(log.device_id);
      if (!deviceStat) continue;

      switch (log.status) {
        case 'SENT':
          deviceStat.sentCount++;
          break;
        case 'DELIVERED':
          deviceStat.deliveredCount++;
          break;
        case 'FAILED':
          deviceStat.failedCount++;
          break;
      }
    }

    // Calculate derived metrics
    for (const [deviceId, stats] of deviceStats) {
      const totalProcessed = stats.sentCount + stats.deliveredCount + stats.failedCount;
      if (totalProcessed > 0) {
        stats.successRate = Math.round(((stats.sentCount + stats.deliveredCount) / totalProcessed) * 100);
        stats.efficiency = Math.round((totalProcessed / stats.assignedMessages) * 100);
      }
    }

    return Array.from(deviceStats.values()).sort((a, b) => b.successRate - a.successRate);
  }

  calculateTimeAnalytics(logs) {
    const hourlyDistribution = new Array(24).fill(0);
    const dailyDistribution = {};
    const timeGaps = [];
    const deliveryTimes = [];

    for (const log of logs) {
      if (log.sent_at) {
        const hour = log.sent_at.getHours();
        hourlyDistribution[hour]++;

        const date = log.sent_at.toISOString().split('T')[0];
        dailyDistribution[date] = (dailyDistribution[date] || 0) + 1;
      }

      if (log.time_gap_ms) timeGaps.push(log.time_gap_ms);
      if (log.delivery_time_ms) deliveryTimes.push(log.delivery_time_ms);
    }

    return {
      hourlyDistribution: hourlyDistribution.map((count, hour) => ({ hour, count })),
      dailyDistribution: Object.entries(dailyDistribution).map(([date, count]) => ({ date, count })),
      timeGapStats: this.calculateStats(timeGaps),
      deliveryTimeStats: this.calculateStats(deliveryTimes),
      peakHours: this.findPeakHours(hourlyDistribution),
    };
  }

  calculateDeliveryAnalysis(logs) {
    const analysis = {
      deliveryFunnel: {
        queued: 0,
        sent: 0,
        delivered: 0,
        failed: 0,
      },
      failureReasons: {},
      deliveryPatterns: {},
      retryAnalysis: {},
    };

    for (const log of logs) {
      analysis.deliveryFunnel[log.status.toLowerCase()]++;

      if (log.status === 'FAILED' && log.error_message) {
        analysis.failureReasons[log.error_message] = (analysis.failureReasons[log.error_message] || 0) + 1;
      }

      // Analyze delivery patterns by hour
      if (log.sent_at) {
        const hour = log.sent_at.getHours();
        if (!analysis.deliveryPatterns[hour]) {
          analysis.deliveryPatterns[hour] = { sent: 0, delivered: 0, failed: 0 };
        }
        analysis.deliveryPatterns[hour][log.status.toLowerCase()]++;
      }
    }

    return analysis;
  }

  calculatePerformanceTrends(logs) {
    const trends = {
      successRateOverTime: [],
      messageVelocity: [],
      errorTrends: [],
    };

    // Group logs by hour for trend analysis
    const hourlyGroups = {};
    for (const log of logs) {
      if (log.created_at) {
        const hourKey = new Date(log.created_at).toISOString().slice(0, 13); // YYYY-MM-DDTHH
        if (!hourlyGroups[hourKey]) {
          hourlyGroups[hourKey] = { sent: 0, delivered: 0, failed: 0, total: 0 };
        }
        hourlyGroups[hourKey][log.status.toLowerCase()]++;
        hourlyGroups[hourKey].total++;
      }
    }

    // Calculate trends
    for (const [hour, stats] of Object.entries(hourlyGroups)) {
      const successRate = ((stats.sent + stats.delivered) / stats.total) * 100;
      trends.successRateOverTime.push({ hour, successRate, total: stats.total });
      trends.messageVelocity.push({ hour, velocity: stats.total });
      trends.errorTrends.push({ hour, errors: stats.failed, errorRate: (stats.failed / stats.total) * 100 });
    }

    return trends;
  }

  generateRecommendations(logs, campaign) {
    const recommendations = [];
    const stats = this.calculateOverallStats(logs);

    // Success rate recommendations
    if (stats.successRate < 80) {
      recommendations.push({
        type: 'WARNING',
        category: 'DELIVERY',
        title: 'Low Success Rate',
        message: `Campaign success rate is ${stats.successRate}%. Consider checking device health and message content.`,
        priority: 'HIGH',
        actions: ['CHECK_DEVICES', 'REVIEW_MESSAGE'],
      });
    }

    // Delivery time recommendations
    if (stats.avgDeliveryTime > 60000) { // 1 minute
      recommendations.push({
        type: 'INFO',
        category: 'PERFORMANCE',
        title: 'Slow Delivery',
        message: `Average delivery time is ${Math.round(stats.avgDeliveryTime / 1000)} seconds. Consider optimizing message timing.`,
        priority: 'MEDIUM',
        actions: ['OPTIMIZE_TIMING', 'CHECK_NETWORK'],
      });
    }

    // Time gap recommendations
    if (stats.avgTimeGap < 5000) { // Less than 5 seconds
      recommendations.push({
        type: 'ALERT',
        category: 'COMPLIANCE',
        title: 'Messages Too Frequent',
        message: 'Messages are being sent too quickly. This may trigger spam detection.',
        priority: 'HIGH',
        actions: ['INCREASE_DELAYS', 'REVIEW_STRATEGY'],
      });
    }

    // Failed messages recommendations
    if (stats.failedMessages > stats.totalMessages * 0.1) { // More than 10% failures
      recommendations.push({
        type: 'WARNING',
        category: 'RELIABILITY',
        title: 'High Failure Rate',
        message: `${stats.failedMessages} messages failed (${Math.round((stats.failedMessages / stats.totalMessages) * 100)}%). Check device connectivity.`,
        priority: 'HIGH',
        actions: ['CHECK_CONNECTIVITY', 'RESTART_DEVICES'],
      });
    }

    return recommendations;
  }

  calculateRealTimeMetrics(logs) {
    const now = new Date();
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
    const last5Minutes = new Date(now.getTime() - 5 * 60 * 1000);

    const recentLogs = logs.filter(log => log.created_at >= lastHour);
    const veryRecentLogs = logs.filter(log => log.created_at >= last5Minutes);

    return {
      messagesLastHour: recentLogs.length,
      messagesLast5Minutes: veryRecentLogs.length,
      currentVelocity: Math.round(veryRecentLogs.length / 5), // Messages per minute
      estimatedCompletion: this.estimateCompletion(logs),
      activeDevices: new Set(recentLogs.map(log => log.device_id)).size,
    };
  }

  calculateStats(values) {
    if (values.length === 0) return { min: 0, max: 0, avg: 0, median: 0 };

    const sorted = values.sort((a, b) => a - b);
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      median: sorted[Math.floor(sorted.length / 2)],
      count: values.length,
    };
  }

  findPeakHours(hourlyDistribution) {
    const hoursWithCounts = hourlyDistribution.map((count, hour) => ({ hour, count }));
    return hoursWithCounts
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => item.hour);
  }

  estimateCompletion(logs) {
    const completedLogs = logs.filter(log => ['SENT', 'DELIVERED', 'FAILED'].includes(log.status));
    const pendingLogs = logs.filter(log => ['QUEUED', 'PENDING'].includes(log.status));

    if (pendingLogs.length === 0) return null;
    if (completedLogs.length < 10) return null; // Need some data for estimation

    // Calculate average processing time
    const processingTimes = [];
    for (const log of completedLogs) {
      if (log.sent_at && log.created_at) {
        processingTimes.push(log.sent_at.getTime() - log.created_at.getTime());
      }
    }

    if (processingTimes.length === 0) return null;

    const avgProcessingTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
    const estimatedTimeMs = pendingLogs.length * avgProcessingTime;
    const estimatedCompletion = new Date(Date.now() + estimatedTimeMs);

    return {
      estimatedCompletion,
      remainingMessages: pendingLogs.length,
      estimatedDurationMs: estimatedTimeMs,
    };
  }

  /**
   * Get campaign comparison analytics
   */
  async compareCampaigns(campaignIds, userId) {
    try {
      const comparisons = [];

      for (const campaignId of campaignIds) {
        const analytics = await this.getCampaignAnalytics(campaignId, userId);
        comparisons.push({
          campaignId,
          name: analytics.campaignInfo.name,
          successRate: analytics.overallStats.successRate,
          totalMessages: analytics.overallStats.totalMessages,
          avgDeliveryTime: analytics.overallStats.avgDeliveryTime,
          avgTimeGap: analytics.overallStats.avgTimeGap,
          deviceCount: analytics.devicePerformance.length,
          status: analytics.campaignInfo.status,
        });
      }

      return {
        campaigns: comparisons,
        insights: this.generateComparisonInsights(comparisons),
      };

    } catch (error) {
      logger.error('Error comparing campaigns:', error);
      throw error;
    }
  }

  generateComparisonInsights(comparisons) {
    const insights = [];

    // Find best performing campaign
    const bestCampaign = comparisons.reduce((best, current) => 
      current.successRate > best.successRate ? current : best
    );

    insights.push({
      type: 'SUCCESS',
      message: `"${bestCampaign.name}" has the highest success rate at ${bestCampaign.successRate}%`,
    });

    // Find fastest campaign
    const fastestCampaign = comparisons.reduce((fastest, current) => 
      current.avgDeliveryTime < fastest.avgDeliveryTime ? current : fastest
    );

    insights.push({
      type: 'INFO',
      message: `"${fastestCampaign.name}" has the fastest delivery time at ${Math.round(fastestCampaign.avgDeliveryTime / 1000)} seconds`,
    });

    return insights;
  }
}

module.exports = new CampaignAnalytics();