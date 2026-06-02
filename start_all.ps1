# ==================================================================
# START ALL SERVICES LAUNCHER - 1-CLICK UNIFIED LAUNCHER
# Project: Vibe Ecosystem 2026
# Path: c:\Git cua tui\Ai-Agent
# ==================================================================

Clear-Host
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "         OFFLINE AI AGENT ECOSYSTEM - 1-CLICK UNIFIED LAUNCHER" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "[Launcher] Starting all 4 subsystems in persistent background mode..." -ForegroundColor Yellow

# 1. Start Python Cognitive Core (Brain & RAG - Port 8000)
if (Test-Path "apps\backend-ai") {
    Write-Host "[1/4] Starting Python Cognitive Core (FastAPI)..." -ForegroundColor Green
    if (Test-Path "apps\backend-ai\.venv") {
        Start-Process "cmd.exe" -ArgumentList "/c .venv\Scripts\uvicorn.exe main:app --port 8000 --reload" -WorkingDirectory "apps\backend-ai" -WindowStyle Hidden
    } else {
        Start-Process "cmd.exe" -ArgumentList "/c uvicorn main:app --port 8000 --reload" -WorkingDirectory "apps\backend-ai" -WindowStyle Hidden
    }
    Start-Sleep -Seconds 2
}

# 2. Start Node.js AI Orchestrator (Orchestrator - Port 4000)
if (Test-Path "apps\orchestrator") {
    Write-Host "[2/4] Starting Node.js AI Orchestrator (dist/server.js)..." -ForegroundColor Green
    Start-Process "cmd.exe" -ArgumentList "/c node dist/server.js" -WorkingDirectory "apps\orchestrator" -WindowStyle Hidden
    Start-Sleep -Seconds 2
}

# 3. Start TypeScript Frontend (Next.js Dashboard - Port 3000)
if (Test-Path "apps\frontend") {
    Write-Host "[3/4] Starting Next.js Web Dashboard..." -ForegroundColor Green
    Start-Process "cmd.exe" -ArgumentList "/c npm run dev" -WorkingDirectory "apps\frontend" -WindowStyle Hidden
    Start-Sleep -Seconds 2
}

# 4. Start C# Desktop Runtime Client (FlaUI Automation)
if (Test-Path "apps\agent-runtime") {
    Write-Host "[4/5] Starting C# Desktop Operator Runtime (WPF UI/Client)..." -ForegroundColor Green
    Start-Process "cmd.exe" -ArgumentList "/c dotnet run --project OfflineAgent.UI\OfflineAgent.UI.csproj" -WorkingDirectory "apps\agent-runtime\src" -WindowStyle Hidden
}

# 5. Start n8n Workflow Server (Port 5678)
if (Get-Command n8n -ErrorAction SilentlyContinue) {
    Write-Host "[5/5] Starting local n8n automation engine (n8n start)..." -ForegroundColor Green
    Start-Process "cmd.exe" -ArgumentList "/c n8n start" -WindowStyle Hidden
}

Write-Host "`n==================================================================" -ForegroundColor Cyan
Write-Host "SUCCESS: ALL SERVICES HAVE BEEN LAUNCHED IN THE BACKGROUND!" -ForegroundColor Green
Write-Host "-> Web UI: http://localhost:3000" -ForegroundColor White
Write-Host "-> AI Server: http://localhost:8000" -ForegroundColor White
Write-Host "-> Orchestrator Gateway: http://localhost:4000" -ForegroundColor White
Write-Host "-> n8n Automation Engine: http://localhost:5678" -ForegroundColor White
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "You can now open the Web UI at http://localhost:3000" -ForegroundColor Yellow
