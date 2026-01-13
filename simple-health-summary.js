// Simple Health Summary Test
router.get('/health-summary', verifyToken, async (req, res) => {
  console.log('=== SIMPLE HEALTH SUMMARY TEST ===');
  console.log('User:', req.user ? { id: req.user.id, email: req.user.email } : 'undefined');
  
  try {
    // Simple response without database query
    res.json({
      success: true,
      test: true,
      user_id: req.user.id,
      health_summary: {
        total_devices: 0,
        online_devices: 0,
        healthy_devices: 0,
        critical_devices: 0,
        average_health_score: 0,
        recommendations: []
      }
    });
    console.log('Simple health summary response sent');
  } catch (error) {
    console.error('Simple health summary error:', error);
    res.status(500).json({ error: error.message });
  }
});