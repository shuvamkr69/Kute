// Test script for payment endpoints
// Run with: node test-payment.js

const axios = require('axios');

const BASE_URL = 'http://localhost:8000/api/v1';

// Mock JWT token (replace with a real token from login)
const MOCK_TOKEN = 'your_jwt_token_here';

const testPaymentEndpoints = async () => {
  try {
    console.log('🧪 Testing Payment Endpoints...\n');

    // Test 1: Get available products
    console.log('1. Testing GET /products...');
    try {
      const productsResponse = await axios.get(`${BASE_URL}/products`, {
        headers: { Authorization: `Bearer ${MOCK_TOKEN}` }
      });
      console.log('✅ Products endpoint working');
      console.log('Available products:', JSON.stringify(productsResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Products endpoint failed:', error.response?.data || error.message);
    }

    // Test 2: Test boost purchase (mock)
    console.log('\n2. Testing POST /purchase/boost...');
    try {
      const boostResponse = await axios.post(`${BASE_URL}/purchase/boost`, {
        purchaseToken: `test_token_${Date.now()}`,
        productId: 'boost_1'
      }, {
        headers: { Authorization: `Bearer ${MOCK_TOKEN}` }
      });
      console.log('✅ Boost purchase endpoint working');
      console.log('Response:', JSON.stringify(boostResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Boost purchase endpoint failed:', error.response?.data || error.message);
    }

    // Test 3: Test super like purchase (mock)
    console.log('\n3. Testing POST /purchase/superlike...');
    try {
      const superLikeResponse = await axios.post(`${BASE_URL}/purchase/superlike`, {
        purchaseToken: `test_token_${Date.now()}`,
        productId: 'superlike_1'
      }, {
        headers: { Authorization: `Bearer ${MOCK_TOKEN}` }
      });
      console.log('✅ Super like purchase endpoint working');
      console.log('Response:', JSON.stringify(superLikeResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Super like purchase endpoint failed:', error.response?.data || error.message);
    }

    // Test 4: Test premium purchase (mock)
    console.log('\n4. Testing POST /purchase/premium...');
    try {
      const premiumResponse = await axios.post(`${BASE_URL}/purchase/premium`, {
        purchaseToken: `test_token_${Date.now()}`,
        productId: 'premium_basic'
      }, {
        headers: { Authorization: `Bearer ${MOCK_TOKEN}` }
      });
      console.log('✅ Premium purchase endpoint working');
      console.log('Response:', JSON.stringify(premiumResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Premium purchase endpoint failed:', error.response?.data || error.message);
    }

    console.log('\n🎉 Payment endpoint testing completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Set up Google Play Console and create products');
    console.log('2. Add your service account key file');
    console.log('3. Update environment variables');
    console.log('4. Test with real Google Play purchases');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the tests
testPaymentEndpoints(); 