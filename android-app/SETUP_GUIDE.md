# Android App Setup Guide
## Complete Step-by-Step Instructions

---

## 📋 Prerequisites

### Required Software
1. **Android Studio** (Latest version)
   - Download: https://developer.android.com/studio
   - Install with default settings

2. **JDK 17** (Usually included with Android Studio)
   - Verify: `java -version`

3. **Android SDK** (Installed via Android Studio)
   - API Level 24 (Android 7.0) minimum
   - API Level 34 (Android 14) target

### Required Hardware
- Physical Android device (Android 7.0+)
- USB cable for debugging
- Computer with 8GB+ RAM

---

## 🚀 Step 1: Open Project in Android Studio

1. Launch Android Studio
2. Click **Open** or **File → Open**
3. Navigate to `android-app` folder
4. Click **OK**
5. Wait for Gradle sync to complete (may take 5-10 minutes first time)

---

## 🔧 Step 2: Configure Project

### Enable Developer Options on Device

1. Go to **Settings → About Phone**
2. Tap **Build Number** 7 times
3. Developer options enabled!

### Enable USB Debugging

1. Go to **Settings → Developer Options**
2. Enable **USB Debugging**
3. Enable **Stay Awake** (optional)
4. Enable **Install via USB**

### Connect Device

1. Connect device to computer via USB
2. On device, allow USB debugging when prompted
3. In Android Studio, device should appear in device dropdown

---

## 🏗️ Step 3: Build the App

### Option A: Build via Android Studio (Recommended)

1. Click **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Wait for build to complete
3. Click **locate** in notification to find APK
4. APK location: `app/build/outputs/apk/debug/app-debug.apk`

### Option B: Build via Command Line

```bash
cd android-app

# Windows
gradlew.bat assembleDebug

# Linux/Mac
./gradlew assembleDebug
```

APK will be in: `app/build/outputs/apk/debug/app-debug.apk`

---

## 📱 Step 4: Install on Device

### Option A: Install via Android Studio

1. Click **Run** button (green play icon)
2. Select your device
3. App will install and launch automatically

### Option B: Install via ADB

```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

### Option C: Manual Install

1. Copy `app-debug.apk` to device
2. Open file manager on device
3. Tap APK file
4. Allow installation from unknown sources if prompted
5. Tap **Install**

---

## ⚙️ Step 5: Configure the App

### Get Device Token from Web Dashboard

1. Open web dashboard: http://your-server:5173
2. Login
3. Go to **Devices** page
4. Click **Add Device**
5. Enter device label (e.g., "Phone-001")
6. Click **Create Device**
7. **COPY THE TOKEN** (shown only once!)

### Configure App

1. Open app on device
2. Enter **Device Token** (paste from dashboard)
3. Enter **Server URL**:
   - Format: `ws://YOUR_SERVER_IP:5000/ws/device`
   - Example: `ws://192.168.1.100:5000/ws/device`
   - For production: `wss://your-domain.com/ws/device`
4. Click **Save Configuration**

---

## 🔐 Step 6: Grant Permissions

### Required Permissions

The app will request:

1. **Notifications** (Android 13+)
   - Tap **Allow** when prompted
   - Or: Settings → Apps → WhatsApp Bulk Sender → Notifications → Enable

2. **Phone State**
   - Tap **Allow** when prompted
   - Or: Settings → Apps → WhatsApp Bulk Sender → Permissions → Phone → Allow

3. **Battery Optimization Exemption**
   - Tap **Settings** when prompted
   - Select **Don't optimize**
   - Or: Settings → Battery → Battery optimization → All apps → WhatsApp Bulk Sender → Don't optimize

---

## ▶️ Step 7: Start the Service

1. In the app, click **Start Service**
2. Notification should appear: "WhatsApp Bulk Sender - Connecting..."
3. After a few seconds: "Connected"
4. Check web dashboard - device should show "Online" (green dot)

---

## ✅ Step 8: Verify Everything Works

### Check Connection

1. **In App**: Status should show "Connected"
2. **In Dashboard**: Device should show online
3. **Device IP**: Should be displayed in both app and dashboard

### Send Test Message

1. Go to web dashboard
2. Click on your device
3. Click **Send Test**
4. Enter phone number (with country code, e.g., +1234567890)
5. Enter test message
6. Click **Send**
7. **On Device**: WhatsApp should open automatically
8. **In Dashboard**: Check logs page for delivery status

---

## 🔄 Step 9: Enable Auto-Start (Important!)

### In App

1. Enable **Auto-start on boot** toggle
2. Enable **Keep screen on** toggle (optional)

### In Device Settings (Manufacturer-Specific)

Different manufacturers have different settings:

#### Samsung
1. Settings → Apps → WhatsApp Bulk Sender
2. Battery → Optimize battery usage → All → WhatsApp Bulk Sender → Don't optimize
3. Settings → Apps → WhatsApp Bulk Sender → Permissions → Autostart → Allow

#### Xiaomi/MIUI
1. Settings → Apps → Manage apps → WhatsApp Bulk Sender
2. Autostart → Enable
3. Battery saver → No restrictions
4. Other permissions → Display pop-up windows while running in background → Allow

#### Huawei/EMUI
1. Settings → Apps → Apps → WhatsApp Bulk Sender
2. Battery → App launch → Manage manually
3. Enable: Auto-launch, Secondary launch, Run in background

