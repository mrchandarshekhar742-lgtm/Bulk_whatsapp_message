@echo off
echo Fixing WhatsApp Pro Deployment Issues...

REM Try to connect and check server status
echo Checking server connection...
ssh -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa -o ConnectTimeout=10 root@66.116.196.226 "echo 'Connected successfully'" || (
    echo Server connection failed. Please check:
    echo 1. Server is online
    echo 2. SSH access is working
    echo 3. Network connectivity
    pause
    exit /b 1
)

REM Check if WhatsApp backend is running
echo Checking backend status...
ssh -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa root@66.116.196.226 "ps aux | grep whatsapp | grep -v grep"

REM Check port 8080
echo Checking port 8080...
ssh -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa root@66.116.196.226 "netstat -tlnp | grep 8080"

REM Test API health
echo Testing API health...
ssh -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa root@66.116.196.226 "curl -s http://localhost:8080/health"

REM If server is not responding, restart it
echo Restarting WhatsApp backend...
ssh -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa root@66.116.196.226 "pkill -f whatsapp && cd /var/www/whatsapp-pro/Bulk_whatsapp_message/backend && nohup node server.js > server.log 2>&1 &"

echo Waiting for server to start...
timeout /t 10

REM Test API again
echo Testing API after restart...
ssh -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa root@66.116.196.226 "curl -s http://localhost:8080/health"

echo.
echo Deployment fix completed!
echo.
echo Access your application at:
echo Frontend: http://66.116.196.226 (or your domain)
echo Backend: http://66.116.196.226:8080/api
echo.
pause