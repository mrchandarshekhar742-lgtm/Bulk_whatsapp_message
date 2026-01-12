#!/bin/bash

echo "============================================================================"
echo "WHATSAPP PRO - VPS DEPLOYMENT SCRIPT"
echo "============================================================================"

# Navigate to project directory
cd /var/www/whatsapp-pro/Bulk_whatsapp_message

echo ""
echo "[1/6] Pulling latest code from GitHub..."
git pull origin main

echo ""
echo "[2/6] Installing/updating backend dependencies..."
cd backend
npm install --production

echo ""
echo "[3/6] Creating .env file if not exists..."
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << 'EOF'
# ============================================================================
# WHATSAPP PRO - ENVIRONMENT CONFIGURATION
# ============================================================================

# APPLICATION
NODE_ENV=production
APP_PORT=8080
APP_URL=https://wxon.in
FRONTEND_URL=https://wxon.in

# DATABASE
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=WhatsApp@2025!
DB_NAME=bulk_whatsapp_sms
DB_POOL_MIN=2
DB_POOL_MAX=10
ENABLE_DB_ALTER=true

# JWT AUTHENTICATION
JWT_SECRET=6cb434f6b1715c6140739e4c6fb97eb5c81ac686cd37ad512f205521d57fa0ff15c8b0e11273f4ec65b3137376fcb711717a76d7693e9143460f60e98bec7789
JWT_REFRESH_SECRET=94b039748cd265b9d6bef95e5a73ea23b5479f794a513f9c25041233c45b228667758efa93b94dfd8a16a070ea72bbf87c2b90129762a1dfda3a0438424cfd44
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# CORS
CORS_ORIGIN=https://wxon.in,https://www.wxon.in

# FILE UPLOAD
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# LOGGING
LOG_LEVEL=debug
LOG_FILE=./logs/app.log

# RATE LIMITING
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# SESSION
SESSION_SECRET=tyfjgkugkterhejurtu88765rchjy75edyrchy654txhcy5strtf65e4seaww4ytuygh5r6uky
EOF
    echo ".env file created successfully!"
else
    echo ".env file already exists, skipping..."
fi

echo ""
echo "[4/6] Creating necessary directories..."
mkdir -p uploads logs

echo ""
echo "[5/6] Stopping and restarting backend service..."
# Stop existing PM2 process if running
pm2 stop whatsapp-pro 2>/dev/null || echo "No existing PM2 process found"
pm2 delete whatsapp-pro 2>/dev/null || echo "No existing PM2 process to delete"

# Start new PM2 process
pm2 start server.js --name whatsapp-pro --env production

echo ""
echo "[6/6] Reloading nginx configuration..."
nginx -t && nginx -s reload

echo ""
echo "============================================================================"
echo "DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "============================================================================"
echo ""
echo "Services Status:"
pm2 status
echo ""
echo "Website: https://wxon.in"
echo "Backend Health: https://wxon.in/health"
echo "API Test: https://wxon.in/api/test/db"
echo ""
echo "============================================================================"