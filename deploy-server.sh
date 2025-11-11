#!/bin/bash
# Deployment script for server
# Run this after SSHing into the server: ssh dev@185.92.192.127

echo "🚀 Starting deployment..."

# Navigate to project directory (update this path if different)
cd ~/agent-dashboard-minimal || cd /var/www/agent-dashboard-minimal || cd /home/dev/agent-dashboard-minimal || {
    echo "❌ Project directory not found. Please update the path in this script."
    exit 1
}

echo "📂 Current directory: $(pwd)"

# Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

# Install dependencies if package.json changed
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Restart the application (choose the method you're using)
echo "🔄 Restarting application..."

# Option 1: PM2
if command -v pm2 &> /dev/null; then
    echo "Using PM2..."
    pm2 restart agent-dashboard || pm2 restart all
    pm2 status
fi

# Option 2: systemd
if systemctl is-active --quiet agent-dashboard; then
    echo "Using systemd..."
    sudo systemctl restart agent-dashboard
    sudo systemctl status agent-dashboard
fi

# Option 3: Direct npm start (if neither PM2 nor systemd)
if ! command -v pm2 &> /dev/null && ! systemctl is-active --quiet agent-dashboard; then
    echo "⚠️  No PM2 or systemd found. Please restart manually with: npm run start"
fi

echo "✅ Deployment complete!"
echo "📊 Check logs with: pm2 logs agent-dashboard (if using PM2)"

