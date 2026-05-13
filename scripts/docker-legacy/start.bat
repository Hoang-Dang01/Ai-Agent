@echo off
chcp 65001 > nul
title Start AI System
echo ===================================================
echo Khởi động Hệ thống AI Agent (V12.0)
echo ===================================================
cd /d "%~dp0.."

echo Đang kiểm tra PM2...
call pm2 -v >nul 2>&1
if %errorlevel% neq 0 (
    echo PM2 chưa được cài đặt. Hệ thống sẽ chạy trực tiếp qua NPM.
    echo Vui lòng KHÔNG TẮT cửa sổ này!
    echo.
    npm start
) else (
    echo PM2 đã cài đặt. Hệ thống sẽ chạy nền.
    call pm2 start npm --name "ai-agent" -- start
    call pm2 save
    call pm2 logs ai-agent
)
pause
