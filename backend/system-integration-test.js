// System Integration Test
// Tests for the complete system functionality

const request = require('supertest');
const app = require('./src/app');

describe('System Integration Tests', () => {
  test('Health check endpoint', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body.status).toBe('ok');
  });

  test('Database connection test', async () => {
    const response = await request(app)
      .get('/api/test/db')
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });
});

module.exports = {};