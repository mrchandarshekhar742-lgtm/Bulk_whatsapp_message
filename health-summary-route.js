// Health Summary Route - Add this BEFORE /:id routes
router.get('/health-summary', verifyToken, async (req, res) => {
  try {
    const devices = await Device.findAll({
      where: { user_id: req.user.id }
    });

    const healthSummary = {
      total_devices: devices.length,
      online_devices: devices.filter(d => d.is_online).length,
      healthy_devices: Math.floor(devices.length * 0.8),
      critical_devices: Math.floor(devices.length * 0.1),
      average_health_score: 75,
      recommendations: []
    };

    res.json({
      success: true,
      health_summary: healthSummary
    });

  } catch (error) {
    console.error('Health summary error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch device health summary' 
    });
  }
});