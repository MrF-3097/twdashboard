# SSH Deployment Guide

## Quick Pull and Deploy Commands

### 1. SSH into your server
```bash
ssh your-user@your-server-ip
# or
ssh your-user@your-domain.com
```

### 2. Navigate to your project directory
```bash
cd /path/to/agent-dashboard-minimal
# Example: cd ~/agent-dashboard-minimal or cd /var/www/agent-dashboard
```

### 3. Pull latest changes
```bash
git pull origin main
```

### 4. Install new dependencies (if any)
```bash
npm install
```

### 5. Build the application
```bash
npm run build
```

### 6. Restart your application

**If using PM2:**
```bash
pm2 restart agent-dashboard
# or
pm2 restart all
```

**If using systemd:**
```bash
sudo systemctl restart agent-dashboard
```

**If using npm start directly:**
```bash
# Stop current process (Ctrl+C or kill process)
# Then start again:
npm run start
```

### 7. Verify deployment
Check if the application is running:
```bash
# PM2
pm2 status
pm2 logs agent-dashboard

# systemd
sudo systemctl status agent-dashboard
sudo journalctl -u agent-dashboard -f
```

## Complete Deployment Script

Create a `deploy.sh` script on your server for easy deployments:

```bash
#!/bin/bash
cd /path/to/agent-dashboard-minimal
git pull origin main
npm install
npm run build
pm2 restart agent-dashboard
echo "Deployment complete!"
```

Make it executable:
```bash
chmod +x deploy.sh
```

Then run:
```bash
./deploy.sh
```

## Troubleshooting

### If you get merge conflicts:
```bash
git stash
git pull origin main
git stash pop
# Resolve conflicts, then:
npm install
npm run build
pm2 restart agent-dashboard
```

### If database file is missing:
The database should be included in the repository now. If it's not there:
```bash
# Check if file exists
ls -la data/database.sqlite

# If missing, pull again or check git status
git status
```

### If environment variables are missing:
```bash
# Create .env file if it doesn't exist
nano .env
# Add all required environment variables
# Then restart the application
```

### If you get permission errors:
```bash
# Ensure data directory is writable
chmod 755 data/
chmod 644 data/database.sqlite
```






















































