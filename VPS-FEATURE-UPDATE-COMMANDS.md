# 🚀 VPS Feature Update Commands

## Quick Update (Recommended)

```bash
# 1. Upload the script and run
chmod +x quick-feature-update.sh
./quick-feature-update.sh
```

## Manual Step-by-Step Commands

### 1. Database Update
```bash
# Connect to MySQL
mysql -u root -p bulk_whatsapp_sms

# Run these SQL commands:
ALTER TABLE device_logs 
ADD COLUMN IF NOT EXISTS time_gap_ms INT NULL COMMENT 'Time gap between messages',
ADD COLUMN IF NOT EXISTS delivery_time_ms INT NULL COMMENT 'Delivery time';

ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS device_message_distribution JSON NULL COMMENT 'Per-device allocation',
ADD COLUMN IF NOT EXISTS timing_config JSON NULL COMMENT 'Timing settings',
ADD COLUMN IF NOT EXISTS timing_analytics JSON NULL COMMENT 'Timing stats';

CREATE TABLE IF NOT EXISTS device_campaigns (
    id INT PRIMARY KEY AUTO_INCREMENT,
    campaign_id INT NOT NULL,
    device_id INT NOT NULL,
    assigned_message_count INT DEFAULT 0,
    messages_sent_in_campaign INT DEFAULT 0,
    assigned_count INT DEFAULT 0,
    sent_count INT DEFAULT 0,
    failed_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_campaign_device (campaign_id, device_id),
    INDEX idx_campaign_id (campaign_id),
    INDEX idx_device_id (device_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

exit;
```

### 2. Restart Backend
```bash
# Stop current processes
pm2 stop all

# Go to backend directory
cd ~/bulk_messaging/backend

# Restart backend
pm2 start server.js --name "bulk-messaging-backend"
```

### 3. Rebuild Frontend
```bash
# Go to frontend directory
cd ~/bulk_messaging/Frontend

# Build frontend
npm run build
```

### 4. Check Status
```bash
# Check PM2 processes
pm2 status

# Check backend health
curl http://localhost:3000/api/health

# Check logs if needed
pm2 logs
```

## 🎯 What Gets Updated

### ✅ Database Changes:
- `device_logs` table: Added timing columns
- `campaigns` table: Added device allocation & timing config
- `device_campaigns` table: New table for per-device management

### ✅ New Features:
- **Device Allocation**: Set how many messages each device sends
- **Timing Analytics**: Monitor message timing and gaps
- **Performance Monitoring**: Device-wise performance stats

### ✅ New API Endpoints:
- `PUT /api/campaigns/:id/device-allocation`
- `GET /api/campaigns/:id/timing-analytics`
- `GET /api/devices/:id/performance-summary`

### ✅ New Frontend Pages:
- **Timing Analytics** (new sidebar menu item)
- **Enhanced Create Campaign** (with device allocation)
- **Device Performance** (click Performance button on devices)

## 🔧 Troubleshooting

### If Backend Won't Start:
```bash
# Check logs
pm2 logs bulk-messaging-backend

# Restart with force
pm2 delete bulk-messaging-backend
pm2 start server.js --name "bulk-messaging-backend"
```

### If Database Update Fails:
```bash
# Check if columns already exist
mysql -u root -p bulk_whatsapp_sms -e "DESCRIBE device_logs;"
mysql -u root -p bulk_whatsapp_sms -e "DESCRIBE campaigns;"
mysql -u root -p bulk_whatsapp_sms -e "SHOW TABLES LIKE 'device_campaigns';"
```

### If Frontend Build Fails:
```bash
# Clear cache and rebuild
cd ~/bulk_messaging/Frontend
rm -rf node_modules/.cache
npm run build
```

## ✅ Verification

After update, verify these work:
1. **Create Campaign** page shows device allocation form
2. **Timing Analytics** appears in sidebar menu
3. **Devices** page has Performance buttons
4. Backend responds to: `curl http://localhost:3000/api/health`

## 🎉 Success!

Your WhatsApp Pro now has:
- ✅ Per-device message management
- ✅ Timing analytics and monitoring
- ✅ Device performance tracking
- ✅ Advanced campaign controls