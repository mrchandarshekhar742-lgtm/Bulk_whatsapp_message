@echo off
echo ========================================
echo Git-based VPS Deployment
echo ========================================

echo.
echo Step 1: Pulling latest code from GitHub...
ssh -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa root@66.116.196.226 "cd /var/www/whatsapp-pro/Bulk_whatsapp_message && git pull origin main"

echo.
echo Step 2: Installing/updating dependencies...
ssh -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa root@66.116.196.226 "cd /var/www/whatsapp-pro/Bulk_whatsapp_message/Frontend && npm install"

echo.
echo Step 3: Building frontend...
ssh -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa root@66.116.196.226 "cd /var/www/whatsapp-pro/Bulk_whatsapp_message/Frontend && npm run build"

echo.
echo Step 4: Setting proper permissions...
ssh -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa root@66.116.196.226 "chmod -R 755 /var/www/whatsapp-pro/Bulk_whatsapp_message/Frontend/dist/"

echo.
echo Step 5: Installing backend dependencies...
ssh -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa root@66.116.196.226 "cd /var/www/whatsapp-pro/Bulk_whatsapp_message/backend && npm install"

echo.
echo Step 6: Restarting backend...
ssh -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa root@66.116.196.226 "pm2 restart bulk-messaging-backend"

echo.
echo Step 7: Testing deployment...
curl -I https://wxon.in/api/health

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Website: https://wxon.in
echo API Health: https://wxon.in/api/health
echo.

pause