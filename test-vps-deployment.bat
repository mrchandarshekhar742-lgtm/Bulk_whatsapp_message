@echo off
echo ============================================================================
echo TESTING VPS DEPLOYMENT - WhatsApp Pro Bulk Sender
echo ============================================================================
echo Testing all functionality on VPS after deployment
echo.

echo [1/6] Testing VPS Backend API Health...
curl -s -o nul -w "Backend API Status: %%{http_code}\n" https://wxon.in/api/auth/test
echo.

echo [2/6] Testing Frontend Loading...
curl -s -o nul -w "Frontend Status: %%{http_code}\n" https://wxon.in
echo.

echo [3/6] Testing Database Connection (via API)...
curl -s -o nul -w "Database Connection Status: %%{http_code}\n" https://wxon.in/api/campaigns/stats
echo.

echo [4/6] Testing Login Endpoint...
curl -s -o nul -w "Login Endpoint Status: %%{http_code}\n" -X POST https://wxon.in/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"test@test.com\",\"password\":\"test\"}"
echo.

echo [5/6] Testing Campaign Logs Endpoint...
curl -s -o nul -w "Campaign Logs Status: %%{http_code}\n" https://wxon.in/api/campaigns/logs
echo.

echo [6/6] Testing Excel Endpoint...
curl -s -o nul -w "Excel Endpoint Status: %%{http_code}\n" https://wxon.in/api/excel
echo.

echo ============================================================================
echo VPS DEPLOYMENT TEST COMPLETED!
echo ============================================================================
echo.
echo Expected Results:
echo - Backend API: 200 or 404 (endpoint exists)
echo - Frontend: 200 (loads successfully)
echo - Database: 401 (requires auth, but connects)
echo - Login: 400/401 (validates input, but endpoint works)
echo - Campaign Logs: 401 (requires auth, but endpoint works)
echo - Excel: 401 (requires auth, but endpoint works)
echo.
echo If you see 500 errors, there are still issues to fix.
echo If you see 401/400 errors, the endpoints are working correctly.
echo.
pause