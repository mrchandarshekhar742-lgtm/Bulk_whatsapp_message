require('dotenv').config();
const { User, sequelize } = require('./src/models');

async function createTestUser() {
  try {
    // Sync database first
    await sequelize.sync({ alter: true });
    console.log('✓ Database synced');

    // Check if test user already exists
    const existingUser = await User.findOne({ where: { email: 'test@wxon.in' } });
    
    if (existingUser) {
      console.log('✓ Test user already exists:', existingUser.email);
      return existingUser;
    }

    // Create test user
    const testUser = await User.create({
      first_name: 'Test',
      last_name: 'User',
      email: 'test@wxon.in',
      password_hash: 'password123', // This will be hashed by the model
      company_name: 'Test Company',
      is_verified: true,
      api_key: `sk_test_${Date.now()}`,
    });

    console.log('✓ Test user created successfully:');
    console.log('  Email:', testUser.email);
    console.log('  ID:', testUser.id);
    console.log('  API Key:', testUser.api_key);
    
    return testUser;
  } catch (error) {
    console.error('✗ Error creating test user:', error.message);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  createTestUser()
    .then(() => {
      console.log('\n✓ Test user setup complete!');
      console.log('You can now login with:');
      console.log('  Email: test@wxon.in');
      console.log('  Password: password123');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n✗ Setup failed:', error);
      process.exit(1);
    });
}

module.exports = createTestUser;