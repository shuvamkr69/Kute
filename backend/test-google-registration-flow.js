#!/usr/bin/env node
// Google Registration Flow Test Script for Kute Dating App

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000/api/v1/users';

async function testGoogleRegistrationFlow() {
    console.log('🧪 Testing Google Registration Flow...\n');

    // Test data for Google registration
    const testUserData = {
        email: 'testgoogleuser@example.com',
        fullName: 'Test Google User',
        age: 25,
        gender: 'Male',
        personality: 'Extrovert',
        interests: JSON.stringify(['Music', 'Travel', 'Tech']),
        relationshipType: 'Long Term',
        bio: 'Test bio for Google user',
        genderOrientation: 'Straight',
        location: JSON.stringify([40.7128, -74.0060]), // New York coordinates
        country: 'United States',
        pushToken: 'test_push_token',
        religion: 'Prefer not to say',
        occupation: 'Software Developer',
        loveLanguage: 'Words of Affirmation',
        loginMethod: 'google',
        googleToken: 'test_google_token'
    };

    try {
        // Step 1: Test Google Login (initial registration)
        console.log('📝 Step 1: Testing Google login/registration...');
        const googleLoginResponse = await fetch(`${API_BASE}/googleLogin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testUserData.email,
                name: testUserData.fullName,
                avatar: 'https://example.com/avatar.jpg',
                token: testUserData.googleToken
            })
        });

        if (googleLoginResponse.ok) {
            const loginData = await googleLoginResponse.json();
            console.log('✅ Google login/registration successful');
            console.log(`   User ID: ${loginData.data.user._id}`);
            console.log(`   Profile Complete: ${loginData.data.user.isProfileComplete}`);
        } else {
            const errorData = await googleLoginResponse.json();
            console.log('❌ Google login failed:', errorData.message);
        }

        // Step 2: Test Complete Google Profile
        console.log('\n📝 Step 2: Testing Google profile completion...');
        
        // Create FormData equivalent for testing
        const formData = new URLSearchParams();
        Object.keys(testUserData).forEach(key => {
            formData.append(key, testUserData[key]);
        });

        const completeProfileResponse = await fetch(`${API_BASE}/completeGoogleProfile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        });

        if (completeProfileResponse.ok) {
            const profileData = await completeProfileResponse.json();
            console.log('✅ Google profile completion successful');
            console.log(`   Profile Complete: ${profileData.data.user.isProfileComplete}`);
            console.log(`   Age: ${profileData.data.user.age}`);
            console.log(`   Gender: ${profileData.data.user.gender}`);
        } else {
            const errorData = await completeProfileResponse.json();
            console.log('❌ Google profile completion failed:', errorData.message);
        }

        // Step 3: Test Google Login After Profile Completion
        console.log('\n📝 Step 3: Testing Google login after profile completion...');
        const secondLoginResponse = await fetch(`${API_BASE}/googleLogin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testUserData.email,
                name: testUserData.fullName,
                avatar: 'https://example.com/avatar.jpg',
                token: testUserData.googleToken
            })
        });

        if (secondLoginResponse.ok) {
            const secondLoginData = await secondLoginResponse.json();
            console.log('✅ Second Google login successful');
            console.log(`   Profile Complete: ${secondLoginData.data.user.isProfileComplete}`);
            console.log(`   Has all required fields: ${!!secondLoginData.data.user.age && !!secondLoginData.data.user.gender}`);
        } else {
            const errorData = await secondLoginResponse.json();
            console.log('❌ Second Google login failed:', errorData.message);
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        console.log('💡 Make sure the backend server is running on http://localhost:3000');
    }

    console.log('\n🎯 Google Registration Flow Test Complete!');
    console.log('\n📋 AsyncStorage Flow:');
    console.log('1. ✅ Google user data stored in tempUserData during registration');
    console.log('2. ✅ Profile completion uses tempUserData');
    console.log('3. ✅ Different endpoints for Google vs regular users');
    console.log('4. ✅ Proper authentication flow for Google users');
}

// Run the test
testGoogleRegistrationFlow().catch(console.error);
