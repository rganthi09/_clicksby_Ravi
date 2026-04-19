#!/bin/bash

# AWS EC2 Setup Script for Clicks by Ravi
# Run this on your EC2 instance after connecting via SSH

set -e  # Exit on any error

echo "🚀 Starting Clicks by Ravi AWS Deployment Setup..."
echo ""

# Update system
echo "📦 Updating system packages..."
sudo apt update
sudo apt upgrade -y

# Install Node.js
echo "📦 Installing Node.js 22..."
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install Git
echo "📦 Installing Git..."
sudo apt install -y git

# Install Nginx
echo "📦 Installing Nginx..."
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Install PM2
echo "📦 Installing PM2..."
sudo npm install -g pm2
pm2 startup
echo "⚠️  Run the command that appears above to complete PM2 setup"

# Install Certbot
echo "📦 Installing Certbot for SSL..."
sudo apt install -y certbot python3-certbot-nginx

echo ""
echo "✅ All dependencies installed!"
echo ""
echo "Next steps:"
echo "1. Upload or clone your application code"
echo "2. Create .env file with your credentials"
echo "3. Run: npm install"
echo "4. Run: pm2 start server.js --name 'clicksby-ravi'"
echo "5. Configure Nginx with your domain"
echo "6. Set up SSL with Certbot"
echo ""
echo "For full instructions, see AWS_DEPLOYMENT_GUIDE.md"
