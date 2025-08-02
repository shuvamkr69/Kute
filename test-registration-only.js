const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Simple registration test
async function testRegistration() {
  console.log('🔥 Testing User Registration...\n');
  
  const BASE_URL = 'http://localhost:3000'; // Update with your backend URL
  
  const testUser = {
    email: `test${Date.now()}@example.com`, // Unique email
    fullName: 'Test Registration User',
    password: 'testpass123',
    age: 25,
    gender: 'Male',
    personality: 'Introvert',
    interests: ['Music', 'Travel', 'Gaming'],
    relationshipType: 'Long Term',
    genderOrientation: 'Straight',
    bio: 'This is a test bio for registration testing.',
    location: [37.7749, -122.4194], // San Francisco coordinates
    country: 'United States',
    religion: 'Christianity',
    occupation: 'Student',
    loveLanguage: 'Compliments'
  };

  try {
    // Create FormData for file upload simulation
    const formData = new FormData();
    formData.append('email', testUser.email);
    formData.append('fullName', testUser.fullName);
    formData.append('password', testUser.password);
    formData.append('age', testUser.age);
    formData.append('gender', testUser.gender);
    formData.append('personality', testUser.personality);
    formData.append('interests', JSON.stringify(testUser.interests));
    formData.append('relationshipType', testUser.relationshipType);
    formData.append('genderOrientation', testUser.genderOrientation);
    formData.append('bio', testUser.bio);
    formData.append('location', JSON.stringify(testUser.location));
    formData.append('country', testUser.country);
    formData.append('pushToken', `test_push_token_${Date.now()}`);
    formData.append('religion', testUser.religion);
    formData.append('occupation', testUser.occupation);
    formData.append('loveLanguage', testUser.loveLanguage);

    // Create a test image file (placeholder)
    const testImagePath = path.join(__dirname, 'test-avatar-reg.jpg');
    const testImageContent = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync(testImagePath, testImageContent);
    
    formData.append('avatar1', fs.createReadStream(testImagePath));

    console.log('📤 Sending registration request...');
    console.log('📧 Email:', testUser.email);
    console.log('👤 Full Name:', testUser.fullName);
    console.log('🎯 Interests:', testUser.interests.join(', '));

    const response = await axios.post(`${BASE_URL}/api/v1/users/register`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 30000 // 30 second timeout
    });

    if (response.status === 201) {
      console.log('✅ Registration successful!');
      console.log('📊 Response data:', {
        userId: response.data.data?.createdUser?._id,
        email: response.data.data?.createdUser?.email,
        fullName: response.data.data?.createdUser?.fullName,
        hasAccessToken: !!response.data.data?.accessToken
      });
      
      // Clean up test file
      if (fs.existsSync(testImagePath)) {
        fs.unlinkSync(testImagePath);
      }
      
      return response.data.data;
    } else {
      console.log('❌ Unexpected status:', response.status);
      return null;
    }

  } catch (error) {
    console.log('❌ Registration failed!');
    
    if (error.response) {
      console.log('📋 Status:', error.response.status);
      console.log('💬 Message:', error.response.data?.message || 'No message');
      console.log('📄 Full error:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('🌐 Network error - no response received');
      console.log('🔍 Check if backend is running on:', BASE_URL);
    } else {
      console.log('⚠️ Error:', error.message);
    }
    
    // Clean up test file even on error
    const testImagePath = path.join(__dirname, 'test-avatar-reg.jpg');
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
    
    return null;
  }
}

// Run the test
testRegistration();
