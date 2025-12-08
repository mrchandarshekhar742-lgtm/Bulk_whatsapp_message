# Network Setup Guide - Access Backend from Android Device

This guide explains how to access your local backend server from an Android app on the same Wi-Fi network.

---

## 1. Backend Server Configuration ✓

The backend server is now configured to bind to `0.0.0.0`, making it accessible from:
- **Local machine**: `http://localhost:5000`
- **Same network**: `http://192.168.1.100:5000`
- **Android emulator**: `ws://10.0.2.2:5000` (or your actual IP)

### Current Setup in `backend/server.js`
```javascript
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Server running on http://0.0.0.0:${PORT}`);
  logger.info(`🌐 Accessible at: http://localhost:${PORT} (local)`);
  logger.info(`🌐 Accessible at: http://192.168.1.100:${PORT} (network)`);
});
```

---

## 2. Windows Firewall Configuration

### Open Port 5000 (or your PORT)

**Option A: Using PowerShell (Admin)**
```powershell
# Run as Administrator
netsh advfirewall firewall add rule name="Allow Node.js Server 5000" dir=in action=allow protocol=TCP localport=5000
```

**Option B: Using Command Prompt (Admin)**
```cmd
netsh advfirewall firewall add rule name="Allow Node.js Server 5000" dir=in action=allow protocol=TCP localport=5000
```

**Option C: Manual GUI**
1. Open "Windows Defender Firewall with Advanced Security"
2. Click "Inbound Rules" → "New Rule"
3. Select "Port" → "TCP" → Port: `5000`
4. Allow connection → Name it → Finish

### Verify Port is Open
```powershell
# Check if rule exists
netsh advfirewall firewall show rule name="Allow Node.js Server 5000"

# Test connection from another machine
Test-NetConnection -ComputerName 192.168.1.100 -Port 5000
```

---

## 3. Find Your Local Network IP

### Windows
```powershell
# Find your local IP (look for "IPv4 Address")
ipconfig

# Example output:
# Ethernet adapter Ethernet:
#    IPv4 Address. . . . . . . . . : 192.168.1.100
```

### Android App Configuration
In your Android app's configuration, use:
```
Base URL: http://192.168.1.100:5000
WebSocket URL: ws://192.168.1.100:5000
```

For **Android Emulator** only:
```
Base URL: http://10.0.2.2:5000
WebSocket URL: ws://10.0.2.2:5000
```

For **Genymotion Emulator** only:
```
Base URL: http://10.0.3.2:5000
WebSocket URL: ws://10.0.3.2:5000
```

---

## 4. Android Network Security Config (If Using WebSocket)

If your Android app uses cleartext (non-HTTPS) connections, configure network security.

### Create File: `app/src/main/res/xml/network_security_config.xml`
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="false" />
    
    <!-- Allow cleartext only for development server -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="false">192.168.1.100</domain>
        <domain includeSubdomains="false">10.0.2.2</domain>
        <domain includeSubdomains="false">10.0.3.2</domain>
    </domain-config>
</network-security-config>
```

### Update: `app/src/main/AndroidManifest.xml`
Add `android:networkSecurityConfig` to the `<application>` tag:
```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    android:usesCleartextTraffic="false"
    ...>
    <!-- rest of application contents -->
</application>
```

---

## 5. Frontend Configuration

### For Browser Testing (React Vite)
Create `.env.local`:
```
VITE_API_URL=http://192.168.1.100:5000
```

Or dynamically detect in code:
```javascript
const API_BASE = import.meta.env.DEV 
  ? 'http://192.168.1.100:5000'
  : 'https://production-api.com';
```

### For Running Frontend on Same Network
```bash
# Run Vite on all interfaces
npm run dev -- --host 0.0.0.0

# Access from another machine at
http://192.168.1.100:5173
```

---

## 6. Testing Checklist

### From PC Browser
- [ ] `http://localhost:5000/health` → Returns `{status: "ok"}`
- [ ] `http://192.168.1.100:5000/health` → Returns `{status: "ok"}`

### From Physical Android Phone (on same Wi-Fi)
- [ ] Open browser on phone
- [ ] Navigate to `http://192.168.1.100:5000/health`
- [ ] Should see: `{status: "ok"}`

