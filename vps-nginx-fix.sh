#!/bin/bash

echo "========================================="
echo "Fixing MIME Types for JavaScript Files"
echo "========================================="

# Create the fixed nginx configuration
cat > /etc/nginx/sites-available/wxon.in << 'EOF'
# WhatsApp Pro Bulk Sender - Nginx Configuration
# Place this file at: /etc/nginx/sites-available/whatsapp-pro

server {
    listen 80;
    server_name wxon.in www.wxon.in;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name wxon.in www.wxon.in;
    
    # Include MIME types
    include /etc/nginx/mime.types;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/wxon.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/wxon.in/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
    
    # Client max body size for file uploads
    client_max_body_size 50M;
    
    # Frontend (React App)
    location / {
        root /var/www/whatsapp-pro/Bulk_whatsapp_message/Frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # JavaScript files with proper MIME type
        location ~* \.js$ {
            add_header Content-Type application/javascript;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # CSS files with proper MIME type
        location ~* \.css$ {
            add_header Content-Type text/css;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # Other static assets
        location ~* \.(png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # WebSocket for device connections
    location /ws/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
    
    # File uploads
    location /uploads/ {
        alias /var/www/whatsapp-pro/Bulk_whatsapp_message/backend/uploads/;
        expires 1d;
        add_header Cache-Control "public";
    }
    
    # Logs (restricted access)
    location /logs/ {
        deny all;
        return 404;
    }
    
    # Block access to sensitive files
    location ~ /\. {
        deny all;
        return 404;
    }
    
    location ~ \.(env|sql|log)$ {
        deny all;
        return 404;
    }
}
EOF

echo ""
echo "Step 1: Nginx configuration updated!"

echo ""
echo "Step 2: Testing nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo ""
    echo "Step 3: Reloading nginx..."
    systemctl reload nginx
    
    echo ""
    echo "Step 4: Checking nginx status..."
    systemctl status nginx --no-pager -l
    
    echo ""
    echo "========================================="
    echo "MIME Types Fix Completed Successfully!"
    echo "========================================="
    echo ""
    echo "The website should now load JavaScript files correctly."
    echo "Test the website at: https://wxon.in"
    echo ""
else
    echo ""
    echo "ERROR: Nginx configuration test failed!"
    echo "Please check the configuration and try again."
    echo ""
fi