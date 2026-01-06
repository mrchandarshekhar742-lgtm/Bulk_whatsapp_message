# Security Fixes - Implementation Guide

## CRITICAL SECURITY ISSUES - Fix These First

---

## 1. Password Hashing (CRITICAL)

### Current Issue
```javascript
// ❌ WRONG - backend/src/controllers/authController.js (line 24)
password_hash: password  // Plain text!
```

### Fixed Implementation
```javascript
// ✅ CORRECT
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
  try {
    const { first_name, last_name, email, password, company_name } = req.body;

    // Validate password strength FIRST
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        error: 'Password must be 8+ chars with uppercase, number, and special char' 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user with hashed password
    const user = await User.create({
      first_name,
      last_name,
      email,
      password_hash: passwordHash,  // ✅ HASHED
      company_name,
      api_key: `sk_${uuidv4()}`,
      is_verified: false,  // ✅ Require email verification
    });

    // Send verification email (implement this)
    await sendVerificationEmail(user.email, user.id);

    logger.info(`User registered: ${email}`);

    res.status(201).json({
      message: 'Registration successful. Please verify your email.',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    });
  } catch (error) {
    logger.error('Registration failed', { error: error.message });
    res.status(500).json({ error: 'Registration failed' });
  }
};
```

### User Model Fix
```javascript
// ✅ Update User.js with password verification method
const bcrypt = require('bcryptjs');

// In User model:
User.prototype.verifyPassword = async function(password) {
  try {
    const isMatch = await bcrypt.compare(password, this.password_hash);
    return isMatch;
  } catch (error) {
    logger.error('Password verification error:', error);
    return false;
  }
};

// Add hooks to prevent saving plaintext
User.beforeCreate(async (user) => {
  if (user.password_hash && !user.password_hash.startsWith('$2')) {
    user.password_hash = await bcrypt.hash(user.password_hash, 10);
  }
});

User.beforeUpdate(async (user) => {
  if (user.changed('password_hash')) {
    if (!user.password_hash.startsWith('$2')) {
      user.password_hash = await bcrypt.hash(user.password_hash, 10);
    }
  }
});
```

---

## 2. Secure Authentication Token Storage (CRITICAL)

### Current Issue (Frontend)
```javascript
// ❌ WRONG - Storing in localStorage
localStorage.setItem('access_token', token);
// Vulnerable to XSS attacks
```

### Solution: HTTP-Only Cookies

#### Backend Implementation
```javascript
// backend/src/controllers/authController.js

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email, is_active: true } });

    if (!user || !(await user.verifyPassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const tokens = generateTokens(user.id);

    // ✅ Set HTTP-only cookie (not accessible from JavaScript)
    res.cookie('access_token', tokens.access_token, {
      httpOnly: true,        // Cannot be accessed via JavaScript
      secure: true,          // Only sent over HTTPS
      sameSite: 'strict',    // CSRF protection
      maxAge: 24 * 60 * 60 * 1000,  // 24 hours
      domain: 'wxon.in',
      path: '/'
    });

    // Refresh token with longer expiry
    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
      domain: 'wxon.in',
      path: '/'
    });

    logger.info(`User logged in: ${email}`);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    });
  } catch (error) {
    logger.error('Login failed', { error: error.message });
    res.status(500).json({ error: 'Login failed' });
  }
};

exports.register = async (req, res) => {
  // ... registration code ...
  
  const tokens = generateTokens(user.id);

  res.cookie('access_token', tokens.access_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,
    domain: 'wxon.in',
  });

  res.cookie('refresh_token', tokens.refresh_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    domain: 'wxon.in',
  });

  res.json({
    message: 'Registration successful',
    // Don't send tokens in response anymore
  });
};
```

#### Frontend Implementation
```javascript
// frontend/src/api/client.js

import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  withCredentials: true,  // ✅ Send cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - no need to add token header anymore
apiClient.interceptors.request.use(
  (config) => {
    // Token is in HTTP-only cookie now, automatically sent
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Refresh token endpoint will set new cookie
        await axios.post('/api/auth/refresh-token', {}, { 
          withCredentials: true 
        });
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Clear cookies on failure (backend should do this too)
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

#### AuthContext Update
```javascript
// frontend/src/context/AuthContext.jsx

