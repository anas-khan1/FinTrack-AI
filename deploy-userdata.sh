#!/bin/bash
yum update -y
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs git nginx

# Clone the app
cd /home/ec2-user
git clone https://github.com/anas-khan1/FinTrack-AI.git
cd FinTrack-AI
npm install

# Create env file
cat > .env << 'ENVEOF'
PORT=3000
JWT_SECRET=fintrack-prod-secret-key-2026-secure
NODE_ENV=production
ENVEOF

chown -R ec2-user:ec2-user /home/ec2-user/FinTrack-AI

# Setup PM2
npm install -g pm2
sudo -u ec2-user bash -c 'cd /home/ec2-user/FinTrack-AI && pm2 start server.js --name fintrack-ai'
sudo -u ec2-user bash -c 'pm2 startup systemd -u ec2-user --hp /home/ec2-user | tail -1 | bash'
sudo -u ec2-user bash -c 'pm2 save'

# Configure Nginx
cat > /etc/nginx/conf.d/fintrack.conf << 'NGINXEOF'
server {
    listen 80;
    server_name _;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINXEOF

# Remove default nginx page
rm -f /etc/nginx/conf.d/default.conf
rm -f /usr/share/nginx/html/*

systemctl start nginx
systemctl enable nginx
