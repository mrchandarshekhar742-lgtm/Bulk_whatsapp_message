#!/bin/bash

# ============================================================================
# VPS BACKEND DEBUG SCRIPT
# ============================================================================

echo "=== Backend Debug Started ==="
cd /var/www/whatsapp-pro/Bulk_whatsapp_message/backend

# 1. Check environment file
echo "1. Checking .env file..."
ls -la .env
head -10 .env

# 2. Check database connection
echo "2. Testing database..."
node -e "
const mysql = require('mysql2/promise');
async function test() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'WhatsApp@2025!',
      database: 'bulk_whatsapp_sms'
    });
    console.log('Database connection: SUCCESS');
    await connection.end();
  } catch (error) {
    console.log('Database connection: FAILED', error.message);
  }
}
test();
"

# 3. Check models
echo "3. Checking models..."
node -e "
try {
  const { User, Device } = require('./src/models');
  console.log('Models loaded: SUCCESS');
} catch (error) {
  console.log('Models failed:', error.message);
}
"

# 4. Start backend in debug mode
echo "4. Starting backend in debug mode..."
NODE_ENV=production DEBUG=* node server.js &
BACKEND_PID=$!

# Wait 10 seconds then kill
sleep 10
kill $BACKEND_PID

echo "=== Backend Debug Completed ==="