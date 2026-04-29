@echo off
chcp 65001 > nul
echo ===================================================
echo Khởi động toàn bộ Hệ thống AI Bot - AI Study Hub
echo ===================================================

echo [1] Đang khởi động Backend chính tích hợp Tool Mine (Port 3000)...
start /b "Backend" cmd /c "cd /d "%~dp0..\src\api" && npm start"

echo ===================================================
echo [OK] Đã bật xong! Vui lòng KHÔNG TẮT cửa sổ màu đen này.
echo Mọi thông báo của 2 server sẽ được gộp chung tại đây.
echo.
echo Trang chủ (Người dùng): http://localhost:3000
echo Trang quản trị (Bot):   http://localhost:3000/tool-mine
echo ===================================================
pause
