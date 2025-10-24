# Authentication Flow - Fix Summary

## Problem Statement
The frontend and backend were not properly coordinating user authentication data. After Firebase sign-up/login, the frontend was storing only the JWT token but NOT the user object. This caused "User ID not found" errors when trying to place orders or access user-specific features.

## Root Cause
1. **GoogleAuth.jsx** only stored the token but didn't store the complete user object from the backend response
2. **AuthContext** had no user data available
3. **PlaceOrder** and **Orders** components had no way to access the user's MongoDB `_id`
4. Components attempted to decode JWT tokens to extract user IDs (unreliable and hacky)

## What Was Fixed

### 1. GoogleAuth Component ✅
**File:** `frontend/src/components/GoogleAuth.jsx`

**Changes:**
- Import `useAuth` from AuthContext
- Extract both `token` and `user` from backend response
- Store token in localStorage and ShopContext (already done)
- **NEW:** Store complete user object in localStorage
- **NEW:** Call `login(userData)` to update AuthContext

**Code Example:**
```javascript
const { token, user: userData } = response.data.data;
localStorage.setItem('user', JSON.stringify(userData));
login(userData);
```

### 2. AuthContext ✅
**File:** `frontend/src/context/AuthContext.jsx`

**Changes:**
- Enhanced error handling for localStorage parsing
- Added comprehensive debug logging
- Ensures user data persists across page refreshes

**Key Functions:**
```javascript
const { user, login, logout, isAuthenticated } = useAuth();
```

### 3. ShopContext ✅
**File:** `frontend/src/context/ShopContext.jsx`

**Changes:**
- Import `logout` from AuthContext
- Clear user from localStorage on 401 error
- Call `logout()` to clear user from AuthContext on session expiry
- Added logout to dependency array

**Code Example:**
```javascript
if (error.response?.status === 401) {
    localStorage.removeItem('user');
    logout(); // Clear from AuthContext
}
```

### 4. PlaceOrder Component ✅
**File:** `frontend/src/pages/PlaceOrder.jsx`

**Changes:**
- Removed hacky JWT token decoding logic
- Get userId directly from `user._id` (from AuthContext)
- Added proper error logging
- Simplified userId extraction

**Before:**
```javascript
// BAD: Decoding JWT token
const tokenPayload = JSON.parse(atob(token.split('.')[1]));
userId = tokenPayload.id;
```

**After:**
```javascript
// GOOD: Direct access from user object
const userId = user?._id;
```

### 5. Orders Component ✅
**File:** `frontend/src/pages/Orders.jsx`

**Changes:**
- Import `useAuth` hook
- Use `user` from AuthContext instead of state
- Renamed local state `user` to `userData` to avoid confusion
- Updated useEffect dependency to include `user?._id`

**Before:**
```javascript
const userId = JSON.parse(atob(token.split('.')[1])).id;
```

**After:**
```javascript
const { user } = useAuth();
const userId = user._id;
```

### 6. LogoutButton Component ✅
**File:** `frontend/src/components/LogoutButton.jsx`

**Changes:**
- Import `useAuth` hook
- Call `logout()` from AuthContext (handles navigation)
- Clear user from localStorage
- Remove duplicate navigation

## Data Flow After Fix

```
┌─────────────────────────────────────────────────────────────┐
│                    SIGN IN FLOW                             │
└─────────────────────────────────────────────────────────────┘

User clicks "Sign in with Google"
         ↓
GoogleAuth sends Firebase ID token to backend
         ↓
Backend returns: { token, user: { _id, email, name, ... } }
         ↓
GoogleAuth stores in localStorage:
  - token → localStorage.token
  - user object → localStorage.user
         ↓
GoogleAuth calls setToken(token)
  → ShopContext stores token
         ↓
GoogleAuth calls login(userData)
  → AuthContext stores user
         ↓
All components can now access:
  - ShopContext: { token, user }
  - AuthContext: { user }
  → user._id is available everywhere!
         ↓
Redirect to home page


┌─────────────────────────────────────────────────────────────┐
│               PLACE ORDER FLOW                              │
└─────────────────────────────────────────────────────────────┘

User on checkout page
         ↓
const { user } = useAuth()
         ↓
const userId = user?._id
  → Gets MongoDB user ID directly!
         ↓
Create order with userId
         ↓
Send to backend: POST /api/order/place
         ↓
Backend creates order with correct userId
         ↓
✅ Success!


┌─────────────────────────────────────────────────────────────┐
│               PAGE REFRESH FLOW                             │
└─────────────────────────────────────────────────────────────┘

User refreshes page
         ↓
App loads
         ↓
AuthContext useEffect runs
         ↓
Reads localStorage.user
         ↓
Parses and restores user object
         ↓
User data available immediately
         ↓
✅ No login required!
```

## Files Modified

| File | Changes | Status |
|------|---------|--------|
| `GoogleAuth.jsx` | Store user object + call login() | ✅ Complete |
| `AuthContext.jsx` | Enhanced restore + logging | ✅ Complete |
| `ShopContext.jsx` | Clear user on 401 + logout() | ✅ Complete |
| `PlaceOrder.jsx` | Remove token decoding, use user._id | ✅ Complete |
| `Orders.jsx` | Use user from AuthContext | ✅ Complete |
| `LogoutButton.jsx` | Clear all user data + use logout() | ✅ Complete |

## Testing Checklist

- [ ] Clear browser localStorage
- [ ] Sign in with Google
- [ ] Check localStorage contains both 'token' and 'user'
- [ ] Add items to cart
- [ ] Place order → should NOT show "User ID not found"
- [ ] Refresh page → user should still be logged in
- [ ] Sign out → all data should be cleared
- [ ] Go to Orders page → should show your orders

## Console Logs to Verify

### After Login
```
✅ User authenticated successfully: {
  userId: "mongodb_id_here",
  email: "user@example.com",
  name: "John Doe"
}
✅ User logged in: {
  id: "mongodb_id_here",
  email: "user@example.com",
  name: "John Doe"
}
```

### After Page Refresh
```
✅ User restored from localStorage: {
  id: "mongodb_id_here",
  email: "user@example.com",
  name: "John Doe"
}
```

### When Placing Order
```
📋 Order submission: {
  userId: "mongodb_id_here",
  userObject: { _id, email, name, role },
  hasToken: true,
  cartItems: 3
}
```

## Backward Compatibility

✅ All changes are backward compatible:
- Token header format unchanged
- Backend API endpoints unchanged
- No breaking changes to existing flows
- Works with existing refresh token logic

## Security Notes

1. ✅ No client-side JWT decoding (was unreliable)
2. ✅ User object contains only non-sensitive data
3. ✅ Token validation happens server-side
4. ✅ Firebase verification happens with Admin SDK
5. ✅ Proper logout clears all sensitive data

## Next Steps

1. Test the complete flow end-to-end
2. Monitor console logs for any errors
3. Verify orders are created with correct userId
4. Test on different browsers/devices
5. Test edge cases (token expiry, network issues, etc.)

## Reference Documentation

See `AUTHENTICATION_FLOW_GUIDE.md` for detailed architecture and troubleshooting guide.
