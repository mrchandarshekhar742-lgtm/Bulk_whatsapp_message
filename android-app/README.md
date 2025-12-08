# WhatsApp Pro Bulk Sender - Android App

This is the Android device client for the WhatsApp Pro Bulk Messaging Platform.

## 📱 Features

- ✅ WebSocket connection to backend server
- ✅ Real-time command execution
- ✅ WhatsApp message sending via intent
- ✅ Device status reporting (battery, IP, network)
- ✅ Foreground service for continuous operation
- ✅ Auto-start on device boot
- ✅ Local message logging with Room database
- ✅ Keep screen on option
- ✅ Battery optimization exemption

## 🏗️ Architecture

```
MainActivity
    ↓
WhatsAppSenderService (Foreground Service)
    ↓
WebSocketManager (WebSocket Connection)
    ↓
Backend Server
```

## 📦 Dependencies

- **OkHttp**: WebSocket client
- **Gson**: JSON parsing
- **Room**: Local database
- **Coroutines**: Async operations
- **Material Design**: UI components

## 🚀 Setup

### 1. Build the App

```bash
cd android-app
./gradlew assembleDebug
```

The APK will be in: `app/build/outputs/apk/debug/app-debug.apk`

### 2. Install on Device

```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

Or transfer the APK to device and install manually.

### 3. Configure the App

1. Open the app
2. Enter **Device Token** (from web dashboard)
3. Enter **Server URL** (e.g., `ws://192.168.1.100:5000/ws/device`)
4. Click **Save Configuration**
5. Click **Start Service**

### 4. Grant Permissions

The app will request:
- **Notifications** (Android 13+)
- **Phone State** (to get phone number)
- **Battery Optimization Exemption** (to run continuously)

## 🔧 Configuration

### Server URL Format
```
ws://YOUR_SERVER_IP:5000/ws/device
```

Example:
- Local network: `ws://192.168.1.100:5000/ws/device`
- Public server: `ws://your-domain.com:5000/ws/device`
- Secure: `wss://your-domain.com/ws/device` (recommended for production)

### Device Token
- Get from web dashboard when creating a device
- 64-character hex string
- Unique per device
- Store securely

## 📊 How It Works

### 1. Connection Flow
```
App Start
    ↓
Load Configuration
    ↓
Start Foreground Service
    ↓
Connect to WebSocket
    ↓
Send STATUS_UPDATE
    ↓
Listen for Commands
```

### 2. Message Sending Flow
```
Receive SEND_MESSAGE Command
    ↓
Acknowledge Command
    ↓
Validate Phone Number
    ↓
Open WhatsApp Intent
    ↓
Wait 3 seconds
    ↓
Report MESSAGE_SENT
    ↓
Save to Local Database
```

### 3. Status Updates
- Sent every 5 minutes
- Includes: battery, network, IP, phone number
- Keeps server informed of device health

### 4. Heartbeat
- Sent every 30 seconds
- Keeps WebSocket connection alive
- Detects disconnections

## 🔔 Notifications

The app runs as a foreground service with a persistent notification showing:
- Connection status
- Messages sent today
- Current operation

## 🗄️ Local Database

Messages are logged locally using Room:
- Recipient number
- Message content
- Status (SENT/FAILED)
- Timestamp
- Device IP
- Network type
- Error message (if failed)

## 🔒 Permissions

### Required Permissions
- `INTERNET` - WebSocket connection
- `ACCESS_NETWORK_STATE` - Network type detection
- `FOREGROUND_SERVICE` - Run continuously
- `WAKE_LOCK` - Keep CPU awake
- `RECEIVE_BOOT_COMPLETED` - Auto-start

### Optional Permissions
- `READ_PHONE_STATE` - Get phone number
- `POST_NOTIFICATIONS` - Show notifications (Android 13+)

## 🛠️ Development

### Project Structure
```
app/src/main/java/com/whatsapppro/bulksender/
├── WhatsAppProApplication.kt       # Application class
├── data/
│   ├── models/                     # Data models
│   │   └── Command.kt
│   └── local/                      # Room database
│       ├── MessageLog.kt
│       ├── MessageLogDao.kt
│       └── AppDatabase.kt
├── network/
│   └── WebSocketManager.kt        # WebSocket client
├── service/
│   └── WhatsAppSenderService.kt   # Foreground service
├── receiver/
│   └── BootReceiver.kt            # Boot receiver
├── ui/
│   ├── MainActivity.kt            # Main screen
│   └── SettingsActivity.kt        # Settings screen
└── utils/
    ├── WhatsAppHelper.kt          # WhatsApp integration
    ├── DeviceInfoCollector.kt     # Device info
    └── PrefsHelper.kt             # SharedPreferences
```

### Build Variants
- **Debug**: Development build with logging
- **Release**: Production build (requires signing)

### Signing (for Release)
Create `keystore.properties` in project root:
```properties
storeFile=/path/to/keystore.jks
storePassword=your_password
keyAlias=your_alias
keyPassword=your_password
```

## 🧪 Testing

### Test WebSocket Connection
1. Start backend server
2. Create device in web dashboard
3. Copy device token
4. Enter in app
5. Start service
6. Check logs: `adb logcat | grep WhatsApp`

### Test Message Sending
1. Ensure WhatsApp is installed
2. Send test message from web dashboard
3. App should open WhatsApp automatically
4. Check logs for confirmation

### Test Auto-Start
1. Enable auto-start in app
2. Reboot device
3. Service should start automatically
4. Check notification

## 📝 Logs

View logs using ADB:
```bash
# All logs
adb logcat | grep WhatsApp

# WebSocket logs
adb logcat | grep WebSocketManager

# Service logs
adb logcat | grep WhatsAppSenderService
```

## 🚨 Troubleshooting

### Connection Issues
- Check server URL is correct
- Ensure device has internet
- Verify firewall allows WebSocket
- Check device token is valid

### WhatsApp Not Opening
- Ensure WhatsApp is installed
- Check phone number format
- Verify app has permissions

### Service Stops
- Disable battery optimization
- Enable auto-start permission (manufacturer-specific)
- Keep screen on (optional)

### Messages Not Sending
- Check WhatsApp is logged in
- Verify phone number format (+country code)
- Check device hasn't reached daily limit

## 🔐 Security

- Device token stored in SharedPreferences
- No sensitive data in logs (production)
- WebSocket connection can be secured with WSS
- Local database encrypted (optional)

## 📱 Device Requirements

- Android 7.0 (API 24) or higher
- WhatsApp installed
- Stable internet connection
- 2GB+ RAM recommended
- Battery optimization disabled

## 🎯 Best Practices

1. **Keep Device Charged**: Connect to power
2. **Use WiFi**: More stable than mobile data
3. **Disable Battery Optimization**: Prevents service from being killed
4. **Keep Screen On**: Optional, but helps
5. **Monitor Logs**: Check for errors regularly

## 📊 Performance

- **Memory Usage**: ~50MB
- **Battery Impact**: Low (when idle)
- **Network Usage**: Minimal (WebSocket only)
- **CPU Usage**: Low

## 🔄 Updates

To update the app:
1. Build new APK
2. Install over existing app
3. Configuration is preserved
4. Service restarts automatically

## 📞 Support

For issues:
1. Check logs: `adb logcat`
2. Verify configuration
3. Test WebSocket connection
4. Check backend server status

## 📄 License

MIT License - See main project LICENSE file

---

**Built for WhatsApp Pro Bulk Messaging Platform** 🚀
