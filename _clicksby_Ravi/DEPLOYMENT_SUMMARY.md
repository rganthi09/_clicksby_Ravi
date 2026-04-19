# Clicks by Ravi - AWS Deployment Summary

## 📋 Files Provided

I've created everything you need to deploy to AWS:

1. **AWS_DEPLOYMENT_GUIDE.md** - Complete step-by-step deployment guide
2. **setup-aws.sh** - Automated setup script for EC2 instance
3. **nginx-config-template.conf** - Nginx reverse proxy configuration

## 🚀 Quick Start (10 minutes)

### Step 1: Create AWS Account & EC2 Instance (5 min)
- Go to https://aws.amazon.com and create account
- Launch EC2 instance:
  - AMI: Ubuntu 22.04 LTS (free tier)
  - Type: t3.micro (free tier)
  - Security: Allow SSH (22), HTTP (80), HTTPS (443)
  - Download `.pem` key file
- Allocate Elastic IP
- Note your IP address

### Step 2: Connect & Run Setup (2 min)
```bash
# From your Mac terminal
chmod 600 /path/to/your-key.pem
ssh -i /path/to/your-key.pem ubuntu@YOUR_ELASTIC_IP

# On EC2 instance, run setup script
curl -O https://raw.githubusercontent.com/YOUR_REPO/setup-aws.sh
chmod +x setup-aws.sh
./setup-aws.sh
```

### Step 3: Deploy Your Code (2 min)
```bash
# Option A: Clone from GitHub
git clone https://github.com/YOUR_USERNAME/clicksby_ravi.git

# Option B: Upload from your Mac
scp -i /path/to/key.pem -r ~/clicksby_ravi ubuntu@YOUR_ELASTIC_IP:~/

# Install and start
cd ~/clicksby_ravi
npm install
pm2 start server.js --name "clicksby-ravi"
```

### Step 4: Configure Domain & SSL (1 min)
```bash
# Update Nginx config
sudo nano /etc/nginx/sites-available/clicksby-ravi
# Replace YOUR_DOMAIN with your actual domain, save

# Enable site
sudo ln -s /etc/nginx/sites-available/clicksby-ravi /etc/nginx/sites-enabled/
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d YOUR_DOMAIN -d www.YOUR_DOMAIN
```

### Step 5: Point Domain to AWS
- Go to your domain registrar (GoDaddy, Namecheap, etc.)
- Update DNS A records to point to your Elastic IP
- Wait 15-30 minutes for DNS propagation

Done! Access https://YOUR_DOMAIN 🎉

## 💰 Cost (Free Tier)
- **EC2 t3.micro**: Free for 12 months
- **Data**: 1GB/month outbound free
- **Domain**: ~$10-15/year
- **Cloudinary**: Free plan (25GB storage, 25GB bandwidth/month)
- **Total Year 1**: ~$10-15

## 📝 Required Credentials (for .env file)

Before deploying, gather these:

### 1. Cloudinary (Image storage)
- Sign up: https://cloudinary.com
- Get: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

### 2. SMTP Email (Contact form)
- Use Gmail:
  - Enable 2FA
  - Generate App Password
  - Use app password in .env
- Or use SendGrid, Mailgun, etc.

### 3. Domain
- Purchase from: GoDaddy, Namecheap, Bluehost, etc.
- Cost: ~$10-15/year

## 🔧 Useful Commands on EC2

```bash
# View app status
pm2 status

# View logs
pm2 logs clicksby-ravi

# Restart app
pm2 restart clicksby-ravi

# Monitor in real-time
pm2 monit

# View Nginx errors
sudo tail -f /var/log/nginx/error.log

# Renew SSL certificate
sudo certbot renew

# Reboot instance
sudo reboot
```

## 🐛 Troubleshooting

### App won't start?
```bash
pm2 logs clicksby-ravi  # Check error messages
pm2 restart clicksby-ravi
```

### Domain not working?
```bash
nslookup YOUR_DOMAIN  # Check DNS
# Wait 30 minutes if just updated DNS
```

### SSL certificate issues?
```bash
sudo certbot certificates  # List certificates
sudo certbot renew --force-renewal
```

### Can't connect to EC2?
- Check security group allows SSH from your IP
- Verify key file permissions: `chmod 600 key.pem`

## 📚 Full Documentation

For detailed instructions, see **AWS_DEPLOYMENT_GUIDE.md** in this folder.

## ❓ Questions?

- AWS Documentation: https://docs.aws.amazon.com/
- PM2 Guide: https://pm2.keymetrics.io/
- Certbot Guide: https://certbot.eff.org/
- Nginx Guide: https://nginx.org/en/docs/

---

**You're ready to deploy!** Follow the Quick Start above and your site will be live in minutes. 🚀
