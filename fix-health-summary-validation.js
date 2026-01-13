// Fixed Health Summary with proper validation
router.get('/health-summary', verifyToken, async (req, res) => {
  try {
    // Debug logging
    console.log('Health Summary Request:', {
      user: req.user ? { id: req.user.id, email: req.user.email } : 'undefined',
      headers: req.headers.authorization ? 'present' : 'missing'
    });

    // Validate user context
    if (!req.user) {
      console.error('Health Summary: No user in request');
      return res.status(400).json({ 
        error: 'User context missing',
        debug: 'Authentication middleware did not set req.user'
      });
    }

    if (!req.user.id) {
      console.error('Health Summary: User ID missing');
      return res.status(400).json({ 
        error: 'User ID missing',
        debug: 'req.user exists but id is undefined'
      });
    }

    console.log('Health Summary: Fetching devices for user', req.user.id);

    const devices = await Device.findAll({
      where: { user_id: req.user.id },
    });

    console.log('Health Summary: Found devices:', devices.length);

    if (devices.length === 0) {
      return res.json({
        success: true,
        health_summary: {
          total_devices: 0,
          online_devices: 0,
          healthy_devices: 0,
          critical_devices: 0,
          average_health_score: 0,
          recommendations: []
        }
      });
    }

    let totalHealthScore = 0;
    let healthyDevices = 0;
    let criticalDevices = 0;
    const recommendations = [];

    for (const device of devices) {
      try {
        let healthScore = 50;
        
        if (device.is_online) {
          healthScore += 30;
        } else {
          healthScore -= 20;
        }
        
        if (device.battery_level) {
          if (device.battery_level > 50) {
            healthScore += 10;
          } else if (device.battery_level < 20) {
            healthScore -= 15;
          }
        }
        
        const remainingCapacity = (device.daily_limit || 0) - (device.messages_sent_today || 0);
        if (remainingCapacity > (device.daily_limit || 0) * 0.5) {
          healthScore += 10;
        }
        
        healthScore = Math.max(0, Math.min(100, healthScore));
        totalHealthScore += healthScore;
        
        if (healthScore >= 75) {
          healthyDevices++;
        } else if (healthScore < 40) {
          criticalDevices++;
          recommendations.push(`Device ${device.device_label || device.id} needs attention`);
        }
        
      } catch (deviceError) {
        console.error(`Error calculating health for device ${device.id}:`, deviceError);
        if (device.is_online) {
          totalHealthScore += 30;
        } else {
          criticalDevices++;
        }
      }
    }

    const averageHealthScore = devices.length > 0 ? Math.round(totalHealthScore / devices.length) : 0;
    const onlineDevices = devices.filter(d => d.is_online).length;

    const response = {
      success: true,
      health_summary: {
        total_devices: devices.length,
        online_devices: onlineDevices,
        healthy_devices: healthyDevices,
        critical_devices: criticalDevices,
        average_health_score: averageHealthScore,
        recommendations: recommendations.slice(0, 5)
      }
    };

    console.log('Health Summary: Sending response');
    res.json(response);

  } catch (error) {
    console.error('Health Summary Error:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch device health summary',
      debug: error.message 
    });
  }
});