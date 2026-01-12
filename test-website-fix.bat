@echo off
echo ========================================
echo Testing Website After MIME Type Fix
echo ========================================

echo.
echo 1. Testing main website...
curl -s -o nul -w "Status: %%{http_code} | Content-Type: %%{content_type}\n" https://wxon.in/

echo.
echo 2. Testing JavaScript file MIME type...
curl -s -o nul -w "Status: %%{http_code} | Content-Type: %%{content_type}\n" https://wxon.in/assets/index-BJwuqRYM.js

echo.
echo 3. Testing CSS file MIME type...
curl -s -o nul -w "Status: %%{http_code} | Content-Type: %%{content_type}\n" https://wxon.in/assets/index-BL10wiD3.css

echo.
echo 4. Testing API endpoint...
curl -s -o nul -w "Status: %%{http_code} | Content-Type: %%{content_type}\n" https://wxon.in/api/health

echo.
echo ========================================
echo EXPECTED RESULTS:
echo ========================================
echo Main website: Status: 200 ^| Content-Type: text/html
echo JavaScript: Status: 200 ^| Content-Type: application/javascript
echo CSS: Status: 200 ^| Content-Type: text/css
echo API: Status: 200 ^| Content-Type: application/json
echo ========================================

pause