# Admin Panel Troubleshooting Guide

This guide will help you fix the "session expired" and non-functional admin panel issues.

## Quick Fix Steps

### 1. Start Backend Server First
```bash
cd backend
npm start
```
Wait for the message: "Server running on port 4000"

### 2. Create Admin Environment File
```bash
cd admin
# Create .env file with these contents:
echo "VITE_API_URL=http://localhost:4000" > .env
echo "VITE_CLOUDINARY_CLOUD_NAME=dstu94bqc" >> .env
echo "VITE_CLOUDINARY_UPLOAD_PRESET=ml_default" >> .env
echo "VITE_DEV_MODE=true" >> .env
```

### 3. Start Admin Panel
```bash
cd admin
npm run dev
```

### 4. Test Admin Login
- Go to `http://localhost:5174`
- Login with:
  - Email: `jjtex001@gmail.com`
  - Password: `jeno@1234J`

## Common Issues & Solutions

### Issue 1: "Session Expired" After Login

**Problem**: Admin logs in successfully but immediately shows "session expired"

**Solution**: 
1. Check if backend is running on port 4000
2. Verify admin credentials in `backend/.env`:
   ```
   ADMIN_EMAIL=jjtex001@gmail.com
   ADMIN_PASSWORD=jeno@1234J
   ```
3. Clear browser localStorage and try again

### Issue 2: Admin Panels Not Functional

**Problem**: Login works but dashboard/panels show errors

**Solution**:
1. Check browser console for specific error messages
2. Verify all API endpoints are accessible
3. Run the test script: `node admin/test-admin.js`

### Issue 3: Backend Connection Failed

**Problem**: Admin can't connect to backend

**Solution**:
1. Ensure backend is running: `cd backend && npm start`
2. Check if port 4000 is available
3. Verify MongoDB connection in backend

### Issue 4: Token Validation Issues

**Problem**: Tokens are not being validated properly

**Solution**:
1. Check JWT_SECRET in backend/.env
2. Verify token format in browser localStorage
3. Clear localStorage and login again

## Debug Steps

### Step 1: Test Backend API
```bash
curl http://localhost:4000
# Should return: "API Working"
```

### Step 2: Test Admin Login API
```bash
curl -X POST http://localhost:4000/api/user/admin \
  -H "Content-Type: application/json" \
  -d '{"email":"jjtex001@gmail.com","password":"jeno@1234J"}'
```

### Step 3: Run Admin Test Script
```bash
cd admin
node test-admin.js
```

### Step 4: Check Browser Console
1. Open browser developer tools (F12)
2. Go to Console tab
3. Look for error messages
4. Check Network tab for failed requests

## Environment Configuration

### Backend (.env)
```bash
# JWT Configuration
JWT_SECRET=2df93e!@fsdfsd3fdf#fsdf@!4fsd

# Admin Credentials
ADMIN_EMAIL=jjtex001@gmail.com
ADMIN_PASSWORD=jeno@1234J

# MongoDB Configuration
MONGODB_URI=mongodb+srv://andrwdom:ypyq2jvcl@cluster0.lczmp.mongodb.net/e-commerce?retryWrites=true&w=majority&wtimeoutMS=5000

# Server Port
PORT=4000
```

### Admin (.env)
```bash
VITE_API_URL=http://localhost:4000
VITE_CLOUDINARY_CLOUD_NAME=dstu94bqc
VITE_CLOUDINARY_UPLOAD_PRESET=ml_default
VITE_DEV_MODE=true
```

## API Endpoints to Test

### Authentication
- `POST /api/user/admin` - Admin login
- `GET /api/user/info` - Get user info
- `GET /api/user/admin-test` - Test admin auth

### Dashboard
- `GET /api/order/stats` - Get order statistics

### Products
- `GET /api/product/list` - List all products
- `POST /api/product/add` - Add product
- `POST /api/product/remove` - Remove product

### Orders
- `POST /api/order/list` - List all orders
- `POST /api/order/status` - Update order status

## Browser Debugging

### Check localStorage
```javascript
// In browser console
localStorage.getItem('token')
```

### Test API Calls
```javascript
// In browser console
fetch('http://localhost:4000/api/user/info', {
  headers: {
    'token': localStorage.getItem('token')
  }
}).then(r => r.json()).then(console.log)
```

## Complete Reset Process

If nothing works, try this complete reset:

1. **Stop all servers**
2. **Clear browser data** (localStorage, cookies)
3. **Restart backend**:
   ```bash
   cd backend
   npm start
   ```
4. **Restart admin panel**:
   ```bash
   cd admin
   npm run dev
   ```
5. **Test login** with fresh browser session

## Expected Behavior

After successful setup:

1. **Login Page**: Shows admin login form with debug info
2. **Dashboard**: Shows order statistics and recent orders
3. **Navigation**: All sidebar links work
4. **API Calls**: All endpoints return data without errors
5. **Token**: Stays valid throughout the session

## Support

If issues persist:
1. Check the browser console for specific error messages
2. Run the test script: `node admin/test-admin.js`
3. Verify all environment variables are set correctly
4. Ensure MongoDB is connected and accessible 