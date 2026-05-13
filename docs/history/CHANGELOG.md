# 📜 CHANGELOG & ARCHITECTURE DECISIONS

File này lưu lại lịch sử thay đổi của dự án. Không chỉ ghi LÀM GÌ, mà phải ghi TẠI SAO LẠI LÀM THẾ.

## [Unreleased] - Ngày bắt đầu chuẩn hóa
### Added
- Khởi tạo bộ khung dự án theo chuẩn Documentation as Code.
- Lý do (TẠI SAO): Việc quản trị context quá lỏng lẻo dẫn đến AI quên luồng, do đó cần thiết lập `AGENTS.md`, `brief.md`, `BRD.md` ngay từ đầu.

### UI Architecture (Phase 01)
- **Added:** Hệ thống Logo sử dụng `mix-blend-screen` và `invert` thay vì xóa nền trắng.
  - *Lý do (Why):* Giúp linh hoạt đổi màu logo từ đen sang trắng phát sáng mà không cần Photoshop, hỗ trợ tối đa khi áp dụng Dark Mode.
- **Added:** Chuyển đổi Popup Menu của Sidebar từ (Route, Bundler) sang (Profile, Shortcuts, Help).
  - *Lý do (Why):* Menu mặc định của Next.js DevTools chỉ mang tính kỹ thuật. Cập nhật lại để tối ưu hóa Trải nghiệm Người dùng (UX) và sát với nhu cầu thực tế của User.
- **Added:** Xây dựng `PreferencesModal` với Framer Motion.
  - *Lý do (Why):* Cần một bảng điều khiển trung tâm để quản lý Ngôn ngữ, UI và AI Model trước khi code tính năng Backend, nhằm đảm bảo "Khung UI chuẩn Vibe" đã sẵn sàng.
- **Added:** Bản dựng trang `The Vault` (Kho Trí Thức) với mô phỏng RAG Knowledge Graph bằng hạt dữ liệu.
  - *Lý do (Why):* Cần cho User hình dung trước cách dữ liệu PDF được "băm nhỏ" và xoay quanh Lõi AI, từ đó chốt thiết kế trước khi đấu nối Vector Database (ChromaDB) ở Phase 04.
- **Added:** Giao diện `AI Engines Fleet` và `Engine Detail Config`.
  - *Lý do (Why):* Cần trạm điều khiển cho các tác vụ chạy ngầm. Đặc biệt đã code thêm module `Swarm Accounts` dành riêng cho Minecraft để quản lý multi-account cày Top AFK.
- **Added:** Giao diện `Integrations Hub`.
  - *Lý do (Why):* Nơi tập trung quản lý API Key và Webhook. Thiết kế với tính năng che Pass (Mockup) và cảnh báo bảo mật nghiêm ngặt.
- **Architecture Decision:** Chốt kiến trúc lõi Backend RAG thành mô hình `Chimera GraphRAG`.
  - *Lý do (Why):* Từ bỏ Vector RAG truyền thống. Chọn kết hợp `Neo4j AuraDB` (Miễn phí trên Cloud) làm Lõi Đồ thị, `RAGFlow DeepDoc` làm cỗ máy băm tài liệu OCR, và `Intent Router` làm bộ điều hướng câu hỏi để tối ưu hóa chi phí API.
- **Architecture Decision:** Chốt thuật toán chống ban cho Minecraft Bot: `Stealth AFK Ladder`.
  - *Lý do (Why):* Nếu cắm nhiều acc liên tục sẽ bị Admin phát hiện. Cần áp dụng thuật toán "Treo lệch pha ngẫu nhiên (Jitter Margin)" và "Ngắt kết nối bất đối xứng" để giữ vững thứ hạng top một cách tàng hình.
- **Added:** Giao diện `Experiments Sandbox` (Khu thử nghiệm).
  - *Lý do (Why):* Cần một "Phòng thí nghiệm lõi" độc lập để chạy thử các thuật toán rủi ro cao (như thử DeepDoc OCR, thử Mineflayer auto-rest) trước khi tích hợp vào hệ thống chính.
- **Audited:** Tạo báo cáo kiểm thử tại `docs/vault/lessons-learned/qa-report-vault-ui.md`.
