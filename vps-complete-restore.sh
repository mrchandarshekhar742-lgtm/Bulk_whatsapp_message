#!/bin/bash

# ============================================================================
# VPS COMPLETE RESTORE - Fix 502 Bad Gateway
# ============================================================================

echo "=== Starting VPS Complete Restore ==="

# Step 1: Stop current backend
echo "Step 1: Stopping current backend..."
pm2 stop bulk-messaging-backend
pm2 delete bulk-messaging-backend

# Step 2: Kill any process on port 8080
echo "Step 2: Clearing port 8080..."
pkill -f "node.*8080"
fuser -k 8080/tcp

# Step 3: Copy working backend from backup
echo "Step 3: Restoring working backend..."
cd /var/www/whatsapp-pro/Bulk_whatsapp_message
cp -r /var/www/whatsapp-pro/Bulk_whatsapp_message_backup/backend/* ./backend/

# Step 4: Ensure correct .env file
echo "Step 4: Setting up environment..."
cat > ./backend/.env << 'EOF'
NODE_ENV=production
APP_PORT=8080
APP_URL=https://wxon.in
FRONTEND_URL=https://wxon.in

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=WhatsApp@2025!
DB_NAME=bulk_whatsapp_sms
DB_POOL_MIN=2
DB_POOL_MAX=10
ENABLE_DB_ALTER=true

JWT_SECRET=6cb434f6b1715c6140739e4c6fb97eb5c81ac686cd37ad512f205521d57fa0ff15c8b0e11273f4ec65b3137376fcb711717a76d7693e9143460f60e98bec7789
JWT_REFRESH_SECRET=94b039748cd265b9d6bef95e5a73ea23b5479f794a513f9c25041233c45b228667758efa93b94dfd8a16a070ea72bbf87c2b90129762a1dfda3a0438424cfd44
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

CORS_ORIGIN=https://wxon.in,https://www.wxon.in
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
LOG_LEVEL=debug
LOG_FILE=./logs/app.log
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
SESSION_SECRET=tyfjgkugkterhejurtu88765rchjy75edyrchy654txhcy5sthrxtfu5tsexgny5strtf65e4seaww4ytuygh5r6uky
EOF

# Step 5: Install dependencies
echo "Step 5: Installing dependencies..."
cd backend
npm install

# Step 6: Add health-summary endpoint to device routes
echo "Step 6: Adding health-summary endpoint..."
cat >> ./src/routes/device.routes.js << 'EOF'

// Health Summary Endpoint
router.get('/health-summary', verifyToken, async (req, res) => {
  try {
    const devices = await Device.findAll({
      where: { user_id: req.user.id },
    });

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

    res.json({
      success: true,
      health_summary: {
        total_devices: devices.length,
        online_devices: onlineDevices,
        healthy_devices: healthyDevices,
        critical_devices: criticalDevices,
        average_health_score: averageHealthScore,
        recommendations: recommendations
      }
    });

  } catch (error) {
    console.error('Error fetching device health summary:', error);
    res.status(500).json({ error: 'Failed to fetch device health summary' });
  }
});
EOF

# Step 7: Start backend with PM2
echo "Step 7: Starting backend..."
pm2 start server.js --name "bulk-messaging-backend" --env production

# Step 8: Wait and test
echo "Step 8: Testing backend..."
sleep 5
curl -X GET http://localhost:8080/health

echo "=== VPS Complete Restore Completed ==="