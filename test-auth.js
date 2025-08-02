const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3000'; // Update with your backend URL
const TEST_USER = {
  email: 'testuser@example.com',
  fullName: 'Test User',
  password: 'testpass123',
  age: 25,
  gender: 'Male',
  personality: 'Introvert',
  interests: ['Music', 'Travel', 'Gaming'],
  relationshipType: 'Long Term',
  genderOrientation: 'Straight',
  bio: 'This is a test bio for testing purposes.',
  location: [37.7749, -122.4194], // San Francisco coordinates
  country: 'United States',
  religion: 'Christianity',
  occupation: 'Student',
  loveLanguage: 'Compliments'
};

const GOOGLE_TEST_USER = {
  email: 'googletest@example.com',
  name: 'Google Test User',
  avatar: 'https://example.com/avatar.jpg',
  token: 'test_google_token_123'
};

// Test sprite class
class AuthTestSprite {
  constructor() {
    this.baseURL = BASE_URL;
    this.results = [];
  }

  log(test, status, message, data = null) {
    const result = {
      test,
      status,
      message,
      timestamp: new Date().toISOString(),
      data
    };
    this.results.push(result);
    
    const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${emoji} ${test}: ${message}`);
    
    if (data) {
      console.log(`   Data:`, JSON.stringify(data, null, 2));
    }
  }

  async testRegularRegistration() {
    try {
      console.log('\n🔥 Testing Regular Email Registration...');
      
      // Create FormData for file upload simulation
      const formData = new FormData();
      formData.append('email', TEST_USER.email);
      formData.append('fullName', TEST_USER.fullName);
      formData.append('password', TEST_USER.password);
      formData.append('age', TEST_USER.age);
      formData.append('gender', TEST_USER.gender);
      formData.append('personality', TEST_USER.personality);
      formData.append('interests', JSON.stringify(TEST_USER.interests));
      formData.append('relationshipType', TEST_USER.relationshipType);
      formData.append('genderOrientation', TEST_USER.genderOrientation);
      formData.append('bio', TEST_USER.bio);
      formData.append('location', JSON.stringify(TEST_USER.location));
      formData.append('country', TEST_USER.country);
      formData.append('pushToken', 'test_push_token_123');
      formData.append('religion', TEST_USER.religion);
      formData.append('occupation', TEST_USER.occupation);
      formData.append('loveLanguage', TEST_USER.loveLanguage);

      // Create a test image file (placeholder)
      const testImagePath = path.join(__dirname, 'test-avatar.jpg');
      if (!fs.existsSync(testImagePath)) {
        // Create a minimal test file
        fs.writeFileSync(testImagePath, 'test image data');
      }
      formData.append('avatar1', fs.createReadStream(testImagePath));

      const response = await axios.post(`${this.baseURL}/api/v1/users/register`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });

      if (response.status === 201) {
        this.log('REGULAR_REGISTRATION', 'PASS', 'User registered successfully', {
          userId: response.data.data?.createdUser?._id,
          email: response.data.data?.createdUser?.email
        });
        return response.data.data;
      } else {
        this.log('REGULAR_REGISTRATION', 'FAIL', `Unexpected status: ${response.status}`);
        return null;
      }
    } catch (error) {
      if (error.response?.status === 409) {
        this.log('REGULAR_REGISTRATION', 'WARN', 'User already exists - this is expected for repeated tests');
        return { userExists: true };
      } else {
        this.log('REGULAR_REGISTRATION', 'FAIL', error.response?.data?.message || error.message);
        return null;
      }
    }
  }

  async testRegularLogin() {
    try {
      console.log('\n🔐 Testing Regular Email Login...');
      
      const response = await axios.post(`${this.baseURL}/api/v1/users/login`, {
        email: TEST_USER.email,
        password: TEST_USER.password,
        pushToken: 'test_push_token_login_123'
      });

      if (response.status === 200) {
        this.log('REGULAR_LOGIN', 'PASS', 'Login successful', {
          accessToken: response.data.data?.accessToken ? 'Present' : 'Missing',
          refreshToken: response.data.data?.refreshToken ? 'Present' : 'Missing',
          userId: response.data.data?.user?._id
        });
        return response.data.data;
      } else {
        this.log('REGULAR_LOGIN', 'FAIL', `Unexpected status: ${response.status}`);
        return null;
      }
    } catch (error) {
      this.log('REGULAR_LOGIN', 'FAIL', error.response?.data?.message || error.message);
      return null;
    }
  }

  async testGoogleLoginNewUser() {
    try {
      console.log('\n🔍 Testing Google Login (New User)...');
      
      const response = await axios.post(`${this.baseURL}/api/v1/users/googleLogin`, {
        email: GOOGLE_TEST_USER.email,
        name: GOOGLE_TEST_USER.name,
        avatar: GOOGLE_TEST_USER.avatar,
        token: GOOGLE_TEST_USER.token,
        pushToken: 'test_push_token_google_123'
      });

      if (response.status === 202) {
        this.log('GOOGLE_LOGIN_NEW', 'PASS', 'New Google user detected, registration required', {
          userExists: response.data.data?.userExists,
          googleUserInfo: response.data.data?.googleUserInfo
        });
        return response.data.data;
      } else {
        this.log('GOOGLE_LOGIN_NEW', 'FAIL', `Unexpected status: ${response.status}`);
        return null;
      }
    } catch (error) {
      this.log('GOOGLE_LOGIN_NEW', 'FAIL', error.response?.data?.message || error.message);
      return null;
    }
  }

  async testGoogleProfileCompletion() {
    try {
      console.log('\n📝 Testing Google Profile Completion...');
      
      const formData = new FormData();
      formData.append('email', GOOGLE_TEST_USER.email);
      formData.append('fullName', GOOGLE_TEST_USER.name);
      formData.append('age', '28');
      formData.append('gender', 'Female');
      formData.append('personality', 'Extrovert');
      formData.append('interests', JSON.stringify(['Art', 'Photography', 'Fitness']));
      formData.append('relationshipType', 'Casual');
      formData.append('genderOrientation', 'Straight');
      formData.append('bio', 'Google test user bio');
      formData.append('location', JSON.stringify([40.7128, -74.0060])); // NYC coordinates
      formData.append('country', 'United States');
      formData.append('pushToken', 'test_push_token_google_complete_123');
      formData.append('religion', 'Buddhism');
      formData.append('occupation', 'Job');
      formData.append('loveLanguage', 'Time Together');
      formData.append('googleToken', GOOGLE_TEST_USER.token);

      // Create a test image file for Google user
      const testImagePath = path.join(__dirname, 'test-avatar-google.jpg');
      if (!fs.existsSync(testImagePath)) {
        fs.writeFileSync(testImagePath, 'google test image data');
      }
      formData.append('avatar1', fs.createReadStream(testImagePath));

      const response = await axios.post(`${this.baseURL}/api/v1/users/completeGoogleProfile`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });

      if (response.status === 201) {
        this.log('GOOGLE_PROFILE_COMPLETION', 'PASS', 'Google profile completed successfully', {
          userId: response.data.data?.user?._id,
          email: response.data.data?.user?.email,
          loginMethod: response.data.data?.user?.loginMethod
        });
        return response.data.data;
      } else {
        this.log('GOOGLE_PROFILE_COMPLETION', 'FAIL', `Unexpected status: ${response.status}`);
        return null;
      }
    } catch (error) {
      if (error.response?.status === 409) {
        this.log('GOOGLE_PROFILE_COMPLETION', 'WARN', 'Google user already exists - testing existing user login');
        return await this.testGoogleLoginExistingUser();
      } else {
        this.log('GOOGLE_PROFILE_COMPLETION', 'FAIL', error.response?.data?.message || error.message);
        return null;
      }
    }
  }

  async testGoogleLoginExistingUser() {
    try {
      console.log('\n🔄 Testing Google Login (Existing User)...');
      
      const response = await axios.post(`${this.baseURL}/api/v1/users/googleLogin`, {
        email: GOOGLE_TEST_USER.email,
        name: GOOGLE_TEST_USER.name,
        avatar: GOOGLE_TEST_USER.avatar,
        token: GOOGLE_TEST_USER.token,
        pushToken: 'test_push_token_google_existing_123'
      });

      if (response.status === 200) {
        this.log('GOOGLE_LOGIN_EXISTING', 'PASS', 'Existing Google user login successful', {
          accessToken: response.data.data?.accessToken ? 'Present' : 'Missing',
          refreshToken: response.data.data?.refreshToken ? 'Present' : 'Missing',
          userExists: response.data.data?.userExists
        });
        return response.data.data;
      } else {
        this.log('GOOGLE_LOGIN_EXISTING', 'FAIL', `Unexpected status: ${response.status}`);
        return null;
      }
    } catch (error) {
      this.log('GOOGLE_LOGIN_EXISTING', 'FAIL', error.response?.data?.message || error.message);
      return null;
    }
  }

  async testInvalidCredentials() {
    try {
      console.log('\n🚫 Testing Invalid Credentials...');
      
      const response = await axios.post(`${this.baseURL}/api/v1/users/login`, {
        email: TEST_USER.email,
        password: 'wrongpassword',
        pushToken: 'test_push_token_invalid_123'
      });

      this.log('INVALID_CREDENTIALS', 'FAIL', 'Should have failed but succeeded');
      return null;
    } catch (error) {
      if (error.response?.status === 401) {
        this.log('INVALID_CREDENTIALS', 'PASS', 'Correctly rejected invalid credentials');
        return true;
      } else {
        this.log('INVALID_CREDENTIALS', 'FAIL', `Unexpected error: ${error.response?.data?.message || error.message}`);
        return null;
      }
    }
  }

  async testMissingFields() {
    try {
      console.log('\n📋 Testing Missing Required Fields...');
      
      const response = await axios.post(`${this.baseURL}/api/v1/users/login`, {
        email: TEST_USER.email
        // Missing password
      });

      this.log('MISSING_FIELDS', 'FAIL', 'Should have failed but succeeded');
      return null;
    } catch (error) {
      if (error.response?.status === 400) {
        this.log('MISSING_FIELDS', 'PASS', 'Correctly rejected missing fields');
        return true;
      } else {
        this.log('MISSING_FIELDS', 'FAIL', `Unexpected error: ${error.response?.data?.message || error.message}`);
        return null;
      }
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Authentication Test Suite...\n');
    
    // Test registration first
    await this.testRegularRegistration();
    
    // Test login
    await this.testRegularLogin();
    
    // Test Google flow
    await this.testGoogleLoginNewUser();
    await this.testGoogleProfileCompletion();
    
    // Test error cases
    await this.testInvalidCredentials();
    await this.testMissingFields();
    
    this.generateReport();
  }

  generateReport() {
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('=' .repeat(50));
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const warnings = this.results.filter(r => r.status === 'WARN').length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
    
    console.log('\nDetailed Results:');
    this.results.forEach((result, index) => {
      const emoji = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`${index + 1}. ${emoji} ${result.test}: ${result.message}`);
    });
    
    // Save results to file
    fs.writeFileSync(
      path.join(__dirname, 'auth-test-results.json'),
      JSON.stringify(this.results, null, 2)
    );
    
    console.log('\n📄 Full results saved to auth-test-results.json');
  }

  async cleanup() {
    // Clean up test files
    const testFiles = ['test-avatar.jpg', 'test-avatar-google.jpg'];
    testFiles.forEach(file => {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  }
}

// Run the tests
async function main() {
  const testSprite = new AuthTestSprite();
  
  try {
    await testSprite.runAllTests();
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  } finally {
    await testSprite.cleanup();
  }
}

// Check if running directly
if (require.main === module) {
  main();
}

module.exports = AuthTestSprite;
