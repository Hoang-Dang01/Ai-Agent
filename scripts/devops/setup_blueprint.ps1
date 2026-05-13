$dirs = @(
    ".antigravity\agents\01-strategy",
    ".antigravity\agents\02-engineering",
    ".antigravity\agents\03-security-qa",
    ".antigravity\agents\04-knowledge",
    ".antigravity\agents\05-research-rnd",
    ".antigravity\core",
    "docs\history",
    "docs\vault\lessons-learned",
    "docs\vault\tech-stack",
    "docs\vault\persona-library",
    "apps\frontend\src\components\ui",
    "apps\frontend\src\pages",
    "apps\frontend\src\hooks",
    "apps\frontend\public",
    "apps\backend-ai\app\engines",
    "apps\backend-ai\app\routers",
    "apps\backend-ai\app\schemas",
    "apps\orchestrator\src\controllers",
    "apps\orchestrator\src\db",
    "apps\orchestrator\src\tools",
    "integrations\auth",
    "integrations\payments",
    "integrations\automation",
    "experiments\minecraft-engine\src",
    "experiments\dino-cv-bot"
)

foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
    }
}

# Move existing files
if (Test-Path ".antigravity\agents\dept-strategy.mdc") { Move-Item ".antigravity\agents\dept-strategy.mdc" ".antigravity\agents\01-strategy\main.mdc" -Force }
if (Test-Path ".antigravity\agents\dept-engineering.mdc") { Move-Item ".antigravity\agents\dept-engineering.mdc" ".antigravity\agents\02-engineering\main.mdc" -Force }
if (Test-Path ".antigravity\agents\dept-security-qa.mdc") { Move-Item ".antigravity\agents\dept-security-qa.mdc" ".antigravity\agents\03-security-qa\main.mdc" -Force }
if (Test-Path ".antigravity\agents\dept-knowledge.mdc") { Move-Item ".antigravity\agents\dept-knowledge.mdc" ".antigravity\agents\04-knowledge\main.mdc" -Force }
if (Test-Path ".antigravity\agents\dept-research-persona.mdc") { Move-Item ".antigravity\agents\dept-research-persona.mdc" ".antigravity\agents\05-research-rnd\main.mdc" -Force }

$files = @(
    ".antigravity\agents\01-strategy\system-architect.mdc",
    ".antigravity\agents\01-strategy\product-manager.mdc",
    ".antigravity\agents\02-engineering\ai-engineer.mdc",
    ".antigravity\agents\02-engineering\backend-expert.mdc",
    ".antigravity\agents\02-engineering\frontend-vibe.mdc",
    ".antigravity\agents\03-security-qa\security-auditor.mdc",
    ".antigravity\agents\03-security-qa\test-engineer.mdc",
    ".antigravity\agents\04-knowledge\technical-writer.mdc",
    ".antigravity\agents\05-research-rnd\persona-swarm.mdc",
    ".antigravity\core\00-anti-hallucination.mdc",
    ".antigravity\core\01-ui-glassmorphism.mdc",
    ".antigravity\core\02-defensive-coding.mdc",
    ".antigravity\core\03-git-safety.mdc",
    "docs\history\project-history.md",
    "apps\frontend\package.json",
    "apps\backend-ai\requirements.txt",
    "apps\orchestrator\package.json",
    "experiments\minecraft-engine\src\FlightController.js",
    "scripts\build.ps1",
    "scripts\extract-knowledge.py",
    "scripts\start-dev.bat",
    "scripts\deploy-prod.sh",
    "package.json"
)

foreach ($f in $files) {
    if (-not (Test-Path $f)) {
        New-Item -ItemType File -Force -Path $f | Out-Null
    }
}

Write-Host "Blueprint VIBE-AGENT 2026 deployed successfully!"
