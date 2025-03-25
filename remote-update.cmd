@echo off
set SERVER_IP=43.133.1.198
set SERVER_USER=ubuntu
set SCRIPT_PATH=/var/www/weird-factory/update.sh

echo 连接到 %SERVER_USER%@%SERVER_IP%...
ssh %SERVER_USER%@%SERVER_IP% "sudo bash %SCRIPT_PATH%"

if %errorlevel% equ 0 (
  echo update.sh 更新成功
) else (
  echo update.sh 更新失败
)

pause