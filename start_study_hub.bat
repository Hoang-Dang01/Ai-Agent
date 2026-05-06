@echo off
title AI Study Hub - Trinh khoi dong he thong

echo ===================================================
echo        HE THONG AI STUDY HUB (MICROSERVICES)
echo ===================================================
echo.
echo [*] BUOC 1: KIEM TRA DATABASE (MYSQL)
echo HE THONG SE BI LOI NEU BAN CHUA BAT XAMPP MYSQL!
echo Vui long dam bao ban da bam "Start" MySQL trong XAMPP Control Panel.
echo.
pause

echo.
echo [*] BUOC 2: KHOI DONG TAT CA SERVER...
echo (Cac server se chay truc tiep trong cua so nay)
echo.

:: Chay AI Core (Python) an danh trong cung 1 cua so
start /B "AI Core (Python)" cmd /c "cd /d %~dp0src\ai && (if exist venv\Scripts\activate.bat call venv\Scripts\activate.bat) && uvicorn main:app --host 0.0.0.0 --port 8000"

:: Chay Node.js API Server an danh trong cung 1 cua so
start /B "NodeJS API Server" cmd /c "cd /d %~dp0src\api && node server.js"

echo.
echo [*] BUOC 3: MO TRINH DUYET...
echo Dang cho cac server khoi dong 3 giay...
timeout /t 3 /nobreak > nul
start http://localhost:3000

echo.
echo ===================================================
echo [HOAN TAT] HE THONG DA DUOC CHAY!
echo ===================================================
echo.
echo Log cua ca 2 server se hien thi ngay tai day.
echo De tat toan bo he thong, ban chi can TAT CUA SO NAY.
echo ---------------------------------------------------
echo.