import React, { createContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const response = await apiClient.get('/api/auth/me', {
        withCredentials: true
      });
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to load user:', error.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/api/auth/login', { 
        email, 
        password 
      }, {
        withCredentials: true
      });
      setUser(response.data.user);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const register = async (data) => {
    try {
      const response = await apiClient.post('/api/auth/register', data, {
        withCredentials: true
      });
      setUser(response.data.user);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/api/auth/logout', {}, {
        withCredentials: true
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

#### Logout Endpoint
```javascript
// backend/src/controllers/authController.js

exports.logout = async (req, res) => {
  try {
    // ✅ Clear HTTP-only cookies
    res.clearCookie('access_token', {
      domain: 'wxon.in',
      path: '/'
    });
    res.clearCookie('refresh_token', {
      domain: 'wxon.in',
      path: '/'
    });

    logger.info(`User logged out: ${req.user.email}`);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
};
```

---

## 3. Rate Limiting on Auth Endpoints (HIGH)

### Implementation
```javascript
// backend/src/app.js

const rateLimit = require('express-rate-limit');

// ✅ Auth-specific rate limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,  // 5 attempts per window
  message: 'Too many login attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Don't rate limit from same IP if not login/register
    return !['login', 'register'].some(path => req.path.includes(path));
  }
});

// Apply to auth routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Password reset should also be rate limited
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 3,  // 3 attempts per hour
  message: 'Too many password reset attempts. Try again later.',
});

app.post('/api/auth/forgot-password', passwordResetLimiter, authController.forgotPassword);
```

---

## 4. Email Verification on Registration (HIGH)

### Implementation
```javascript
// backend/src/controllers/authController.js

const crypto = require('crypto');
const nodemailer = require('nodemailer');  // Install: npm install nodemailer

// Setup email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',  // or your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  }
});

exports.register = async (req, res) => {
  try {
    const { first_name, last_name, email, password, company_name } = req.body;

    // Validate password strength
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        error: 'Password too weak' 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenHash = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    // Create user
    const user = await User.create({
      first_name,
      last_name,
      email,
      password_hash: passwordHash,
      company_name,
      api_key: `sk_${uuidv4()}`,
      is_verified: false,
      verification_token: verificationTokenHash,
      verification_token_expires: new Date(Date.now() + 24 * 60 * 60 * 1000),  // 24 hours
    });

    // Send verification email
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your Email',
      html: `
        <h2>Email Verification</h2>
        <p>Click the link below to verify your email:</p>
        <a href="${verificationLink}">${verificationLink}</a>
        <p>This link expires in 24 hours.</p>
      `,
    });

    logger.info(`User registered: ${email}. Verification email sent.`);

    res.status(201).json({
      message: 'Registration successful. Check your email to verify.',
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    logger.error('Registration failed', { error: error.message });
    res.status(500).json({ error: 'Registration failed' });
  }
};

// ✅ Add verification endpoint
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Verification token required' });
    }

    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      where: {
        verification_token: tokenHash,
        verification_token_expires: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Mark as verified
    await user.update({
      is_verified: true,
      verification_token: null,
      verification_token_expires: null,
    });

    logger.info(`Email verified: ${user.email}`);
    res.json({ message: 'Email verified successfully!' });
  } catch (error) {
    logger.error('Email verification failed', { error: error.message });
    res.status(500).json({ error: 'Verification failed' });
  }
};
```

---

## 5. Remove Accessibility Service Automation (CRITICAL - ANDROID)

### Current Issue
```kotlin
// ❌ WRONG - Violates WhatsApp ToS
performAutoSend(sendButton)  // Auto-clicking without user action
```

### Fixed Implementation
```kotlin
// ✅ CORRECT - Require explicit user action

class WhatsAppAccessibilityService : AccessibilityService() {
  
  // Remove auto-send functionality entirely
  // This service should only provide accessibility features to actual disabled users
  
  private fun handleWindowStateChanged(event: AccessibilityEvent) {
    val packageName = event.packageName?.toString()
    
    if (isWhatsAppPackage(packageName)) {
      // Just log the event, don't auto-send
      Log.d(TAG, "WhatsApp window changed")
      
      // Optional: Provide accessibility announcements
      announceForAccessibility("WhatsApp window active")
    }
  }
  
  // Remove performAutoSend() method entirely
  
  // If messaging is needed, use official WhatsApp Business API instead
}
```

### Alternative Solution: Use WhatsApp Business API
```javascript
// backend implementation with WhatsApp Business API

const axios = require('axios');

class WhatsAppBusinessAPI {
  constructor(accessToken, phoneNumberId) {
    this.accessToken = accessToken;
    this.phoneNumberId = phoneNumberId;
    this.apiUrl = `https://graph.instagram.com/v18.0/${phoneNumberId}`;
  }

  async sendMessage(recipientPhoneNumber, messageText) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/messages`,
        {
          messaging_product: 'whatsapp',
          to: recipientPhoneNumber,
          type: 'text',
          text: {
            body: messageText
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('WhatsApp API error:', error.response?.data);
      throw error;
    }
  }
}

// Usage in campaign service
const whatsappAPI = new WhatsAppBusinessAPI(
  process.env.WHATSAPP_ACCESS_TOKEN,
  process.env.WHATSAPP_PHONE_NUMBER_ID
);

exports.sendCampaignMessage = async (deviceId, recipientNumber, message) => {
  try {
    // Use official API instead of device automation
    const result = await whatsappAPI.sendMessage(recipientNumber, message);
    
    // Log the send
    await DeviceLog.create({
      device_id: deviceId,
      recipient_number: recipientNumber,
      message: message,
      status: 'SENT',
      sent_at: new Date()
    });

    return result;
  } catch (error) {
    logger.error('Failed to send message:', error);
    throw error;
  }
};
```

---

## 6. Enable HTTPS/SSL (CRITICAL)

### Backend Configuration
```javascript
// backend/server.js

const fs = require('fs');
const https = require('https');
const app = require('./src/app');

const PORT = process.env.APP_PORT || 8080;

async function startServer() {
  try {
    // Database setup...
    
    // ✅ Create HTTPS server
    const options = {
      key: fs.readFileSync(process.env.SSL_KEY_PATH || '/path/to/key.pem'),
      cert: fs.readFileSync(process.env.SSL_CERT_PATH || '/path/to/cert.pem'),
      // Enable modern TLS
      minVersion: 'TLSv1.2',
    };

    const server = https.createServer(options, app);

    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`🔒 HTTPS Server running on https://0.0.0.0:${PORT}`);
      
      // Initialize WebSocket
      DeviceWebSocketManager.initialize(server);
      DeviceWebSocketManager.startHeartbeat();
    });

    // Graceful shutdown...
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
```

### Nginx Configuration for Reverse Proxy
```nginx
# /etc/nginx/sites-available/whatsapp-pro

