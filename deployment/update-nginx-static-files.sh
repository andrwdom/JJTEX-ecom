#!/bin/bash

# Script to add static file serving for uploads to Nginx configuration
# This will allow Nginx to serve uploaded images directly

echo "🔧 Adding static file serving configuration to Nginx..."

# Backup the current configuration
sudo cp /etc/nginx/sites-available/jjtextiles.com.conf /etc/nginx/sites-available/jjtextiles.com.conf.backup

# Add the static file serving configuration
sudo tee -a /etc/nginx/sites-available/jjtextiles.com.conf > /dev/null << 'EOF'

    # Serve uploaded images and static files
    location /uploads/ {
        alias /var/www/jjtex-ecom/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
EOF

echo "✅ Added static file serving configuration"

# Test the configuration
echo "🧪 Testing Nginx configuration..."
if sudo nginx -t; then
    echo "✅ Nginx configuration is valid"
    
    # Reload Nginx
    echo "🔄 Reloading Nginx..."
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded successfully"
else
    echo "❌ Nginx configuration has errors"
    echo "🔄 Restoring backup..."
    sudo cp /etc/nginx/sites-available/jjtextiles.com.conf.backup /etc/nginx/sites-available/jjtextiles.com.conf
    exit 1
fi

echo "🎉 Static file serving configured successfully!"
echo "📁 Images will now be served from: https://jjtextiles.com/uploads/"
