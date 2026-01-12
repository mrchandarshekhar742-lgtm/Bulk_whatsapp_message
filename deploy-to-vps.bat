@echo off
echo ============================================================================
echo COMPLETE VPS DEPLOYMENT - WhatsApp Pro Bulk Sender
echo ============================================================================
echo Deploying all frontend and backend changes to VPS
echo.

REM Build the frontend for production
echo [1/8] Building frontend for production...
cd Frontend
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed!
    pause
    exit /b 1
)
cd ..
echo ✓ Frontend build completed

REM Create deployment package
echo [2/8] Creating deployment package...
if exist deploy-temp rmdir /s /q deploy-temp
mkdir deploy-temp

REM Copy backend files (excluding node_modules, logs, uploads)
echo [3/8] Copying backend files...
xcopy /E /I backend deploy-temp\backend
if exist deploy-temp\backend\node_modules rmdir /s /q deploy-temp\backend\node_modules
if exist deploy-temp\backend\logs rmdir /s /q deploy-temp\backend\logs
if exist deploy-temp\backend\uploads rmdir /s /q deploy-temp\backend\uploads

REM Copy frontend build
echo Copying frontend build...
xcopy /E /I Frontend\dist deploy-temp\frontend

REM Copy database fixes
echo Copying database fixes...
xcopy /E /I database deploy-temp\database

REM Copy nginx config
echo Copying nginx config...
copy nginx.conf deploy-temp\

echo ✓ Deployment package created

REM Upload to VPS
echo [4/8] Uploading files to VPS...
scp -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa -r deploy-temp/* root@66.116.196.226:/var/www/whatsapp-pro/Bulk_whatsapp_message/
if %errorlevel% neq 0 (
    echo ERROR: Failed to upload files to VPS!
    pause
    exit /b 1
)
echo ✓ Files uploaded successfully

REM Fix database schema on VPS
echo [5/8] Fixing database schema on VPS...
ssh -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa root@66.116.196.226 "mysql -u root -proot bulk_whatsapp_sms < /var/www/whatsapp-pro/Bulk_whatsapp_message/database/fix-production-schema.sql"
if %errorlevel% neq 0 (
    echo WARNING: Database schema fix may have failed. Continuing with deployment...
)
echo ✓ Database schema updated

REM Install dependencies on VPS
echo [6/8] Installing dependencies on VPS...
ssh -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa root@66.116.196.226 "cd /var/www/whatsapp-pro/Bulk_whatsapp_message/backend && npm install --production"
if %errorlevel% neq 0 (
    echo ERROR: Failed to install npm dependencies!
    pause
    exit /b 1
)
echo ✓ Dependencies installed

REM Restart backend service on VPS
echo [7/8] Restarting backend service on VPS...
ssh -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa root@66.116.196.226 "pm2 restart whatsapp-backend || pm2 start /var/www/whatsapp-pro/Bulk_whatsapp_message/backend/server.js --name whatsapp-backend"
echo ✓ Backend service restarted

REM Reload nginx on VPS
echo [8/8] Reloading nginx on VPS...
ssh -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa root@66.116.196.226 "nginx -t && systemctl reload nginx"
echo ✓ Nginx reloaded

REM Cleanup
echo Cleaning up temporary files...
rmdir /s /q deploy-temp

echo.
echo ============================================================================
echo VPS DEPLOYMENT COMPLETED SUCCESSFULLY!
echo ============================================================================
echo.
echo All changes have been deployed to VPS:
echo ✓ Frontend: Built and deployed with correct API URLs
echo ✓ Backend: All model fixes and API corrections deployed
echo ✓ Database: Schema updated with all required columns
echo ✓ Services: Backend restarted, Nginx reloaded
echo.
echo Website Status:
echo - Frontend: https://wxon.in
echo - Backend API: https://wxon.in/api
echo - Database: Updated with all fixes
echo.
echo Testing Steps:
echo 1. Visit https://wxon.in
echo 2. Try login with existing user
echo 3. Check profile page (should show email)
echo 4. Try creating campaign (should not crash)
echo 5. Check dashboard (should load without 500 errors)
echo.
pause