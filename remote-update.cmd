@echo off
set SERVER_IP=43.133.1.198
set SERVER_USER=ubuntu
set SCRIPT_PATH=/var/www/weird-factory/update.sh

echo ���ӵ� %SERVER_USER%@%SERVER_IP%...
ssh %SERVER_USER%@%SERVER_IP% "sudo bash %SCRIPT_PATH%"

if %errorlevel% equ 0 (
  echo update.sh ���³ɹ�
) else (
  echo update.sh ����ʧ��
)

pause