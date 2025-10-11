# 🚀 JJTEX Launch Guide - Using BackendV2

## ✅ Changes Complete!

I've successfully adapted the production-ready BackendV2 for your JJTEX store. Here's what was done:

### Files Modified:
1. ✅ `backendV2/server.js` - JJTEX categories seeded
2. ✅ `backendV2/controllers/productController.js` - Added `image` field compatibility
3. ✅ `adminV2/src/App.jsx` - Updated backend URL config

---

## 🎯 Quick Start

### Step 1: Setup Environment Files

#### **Frontend** (`frontend/.env`):
```env
VITE_BACKEND_URL=http://localhost:4000
```

#### **BackendV2** (`backendV2/.env`):
```env
# JWT Configuration
JWT_SECRET=your_jwt_secret_here

# Admin Credentials
ADMIN_EMAIL=jjtex001@gmail.com
ADMIN_PASSWORD=jeno@1234J

# MongoDB
MONGODB_URI=your_mongodb_connection_string

# Cloudinary
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# PhonePe (Use test credentials for now)
PHONEPE_MERCHANT_ID=TEST-M2265MTOB2G4J_25072
PHONEPE_SALT_KEY=OGM0ZTk2NjctZDE5OS00YzViLTkxMzYtYTEwNDQ1YmE3NDFi

# Server
PORT=4000
NODE_ENV=development
```

#### **AdminV2** (No .env needed - uses default localhost:4000)

---

### Step 2: Install Dependencies

```bash
# Backend
cd backendV2
npm install

# Frontend
cd ../frontend
npm install

# Admin
cd ../adminV2
npm install
```

---

### Step 3: Start Services

**Terminal 1 - BackendV2:**
```bash
cd backendV2
npm start
```
✅ Should show: "Server running on port 4000"
✅ Categories will auto-seed on first run

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
✅ Should open at `http://localhost:5173`

**Terminal 3 - AdminV2:**
```bash
cd adminV2
npm run dev
```
✅ Should open at `http://localhost:5174`

---

## 🧪 Testing Checklist

### 1. Test Admin Login
- [ ] Go to `http://localhost:5174`
- [ ] Login with: `jjtex001@gmail.com` / `jeno@1234J`
- [ ] Should see dashboard

### 2. Test Product Management
- [ ] Click "Add Product" in adminV2
- [ ] Fill in product details:
  - Custom ID: `JJTEX001`
  - Name: `Test Kids T-Shirt`
  - Category: `Kids`
  - Add sizes with stock
  - Upload image
- [ ] Save product
- [ ] Verify product appears in list

### 3. Test Frontend
- [ ] Go to `http://localhost:5173`
- [ ] Should see your test product
- [ ] Click on product - should show details
- [ ] Categories filter should show: Kids, Women

### 4. Test Cart Flow
- [ ] Add product to cart (must be logged in via Firebase)
- [ ] View cart
- [ ] Update quantities
- [ ] Proceed to checkout

### 5. Test Order Placement
- [ ] Try COD order
- [ ] Try PhonePe payment (test mode)
- [ ] Check order appears in adminV2 Orders page

---

## 🔧 Troubleshooting

### Issue: "Cannot connect to MongoDB"
**Solution**: Update `MONGODB_URI` in `backendV2/.env`

### Issue: "Products not showing"
**Solution**: Check browser console. Verify:
- BackendV2 is running on port 4000
- Frontend `.env` has `VITE_BACKEND_URL=http://localhost:4000`

### Issue: "Authentication failed"
**Solution**: 
- Frontend uses Firebase auth
- Ensure you have Firebase configured in frontend

### Issue: "Categories not showing"
**Solution**: 
- Stop backendV2
- Delete categories from MongoDB
- Restart backendV2 - they will auto-seed

---

## 📊 What You Get with BackendV2

### 🎯 Production Features:
- ✅ **Atomic Stock Management** - No overselling
- ✅ **Stock Reservation** - Holds stock during checkout (15 minutes)
- ✅ **Advanced Payment** - PhonePe with webhooks
- ✅ **Order Tracking** - Complete lifecycle
- ✅ **Redis Caching** - Fast performance
- ✅ **Monitoring Dashboard** - Real-time health
- ✅ **Error Handling** - Graceful failures
- ✅ **Idempotency** - No duplicate orders
- ✅ **Admin Panel** - Professional management

### 🔐 Security:
- JWT authentication
- Rate limiting
- CORS protection
- Input validation
- Secure password hashing

### 📈 Performance:
- MongoDB indexes optimized
- Redis caching layer
- Connection pooling
- Efficient queries

---

## 🎨 Categories Available

Your JJTEX store now has these categories:

**Kids:**
- Kids (main)
- Boys Clothing
- Girls Clothing
- Baby Clothing
- Teens Clothing

**Women:**
- Women (main)
- Ethnic Wear
- Western Wear
- Jewellery

---

## 🌐 Production Deployment

### When Ready for Production:

1. **Update Environment URLs:**
   - Frontend `.env`: `VITE_BACKEND_URL=https://api.jjtextiles.com`
   - AdminV2 config: Already uses env variable

2. **Backend Deployment:**
   - Deploy backendV2 to your server
   - Use PM2 ecosystem file: `pm2 start ecosystem.config.js`
   - Ensure MongoDB is accessible
   - Setup Redis (optional but recommended)

3. **Frontend/Admin Deployment:**
   - Build: `npm run build`
   - Deploy `dist` folder to hosting

---

## 📝 Important Notes

### Product Structure:
```javascript
{
  customId: "JJTEX001",        // Your product ID
  name: "Product Name",
  price: 299,
  images: ["url1", "url2"],    // Multiple images
  image: ["url1", "url2"],     // Same as images (compatibility)
  category: "Kids",
  categorySlug: "kids",
  subCategory: "Boys Clothing",
  type: "T-Shirts",
  sizes: [
    { size: "S", stock: 10, reserved: 0 },
    { size: "M", stock: 15, reserved: 2 }  // 2 reserved during checkout
  ]
}
```

### Stock Management:
- **Stock**: Total available
- **Reserved**: Temporarily held during checkout
- **Available**: `stock - reserved`
- Reservations expire after 15 minutes

---

## 🆘 Need Help?

### Check Logs:
```bash
# Backend logs
cd backendV2
npm start  # Watch console output

# Check specific log files
cd backendV2/logs
```

### Common Commands:
```bash
# Restart all services
pm2 restart all

# Check MongoDB connection
mongo "your_mongodb_uri"

# Clear Redis cache
redis-cli FLUSHALL
```

---

## ✨ You're Ready to Launch!

Your JJTEX store now has enterprise-grade infrastructure with:
- Production-ready backend
- Advanced stock management
- Professional admin panel
- Secure payment processing
- Real-time monitoring

**Start adding products and launch! 🚀**

---

## 📞 Quick Reference

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | Firebase auth |
| AdminV2 | http://localhost:5174 | jjtex001@gmail.com |
| BackendV2 | http://localhost:4000 | - |
| MongoDB | Check .env | Your credentials |

---

**All modifications are marked with `🔧 JJTEX COMPATIBILITY` in the code for easy reference.**

Good luck with your launch! 🎉

