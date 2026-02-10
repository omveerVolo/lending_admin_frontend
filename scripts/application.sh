#!/bin/bash
# pm2 start npm --name "frontend" -- start
# pm2 stop all
# pm2 delete all
# pm2 start app.js
cd /home/ubuntu/finnova-backend-frontend-staging
sudo npm install pm2 -g
pm2 stop frontend
pm2 delete frontend
pm2 start "npm start" --name frontend
