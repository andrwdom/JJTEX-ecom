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
pm2 start ecosystem.config.js
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

# Install and configure SSL
echo "Installing SSL certificates..."
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d jjtextiles.com -d www.jjtextiles.com -d api.jjtextiles.com -d admin.jjtextiles.com

# Configure firewall
echo "Configuring firewall..."
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw --force enable

# Restart services
echo "Restarting services..."
sudo systemctl restart nginx
pm2 restart all

echo "Deployment completed successfully!" 