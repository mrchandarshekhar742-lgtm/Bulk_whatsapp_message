# Quick Network Setup - 3 Steps

## Step 1: Open Firewall (Run as Admin)
```powershell
netsh advfirewall firewall add rule name="Allow Node 5000" dir=in action=allow protocol=TCP localport=5000
```

## Step 2: Find Your IP
```powershell
ipconfig
# Look for: IPv4 Address . . . . . . . : 192.168.x.x
```

## Step 3: Update Frontend Config

### Option A: Environment Variable
Create `Frontend/.env.local`:
```
VITE_API_URL=http://192.168.1.100:5000
```

### Option B: Update Code
In `Frontend/src/api/client.js` or wherever you create axios:
```javascript
const API_URL = 'http://192.168.1.100:5000';
// Replace 192.168.1.100 with your actual IP from Step 2
```

---

## Test It

### From PC
```
Browser: http://192.168.1.100:5000/health
Expected: {"status":"ok"}
```

### From Android Phone (same Wi-Fi)
```
Browser: http://192.168.1.100:5000/health
Expected: {"status":"ok"}
```

### From Android App
```
Use API URL: http://192.168.1.100:5000
(Replace IP with Step 2 result)
```

### For Android Emulator Only
```
Use: http://10.0.2.2:5000
```

---

## Running Servers (Both Accessible from Network)

### Backend
```bash
cd backend
npm start
# Listen on 0.0.0.0:5000 ✓ (already configured)
```

### Frontend 
```bash
cd Frontend
npm run dev -- --host 0.0.0.0
# Access at http://192.168.1.100:5173
```

---

## Done!
Your backend and frontend are now accessible from any device on your Wi-Fi network.

**Common URLs:**
- PC Browser: `http://localhost:5000`
- Phone Browser: `http://192.168.1.100:5000`
- Android App: `http://192.168.1.100:5000` (API base)
- Android Emulator: `http://10.0.2.2:5000`
