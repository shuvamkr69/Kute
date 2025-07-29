// Simple test to check Google login API response
const testGoogleEndpoint = async () => {
  console.log('🧪 Testing Google login endpoint response format...');
  
  // First, let's test with curl to see the raw response
  console.log('Run this command in terminal to test the endpoint:');
  console.log('');
  console.log('curl -X POST http://localhost:8080/api/v1/users/googleLogin \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"email":"test@example.com","name":"Test User","avatar":"","token":"invalid_token"}\'');
  console.log('');
  console.log('Expected: 401 error due to invalid Google token');
  console.log('If you get different error, there might be an issue with the endpoint');
  
  // The real issue might be that the Google token verification is failing
  // and throwing an error before we can return 202
  console.log('');
  console.log('🔍 Debugging steps:');
  console.log('1. Check if backend server is running on port 8080');
  console.log('2. Check if Google token verification is causing the error');
  console.log('3. Check network connectivity between app and backend');
  console.log('4. Look at backend server logs for detailed error messages');
};

testGoogleEndpoint();
