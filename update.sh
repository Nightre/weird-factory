#!/bin/bash
# git reset --hard HEAD
git pull origin main
cd server
yarn
cd ../client
yarn
pm2 restart wf
# pm2 start /var/www/weird-factory/server/bin/www --name wf