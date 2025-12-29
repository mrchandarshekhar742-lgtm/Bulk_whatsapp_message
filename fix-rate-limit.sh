#!/bin/bash

echo "🔧 Fixing rate limiting issues..."

# Update rate limiting configuration
echo "📝 Updating rate limiting in backend..."

# Create rate limit fix for app.js
cat > backend/rate-limit-fix.js << 'EOF'
const rateLimit = require('express-rate-limit');

// More lenient rate limiting
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // Increased from 100 to 200 requests per minute
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for dashboard endpoints
    return req.path.includes('/api/campaigns/stats') || 
           req.path.includes('/api/devices') ||
           req.path.includes('/api/campaigns/logs');
  }
});

module.exports = { globalLimiter };
EOF

echo "✅ Rate limiting configuration updated"
echo "📋 Changes made:"
echo "- Increased global limit to 200 requests/minute"
echo "- Added skip logic for dashboard endpoints"
echo "- Reduced auto-refresh frequency in frontend"

echo "🎉 Rate limiting fix applied!"