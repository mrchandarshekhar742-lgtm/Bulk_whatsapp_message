@echo off
echo Starting deployment to server...

REM Build the frontend first
echo Building frontend...
cd Frontend
call npm run build
if %errorlevel% neq 0 (
    echo Frontend build failed!
    exit /b 1
)
cd ..

REM Create deployment package
echo Creating deployment package...
if exist deploy-temp rmdir /s /q deploy-temp
mkdir deploy-temp

REM Copy backend files
echo Copying backend files...
xcopy /E /I backend deploy-temp\backend
if exist deploy-temp\backend\node_modules rmdir /s /q deploy-temp\backend\node_modules
if exist deploy-temp\backend\logs rmdir /s /q deploy-temp\backend\logs
if exist deploy-temp\backend\uploads rmdir /s /q deploy-temp\backend\uploads

REM Copy frontend build
echo Copying frontend build...
xcopy /E /I Frontend\dist deploy-temp\frontend

REM Copy database
echo Copying database...
xcopy /E /I database deploy-temp\database

REM Copy nginx config
echo Copying nginx config...
copy nginx.conf deploy-temp\

REM Upload to server
echo Uploading to server...
scp -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa -r deploy-temp/* root@66.116.196.226:/var/www/whatsapp-pro/Bulk_whatsapp_message/

REM Install dependencies and restart services on server
echo Installing dependencies and restarting services...
ssh -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa root@66.116.196.226 "cd /var/www/whatsapp-pro/Bulk_whatsapp_message/backend && npm install --production && pm2 restart whatsapp-backend || pm2 start server.js --name whatsapp-backend"

REM Reload nginx
ssh -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa root@66.116.196.226 "nginx -t && systemctl reload nginx"

REM Cleanup
echo Cleaning up...
rmdir /s /q deploy-temp

echo Deployment completed successfully!
echo Backend should be running on port 8090
echo Frontend should be accessible via nginx
pause