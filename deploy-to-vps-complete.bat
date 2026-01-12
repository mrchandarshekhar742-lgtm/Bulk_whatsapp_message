@echo off
echo ============================================================================
echo WHATSAPP PRO - COMPLETE VPS DEPLOYMENT
echo ============================================================================

echo.
echo This script will:
echo 1. SSH to your VPS
echo 2. Pull the latest code from GitHub
echo 3. Install dependencies
echo 4. Create .env file
echo 5. Restart backend service
echo 6. Reload nginx
echo.

set /p CONFIRM="Continue with deployment? (y/n): "
if /i "%CONFIRM%" neq "y" (
    echo Deployment cancelled.
    pause
    exit /b
)

echo.
echo Connecting to VPS and running deployment...
echo.

ssh root@66-116-196-226 "cd /var/www/whatsapp-pro/Bulk_whatsapp_message && git pull origin main && cd backend && npm install --production && mkdir -p uploads logs && pm2 stop whatsapp-pro 2>/dev/null; pm2 delete whatsapp-pro 2>/dev/null; pm2 start server.js --name whatsapp-pro --env production && nginx -t && nginx -s reload && echo 'Deployment completed!' && pm2 status"

echo.
echo ============================================================================
echo DEPLOYMENT COMPLETED!
echo ============================================================================
echo.
echo Please test the website:
echo - Website: https://wxon.in
echo - Backend Health: https://wxon.in/health
echo - API Test: https://wxon.in/api/test/db
echo.
pause