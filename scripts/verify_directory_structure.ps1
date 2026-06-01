# ==================================================================
# KICH BAN KIEM NGHIEM TU DONG CAU TRUC THU MUC TOAN DIEN (UAT)
# Du an: Vibe Ecosystem / AI-Agent OS Platform
# Tac gia: Antigravity Solution Architect
# ==================================================================

Clear-Host
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "     AI OPERATING PLATFORM - DIRECTORY STRUCTURE VERIFICATION" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "[UAT Engine] Dang quet dia de xac minh toan bo he thong thu muc..." -ForegroundColor Yellow
Write-Host ""

# Dinh nghia cac thu muc va tep cot loi can kiem nghiem
$verificationTargets = @(
    # Thu muc goc & cau hinh chung
    @{ Path = ".agent"; Type = "Directory"; Desc = "[IDE Rules Only] Cau hinh quy tac nhan thuc va dinh tuyen cho IDE" },
    @{ Path = ".agent\agents"; Type = "Directory"; Desc = "Khai bao ranh gioi quyen han CAN/CANNOT (MDC manifests)" },
    @{ Path = ".agent\kernel"; Type = "Directory"; Desc = "Dao luat nhan thuc toi cao (governance, core, laws)" },
    @{ Path = ".agent\runtime"; Type = "Directory"; Desc = "Quan tri trang thai va che do lam viec (runtime-state)" },
    @{ Path = ".antigravity"; Type = "Directory"; Desc = "Agent instructions noi bo cua he thong Antigravity" },
    @{ Path = "AGENTS.md"; Type = "File"; Desc = "Operational Doctrine - tai lieu nhan thuc nen tang cua he thong" },
    @{ Path = "README.md"; Type = "File"; Desc = "Tai lieu gioi thieu tong quan he thong va cach cai dat nhanh" },
    @{ Path = "package.json"; Type = "File"; Desc = "Cau hinh Node.js workspace o thu muc goc" },
    @{ Path = "start_all.ps1"; Type = "File"; Desc = "Launcher 1-click khoi chay toan bo 4 dich vu duoi nen" },

    # Phan he C# Agent-Runtime
    @{ Path = "apps\agent-runtime"; Type = "Directory"; Desc = "[C# .NET 9.0] He dieu hanh tac nhan ngoai tuyen (Agent OS Core)" },
    @{ Path = "apps\agent-runtime\src\OfflineAgent.sln"; Type = "File"; Desc = "Solution chinh boc cac du an Core, UI va Console" },
    @{ Path = "apps\agent-runtime\src\OfflineAgent.Core"; Type = "Directory"; Desc = "Du an Class Library chua toan bo thuat toan nghiep vu" },
    @{ Path = "apps\agent-runtime\src\OfflineAgent.Core\Automation"; Type = "Directory"; Desc = "Bo dieu khien tu dong hoa giao dien thong qua FlaUI" },
    @{ Path = "apps\agent-runtime\src\OfflineAgent.Core\Events"; Type = "Directory"; Desc = "Telemetry Event Bus phoi hop phat su kien bat dong bo" },
    @{ Path = "apps\agent-runtime\src\OfflineAgent.Core\Plugins"; Type = "Directory"; Desc = "Chua dinh nghia AgentContext va tri thuc nghiep vu" },
    @{ Path = "apps\agent-runtime\src\OfflineAgent.Core\Reflection"; Type = "Directory"; Desc = "Bo nao tham dinh chan doan loi (Critic va Replanner)" },
    @{ Path = "apps\agent-runtime\src\OfflineAgent.Core\Runtime"; Type = "Directory"; Desc = "Bo dieu phoi workflow DAG, Goal va Checkpoint" },
    @{ Path = "apps\agent-runtime\src\OfflineAgent.Core\Security"; Type = "Directory"; Desc = "Bo kiem duyet dac quyen an toan hanh dong (CapabilityGuard)" },
    @{ Path = "apps\agent-runtime\src\OfflineAgent.Core\Storage"; Type = "Directory"; Desc = "Bo luu tru Artifacts vat ly tach biet khoi RAM tranh ro ri" },
    @{ Path = "apps\agent-runtime\src\OfflineAgent.Core\ToolRegistry"; Type = "Directory"; Desc = "Dynamic Tool Registry va trich xuat JSON Schema tu dong" },
    @{ Path = "apps\agent-runtime\src\OfflineAgent.Core\Tools"; Type = "Directory"; Desc = "Bo cong cu vat ly doc lap (Click, TypeText, OpenApp)" },
    @{ Path = "apps\agent-runtime\src\OfflineAgent.Core\Vision"; Type = "Directory"; Desc = "Engine nhung mo hinh thi giac va LLM cuc bo (GenAI ONNX)" },
    @{ Path = "apps\agent-runtime\src\OfflineAgent.Core\WorldState"; Type = "Directory"; Desc = "Observation Cache va State Delta Engine tinh toan sai khac" },
    @{ Path = "apps\agent-runtime\src\OfflineAgent.UI"; Type = "Directory"; Desc = "Giao dien dieu hanh chinh WPF dang bang dieu phoi Client" },

    # Phan he Node.js Orchestrator
    @{ Path = "apps\orchestrator"; Type = "Directory"; Desc = "[Node.js TS] Nhac truong dieu phoi API Gateway va Queue" },
    @{ Path = "apps\orchestrator\prisma"; Type = "Directory"; Desc = "Cau hinh ORM Prisma va PostgreSQL" },
    @{ Path = "apps\orchestrator\prisma\schema.prisma"; Type = "File"; Desc = "Schema database PostgreSQL voi pgvector, Goal, Task DAG models" },
    @{ Path = "apps\orchestrator\src"; Type = "Directory"; Desc = "Ma nguon loi TypeScript cua Orchestrator" },
    @{ Path = "apps\orchestrator\src\config"; Type = "Directory"; Desc = "Cau hinh moi truong nghiem ngat va logger Pino" },
    @{ Path = "apps\orchestrator\src\middlewares"; Type = "Directory"; Desc = "Cac bo loc JWT Authentication va Rate Limiter Redis" },
    @{ Path = "apps\orchestrator\src\queue"; Type = "Directory"; Desc = "He thong hang doi BullMQ dieu phoi task bat dong bo" },
    @{ Path = "apps\orchestrator\src\services"; Type = "Directory"; Desc = "Services quan ly Database va Dong bo World State" },

    # Phan he Python Backend-AI
    @{ Path = "apps\backend-ai"; Type = "Directory"; Desc = "[Python FastAPI] Dich vu nhan thuc va AI Engine cuc bo" },
    @{ Path = "apps\backend-ai\app\main.py"; Type = "File"; Desc = "File chay chinh FastAPI cung cap REST API cho Reflection" },
    @{ Path = "apps\backend-ai\app\routers\reflection.py"; Type = "File"; Desc = "API Endpoints boc lo tinh nang verify, critic, replan" },
    @{ Path = "apps\backend-ai\app\services"; Type = "Directory"; Desc = "Toan bo logic nghiep vu AI (Planner, Memory, Vision, Reflection)" },

    # Phan he Next.js Frontend
    @{ Path = "apps\frontend"; Type = "Directory"; Desc = "[Next.js 15] Web Control Deck Dashboard giam sat truc quan" },
    @{ Path = "apps\frontend\src\components\dashboard"; Type = "Directory"; Desc = "Giao dien buong lai dieu hanh giam sat Task Graph, World State, HITL Gates" },
    @{ Path = "apps\frontend\src\components\vault"; Type = "Directory"; Desc = "Bo giam sat kho tri thuc RAG, tai lieu va doi chieu" },
    @{ Path = "apps\frontend\src\components\model-lab"; Type = "Directory"; Desc = "Giao dien thu nghiem mo hinh AI va kiem chung" },
    @{ Path = "apps\frontend\src\components\ui"; Type = "Directory"; Desc = "Cac thanh phan UI tai su dung (Buttons, Dialogs, Inputs)" },

    # Tang Shared Packages
    @{ Path = "packages"; Type = "Directory"; Desc = "[Tang Chia Se Du Lieu - Hop Dong DRY]" },
    @{ Path = "packages\contracts"; Type = "Directory"; Desc = "Bo Polyglot Schemas chuan hoa dung chung da ngon ngu" },
    @{ Path = "packages\contracts\task.schema.json"; Type = "File"; Desc = "Schema dinh nghia cau truc Task chuan" },
    @{ Path = "packages\contracts\world-state.schema.json"; Type = "File"; Desc = "Schema dinh nghia cau truc World State chuan" },
    @{ Path = "packages\contracts\tool-call.schema.json"; Type = "File"; Desc = "Schema dinh nghia cau truc Tool Call chuan" },
    @{ Path = "packages\contracts\reflection.schema.json"; Type = "File"; Desc = "Schema dinh nghia cau truc Reflection chuan" },
    @{ Path = "packages\shared-types"; Type = "Directory"; Desc = "Thu vien kieu TS dung chung cho Frontend va Orchestrator" },

    # Cac giai phap Agent va thanh phan khac
    @{ Path = "solutions"; Type = "Directory"; Desc = "[Agent Implementations] Cac Agent hoan chinh chay tren nen tang" },
    @{ Path = "solutions\dino-cv-agent"; Type = "Directory"; Desc = "Agent thi giac may tinh choi game Chrome Dino" },
    @{ Path = "infra"; Type = "Directory"; Desc = "[DevOps va Observability] Cau hinh Nginx, Prometheus, Grafana" },
    @{ Path = "docker"; Type = "Directory"; Desc = "Cau hinh Docker Compose cho cac moi truong chay" },
    @{ Path = "scripts"; Type = "Directory"; Desc = "Kich ban tu dong hoa van hanh, cai dat va kiem nghiem" },
    @{ Path = "docs"; Type = "Directory"; Desc = "[The Second Brain] Tai lieu dac ta, Master Plan, Bao cao UAT" }
)

