dof # JJTEX FullStack Setup Guide

This guide will help you set up and run the complete JJTEX FullStack application including the frontend, backend, and admin panel.

## Prerequisites

- Node.js v18 or higher
- MongoDB (local or cloud)
- Git

## Project Structure

```
JJTEX FullStack/
├── frontend/          # Customer-facing React app
├── admin/            # Admin panel React app
├── backend/          # Node.js/Express API server
├── deployment/       # Deployment scripts
└── README.md         # Main project documentation
```

## Step 1: Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd "JJTEX FullStack"

# Install dependencies for all applications
cd backend && npm install
cd ../frontend && npm install
cd ../admin && npm install
```

## Step 2: Backend Setup

### 1. Environment Configuration

Create a `.env` file in the `backend/` directory:

```bash
# JWT Configuration
JWT_SECRET=2df93e!@fsdfsd3fdf#fsdf@!4fsd

# Admin Credentials
ADMIN_EMAIL=jjtex001@gmail.com
ADMIN_PASSWORD=jeno@1234J

# MongoDB Configuration
MONGODB_URI=mongodb+srv://andrwdom:ypyq2jvcl@cluster0.lczmp.mongodb.net/e-commerce?retryWrites=true&w=majority&wtimeoutMS=5000

# Cloudinary Configuration
CLOUDINARY_API_KEY=197737699629778
CLOUDINARY_API_SECRET=vd5cbTpdzEPkQUbUu9WUosWSrzQ
CLOUDINARY_NAME=dstu94bqc

# PhonePe Test Credentials
PHONEPE_MERCHANT_ID=TEST-M2265MTOB2G4J_25072
PHONEPE_SALT_KEY=OGM0ZTk2NjctZDE5OS00YzViLTkxMzYtYTEwNDQ1YmE3NDFi
PHONEPE_CLIENT_ID=PGTESTPAYUAT
PHONEPE_CLIENT_SECRET=099eb0cd-02cf-4e2a-8aca-3e6c6aff0399
PHONEPE_USERNAME=default_username
PHONEPE_PASSWORD=default_password

# Backend URL
BACKEND_URL=https://api.jjtextiles.com

# Node Environment
NODE_ENV=production

# Server Port
PORT=4000
```

### 2. Start Backend Server

```bash
cd backend
npm start
```

The backend will be available at `http://localhost:4000`

## Step 3: Frontend Setup

### 1. Environment Configuration

Create a `.env` file in the `frontend/` directory:

```bash
VITE_BACKEND_URL=http://localhost:4000
VITE_CLOUDINARY_CLOUD_NAME=dstu94bqc
VITE_CLOUDINARY_UPLOAD_PRESET=ml_default
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
```

### 2. Start Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Step 4: Admin Panel Setup

### 1. Environment Configuration

Create a `.env` file in the `admin/` directory:

```bash
VITE_API_URL=http://localhost:4000
VITE_CLOUDINARY_CLOUD_NAME=dstu94bqc
VITE_CLOUDINARY_UPLOAD_PRESET=ml_default
VITE_DEV_MODE=true
```

Or use the provided setup script:

```bash
cd admin
chmod +x setup-env.sh
./setup-env.sh
```

### 2. Start Admin Panel

```bash
cd admin
npm run dev
```

The admin panel will be available at `http://localhost:5174`

## Step 5: Verify Setup

### Test Backend Connection

```bash
curl http://localhost:4000
# Should return: "API Working"
```

### Test Admin Login

1. Open `http://localhost:5174` in your browser
2. Login with:
   - Email: `jjtex001@gmail.com`
   - Password: `jeno@1234J`

### Test Frontend

1. Open `http://localhost:5173` in your browser
2. Verify the homepage loads correctly

## Troubleshooting

### Common Issues

1. **Backend Connection Failed**
   - Check if MongoDB is running
   - Verify environment variables in backend/.env
   - Check if port 4000 is available

2. **Admin Login Failed**
   - Verify admin credentials in backend/.env
   - Check browser console for errors
   - Ensure backend is running on port 4000

3. **Frontend/Admin Not Loading**
   - Check if Node.js version is 18+
   - Clear node_modules and reinstall: `npm install`
   - Check for port conflicts

4. **Image Upload Issues**
   - Verify Cloudinary credentials
   - Check file size limits
   - Ensure proper file formats

### Debug Mode

The admin panel shows debug information in development mode:
- Backend URL being used
- Environment mode
- Connection status

## Production Deployment

### Backend Deployment

```bash
cd backend
npm install --production
pm2 start ecosystem.config.js
```

### Frontend Deployment

```bash
cd frontend
npm run build
# Deploy dist/ folder to web server
```

### Admin Panel Deployment

```bash
cd admin
npm run build
# Deploy dist/ folder to web server
```

## API Endpoints

### Authentication
- `POST /api/user/login` - User login
- `POST /api/user/register` - User registration
- `POST /api/user/admin` - Admin login
- `GET /api/user/info` - Get user info

### Products
- `GET /api/product/list` - List all products
- `POST /api/product/add` - Add product (admin)
- `POST /api/product/remove` - Remove product (admin)
- `POST /api/product/update` - Update product (admin)

### Orders
- `POST /api/order/place` - Place order
- `GET /api/order/stats` - Get order statistics (admin)
- `POST /api/order/list` - List all orders (admin)
- `POST /api/order/status` - Update order status (admin)

### Cart
- `POST /api/cart/add` - Add to cart
- `POST /api/cart/remove` - Remove from cart
- `POST /api/cart/list` - List cart items

## Security Notes

- All admin endpoints require valid JWT tokens
- Admin credentials are stored in environment variables
- CORS is configured for specific domains
- Rate limiting is implemented
- Input validation is enforced

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review browser console for errors
3. Check backend logs for server errors
4. Verify environment configuration 