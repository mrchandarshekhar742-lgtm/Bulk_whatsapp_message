@echo off
echo =========================================
echo WhatsApp Pro - Android App Builder
echo =========================================
echo.

REM Check if gradlew.bat exists
if not exist "gradlew.bat" (
    echo Error: gradlew.bat not found. Are you in the android-app directory?
    pause
    exit /b 1
)

echo Attempting multiple build strategies...
echo.

REM Strategy 1: Try with --no-daemon
echo Strategy 1: Building with --no-daemon...
call gradlew.bat clean --no-daemon
call gradlew.bat assembleRelease --no-daemon

if %ERRORLEVEL% EQU 0 (
    goto :success
)

echo Strategy 1 failed. Trying Strategy 2...
echo.

REM Strategy 2: Try debug build instead
echo Strategy 2: Building debug APK...
call gradlew.bat clean
call gradlew.bat assembleDebug

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =========================================
    echo Debug Build Successful!
    echo =========================================
    echo.
    echo APK Location:
    echo app\build\outputs\apk\debug\app-debug.apk
    echo.
    goto :instructions
)

echo Strategy 2 failed. Trying Strategy 3...
echo.

REM Strategy 3: Use Android Studio
echo Strategy 3: Please use Android Studio
echo.
echo =========================================
echo ANDROID STUDIO BUILD INSTRUCTIONS:
echo =========================================
echo 1. Open Android Studio
echo 2. Open this project folder: android-app
echo 3. Wait for Gradle sync to complete
echo 4. Click Build > Generate Signed Bundle/APK
echo 5. Choose APK, click Next
echo 6. Choose "release" build variant
echo 7. Click Finish
echo.
echo APK will be generated in:
echo app\build\outputs\apk\release\
echo =========================================
goto :end

:success
echo.
echo =========================================
echo Release Build Successful!
echo =========================================
echo.
echo APK Location:
echo app\build\outputs\apk\release\app-release.apk
echo.

:instructions
echo =========================================
echo INSTALLATION INSTRUCTIONS:
echo =========================================
echo 1. Copy APK to your Android device
echo 2. Enable "Unknown Sources" in Settings
echo 3. Install the APK
echo 4. Grant all permissions when prompted
echo 5. Server URL will auto-populate with VPS IP
echo 6. Enter device token from dashboard
echo 7. Start the service
echo.
echo =========================================
echo FIXES APPLIED:
echo =========================================
echo - ActionBar crash fixed
echo - Room database temporarily disabled
echo - Java compatibility improved
echo - Core messaging functionality intact
echo =========================================

:end
pause
