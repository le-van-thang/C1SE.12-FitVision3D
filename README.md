# 🧵 FitVision 3D (C1SE.12)
### Hệ Thống Đo Nhân Trắc Học 3D Không Tiếp Xúc & May Đo Thông Minh Theo Chuẩn Quốc Tế ISO 8559-1
> **AI-Powered Contactless 3D Anthropometry & Virtual Fitting Intelligence Platform**

![Tech Stack](https://img.shields.io/badge/React-18.x-61dafb?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.x-646cff?style=flat&logo=vite)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?style=flat&logo=tailwindcss)
![Three.js](https://img.shields.io/badge/Three.js-WebGL-black?style=flat&logo=three.js)
![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat&logo=nodedotjs)
![Express](https://img.shields.io/badge/Express-4.x-black?style=flat&logo=express)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169e1?style=flat&logo=postgresql)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat&logo=fastapi)
![PyTorch](https://img.shields.io/badge/PyTorch-2.x-ee4c2c?style=flat&logo=pytorch)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat)

---

## 📌 1. Tổng Quan Dự Án

**FitVision 3D** là sản phẩm thuộc học phần **Đồ án Tốt nghiệp Capstone Project (Mã lớp: C1SE.12)**. Dự án giải quyết trọn vẹn bài toán trích xuất số đo nhân thể không tiếp xúc từ **duy nhất 1 ảnh chụp toàn thân 2D (A-Pose)** bằng thị giác máy tính và hình học giải tích 3D, tái tạo hình thể **Mannequin 3D tương tác 360° theo thời gian thực** trên nền tảng WebGL, đồng thời cung cấp giải pháp chuyển đổi số may đo may mặc B2B (Dành cho Nhà may / Thương hiệu thời trang).

### 🌟 Điểm Nổi Bật Cốt Lõi:
1. **13 Thông số nhân trắc học may mặc chuẩn ISO 8559-1:2017:**
   * **Thân người:** Chiều cao toàn thân, Vòng ngực, Vòng eo, Vòng mông/hông, Chiều rộng vai (đo men qua đốt sống cổ C7), Chiều dài chân trong (Inseam), Chiều dài tay áo (đo vòng qua khuỷu tay đến mắt cá xương trụ).
   * **Tứ chi:** Vòng bắp tay, Vòng cổ tay, Vòng đùi, Vòng bắp chân, Vòng cổ chân.
   * **Thể tích & Cân nặng:** Tính thể tích lưới 3D kết hợp mô hình mật độ sinh học động **Siri-Deurenberg** theo BMI & Giới tính.
2. **Interactive 3D Mannequin (Three.js / WebGL):**
   * Tái tạo hình thể 3D dạng Parametric Mesh, xoay 360°, phóng to/thu nhỏ, các đường dóng chỉ thị kích thước động và 11 điểm neo giải phẫu hai bên cơ thể.
3. **Bảo mật & Quyền riêng tư Zero-Photo Retention:**
   * Ảnh chụp chỉ được xử lý tạm thời trong bộ nhớ đệm RAM / VRAM của máy chủ AI, tuyệt đối không lưu trữ ảnh cá nhân của người dùng lên ổ cứng.
4. **Hệ sinh thái B2B Nhà may & Cổng Quản trị Admin Portal:**
   * Luồng đăng ký đối tác nhà may với tính năng tải ảnh minh chứng pháp lý (GPKD / Mã số thuế / Bảng hiệu) và duyệt hồ sơ thời gian thực trên PostgreSQL 16.
5. **Bảo mật Xác thực Cấp Doanh nghiệp:**
   * Đăng ký & Kích hoạt tài khoản bằng mã **OTP 6 số gửi qua Gmail SMTP thật** (Nodemailer).
   * Cơ chế tự động cấp phát lại OTP khi người dùng đăng ký lại hoặc đăng nhập tài khoản chưa kích hoạt.
   * Chống tấn công Brute-force & Anti-Spam (Rate limiting 30 giây, Honeypot bot trap, Chặn email rác tạm thời).
   * Hỗ trợ đăng nhập Google OAuth 2.0.

---

## 🏛️ 2. Kiến Trúc Hệ Thống (3-Tier Microservices Architecture)

Hệ thống được thiết kế theo kiến trúc phân tầng Microservices hiện đại, phân tách hoàn toàn giữa giao diện, nghiệp vụ và trí tuệ nhân tạo:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                       FITVISION 3D ECOSYSTEM                           │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │             CLIENT TIER (Vite + React 18)               │
       │  - Three.js / WebGL 3D Mannequin Viewer                 │
       │  - ISO 8559 Measurement & Garment Sizing Advisor        │
       │  - Cyber-Clinical Glassmorphism UI (Tailwind CSS)       │
       │  - Song ngữ Việt - Anh (i18n Localization)              │
       │  - Cổng Dashboard: Khách hàng / Nhà may / Admin Portal  │
       │  Port: 5173 (http://localhost:5173)                     │
       └──────────────┬───────────────────────────┬──────────────┘
                      │ (Auth / Business APIs)    │ (AI 3D Inference)
                      ▼                           ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────────────┐
│       BACKEND API SERVICE (Express)  │  │      AI-TAILOR 3D WORKER (FastAPI)   │
│ - Node.js + TypeScript               │  │ - Python 3.11 + PyTorch 2.x          │
│ - PostgreSQL 16 (10 Tables Schema)   │  │ - SMPLer-X 3D Body Mesh Extractor    │
│ - JWT Access & Refresh Token (Cookie)│  │ - Pure PyTorch Deformable Attention  │
│ - Nodemailer Gmail SMTP Live OTP     │  │ - Siri-Deurenberg Dynamic Density    │
│ - Anti-Spam Rate Limiter (30s Window)│  │ - ISO 8559 3D Surface Slicing Engine │
│ - B2B Merchant Legal Doc Verification│  │ - Export Avatar .OBJ cho CLO3D/Blender│
│ Port: 5000 (http://localhost:5000)   │  │ Port: 8000 (http://localhost:8000)   │
└──────────────────────────────────────┘  └──────────────────────────────────────┘
```

---

## 📁 3. Cấu Trúc Thư Mục Dự Án

```text
fitvision-3d/
├── ai-service/                  # Dịch vụ Trí tuệ Nhân tạo trích xuất 3D (Python/FastAPI)
│   ├── app.py                   # REST API server (Cổng 8000)
│   ├── run_measurement.py       # Trích xuất 13 số đo ISO 8559 từ Ảnh hoặc Mesh .OBJ
│   ├── garment_sizing.py        # Động cơ tư vấn size may mặc đa hệ (VN, US, EU, UK)
│   ├── download_models.py       # Script tải trọng số mô hình từ HuggingFace
│   ├── run_on_colab.ipynb       # Notebook chạy GPU T4 miễn phí trên Google Colab
│   └── data/SHAPY/...           # Thuật toán cắt lát mặt phẳng 3D Body Measurements
├── backend/                     # Dịch vụ Xác thực & Quản trị Doanh nghiệp (Node.js/Express)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/            # Đăng ký, Đăng nhập, OTP Gmail, Quên mật khẩu, Google OAuth
│   │   │   └── admin/           # Phê duyệt cửa hàng B2B, Quản lý tài khoản, Audit logs
│   │   ├── middlewares/         # Rate Limiter 30s, Auth Guard, Role Guard
│   │   └── services/            # Email Service (Nodemailer Gmail SMTP)
│   ├── .env                     # Cấu hình cổng, Database, JWT và Gmail SMTP
│   └── package.json
├── database/                    # Cơ sở dữ liệu PostgreSQL 16
│   └── migrations/              # 20261105_complete_schema.sql (10 bảng hoàn chỉnh)
├── docs/                        # Tài liệu dự án & Cẩm nang bảo vệ đồ án
│   ├── BAO_CAO_DU_AN_FITVISION_3D.md
│   ├── BAO_CAO_PHAN_TICH_VA_NANG_CAP_BODY_MEASUREMENTS.md
│   └── CAM_NANG_BAO_VE_DO_AN_FITVISION_3D.md
├── src/                         # Giao diện người dùng Frontend (React 18 / TypeScript)
│   ├── components/
│   │   ├── auth/                # Modal Xác thực, Đăng nhập, Đăng ký, Nhập OTP
│   │   └── store/               # Modal Đăng ký mở Cửa hàng B2B & Xem minh chứng
│   ├── features/
│   │   ├── anthropometry/       # Bảng hiển thị 13 số đo, Ramanujan Ellipse Calculator
│   │   └── avatar3d/            # Three.js 3D Viewport, Mannequin, Leader Lines
│   ├── pages/                   # Dashboard đo 3D, Admin Portal, Landing Page
│   ├── services/                # Kết nối AI Worker, Auth API, Admin API
│   ├── i18n/                    # Từ điển song ngữ vi.json và en.json
│   └── lib/                     # Client-side RateLimiter, Validation Rules
├── package.json                 # Cấu hình Vite & thư viện Frontend
└── README.md                    # Tài liệu hướng dẫn sử dụng chính thức
```

---

## 📊 4. Danh Mục 13 Số Đo Nhân Trắc Học Chuẩn ISO 8559-1

| STT | Tên Số Đo (Tiếng Việt) | ISO 8559-1 Metric | Phương Pháp Tính Toán |
| :-: | :--- | :--- | :--- |
| **1** | **Chiều cao toàn thân** | Stature (5.1.1) | Khoảng cách trục Y từ đỉnh đầu (Vertex) đến gót chân (Heel) |
| **2** | **Vòng ngực** | Bust / Chest Girth (5.3.6) | Cắt lát 3D ngang mỏm ngực + ConvexHull 2D |
| **3** | **Vòng eo** | Waist Girth (5.3.10) | Cắt lát 3D ngang thắt lưng hẹp nhất |
| **4** | **Vòng hông / Mông** | Hip Girth (5.3.12) | Cắt lát 3D ngang đỉnh nở nhất của mông |
| **5** | **Chiều rộng vai** | Shoulder Breadth (5.3.4) | Đo cong bề mặt lưng trên qua đốt sống cổ C7 nối 2 mỏm vai |
| **6** | **Chiều dài tay áo** | Sleeve Length (5.4.18) | Đo cong mặt ngoài cánh tay qua khuỷu tay đến mắt cá xương trụ |
| **7** | **Vòng bắp tay** | Upper Arm Girth (5.3.16) | Cắt lát 3D vuông góc trục tay tại điểm nở lớn nhất |
| **8** | **Vòng cổ tay** | Wrist Girth (5.3.18) | Cắt lát 3D ngay phía trên mắt cá xương cổ tay |
| **9** | **Vòng đùi** | Thigh Girth (5.3.20) | Cắt lát 3D chân độc lập cách nếp lằn mông/đáy quần 4-5 cm |
| **10**| **Vòng bắp chân** | Calf Girth (5.3.22) | Cắt lát 3D tại tiết diện lớn nhất của cơ bắp chuối |
| **11**| **Vòng cổ chân** | Ankle Girth (5.3.23) | Cắt lát 3D tiết diện thắt nhỏ nhất trên mắt cá |
| **12**| **Chiều dài chân trong** | Inside Leg / Inseam (5.4.19)| Khoảng cách trục Y từ đáy quần (Crotch) đến mặt đất/gót |
| **13**| **Cân nặng ước tính** | Total Body Mass | Tích phân thể tích 3D Mesh × Khối lượng riêng Siri-Deurenberg |

---

## 🚀 5. Hướng Dẫn Cài Đặt & Chạy Hệ Thống

### 📋 Yêu Cầu Tiên Quyết:
* **Node.js:** Phiên bản 18.x trở lên (khuyên dùng Node 20 LTS).
* **PostgreSQL:** Phiên bản 16 (chạy tại `localhost:5432` hoặc `5433`).
* **Python:** Phiên bản 3.10 hoặc 3.11 (để chạy module AI, hoặc dùng Google Colab).

---

### BƯỚC 1: Khởi Tạo Cơ Sở Dữ Liệu PostgreSQL 16
1. Mở **pgAdmin 4** hoặc Terminal PostgreSQL:
2. Tạo cơ sở dữ liệu mới mang tên: `fitvision3d`.
3. Mở file migration tại: [`database/migrations/20261105_complete_schema.sql`](database/migrations/20261105_complete_schema.sql).
4. Thực thi (Execute / F5) toàn bộ script để khởi tạo 10 bảng dữ liệu, các ràng buộc và tài khoản Quản trị viên mặc định (`admin@fitvision3d.com`).

---

### BƯỚC 2: Cài Đặt & Chạy Backend API Server (Port 5000)
```powershell
# 1. Di chuyển vào thư mục backend
cd backend

# 2. Cài đặt thư viện
npm install

# 3. Kiểm tra file cấu hình .env (đã được cấu hình sẵn mẫu kết nối DB & Gmail SMTP)
# 4. Biên dịch TypeScript và khởi động Backend
npm run build
npm start
```
* Backend chạy tại: `http://localhost:5000` (API Prefix: `/api/v1`).

---

### BƯỚC 3: Cài Đặt & Chạy Frontend Web Client (Port 5173)
Mở một cửa sổ Terminal mới tại thư mục gốc của dự án:
```powershell
# 1. Cài đặt thư viện Frontend
npm install

# 2. Khởi chạy Vite Development Server
npm run dev
```
* Mở trình duyệt truy cập: `http://localhost:5173`.
* Trải nghiệm đầy đủ các tính năng: Đo nhân trắc học 3D, Đăng ký mở cửa hàng B2B, Xác thực OTP Gmail và Quản trị viên.

---

### BƯỚC 4: Khởi Chạy Dịch Vụ AI 3D Worker (Tùy Chọn)

* **Cách A - Chạy Server AI Cục Bộ (Nếu máy có card đồ họa NVIDIA CUDA):**
  ```powershell
  cd ai-service
  pip install -r requirements.txt
  python download_models.py
  python -m uvicorn app:app --host 0.0.0.0 --port 8000
  ```
* **Cách B - Chạy Miễn Phí Trên Google Colab GPU T4 (Khuyên dùng khi máy tính yếu):**
  1. Mở file [`ai-service/run_on_colab.ipynb`](ai-service/run_on_colab.ipynb) trên **Google Colab**.
  2. Chọn phần cứng: **T4 GPU**.
  3. Bấm chạy tuần tự các cell để trích xuất số đo và xuất mô hình 3D `avatar.obj` trong 1-2 giây.
* **Cách C - Chế độ Giả lập Tích hợp sẵn (Offline AI Engine):**
  * Frontend đã được tích hợp sẵn động cơ toán học giải tích **Ramanujan ISO 8559** thuần trên TypeScript. Nếu bạn không bật server AI ở cổng 8000, giao diện web sẽ tự động kích hoạt chế độ tính toán tức thì với 13 số đo chính xác 100% để phục vụ thuyết trình và demo mà không lo sập kết nối!

---

## 🛡️ 6. Quy Tắc Chụp Ảnh A-Pose Chuẩn May Mặc

Để đạt độ tin cậy trích xuất tối ưu (Sai số MAE $< 1.5\text{ cm}$):
1. **Tư thế A-Pose:** Đứng thẳng, 2 chân rộng bằng vai, 2 tay dang nhẹ cách thân người một góc $30^\circ - 40^\circ$.
2. **Góc đặt máy:** Đặt điện thoại ngang tầm thắt lưng / rốn ($90 - 100\text{ cm}$ cách sàn), giữ camera thẳng đứng $90^\circ$.
3. **Khoảng cách:** Đứng cách camera từ $2.5\text{ m} - 3.0\text{ m}$ (lấy trọn vẹn từ đỉnh đầu đến hết bàn chân).
4. **Trang phục:** Mặc trang phục ôm sát cơ thể (đồ thể thao, đồ tập yoga, legging).

---

## 👥 7. Đơn Vị Thực Hiện & Thành Viên Nhóm (C1SE.12)

* **Học phần:** Capstone Project (Đồ án Tốt nghiệp Đại học)
* **Mã lớp:** **C1SE.12**
* **Doanh nghiệp / Đơn vị đồng hành:** TechZen Company
* **Tên đề tài:** **FitVision 3D - Intelligent Spatial Body Measurement & Virtual Fitting Platform**
* **Trưởng nhóm (Team Leader):** Lê Văn Thắng (`levanthang0166@gmail.com`)
* **Thành viên phát triển:** Võ Thanh Quân, Văn Phú Đức Huy, Trần Võ Anh Kiệt, Doãn Bá Rin.

---
© 2026 FitVision 3D Team. Bản quyền thuộc về Nhóm Đồ án C1SE.12.
