#!/bin/bash

# VPS Health Summary Debug and Fix Script
# Password: Wxon@1234

echo "=== VPS Health Summary Debug Script ==="
echo "Connecting to VPS and debugging health-summary endpoint..."

# Step 1: Check current backend status
echo "Step 1: Checking backend status..."
pm2 status bulk-messaging-backend

# Step 2: Check recent backend logs
echo "Step 2: Checking recent backend logs..."
pm2 logs bulk-messaging-backend --lines 30

# Step 3: Test health-summary endpoint directly
echo "Step 3: Testing health-summary endpoint..."
curl -X GET "http://localhost:8080/api/devices/health-summary" \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -v

# Step 4: Check if DeviceHealthMonitor service exists
echo "Step 4: Checking DeviceHealthMonitor service..."
ls -la /var/www/whatsapp-pro/Bulk_whatsapp_message/backend/src/services/DeviceHealthMonitor.js

# Step 5: Check database connection
echo "Step 5: Testing database connection..."
mysql -u root -p'WhatsApp@2025!' -e "USE bulk_whatsapp_sms; SELECT COUNT(*) as device_count FROM devices;"

# Step 6: Check if all required models are available
echo "Step 6: Checking models..."
cd /var/www/whatsapp-pro/Bulk_whatsapp_message/backend
node -e "
try {
  const { Device, DeviceLog, Campaign, DeviceCampaign } = require('./src/models');
  console.log('✓ All models loaded successfully');
  console.log('Device model:', typeof Device);
  console.log('DeviceLog model:', typeof DeviceLog);
  console.log('Campaign model:', typeof Campaign);
  console.log('DeviceCampaign model:', typeof DeviceCampaign);
} catch (error) {
  console.error('✗ Model loading failed:', error.message);
}
"

# Step 7: Test a simple device query
echo "Step 7: Testing device query..."
node -e "
const { Device } = require('./src/models');
Device.findAll({ limit: 1 })
  .then(devices => console.log('✓ Device query successful, found:', devices.length, 'devices'))
  .catch(error => console.error('✗ Device query failed:', error.message));
"

# Step 8: Check if DeviceHealthMonitor service is causing issues
echo "Step 8: Checking DeviceHealthMonitor service..."
if [ -f "/var/www/whatsapp-pro/Bulk_whatsapp_message/backend/src/services/DeviceHealthMonitor.js" ]; then
  echo "DeviceHealthMonitor service exists"
else
  echo "DeviceHealthMonitor service missing - this might be the issue!"
fi

# Step 9: Create a simple health-summary test
echo "Step 9: Creating simple health-summary test..."
node -e "
const express = require('express');
const { Device } = require('./src/models');

async function testHealthSummary() {
  try {
    console.log('Testing health-summary logic...');
    
    // Simulate the health-summary endpoint logic
    const devices = await Device.findAll({ limit: 5 });
    console.log('Found devices:', devices.length);
    
    if (devices.length === 0) {
      console.log('No devices found - returning empty summary');
      return {
        success: true,
        health_summary: {
          total_devices: 0,
          online_devices: 0,
          healthy_devices: 0,
          critical_devices: 0,
          average_health_score: 0,
          recommendations: []
        }
      };
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
      
      if (device.battery_level) {
        if (device.battery_level > 50) {
          healthScore += 10;
        } else if (device.battery_level < 20) {
          healthScore -= 15;
        }
      }
      
      const remainingCapacity = device.daily_limit - device.messages_sent_today;
      if (remainingCapacity > device.daily_limit * 0.5) {
        healthScore += 10;
      }
      
      healthScore = Math.max(0, Math.min(100, healthScore));
      totalHealthScore += healthScore;
      
      if (healthScore >= 75) {
        healthyDevices++;
      } else if (healthScore < 40) {
        criticalDevices++;
        recommendations.push(\`Device \${device.device_label} needs attention\`);
      }
    }
    
    const averageHealthScore = devices.length > 0 ? Math.round(totalHealthScore / devices.length) : 0;
    const onlineDevices = devices.filter(d => d.is_online).length;
    
    const result = {
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
    
    console.log('✓ Health summary test successful:', JSON.stringify(result, null, 2));
    return result;
    
  } catch (error) {
    console.error('✗ Health summary test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testHealthSummary().then(() => process.exit(0)).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
"

echo "=== Debug script completed ==="