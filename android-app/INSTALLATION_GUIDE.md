# 📱 Android App Installation Guide

## 🎯 Quick Overview
This guide will help you build the WhatsApp Pro Android app and install it on your 100 devices.

---

## 📋 Prerequisites

### Option 1: Build on Windows (Recommended)
You need:
1. **Android Studio** (includes everything)
2. **Java JDK 17+**

### Option 2: Build Online (Easiest - No Installation)
Use GitHub Actions or online build services

### Option 3: Command Line Build
1. **Java JDK 17+**
2. **Android SDK**
3. **Gradle**

---

## 🚀 METHOD 1: Build with Android Studio (EASIEST)

### Step 1: Install Android Studio
1. Download from: https://developer.android.com/studio
2. Install with default settings
3. Open Android Studio
4. Wait for initial setup to complete

### Step 2: Open Project
1. Click **"Open"** in Android Studio
2. Navigate to: `C:\Users\Dev\OneDrive\Desktop\bulk_messaaging\android-app`
3. Click **"OK"**
4. Wait for Gradle sync (first time takes 5-10 minutes)

### Step 3: Build APK
1. Click **Build** menu → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Wait for build to complete (2-5 minutes)
3. Click **"locate"** in the notification
4. APK will be at: `android-app/app/build/outputs/apk/release/app-release-unsigned.apk`

### Step 4: Sign APK (Optional but Recommended)
1. In Android Studio: **Build** → **Generate Signed Bundle / APK**
2. Select **APK** → **Next**
3. Click **"Create new..."** to create keystore
4. Fill in details:
   - Key store path: `C:\whatsapp-pro-keystore.jks`
   - Password: (choose a strong password)
   - Alias: `whatsapp-pro`
   - Validity: 25 years
5. Click **Next** → Select **release** → **Finish**
6. Signed APK: `android-app/app/release/app-release.apk`

---

## 🌐 METHOD 2: Build Online (NO SOFTWARE NEEDED)

### Using AppCenter or Similar Services
1. Create account on https://appcenter.ms
2. Upload your project
3. Configure build
4. Download APK

### Using GitHub Actions (Free)
I can create a GitHub Actions workflow that builds the APK automatically.

---

## 💻 METHOD 3: Command Line Build (Advanced)

### Step 1: Install Java JDK
```cmd
REM Download from: https://adoptium.net/
REM Install JDK 17 or higher
REM Verify installation:
java -version
```

### Step 2: Install Android SDK
```cmd
REM Option A: Install Android Studio (includes SDK)
REM Option B: Install command line tools only
REM Download from: https://developer.android.com/studio#command-tools
```

### Step 3: Set Environment Variables
```cmd
REM Add to System Environment Variables:
ANDROID_HOME=C:\Users\Dev\AppData\Local\Android\Sdk
JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.x

REM Add to PATH:
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\tools
%JAVA_HOME%\bin
```

### Step 4: Generate Gradle Wrapper
```cmd
cd android-app
gradle wrapper --gradle-version 8.0
```

### Step 5: Build APK
```cmd
.\gradlew.bat assembleRelease
```

APK Location: `android-app\app\build\outputs\apk\release\app-release-unsigned.apk`

---

## 📲 INSTALLING ON DEVICES

### Method 1: USB Installation (One Device at a Time)

#### Step 1: Enable Developer Options on Phone
1. Go to **Settings** → **About Phone**
2. Tap **Build Number** 7 times
3. Go back to **Settings** → **Developer Options**
4. Enable **USB Debugging**

#### Step 2: Install via USB
```cmd
REM Connect phone via USB
REM Install ADB if not installed (comes with Android Studio)

adb devices
REM You should see your device listed

adb install android-app\app\build\outputs\apk\release\app-release.apk
```

### Method 2: Share APK File (Multiple Devices)

#### Option A: Cloud Storage
1. Upload APK to Google Drive / Dropbox
2. Share link with all devices
3. Download on each phone
4. Install (allow "Install from Unknown Sources")

#### Option B: Local Network
1. Start a local HTTP server:
```cmd
cd android-app\app\build\outputs\apk\release
python -m http.server 8080
```
2. On each phone, open browser: `http://YOUR_PC_IP:8080`
3. Download and install APK

#### Option C: WhatsApp/Telegram
1. Send APK file to yourself on WhatsApp/Telegram
2. Forward to a group with all devices
3. Download and install on each device

### Method 3: MDM Solution (100 Devices - Professional)
Use Mobile Device Management software:
- **Google Workspace** (if using company accounts)
- **Microsoft Intune**
- **AirWatch**
- **MobileIron**

These allow you to push the APK to all 100 devices at once.

---

## ⚙️ DEVICE CONFIGURATION

### After Installing APK on Each Device:

