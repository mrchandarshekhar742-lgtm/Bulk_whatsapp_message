# Quick Start Guide
## Device-Controlled WhatsApp Bulk Messaging Platform

---

## 🚀 5-Minute Setup

### Step 1: Install Dependencies
```bash
cd backend
npm install ws
```

### Step 2: Update Database
```bash
mysql -u root -p bulk_whatsapp_sms < database/device-schema.sql
```

### Step 3: Start Backend
```bash
cd backend
npm run dev
```

### Step 4: Start Frontend
```bash
cd Frontend
npm run dev
```

### Step 5: Open Dashboard
```
http://localhost:5173
```

---

## 📱 Add Your First Device

1. Login to dashboard
2. Go to **Devices** page
3. Click **Add Device**
4. Enter device label: `Phone-001`
5. Click **Create Device**
6. **COPY THE TOKEN** (shown only once!)

---

## 🔌 Connect Device (Android App)

### Build Android App
See `ANDROID_APP_SPECIFICATION.md` for complete guide.

### Quick Android Test (WebSocket)
```javascript
// Test in browser console
const ws = new WebSocket('ws://localhost:5000/ws/device?token=YOUR_TOKEN');

ws.onopen = () => {
  console.log('Connected!');
  ws.send(JSON.stringify({
    type: 'STATUS_UPDATE',
    data: {
      battery_level: 85,
      network_type: 'WiFi',
      android_version: '13',
      app_version: '1.0.0',
      phone_number: '+1234567890'
    }
  }));
};

ws.onmessage = (e) => console.log('Received:', JSON.parse(e.data));
```

---

## 📊 Send Your First Campaign

### 1. Upload Excel File
- Go to **Excel** page
- Upload CSV/Excel with contacts
- Columns: `Name`, `Phone`, `Email`, etc.

### 2. Create Campaign
- Go to **Create Campaign** page
- Enter campaign name
- Select Excel file
- Write message: `Hello {{Name}}, welcome!`
- Select devices
- Choose rotation mode: **WARMUP_AWARE**
- Click **Create & Send**

### 3. View Logs
- Go to **Logs** page
- See real-time message status
- Filter by device, status, Excel file

---

## 📁 Project Structure

```
bulk_messaging/
├── backend/
│   ├── src/
│   │   ├── models/          # Device, DeviceLog, DeviceCommand
│   │   ├── routes/          # device.routes, campaign.routes
│   │   └── services/        # WebSocket, Rotation Engine
│   └── server.js            # WebSocket initialized here
│
├── Frontend/src/pages/
│   ├── DevicesPage.jsx      # Device management
│   ├── CreateCampaignPage.jsx  # Campaign creation
│   └── CampaignLogsPage.jsx    # Message logs
│
├── database/
│   └── device-schema.sql    # New tables
│
└── Documentation/
    ├── ANDROID_APP_SPECIFICATION.md
    ├── DEVICE_SYSTEM_IMPLEMENTATION_GUIDE.md
    └── UPGRADE_SUMMARY.md
```

---

## 🔑 Key Concepts

### Devices
- Physical Android phones
- Each has unique token
- Connects via WebSocket
- Sends WhatsApp messages locally

### Warmup Stages
- Stage 1: 15 msg/day (Days 1-3)
- Stage 2: 40 msg/day (Days 4-7)
- Stage 3: 100 msg/day (Days 8-14)
- Stage 4: 250 msg/day (Days 15+)

### Rotation Modes
- **WARMUP_AWARE**: Smart distribution (recommended)
- **ROUND_ROBIN**: Even distribution
- **LEAST_USED**: Balance usage
- **RANDOM**: Random selection

---

## 🔌 API Endpoints

### Devices
```
GET    /api/devices              # List devices
POST   /api/devices              # Add device
GET    /api/devices/:id          # Get device
PUT    /api/devices/:id          # Update device
DELETE /api/devices/:id          # Delete device
GET    /api/devices/:id/logs     # Device logs
GET    /api/devices/:id/stats    # Device stats
```

### Campaigns
```
POST   /api/campaigns            # Create campaign
GET    /api/campaigns/logs       # Get logs
GET    /api/campaigns/stats      # Get stats
POST   /api/campaigns/retry-failed  # Retry failed
```

---

## 🧪 Testing

### Test Device Connection
```bash
# In browser console
const ws = new WebSocket('ws://localhost:5000/ws/device?token=YOUR_TOKEN');
ws.onopen = () => console.log('Connected!');
```

### Test Message Sending
1. Add device
2. Go to device details
3. Click "Send Test"
4. Enter phone number and message
5. Check logs

---

## 📊 Monitoring

### Device Dashboard
- Total devices
- Online devices
- Messages sent today
- Device health

### Per-Device Stats
- Warmup stage
- Daily limit
- Messages sent
- Battery level
- Network type

### Campaign Logs
- All messages
- Filter by status
- Device IP tracking
- Delivery status

---

## 🚨 Troubleshooting

### Device Won't Connect
- Check token is correct
- Verify WebSocket URL
- Check firewall settings
- Ensure backend is running

### Messages Not Sending
- Check device is online
- Verify daily limit not reached
- Check WhatsApp is installed
- Verify phone number format

### Database Error
- Run migration: `mysql -u root -p bulk_whatsapp_sms < database/device-schema.sql`
- Check MySQL is running
- Verify database exists

---

## 📚 Documentation

### For Developers
- `ANDROID_APP_SPECIFICATION.md` - Build Android app
- `DEVICE_SYSTEM_IMPLEMENTATION_GUIDE.md` - Complete guide
- `UPGRADE_SUMMARY.md` - What changed

### For Users
- `QUICK_START.md` - This file
- Web dashboard - Self-explanatory UI

---

## 🎯 Next Steps

1. ✅ Setup complete
2. ✅ Add 1 test device
3. ✅ Build Android app
4. ✅ Test message sending
5. ✅ Scale to 100 devices

---

## 💡 Tips

- Start with 1 device for testing
- Use WARMUP_AWARE rotation mode
- Monitor device health daily
- Don't exceed daily limits
- Keep devices on WiFi
- Disable battery optimization on devices

---

## 🎉 You're Ready!

Your device-controlled WhatsApp platform is set up and ready to send messages at scale with zero ban risk!

**Questions?** Check the full documentation in:
- `DEVICE_SYSTEM_IMPLEMENTATION_GUIDE.md`
- `ANDROID_APP_SPECIFICATION.md`

---

**Happy Messaging!** 📱💬

