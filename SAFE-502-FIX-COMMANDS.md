# 🛡️ SAFE 502 Fix - Protect Other Websites

## ⚠️ **IMPORTANT: These commands will NOT affect your other websites**

### 🔧 **Safe Automated Fix:**
```bash
chmod +x safe-502-fix.sh
./safe-502-fix.sh
```

### 📋 **Safe Manual Commands:**

#### 1. Check Current Processes (Don't Delete):
```bash
pm2 status
```

#### 2. Stop Only WhatsApp Pro Backend:
```bash
# Find WhatsApp Pro process name first
pm2 status | grep -E "(bulk-messaging|whatsapp|server)"

# Stop only specific process (replace with actual name)
pm2 stop bulk-messaging-backend
pm2 delete bulk-messaging-backend
```

#### 3. Kill Only Port 3000 (WhatsApp Pro):
```bash
# Check what's on port 3000
netstat -tlnp | grep :3000

# Kill only port 3000 process (not all processes)
sudo fuser -k 3000/tcp
```

#### 4. Restart Only WhatsApp Pro:
```bash
cd ~/bulk_messaging/backend
pm2 start server.js --name "bulk-messaging-backend"
```

#### 5. Verify All Websites:
```bash
pm2 status  # Should show all your websites
curl http://localhost:3000/api/health  # WhatsApp Pro
```

## 🔍 **Safe Process Identification:**

### Check What's Running:
```bash
pm2 status
```

### Common WhatsApp Pro Process Names:
- `bulk-messaging-backend`
- `whatsapp-pro`
- `server` (if only WhatsApp Pro)

### Safe Commands for Each:
```bash
# If process name is "bulk-messaging-backend"
pm2 restart bulk-messaging-backend

# If process name is "whatsapp-pro"
pm2 restart whatsapp-pro

# If process name is "server" (be careful!)
pm2 restart server
```

## 🚨 **NEVER USE These Commands (Will Delete All Websites):**
```bash
❌ pm2 delete all
❌ pm2 stop all
❌ pm2 kill
❌ sudo killall node
```

## ✅ **Safe Alternative Commands:**

### Instead of `pm2 delete all`:
```bash
# Only delete WhatsApp Pro
pm2 delete bulk-messaging-backend
```

### Instead of `pm2 stop all`:
```bash
# Only stop WhatsApp Pro
pm2 stop bulk-messaging-backend
```

### Instead of killing all processes:
```bash
# Only kill port 3000
sudo fuser -k 3000/tcp
```

## 🔧 **Step-by-Step Safe Fix:**

### 1. Identify Your Processes:
```bash
pm2 status
```
**Note down all process names - you want to keep everything except WhatsApp Pro**

### 2. Find WhatsApp Pro Process:
```bash
# Look for these patterns
pm2 status | grep -i bulk
pm2 status | grep -i whatsapp
pm2 status | grep server
```

### 3. Safely Restart Only WhatsApp Pro:
```bash
# Replace "PROCESS_NAME" with actual WhatsApp Pro process name
pm2 restart PROCESS_NAME

# Or if you need to recreate it:
pm2 stop PROCESS_NAME
pm2 delete PROCESS_NAME
cd ~/bulk_messaging/backend
pm2 start server.js --name "bulk-messaging-backend"
```

### 4. Verify Everything:
```bash
# Check all processes are still running
pm2 status

# Test WhatsApp Pro
curl http://localhost:3000/api/health

# Test your other websites
curl http://your-other-domain.com
```

## 🛡️ **Safety Checklist:**

Before running any commands:
- ✅ Run `pm2 status` to see all processes
- ✅ Note down all process names
- ✅ Only target WhatsApp Pro specific process
- ✅ Never use `all` commands
- ✅ Test other websites after fix

## 🎯 **Expected Safe Result:**

After running safe fix:
- ✅ WhatsApp Pro backend restarted
- ✅ All other PM2 processes still running
- ✅ Other websites unaffected
- ✅ `pm2 status` shows multiple processes
- ✅ WhatsApp Pro responds to health check

## 🆘 **If You Accidentally Deleted All:**

Don't panic! You can restart your other websites:
```bash
# Go to each website directory and restart
cd /path/to/other/website
pm2 start app.js --name "other-website"

# Repeat for each website
```

## 📞 **Quick Test Commands:**

```bash
# Test WhatsApp Pro
curl http://wxon.in/api/health

# Test other websites
curl http://your-other-domain.com

# Check all processes
pm2 status
```

**Remember: Always use specific process names, never `all` commands!** 🛡️