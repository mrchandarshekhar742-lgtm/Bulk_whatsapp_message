@echo off
echo Starting quick deployment (code update only)...

REM Stop the current backend process (using the actual process ID we found)
echo Stopping backend process...
ssh -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa root@66.116.196.226 "kill 2336192"

REM Upload backend source files only
echo Uploading backend source files...
scp -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa -r backend/src/* root@66.116.196.226:/var/www/whatsapp-pro/Bulk_whatsapp_message/backend/src/
scp -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa backend/server.js root@66.116.196.226:/var/www/whatsapp-pro/Bulk_whatsapp_message/backend/
scp -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa backend/package.json root@66.116.196.226:/var/www/whatsapp-pro/Bulk_whatsapp_message/backend/
scp -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa backend/.env root@66.116.196.226:/var/www/whatsapp-pro/Bulk_whatsapp_message/backend/

REM Build and upload frontend
echo Building and uploading frontend...
cd Frontend
call npm run build
scp -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa -r dist/* root@66.116.196.226:/var/www/whatsapp-pro/Bulk_whatsapp_message/frontend/
cd ..

REM Restart backend on port 8090
echo Restarting backend...
ssh -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa root@66.116.196.226 "cd /var/www/whatsapp-pro/Bulk_whatsapp_message/backend && nohup node server.js > /dev/null 2>&1 &"

echo Quick deployment completed!
echo Backend should be running on port 8090
echo Check with: ssh root@66.116.196.226 "ps aux | grep node"
pause