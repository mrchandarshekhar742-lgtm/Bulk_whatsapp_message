@echo off
echo ============================================================================
echo WHATSAPP PRO - DEPLOY FIXED CODE TO VPS
echo ============================================================================

echo.
echo [1/4] Adding all changes to git...
git add .

echo.
echo [2/4] Committing changes...
git commit -m "Fix: Database schema issues and HTTPS configuration

- Fixed Campaign model timestamp configuration (createdAt -> created_at)
- All models now use consistent database column names
- Frontend built with new hash: index-CqxWDmnr.js
- Backend routes properly configured for /api paths
- Ready for VPS deployment"

echo.
echo [3/4] Pushing to GitHub...
git push origin main

echo.
echo [4/4] Deployment ready!
echo.
echo NEXT STEPS:
echo 1. SSH to VPS: ssh root@66-116-196-226
echo 2. Navigate to: cd /var/www/whatsapp-pro/Bulk_whatsapp_message
echo 3. Pull latest: git pull origin main
echo 4. Restart backend: pm2 restart whatsapp-pro
echo 5. Test website: https://wxon.in
echo.
echo ============================================================================
pause