// Temporary health summary test without auth
router.get('/health-test', async (req, res) => {
  try {
    console.log('Health test endpoint called');
    
    // Mock user for testing
    const mockUser = { id: 9 };
    
    const devices = await Device.findAll({
      where: { user_id: mockUser.id },
    });

    console.log('Devices found:', devices.length);

    res.json({
      success: true,
      test: true,
      user_id: mockUser.id,
      devices_count: devices.length,
      health_summary: {
        total_devices: devices.length,
        online_devices: 0,
        healthy_devices: 0,
        critical_devices: 0,
        average_health_score: 0,
        recommendations: []
      }
    });

  } catch (error) {
    console.error('Health test error:', error);
    res.status(500).json({ error: error.message });
  }
});