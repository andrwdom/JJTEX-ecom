# JJTEX Authentication Flow Guide

## Overview

This guide documents the complete authentication flow for the JJTEX e-commerce platform, which integrates Firebase authentication with the production backend (v2).

## Architecture

### Components Involved

1. **Firebase Authentication** - Client-side user authentication
2. **Google OAuth 2.0** - Identity provider
3. **Backend API** - User management and JWT token generation
4. **LocalStorage** - Client-side persistent storage
5. **AuthContext** - React context for user state management
6. **ShopContext** - React context for app-wide state (token, user, cart)

## Authentication Flow

### 1. Sign-Up / Login Process

```
User clicks "Sign in with Google"
        ↓
Firebase Google Sign-In Popup
        ↓
User authenticates with Google
        ↓
Firebase returns Firebase ID Token
        ↓
Send Firebase ID Token to Backend → POST /api/user/firebase-login
        ↓
Backend verifies token with Firebase Admin SDK
        ↓
Backend finds or creates user in database
        ↓
Backend generates JWT access token + refresh token
        ↓
Backend returns: { success: true, data: { user, token } }
        ↓
Frontend stores token in localStorage and state
        ↓
Frontend stores complete user object in localStorage
        ↓
Frontend updates AuthContext with user data
        ↓
Frontend navigates to home page
```

### 2. Data Flow in Detail

#### Firebase Sign-In Response (Client)
```javascript
// From Firebase after successful Google sign-in
{
  user: {
    uid: "firebase_uid_123",
    email: "user@example.com",
    displayName: "John Doe",
    // ... other Firebase user data
  }
}
```

#### Backend Response (After /api/user/firebase-login)
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "mongodb_user_id_456",
      "name": "John Doe",
      "email": "user@example.com",
      "role": "user",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

#### Frontend Storage
```javascript
// localStorage
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "mongodb_user_id_456",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "user",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}

// ShopContext
{
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  user: { _id, name, email, role, ... }
}

// AuthContext
{
  user: { _id, name, email, role, ... }
}
```

## Key Components

### 1. GoogleAuth Component (`frontend/src/components/GoogleAuth.jsx`)

**Responsibility:** Handle Firebase Google sign-in and communicate with backend

**Key Changes:**
- Imports `useAuth` from AuthContext
- Calls `login(userData)` after successful backend authentication
- Stores complete user object in localStorage
- Stores token in localStorage and ShopContext

```javascript
// After successful firebase-login API call
const { token, user: userData } = response.data.data;

// Store token
setToken(token);
localStorage.setItem('token', token);

// ✅ IMPORTANT: Store complete user object
localStorage.setItem('user', JSON.stringify(userData));
login(userData); // Update AuthContext
```

### 2. AuthContext (`frontend/src/context/AuthContext.jsx`)

**Responsibility:** Manage user authentication state globally

**Features:**
- Restores user from localStorage on app initialization
- Provides `login()` function to set user and store in localStorage
- Provides `logout()` function to clear user and localStorage
- Provides `useAuth()` hook for accessing auth state

**Key Methods:**
```javascript
const { user, login, logout, isAuthenticated } = useAuth();
```

### 3. ShopContext (`frontend/src/context/ShopContext.jsx`)

**Responsibility:** Manage application-wide state (products, cart, token, user)

**Features:**
- Uses `user` from AuthContext
- Manages `token` state and localStorage
- Configures axios interceptors with token header
- Handles 401 authentication errors

**Error Handling:**
- On 401 error: clears token, user, and cart; navigates to login
- Removes user from localStorage when session expires

### 4. PlaceOrder Component (`frontend/src/pages/PlaceOrder.jsx`)

**Responsibility:** Handle order placement with proper user ID

**User ID Handling:**
```javascript
// ✅ Get userId from user object (set by AuthContext)
const userId = user?._id;

if (!userId) {
  console.error('❌ User ID is missing');
  navigate('/login');
  return;
}

// Use userId in order data
const orderData = {
  userId: userId,
  address: formData,
  items: itemsArray,
  amount: total
};
```

### 5. Orders Component (`frontend/src/pages/Orders.jsx`)

**Responsibility:** Display user orders and profile

**User ID Handling:**
```javascript
// ✅ Use user._id from AuthContext instead of decoding token
const { user } = useAuth();

const loadOrderData = async () => {
  const response = await axios.post(
    backendUrl + '/api/order/userorders',
    { userId: user._id },
    { headers: { token } }
  );
};
```

## API Endpoints Used

### Authentication

- **POST /api/user/firebase-login**
  - Request: `{ idToken: "firebase_id_token" }`
  - Response: `{ success: true, data: { user, token } }`
  - Usage: Initial login with Firebase

