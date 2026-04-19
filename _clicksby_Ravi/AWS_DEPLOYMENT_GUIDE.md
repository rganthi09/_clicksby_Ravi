# AWS Deployment Guide for Clicks by Ravi

## Overview
This guide will help you deploy your Node.js photography portfolio website to AWS EC2 using a free-tier eligible instance.

---

## Step 1: AWS Account & EC2 Setup

### 1.1 Create AWS Account
- Go to https://aws.amazon.com
- Click "Create an AWS Account"
- Sign up with your email and set up billing

### 1.2 Launch EC2 Instance
1. Go to AWS Console → EC2
2. Click "Launch Instances"
3. **Choose AMI**: Select "Ubuntu Server 22.04 LTS" (free-tier eligible)
4. **Instance Type**: Select `t3.micro` (free tier)
5. **Configure Instance**: Use default settings
6. **Storage**: 20 GB is fine (free tier includes 30 GB)
7. **Security Group**: Create new security group with these inbound rules:
   - SSH (port 22) from your IP
   - HTTP (port 80) from 0.0.0.0/0
   - HTTPS (port 443) from 0.0.0.0/0
8. **Key Pair**: Create and download a `.pem` file (save it somewhere safe!)
9. Launch the instance

### 1.3 Allocate Elastic IP
1. In EC2 Dashboard → Elastic IPs
2. Allocate new address
3. Associate it with your instance
4. Note this IP (you'll use it for domain DNS)

---

## Step 2: Connect to Your EC2 Instance

### 2.1 SSH into Instance
```bash
# From your local terminal (macOS/Linux)
chmod 600 /path/to/your-key.pem
ssh -i /path/to/your-key.pem ubuntu@YOUR_ELASTIC_IP

# Or use the public DNS name
ssh -i /path/to/your-key.pem ubuntu@ec2-XX-XX-XX-XX.region.compute.amazonaws.com
```

### 2.2 Update System
```bash
sudo apt update
sudo apt upgrade -y
```

---

## Step 3: Install Dependencies

### 3.1 Install Node.js & npm
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version
```

### 3.2 Install Git
```bash
sudo apt install -y git
```

### 3.3 Install Nginx
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 3.4 Install PM2 (globally)
```bash
sudo npm install -g pm2
pm2 startup
# Copy and run the output command that appears
```

### 3.5 Install Certbot (for SSL)
```bash
sudo apt install -y certbot python3-certbot-nginx
```

---

## Step 4: Deploy Your Application

### 4.1 Clone or Upload Your Code
Option A: Clone from GitHub (recommended)
```bash
cd ~
git clone https://github.com/YOUR_USERNAME/clicksby_ravi.git
cd clicksby_ravi
```

Option B: Use SCP to upload from your local machine
```bash
# From your local terminal
scp -i /path/to/your-key.pem -r /path/to/local/_clicksby_Ravi ubuntu@YOUR_ELASTIC_IP:~/
```

### 4.2 Install Project Dependencies
```bash
cd ~/clicksby_ravi  # or the folder name you used
npm install
```

### 4.3 Create .env File
```bash
nano .env
```

Add your environment variables:
```bash
PORT=3001
SITE_TITLE="Clicks by Ravi"

# Cloudinary Config (get from https://cloudinary.com)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# SMTP Config (use Gmail, SendGrid, etc.)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_SECURE=false
MAIL_FROM="Clicks by Ravi <noreply@example.com>"
MAIL_TO=your_email@example.com

UPLOAD_SECRET=your_secure_random_string

NODE_ENV=production
```

Press `Ctrl+O` → Enter → `Ctrl+X` to save.

---

## Step 5: Start Application with PM2

### 5.1 Start the App
```bash
cd ~/clicksby_ravi
pm2 start server.js --name "clicksby-ravi"
pm2 save
```

### 5.2 Check Status
```bash
pm2 status
pm2 logs
```

---

## Step 6: Configure Nginx as Reverse Proxy

### 6.1 Create Nginx Config
```bash
sudo nano /etc/nginx/sites-available/clicksby-ravi
```

Add this config (replace `YOUR_DOMAIN` with your actual domain):
```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN www.YOUR_DOMAIN;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve static files directly
    location /css/ {
        alias /home/ubuntu/clicksby_ravi/public/css/;
    }
    location /js/ {
        alias /home/ubuntu/clicksby_ravi/public/js/;
    }
    location /images/ {
        alias /home/ubuntu/clicksby_ravi/public/images/;
    }
    location /uploads/ {
        alias /home/ubuntu/clicksby_ravi/public/uploads/;
    }
}
```

Press `Ctrl+O` → Enter → `Ctrl+X` to save.

### 6.2 Enable the Config
```bash
sudo ln -s /etc/nginx/sites-available/clicksby-ravi /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default site
sudo nginx -t  # Test config
sudo systemctl restart nginx
```

---

## Step 7: Set Up SSL Certificate (HTTPS)

### 7.1 Obtain Certificate with Certbot
```bash
sudo certbot --nginx -d YOUR_DOMAIN -d www.YOUR_DOMAIN
```

Follow the prompts:
- Enter your email
- Agree to terms
- Certbot will automatically configure Nginx and renew certificates

### 7.2 Verify Auto-Renewal
```bash
sudo systemctl status certbot.timer
```

---

## Step 8: Configure Domain DNS

### 8.1 Point Your Domain to EC2
1. Get your **Elastic IP** from AWS Console
2. Go to your domain registrar (GoDaddy, Namecheap, etc.)
3. Update DNS records:
   - **A Record**: `@` → `YOUR_ELASTIC_IP`
   - **A Record**: `www` → `YOUR_ELASTIC_IP`
4. Wait 15-30 minutes for DNS propagation

### 8.2 Test DNS
```bash
dig YOUR_DOMAIN
# Should show your Elastic IP
```

---

## Step 9: Final Testing

### 9.1 Access Your Website
- Open `https://YOUR_DOMAIN` in a browser
- Check that images load
- Test contact form
- Verify portfolio pages work

