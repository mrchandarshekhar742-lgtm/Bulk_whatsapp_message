# 🗄️ Hostinger Database Import Guide

## 📁 File Structure (Simplified)

```
database/
├── COMPLETE_DATABASE.sql          ← Ye file import karein (ONLY THIS ONE!)
└── HOSTINGER_IMPORT_GUIDE.md      ← Ye guide
```

---

## 🚀 Quick Import Steps

### Method 1: phpMyAdmin se (Easiest)

#### Step 1: Hostinger Login
1. Hostinger dashboard me login karein
2. **Databases** section me jaye
3. **phpMyAdmin** button click karein

#### Step 2: Database Create (Agar nahi hai)
```sql
-- phpMyAdmin me SQL tab me ye run karein:
CREATE DATABASE bulk_whatsapp_sms;
```

#### Step 3: Import File
1. Left sidebar me **bulk_whatsapp_sms** database select karein
2. Top menu me **Import** tab click karein
3. **Choose File** button click karein
4. `COMPLETE_DATABASE.sql` file select karein
5. Scroll down → **Go** button click karein
6. Wait for "Import has been successfully finished" message

**Done! ✅**

---

### Method 2: SSH se (Advanced)

```bash
# SSH se connect karein
ssh your-username@your-server-ip

# Database import karein
mysql -u your_db_user -p bulk_whatsapp_sms < /path/to/COMPLETE_DATABASE.sql

# Password enter karein when prompted
```

---

## ✅ Verify Import

### Check Tables
```sql
-- phpMyAdmin SQL tab me run karein:
USE bulk_whatsapp_sms;
SHOW TABLES;
```

**Aapko 11 tables dikhne chahiye:**
```
1. user_roles
2. users
3. excel_records
4. devices
5. device_logs
6. device_commands
7. device_campaigns
8. campaigns
9. campaign_contacts
10. audit_logs
11. notifications
```

### Check Data
```sql
-- Default roles check karein:
SELECT * FROM user_roles;
```

**Output:**
```
id | name  | description
1  | ADMIN | Administrator with full access
2  | USER  | Regular user
```

---

## 🔧 Database Configuration

### Backend .env File
```env
DB_HOST=localhost
DB_USER=your_hostinger_db_user
DB_PASSWORD=your_db_password
DB_NAME=bulk_whatsapp_sms
DB_PORT=3306
```

### Find Your Database Credentials
1. Hostinger dashboard → **Databases**
2. Your database name click karein
3. Credentials dikhenge:
   - **Database Name**: bulk_whatsapp_sms
   - **Username**: u123456789_user (example)
   - **Password**: [your password]
   - **Host**: localhost

---

## 📊 Database Structure Overview

### Core Tables:

**User Management:**
- `user_roles` - User roles (Admin, User)
- `users` - User accounts

**Excel Management:**
- `excel_records` - Uploaded Excel files

**Device Management (100 Phones):**
- `devices` - Mobile device registry
- `device_logs` - Message sending logs
- `device_commands` - Command queue for Android app
- `device_campaigns` - Campaign-device mapping

**Campaign Management:**
- `campaigns` - Bulk message campaigns
- `campaign_contacts` - Campaign recipients

**System:**
- `audit_logs` - Activity tracking
- `notifications` - User notifications

---

## 🔄 Auto-Maintenance

Database me 2 stored procedures hain jo automatically run hote hain:

### 1. Daily Reset (Midnight)
```sql
CALL reset_daily_device_counts();
```
Ye daily message counts reset karta hai.

### 2. Warmup Stage Update (Daily)
```sql
CALL update_device_warmup_stages();
```
Ye devices ko automatically next warmup stage me move karta hai.

**Setup Cron Job:**
```bash
# Hostinger cron job add karein:
0 0 * * * mysql -u user -p'password' bulk_whatsapp_sms -e "CALL reset_daily_device_counts();"
0 1 * * * mysql -u user -p'password' bulk_whatsapp_sms -e "CALL update_device_warmup_stages();"
```

---

## 🐛 Common Issues

### Issue 1: "Table already exists"
**Solution:**
```sql
-- Purana database drop karein:
DROP DATABASE IF EXISTS bulk_whatsapp_sms;

-- Phir se import karein
```

### Issue 2: "Access denied"
**Solution:**
- Database user ko proper permissions dein:
```sql
GRANT ALL PRIVILEGES ON bulk_whatsapp_sms.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

### Issue 3: "Max file size exceeded"
**Solution:**
- File size 10MB se kam hai, so no issue
- Agar issue aaye to SSH method use karein

### Issue 4: "Foreign key constraint fails"
**Solution:**
- Tables proper order me create ho rahe hain
- Agar issue aaye to:
```sql
SET FOREIGN_KEY_CHECKS=0;
-- Import file
SET FOREIGN_KEY_CHECKS=1;
```

---

## 📝 Post-Import Checklist

- [ ] All 11 tables created
- [ ] 2 default roles inserted (ADMIN, USER)
- [ ] 2 stored procedures created
- [ ] Backend .env updated with DB credentials
- [ ] Test connection: `mysql -u user -p bulk_whatsapp_sms`
- [ ] Backend server starts without DB errors

---

## 🎯 Next Steps

1. ✅ Database import complete
2. ⏭️ Backend deploy karein
3. ⏭️ Frontend build karein
4. ⏭️ First user register karein
5. ⏭️ Devices add karein
6. ⏭️ Campaign start karein!

---

## 💡 Pro Tips

1. **Backup**: Import se pehle existing database ka backup le lein
2. **Testing**: Pehle local me test karein, phir production me
3. **Monitoring**: phpMyAdmin se regularly tables check karte rahein
4. **Optimization**: Agar slow ho to indexes check karein

---

## 📞 Need Help?

**Common Commands:**
```sql
-- Database size check
SELECT 
    table_schema AS 'Database',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'bulk_whatsapp_sms';

-- Table row counts
SELECT 
    table_name,
    table_rows
FROM information_schema.tables
WHERE table_schema = 'bulk_whatsapp_sms';

-- Recent devices
SELECT * FROM devices ORDER BY created_at DESC LIMIT 10;

-- Recent logs
SELECT * FROM device_logs ORDER BY created_at DESC LIMIT 20;
```

---

**Database import complete! Ab backend aur frontend deploy karein! 🚀**
