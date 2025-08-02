const axios = require('axios');

// Simple login test
async function testLogin() {
  console.log('🔐 Testing User Login...\n');
  
  const BASE_URL = 'http://localhost:3000'; // Update with your backend URL
  
  // Use an existing user email or create one first
  const testCredentials = {
    email: 'testuser@example.com', // Update with a real user email
    password: 'testpass123'
  };

  try {
    console.log('📤 Sending login request...');
    console.log('📧 Email:', testCredentials.email);

    const response = await axios.post(`${BASE_URL}/api/v1/users/login`, {
      email: testCredentials.email,
      password: testCredentials.password,
      pushToken: `test_push_token_login_${Date.now()}`
    }, {
      timeout: 15000 // 15 second timeout
    });

    if (response.status === 200) {
      console.log('✅ Login successful!');
      console.log('📊 Response data:', {
        userId: response.data.data?.user?._id,
        email: response.data.data?.user?.email,
        fullName: response.data.data?.user?.fullName,
        hasAccessToken: !!response.data.data?.accessToken,
        hasRefreshToken: !!response.data.data?.refreshToken,
        isProfileComplete: response.data.data?.user?.isProfileComplete
      });
      
      return response.data.data;
    } else {
      console.log('❌ Unexpected status:', response.status);
      return null;
    }

  } catch (error) {
    console.log('❌ Login failed!');
    
    if (error.response) {
      console.log('📋 Status:', error.response.status);
      console.log('💬 Message:', error.response.data?.message || 'No message');
      
      if (error.response.status === 404) {
        console.log('🔍 User not found - try running registration test first');
      } else if (error.response.status === 401) {
        console.log('🔐 Invalid credentials - check email/password');
      } else if (error.response.status === 400) {
        console.log('📝 Bad request - check if user is Google login only');
      }
      
    } else if (error.request) {
      console.log('🌐 Network error - no response received');
      console.log('🔍 Check if backend is running on:', BASE_URL);
    } else {
      console.log('⚠️ Error:', error.message);
    }
    
    return null;
  }
}

// Test both valid and invalid logins
async function runLoginTests() {
  console.log('🚀 Starting Login Test Suite...\n');
  
  // Test 1: Valid login
  await testLogin();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: Invalid credentials
  console.log('🚫 Testing Invalid Credentials...\n');
  
  try {
    const response = await axios.post('http://localhost:3000/api/v1/users/login', {
      email: 'testuser@example.com',
      password: 'wrongpassword',
      pushToken: 'test_token'
    });
    
    console.log('❌ Should have failed but succeeded');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Correctly rejected invalid credentials');
    } else {
      console.log('❌ Unexpected error:', error.response?.data?.message || error.message);
    }
  }
  
  console.log('\n🏁 Login tests completed!');
}

// Run the tests
runLoginTests();
