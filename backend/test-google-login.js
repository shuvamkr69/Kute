#!/usr/bin/env node
// Google Login Test Script for Kute Dating App
// This script tests the Google OAuth configuration and login flow

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configurations and environment variables
function testGoogleLoginConfig() {
    console.log('🧪 Testing Google Login Configuration...\n');

    // Check environment variables
    const envPath = path.join(__dirname, '..', '.env');
    let envVars = {};
    
    try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            if (line.includes('=')) {
                const [key, value] = line.split('=');
                envVars[key] = value;
            }
        });
    } catch (error) {
        console.error('❌ Error reading .env file:', error.message);
        return;
    }

    // Test required environment variables
    const requiredVars = [
        'GOOGLE_ANDROID_CLIENT_ID',
        'GOOGLE_EXPO_CLIENT_ID'
    ];

    console.log('📋 Checking Environment Variables:');
    requiredVars.forEach(varName => {
        if (envVars[varName]) {
            console.log(`✅ ${varName}: ${envVars[varName].substring(0, 20)}...`);
        } else {
            console.log(`❌ ${varName}: Missing`);
        }
    });

    // Test app.config.js
    console.log('\n📋 Checking app.config.js:');
    try {
        const configPath = path.join(__dirname, '..', 'app.config.js');
        const configContent = fs.readFileSync(configPath, 'utf8');
        
        if (configContent.includes('googleAndroidClientId')) {
            console.log('✅ Google Android Client ID configured');
        } else {
            console.log('❌ Google Android Client ID not found in config');
        }
        
        if (configContent.includes('googleExpoClientId')) {
            console.log('✅ Google Expo Client ID configured');
        } else {
            console.log('❌ Google Expo Client ID not found in config');
        }
    } catch (error) {
        console.log('❌ Error reading app.config.js:', error.message);
    }

    // Test package.json dependencies
    console.log('\n📋 Checking Required Dependencies:');
    try {
        const packagePath = path.join(__dirname, '..', 'package.json');
        const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        const deps = { ...packageContent.dependencies, ...packageContent.devDependencies };
        
        const requiredDeps = [
            'expo-auth-session',
            'expo-web-browser',
            'expo-constants'
        ];
        
        requiredDeps.forEach(dep => {
            if (deps[dep]) {
                console.log(`✅ ${dep}: ${deps[dep]}`);
            } else {
                console.log(`❌ ${dep}: Missing`);
            }
        });
    } catch (error) {
        console.log('❌ Error reading package.json:', error.message);
    }

    // Test Google services configuration
    console.log('\n📋 Checking Google Services Configuration:');
    
    // Check android google-services.json
    const androidGoogleServices = path.join(__dirname, '..', 'android', 'app', 'google-services.json');
    if (fs.existsSync(androidGoogleServices)) {
        console.log('✅ Android google-services.json exists');
        try {
            const androidConfig = JSON.parse(fs.readFileSync(androidGoogleServices, 'utf8'));
            if (androidConfig.client && androidConfig.client[0] && androidConfig.client[0].client_info) {
                console.log(`✅ Android package name: ${androidConfig.client[0].client_info.android_client_info.package_name}`);
            }
        } catch (error) {
            console.log('❌ Error parsing android google-services.json');
        }
    } else {
        console.log('❌ Android google-services.json not found');
    }

    // Check root google-services.json
    const rootGoogleServices = path.join(__dirname, '..', 'google-services.json');
    if (fs.existsSync(rootGoogleServices)) {
        console.log('✅ Root google-services.json exists');
    } else {
        console.log('❌ Root google-services.json not found');
    }

    console.log('\n🔍 Common Google Login Issues & Solutions:');
    console.log('1. ❗ Ensure OAuth consent screen is configured in Google Cloud Console');
    console.log('2. ❗ Add authorized redirect URIs: https://auth.expo.io/@your-username/your-app-slug');
    console.log('3. ❗ Verify SHA-1 fingerprints are added for Android in Firebase');
    console.log('4. ❗ Check that bundle identifier matches in all configs');
    console.log('5. ❗ Ensure Google Services are enabled in Firebase');
}

// Test backend Google login endpoint
async function testBackendGoogleLogin() {
    console.log('\n🌐 Testing Backend Google Login Endpoint...');
    
    const testData = {
        email: 'test@example.com',
        name: 'Test User',
        avatar: 'https://example.com/avatar.jpg',
        token: 'test_token'
    };

    const postData = JSON.stringify(testData);
    
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/v1/users/googleLogin',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    return new Promise((resolve) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('✅ Backend Google login endpoint is working');
                } else {
                    console.log(`❌ Backend endpoint returned status: ${res.statusCode}`);
                }
                resolve();
            });
        });

        req.on('error', (e) => {
            console.log('❌ Backend server not running or unreachable');
            console.log('💡 Start backend with: cd backend && npm start');
            resolve();
        });

        req.write(postData);
        req.end();
    });
}

// Main test function
async function runGoogleLoginTests() {
    console.log('🚀 Kute Dating App - Google Login Configuration Test\n');
    console.log('='*60);
    
    testGoogleLoginConfig();
    await testBackendGoogleLogin();
    
    console.log('\n' + '='*60);
    console.log('🎯 Test Complete! Review the results above.');
    console.log('📚 For Google OAuth setup guide, visit: https://docs.expo.dev/guides/authentication/');
}

// Run tests
runGoogleLoginTests().catch(console.error);