### From Android App
- [ ] Configure API base to `http://192.168.1.100:5000`
- [ ] Try login/register endpoint
- [ ] Check WebSocket connection (if applicable)

### From Android Emulator
- [ ] Use `http://10.0.2.2:5000` for API calls
- [ ] Test with `http://10.0.2.2:5000/health`

---

## 7. Common Issues & Solutions

### Issue: Connection Refused
```
Error: Connection refused at 192.168.1.100:5000
```
**Solution:**
1. Verify server is running: `npm start` in backend folder
2. Check firewall rule: `netsh advfirewall firewall show rule name="Allow Node.js Server 5000"`
3. Verify correct IP: `ipconfig`
4. Ensure both devices on same Wi-Fi network

### Issue: Firewall Still Blocking
```
netsh advfirewall show allprofiles
```
**Solution:** Add rule for all profiles
```powershell
netsh advfirewall firewall add rule name="Allow Node.js" dir=in action=allow protocol=TCP localport=5000 profile=any
```

### Issue: Android App Can't Reach Server
**Check:**
1. Phone on same Wi-Fi as PC
2. Using correct IP address (not 127.0.0.1 or localhost)
3. Port is open in firewall
4. Server is running and listening on 0.0.0.0

**Debug in App:**
```kotlin
// Log the connection attempt
Log.d("API", "Connecting to: http://192.168.1.100:5000")
Log.d("API", "Response: " + response.toString())
```

### Issue: WebSocket Connection Failed
**For cleartext WebSocket (ws://):**
1. Ensure network security config allows domain
2. Use `ws://` not `wss://` (unless using HTTPS)
3. Check server has WebSocket initialized:
   ```javascript
   DeviceWebSocketManager.initialize(server);
   ```

### Issue: CORS Error from Mobile Browser
**Backend CORS is already configured for development:**
```javascript
cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
})
```

**Update for network testing:**
```javascript
// In backend/src/app.js
cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5000',
    'http://192.168.1.100:5173',
    'http://192.168.1.100:5000',
  ],
  credentials: true,
})
```

---

## 8. Quick Start Commands

### Start Backend (Accessible Everywhere)
```bash
cd backend
npm install
npm start

# Output:
# 🚀 Server running on http://0.0.0.0:5000
# 🌐 Accessible at: http://localhost:5000 (local)
# 🌐 Accessible at: http://192.168.1.100:5000 (network)
# 📱 For Android emulator: ws://10.0.2.2:5000
```

### Start Frontend (Accessible from Network)
```bash
cd Frontend
npm install
npm run dev -- --host 0.0.0.0

# Output:
# Local:    http://localhost:5173
# Network:  http://192.168.1.100:5173
```

### Test from Phone Browser
```
Open browser on phone:
http://192.168.1.100:5000/health
```

---

## 9. Environment Variables Summary

### Backend (.env)
```
PORT=5000                          # Server port
DATABASE_URL=...                   # Database connection
CORS_ORIGIN=http://192.168.1.100:5173  # Allow frontend from network
NODE_ENV=development
```

### Frontend (.env.local)
```
VITE_API_URL=http://192.168.1.100:5000  # Backend API location
```

---

## 10. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Wi-Fi Network                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐              ┌──────────────────────┐ │
│  │   Development PC     │              │   Android Phone      │ │
│  │  192.168.1.100       │              │  (same network)      │ │
│  │                      │              │                      │ │
│  │  Backend Server      │◄────HTTP─────│  Browser             │ │
│  │  0.0.0.0:5000        │    WS        │  or                  │ │
│  │                      │              │  App                 │ │
│  │  Frontend Dev        │◄────HTTP─────│                      │ │
│  │  0.0.0.0:5173        │              │                      │ │
│  │                      │              │                      │ │
│  │  SQLite/MySQL DB     │              └──────────────────────┘ │
│  │  (local)             │                                        │
│  └──────────────────────┘                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

All devices on same network can communicate freely
Firewall open on port 5000 (backend) and 5173 (frontend)
```

---

## Summary

✅ **Backend Configuration**: Server binds to `0.0.0.0`  
✅ **Windows Firewall**: Port 5000 opened with `netsh` rule  
✅ **Network Access**: Use `192.168.1.100:5000` from any device  
✅ **Android App**: Configure API base URL correctly  
✅ **Testing**: Start with `/health` endpoint  

Everything is ready for mobile development!
