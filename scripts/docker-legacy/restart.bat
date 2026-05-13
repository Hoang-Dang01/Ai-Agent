@echo off
chcp 65001 > nul
title Restart AI System
echo ===================================================
echo Khởi động lại Hệ thống AI Agent
echo ===================================================

call pm2 -v >nul 2>&1
if %errorlevel% neq 0 (
    echo PM2 chưa được cài. Sẽ tiến hành khởi động lại thủ công...
    echo.
    call "%~dp0stop.bat"
    call "%~dp0start.bat"
) else (
    echo Đang khởi động lại thông qua PM2...
    call pm2 restart all
    echo.
    echo Hệ thống đã được khởi động lại thành công!
    call pm2 logs ai-agent
)
pause
