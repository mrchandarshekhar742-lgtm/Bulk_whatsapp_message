const jwt = require('jsonwebtoken');

// Create a test token for user ID 9 (bharat@gmail.com)
const testToken = jwt.sign(
  { userId: 9 },
  '6cb434f6b1715c6140739e4c6fb97eb5c81ac686cd37ad512f205521d57fa0ff15c8b0e11273f4ec65b3137376fcb711717a76d7693e9143460f60e98bec7789',
  { expiresIn: '1h' }
);

console.log('Test Token:', testToken);
console.log('');
console.log('Test command:');
console.log(`curl 'http://localhost:8080/api/devices/health-summary' -H 'Authorization: Bearer ${testToken}'`);