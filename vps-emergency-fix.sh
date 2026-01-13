#!/bin/bash

# ============================================================================
# VPS EMERGENCY FIX SCRIPT - 502 Bad Gateway Resolution
# ============================================================================

echo "=== VPS Emergency Fix Started ==="
cd /var/www/whatsapp-pro/Bulk_whatsapp_message

# 1. Check PM2 status
echo "1. Checking PM2 status..."
pm2 status

# 2. Stop and restart backend
echo "2. Stopping backend..."
pm2 stop bulk-messaging-backend
pm2 delete bulk-messaging-backend

# 3. Check if port 8080 is occupied
echo "3. Checking port 8080..."
netstat -tulpn | grep :8080
lsof -i :8080

# 4. Kill any process on port 8080
echo "4. Killing processes on port 8080..."
pkill -f "node.*8080"
fuser -k 8080/tcp

# 5. Check database connection
echo "5. Testing database connection..."
mysql -u root -pWhatsApp@2025! -e "USE bulk_whatsapp_sms; SELECT COUNT(*) FROM users;"

# 6. Pull latest code
echo "6. Pulling latest code..."
git pull origin main

# 7. Install dependencies
echo "7. Installing backend dependencies..."
cd backend
npm install

# 8. Start backend with PM2
echo "8. Starting backend..."
pm2 start server.js --name "bulk-messaging-backend" --env production

# 9. Check PM2 logs
echo "9. Checking PM2 logs..."
pm2 logs bulk-messaging-backend --lines 20

# 10. Test backend directly
echo "10. Testing backend health..."
sleep 5
curl -X GET http://localhost:8080/api/health || echo "Backend health check failed"

# 11. Check nginx status
echo "11. Checking nginx..."
systemctl status nginx
nginx -t

# 12. Restart nginx if needed
echo "12. Restarting nginx..."
systemctl restart nginx

echo "=== VPS Emergency Fix Completed ==="