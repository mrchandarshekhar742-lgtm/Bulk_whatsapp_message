# 📱 Android App Testing Guide

## 🎯 **Complete Testing Checklist for WhatsApp Pro**

### **Pre-Testing Setup:**

#### **1. Backend Verification:**
```bash
# Test backend system
cd backend
node system-integration-test.js

# Expected output:
# ✅ Database Connection: WORKING
# ✅ All Models: WORKING  
# ✅ Device Rotation Engine: WORKING
# ✅ Campaign Creation Flow: WORKING
# 🎉 ALL SYSTEMS OPERATIONAL!
```

#### **2. Frontend Verification:**
```bash
# Check frontend API configuration
cat Frontend/.env.local
# Should show: VITE_API_BASE_URL=https://wxon.in/api

# Test frontend build
cd Frontend
npm run build
# Should build without errors
```

#### **3. Build Universal Android APK:**
```bash
cd android-app
build-apk.bat

# Expected output:
# ✅ Universal APK generated
# ✅ Android 4.4 to 15+ support
# 📁 APK Location: app\build\outputs\apk\release\app-release.apk
```

---

## 🧪 **Android App Testing Steps:**

### **Phase 1: Installation & Setup Testing**

#### **Test 1.1: APK Installation (All Android Versions)**
- ✅ **Android 9**: Install APK → Should install successfully
- ✅ **Android 15**: Install APK → Should install successfully  
- ✅ **Other versions**: Test on available devices

**Expected Result:** App installs without errors on all Android versions

#### **Test 1.2: App Launch & Permissions**
- ✅ Open app → Should launch without crashes
- ✅ Grant permissions when prompted:
  - Phone access
  - Storage access
  - Notification access (Android 13+)
- ✅ Enable accessibility service when prompted
- ✅ Disable battery optimization when prompted

**Expected Result:** App opens with main interface visible

#### **Test 1.3: WhatsApp Detection**
- ✅ **Android 9**: Should show "WhatsApp detected: Package: com.whatsapp, Version: X.X.X"
- ✅ **Android 15**: Should show "WhatsApp detected: Package: com.whatsapp, Version: X.X.X"
- ❌ If shows "WhatsApp not found": Follow Android 15 setup guide

**Expected Result:** WhatsApp properly detected on all versions

---

### **Phase 2: Configuration Testing**

#### **Test 2.1: Server URL Configuration**
- ✅ Default URL should be: `wss://www.wxon.in/ws/device`
- ✅ URL should auto-populate correctly
- ✅ Save configuration → Should show "Configuration saved successfully"

**Expected Result:** Server URL configured correctly

#### **Test 2.2: Device Token Setup**
- ✅ Get device token from website dashboard
- ✅ Enter token in app
- ✅ Save configuration → Should save successfully

**Expected Result:** Device token saved and ready for connection

---

### **Phase 3: WebSocket Connection Testing**

#### **Test 3.1: WebSocket Connection**
- ✅ Start service → Should show "Status: Starting..."
- ✅ Check logs for WebSocket connection
- ✅ Should connect to `wss://www.wxon.in/ws/device`

**Expected Result:** WebSocket connects successfully

#### **Test 3.2: Device Registration**
- ✅ Device should appear as "Online" in website dashboard
- ✅ Device info should be populated (battery, network, etc.)
- ✅ Device should receive heartbeat messages

**Expected Result:** Device shows as online and responsive

---

### **Phase 4: Message Sending Testing**

#### **Test 4.1: Single Number Campaign**
- ✅ Create campaign with 1 phone number from website
- ✅ Android app should receive command
- ✅ WhatsApp should open with pre-filled message
- ✅ User presses SEND manually
- ✅ App should report message as SENT

**Expected Result:** Single message sent successfully

#### **Test 4.2: Multiple Numbers Campaign**
- ✅ Create campaign with 5+ phone numbers from website
- ✅ Android app should receive multiple commands
- ✅ Each command should open WhatsApp separately
- ✅ Messages should be sent with proper delays (2-10 seconds)

**Expected Result:** All messages sent with proper delays

#### **Test 4.3: Excel File Campaign**
- ✅ Upload Excel file with phone numbers
- ✅ Create campaign from Excel file
- ✅ Android app should process all numbers
- ✅ Campaign should complete successfully

**Expected Result:** Excel-based campaign works correctly

---

### **Phase 5: Android Version Specific Testing**

#### **Test 5.1: Android 9 (API 28) - Reference Version**
- ✅ All features should work perfectly
- ✅ WhatsApp detection: Direct package check
- ✅ Message sending: All methods available
- ✅ WebSocket: Standard connection

**Expected Result:** Perfect functionality (baseline)

