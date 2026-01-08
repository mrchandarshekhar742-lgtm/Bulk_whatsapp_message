# 🚀 VPS Deployment Commands - Device Management & Timing Features

## 📋 **Pre-Deployment Checklist**

```bash
# 1. Check current status
pm2 status
systemctl status nginx
mysql -u root -p -e "SHOW DATABASES;"

# 2. Check disk space
df -h

# 3. Check memory usage
free -h
```

## 🔄 **Quick Deployment (Automated)**

```bash
# 1. Upload deployment script to VPS
scp deploy-device-management-features.sh user@your-vps-ip:~/

# 2. SSH to VPS
ssh user@your-vps-ip

# 3. Make script executable and run
chmod +x deploy-device-management-features.sh
./deploy-device-management-features.sh
```

## 🛠️ **Manual Deployment Steps**

### **Step 1: Database Schema Update**

```bash
# Connect to MySQL
mysql -u root -p bulk_whatsapp_sms

# Run these SQL commands:
```

```sql
-- Add timing columns to device_logs
ALTER TABLE device_logs 
ADD COLUMN time_gap_ms INT NULL COMMENT 'Milliseconds between messages' AFTER delivered_at,
ADD COLUMN delivery_time_ms INT NULL COMMENT 'Delivery time in milliseconds' AFTER time_gap_ms;

-- Add indexes
ALTER TABLE device_logs 
ADD INDEX idx_time_gap (time_gap_ms),
ADD INDEX idx_delivery_time (delivery_time_ms);

-- Add device management columns to campaigns
ALTER TABLE campaigns 
ADD COLUMN device_message_distribution JSON NULL COMMENT 'Per-device allocation' AFTER selected_devices,
ADD COLUMN timing_config JSON NULL COMMENT 'Timing settings' AFTER device_message_distribution,
ADD COLUMN timing_analytics JSON NULL COMMENT 'Timing stats' AFTER timing_config;

-- Create device_campaigns table
CREATE TABLE device_campaigns (
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
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
    UNIQUE KEY unique_campaign_device (campaign_id, device_id),
    INDEX idx_campaign_id (campaign_id),
    INDEX idx_device_id (device_id)
);

-- Verify changes
SHOW TABLES;
DESCRIBE device_logs;
DESCRIBE campaigns;
DESCRIBE device_campaigns;
```

### **Step 2: Stop Services**

```bash
# Stop PM2 processes
pm2 stop all

# Stop Nginx
sudo systemctl stop nginx
```

### **Step 3: Backup Current Code**

```bash
# Create backup directory
mkdir -p ~/backups/$(date +%Y%m%d)

# Backup database
mysqldump -u root -p bulk_whatsapp_sms > ~/backups/$(date +%Y%m%d)/backup_$(date +%H%M%S).sql

# Backup code
cp -r ~/bulk_messaging ~/backups/$(date +%Y%m%d)/code_backup_$(date +%H%M%S)
```

### **Step 4: Update Code via Git**

```bash
# Navigate to project directory
cd ~/bulk_messaging

# Pull latest changes
git pull origin main

# Or if you're uploading files manually:
# scp -r backend/src/models/DeviceCampaign.js user@vps:~/bulk_messaging/backend/src/models/
# scp -r Frontend/src/components/DeviceAllocationForm.jsx user@vps:~/bulk_messaging/Frontend/src/components/
# scp -r Frontend/src/components/TimingConfigForm.jsx user@vps:~/bulk_messaging/Frontend/src/components/
# scp -r Frontend/src/pages/TimingAnalyticsPage.jsx user@vps:~/bulk_messaging/Frontend/src/pages/
```

### **Step 5: Update Backend**

```bash
cd ~/bulk_messaging/backend

# Install dependencies
npm install

# Update models/index.js to include DeviceCampaign
# (The deployment script handles this automatically)
```

### **Step 6: Update Frontend**

