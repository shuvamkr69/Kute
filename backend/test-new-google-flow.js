#!/usr/bin/env node
// Test script for new Google registration flow

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000/api/v1/users';

async function testNewGoogleFlow() {
    console.log('🧪 Testing New Google Registration Flow...\n');

    const testEmail = 'newtestuser@gmail.com';
    const testUserData = {
        email: testEmail,
        name: 'New Test User',
        avatar: 'https://example.com/avatar.jpg',
        token: 'test_google_token_123'
    };

    try {
        // Step 1: Test Google login for new user (should return 202)
        console.log('📝 Step 1: Testing Google login for NEW user...');
        const newUserResponse = await fetch(`${API_BASE}/googleLogin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUserData)
        });

        console.log(`Response status: ${newUserResponse.status}`);
        
        if (newUserResponse.status === 202) {
            const data = await newUserResponse.json();
            console.log('✅ Correct response for new user (202)');
            console.log(`   UserExists: ${data.data.userExists}`);
            console.log(`   Email: ${data.data.googleUserInfo.email}`);
            console.log('✅ Frontend should now store data in AsyncStorage and navigate to BasicDetails');
        } else {
            console.log('❌ Unexpected status for new user');
            const data = await newUserResponse.json();
            console.log('Response:', data);
        }

        // Step 2: Test profile completion
        console.log('\n📝 Step 2: Testing profile completion for new user...');
        
        const profileData = new URLSearchParams();
        profileData.append('email', testEmail);
        profileData.append('fullName', 'New Test User');
        profileData.append('age', '25');
        profileData.append('gender', 'Male');
        profileData.append('personality', 'Extrovert');
        profileData.append('interests', JSON.stringify(['Music', 'Travel']));
        profileData.append('relationshipType', 'Long Term');
        profileData.append('bio', 'Test bio for new Google user');
        profileData.append('genderOrientation', 'Straight');
        profileData.append('location', JSON.stringify([40.7128, -74.0060]));
        profileData.append('country', 'United States');
        profileData.append('religion', 'Christian');
        profileData.append('loginMethod', 'google');
        profileData.append('googleToken', 'test_google_token_123');

        const completeProfileResponse = await fetch(`${API_BASE}/completeGoogleProfile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: profileData
        });

        console.log(`Profile completion status: ${completeProfileResponse.status}`);
        
        if (completeProfileResponse.status === 201) {
            const profileResponseData = await completeProfileResponse.json();
            console.log('✅ New user profile created successfully (201)');
            console.log(`   User ID: ${profileResponseData.data.user._id}`);
            console.log(`   Profile Complete: ${profileResponseData.data.user.isProfileComplete}`);
        } else {
            console.log('❌ Profile completion failed');
            const errorData = await completeProfileResponse.json();
            console.log('Error:', errorData);
        }

        // Step 3: Test login after profile completion (should return 200)
        console.log('\n📝 Step 3: Testing Google login for EXISTING user...');
        const existingUserResponse = await fetch(`${API_BASE}/googleLogin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUserData)
        });

        console.log(`Existing user login status: ${existingUserResponse.status}`);
        
        if (existingUserResponse.status === 200) {
            const loginData = await existingUserResponse.json();
            console.log('✅ Existing user login successful (200)');
            console.log(`   UserExists: ${loginData.data.userExists}`);
            console.log(`   Has tokens: ${!!loginData.data.accessToken && !!loginData.data.refreshToken}`);
            console.log('✅ Frontend should now store tokens and navigate to HomeTabs');
        } else {
            console.log('❌ Existing user login failed');
            const errorData = await existingUserResponse.json();
            console.log('Error:', errorData);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('💡 Make sure the backend server is running on http://localhost:3000');
    }

    console.log('\n🎯 Test Summary:');
    console.log('1. New Google user → 202 response → BasicDetails registration');
    console.log('2. Complete profile → User created with full profile');
    console.log('3. Existing Google user → 200 response → Direct login');
    console.log('\n📱 Frontend Flow:');
    console.log('- Google OAuth → Check if user exists');
    console.log('- If new: Store in AsyncStorage → BasicDetails → Complete profile');
    console.log('- If existing: Direct login → HomeTabs');
}

testNewGoogleFlow().catch(console.error);
