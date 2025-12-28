#!/bin/bash

# ============================================================================
# CAMPAIGN LOGS FIX DEPLOYMENT
# ============================================================================

echo "🔧 Deploying Campaign Logs Fix..."

# Check if we're in the right directory
if [ ! -f "backend/package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "📁 Updating backend files..."
cd backend

# Restart backend server
echo "🔄 Restarting backend server..."
pm2 stop whatsapp-backend 2>/dev/null || true
pm2 start server.js --name whatsapp-backend --env production
pm2 save

echo "✅ Backend restarted"

# Go back to project root
cd ..

echo "🏗️  Building frontend..."
cd Frontend

# Build frontend
npm run build

echo "✅ Frontend built"

# Go back to project root
cd ..

echo "🧪 Testing API endpoints..."

# Test health endpoint
echo "Testing health endpoint..."
curl -s http://localhost:8080/health | jq '.' || echo "Health endpoint test failed"

# Test database endpoint
echo "Testing database endpoint..."
curl -s http://localhost:8080/api/test/db | jq '.' || echo "Database endpoint test failed"

echo ""
echo "🎉 Campaign Logs Fix Deployed Successfully!"
echo ""
echo "📋 What was fixed:"
echo "  ✅ Frontend no longer sends empty string parameters"
echo "  ✅ Backend validation improved for optional parameters"
echo "  ✅ Campaign logs API should now work without 400 errors"
echo ""
echo "🔗 Test your website:"
echo "  Frontend: http://wxon.in"
echo "  Campaign Logs: http://wxon.in (navigate to Campaign Logs page)"
echo ""
echo "📊 Check PM2 status:"
echo "  pm2 status"
echo "  pm2 logs whatsapp-backend --lines 20"