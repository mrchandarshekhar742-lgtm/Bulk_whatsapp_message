# NGINX MIME Type Fix Instructions

## Problem
JavaScript files are being served with `text/html` MIME type instead of `application/javascript`, causing module loading failures.

## Solution
Run this script on your VPS to fix the MIME type issue:

### Method 1: Direct Script Execution
```bash
# SSH into your VPS
ssh root@wxon.in

# Download and run the fix script
wget https://raw.githubusercontent.com/yourusername/yourrepo/main/vps-nginx-fix.sh
chmod +x vps-nginx-fix.sh
./vps-nginx-fix.sh
```

### Method 2: Manual Commands
```bash
# SSH into your VPS
ssh root@wxon.in

# Create the fixed nginx configuration
cat > /etc/nginx/sites-available/wxon.in << 'EOF'
# [The entire nginx configuration with MIME type fixes]
EOF

# Test nginx configuration
nginx -t

# If test passes, reload nginx
systemctl reload nginx

# Check status
systemctl status nginx
```

### Method 3: Copy-Paste Configuration
1. SSH into your VPS: `ssh root@wxon.in`
2. Edit nginx config: `nano /etc/nginx/sites-available/wxon.in`
3. Replace the entire content with the fixed configuration from `nginx.conf`
4. Save and exit (Ctrl+X, Y, Enter)
5. Test: `nginx -t`
6. Reload: `systemctl reload nginx`

## What Was Fixed
1. Added `include /etc/nginx/mime.types;` to server block
2. Separated JavaScript files handling with explicit `Content-Type: application/javascript`
3. Separated CSS files handling with explicit `Content-Type: text/css`
4. Proper static asset caching by file type

## Expected Result
- JavaScript files will load with proper MIME type
- No more "Expected a JavaScript module script" errors
- Frontend will load correctly
- API calls will work over HTTPS

## Test the Fix
After applying the fix, test these URLs:
- https://wxon.in/assets/index-BJwuqRYM.js (should return `Content-Type: application/javascript`)
- https://wxon.in/assets/index-BL10wiD3.css (should return `Content-Type: text/css`)
- https://wxon.in/ (should load without JavaScript errors)