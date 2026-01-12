@echo off
echo ========================================
echo Fixing MIME Types for JavaScript Files
echo ========================================

echo.
echo Step 1: Uploading updated nginx configuration...
scp nginx.conf root@wxon.in:/etc/nginx/sites-available/wxon.in

echo.
echo Step 2: Testing nginx configuration...
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
    echo MIME Types Fix Completed Successfully!
    echo ========================================
    echo.
    echo The website should now load JavaScript files correctly.
    echo Test the website at: https://wxon.in
    echo.
) else (
    echo.
    echo ERROR: Nginx configuration test failed!
    echo Please check the configuration and try again.
    echo.
)

pause