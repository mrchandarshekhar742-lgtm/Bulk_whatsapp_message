@echo off
echo ========================================
echo Testing MIME Type Fix
echo ========================================

echo.
echo Testing JavaScript file MIME type...
curl -I https://wxon.in/assets/index-BJwuqRYM.js

echo.
echo Testing CSS file MIME type...
curl -I https://wxon.in/assets/index-BL10wiD3.css

echo.
echo Testing main page...
curl -I https://wxon.in/

echo.
echo ========================================
echo WHAT TO LOOK FOR:
echo ========================================
echo.
echo For JavaScript files (.js):
echo   Content-Type: application/javascript
echo.
echo For CSS files (.css):
echo   Content-Type: text/css
echo.
echo For HTML files:
echo   Content-Type: text/html
echo.

pause