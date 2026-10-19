# FitVision 3D (C1SE.12)
### Hệ Thống Đo Nhân Trắc Học Không Tiếp Xúc & Thử Đồ Ảo 3D (AI Anthropometrics & 3D Virtual Fitting)

![Tech Stack](https://img.shields.io/badge/React-19-61dafb?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.x-646cff?style=flat&logo=vite)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?style=flat&logo=tailwindcss)
![Three.js](https://img.shields.io/badge/Three.js-WebGL-black?style=flat&logo=three.js)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ecf8e?style=flat&logo=supabase)

---

## 📌 1. Tổng quan dự án

**FitVision 3D** là dự án thuộc học phần **Capstone Project (C1SE.12)**, cung cấp giải pháp toàn diện cho bài toán đo đạc nhân trắc học không tiếp xúc (Contactless Anthropometry) từ ảnh chụp thông thường (Webcam/Smartphone), tự động tính toán các chỉ số cơ thể đạt độ tin cậy theo tiêu chuẩn quốc tế **ISO 8559-1/2**, đồng thời mô phỏng tái tạo hình thể **Mannequin 3D tương tác theo thời gian thực** trên nền tảng WebGL (Three.js).

### ✨ Các tính năng cốt lõi:
1. **Pose Guide & Capture**: Giao diện hướng dẫn tư thế người dùng chuẩn A-pose (Chính diện & Nghiêng 90°), kiểm tra độ phủ toàn thân và điều kiện ánh sáng.
2. **Computer Vision Pipeline**: Tích hợp **MediaPipe Pose** (33 điểm mốc xương cơ thể) và **OpenCV.js WASM** (xử lý hình thái học, phân tách nền và chuẩn hóa tỉ lệ đo lường qua vật chuẩn chuẩn hóa).
3. **Bộ tính toán ISO 8559**: Ứng dụng mô hình xấp xỉ chu vi elip Ramanujan cho các mặt cắt cơ thể (vòng ngực, vòng eo, vòng mông) và so khớp bảng size chuẩn (XS, S, M, L, XL, XXL).
4. **Interactive 3D Mannequin**: Tái hiện hình thể 3D dưới dạng parametric mesh bằng **Three.js**, hỗ trợ xoay 360°, chế độ Wireframe/Shaded và các vòng đo kích thước trực quan.
5. **Dịch vụ Cloud Supabase**: Quản lý hồ sơ người dùng và đồng bộ lịch sử phiên quét cơ thể an toàn.

---

## 📁 2. Cấu trúc thư mục (Architecture Design)

Dự án được cấu trúc dạng Module-Driven Architecture theo sát tài liệu thiết kế hệ thống:

```text
fitvision-3d/
├── public/                     # Static assets & model weights
├── src/
│   ├── assets/                 # Icons, logo, hình ảnh tĩnh
│   ├── components/             # Reusable UI components & Layout chung
│   │   ├── ui/                 # Button, Badge, Card (Glassmorphism design system)
│   │   ├── Navbar.tsx          # Thanh điều hướng với status badge & logo
│   │   ├── Layout.tsx          # Wrapper layout nền cyber-grid & ambient glow
│   │   └── index.ts
│   ├── features/               # Các module tính năng chuyên biệt
│   │   ├── capture/            # Chụp ảnh và kính ngắm hướng dẫn tư thế (Pose Guide)
│   │   │   ├── CameraFeed.tsx
│   │   │   ├── PoseGuideOverlay.tsx
│   │   │   └── index.ts
│   │   ├── cv/                 # MediaPipe Pose BlazePose & OpenCV.js WASM
│   │   │   ├── mediapipe.ts    # Pipeline 33 điểm mốc và liên kết xương
│   │   │   ├── opencv.ts       # Module WASM và hiệu chuẩn thước đo pixel-to-metric
│   │   │   ├── CVMonitorCard.tsx
│   │   │   └── index.ts
│   │   ├── anthropometry/      # Bộ tính toán số đo chuẩn ISO 8559
│   │   │   ├── calculator.ts   # Thuật toán tính toán số đo (Ramanujan Ellipse Model)
│   │   │   ├── isoStandards.ts # Bảng size quy chuẩn ISO 8559 cho Nam & Nữ
│   │   │   ├── AnthropometryDisplay.tsx
│   │   │   └── index.ts
│   │   └── avatar3d/           # Three.js WebGL canvas & render mannequin 3D
│   │       ├── meshGenerator.ts# Bộ sinh hình học Mannequin tham số hóa
│   │       ├── MannequinViewer.tsx
│   │       └── index.ts
│   ├── services/               # Supabase client và tầng kết nối API
│   │   ├── supabase.ts         # Khởi tạo client & CRUD số đo / profile
│   │   └── index.ts
│   ├── types/                  # TypeScript Interfaces (ISO 8559, Profile, Pose)
│   │   └── index.ts
│   ├── App.tsx                 # Dashboard tích hợp trung tâm điều khiển
│   ├── index.css               # Tailwind CSS & Design tokens
│   └── main.tsx                # Entry point ứng dụng React
├── .env.example                # File mẫu cấu hình biến môi trường
├── tailwind.config.js          # Cấu hình Tailwind CSS v3
├── postcss.config.js           # Cấu hình PostCSS & Autoprefixer
├── tsconfig.app.json           # Cấu hình TypeScript & path alias (@/*)
├── vite.config.ts              # Cấu hình Vite bundler
└── package.json                # Danh sách dependencies & scripts
```

---

## 🚀 3. Hướng dẫn cài đặt và chạy ứng dụng

### Bước 1: Clone mã nguồn hoặc di chuyển vào thư mục dự án
```bash
cd fitvision-3d
```

### Bước 2: Cài đặt các gói phụ thuộc (Dependencies)
```bash
npm install
```

### Bước 3: Cấu hình biến môi trường
Tạo file `.env` từ file mẫu `.env.example`:
```bash
# Trên Windows PowerShell:
Copy-Item .env.example .env

# Hoặc trên Linux/macOS:
cp .env.example .env
```
Mở file `.env` và cập nhật thông tin Supabase của bạn (nếu chưa có, hệ thống sẽ tự động chạy chế độ Mock/Demo an toàn mà không bị crash):
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Bước 4: Khởi chạy môi trường phát triển (Development Server)
```bash
npm run dev
```
Sau khi chạy lệnh, truy cập trình duyệt theo địa chỉ hiển thị tại terminal (thông thường là `http://localhost:5173`).

---

## 🛠️ 4. Các lệnh hữu ích khác

| Lệnh | Ý nghĩa |
| :--- | :--- |
| `npm run dev` | Khởi động Vite dev server với Hot Module Replacement (HMR). |
| `npm run build` | Kiểm tra kiểu TypeScript và đóng gói mã nguồn cho môi trường Production. |
| `npm run preview` | Khởi chạy máy chủ cục bộ xem trước bản build production. |
| `npm run lint` | Chạy linter kiểm tra cú pháp và chất lượng mã nguồn. |

---

## 👥 Đơn vị thực hiện
- **Dự án**: FitVision 3D (Contactless Anthropometry & 3D Virtual Fitting System)
- **Mã học phần**: C1SE.12
