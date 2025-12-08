#!/bin/bash

echo "========================================="
echo "WhatsApp Pro - Android App Builder"
echo "========================================="
echo ""

# Check if gradlew exists
if [ ! -f "gradlew" ]; then
    echo "Error: gradlew not found. Are you in the android-app directory?"
    exit 1
fi

# Make gradlew executable
chmod +x gradlew

# Clean previous builds
echo "Cleaning previous builds..."
./gradlew clean

# Build debug APK
echo ""
echo "Building debug APK..."
./gradlew assembleDebug

# Check if build was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "========================================="
    echo "Build Successful!"
    echo "========================================="
    echo ""
    echo "APK Location:"
    echo "app/build/outputs/apk/debug/app-debug.apk"
    echo ""
    echo "To install on connected device:"
    echo "adb install app/build/outputs/apk/debug/app-debug.apk"
    echo ""
    echo "To install on all connected devices:"
    echo "for device in \$(adb devices | grep -v 'List' | awk '{print \$1}'); do"
    echo "    adb -s \$device install app/build/outputs/apk/debug/app-debug.apk"
    echo "done"
    echo ""
else
    echo ""
    echo "========================================="
    echo "Build Failed!"
    echo "========================================="
    echo ""
    echo "Please check the error messages above."
    exit 1
fi
