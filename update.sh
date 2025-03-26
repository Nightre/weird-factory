#!/bin/bash
cd /var/www/weird-factory
source ~/.nvm/nvm.sh  # 确保 NVM 可用
nvm use 20
export NODE_ENV=production
echo "Current NODE_ENV: $NODE_ENV"
git reset --hard HEAD
git pull origin main
cd server
yarn
cd ../client
yarn
pm2 restart w --env production
cd ..
chmod +x /var/www/weird-factory/update.sh
pm2 start /var/www/weird-factory/server/bin/www --name wf --env production