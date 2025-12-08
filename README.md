# 📱 WhatsApp Pro - Device-Controlled Bulk Messaging Platform

A complete WhatsApp bulk messaging system that uses **100 real Android phones** to send messages, ensuring **zero ban risk**.

## 🎯 Features

- ✅ **100 Device Management** - Control 100 physical Android phones
- ✅ **Real Phone Messaging** - Messages sent from actual devices (own SIM + IP)
- ✅ **Smart Rotation** - 4 rotation modes (Warmup Aware, Round Robin, Least Used, Random)
- ✅ **Anti-Ban System** - Automatic warmup (15→40→100→250 msg/day)
- ✅ **Excel Integration** - Upload Excel/CSV files with contacts
- ✅ **Real-time Dashboard** - Monitor all devices and campaigns
- ✅ **WebSocket Communication** - Instant device commands
- ✅ **Campaign Management** - Create and track bulk campaigns
- ✅ **Comprehensive Logging** - Track every message sent

## 🏗️ Architecture

```
┌─────────────────┐
│   Web Dashboard │  (React + Vite)
│   (Frontend)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Backend API   │  (Node.js + Express)
│   + WebSocket   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   MySQL DB      │
└─────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  100 Android Phones (Real Devices)  │
│  Each with WhatsApp Pro App         │
└─────────────────────────────────────┘
```

## 📦 Tech Stack

### Backend
- Node.js + Express
- MySQL + Sequelize ORM
- WebSocket (ws)
- JWT Authentication
- Winston Logger

### Frontend
- React 18
- Vite
- TailwindCSS
- Framer Motion
- React Router

### Android App
- Kotlin
- Room Database
- WebSocket Client
- Material Design

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/your-username/whatsapp-pro.git
cd whatsapp-pro
```

### 2. Setup Database
```bash
# Import database
mysql -u root -p < database/COMPLETE_DATABASE.sql
```

### 3. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run dev
```

### 4. Setup Frontend
```bash
cd Frontend
npm install
npm run dev
```

### 5. Build Android App
```bash
cd android-app
# Use Android Studio to build APK
# Or use: ./gradlew assembleRelease
```

## 📖 Documentation

- **[Quick Start Guide](QUICK_START.md)** - Get started in 5 minutes
- **[Device System Guide](DEVICE_SYSTEM_IMPLEMENTATION_GUIDE.md)** - Complete system overview
- **[Android App Guide](android-app/README.md)** - Build and install Android app
- **[Database Guide](database/HOSTINGER_IMPORT_GUIDE.md)** - Database setup
- **[Deployment Guide](HOSTINGER_DEPLOYMENT.md)** - Deploy to Hostinger

## 🗄️ Database Structure

**11 Tables:**
- `users` - User accounts
- `user_roles` - User roles (Admin, User)
- `excel_records` - Uploaded Excel files
- `devices` - 100 mobile phones
- `device_logs` - Message history
- `device_commands` - Command queue
- `device_campaigns` - Device-campaign mapping
- `campaigns` - Bulk campaigns
- `campaign_contacts` - Recipients
- `audit_logs` - Activity tracking
- `notifications` - User notifications

## 🔧 Configuration

### Backend (.env)
```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=bulk_whatsapp_sms

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRE=24h

# Server
APP_PORT=5000
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
```

### Android App
```kotlin
// Update in app code
val WS_URL = "ws://your-server-ip:5000"
```

## 📱 Android App Setup

1. **Build APK** using Android Studio
2. **Install** on all 100 devices
3. **Configure** each device with unique token from dashboard
4. **Grant permissions** (Notifications, Battery optimization)
5. **Verify** device shows "Online" in dashboard

## 🎮 Usage

### 1. Add Devices
- Dashboard → Devices → Add Device
- Copy device token
- Configure Android app with token

### 2. Upload Excel
- Dashboard → Upload → Choose Excel/CSV file
- File should have: Phone Number, Name, Message columns

### 3. Create Campaign
- Dashboard → Create Campaign
- Select Excel file
- Select devices (or use rotation)
- Choose rotation mode
- Start campaign

### 4. Monitor
- Dashboard → Campaign Logs
- View real-time message status
- Track device performance

## 🛡️ Anti-Ban System

**Automatic Warmup Stages:**
- **Stage 1** (Days 1-3): 15 messages/day
- **Stage 2** (Days 4-7): 40 messages/day
- **Stage 3** (Week 2): 100 messages/day
- **Stage 4** (Week 3+): 250 messages/day

System automatically prevents over-sending and rotates to next device when limit reached.

## 🔄 Rotation Modes

1. **Warmup Aware** (Recommended) - Prioritizes devices with higher warmup stages
2. **Round Robin** - Distributes evenly across all devices
3. **Least Used** - Sends to device with least messages today
4. **Random** - Randomly selects device

## 📊 Features Breakdown

### Device Management
- Add/remove devices
- View online/offline status
- Monitor battery levels
- Track device IPs
- View warmup stages
- Real-time WebSocket connection

### Campaign Management
- Upload Excel files
- Create campaigns
- Select devices
- Choose rotation mode
- Schedule campaigns
- Track progress

### Logging & Analytics
- Real-time message logs
- Delivery status tracking
- Device performance metrics
- Campaign analytics
- Audit logs

## 🚀 Deployment

### Hostinger VPS
```bash
# SSH to server
ssh root@your-server-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Clone and setup
git clone https://github.com/your-username/whatsapp-pro.git
cd whatsapp-pro

# Setup database
mysql -u root -p < database/COMPLETE_DATABASE.sql

# Setup backend
cd backend
npm install
pm2 start server.js --name whatsapp-backend

# Setup frontend
cd ../Frontend
npm install
npm run build

# Configure Nginx
# See HOSTINGER_DEPLOYMENT.md for details
```

## 🔒 Security

- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ Rate limiting
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Input validation
- ✅ SQL injection prevention

## 📈 Scalability

- Supports **100 devices** out of the box
- Can scale to **1000+ devices** with minor modifications
- Horizontal scaling supported
- Load balancing ready

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check logs
pm2 logs whatsapp-backend

# Restart
pm2 restart whatsapp-backend
```

### Device shows offline
- Check server URL in Android app
- Verify device token is correct
- Check network connection
- Restart Android app

### Messages not sending
- Verify WhatsApp is installed on device
- Check device is "Online" in dashboard
- Verify warmup limits not exceeded

## 📝 License

MIT License - Feel free to use for personal or commercial projects

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a pull request.

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check documentation in `/docs` folder

## 🎉 Credits

Built with ❤️ for efficient WhatsApp bulk messaging

---

**⚠️ Disclaimer:** Use responsibly and comply with WhatsApp's Terms of Service. This tool is for legitimate business communication only.
