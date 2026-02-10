#!/bin/bash
cd /home/ubuntu
aws s3 cp s3://finnova-backend-frontend-staging-build/build-1 ./build.zip
mkdir -p /home/ubuntu/finnova-backend-frontend-staging
unzip -o ./build.zip -d /home/ubuntu/finnova-backend-frontend-staging
# npm install
# npm run build
