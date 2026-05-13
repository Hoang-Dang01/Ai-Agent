# 🎨 THE VIBE STACK (CINEMATIC UI ARCHITECTURE)

Đây là Stack tối thượng được lựa chọn để phát triển giao diện (Frontend) cho toàn bộ hệ sinh thái Turing Hub (Ai-Agent), nhằm đảm bảo một trải nghiệm "Sci-Fi Lab, Dark Mode, Glassmorphism" mượt mà nhất của năm 2026.

## 1. Nền tảng lõi (Core Framework)
- **Next.js (App Router):** Framework nền tảng để xử lý routing và Server Components, giúp ứng dụng vận hành trơn tru.
- **Tailwind CSS v4:** Công cụ chính để tạo phong cách Glassmorphism (với `backdrop-blur` và `border-white/10`) và quản lý các biến CSS linh hoạt.

## 2. Hệ sinh thái Component (The Arsenal)
- **Shadcn/UI:** Bộ xương cho các component cơ bản như Search Bar, Button và Card để giữ sự ổn định và chuyên nghiệp.
- **Aceternity UI & Magic UI:** Nguồn cung cấp các component "Cinematic" đỉnh cao như **AuroraBackground** (hình nền cực phẩm cực quang) và các khối **Bento Grid**.

## 3. Chuyển động (Motion & Interactions)
- **Framer Motion:** "Linh hồn" tạo nên các hiệu ứng chuyển trang mượt mà, list hoạt họa (staggered animations) và hiệu ứng spotlight đuổi theo chuột.
- **Interactive SVG:** Được dùng riêng cho phần Knowledge Graph để vẽ các nodes (điểm nút) và data particles (hạt dữ liệu) chạy ngầm trong trang Vault hoặc Dashboard.

## 4. Trang sức (Assets)
- **Icons:** Lucide React (Thư viện Icon tối giản, đồng bộ hoàn hảo với thiết kế tổng thể).
- **Typography:** Geist (font của Vercel) mang đậm chất Tech/Code, kết hợp với Inter.

---
> **Lưu ý cho Engineering Dept:** 
> Tuyệt đối không tự code chay các component UI phức tạp nếu đã có sẵn trong Shadcn/UI hoặc Aceternity. Phải ưu tiên tốc độ (Vibe Coding) và tái sử dụng component. Mọi hiệu ứng ánh sáng (Glow, Blur) phải bám sát Dark Mode.