$passedCount = 0
$failedCount = 0

Write-Host "------------------------------------------------------------------" -ForegroundColor Cyan
Write-Host " | TRANG THAI | LOAI      | DUONG DAN THU MUC / TEP TIN" -ForegroundColor Cyan
Write-Host "------------------------------------------------------------------" -ForegroundColor Cyan

foreach ($target in $verificationTargets) {
    $fullPath = Join-Path -Path "c:\Git cua tui\Ai-Agent" -ChildPath $target.Path
    $exists = Test-Path -Path $fullPath
    
    if ($exists) {
        $passedCount++
        $statusText = "[ PASS ]"
        $statusColor = "Green"
    } else {
        $failedCount++
        $statusText = "[*FAIL*]"
        $statusColor = "Red"
    }
    
    $typePadding = $target.Type.PadRight(9)
    Write-Host " $statusText | $typePadding | $($target.Path)" -ForegroundColor $statusColor
    Write-Host "     - Y nghia: $($target.Desc)" -ForegroundColor Gray
}

Write-Host "------------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "========================= KET QUA UAT ===========================" -ForegroundColor Cyan
$total = $passedCount + $failedCount
$percent = [Math]::Round(($passedCount / $total) * 100, 2)

Write-Host " Tong so hang muc kiem nghiem: $total" -ForegroundColor White
Write-Host " So hang muc HOP LE (PASS)  : $passedCount" -ForegroundColor Green
if ($failedCount -gt 0) {
    Write-Host " So hang muc THIEU/LOI (FAIL): $failedCount" -ForegroundColor Red
} else {
    Write-Host " So hang muc THIEU/LOI (FAIL): 0" -ForegroundColor Green
}
Write-Host " Ty le hoan thien cau truc   : $percent%" -ForegroundColor Yellow
Write-Host "==================================================================" -ForegroundColor Cyan

if ($failedCount -eq 0) {
    Write-Host "SUCCESS: Cau truc Monorepo dat chuan tuyet doi 10/10! He thong dong bo." -ForegroundColor Green
} else {
    Write-Host "WARNING: Phat hien co hang muc bi thieu hoac sai lech cau truc thiet ke." -ForegroundColor Red
}
