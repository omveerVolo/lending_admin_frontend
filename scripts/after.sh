#!/bin/bash
set -e

echo "Installing required tools..."
apt-get update -y
apt-get install -y unzip curl

# Install AWS CLI v2 (official way)
if ! command -v aws &> /dev/null; then
  echo "Installing AWS CLI..."
  curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
  unzip awscliv2.zip
  ./aws/install
  rm -rf aws awscliv2.zip
fi

cd /home/ubuntu

echo "Downloading build from S3..."
/usr/local/bin/aws s3 cp s3://finnova-backend-frontend-staging-build/build-1 ./build.zip

echo "Extracting build..."
mkdir -p /home/ubuntu/finnova-backend-frontend-staging
unzip -o build.zip -d /home/ubuntu/finnova-backend-frontend-staging

rm -f build.zip
