# 🚀 BUILD APK NOW - Quick Guide

## ✅ You Have Java Installed!
Java version: 25.0.1 ✓

---

## 📱 EASIEST METHOD: Use Android Studio

### Why Android Studio?
- Includes everything you need
- No manual configuration
- Visual interface
- Handles all dependencies automatically

### Steps:

1. **Download Android Studio**
   - Go to: https://developer.android.com/studio
   - Download for Windows
   - Install with default settings (takes 10-15 minutes)

2. **Open Project**
   - Launch Android Studio
   - Click "Open"
   - Select: `C:\Users\Dev\OneDrive\Desktop\bulk_messaaging\android-app`
   - Wait for Gradle sync (first time: 5-10 minutes)

3. **Build APK**
   - Menu: Build → Build Bundle(s) / APK(s) → Build APK(s)
   - Wait 2-5 minutes
   - Click "locate" when done
   - APK is ready!

4. **Find Your APK**
   - Location: `android-app\app\build\outputs\apk\release\app-release-unsigned.apk`
   - This is your installable file!

---

## 💻 ALTERNATIVE: Command Line (Requires Android SDK)

If you already have Android SDK installed:

```cmd
cd android-app
.\gradlew.bat assembleRelease
```

APK will be at: `app\build\outputs\apk\release\app-release-unsigned.apk`

**Note**: This requires Android SDK to be installed. If you get errors, use Android Studio method instead.

---

## 📲 INSTALL ON YOUR DEVICES

### Method 1: USB Cable (One at a time)

1. **Enable USB Debugging on phone:**
   - Settings → About Phone
   - Tap "Build Number" 7 times
   - Go back → Developer Options
   - Enable "USB Debugging"

2. **Connect phone to PC via USB**

3. **Install APK:**
   ```cmd
   adb install android-app\app\build\outputs\apk\release\app-release-unsigned.apk
   ```

### Method 2: Share APK File (For 100 devices)

**Best for multiple devices:**

1. **Upload APK to cloud:**
   - Upload to Google Drive / Dropbox
   - Get shareable link
   - Share with all devices

2. **On each phone:**
   - Open link in browser
   - Download APK
   - Settings → Security → Enable "Install from Unknown Sources"
   - Tap downloaded APK
   - Click "Install"

3. **Or send via WhatsApp:**
   - Send APK to yourself on WhatsApp
   - Forward to all devices
   - Install on each

---

## ⚙️ CONFIGURE EACH DEVICE

After installing APK:

1. **Get Device Token from Website:**
   - Open: http://localhost:5173 (or your server IP)
   - Login
   - Go to "Devices" page
   - Click "Add Device"
   - Enter phone number and label
   - Copy the generated token

2. **Configure App on Phone:**
   - Open "WhatsApp Pro" app
   - Enter Server URL: `ws://YOUR_SERVER_IP:5000`
   - Enter Device Token: (paste from website)
   - Click "Connect"

3. **Grant Permissions:**
   - Allow all permissions when asked
   - Disable battery optimization:
     - Settings → Apps → WhatsApp Pro → Battery → Unrestricted

4. **Verify:**
   - App should show "Connected ✓"
   - Website should show device as "Online"

---

## 🎯 RECOMMENDED WORKFLOW

For 100 devices:

1. **Build APK once** (using Android Studio)
2. **Test on 1 device** (verify everything works)
3. **Upload APK to Google Drive**
4. **Install on all 100 devices** (share Drive link)
5. **Configure in batches** (10 devices at a time)

**Time estimate:** ~5 minutes per device = 8 hours total

---

## 🐛 COMMON ISSUES

### "App not installed"
- Enable "Install from Unknown Sources" in phone settings
- Check if old version is installed (uninstall first)

### "Parse error"
- APK might be corrupted - rebuild
- Check phone Android version (minimum: 7.0)

### Device shows "Offline"
- Check server URL is correct
- Check device token is correct
- Verify backend server is running
- Check network connection

---

## ✅ QUICK CHECKLIST

Before deploying to 100 devices:

- [ ] APK built successfully
- [ ] Tested on 1 device
- [ ] Device connects to server
- [ ] Device shows "Online" in dashboard
- [ ] Test message sent successfully
- [ ] Message delivered via WhatsApp
- [ ] Logs appear in dashboard

---

## 🎉 YOU'RE READY!

**Next step:** Download Android Studio and build your APK!

Download: https://developer.android.com/studio
