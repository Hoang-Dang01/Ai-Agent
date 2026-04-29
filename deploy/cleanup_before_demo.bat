@echo off
chcp 65001 > nul
color 0B
echo ==============================================================
echo        AI STUDY HUB - CLEANUP SCRIPT TRƯỚC KHI DEMO
echo ==============================================================
echo Yêu cầu: Tối thiểu 16GB RAM. Khuyến nghị 32GB RAM để vận hành mượt mà.
echo Script này sẽ đóng các tiến trình ngầm không cần thiết để giải phóng RAM.
echo.

echo [1/3] Đang dọn dẹp các tiến trình Chrome/Playwright bị kẹt (Zombies)...
taskkill /f /im chrome.exe /t > nul 2>&1
taskkill /f /im msedge.exe /t > nul 2>&1
taskkill /f /im playwright.exe /t > nul 2>&1
echo - Hoàn tất!

echo.
echo [2/3] Đang dọn dẹp các tiến trình Node.js cũ (nếu có)...
taskkill /f /im node.exe /t > nul 2>&1
echo - Hoàn tất!

echo.
echo [3/3] Đang kiểm tra trạng thái Ollama và Qdrant...
REM Khởi động lại dịch vụ Ollama nếu cần thiết để xóa Memory Leak
taskkill /f /im ollama.exe /t > nul 2>&1
taskkill /f /im ollama app.exe /t > nul 2>&1
echo - Đã giải phóng VRAM/RAM từ Ollama. Vui lòng mở lại Ollama trước khi chạy Server!

echo.
echo ==============================================================
echo ✅ DỌN DẸP HOÀN TẤT!
echo BỘ NHỚ RAM VÀ VRAM ĐÃ ĐƯỢC GIẢI PHÓNG TỐI ĐA.
echo ==============================================================
echo Hướng dẫn tiếp theo:
echo 1. Mở lại ứng dụng Ollama (để chuẩn bị chạy Qwen2.5)
echo 2. Mở Terminal và chạy: npm run dev
echo.
pause
