#!/bin/bash

# Admin Panel Environment Setup Script

echo "Setting up Admin Panel Environment..."

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOF
# Admin Panel Environment Variables
VITE_API_URL=http://localhost:4000
VITE_CLOUDINARY_CLOUD_NAME=dstu94bqc
VITE_CLOUDINARY_UPLOAD_PRESET=ml_default

# Development Settings
VITE_DEV_MODE=true
EOF
    echo "✅ .env file created successfully"
else
    echo "⚠️  .env file already exists"
fi

# Check if backend is running
echo "Checking backend connection..."
if curl -s http://localhost:4000 > /dev/null; then
    echo "✅ Backend is running on http://localhost:4000"
else
    echo "⚠️  Backend is not running on http://localhost:4000"
    echo "Please start the backend server first:"
    echo "cd ../backend && npm start"
fi

echo ""
echo "Admin Panel Setup Complete!"
echo "To start the admin panel:"
echo "npm run dev" 