# Redirect HTTP to HTTPS
server {
  listen 80;
  server_name wxon.in www.wxon.in;
  
  location / {
    return 301 https://$server_name$request_uri;
  }
  
  # Let's Encrypt validation
  location /.well-known/acme-challenge/ {
    root /var/www/certbot;
  }
}

# HTTPS server
server {
  listen 443 ssl http2;
  server_name wxon.in www.wxon.in;

  # SSL certificates from Let's Encrypt
  ssl_certificate /etc/letsencrypt/live/wxon.in/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/wxon.in/privkey.pem;

  # Modern TLS configuration
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;
  ssl_prefer_server_ciphers on;

  # Security headers
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-XSS-Protection "1; mode=block" always;

  # CORS
  add_header 'Access-Control-Allow-Origin' '$http_origin' always;
  add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
  add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;

  # API proxy
  location /api {
    proxy_pass http://localhost:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
  }

  # WebSocket proxy
  location /ws {
    proxy_pass http://localhost:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 86400;
  }

  # Frontend
  location / {
    root /var/www/frontend;
    try_files $uri /index.html;
  }
}
```

### Install Let's Encrypt Certificate
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --standalone -d wxon.in -d www.wxon.in

# Auto-renewal
sudo systemctl enable certbot.timer
```

---

## 7. Android WebSocket Token Fix (HIGH)

### Current Issue
```kotlin
// ❌ WRONG - Token in URL
val url = "$serverUrl?token=$deviceToken"
```

### Fixed Implementation
```kotlin
// ✅ CORRECT - Token in header

class WebSocketManager(
    private val serverUrl: String,
    private val deviceToken: String,
    private val onCommandReceived: (WebSocketMessage) -> Unit
) {
  
  fun connect() {
    _connectionState.value = ConnectionState.CONNECTING
    
    // ✅ Use proper URL without token
    val request = Request.Builder()
      .url(serverUrl)
      .addHeader("Authorization", "Bearer $deviceToken")  // ✅ Header instead
      .build()
    
    webSocket = client.newWebSocket(request, object : WebSocketListener() {
      // ...
    })
  }
}
```

### Backend WebSocket Update
```javascript
// backend/src/services/DeviceWebSocketManager.js

async handleConnection(ws, req) {
  let deviceId = null;
  
  try {
    // ✅ Extract token from Authorization header
    const token = this.extractTokenFromHeader(req);
    
    if (!token) {
      ws.close(4001, 'No token provided');
      return;
    }

    // ... rest of connection logic ...
  }
}

extractTokenFromHeader(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  
  return parts[1];
}
```

---

## 8. Remove Cleartext Traffic - Android (HIGH)

### Current Issue
```xml
<!-- ❌ WRONG - AndroidManifest.xml -->
android:usesCleartextTraffic="true"
```

### Fix
```xml
<!-- ✅ CORRECT - Remove the line entirely -->
<!-- AND ensure backend uses HTTPS -->

<!-- network_security_config.xml -->
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <!-- All connections must use HTTPS -->
  <domain-config cleartextTrafficPermitted="false">
    <domain includeSubdomains="true">wxon.in</domain>
    
    <!-- Certificate pinning (optional but recommended) -->
    <pin-set>
      <pin digest="SHA-256">YOUR_CERT_HASH_HERE</pin>
    </pin-set>
  </domain-config>
</network-security-config>
```

---

## Implementation Priority

1. **Week 1**: Password hashing, auth token security, rate limiting
2. **Week 2**: Email verification, HTTPS/SSL setup, Android token fix
3. **Week 3**: Remove accessibility service automation, add encryption
4. **Week 4**: Monitoring, logging, backup strategy

---

## Testing After Fixes

```bash
# Test password hashing
npm test -- authController

# Test HTTPS
curl -I https://wxon.in

# Test auth endpoints
curl -X POST https://wxon.in/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!@"}'

# Test rate limiting
for i in {1..10}; do curl -X POST https://wxon.in/api/auth/login; done

# Test WebSocket connection
wscat -c wss://wxon.in/ws/device --header "Authorization: Bearer TOKEN"
```

