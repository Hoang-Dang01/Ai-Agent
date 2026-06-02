@echo off
title Turing Hub - E2E Physical Test Trigger
cd /d "%~dp0apps\orchestrator"

echo ==================================================================
echo   ENQUEUING PHYSICAL AUTOMATION DAG INTO ORCHESTRATOR DATABASE
echo ==================================================================
echo.

node trigger_test.js

echo.
echo ==================================================================
echo   E2E DAG Triggered! Close this window and look at your screen.
echo ==================================================================
pause > nul
