#!/bin/bash
set -e

echo "Installing Node.js 20..."
apt-get install -y curl
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo "Installing PM2..."
npm install -g pm2 serve

cd /home/ubuntu/finnova-backend-frontend-staging

echo "Restarting frontend with PM2..."
pm2 stop frontend || true
pm2 delete frontend || true
pm2 start "npm start" --name frontend

pm2 save
