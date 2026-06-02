@echo off
title Unified Ecosystem Launcher - Vibe Ecosystem 2026
cd /d "%~dp0"

echo ==================================================================
echo   LAUNCHING ALL ECOSYSTEM SERVICES VIA POWERSHELL BYPASS GATEWAY
echo ==================================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File .\start_all.ps1

echo.
echo ==================================================================
echo   Press any key to close this launcher console window.
echo   All services will remain running persistent in the background.
echo ==================================================================
pause > nul
