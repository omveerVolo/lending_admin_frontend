#!/bin/bash
set -e

echo "Installing required tools..."
apt-get install -y unzip awscli

cd /home/ubuntu

echo "Downloading build from S3..."
/usr/bin/aws s3 cp s3://finnova-backend-frontend-staging-build/build-1 ./build.zip

echo "Extracting build..."
mkdir -p /home/ubuntu/finnova-backend-frontend-staging
/usr/bin/unzip -o build.zip -d /home/ubuntu/finnova-backend-frontend-staging

rm -f build.zip