### 9.2 Monitor Logs
```bash
# View PM2 logs
pm2 logs

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## Maintenance & Useful Commands

### Update Application
```bash
cd ~/clicksby_ravi
git pull origin main  # If using Git
npm install  # If new dependencies
pm2 restart clicksby-ravi
```

### View Running Processes
```bash
pm2 status
pm2 monit  # Real-time monitoring
```

### View Logs
```bash
pm2 logs clicksby-ravi
```

### Stop/Restart Application
```bash
pm2 stop clicksby-ravi
pm2 restart clicksby-ravi
pm2 delete clicksby-ravi
```

### Check Disk & Memory
```bash
df -h
free -h
```

### SSL Certificate Renewal
```bash
sudo certbot renew --dry-run  # Test
sudo certbot renew  # Actual renewal
```

---

## Troubleshooting

### Port Already in Use
```bash
sudo lsof -i :3001
# Kill process if needed: sudo kill -9 PID
```

### Nginx Not Starting
```bash
sudo nginx -t  # Check config syntax
sudo systemctl restart nginx
sudo journalctl -xe  # View errors
```

### Application Not Responding
```bash
pm2 logs clicksby-ravi  # Check app logs
pm2 restart clicksby-ravi
```

### SSL Certificate Issues
```bash
sudo certbot certificates
sudo certbot renew --force-renewal
```

### Cannot Connect to Instance
```bash
# Check security group allows SSH (port 22) from your IP
# Verify key file permissions: chmod 600 your-key.pem
```

---

## Cost Estimate (Free Tier)
- **EC2**: t3.micro free for 12 months (750 hours/month)
- **Elastic IP**: Free when associated with running instance
- **Data Transfer**: 1 GB/month free outbound
- **Domain**: ~$10-15/year (GoDaddy, Namecheap, etc.)
- **Cloudinary**: Free plan includes 25GB storage, 25GB bandwidth/month
- **Total First Year**: ~$10-15 (domain only)

---

## Next Steps
1. Follow Step 1-2 to set up AWS account and EC2 instance
2. SSH into your instance (Step 2)
3. Follow Steps 3-9 to deploy your application
4. If you have issues, refer to Troubleshooting section

**Questions?** Check AWS documentation or reach out for help!
