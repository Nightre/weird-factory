#!/bin/bash
cd /var/www/weird-factory
source ~/.nvm/nvm.sh  # 确保 NVM 可用
nvm use 20

git reset --hard HEAD
git pull origin main
cd server
yarn
# cd ../client
# yarn
cd ..
chmod +x /var/www/weird-factory/update.sh
pm2 start /var/www/weird-factory/server/bin/www --name wfc-app --env production
# pm2 start /var/www/weird-factory/ecosystem.config.js