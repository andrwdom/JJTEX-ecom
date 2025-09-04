# JJ Textiles FullStack Application

A full-stack e-commerce application for JJ Textiles.

## Project Structure

- `frontend/` - React-based customer-facing application
- `admin/` - React-based admin panel
- `backend/` - Node.js/Express API server
- `deployment/` - Deployment configuration and scripts

## Prerequisites

- Node.js v18 or higher
- MongoDB
- Nginx
- PM2
- SSL certificates (Let's Encrypt)

## Environment Variables

### Backend (.env)
```
PORT=4010
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secure_jwt_secret
NODE_ENV=production
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
```

### Frontend (.env)
```
VITE_API_URL=https://api.jjtextiles.com
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
```

### Admin (.env)
```
VITE_API_URL=https://api.jjtextiles.com
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

## Deployment

1. Clone the repository:
```bash
git clone https://github.com/andrwdom/JJtex-2nd-Revision.git
cd JJtex-2nd-Revision
```

2. Make the deployment script executable:
```bash
chmod +x deployment/deploy.sh
```

3. Run the deployment script:
```bash
./deployment/deploy.sh
```

The script will:
- Install required dependencies
- Set up Nginx configuration
- Configure SSL certificates
- Deploy all applications
- Set up PM2 for process management
- Configure firewall rules

## Manual Deployment Steps

If you prefer to deploy manually:

1. Backend:
```bash
cd backend
npm install --production
pm2 start ecosystem.config.js
```

2. Frontend:
```bash
cd frontend
npm install
npm run build
sudo cp -r dist/* /var/www/jjtextiles/frontend/
```

3. Admin:
```bash
cd admin
npm install
npm run build
sudo cp -r dist/* /var/www/jjtextiles/admin/
```

4. Configure Nginx:
```bash
sudo cp deployment/nginx.conf /etc/nginx/sites-available/jjtextiles
sudo ln -sf /etc/nginx/sites-available/jjtextiles /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

## Monitoring

- PM2 Dashboard: `pm2 monit`
- PM2 Logs: `pm2 logs`
- Nginx Logs: `/var/log/nginx/`

## Backup

Regular backups are configured for:
- MongoDB database
- Uploaded files
- Configuration files

## Security

The application implements:
- Rate limiting
- CORS protection
- Security headers
- SSL/TLS encryption
- Input validation
- XSS protection
- CSRF protection

## Support

For support, please contact the development team. 