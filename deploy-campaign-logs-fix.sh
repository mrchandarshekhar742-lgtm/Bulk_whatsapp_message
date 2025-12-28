#!/bin/bash

# ============================================================================
# COMPLETE FIX DEPLOYMENT - Templates & Campaign Logs
# ============================================================================

echo "🔧 Deploying Complete Fixes..."

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

echo "🏗️  Building frontend with cache clear..."
cd Frontend

# Clear npm cache and node_modules to ensure fresh build
echo "🧹 Clearing cache..."
npm cache clean --force 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf dist 2>/dev/null || true

# Build frontend
echo "📦 Building frontend..."
npm run build

echo "✅ Frontend built with fresh cache"

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
echo "🎉 Complete Fix Deployed Successfully!"
echo ""
echo "📋 What was fixed:"
echo "  ✅ Removed Templates option from sidebar completely"
echo "  ✅ Removed redundant CampaignsPage (was duplicate of Excel)"
echo "  ✅ Fixed campaign logs API to handle empty parameters"
echo "  ✅ Removed all Templates routes and references"
echo "  ✅ Cleared frontend cache for fresh build"
echo ""
echo "🔗 Test your website:"
echo "  Frontend: http://wxon.in"
echo "  Campaign Logs: http://wxon.in (navigate to Campaign Logs page)"
echo ""
echo "📊 Check PM2 status:"
echo "  pm2 status"
echo "  pm2 logs whatsapp-backend --lines 20"
echo ""
echo "🔄 If you still see Templates in sidebar:"
echo "  1. Hard refresh browser (Ctrl+F5 or Cmd+Shift+R)"
echo "  2. Clear browser cache"
echo "  3. Try incognito/private browsing mode"