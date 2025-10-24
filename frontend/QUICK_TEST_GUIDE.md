# Quick Authentication Testing Guide

## ⚡ 5-Minute Testing Flow

### Step 1: Prepare Browser (30 seconds)
1. Open your app in browser
2. Open DevTools: Press `F12`
3. Go to Application tab → Storage → LocalStorage
4. Delete any existing 'token' and 'user' entries

### Step 2: Login (30 seconds)
1. Navigate to `/login` 
2. Click "Sign in with Google"
3. Complete Google authentication
4. You should be redirected to home page

### Step 3: Verify Console Logs (1 minute)
Go to DevTools Console tab and look for:

```
✅ User authenticated successfully: {
  userId: "60d5ec6ce1234567890abcd1",
  email: "your-email@gmail.com",
  name: "Your Name"
}
✅ User logged in: { ... }
```

**If you see these logs = GOOD! ✅**

### Step 4: Verify localStorage (1 minute)
In DevTools Application → LocalStorage:
1. Check 'token' key → should have JWT value
2. Check 'user' key → should have JSON object

**Expected user object:**
```json
{
  "_id": "60d5ec6ce1234567890abcd1",
  "name": "Your Name", 
  "email": "your-email@gmail.com",
  "role": "user",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Step 5: Test Order Flow (2 minutes)
1. Add items to cart
2. Go to checkout
3. Fill shipping details
4. Click "Place Order"
5. Should see success message

**Look in console for:**
```
📋 Order submission: {
  userId: "60d5ec6ce1234567890abcd1",
  userObject: { _id, email, name, role },
  hasToken: true,
  cartItems: 3
}
```

**If no "User ID not found" error = SUCCESS! ✅**

---

## 🔍 Detailed Verification

### After Login Success
Check these in DevTools Console:
- [ ] See ✅ "User authenticated successfully" log
- [ ] See ✅ "User logged in" log
- [ ] No ❌ errors about user data

Check in DevTools Storage:
- [ ] localStorage has 'token' key with value
- [ ] localStorage has 'user' key with JSON object
- [ ] 'user' object has '_id' property

### After Page Refresh
1. Refresh the page (`F5`)
2. Check console for:
   ```
   ✅ User restored from localStorage: {
     id: "60d5ec6ce1234567890abcd1",
     email: "your-email@gmail.com",
     name: "Your Name"
   }
   ```

**If user data is still there = PERFECT! ✅**

### Order Placement Test
1. Add items to cart
2. Go to `/checkout`
3. Fill order form
4. Look at console before submitting:
   ```
   📋 Order submission: {
     userId: "60d5ec6ce1234567890abcd1",
     ...
   }
   ```

**If userId is present and not "undefined" = GOOD! ✅**

### Logout Test
1. Click logout button
2. Check console for: `✅ User logged out`
3. Check localStorage - both 'token' and 'user' should be gone
4. Should be redirected to login page

**If all cleared and redirected = COMPLETE! ✅**

---

## ⚠️ Troubleshooting

### Problem: "User ID not found" error on checkout
**What to check:**
1. Is 'user' in localStorage? 
   ```javascript
   // In console:
   localStorage.getItem('user')
   ```
2. Is user._id in the object?
   ```javascript
   // In console:
   const user = JSON.parse(localStorage.getItem('user'));
   console.log(user._id); // Should show ID, not "undefined"
   ```

**Fix:** 
- Clear localStorage and re-login
- Check if backend returns complete user object

### Problem: User data disappears on refresh
**What to check:**
1. Is 'user' in localStorage after login?
2. Are there any console errors about JSON parsing?

**Fix:**
- Clear localStorage
- Re-login
- Check browser console for error messages

### Problem: Token shows but user doesn't
**What to check:**
1. Is the backend returning complete user object?
   ```javascript
   // In console, after login:
   // Should see response with user object
   ```

**Fix:**
- Check backend response format
- Verify backend /api/user/firebase-login includes user in response

### Problem: 401 errors on API calls
**What to check:**
1. Is token in localStorage?
2. Is token being sent in headers?
   ```javascript
   // Check Network tab in DevTools
   // Look at request headers - should have "token" header
   ```

**Fix:**
- Clear localStorage and re-login
- Check backend token validation logic

---

## 📊 Checklist Matrix

| Check | What to Look For | Location | Status |
|-------|-----------------|----------|--------|
| **Login** | ✅ logs in console | Console | [ ] |
| **Token** | JWT in localStorage | Storage → Local Storage | [ ] |
| **User Object** | JSON with _id | Storage → Local Storage | [ ] |
| **User ID** | mongodb_id format | Expand user in Storage | [ ] |
| **Refresh** | User still logged in | After F5, check Storage | [ ] |
| **Order** | No ID errors | Console when checking out | [ ] |
| **Logout** | Token/user removed | Storage → Local Storage | [ ] |

---

## 🎯 Expected Console Output

### Complete Success Flow
```
// Step 1: Page loads
ℹ️ No user data found in localStorage

// Step 2: User logs in
✅ User authenticated successfully: {
  userId: "60d5ec6ce1234567890abcd1",
  email: "user@example.com",
  name: "John Doe"
}
✅ User logged in: {
  id: "60d5ec6ce1234567890abcd1",
  email: "user@example.com",
  name: "John Doe"
}

// Step 3: User refreshes page
✅ User restored from localStorage: {
  id: "60d5ec6ce1234567890abcd1",
  email: "user@example.com",
  name: "John Doe"
}

// Step 4: User goes to checkout
📋 Order submission: {
  userId: "60d5ec6ce1234567890abcd1",
  userObject: {
    _id: "60d5ec6ce1234567890abcd1",
    name: "John Doe",
    email: "user@example.com",
    role: "user"
  },
  hasToken: true,
  cartItems: 2
}

// Step 5: User logs out
✅ User logged out
```

---

## 🚀 Quick Commands for Console

Test directly in DevTools Console:

```javascript
// Check user data
localStorage.getItem('user')

// Parse and see object
JSON.parse(localStorage.getItem('user'))

// Check user ID specifically
JSON.parse(localStorage.getItem('user'))._id

// Check token
localStorage.getItem('token')

// Clear all (if needed)
localStorage.clear()
```

---

## ✅ Pass/Fail Criteria

### ✅ PASS
- Login successful with ✅ logs
- Both 'token' and 'user' in localStorage
- User object has '_id' property
- User still logged in after page refresh
- Order placement works without ID errors
- Logout clears all data

### ❌ FAIL
- No ✅ success logs after login
- 'user' not in localStorage
- User object missing '_id'
- User data gone after refresh
- "User ID not found" error on checkout
- Data not cleared after logout
