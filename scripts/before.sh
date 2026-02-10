#!/bin/bash
echo "Cleaning old deployment..."
shopt -s dotglob
rm -rf /home/ubuntu/finnova-backend-frontend-staging/*
shopt -u dotglob

echo "Updating apt..."
sudo apt-get update -y

echo "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x -o nodesource_setup.sh
sudo -E bash nodesource_setup.sh
sudo apt-get install -y nodejs
