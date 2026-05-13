# 🚀 Ai-Agent: Vibe Ecosystem 2026

**Tầm nhìn:** Hệ sinh thái AI (AI-Native Ecosystem) được xây dựng theo kiến trúc Monorepo chuẩn công nghiệp. Tích hợp AI tạo sinh, RAG Pipeline, giao diện Vibe UI và khả năng điều phối bầy đàn Agent (Swarm) tự hành.

---

## 🏛️ Kiến trúc Monorepo (Vibe Blueprint)

Dự án được cấu trúc theo triết lý "Hạt nhân & Phòng ban" nhằm đảm bảo khả năng mở rộng vô hạn và không bao giờ bị mất ngữ cảnh (Context Drift). Mọi thao tác phát triển đều được tự động hóa tài liệu hóa (Documentation as Code).

### 1. 🛡️ `.antigravity/` (Trung tâm Điều hành)
Bộ não của dự án, chứa **Hiến pháp (Bootloader)** và quy định vận hành của 5 Phòng ban AI chuyên trách:
- `01-strategy/`: Định hướng, kiến trúc hệ thống, phân chia task (PM, Architect).
- `02-engineering/`: Kỹ thuật thực thi, viết code phòng thủ.
- `03-security-qa/`: Bảo mật, kiểm soát lỗi, rà soát chất lượng trước khi Deploy.
- `04-knowledge/`: Tự động viết tài liệu (`CHANGELOG.md`), đúc kết bài học.
- `05-research-rnd/`: Nghiên cứu công nghệ mới, giả lập tệp khách hàng ảo để Test UI.

### 2. 🧠 `docs/` (The Second Brain - Hầm Trú Ẩn Tri Thức)
Trái tim lưu trữ ngữ cảnh cho AI. Mọi AI khi chạy lệnh đều phải tham chiếu vào đây:
- `plans/`: Lộ trình thi công (`master-plan.md` 20 Phases).
- `history/`: Nhật ký tiến hóa của dự án.
- `vault/`: Hầm lưu trữ tự động các bài học xương máu (`lessons-learned`), kho tài liệu công nghệ.

### 3. 🚀 `apps/` (Tầng Thực Thi Lõi)
Các ứng dụng chính tạo nên bộ khung sản phẩm:
- `frontend/`: Giao diện người dùng chuẩn Glassmorphism.
- `backend-ai/`: Khối động cơ AI xử lý RAG Pipeline, Vector Database, và LLM Inference (Python FastAPI).
- `orchestrator/`: Nhạc trưởng điều phối dữ liệu, Database Schema và API Gateway (Node.js).

### 4. 🔌 `integrations/` (Dịch vụ Ngoại vi Plug & Play)
Khu vực cấu hình các dịch vụ bên thứ 3 hoàn toàn độc lập với lõi:
- Cấu hình xác thực (Auth), Cổng thanh toán (Payments), và Automation (n8n).

### 5. 🤖 `bots/` (Khu Vực Sandbox Tự Hành)
Phòng thí nghiệm chứa các bot hoạt động độc lập (An toàn 100%, văng lỗi không sập Web):
- `minecraft-engine/`: Bot tự hành trong môi trường vật lý ảo (Minecraft AFK & Navigation).
- `dino-cv-bot/`: Bot nhận diện hình ảnh Computer Vision.

### 6. 🛠️ `scripts/` (DevOps & Utilities)
Các kịch bản tự động hóa, CI/CD, theo dõi file hệ thống (Watch mode), và script khởi động.

---

## ⚡ Hướng dẫn Khởi động & Tiện ích

Dự án được quản lý tập trung thông qua `package.json` tại thư mục gốc.

**1. Khởi động toàn bộ Hệ sinh thái (Apps & Bots song song):**
```bash
npm start
```

**2. Khởi động công cụ theo dõi tài liệu tự động (Chạy ngầm):**
Giúp tự động vẽ lại cây bản đồ thư mục mỗi khi có file thay đổi.
```bash
npm run watch:docs
```

---
> ⚠️ **LUẬT THÉP:** Mọi Developer (kể cả Human hay AI) khi tham gia đóng góp mã nguồn ĐỀU PHẢI đọc và tuân thủ tuyệt đối **[AGENTS.md](./AGENTS.md)** (The Antigravity Constitution V2.0). Việc thực thi trái phép mà không có bước *Pre-Flight Check* sẽ bị từ chối.
