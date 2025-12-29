#!/bin/bash

echo "🚀 Deploying campaign logs fix to VPS..."

# Copy files to VPS
scp -r backend/src/routes/campaign.routes.js root@66.116.196.226:/var/www/whatsapp-pro/backend/src/routes/
scp -r Frontend/src/pages/CampaignLogsPage.jsx root@66.116.196.226:/var/www/whatsapp-pro/Frontend/src/pages/

# Restart services on VPS
ssh root@66.116.196.226 << 'EOF'
cd /var/www/whatsapp-pro

# Restart backend
pm2 restart whatsapp-backend

# Rebuild frontend
cd Frontend
npm run build
cd ..

echo "✅ Campaign logs fix deployed successfully!"
EOF

echo "🎉 Deployment complete!"