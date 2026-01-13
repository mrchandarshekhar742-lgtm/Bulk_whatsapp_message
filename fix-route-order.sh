#!/bin/bash

# Insert health-summary route before /:id routes (around line 100)
sed -i '100i\\
// ============================================================================\
// HEALTH SUMMARY ENDPOINT (Must be before /:id routes)\
// ============================================================================\
router.get("/health-summary", verifyToken, async (req, res) => {\
  try {\
    const devices = await Device.findAll({\
      where: { user_id: req.user.id },\
    });\
\
    if (devices.length === 0) {\
      return res.json({\
        success: true,\
        health_summary: {\
          total_devices: 0,\
          online_devices: 0,\
          healthy_devices: 0,\
          critical_devices: 0,\
          average_health_score: 0,\
          recommendations: []\
        }\
      });\
    }\
\
    let totalHealthScore = 0;\
    let healthyDevices = 0;\
    let criticalDevices = 0;\
    const recommendations = [];\
\
    for (const device of devices) {\
      let healthScore = 50;\
      \
      if (device.is_online) {\
        healthScore += 30;\
      } else {\
        healthScore -= 20;\
      }\
      \
      if (device.battery_level && device.battery_level > 50) {\
        healthScore += 10;\
      }\
      \
      healthScore = Math.max(0, Math.min(100, healthScore));\
      totalHealthScore += healthScore;\
      \
      if (healthScore >= 75) {\
        healthyDevices++;\
      } else if (healthScore < 40) {\
        criticalDevices++;\
      }\
    }\
\
    const averageHealthScore = Math.round(totalHealthScore / devices.length);\
    const onlineDevices = devices.filter(d => d.is_online).length;\
\
    res.json({\
      success: true,\
      health_summary: {\
        total_devices: devices.length,\
        online_devices: onlineDevices,\
        healthy_devices: healthyDevices,\
        critical_devices: criticalDevices,\
        average_health_score: averageHealthScore,\
        recommendations: recommendations\
      }\
    });\
\
  } catch (error) {\
    console.error("Error fetching device health summary:", error);\
    res.status(500).json({ error: "Failed to fetch device health summary" });\
  }\
});\
' /var/www/whatsapp-pro/Bulk_whatsapp_message/backend/src/routes/device.routes.js