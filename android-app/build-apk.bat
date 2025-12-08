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

REM Clean previous builds
echo Cleaning previous builds...
call gradlew.bat clean

REM Build debug APK
echo.
echo Building debug APK...
call gradlew.bat assembleDebug

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =========================================
    echo Build Successful!
    echo =========================================
    echo.
    echo APK Location:
    echo app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo To install on connected device:
    echo adb install app\build\outputs\apk\debug\app-debug.apk
    echo.
) else (
    echo.
    echo =========================================
    echo Build Failed!
    echo =========================================
    echo.
    echo Please check the error messages above.
    pause
    exit /b 1
)

pause
