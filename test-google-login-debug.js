// Google Login Debug Test Script
// Run this with: node test-google-login-debug.js

const fetch = require('node-fetch');

const BACKEND_URL = 'http://10.21.39.161:3000/api/v1/users/googleLogin';

// Test data for Google login
const testGoogleLogin = async () => {
  console.log('🧪 Testing Google Login Flow...\n');
  
  // Test 1: Invalid token (should fail with 401)
  console.log('Test 1: Invalid Google token');
  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        name: 'Test User',
        avatar: '',
        token: 'invalid_token'
      })
    });
    
    const data = await response.text();
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, data);
    console.log(`Headers:`, Object.fromEntries(response.headers.entries()));
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: Missing required fields (should fail with 400)
  console.log('Test 2: Missing required fields');
  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com'
        // Missing name and token
      })
    });
    
    const data = await response.text();
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, data);
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 3: Test endpoint availability
  console.log('Test 3: Endpoint availability');
  try {
    const response = await fetch('http://10.21.39.161:3000/api/v1/users/', {
      method: 'GET'
    });
    
    const data = await response.text();
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, data);
  } catch (error) {
    console.error('Error:', error.message);
  }
};

// Run the test
testGoogleLogin().catch(console.error);
