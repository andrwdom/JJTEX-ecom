#!/bin/bash

# BackendV2 Migration Setup Script
echo "🚀 Setting up BackendV2 Migration..."

# Copy environment variables from old backend
if [ -f "../backend/.env" ]; then
    echo "📋 Copying environment variables from old backend..."
    cp ../backend/.env .env
    echo "✅ Environment variables copied"
else
    echo "⚠️  Old backend .env not found, creating template..."
    cat > .env << EOF
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

# PhonePe Configuration (Production Ready)
PHONEPE_ENV=SANDBOX
PHONEPE_MERCHANT_ID=TEST-M2265MTOB2G4J_25072
PHONEPE_API_KEY=OGM0ZTk2NjctZDE5OS00YzViLTkxMzYtYTEwNDQ1YmE3NDFi
PHONEPE_SALT_INDEX=1
PHONEPE_CLIENT_ID=PGTESTPAYUAT
PHONEPE_CLIENT_SECRET=099eb0cd-02cf-4e2a-8aca-3e6c6aff0399

# Backend URL Configuration
BACKEND_URL=https://api.jjtextiles.com
FRONTEND_URL=https://jjtextiles.com
VPS_BASE_URL=https://api.jjtextiles.com

# Node Environment
NODE_ENV=production
PORT=4000

# Redis Configuration (for caching and performance)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Email Configuration (for invoice generation)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
EMAIL_USER=jjtex001@gmail.com
EMAIL_PASS=your_app_password_here
SMTP_FROM_NAME=JJTEX
SMTP_FROM_EMAIL=noreply@jjtextiles.com
SUPPORT_EMAIL=jjtex001@gmail.com

# Image Optimization
IMAGE_QUALITY=80
IMAGE_MAX_WIDTH=800
IMAGE_MAX_HEIGHT=800
IMAGE_VARIANTS=original,webp
SKIP_IMAGE_OPTIMIZATION=false
IMAGE_COMPRESSION_LEVEL=6

# Hero Images Configuration
MAX_DESKTOP=6
MAX_MOBILE=4
MOBILE_THUMB_SIZE=480
DESKTOP_THUMB_SIZE=800
LQIP_SIZE=20
THUMBNAIL_CACHE_SIZE=100

# Reservation System
RESERVATION_ENABLED=true
RESERVATION_EXPIRY_MINUTES=15
RESERVATION_AUTO_EXPIRY=true

# Cache TTL Settings (in seconds)
REDIS_PRODUCTS_TTL=300
REDIS_CATEGORIES_TTL=3600
REDIS_CART_TTL=3600
REDIS_USER_TTL=86400
REDIS_SESSIONS_TTL=86400
REDIS_STATIC_TTL=7200

# File Upload Configuration
MAX_FILE_SIZE=104857600
UPLOAD_PATH=./uploads

# CORS Configuration
CORS_ORIGIN=https://jjtextiles.com

# Monitoring and Error Tracking (optional)
SENTRY_DSN=
FIREBASE_PROJECT_ID=jjtex-production
GOOGLE_APPLICATION_CREDENTIALS=

# API Version
API_VERSION=2.0.0
BUILD_TIME=2024-01-01T00:00:00.000Z
EOF
    echo "✅ Environment template created"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p uploads

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p logs

echo "✅ BackendV2 setup complete!"
echo ""
echo "🔧 Next steps:"
echo "1. Update .env file with your specific configuration"
echo "2. Start Redis server: redis-server"
echo "3. Start the backend: npm run server"
echo "4. Test the API endpoints"
echo ""
echo "📚 See MIGRATION_PLAN.md for detailed migration steps"
