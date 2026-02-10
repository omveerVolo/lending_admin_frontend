#!/bin/bash
set -e

echo "Cleaning old deployment..."
rm -rf /home/ubuntu/finnova-backend-frontend-staging/* || true

echo "Updating apt..."
apt-get update -y
