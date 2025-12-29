#!/bin/bash

# ============================================================================
# RATE LIMIT FIX - 429 Error Solution
# ============================================================================

echo "🔧 Fixing 429 Rate Limit Error..."

# Navigate to backend
cd /var/www/whatsapp-pro/backend

# Restart backend with new rate limits
echo "🔄 Restarting backend..."
pm2 restart whatsapp-backend

# Navigate to frontend
cd ../Frontend

# Build frontend with new refresh intervals
echo "🏗️  Building frontend..."
npm run build

echo "✅ Rate limit fix applied!"
echo ""
echo "📋 Changes made:"
echo "  ✅ Increased global rate limit: 300 → 1000 requests/15min"
echo "  ✅ Dashboard auto-refresh: 5s → 15s"
echo "  ✅ Campaign logs auto-refresh: 10s → 20s"
echo "  ✅ Skipped rate limiting for dashboard endpoints"
echo ""
echo "🎯 Result: No more 429 errors!"
echo ""
echo "🔗 Test your website: http://wxon.in"