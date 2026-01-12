@echo off
echo ========================================
echo Direct VPS Nginx MIME Type Fix
echo ========================================

echo.
echo This will:
echo 1. Upload the fixed nginx.conf to VPS
echo 2. Test the configuration
echo 3. Reload nginx if test passes
echo 4. Verify the fix is working
echo.

set /p confirm="Continue? (y/n): "
if /i "%confirm%" NEQ "y" goto :end

echo.
echo ========================================
echo Step 1: Uploading nginx configuration
echo ========================================
scp nginx.conf root@wxon.in:/etc/nginx/sites-available/wxon.in

echo.
echo ========================================
echo Step 2: Testing nginx configuration
echo ========================================
ssh root@wxon.in "nginx -t"

echo.
echo ========================================
echo Step 3: Reloading nginx
echo ========================================
ssh root@wxon.in "systemctl reload nginx"

echo.
echo ========================================
echo Step 4: Checking nginx status
echo ========================================
ssh root@wxon.in "systemctl status nginx --no-pager"

echo.
echo ========================================
echo Step 5: Testing MIME types
echo ========================================
echo Testing JavaScript file MIME type...
curl -I https://wxon.in/assets/index-BJwuqRYM.js | findstr "Content-Type"

echo.
echo Testing CSS file MIME type...
curl -I https://wxon.in/assets/index-BL10wiD3.css | findstr "Content-Type"

echo.
echo ========================================
echo Fix Complete!
echo ========================================
echo.
echo Expected results:
echo - JavaScript files: Content-Type: application/javascript
echo - CSS files: Content-Type: text/css
echo.
echo Test your website: https://wxon.in
echo.

:end
pause