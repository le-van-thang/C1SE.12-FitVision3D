# NHẬT KÝ THAY ĐỔI & HỢP NHẤT HỆ THỐNG FITVISION 3D
**Ngày cập nhật:** 03/11/2026 - 04/11/2026  
**Nhánh thực hiện:** `anhtai`  
**Dự án:** FitVision 3D / Fashion3D  
**Người thực hiện:** Thái Anh Tài (hỗ trợ bởi AI Assistant)

---

## 1. TỔNG QUAN CÔNG VIỆC THỰC HIỆN
Trong phiên làm việc này, toàn bộ mã nguồn của nhóm (bao gồm Frontend của bạn Quỳnh, mô hình 3D của bạn Thắng trên `upstream/main`, cùng phân hệ Backend và AI Core) đã được tích hợp hoàn chỉnh thành một thể thống nhất, giải quyết triệt để các xung đột Git, cấu trúc lại theo mô hình Monorepo chuẩn doanh nghiệp, và bổ sung các tính năng xác thực nâng cao.

---

## 2. CHI TIẾT CÁC THAY ĐỔI THEO TỪNG PHÂN HỆ

### 2.1. Đồng bộ và Giải quyết Xung đột Git (Merge Code)
- Xóa bỏ các tệp xung đột cũ unstaged (`.gitignore`, `README.md`, `.agents/rules/FITVISION_RULES.md`).
- Hợp nhất thành công `upstream/main` (commit `6e1e91b` - thay thế mô hình 3D mannequin thực tế).
- Hợp nhất thành công `upstream/Quỳnh` (commit `b0c78a5` - giao diện Auth Modal, Language Switcher, Admin Portal) vào nhánh làm việc `anhtai` với **0 xung đột**.

### 2.2. Phân hệ Backend API (`AI-Tailor/backend/`)
- **Bổ sung API Quên mật khẩu & Đặt lại mật khẩu**:
  - `POST /api/v1/auth/forgot-password`: Kiểm tra email, phát sinh mã OTP 6 số (môi trường dev: `123456`).
  - `POST /api/v1/auth/reset-password`: Xác thực OTP, cập nhật mật khẩu mới băm bằng Bcrypt (salt cost $\ge 12$).
- **Bổ sung API Đăng nhập với Google**:
  - `POST /api/v1/auth/google`: Tiếp nhận thông tin tài khoản Google hoặc Google ID Token, kiểm tra tài khoản, cấp phát Access Token (JWT 15 phút) và Refresh Token (Cookie HttpOnly an toàn).
- **Lưu trữ dữ liệu bền vững (Dev Disk Storage)**:
  - Bổ sung cơ chế tự động lưu tài khoản vào `backend/.data/dev_store.json` giúp tài khoản của người dùng không bị mất khi khởi động lại server.
- **Khả năng tương thích mật khẩu**:
  - Tự động nhận diện và xử lý linh hoạt ký tự `$` và `S` do tính năng Google Password Manager tự động điền (`lienxo1970$@` $\leftrightarrow$ `lienxo1970S@`).

### 2.3. Phân hệ Frontend React (`AI-Tailor/src/`)
- **API Client (`src/services/authApi.ts`)**:
  - Viết toàn bộ hàm giao tiếp API thực tế với `http://localhost:5000/api/v1/auth` sử dụng `credentials: 'include'`.
- **Quản lý trạng thái (`src/context/AuthContext.tsx`)**:
  - Đồng bộ các hàm `signIn`, `register`, `verifyEmail`, `forgotPassword`, `resetPassword`, `signInWithGoogle`, `signOut`.
  - Tự động map role từ Backend (`USER` $\rightarrow$ `user`, `ADMIN` $\rightarrow$ `admin`, `SHOP_OWNER` $\rightarrow$ `store`).
- **Giao diện Đăng nhập/Đăng ký (`src/components/auth/AuthModal.tsx`)**:
  - Nút **"Quên mật khẩu?"** dẫn vào giao diện nhập email và mã OTP 6 số.
  - Giao diện **Kích hoạt tài khoản bằng mã OTP** khi tài khoản mới đăng ký.
  - Nút **"Đăng nhập với Google"** sử dụng chuẩn `Google OAuth 2.0 Token Client` (`prompt: 'select_account'`), bật cửa sổ popup chính thức của `accounts.google.com` cho phép người dùng lựa chọn tài khoản Google thật.

### 2.4. Phân hệ AI Measurement Core (`AI-Tailor/ai-service/` & `AI-Tailor/app.py`)
- Cấu hình server FastAPI chạy trên cổng `8000` với mô hình học sâu **SMPLer-X và ViTPose** được tăng tốc phần cứng bằng **NVIDIA CUDA GPU**.
- Trích xuất 8 số đo nhân trắc học theo chuẩn quốc tế **ISO 8559** từ ảnh chụp toàn thân dáng chữ A.

### 2.5. Tái Cấu Trúc Dự Án (Chuẩn Doanh Nghiệp Monorepo)
- Đưa các thư mục quan trọng gồm `backend/`, `database/`, `docs/` vào bên trong thư mục Git `AI-Tailor/` để toàn bộ mã nguồn được Git theo dõi và bảo vệ khi push.
- Dọn dẹp thư mục thừa `.agents` và tệp trùng lặp `SKILL (1).md`.
- Cấu hình file `.gitignore` nghiêm ngặt:
  - Bỏ qua toàn bộ file chứa thông tin nhạy cảm (`.env`, `.env.local`).
  - Bỏ qua thư mục cơ sở dữ liệu nội bộ (`backend/.data/`).
  - Bỏ qua `node_modules/`, `dist/`, `pretrained_models/`.

---

## 3. CÔNG CỤ KHỞI CHẠY HỆ THỐNG MỘT CHẠM (ONE-CLICK COMMANDS)

Trong tệp `package.json`, các lệnh khởi chạy đã được cấu hình tiện lợi:

| Lệnh | Ý nghĩa |
| :--- | :--- |
| `npm start` hoặc `npm run dev:all` | Khởi chạy đồng thời cả **Frontend (port 5173)** và **Backend (port 5000)** trong 1 terminal duy nhất |
| `npm run dev:full` | Khởi chạy trọn vẹn cả 3 tầng: **Frontend (5173) + Backend (5000) + AI Core (8000)** |
| `start_dev.bat` | File kịch bản Windows, chỉ cần double-click để chạy Frontend + Backend |
| `start_full_system.bat` | File kịch bản Windows, double-click để chạy trọn vẹn cả 3 tầng |

---

## 4. QUY TẮC PUSH CODE LÊN GITHUB (BẢO VỆ BẢO MẬT)
- Chỉ thực hiện lệnh `git push` bên trong thư mục `AI-Tailor` trên nhánh `anhtai`.
- File chứa Google Client ID và mật khẩu (`.env`) đã nằm trong `.gitignore`, **tuyệt đối không bao giờ bị đẩy lên GitHub**.
- Nhánh `anhtai` sẵn sàng để gửi Pull Request tới Tech Lead duyệt và hợp nhất vào nhánh `main`.

