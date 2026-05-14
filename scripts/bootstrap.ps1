Write-Host "🚀 Bootstrapping Ai-Agent Monorepo (Windows Native)..." -ForegroundColor Cyan

function Process-Directory {
    param (
        [string]$Dir
    )
    
    if (Test-Path $Dir -PathType Container) {
        Write-Host "====================================="
        Write-Host "📦 Setting up: $Dir" -ForegroundColor Yellow
        Push-Location $Dir

        # 1. Setup Environment Variables
        if ((Test-Path ".env.example") -and (-not (Test-Path ".env"))) {
            Write-Host "🔧 Creating .env from .env.example" -ForegroundColor Green
            Copy-Item ".env.example" ".env"
        }

        # 2. Install Node Dependencies
        if (Test-Path "package.json") {
            Write-Host "📦 Found package.json. Installing node modules..." -ForegroundColor Green
            npm install
        }

        # 3. Install Python Dependencies
        $hasPythonDeps = (Test-Path "requirements.txt") -or (Test-Path "pyproject.toml")
        if ($hasPythonDeps) {
            if (Get-Command uv -ErrorAction SilentlyContinue) {
                Write-Host "⚡ Found python deps. Installing via uv..." -ForegroundColor Green
                if (Test-Path "pyproject.toml") {
                    uv sync
                } else {
                    uv venv
                    uv pip install -r requirements.txt
                }
            } else {
                Write-Host "🐍 Found python deps. uv not found, falling back to pip..." -ForegroundColor Yellow
                if (Test-Path "requirements.txt") {
                    pip install -r requirements.txt
                }
            }
        }

        Pop-Location
    }
}

# Scan directories
if (Test-Path "apps") {
    $appDirs = Get-ChildItem -Path "apps" -Directory
    foreach ($app in $appDirs) {
        Process-Directory $app.FullName
    }
}

if (Test-Path "bots") {
    $botDirs = Get-ChildItem -Path "bots" -Directory
    foreach ($bot in $botDirs) {
        Process-Directory $bot.FullName
    }
}

Write-Host "====================================="
Write-Host "✅ Bootstrap complete! Ready for development." -ForegroundColor Cyan
