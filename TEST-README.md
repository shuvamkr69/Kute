# Kute App Authentication Testing Suite

This testing suite provides comprehensive tests for the authentication system in your Kute dating app.

## Setup

1. **Install test dependencies:**
   ```bash
   npm install axios form-data
   ```

2. **Make sure your backend is running:**
   ```bash
   cd backend
   npm start
   # Backend should be running on http://localhost:3000
   ```

3. **Update the BASE_URL in test files if needed:**
   - Open the test files and change `http://localhost:3000` to your backend URL if different

## Test Files

### 1. Complete Test Suite (`test-auth.js`)
Tests all authentication flows:
- ✅ Regular email registration
- ✅ Regular email login  
- ✅ Google login (new user)
- ✅ Google profile completion
- ✅ Google login (existing user)
- ✅ Invalid credentials handling
- ✅ Missing fields validation

**Run:** `node test-auth.js`

### 2. Registration Only (`test-registration-only.js`)
Quick test for user registration with unique email.

**Run:** `node test-registration-only.js`

### 3. Login Only (`test-login-only.js`)
Tests login with existing credentials and invalid credentials.

**Run:** `node test-login-only.js`

## Running Tests

### Option 1: Individual Tests
```bash
# Test registration only
node test-registration-only.js

# Test login only  
node test-login-only.js

# Full test suite
node test-auth.js
```

### Option 2: Using npm scripts (if you copy package-test.json to package.json)
```bash
npm test              # Run full suite
npm run test:auth     # Run full suite
npm run test:registration  # Registration only
npm run test:login    # Login only
```

## Expected Output

### Successful Registration
```
🔥 Testing User Registration...

📤 Sending registration request...
📧 Email: test1691234567890@example.com
👤 Full Name: Test Registration User
🎯 Interests: Music, Travel, Gaming
✅ Registration successful!
📊 Response data: {
  userId: "64f1234567890abcdef12345",
  email: "test1691234567890@example.com",
  fullName: "Test Registration User",
  hasAccessToken: true
}
```

### Successful Login
```
🔐 Testing User Login...

📤 Sending login request...
📧 Email: testuser@example.com
✅ Login successful!
📊 Response data: {
  userId: "64f1234567890abcdef12345",
  email: "testuser@example.com", 
  fullName: "Test User",
  hasAccessToken: true,
  hasRefreshToken: true,
  isProfileComplete: true
}
```

## Common Issues & Solutions

### ❌ Network error - no response received
- **Problem:** Backend is not running
- **Solution:** Start your backend server with `npm start` in the backend directory

### ❌ User not found - try running registration test first
- **Problem:** Trying to login with user that doesn't exist
- **Solution:** Run registration test first or use existing user credentials

### ❌ User already exists
- **Problem:** Registration with email that already exists
- **Solution:** This is expected for repeated tests. The registration test uses unique emails.

### ❌ Invalid credentials
- **Problem:** Wrong email/password combination
- **Solution:** Check the credentials in test files match registered users

### ❌ Failed to upload image
- **Problem:** Image upload issues during registration
- **Solution:** The test creates a minimal test image automatically

## Test Data

The tests use these sample data sets:

### Regular User
- Email: `test{timestamp}@example.com` (unique)
- Password: `testpass123`
- Age: 25
- Gender: Male
- Interests: Music, Travel, Gaming

### Google User
- Email: `googletest@example.com`
- Name: Google Test User
- Test token provided

## Modifying Tests

To test with your own data:

1. **Update test credentials** in the test files
2. **Change BASE_URL** if backend runs on different port
3. **Modify test user data** as needed

## Output Files

- `auth-test-results.json` - Detailed test results (created by full test suite)
- Test images are automatically created and cleaned up

## API Endpoints Tested

1. `POST /api/v1/users/register` - User registration
2. `POST /api/v1/users/login` - User login
3. `POST /api/v1/users/googleLogin` - Google authentication
4. `POST /api/v1/users/completeGoogleProfile` - Google profile completion

## Troubleshooting

1. **Ensure backend dependencies are installed:**
   ```bash
   cd backend
   npm install
   ```

2. **Check backend logs** for detailed error information

3. **Verify database connection** - Make sure MongoDB is running

4. **Check environment variables** in backend (.env file)

5. **CORS issues** - Make sure your backend allows requests from test client
