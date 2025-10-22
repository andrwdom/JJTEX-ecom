# Google Authentication Test Guide

## Prerequisites

1. **Firebase Project Setup**
   - Create a Firebase project at https://console.firebase.google.com/
   - Enable Google Authentication
   - Get your Firebase configuration

2. **Environment Variables**
   - Create a `.env` file in the frontend directory with your Firebase config
   - Set up the backend Firebase Admin SDK credentials

## Testing Steps

### 1. Start the Application

```bash
# Terminal 1 - Backend
cd backendV2
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 2. Test Google Authentication

1. Navigate to `http://localhost:5173/login`
2. Click "Continue with Google"
3. Complete Google sign-in flow
4. Verify you're redirected to the home page
5. Check that you're logged in (profile icon should work)

### 3. Test Authentication Persistence

1. Refresh the page
2. Verify you remain logged in
3. Check localStorage for the token

### 4. Test Logout

1. Click the profile icon
2. Navigate to orders or any protected route
3. Test logout functionality

## Expected Behavior

- ✅ Google sign-in popup opens
- ✅ User can complete Google authentication
- ✅ User is redirected to home page after successful login
- ✅ Authentication state persists across page refreshes
- ✅ User can access protected routes
- ✅ Logout functionality works properly

## Troubleshooting

### Common Issues

1. **Firebase Configuration Error**
   - Check that all environment variables are set correctly
   - Verify Firebase project settings

2. **Popup Blocked**
   - Allow popups for localhost
   - Try in incognito mode

3. **Backend Connection Error**
   - Ensure backendV2 is running
   - Check that Firebase Admin SDK is properly configured

4. **Token Issues**
   - Check browser console for errors
   - Verify backend Firebase token verification

## Backend Verification

The backendV2 already includes:
- ✅ Firebase Admin SDK integration
- ✅ `/api/user/firebase-login` endpoint
- ✅ JWT token generation for authenticated users
- ✅ User creation/update for Google users
- ✅ Proper error handling and security measures
