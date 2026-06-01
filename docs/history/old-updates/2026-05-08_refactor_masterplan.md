# 📋 REFACTOR PLAN — TURING HUB DIRECTORY RESTRUCTURE
> Ngày: 05/05/2026 | Phiên bản: V14.5 | Mục tiêu: Đưa hệ thống lên chuẩn Industrial Grade

---

## 1. PHÂN TÍCH TÌNH TRẠNG HIỆN TẠI (AS-IS)
Hệ thống đang bị trộn lẫn giữa Node.js, Python và Frontend ở thư mục gốc và `src/`, gây khó khăn cho việc đóng gói Docker và quản lý môi trường:
- `package.json`, `node_modules/` nằm ở gốc.
- `venv/` nằm ở gốc.
- `src/` chứa lộn xộn `ai/`, `api/`, `backend/`, `frontend/`, v.v.
- Tài liệu rải rác ở `docs/`.

## 2. KIẾN TRÚC THƯ MỤC MỚI (TO-BE)

```plaintext
Ai-Agent/
├── src/
│   ├── backend-orchestrator/    <-- (Node.js API, WorkflowRunner)
│   ├── ai-engine/               <-- (Python, RAG, Prompts)
│   ├── frontend-ui/             <-- (Vanilla JS/CSS, HTML)
│   └── tools/                   <-- (Shared utils)
│
├── deploy/                      <-- (Docker, Scripts)
├── shared-knowledge/            <-- (Nơi lưu Docs, PDF, Vector Data)
│   ├── docs/
│   ├── data/
│   └── git-repos/
│
├── .antigravity/                <-- (Luật AI)
├── scripts/                     <-- (Python/Node scripts lẻ)
├── tests/                       <-- (Unit/Integration Tests)
└── README.md
```

## 3. MAPPING DỊCH CHUYỂN (FILE MIGRATION LOGIC)
| Nguồn (Current) | Đích (Target) | Ghi chú |
|-----------------|---------------|---------|
| `package.json`, `node_modules/` | `src/backend-orchestrator/` | Phân lập môi trường Node.js |
| `src/backend/`, `src/api/` | `src/backend-orchestrator/` | Hợp nhất Backend |
| `src/ai/` | `src/ai-engine/` | Đổi tên |
| `src/frontend/` | `src/frontend-ui/` | Đổi tên |
| `docs/` | `shared-knowledge/docs/` | Đưa vào kho tri thức |
| `data/` | `shared-knowledge/data/` | Đưa vào kho tri thức |

## 4. TODO LIST THEO PRIORITY (SPRINT)

### 🔴 Sprint 1 — Physical Movement (Di chuyển vật lý)
- [ ] Đổi tên các thư mục trong `src/` (`ai` -> `ai-engine`, `frontend` -> `frontend-ui`).
- [ ] Gom `backend` và `api` vào `backend-orchestrator`.
- [ ] Chuyển `package.json`, `package-lock.json` vào `backend-orchestrator`.
- [ ] Tạo `shared-knowledge/` và chuyển `docs/`, `data/` vào trong.

### 🟡 Sprint 2 — Path Refactoring (Sửa đường dẫn gãy)
- [ ] Rà soát `import` và `require` trong `backend-orchestrator/`.
- [ ] Sửa lại đường dẫn nạp tài liệu trong file `scripts/auto_translate_docs.py` (từ `../docs/` thành `../shared-knowledge/docs/`).
- [ ] Sửa lại đường dẫn trong `README.md`.

### 🟢 Sprint 3 — Environment & Docker
- [ ] Cập nhật lại `.env` paths.
- [ ] Cập nhật `docker-compose.yml` (nếu có) để build đúng context của Node và Python.

---

## 5. RỦI RO & CƠ CHẾ BẢO VỆ (EDGE CASES HANDLED)
- **Rủi ro 1:** Mất lịch sử Git khi move file.
  - *Giải pháp:* Sử dụng lệnh `git mv` (nếu đang track Git) hoặc move bằng PowerShell nhưng giữ nguyên nội dung. (Khuyến cáo tự move vật lý trước, commit sau).
- **Rủi ro 2:** `venv/` của Python bị hỏng nếu chuyển đi.
  - *Giải pháp:* Giữ nguyên `venv/` ở thư mục gốc hoặc khuyến cáo User xóa và tạo lại `venv` bên trong `ai-engine/` sau khi move. Tạm thời không đụng đến `venv`.
- **Rủi ro 3:** Script `auto_translate_docs.py` bị lỗi vì đường dẫn tĩnh.
  - *Giải pháp:* Developer phải sửa file này ngay trong Sprint 2.
