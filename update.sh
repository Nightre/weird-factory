#!/bin/bash
git pull origin main
cd server
yarn
cd ../client
yarn
pm2 restart wf
