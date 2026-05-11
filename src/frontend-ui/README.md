# Frontend UI - AI Study Hub (Turing Drone V9.0)

Thư mục này chứa toàn bộ mã nguồn giao diện người dùng (Frontend) của dự án hệ thống đa tác nhân, được xây dựng theo chuẩn **Industrial Grade**.

## Công nghệ cốt lõi
- **Core Framework:** ReactJS
- **Build Tool:** Vite (Cực nhanh, hỗ trợ HMR)
- **Routing:** React Router DOM (Mô hình Single Page Application)
- **Thiết kế UI:** Kiến trúc **Glassmorphism** tùy biến hoàn toàn, **KHÔNG SỬ DỤNG** thư viện UI bên ngoài (như Tailwind, Bootstrap, AntD).
- **CSS Utility:** Thư viện nội bộ tự trồng tại `src/assets/css/glassmorphism.css`.

## Cấu trúc thư mục (Source Code)
- `src/components/`: Các Component dùng chung (như Layout, Sidebar, Header).
- `src/pages/`: Các trang giao diện chính:
  - `Home.jsx`: Dashboard chọn Agent.
  - `Chat.jsx`: Giao diện trò chuyện đa tác nhân.
  - `Minecraft.jsx`: Bảng điều khiển Bot siêu việt.
  - `Documents.jsx`: Quản lý kho tri thức RAG.
  - `Settings.jsx`: Tùy chỉnh hệ thống.
- `src/assets/css/`: CSS hệ thống, bao gồm Global CSS và Glassmorphism Tokens.

## Lệnh khởi chạy
Thư mục này được gọi thông qua file `package.json` ở Root của dự án (`npm run frontend`).
Nếu muốn chạy độc lập:
```bash
npm run dev
```

> **Quy Tắc Tối Quan Trọng:** Khi phát triển UI tại đây, tuyệt đối tuân thủ nguyên tắc thiết kế Glassmorphism được quy định tại `../../.antigravity/core/02-ui-glassmorphism.mdc`.