#### OnePlus/OxygenOS
1. Settings → Apps → WhatsApp Bulk Sender
2. Battery → Battery optimization → Don't optimize
3. Advanced → Autostart → Enable

#### Stock Android
1. Settings → Apps → WhatsApp Bulk Sender
2. Battery → Battery optimization → Don't optimize

---

## 🧪 Step 10: Test Auto-Start

1. Reboot device
2. Wait for device to boot
3. Check notification - service should start automatically
4. Check web dashboard - device should show online

---

## 📊 Step 11: Monitor Performance

### In App

- **Status**: Should show "Connected"
- **Battery**: Monitor battery level
- **Network**: Check network type (WiFi recommended)
- **Messages Sent Today**: Should increment after sending
- **Total Sent**: Lifetime counter
- **Failed**: Failed message counter

### In Dashboard

- **Device Status**: Online/Offline
- **Warmup Stage**: Current stage (1-4)
- **Messages Sent Today**: Should match app
- **Daily Limit**: Based on warmup stage
- **Battery Level**: Should match device
- **Device IP**: Should be displayed

---

## 🚨 Troubleshooting

### App Won't Connect

**Problem**: Status shows "Disconnected" or "Error"

**Solutions**:
1. Check server URL is correct
2. Ensure backend server is running
3. Verify device has internet connection
4. Check firewall allows WebSocket connections
5. Try pinging server: `ping YOUR_SERVER_IP`
6. Check device token is correct

### WhatsApp Won't Open

**Problem**: Messages not sending, WhatsApp doesn't open

**Solutions**:
1. Ensure WhatsApp is installed
2. Check WhatsApp is logged in
3. Verify phone number format (+country code)
4. Check app has permissions
5. Try sending manually first

### Service Stops After Screen Off

**Problem**: Service stops when screen turns off

**Solutions**:
1. Disable battery optimization (Step 6)
2. Enable auto-start permission (Step 9)
3. Enable "Keep screen on" in app
4. Check manufacturer-specific settings

### Device Shows Offline in Dashboard

**Problem**: Device online in app but offline in dashboard

**Solutions**:
1. Check WebSocket connection
2. Restart service
3. Check server logs
4. Verify device token matches

### Messages Not Appearing in Logs

**Problem**: Messages sent but not logged in dashboard

**Solutions**:
1. Check WebSocket connection
2. Verify backend is receiving messages
3. Check database connection
4. Review server logs

---

## 📝 View Logs

### Via Android Studio

1. Open **Logcat** tab (bottom of screen)
2. Select your device
3. Filter by "WhatsApp" or "WebSocket"
4. Look for errors or warnings

### Via ADB Command Line

```bash
# All app logs
adb logcat | grep WhatsApp

# WebSocket logs only
adb logcat | grep WebSocketManager

# Service logs only
adb logcat | grep WhatsAppSenderService

# Clear logs
adb logcat -c
```

---

## 🔧 Advanced Configuration

### Change Server URL

1. Open app
2. Update **Server URL** field
3. Click **Save Configuration**
4. Restart service

### Reset Statistics

Statistics are stored in SharedPreferences. To reset:
1. Settings → Apps → WhatsApp Bulk Sender
2. Storage → Clear Data
3. Reconfigure app

### Export Logs

Logs are stored in Room database. To export:
1. Use Android Studio Database Inspector
2. Or implement export feature in app

---

## 📦 Deploy to Multiple Devices

### Prepare APK

1. Build release APK (signed)
2. Or use debug APK for testing

### Install on All Devices

**Option A**: Manual Install
1. Copy APK to each device
2. Install manually
3. Configure each with unique token

**Option B**: ADB Install (if devices connected)
```bash
# List devices
adb devices

# Install on specific device
adb -s DEVICE_ID install app-debug.apk

# Install on all connected devices
for device in $(adb devices | grep -v "List" | awk '{print $1}'); do
    adb -s $device install app-debug.apk
done
```

### Generate Device Tokens

1. Go to web dashboard
2. Create 100 devices
3. Copy each token
4. Configure each device with unique token

---

## 🎯 Best Practices

1. **Use WiFi**: More stable than mobile data
2. **Keep Charged**: Connect devices to power
3. **Disable Battery Optimization**: Critical for continuous operation
4. **Monitor Regularly**: Check logs and dashboard
5. **Test First**: Test with 1 device before deploying to 100
6. **Label Clearly**: Use clear device labels (Phone-001, Phone-002, etc.)
7. **Document Tokens**: Keep a spreadsheet of device labels and tokens

---

## 📞 Support

If you encounter issues:

1. **Check Logs**: `adb logcat | grep WhatsApp`
2. **Verify Configuration**: Server URL and token
3. **Test Connection**: Send test message
4. **Check Backend**: Ensure server is running
5. **Review Documentation**: ANDROID_APP_SPECIFICATION.md

---

## ✅ Checklist

Before deploying to production:

- [ ] App builds successfully
- [ ] App installs on device
- [ ] Device token configured
- [ ] Server URL configured
- [ ] All permissions granted
- [ ] Battery optimization disabled
- [ ] Auto-start enabled
- [ ] Service starts successfully
- [ ] Device shows online in dashboard
- [ ] Test message sends successfully
- [ ] Logs appear in dashboard
- [ ] Auto-start works after reboot
- [ ] Service survives screen off
- [ ] WhatsApp opens automatically

---

**You're ready to deploy!** 🚀

