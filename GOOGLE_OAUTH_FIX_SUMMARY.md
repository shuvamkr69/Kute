# Google OAuth Registration Fix - Updated Implementation

## Problem
When users register with Google OAuth, they need to go through the proper registration flow instead of being automatically logged in. New Google users should complete their profile in BasicDetails before being fully registered.

## Solution Implemented

### 1. Backend Changes

#### `backend/src/controllers/user.controller.js`
- **Modified `googleLoginUser` function**:
  - **For NEW users**: Returns `202 Accepted` with user info, no user creation
  - **For EXISTING users**: Returns `200 OK` with login tokens
  - Uses `userExists` flag to differentiate

- **Enhanced `completeGoogleProfile` function**:
  - **Creates new user** when profile is completed (for new Google users)
  - **Updates existing user** profile (for profile completion)
  - Returns `201 Created` for new users, `200 OK` for updates

### 2. Frontend Changes

#### `src/screens/RegisterScreen.tsx`
- **Enhanced `handleGoogleLogin` function**:
  - Handles `202` response for new users → Store in AsyncStorage → Navigate to BasicDetails
  - Handles `200` response for existing users → Store tokens → Navigate to HomeTabs
  - Proper error handling for different response codes

#### `src/screens/UserInfo/MakeUserBio.tsx`
- **Already supports Google users** via `completeGoogleProfile` endpoint
- Creates new user when profile completion is submitted

## New Flow

### For NEW Google Users (Email not in database)
```
Google OAuth Success
       ↓
Backend: googleLogin → 202 Response (userExists: false)
       ↓
Frontend: Store in AsyncStorage → Navigate to BasicDetails
       ↓
User completes: BasicDetails → Location → Photos → Bio
       ↓
Backend: completeGoogleProfile → 201 Created (New User)
       ↓
Frontend: Login with Google → Navigate to HomeTabs
```

### For EXISTING Users (Email in database - ANY login method)
```
Google OAuth Success
       ↓
Backend: googleLogin → 200 Response (userExists: true, tokens)
       ↓ 
Backend: Updates loginMethod to "google" if originally email/password
       ↓
Frontend: Store tokens → Navigate to HomeTabs
```

### For EXISTING Google Users (Already registered via Google)
```
Google OAuth Success
       ↓
Backend: googleLogin → 200 Response (userExists: true, tokens)
       ↓
Frontend: Store tokens → Navigate to HomeTabs
```

## Key Scenarios Handled

### 1. **Email/Password User → Google Login**
- User originally registered with email/password
- Later tries to login with Google using same email
- ✅ **Result**: Direct login, `loginMethod` updated to "google"

### 2. **Brand New Google User**
- Email doesn't exist in database
- ✅ **Result**: Registration flow via BasicDetails

### 3. **Existing Google User**
- User already completed Google registration before
- ✅ **Result**: Direct login with tokens

## Backend Logic Enhancement

```javascript
// In googleLoginUser function
let user = await User.findOne({ email });

if (!user) {
  // New user - return 202 for registration
  return 202_response_with_user_info;
}

// User exists (regardless of original login method)
// Update to support Google login
if (user.loginMethod !== "google") {
  user.loginMethod = "google"; // Enable Google login
  await user.save();
}

// Return 200 with login tokens
return 200_response_with_tokens;
```

## Response Codes

### `/api/v1/users/googleLogin`
- **200**: Existing user login successful (with tokens)
- **202**: New user, registration required (with user info)
- **400**: Missing email/name/token
- **401**: Invalid Google token

### `/api/v1/users/completeGoogleProfile`
- **201**: New Google user profile created
- **200**: Existing Google user profile updated
- **400**: Missing required fields

## Key Features

### Backend Response for New Users (202)
```json
{
  "statusCode": 202,
  "data": {
    "userExists": false,
    "googleUserInfo": {
      "email": "user@gmail.com",
      "name": "User Name", 
      "avatar": "https://avatar-url"
    }
  },
  "message": "Google user not found, registration required"
}
```

### Backend Response for Existing Users (200)
```json
{
  "statusCode": 200,
  "data": {
    "userExists": true,
    "user": { /* user object */ },
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token"
  },
  "message": "Google login successful"
}
```

### AsyncStorage Data for New Google Users
```json
{
  "fullName": "Google User Name",
  "email": "user@gmail.com",
  "password": "",
  "avatar": "https://google-avatar-url", 
  "loginMethod": "google",
  "googleToken": "oauth-access-token"
}
```

## Benefits
- ✅ Clear separation between login and registration
- ✅ New Google users must complete profile before access
- ✅ Existing Google users get immediate login
- ✅ Proper AsyncStorage usage for registration flow
- ✅ No phantom users created in database
- ✅ Consistent registration experience for all users

## Testing
Created comprehensive test scripts:

### `backend/test-new-google-flow.js`
- Tests basic new user registration flow
- Verifies 202 → registration → 200 flow

### `backend/test-google-existing-email.js` 
- **Scenario 1**: Email/password user → Google login (should get 200)
- **Scenario 2**: New Google user → Registration (should get 202) 
- **Scenario 3**: Existing Google user → Login (should get 200)
- **Scenario 4**: loginMethod update verification

### Manual Testing Scenarios
1. **Create regular user** with email/password
2. **Try Google login** with same email → Should login directly
3. **Try Google login** with new email → Should go to registration
4. **Complete Google registration** → Should create new user
5. **Login again with Google** → Should login directly