- **POST /api/user/logout**
  - Response: `{ success: true }`
  - Usage: Backend session cleanup

- **POST /api/user/refresh-token**
  - Response: `{ success: true, data: { token } }`
  - Usage: Refresh access token using refresh token

### User Profile

- **GET /api/user/auth/profile**
  - Headers: `{ token }`
  - Response: `{ success: true, data: { user } }`
  - Usage: Fetch current user profile

- **PUT /api/user/auth/profile**
  - Headers: `{ token }`
  - Body: `{ name, email, ... }`
  - Response: `{ success: true, data: { user } }`
  - Usage: Update user profile

- **GET /api/user/info**
  - Headers: `{ token }`
  - Response: `{ success: true, user: { ... } }`
  - Usage: Fetch user info in Orders component

## Debugging Guide

### Console Logs

After proper implementation, you should see these logs:

**On Login:**
```
✅ User authenticated successfully: {
  userId: "mongodb_user_id_456",
  email: "user@example.com",
  name: "John Doe"
}
✅ User logged in: {
  id: "mongodb_user_id_456",
  email: "user@example.com",
  name: "John Doe"
}
✅ User restored from localStorage: {
  id: "mongodb_user_id_456",
  email: "user@example.com",
  name: "John Doe"
}
```

**On Order Placement:**
```
📋 Order submission: {
  userId: "mongodb_user_id_456",
  userObject: { _id, email, name, role },
  hasToken: true,
  cartItems: 3
}
```

**On Orders Load:**
```
📋 Loading orders for user: mongodb_user_id_456
```

### Common Issues and Solutions

#### Issue 1: "User ID not found" error on order placement
**Cause:** User object not properly stored in localStorage

**Solution:**
1. Check browser localStorage in DevTools
2. Ensure user object is saved: `localStorage.getItem('user')`
3. Verify AuthContext has user: `{ user, login, logout } = useAuth()`
4. Clear localStorage and re-login

#### Issue 2: User data disappears on page refresh
**Cause:** AuthContext not properly restoring from localStorage

**Solution:**
1. Verify localStorage has 'user' key
2. Check AuthContext.jsx initialization useEffect
3. Look for parsing errors in console
4. Ensure user JSON is valid

#### Issue 3: Token shows in localStorage but user doesn't
**Cause:** GoogleAuth not storing user object

**Solution:**
1. Check GoogleAuth.jsx response handling
2. Verify backend returns complete user object
3. Ensure `login(userData)` is called with user object
4. Check console logs for errors

#### Issue 4: 401 errors on API calls
**Cause:** Token header not set or token expired

**Solution:**
1. Verify token is in localStorage
2. Check axios interceptor in ShopContext.jsx
3. Verify JWT token is being sent as `token` header
4. Check backend auth middleware configuration

## Implementation Checklist

- [x] GoogleAuth imports and uses AuthContext
- [x] GoogleAuth stores user object in localStorage
- [x] GoogleAuth calls login() with user data
- [x] AuthContext restores user from localStorage on init
- [x] AuthContext provides login/logout/useAuth
- [x] ShopContext uses user from AuthContext
- [x] ShopContext clears user on 401 error
- [x] PlaceOrder uses user._id from context
- [x] Orders uses user._id from context
- [x] LogoutButton clears all user data
- [x] Axios header sends token properly

## Security Notes

1. **Token Storage:** Tokens are stored in localStorage (accessible to XSS). For production, consider using HttpOnly cookies if possible.

2. **User Object:** The user object contains non-sensitive data (_id, email, name, role). Password is never stored client-side.

3. **Token Validation:** Tokens are verified server-side. Client-side decoding is avoided.

4. **Firebase Integration:** Firebase Admin SDK verifies ID tokens server-side. No client-side validation of Firebase tokens.

5. **CORS:** Ensure backend CORS headers allow frontend origin.

## Environment Variables Required

```bash
VITE_BACKEND_URL=https://api.jjtextiles.com
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx
```

## Testing the Flow

### Step 1: Clear All Data
```javascript
localStorage.clear();
localStorage.removeItem('token');
localStorage.removeItem('user');
```

### Step 2: Login
- Navigate to `/login`
- Click "Sign in with Google"
- Authenticate with Google account
- Should redirect to `/`

### Step 3: Verify Console Logs
- Should see ✅ success logs
- Token should be in localStorage
- User object should be in localStorage

### Step 4: Place Order
- Add items to cart
- Go to `/checkout`
- Fill order form
- Submit order
- Should NOT see "User ID not found" error

### Step 5: Refresh Page
- Page should refresh without losing user session
- User object should be restored from localStorage
- AuthContext should have user data
