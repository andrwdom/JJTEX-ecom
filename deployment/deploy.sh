#!/bin/bash

# Exit on error
set -e

echo "Starting deployment process..."

# Update system
echo "Updating system..."
sudo apt update && sudo apt upgrade -y

# Install Node.js if not installed
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# Install PM2 if not installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
fi

# Install Nginx if not installed
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    sudo apt install nginx -y
fi

# Create necessary directories
echo "Creating deployment directories..."
sudo mkdir -p /var/www/jjtextiles/{frontend,admin,backend}
sudo mkdir -p /var/www/jjtextiles/backend/logs

# Deploy backend
echo "Deploying backend..."
cd backend
npm install --production

# Check if .env file exists, if not create from example
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env 2>/dev/null || echo "Please create .env file manually"
fi

# Stop existing PM2 processes
pm2 stop jjtex-backend 2>/dev/null || true
pm2 delete jjtex-backend 2>/dev/null || true

# Start backend with PM2 (simple approach)
pm2 start server.js --name jjtex-backend --env production
pm2 startup
pm2 save

# Deploy frontend
echo "Deploying frontend..."
cd ../frontend
npm install
npm run build
sudo cp -r dist/* /var/www/jjtextiles/frontend/

# Deploy admin
echo "Deploying admin panel..."
cd ../admin
npm install
npm run build
sudo cp -r dist/* /var/www/jjtextiles/admin/

# Configure Nginx
echo "Configuring Nginx..."
sudo cp ../deployment/nginx.conf /etc/nginx/sites-available/jjtextiles
sudo ln -sf /etc/nginx/sites-available/jjtextiles /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Install and configure SSL
echo "Installing SSL certificates..."
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d jjtextiles.com -d www.jjtextiles.com -d api.jjtextiles.com -d admin.jjtextiles.com --non-interactive --agree-tos --email your-email@example.com

# Configure firewall
echo "Configuring firewall..."
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw --force enable

# Set proper permissions
echo "Setting permissions..."
sudo chown -R www-data:www-data /var/www/jjtextiles
sudo chmod -R 755 /var/www/jjtextiles

# Restart services
echo "Restarting services..."
sudo systemctl restart nginx
pm2 restart all

# Show status
echo "Deployment completed successfully!"
echo "PM2 Status:"
pm2 status
echo "Nginx Status:"
sudo systemctl status nginx --no-pager 