#### Step 1: Get Device Token from Website
1. Open your website: http://YOUR_SERVER_IP:5173
2. Login as admin
3. Go to **Devices** page
4. Click **"Add Device"**
5. Fill in:
   - Device Label: "Phone-001"
   - Phone Number: "+919876543210"
6. Click **Save**
7. Copy the **Device Token** shown

#### Step 2: Configure App on Phone
1. Open **WhatsApp Pro** app
2. Enter:
   - **Server URL**: `ws://YOUR_SERVER_IP:5000`
   - **Device Token**: (paste from website)
3. Click **"Connect"**
4. App should show **"Connected ✓"**

#### Step 3: Grant Permissions
1. Allow **Notifications**
2. Allow **Background Activity**
3. Disable **Battery Optimization** for the app:
   - Settings → Apps → WhatsApp Pro → Battery → Unrestricted

#### Step 4: Verify Connection
1. Go back to website **Devices** page
2. Device should show **"Online"** with green dot
3. Check device IP, battery level, etc.

---

## 🔄 BULK INSTALLATION WORKFLOW (100 Devices)

### Recommended Process:

1. **Build APK once** (using Method 1 above)
2. **Upload to cloud storage** (Google Drive)
3. **Create installation checklist**:
   ```
   Device 001: ☐ APK Installed ☐ Token Configured ☐ Online
   Device 002: ☐ APK Installed ☐ Token Configured ☐ Online
   ...
   Device 100: ☐ APK Installed ☐ Token Configured ☐ Online
   ```
4. **Batch process**:
   - Install APK on 10 devices
   - Configure all 10 with tokens
   - Verify all 10 are online
   - Repeat for next batch

### Time Estimate:
- APK installation: 2 min/device
- Configuration: 3 min/device
- Total per device: ~5 minutes
- **100 devices: ~8 hours** (with breaks)

### Tips for Speed:
- Use 2-3 people working in parallel
- Pre-generate all 100 device tokens
- Print QR codes for each token (scan instead of typing)
- Keep devices charged during setup

---

## 🐛 TROUBLESHOOTING

### Build Issues

**Error: "SDK location not found"**
```
Solution: Create local.properties file:
sdk.dir=C\:\\Users\\Dev\\AppData\\Local\\Android\\Sdk
```

**Error: "Gradle sync failed"**
```
Solution: 
1. File → Invalidate Caches → Restart
2. Delete .gradle folder
3. Sync again
```

### Installation Issues

**Error: "App not installed"**
```
Solution:
1. Enable "Install from Unknown Sources"
2. Uninstall old version if exists
3. Check storage space
```

**Error: "Parse error"**
```
Solution:
1. APK might be corrupted - rebuild
2. Check Android version (minimum: 7.0)
```

### Connection Issues

**Device shows "Offline"**
```
Solution:
1. Check server URL is correct
2. Check device token is correct
3. Verify server is running
4. Check firewall/network
5. Restart app
```

**WebSocket connection fails**
```
Solution:
1. Use IP address, not localhost
2. Check port 5000 is open
3. Disable battery optimization
4. Keep app in foreground initially
```

---

## 📝 QUICK REFERENCE

### File Locations
- **APK (unsigned)**: `android-app/app/build/outputs/apk/release/app-release-unsigned.apk`
- **APK (signed)**: `android-app/app/release/app-release.apk`
- **Build logs**: `android-app/app/build/outputs/logs/`

### Important Commands
```cmd
REM Build APK
cd android-app
.\gradlew.bat assembleRelease

REM Install via USB
adb install app-release.apk

REM Check connected devices
adb devices

REM View app logs
adb logcat | findstr "WhatsAppPro"
```

### Server URLs
- **Local testing**: `ws://localhost:5000`
- **Same network**: `ws://192.168.1.100:5000` (your PC's IP)
- **Production**: `ws://your-domain.com:5000`

---

## ✅ SUCCESS CHECKLIST

Before deploying to 100 devices:

- [ ] APK built successfully
- [ ] Tested on 1 device
- [ ] Device shows online in dashboard
- [ ] Test message sent successfully
- [ ] Message delivered via WhatsApp
- [ ] Logs appear in dashboard
- [ ] Device survives app restart
- [ ] Device survives phone restart
- [ ] Battery optimization disabled
- [ ] All permissions granted

---

## 🎯 NEXT STEPS

1. **Choose your build method** (Android Studio recommended)
2. **Build the APK**
3. **Test on 1 device first**
4. **Verify end-to-end flow**
5. **Deploy to remaining 99 devices**

---

## 💡 NEED HELP?

If you encounter issues:
1. Check the error message carefully
2. Search the error in Android Studio
3. Check device logs: `adb logcat`
4. Verify server is running and accessible
5. Test with a single device first

---

**Ready to build? Start with Method 1 (Android Studio) - it's the most reliable!** 🚀
