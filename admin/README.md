# JJ Textiles Admin Panel

A React-based admin panel for managing JJ Textiles e-commerce platform.

## Features

- **Dashboard**: View order statistics and recent orders
- **Product Management**: Add, edit, and remove products
- **Order Management**: View and update order statuses
- **Coupon Management**: Create and manage discount coupons
- **Carousel Management**: Manage homepage banner carousel
- **Secure Authentication**: Admin-only access with JWT tokens

## Prerequisites

- Node.js v18 or higher
- Backend server running on port 4000
- MongoDB database connection

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the admin directory:

```bash
# Admin Panel Environment Variables
VITE_API_URL=http://localhost:4000
VITE_CLOUDINARY_CLOUD_NAME=dstu94bqc
VITE_CLOUDINARY_UPLOAD_PRESET=ml_default

# Development Settings
VITE_DEV_MODE=true
```

Or use the setup script:

```bash
chmod +x setup-env.sh
./setup-env.sh
```

### 3. Start Development Server

```bash
npm run dev
```

The admin panel will be available at `http://localhost:5174`

## Admin Login

Use the credentials configured in the backend:

- **Email**: jjtex001@gmail.com
- **Password**: jeno@1234J

## API Endpoints

The admin panel communicates with the following backend endpoints:

- `POST /api/user/admin` - Admin login
- `GET /api/user/info` - Get user info (token validation)
- `POST /api/product/add` - Add new product
- `POST /api/product/remove` - Remove product
- `POST /api/product/update` - Update product
- `GET /api/product/list` - List all products
- `GET /api/order/stats` - Get order statistics
- `POST /api/order/list` - List all orders
- `POST /api/order/status` - Update order status
- `POST /api/coupons/add` - Add coupon
- `POST /api/coupons/list` - List coupons
- `POST /api/carousel/add` - Add carousel banner
- `POST /api/carousel/list` - List carousel banners

## Troubleshooting

### Common Issues

1. **Backend Connection Error**
   - Ensure the backend server is running on port 4000
   - Check the `VITE_API_URL` in your `.env` file

2. **Login Failed**
   - Verify admin credentials in backend environment
   - Check browser console for detailed error messages

3. **Token Validation Issues**
   - Clear browser localStorage and try logging in again
   - Check if JWT_SECRET is properly configured in backend

4. **Image Upload Issues**
   - Verify Cloudinary credentials in backend
   - Check file size and format requirements

### Debug Mode

In development mode, the login page shows debug information including:
- Backend URL being used
- Current environment mode

## Production Deployment

For production deployment:

1. Update `VITE_API_URL` to production backend URL
2. Build the application: `npm run build`
3. Deploy the `dist` folder to your web server

## Security Notes

- Admin credentials are stored in backend environment variables
- All API requests require valid admin JWT tokens
- Token validation happens on every protected route
- Session timeout after 7 days (configurable in backend)
