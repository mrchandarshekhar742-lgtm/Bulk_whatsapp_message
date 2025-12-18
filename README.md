# 🚀 WhatsApp Pro Bulk Sender

A professional WhatsApp bulk messaging solution with Android app integration and web dashboard.

## ✨ Features

- 📱 **Multi-Device Support** - Manage multiple Android devices
- 🎯 **Smart Device Rotation** - Intelligent message distribution
- 📊 **Real-time Analytics** - Live campaign monitoring
- 🔄 **Warmup System** - Gradual device capacity increase
- 📋 **Excel Integration** - Bulk contact import
- 🌐 **Responsive Design** - Works on all devices
- 🔒 **Secure Authentication** - JWT-based security

## 🌐 Live Demo

**Website**: [https://your-username.github.io/whatsapp-pro](https://your-username.github.io/whatsapp-pro)

## 📱 Android App

Download the Android app to connect your devices:
- [Download APK](https://github.com/your-username/whatsapp-pro/releases)

## 🛠️ Tech Stack

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Router** for navigation
- **React Icons** for UI icons

### Backend
- **Node.js** with Express
- **MySQL** database
- **Sequelize** ORM
- **WebSocket** for real-time communication
- **JWT** authentication

### Android App
- **Kotlin** native development
- **WebSocket** client
- **WhatsApp integration**

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/your-username/whatsapp-pro.git
cd whatsapp-pro
```

### 2. Frontend Setup
```bash
cd Frontend
npm install
npm run dev
```

### 3. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm start
```

### 4. Database Setup
```bash
mysql -u root -p < database/COMPLETE_DATABASE.sql
```

## 📦 Deployment

### GitHub Pages (Frontend Only)
1. Fork this repository
2. Go to Settings → Pages
3. Select "GitHub Actions" as source
4. Push to main branch - auto-deployment will start

### VPS Deployment (Full Stack)
```bash
# Upload files to VPS
scp -r . user@your-server:/var/www/html/

# Backend setup
cd backend
npm install --production
pm2 start server.js --name whatsapp-backend

# Frontend build
cd ../Frontend
npm run build
cp -r dist/* /var/www/html/
```

## 📱 Android App Setup

1. Download APK from releases
2. Install on Android device
3. Enable accessibility permissions
4. Get device token from web dashboard
5. Enter token in Android app
6. Start sending messages!

## 🔧 Configuration

### Environment Variables

**Frontend (.env.local)**
```env
VITE_API_BASE_URL=https://your-api-domain.com/api
```

**Backend (.env)**
```env
NODE_ENV=production
APP_PORT=5000
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=bulk_whatsapp_sms
JWT_SECRET=your_jwt_secret
```

## 📊 Features Overview

### Device Management
- Add unlimited Android devices
- Real-time device status monitoring
- Battery and network tracking
- Automatic device rotation

### Campaign Creation
- Excel file upload for bulk contacts
- Manual number entry
- Message templates with variables
- Smart device selection

### Analytics & Logs
- Real-time message tracking
- Success/failure rates
- Device performance metrics
- Detailed campaign reports

## 🔒 Security Features

- JWT authentication
- Rate limiting
- Input validation
- SQL injection protection
- XSS protection
- CORS configuration

## 📈 Scaling

### Device Warmup Stages
- **Stage 1**: 15 messages/day (new device)
- **Stage 2**: 40 messages/day
- **Stage 3**: 100 messages/day  
- **Stage 4**: 250 messages/day (fully warmed)

### Performance
- Handles 1000+ devices
- 10,000+ messages per day
- Real-time WebSocket updates
- Optimized database queries

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: support@whatsapppro.com
- 💬 Telegram: [@whatsapppro](https://t.me/whatsapppro)
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/whatsapp-pro/issues)

## 🙏 Acknowledgments

- WhatsApp for the messaging platform
- React team for the amazing framework
- Tailwind CSS for beautiful styling
- All contributors and users

---

**⭐ Star this repository if you find it helpful!**