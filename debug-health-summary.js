// Debug Health Summary Endpoint
router.get('/health-summary', verifyToken, async (req, res) => {
  console.log('=== HEALTH SUMMARY DEBUG START ===');
  console.log('User ID:', req.user?.id);
  console.log('User object:', req.user);
  
  try {
    const devices = await Device.findAll({
      where: { user_id: req.user.id },
    });

    console.log('Devices found:', devices.length);

    if (devices.length === 0) {
      console.log('No devices found, returning empty response');
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

    console.log('Processing devices...');
    let totalHealthScore = 0;
    let healthyDevices = 0;
    let criticalDevices = 0;
    const recommendations = [];

    for (const device of devices) {
      let healthScore = 50;
      
      if (device.is_online) {
        healthScore += 30;
      } else {
        healthScore -= 20;
      }
      
      if (device.battery_level && device.battery_level > 50) {
        healthScore += 10;
      }
      
      healthScore = Math.max(0, Math.min(100, healthScore));
      totalHealthScore += healthScore;
      
      if (healthScore >= 75) {
        healthyDevices++;
      } else if (healthScore < 40) {
        criticalDevices++;
      }
    }

    const averageHealthScore = Math.round(totalHealthScore / devices.length);
    const onlineDevices = devices.filter(d => d.is_online).length;

    const response = {
      success: true,
      health_summary: {
        total_devices: devices.length,
        online_devices: onlineDevices,
        healthy_devices: healthyDevices,
        critical_devices: criticalDevices,
        average_health_score: averageHealthScore,
        recommendations: recommendations
      }
    };

    console.log('Sending response:', JSON.stringify(response, null, 2));
    res.json(response);

  } catch (error) {
    console.error('=== HEALTH SUMMARY ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch device health summary' });
  }
  
  console.log('=== HEALTH SUMMARY DEBUG END ===');
});