#### **Test 5.2: Android 15 (API 35) - Target Version**
- ✅ WhatsApp detection: Enhanced package visibility
- ✅ Message sending: Multiple fallback methods
- ✅ WebSocket: Secure connection with proper certificates
- ✅ Permissions: Runtime permission handling

**Expected Result:** Same functionality as Android 9

#### **Test 5.3: Other Android Versions**
- ✅ **Android 10-14**: Should work with enhanced features
- ✅ **Android 6-8**: Should work with basic features
- ✅ **Android 4.4-5**: Should work with legacy support

**Expected Result:** Universal compatibility maintained

---

### **Phase 6: Error Handling Testing**

#### **Test 6.1: Network Issues**
- ✅ Disconnect WiFi → App should handle gracefully
- ✅ Reconnect → Should auto-reconnect to WebSocket
- ✅ Poor connection → Should retry with backoff

**Expected Result:** Robust network error handling

#### **Test 6.2: WhatsApp Issues**
- ✅ WhatsApp not installed → Should show proper error message
- ✅ WhatsApp crashes → Should handle gracefully
- ✅ WhatsApp blocked → Should report failure correctly

**Expected Result:** Proper error reporting and recovery

#### **Test 6.3: Device Issues**
- ✅ Low battery → Should continue working
- ✅ Background restrictions → Should request exemption
- ✅ App killed → Should restart service automatically

**Expected Result:** Resilient operation under stress

---

### **Phase 7: Performance Testing**

#### **Test 7.1: High Volume Testing**
- ✅ Send 50+ messages in one campaign
- ✅ Monitor memory usage
- ✅ Check for crashes or slowdowns
- ✅ Verify all messages are processed

**Expected Result:** Stable performance with high volume

#### **Test 7.2: Long Running Testing**
- ✅ Keep app running for 2+ hours
- ✅ Send messages periodically
- ✅ Monitor battery usage
- ✅ Check for memory leaks

**Expected Result:** Stable long-term operation

---

## 🔧 **Troubleshooting Guide:**

### **Issue: "WhatsApp is not installed" on Android 15**
```bash
Solution:
1. Install WhatsApp from Play Store (not APK)
2. Open WhatsApp and complete setup
3. Verify phone number
4. Restart WhatsApp Pro app
5. Check app logs for detection method used
```

### **Issue: WebSocket connection fails**
```bash
Solution:
1. Check server URL: wss://www.wxon.in/ws/device
2. Verify internet connection
3. Check firewall/ISP blocking
4. Try different network (mobile data vs WiFi)
5. Check backend server status
```

### **Issue: Messages don't open WhatsApp**
```bash
Solution:
1. Check WhatsApp is set as default for wa.me links
2. Clear WhatsApp cache and restart
3. Try different phone number format
4. Check WhatsApp permissions
5. Restart both apps
```

### **Issue: Device shows offline in dashboard**
```bash
Solution:
1. Check WebSocket connection in app logs
2. Verify device token is correct
3. Check network connectivity
4. Restart app service
5. Check backend WebSocket server
```

---

## 📊 **Testing Results Template:**

### **Device Information:**
- **Device Model**: _____________
- **Android Version**: _____________
- **WhatsApp Version**: _____________
- **Network Type**: _____________

### **Test Results:**
- ✅/❌ **Installation**: _____________
- ✅/❌ **WhatsApp Detection**: _____________
- ✅/❌ **WebSocket Connection**: _____________
- ✅/❌ **Single Message**: _____________
- ✅/❌ **Multiple Messages**: _____________
- ✅/❌ **Excel Campaign**: _____________

### **Performance Metrics:**
- **Memory Usage**: _____________ MB
- **Battery Usage**: _____________ %/hour
- **Message Success Rate**: _____________ %
- **Average Response Time**: _____________ seconds

### **Issues Found:**
1. _____________
2. _____________
3. _____________

---

## 🎯 **Success Criteria:**

### **✅ PASS Criteria:**
- App installs on all tested Android versions
- WhatsApp detection works on all versions
- WebSocket connects successfully
- Single and multiple messages send correctly
- Excel campaigns work properly
- No crashes or major errors
- Performance is acceptable

### **❌ FAIL Criteria:**
- App crashes on startup
- WhatsApp not detected on any version
- WebSocket connection fails consistently
- Messages don't send at all
- Major functionality broken
- Unacceptable performance issues

---

## 🚀 **Final Deployment Checklist:**

- ✅ All tests pass on Android 9 and 15
- ✅ Universal compatibility verified
- ✅ Performance is acceptable
- ✅ Error handling works properly
- ✅ User experience is smooth
- ✅ Documentation is complete

**Ready for production deployment!** 🎉