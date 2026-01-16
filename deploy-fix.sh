#!/bin/bash
# Quick deployment script for VPS
# Run this on VPS: bash deploy-fix.sh

echo "🚀 Starting deployment..."

# Navigate to project
cd /var/www/whatsapp-pro/Bulk_whatsapp_message || exit 1

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Fix database
echo "🔧 Fixing database rotation_mode column..."
mysql -u root -pWhatsApp@2025! bulk_messaging -e "ALTER TABLE campaigns MODIFY COLUMN rotation_mode ENUM('RANDOM', 'ROUND_ROBIN', 'LEAST_USED', 'WARMUP_AWARE', 'SMART_ROTATION') DEFAULT 'SMART_ROTATION';"

if [ $? -eq 0 ]; then
    echo "✅ Database updated successfully"
else
    echo "❌ Database update failed"
    exit 1
fi

# Restart backend
echo "🔄 Restarting backend..."
cd backend
pm2 restart bulk-messaging-backend

# Show status
echo "📊 Backend status:"
pm2 status bulk-messaging-backend

echo "✅ Deployment complete!"
echo "Check logs with: pm2 logs bulk-messaging-backend --lines 20"
