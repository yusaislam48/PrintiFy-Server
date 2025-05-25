const axios = require('axios');

const API_URL = 'https://printifyapp-564e0522a8a7.herokuapp.com/api';

async function verifyBoothManagerSystem() {
  console.log('🔍 Verifying Booth Manager System...\n');

  // Test 1: Check if booth manager endpoint exists
  console.log('1. Testing booth manager endpoint availability...');
  try {
    const response = await axios.post(`${API_URL}/booth-managers/login`, {
      email: 'test@test.com',
      password: 'wrongpassword'
    });
    console.log('❌ Unexpected success - should have failed with wrong credentials');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Booth manager endpoint is available (returned 401 for wrong credentials)');
    } else if (error.response && error.response.status === 404) {
      console.log('❌ Booth manager endpoint NOT FOUND (404) - routes not deployed');
      return false;
    } else {
      console.log('⚠️  Unexpected error:', error.message);
    }
  }

  // Test 2: Try to login with booth manager credentials
  console.log('\n2. Testing booth manager login...');
  try {
    const response = await axios.post(`${API_URL}/booth-managers/login`, {
      email: 'booth1@printify.com',
      password: 'Yu2521191'
    });

    if (response.data.success) {
      console.log('✅ Booth manager login successful!');
      console.log('   Name:', response.data.boothManager.name);
      console.log('   Email:', response.data.boothManager.email);
      console.log('   Booth:', response.data.boothManager.boothName);
      console.log('   Location:', response.data.boothManager.boothLocation);
      console.log('   Token received:', response.data.token ? 'Yes' : 'No');
      return true;
    } else {
      console.log('❌ Login failed:', response.data.message);
      return false;
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('❌ Login failed - Invalid credentials (booth manager not created yet)');
    } else if (error.response && error.response.status === 404) {
      console.log('❌ Booth manager endpoint NOT FOUND (404) - routes not deployed');
    } else {
      console.log('❌ Login error:', error.response?.data?.message || error.message);
    }
    return false;
  }
}

async function main() {
  console.log('🚀 Booth Manager System Verification\n');
  console.log('API URL:', API_URL);
  console.log('Expected credentials:');
  console.log('  Email: booth1@printify.com');
  console.log('  Password: Yu2521191\n');

  const isWorking = await verifyBoothManagerSystem();

  console.log('\n📋 Summary:');
  if (isWorking) {
    console.log('✅ Booth Manager System is WORKING!');
    console.log('✅ PrintHub app can now use booth manager authentication');
    console.log('✅ No more fallback to admin authentication needed');
  } else {
    console.log('❌ Booth Manager System is NOT working');
    console.log('📝 Next steps:');
    console.log('   1. Deploy booth manager files to Heroku');
    console.log('   2. Run: heroku run node add-booth-manager.js');
    console.log('   3. Test again with this script');
  }

  console.log('\n🔗 Test manually:');
  console.log(`curl -X POST ${API_URL}/booth-managers/login \\`);
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"email":"booth1@printify.com","password":"Yu2521191"}\'');
}

main().catch(console.error); 