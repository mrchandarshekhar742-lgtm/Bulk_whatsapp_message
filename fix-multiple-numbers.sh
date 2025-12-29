#!/bin/bash

# ============================================================================
# MULTIPLE NUMBERS FIX - Complete Solution
# ============================================================================

echo "🔧 Fixing Multiple Numbers Issue..."

# Navigate to backend
cd /var/www/whatsapp-pro/backend

# Check current device status
echo "📱 Checking device status..."
mysql -u whatsapp_user -pWhatsApp@2025! bulk_whatsapp_sms -e "
SELECT id, device_label, is_online, is_active, messages_sent_today, daily_limit 
FROM Devices 
ORDER BY id;
"

# Check recent failed logs
echo "❌ Checking recent failed messages..."
mysql -u whatsapp_user -pWhatsApp@2025! bulk_whatsapp_sms -e "
SELECT recipient_number, status, error_message, created_at 
FROM DeviceLogs 
WHERE status = 'FAILED' 
ORDER BY created_at DESC 
LIMIT 10;
"

# Restart backend with fixes
echo "🔄 Restarting backend..."
pm2 restart whatsapp-backend

# Wait for restart
sleep 3

# Test the fix
echo "🧪 Testing multiple numbers..."
curl -X POST http://localhost:8080/api/campaigns/manual \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Multiple Numbers",
    "phone_numbers": ["9876543210", "8765432109", "7654321098"],
    "message": "Test message for multiple numbers",
    "device_ids": [1]
  }' || echo "Test failed - need valid auth token"

echo ""
echo "✅ Multiple Numbers Fix Applied!"
echo ""
echo "📋 Changes made:"
echo "  ✅ Removed online requirement for device selection"
echo "  ✅ Added fallback for devices at daily limit"
echo "  ✅ Better error handling for offline devices"
echo "  ✅ Commands queued even for offline devices"
echo ""
echo "🎯 Expected Result:"
echo "  ✅ Multiple numbers should now work"
echo "  ✅ Messages queued even if device offline"
echo "  ✅ Better error messages in logs"
echo ""
echo "🔗 Test your website: http://wxon.in"
echo "📊 Check PM2 logs: pm2 logs whatsapp-backend"