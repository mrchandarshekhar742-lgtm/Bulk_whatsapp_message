#!/usr/bin/env node

// Simple test script to verify API fixes
const axios = require('axios');

const API_BASE = 'http://wxon.in:8080/api';

async function testEndpoints() {
  console.log('🧪 Testing API endpoints...\n');

  const tests = [
    {
      name: 'Health Check',
      url: 'http://wxon.in:8080/health',
      method: 'GET'
    },
    {
      name: 'Database Test',
      url: 'http://wxon.in:8080/api/test/db',
      method: 'GET'
    },
    {
      name: 'Auth Test',
      url: `${API_BASE}/auth/test`,
      method: 'GET'
    },
    {
      name: 'Campaign Logs (no params)',
      url: `${API_BASE}/campaigns/logs?page=1&limit=5`,
      method: 'GET',
      requiresAuth: true
    },
    {
      name: 'Campaign Logs (with empty params)',
      url: `${API_BASE}/campaigns/logs?page=1&limit=5&status=&device_id=&excel_record_id=`,
      method: 'GET',
      requiresAuth: true
    }
  ];

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      
      const config = {
        method: test.method,
        url: test.url,
        timeout: 5000
      };

      if (test.requiresAuth) {
        console.log(`  ⚠️  Skipping ${test.name} - requires authentication`);
        continue;
      }

      const response = await axios(config);
      
      if (response.status >= 200 && response.status < 300) {
        console.log(`  ✅ ${test.name}: ${response.status} ${response.statusText}`);
        if (response.data) {
          console.log(`     Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
        }
      } else {
        console.log(`  ❌ ${test.name}: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      if (error.response) {
        console.log(`  ❌ ${test.name}: ${error.response.status} ${error.response.statusText}`);
        if (error.response.data) {
          console.log(`     Error: ${JSON.stringify(error.response.data).substring(0, 100)}...`);
        }
      } else if (error.code === 'ECONNREFUSED') {
        console.log(`  ❌ ${test.name}: Connection refused - server may be down`);
      } else {
        console.log(`  ❌ ${test.name}: ${error.message}`);
      }
    }
    console.log('');
  }

  console.log('🏁 Test completed!\n');
  console.log('📋 Next steps:');
  console.log('1. Deploy the fixes to your VPS server');
  console.log('2. Restart the backend server with PM2');
  console.log('3. Test the frontend at http://wxon.in');
  console.log('4. Check campaign logs page specifically');
}

// Run tests
testEndpoints().catch(console.error);