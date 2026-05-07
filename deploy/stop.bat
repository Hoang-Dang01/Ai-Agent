@echo off
chcp 65001 > nul
title Stop AI System
echo ===================================================
echo Tắt Hệ thống AI Agent
echo ===================================================

call pm2 -v >nul 2>&1
if %errorlevel% neq 0 (
    echo PM2 chưa cài đặt. Đang tắt toàn bộ tiến trình Node.js và Python...
    taskkill /F /IM node.exe >nul 2>&1
    taskkill /F /IM python.exe >nul 2>&1
    echo.
    echo Đã "hạ sát" thành công toàn bộ hệ thống!
) else (
    echo Đang tắt hệ thống thông qua PM2...
    call pm2 stop all
    echo.
    echo Đã đưa hệ thống vào chế độ ngủ (Stop).
)
pause
