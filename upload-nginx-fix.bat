@echo off
echo ========================================
echo Uploading Nginx Fix to VPS
echo ========================================

echo.
echo Step 1: Uploading nginx configuration...
scp nginx.conf root@wxon.in:/etc/nginx/sites-available/wxon.in

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Step 2: Testing nginx configuration on VPS...
    ssh root@wxon.in "nginx -t"
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo Step 3: Reloading nginx...
        ssh root@wxon.in "systemctl reload nginx"
        
        echo.
        echo Step 4: Checking nginx status...
        ssh root@wxon.in "systemctl status nginx --no-pager -l"
        
        echo.
        echo ========================================
        echo SUCCESS! MIME Types Fix Applied!
        echo ========================================
        echo.
        echo Test your website now: https://wxon.in
        echo JavaScript files should load properly now.
        echo.
    ) else (
        echo.
        echo ERROR: Nginx configuration test failed!
        echo Reverting changes...
        ssh root@wxon.in "systemctl reload nginx"
    )
) else (
    echo.
    echo ERROR: Failed to upload nginx configuration!
    echo Please check your connection and try again.
)

echo.
pause