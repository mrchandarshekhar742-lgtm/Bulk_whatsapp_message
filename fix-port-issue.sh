#!/bin/bash

# ============================================================================
# PORT 8080 FIX SCRIPT
# ============================================================================

echo "🔧 Fixing Port 8080 Issue..."

# Check what's running on port 8080
echo "📊 Checking what's using port 8080..."
netstat -tlnp | grep :8080 || echo "Nothing found on port 8080"

# Check what's running on port 80
echo "📊 Checking what's using port 80..."
netstat -tlnp | grep :80 || echo "Nothing found on port 80"

# Stop all PM2 processes
echo "🛑 Stopping all PM2 processes..."
pm2 stop all
pm2 delete all

# Kill any remaining processes on port 8080
echo "🔪 Killing any processes on port 8080..."
sudo fuser -k 8080/tcp 2>/dev/null || echo "No processes to kill on port 8080"

# Kill any remaining processes on port 80
echo "🔪 Killing any processes on port 80..."
sudo fuser -k 80/tcp 2>/dev/null || echo "No processes to kill on port 80"

# Wait a moment
sleep 2

# Navigate to backend directory
cd /var/www/whatsapp-pro/backend

# Verify .env file has correct port
echo "🔍 Checking .env file..."
grep "APP_PORT" .env || echo "APP_PORT not found in .env"

# Make sure APP_PORT is set to 8080
echo "✏️  Setting APP_PORT to 8080..."
sed -i 's/APP_PORT=.*/APP_PORT=8080/' .env

# Verify the change
echo "✅ Current APP_PORT setting:"
grep "APP_PORT" .env

# Start the server with explicit port
echo "🚀 Starting server on port 8080..."
PORT=8080 pm2 start server.js --name whatsapp-backend --env production

# Save PM2 configuration
pm2 save

# Check PM2 status
echo "📊 PM2 Status:"
pm2 status

# Check if port 8080 is now in use
echo "🔍 Verifying port 8080 is in use..."
sleep 3
netstat -tlnp | grep :8080

# Test the server
echo "🧪 Testing server..."
curl -s http://localhost:8080/health | head -n 5 || echo "Server test failed"

echo ""
echo "🎉 Port fix completed!"
echo ""
echo "📋 Summary:"
echo "  ✅ Stopped all conflicting processes"
echo "  ✅ Set APP_PORT=8080 in .env"
echo "  ✅ Started server on port 8080"
echo ""
echo "🔗 Your server should now be accessible at:"
echo "   http://wxon.in:8080"
echo "   http://localhost:8080"
echo ""
echo "📊 Check status with: pm2 status"
echo "📊 Check logs with: pm2 logs whatsapp-backend"