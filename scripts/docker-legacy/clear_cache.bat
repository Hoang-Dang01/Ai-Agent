@echo off
chcp 65001 > nul
title Clear System Cache
echo ===================================================
echo Dọn dẹp Bộ nhớ đệm (Cache) Hệ thống
echo ===================================================
cd /d "%~dp0.."

echo [*] Đang xóa Vector DB (Ký ức AI)...
if exist "src\ai\vector_db" rmdir /S /Q "src\ai\vector_db"
echo   - Xóa Vector DB xong.

echo [*] Đang dọn rác Python (__pycache__)...
for /d /r src\ai %%d in (__pycache__) do @if exist "%%d" rmdir /S /Q "%%d"
echo   - Xóa rác Python xong.

echo [*] Đang dọn dẹp log cũ...
if exist "logs" rmdir /S /Q "logs"
echo   - Xóa logs xong.

echo.
echo ===================================================
echo HOÀN TẤT! Hệ thống đã sạch bong kin kít.
echo ===================================================
pause
