@echo off
chcp 65001 >nul
cd /d "E:\1\mud\2\JianLai mud"
echo ================================================
echo   剑来MUD 本地服务器
echo   请保持本窗口开启（关闭窗口=停止服务）
echo ================================================
start "" http://localhost:8399/
node server.js
pause
