@echo off
echo =========================================
echo WhatsApp Pro - Universal Android Builder
echo =========================================
echo 🚀 Building APK with Universal Compatibility
echo 📱 Supports: Android 4.4 to Android 15+ (API 19-35)
echo.

REM Check if gradlew.bat exists
if not exist "gradlew.bat" (
    echo ❌ Error: gradlew.bat not found. Are you in the android-app directory?
    pause
    exit /b 1
)

echo 🔧 Attempting multiple build strategies...
echo.

REM Strategy 1: Try with --no-daemon
echo 🎯 Strategy 1: Building with --no-daemon...
call gradlew.bat clean --no-daemon
call gradlew.bat assembleRelease --no-daemon

if %ERRORLEVEL% EQU 0 (
    goto :success
)

echo ⚠️ Strategy 1 failed. Trying Strategy 2...
echo.

REM Strategy 2: Try debug build instead
echo 🎯 Strategy 2: Building debug APK...
call gradlew.bat clean
call gradlew.bat assembleDebug

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =========================================
    echo ✅ Debug Build Successful!
    echo =========================================
    echo.
    echo 📁 APK Location:
    echo app\build\outputs\apk\debug\app-debug.apk
    echo.
    goto :instructions
)

echo ⚠️ Strategy 2 failed. Trying Strategy 3...
echo.

REM Strategy 3: Use Android Studio
echo 🎯 Strategy 3: Please use Android Studio
echo.
echo =========================================
echo 🏗️ ANDROID STUDIO BUILD INSTRUCTIONS:
echo =========================================
echo 1. Open Android Studio
echo 2. Open this project folder: android-app
echo 3. Wait for Gradle sync to complete
echo 4. Click Build > Generate Signed Bundle/APK
echo 5. Choose APK, click Next
echo 6. Choose "release" build variant
echo 7. Click Finish
echo.
echo 📁 APK will be generated in:
echo app\build\outputs\apk\release\
echo =========================================
goto :end

:success
echo.
echo =========================================
echo ✅ Release Build Successful!
echo =========================================
echo.
echo 📁 APK Location:
echo app\build\outputs\apk\release\app-release.apk
echo.

:instructions
echo =========================================
echo 📱 UNIVERSAL ANDROID COMPATIBILITY:
echo =========================================
echo ✅ Android 4.4 KitKat (API 19)
echo ✅ Android 5.0-5.1 Lollipop (API 21-22)
echo ✅ Android 6.0 Marshmallow (API 23)
echo ✅ Android 7.0-7.1 Nougat (API 24-25)
echo ✅ Android 8.0-8.1 Oreo (API 26-27)
echo ✅ Android 9 Pie (API 28)
echo ✅ Android 10 (API 29)
echo ✅ Android 11 (API 30)
echo ✅ Android 12-12L (API 31-32)
echo ✅ Android 13 (API 33)
echo ✅ Android 14 (API 34)
echo ✅ Android 15+ (API 35+)
echo.
echo =========================================
echo 🚀 ENHANCED FEATURES:
echo =========================================
echo • 5 WhatsApp detection methods
echo • 6 message sending fallbacks
echo • Enhanced Android 15 package visibility
echo • Improved error handling & logging
echo • Better user guidance for setup
echo • Universal phone number formatting
echo • Multi-architecture support (ARM, x86)
echo.
echo =========================================
echo 📋 INSTALLATION INSTRUCTIONS:
echo =========================================
echo 1. Copy APK to your Android device
echo 2. Enable "Unknown Sources" in Settings
echo 3. Install the APK
echo 4. Grant all permissions when prompted
echo 5. For Android 15: Set WhatsApp as default for wa.me links
echo 6. Enable accessibility service
echo 7. Disable battery optimization
echo 8. Enter device token from dashboard
echo 9. Start the service
echo.
echo =========================================
echo 🔧 ANDROID 15 SPECIFIC SETUP:
echo =========================================
echo • Ensure WhatsApp is updated to latest version
echo • Grant all app permissions in Settings
echo • Allow background app refresh
echo • Set as default for messaging links
echo • Complete WhatsApp setup before using app
echo =========================================

:end
pause
