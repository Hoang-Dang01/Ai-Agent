# ==================================================================
# 🚀 KỊCH BẢN KHỞI CHẠY HỢP NHẤT 1-CLICK (START ALL SERVICES LAUNCHER)
# Dự án: Vibe Ecosystem 2026
# Thư mục: c:\Git cua tui\Ai-Agent
# ==================================================================

Clear-Host
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "         OFFLINE AI AGENT ECOSYSTEM - 1-CLICK UNIFIED LAUNCHER" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "[Launcher] Đang khởi chạy toàn bộ 4 phân hệ trong hệ sinh thái hợp nhất..." -ForegroundColor Yellow

$jobs = @()

# 1. Khởi chạy Python Cognitive Core (Bộ não & RAG - Port 8000)
if (Test-Path "apps\backend-ai") {
    Write-Host "[1/4] Đang khởi động Python Cognitive Core (FastAPI)..." -ForegroundColor Green
    $jobs += Start-Job -ScriptBlock {
        Set-Location "c:\Git cua tui\Ai-Agent\apps\backend-ai"
        if (Test-Path ".venv") {
            # Sử dụng môi trường ảo venv cục bộ nếu có
            .venv\Scripts\uvicorn main:app --port 8000 --reload
        } else {
            uvicorn main:app --port 8000 --reload
        }
    } -Name "Python-Core"
    Start-Sleep -Seconds 2
}

# 2. Khởi chạy Node.js AI Orchestrator (Nhạc trưởng điều phối - Port 3000)
if (Test-Path "apps\orchestrator") {
    Write-Host "[2/4] Đang khởi động Node.js AI Orchestrator..." -ForegroundColor Green
    $jobs += Start-Job -ScriptBlock {
        Set-Location "c:\Git cua tui\Ai-Agent\apps\orchestrator"
        node server.js
    } -Name "Node-Orchestrator"
    Start-Sleep -Seconds 2
}

# 3. Khởi chạy TypeScript Frontend (Next.js Dashboard - Port 4000 hoặc Default)
if (Test-Path "apps\frontend") {
    Write-Host "[3/4] Đang khởi động Next.js Web Dashboard..." -ForegroundColor Green
    $jobs += Start-Job -ScriptBlock {
        Set-Location "c:\Git cua tui\Ai-Agent\apps\frontend"
        npm run dev
    } -Name "Web-Dashboard"
    Start-Sleep -Seconds 2
}

# 4. Khởi chạy C# Desktop Runtime Client (Bàn tay tự động hóa FlaUI)
if (Test-Path "apps\agent-runtime") {
    Write-Host "[4/4] Đang khởi động C# Desktop Operator Runtime (WPF UI/Client)..." -ForegroundColor Green
    $jobs += Start-Job -ScriptBlock {
        Set-Location "c:\Git cua tui\Ai-Agent\apps\agent-runtime\src"
        dotnet run --project OfflineAgent.UI\OfflineAgent.UI.csproj
    } -Name "CSharp-Client"
}

Write-Host "`n==================================================================" -ForegroundColor Cyan
Write-Host "✅ TẤT CẢ CÁC DỊCH VỤ ĐÃ ĐƯỢC KHỞI CHẠY THÀNH CÔNG DƯỚI NỀN!" -ForegroundColor Green
Write-Host "👉 Web UI: http://localhost:4000 (hoặc cổng cấu hình Next.js)" -ForegroundColor White
Write-Host "👉 AI Server: http://localhost:8000" -ForegroundColor White
Write-Host "👉 Orchestrator Gateway: http://localhost:3000" -ForegroundColor White
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "Gõ 'Get-Job' để kiểm tra trạng thái hoặc 'Stop-Job *' để tắt tất cả các dịch vụ." -ForegroundColor Yellow
