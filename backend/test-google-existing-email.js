#!/usr/bin/env node
// Test script for Google login with existing email scenarios

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000/api/v1/users';

async function testGoogleLoginScenarios() {
    console.log('🧪 Testing Google Login Scenarios...\n');

    try {
        // Scenario 1: Create a regular email/password user first
        console.log('📝 Scenario 1: Creating regular email/password user...');
        
        const regularUserData = new URLSearchParams();
        regularUserData.append('email', 'existinguser@example.com');
        regularUserData.append('fullName', 'Existing User');
        regularUserData.append('password', 'password123');
        regularUserData.append('age', '28');
        regularUserData.append('gender', 'Female');
        regularUserData.append('personality', 'Introvert');
        regularUserData.append('interests', JSON.stringify(['Books', 'Movies']));
        regularUserData.append('relationshipType', 'Long Term');
        regularUserData.append('bio', 'Regular user bio');
        regularUserData.append('genderOrientation', 'Straight');
        regularUserData.append('location', JSON.stringify([37.7749, -122.4194]));
        regularUserData.append('country', 'United States');
        regularUserData.append('religion', 'Agnostic');

        const registerResponse = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: regularUserData
        });

        if (registerResponse.status === 201) {
            console.log('✅ Regular user created successfully');
        } else {
            const errorData = await registerResponse.json();
            console.log('⚠️ User might already exist or registration failed:', errorData.message);
        }

        // Scenario 2: Try to login with Google using the same email
        console.log('\n📝 Scenario 2: Google login with existing email...');
        
        const googleLoginData = {
            email: 'existinguser@example.com', // Same email as regular user
            name: 'Existing User (Google)',
            avatar: 'https://example.com/google-avatar.jpg',
            token: 'google_token_for_existing_user'
        };

        const googleLoginResponse = await fetch(`${API_BASE}/googleLogin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(googleLoginData)
        });

        console.log(`Google login response status: ${googleLoginResponse.status}`);

        if (googleLoginResponse.status === 200) {
            const loginData = await googleLoginResponse.json();
            console.log('✅ CORRECT: Existing user logged in with Google (200)');
            console.log(`   UserExists: ${loginData.data.userExists}`);
            console.log(`   Login Method: ${loginData.data.user.loginMethod}`);
            console.log(`   Has Tokens: ${!!loginData.data.accessToken && !!loginData.data.refreshToken}`);
            console.log('✅ Frontend should navigate directly to HomeTabs');
        } else if (googleLoginResponse.status === 202) {
            console.log('❌ INCORRECT: Treated existing user as new user (202)');
            const data = await googleLoginResponse.json();
            console.log('Response:', data);
        } else {
            console.log('❌ Unexpected response');
            const errorData = await googleLoginResponse.json();
            console.log('Error:', errorData);
        }

        // Scenario 3: Test with completely new Google user
        console.log('\n📝 Scenario 3: Completely new Google user...');
        
        const newGoogleUser = {
            email: 'brandnewuser@gmail.com',
            name: 'Brand New User',
            avatar: 'https://example.com/new-avatar.jpg',
            token: 'google_token_for_new_user'
        };

        const newUserResponse = await fetch(`${API_BASE}/googleLogin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newGoogleUser)
        });

        console.log(`New Google user response status: ${newUserResponse.status}`);

        if (newUserResponse.status === 202) {
            const data = await newUserResponse.json();
            console.log('✅ CORRECT: New Google user needs registration (202)');
            console.log(`   UserExists: ${data.data.userExists}`);
            console.log(`   Email: ${data.data.googleUserInfo.email}`);
            console.log('✅ Frontend should store data and navigate to BasicDetails');
        } else if (newUserResponse.status === 200) {
            console.log('❌ INCORRECT: New user got direct login (200)');
            const data = await newUserResponse.json();
            console.log('Response:', data);
        } else {
            console.log('❌ Unexpected response');
            const errorData = await newUserResponse.json();
            console.log('Error:', errorData);
        }

        // Scenario 4: Test existing Google user (after they've completed registration)
        console.log('\n📝 Scenario 4: Existing Google user login...');
        
        // First complete registration for the new user
        const completeProfileData = new URLSearchParams();
        completeProfileData.append('email', 'brandnewuser@gmail.com');
        completeProfileData.append('fullName', 'Brand New User');
        completeProfileData.append('age', '26');
        completeProfileData.append('gender', 'Male');
        completeProfileData.append('personality', 'Ambivert');
        completeProfileData.append('interests', JSON.stringify(['Tech', 'Gaming']));
        completeProfileData.append('relationshipType', 'Casual');
        completeProfileData.append('bio', 'New Google user bio');
        completeProfileData.append('genderOrientation', 'Straight');
        completeProfileData.append('location', JSON.stringify([40.7128, -74.0060]));
        completeProfileData.append('country', 'United States');
        completeProfileData.append('religion', 'Atheism');

        const completeResponse = await fetch(`${API_BASE}/completeGoogleProfile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: completeProfileData
        });

        if (completeResponse.status === 201) {
            console.log('✅ New Google user profile completed');

            // Now try login again
            const existingGoogleResponse = await fetch(`${API_BASE}/googleLogin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newGoogleUser)
            });

            if (existingGoogleResponse.status === 200) {
                const existingData = await existingGoogleResponse.json();
                console.log('✅ CORRECT: Existing Google user logged in (200)');
                console.log(`   UserExists: ${existingData.data.userExists}`);
                console.log(`   Login Method: ${existingData.data.user.loginMethod}`);
            } else {
                console.log('❌ Existing Google user login failed');
            }
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('💡 Make sure the backend server is running on http://localhost:3000');
    }

    console.log('\n🎯 Test Summary:');
    console.log('✅ Scenario 1: Regular user → Google login = Direct login (200)');
    console.log('✅ Scenario 2: New Google user = Registration required (202)');
    console.log('✅ Scenario 3: Existing Google user = Direct login (200)');
    console.log('\n📱 Expected Frontend Behavior:');
    console.log('- Existing email + Google = Store tokens → HomeTabs');
    console.log('- New Google email = Store data → BasicDetails → Registration');
}

testGoogleLoginScenarios().catch(console.error);
