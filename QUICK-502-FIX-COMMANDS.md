# 🚨 502 Bad Gateway Error - Quick Fix Commands

## 🔧 Immediate Fix (Run These Commands)

### 1. Quick Automated Fix
```bash
chmod +x fix-502-error.sh
./fix-502-error.sh
```

### 2. Manual Fix Commands

#### Stop Everything:
```bash
pm2 stop all
pm2 delete all
sudo fuser -k 3000/tcp
```

#### Restart Backend:
```bash
cd ~/bulk_messaging/backend
pm2 start server.js --name "bulk-messaging-backend"
```

#### Check Status:
```bash
pm2 status
pm2 logs bulk-messaging-backend --lines 20
```

#### Test Backend:
```bash
curl http://localhost:3000/api/health
```

#### Restart Nginx:
```bash
sudo systemctl restart nginx
sudo nginx -t
```

## 🔍 Common Causes & Solutions

### ❌ **Cause 1: Backend Crashed**
```bash
# Check logs
pm2 logs bulk-messaging-backend

# Restart
pm2 restart bulk-messaging-backend
```

### ❌ **Cause 2: Port 3000 Occupied**
```bash
# Check what's using port 3000
netstat -tlnp | grep :3000

# Kill process
sudo fuser -k 3000/tcp

# Restart backend
pm2 start server.js --name "bulk-messaging-backend"
```

### ❌ **Cause 3: Database Connection Failed**
```bash
# Test database
mysql -u root -p bulk_whatsapp_sms -e "SELECT 1;"

# Check backend .env file
cat ~/bulk_messaging/backend/.env
```

### ❌ **Cause 4: Nginx Misconfiguration**
```bash
# Test nginx config
sudo nginx -t

# Check site config
cat /etc/nginx/sites-available/bulk_messaging

# Restart nginx
sudo systemctl restart nginx
```

### ❌ **Cause 5: Node.js/NPM Issues**
```bash
# Check versions
node --version
npm --version

# Reinstall dependencies
cd ~/bulk_messaging/backend
rm -rf node_modules
npm install
```

## 🎯 Step-by-Step Diagnosis

### 1. Check PM2 Status:
```bash
pm2 status
```
**Expected**: Should show `bulk-messaging-backend` as `online`

### 2. Check Backend Health:
```bash
curl http://localhost:3000/api/health
```
**Expected**: Should return `{"status":"ok"}` or similar

### 3. Check Nginx:
```bash
systemctl status nginx
sudo nginx -t
```
**Expected**: Nginx should be `active (running)` and config should be valid

### 4. Check Database:
```bash
mysql -u root -p bulk_whatsapp_sms -e "SHOW TABLES;"
```
**Expected**: Should show your tables without errors

## 🚀 Complete Restart Sequence

If nothing else works, do a complete restart:

```bash
# 1. Stop everything
pm2 stop all
pm2 delete all
sudo systemctl stop nginx

# 2. Kill any remaining processes
sudo fuser -k 3000/tcp
sudo fuser -k 80/tcp

# 3. Start backend
cd ~/bulk_messaging/backend
pm2 start server.js --name "bulk-messaging-backend"

# 4. Wait and check
sleep 5
pm2 status

# 5. Test backend
curl http://localhost:3000/api/health

# 6. Start nginx
sudo systemctl start nginx

# 7. Final test
curl http://wxon.in/api/health
```

## 📊 Monitoring Commands

### Real-time Logs:
```bash
pm2 logs bulk-messaging-backend --follow
```

### System Resources:
```bash
pm2 monit
htop
```

### Network Status:
```bash
netstat -tlnp | grep -E ':(80|3000|443)'
```

## ✅ Success Indicators

After fixing, you should see:
- ✅ `pm2 status` shows backend as `online`
- ✅ `curl http://localhost:3000/api/health` returns success
- ✅ `curl http://wxon.in/api/health` returns success
- ✅ Frontend loads without 502 errors
- ✅ Login/authentication works

## 🆘 If Still Not Working

1. **Check detailed logs:**
   ```bash
   pm2 logs bulk-messaging-backend --lines 50
   tail -f /var/log/nginx/error.log
   ```

2. **Check system resources:**
   ```bash
   df -h  # Disk space
   free -h  # Memory
   ```

3. **Restart entire server:**
   ```bash
   sudo reboot
   ```

4. **Contact support with:**
   - PM2 logs
   - Nginx error logs
   - System resource status
   - Exact error messages

## 🎉 Quick Test

After running fixes, test with:
```bash
curl -v http://wxon.in/api/auth/me
```

Should return proper API response, not HTML error page.