```bash
cd ~/bulk_messaging/Frontend

# Install dependencies
npm install

# Build production version
npm run build

# Copy build to nginx directory (if needed)
sudo cp -r dist/* /var/www/html/
```

### **Step 7: Start Services**

```bash
# Start backend
cd ~/bulk_messaging/backend
pm2 start server.js --name "bulk-messaging-backend"

# Or restart if already exists
pm2 restart bulk-messaging-backend

# Start Nginx
sudo systemctl start nginx

# Check status
pm2 status
sudo systemctl status nginx
```

### **Step 8: Verify Deployment**

```bash
# Check backend health
curl http://localhost:3000/api/health

# Check frontend
curl http://localhost

# Check new endpoints
curl -X GET "http://localhost:3000/api/devices" -H "Authorization: Bearer YOUR_TOKEN"

# Check PM2 logs
pm2 logs bulk-messaging-backend --lines 50
```

## 🔧 **Troubleshooting Commands**

### **Database Issues:**

```bash
# Check database connection
mysql -u root -p -e "SELECT 1;"

# Check table structure
mysql -u root -p bulk_whatsapp_sms -e "DESCRIBE device_campaigns;"

# Check for missing columns
mysql -u root -p bulk_whatsapp_sms -e "SHOW COLUMNS FROM device_logs LIKE '%time%';"
```

### **Backend Issues:**

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs bulk-messaging-backend

# Restart backend
pm2 restart bulk-messaging-backend

# Check port usage
netstat -tulpn | grep :3000
```

### **Frontend Issues:**

```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Test Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### **Permission Issues:**

```bash
# Fix file permissions
sudo chown -R www-data:www-data /var/www/html/
sudo chmod -R 755 /var/www/html/

# Fix PM2 permissions
sudo chown -R $USER:$USER ~/.pm2
```

## 📊 **Post-Deployment Testing**

### **Test New Features:**

```bash
# 1. Test device allocation endpoint
curl -X PUT "http://localhost:3000/api/campaigns/1/device-allocation" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"device_allocations": {"1": 50, "2": 30}}'

# 2. Test timing analytics endpoint
curl -X GET "http://localhost:3000/api/campaigns/1/timing-analytics" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Test device performance endpoint
curl -X GET "http://localhost:3000/api/devices/1/performance-summary" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **Frontend Testing:**

1. **Login to application**
2. **Go to "Create Campaign"** - Check device allocation form
3. **Go to "Timing Analytics"** - Check analytics page
4. **Go to "Devices"** - Click "Performance" button on any device
5. **Create a test campaign** with device allocation and timing config

## 🚨 **Rollback Commands (If Needed)**

```bash
# Stop services
pm2 stop all
sudo systemctl stop nginx

# Restore database
mysql -u root -p bulk_whatsapp_sms < ~/backups/YYYYMMDD/backup_HHMMSS.sql

# Restore code
rm -rf ~/bulk_messaging
cp -r ~/backups/YYYYMMDD/code_backup_HHMMSS ~/bulk_messaging

# Restart services
cd ~/bulk_messaging/backend
pm2 start server.js --name "bulk-messaging-backend"
sudo systemctl start nginx
```

## ✅ **Success Indicators**

After deployment, you should see:

1. **Database**: New tables and columns exist
2. **Backend**: PM2 shows "online" status
3. **Frontend**: New pages accessible (Timing Analytics)
4. **API**: New endpoints respond correctly
5. **Features**: Device allocation and timing config work in UI

## 📞 **Support Commands**

```bash
# Check system resources
htop
df -h
free -h

# Check logs
pm2 logs --lines 100
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Check network
netstat -tulpn | grep -E ':(80|443|3000)'
```

---

**🎉 After successful deployment, your WhatsApp Pro application will have:**
- ✅ Per-device message allocation
- ✅ Advanced timing analytics
- ✅ Device performance monitoring
- ✅ Enhanced campaign management

**Access the new features at: `http://your-domain.com/timing-analytics`**