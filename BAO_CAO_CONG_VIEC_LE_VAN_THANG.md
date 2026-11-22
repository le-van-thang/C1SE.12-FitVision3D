# 📋 BÁO CÁO CÔNG VIỆC THỰC HIỆN ĐỒ ÁN CAPSTONE FITVISION 3D
> **Người thực hiện:** Lê Văn Thắng (`levanthangdev`)  
> **Nhánh làm việc chính:** `integrate/fe-model`  
> **Dự án:** FitVision 3D (C1SE.12) – Hệ Thống Đo Nhân Trắc Học 3D & May Đo Thông Minh Theo Chuẩn ISO 8559  
> **Ngày cập nhật:** Tháng 11/2026  

---

## 🎯 TỔNG QUAN NHANH (Tóm tắt cho Team)

Toàn bộ phần việc Thắng phụ trách và đã hoàn thành tập trung vào **Frontend 3D, Luồng trải nghiệm người dùng (UX/UI), Phòng Thử Đồ Ảo (Virtual Studio 3D), Hệ thống Đo Nhân Trắc Học 3D (`/dashboard`), Kênh Nhà May (`/shop`) và Cổng Quản Trị Admin (`/admin`)**.

Mã nguồn được biên dịch sạch lỗi TypeScript 100% (`tsc -b && vite build` exit 0), đã đẩy đầy đủ lên nhánh GitHub `integrate/fe-model`.

---

## 🛠️ CHI TIẾT CÁC PHẦN VIỆC ĐÃ CODE & HOÀN THÀNH

### 1. 👗 Phòng Thử Đồ Ảo 3D Cao Cấp (`VellVirtualStudioModal.tsx`)
- **Phòng thử đồ riêng theo từng Shop (Shop-Linked Fitting Rooms):**
  - Khi khách hàng bấm "Thử đồ 3D" ở bất kỳ sản phẩm nào trên sàn, phòng thử đồ sẽ mở đúng phòng của Shop đó (`Nordic Thread`, `Sartoria Milan`, `Atelier 12`, `VELL Atelier`...).
  - Có thanh chọn chuyển đổi giữa các phòng của các Shop đối tác.
- **Tự động đồng bộ mô hình Nam ↔ Nữ (`male_base` ↔ `female_base`):**
  - Tự động nhận diện giới tính của khách hàng để tải mô hình 3D Nam hoặc Nữ tương ứng.
  - Có nút chuyển đổi trực tiếp `Nam | Nữ` ngay trên thanh tiêu đề Studio để xem trước phom dáng.
- **Mô phỏng độ vừa vặn từng Size (`XS, S, M, L, XL`):**
  - Tính toán độ dư vải may mặc thực tế (`Ease Allowance`): Độ dư Ngực, Độ dư Eo, Độ dư Hông theo chuẩn may đo.
  - Vòng đo 3D đổi màu trực quan:
    - 🟢 **Xanh lá**: Vừa đẹp (`+1.5` đến `+8.5 cm`).
    - 🔵 **Xanh dương**: Rộng / thoải mái (`> +8.5 cm`).
    - 🔴 **Đỏ hồng**: Kích / chật (`< +1.5 cm`).
- **Phân định rõ 3 chế độ hiển thị chuyên nghiệp:**
  - `Mô Phỏng 3D`: Mannequin 3D Three.js xoay 360°, co giãn theo số đo thật, kiểm tra độ vừa vặn từng vòng.
  - `Mẫu Gốc`: Trình diễn Lookbook người mẫu mặc hoàn chỉnh trang phục của shop với hiệu ứng quét laser ánh sáng (`Laser Scan Wipe`) chuyển đồ cực kỳ mượt mà.
  - `Ảnh Cá Nhân`: Hiển thị ảnh người dùng đã tách nền AI đứng trong phòng Studio Loft, kèm nút chuyển nhanh sang quét lấy số đo 3D.

---

### 2. 📏 Bảng Điều Khiển & Phòng Đo Nhân Trắc Học 3D (`/dashboard`)
- **Tương tác Mô hình 3D Mannequin (Three.js WebGL):**
  - Tái tạo dáng người chuẩn giải phẫu (A-Pose Nam và T-Pose Nữ), xoay 360°, phóng to/thu nhỏ.
  - Dây dóng chỉ thị kích thước động (Leader wires): Nối chính xác từ các vòng đo trên cơ thể 3D sang danh sách số đo hai bên, tự động cập nhật khi xoay hoặc zoom.
- **Hệ thống 11 số đo nhân trắc học chuẩn ISO 8559-1:**
  - Vòng ngực, vòng eo, vòng mông/hông, rộng vai, dài tay áo, dài chân trong (inseam), vòng bắp tay, vòng cổ tay, vòng đùi, vòng bắp chân, vòng cổ chân.
  - Tự động lưu trữ đồng bộ bền vững (`localStorage` / Supabase / Backend API), không bị mất số đo khi chuyển trang hoặc F5.
- **Tách nền AI MediaPipe & Canvas Fallback:**
  - Tích hợp Google MediaPipe `SelfieSegmentation` trên server Python (`app.py` endpoint `/api/v1/segment-person`) tách sạch sàn nhà và vật thể phụ.
  - Có sẵn thuật toán Canvas Fallback chạy mượt trên trình duyệt khi chưa bật server Python.
- **Trải nghiệm chụp & đo ảnh linh hoạt:**
  - Bổ sung nút **"Chụp / Đổi ảnh"** trực tiếp (không bắt người dùng phải bấm Xóa ảnh thủ công).
  - Khung hiệu chuẩn Chiều cao & Cân nặng gợi ý thông minh, không chặn thao tác người dùng.
  - Bố cục 3 cột đối xứng sang trọng, đồng bộ tông màu đen xám Luxury `#14171C` và `#F7F7F5`.

---

### 3. 🌐 Sàn Thời Trang May Đo (Storefront) & Bảng Kích Cỡ (`/size-charts`)
- **Cơ chế gợi ý kích cỡ thông minh (Smart Size Recommendation):**
  - Đọc trực tiếp số đo của khách vừa quét từ `/dashboard` để gợi ý size chuẩn cho từng áo sơ mi, polo, blazer, quần tây, đầm.
  - Tự động ẩn các size giả lập khi khách hàng chưa quét số đo thật.
- **Trang Bảng Kích Cỡ (`/size-charts`):**
  - Mở khóa cho tất cả người dùng tra cứu bảng size áo/quần chuẩn Việt Nam và Quốc tế.
  - Luồng điều hướng khép kín mượt mà: `Sàn Thời Trang ⟷ Bảng Điều Khiển 3D ⟷ Phòng Thử Đồ 3D ⟷ Bảng Kích Cỡ`.

---

### 4. 🏪 Kênh Người Bán / Nhà May Đối Tác (`/shop` - Seller Center)
- **Quản lý sản phẩm thời trang may đo:**
  - Đăng tải sản phẩm mới kèm video giới thiệu, nhiều biến thể Màu sắc và Size (`XS - XL`).
  - Tự động gán thông số kích thước chi tiết (ngực, eo, mông, dài áo) cho từng biến thể.
  - Tính năng bật/tắt giảm giá kèm xem trước giá bán trên Storefront theo thời gian thực.
- **Đăng ký mở Shop B2B & Chống Spam:**
  - Biểu mẫu nộp hồ sơ pháp lý (Mã số thuế, Giấy phép kinh doanh) tự động đồng bộ sang PostgreSQL.
  - Tích hợp bộ lọc chống spam tự động (Rate limit 10 lượt/phút, bảo vệ form đăng ký).

---

### 5. 🛡️ Cổng Quản Trị Doanh Nghiệp Admin Portal (`/admin`) & Bảo Mật
- **Cách ly hoàn toàn cổng Quản Trị `/admin`:**
  - Không để lộ đăng nhập qua Google OAuth cho Admin (chỉ dùng Email nội bộ + Mật khẩu + Mã xác thực 2FA OTP qua Gmail).
  - Ngăn chặn lỗi nhấp nháy giao diện Storefront khi Admin đăng nhập.
- **Phê duyệt Shop & Nhà May:**
  - Giao diện xem xét minh chứng pháp lý và duyệt mở Shop đối tác trên PostgreSQL.
- **Cam kết Quyền Riêng Tư (Privacy-First):**
  - Loại bỏ các thuật ngữ kỹ thuật khó hiểu (RAM tạm thời), thay bằng cam kết chuẩn: *"Ảnh chụp chỉ dùng để phân tích số đo và tự động xóa ngay lập tức, không lưu trữ ảnh cá nhân lên máy chủ"*.

---

## 📂 DANH SÁCH CÁC FILE CHÍNH ĐÃ CAN THIỆP & PHÁT TRIỂN

| STT | Tệp tin | Vai trò chính |
| :---: | :--- | :--- |
| **1** | `src/features/ecommerce/VellVirtualStudioModal.tsx` | Toàn bộ logic Phòng Thử Đồ Ảo 3D, chuyển Shop, đổi Nam/Nữ, đo độ dư vải Ease |
| **2** | `src/features/avatar3d/MannequinViewer.tsx` | Trình diễn mô hình 3D Three.js, dóng dây thước đo động, phủ phom dáng 3D |
| **3** | `src/features/capture/PhotoUploadCapture.tsx` | Giao diện nạp ảnh, chụp ảnh camera, đổi ảnh, tách nền và hiệu chuẩn chiều cao |
| **4** | `src/features/ecommerce/FashionStoreHome.tsx` | Trang chủ sàn thời trang, gợi ý size theo số đo khách hàng, liên kết Studio |
| **5** | `src/features/merchant/SellerCenterDashboard.tsx` | Kênh người bán, quản lý sản phẩm, biến thể màu/size, video sản phẩm |
| **6** | `src/utils/personSegmentation.ts` | Thuật toán bóc tách người dùng (MediaPipe API + Canvas Fallback) |
| **7** | `app.py` | Bổ sung API FastAPI `POST /api/v1/segment-person` sử dụng Google MediaPipe |
| **8** | `src/features/sizechart/SizeChartHubPage.tsx` | Bảng kích cỡ may mặc đa hệ, hướng dẫn chọn size chuẩn ISO |

---

## 🚀 HƯỚNG DẪN CHẠY DỰ ÁN ĐỂ TEST ĐẦY ĐỦ

```bash
# 1. Cài đặt thư viện (nếu chưa cài)
npm install

# 2. Khởi động Frontend (React 18 + Vite)
npm run dev
# Truy cập: http://localhost:5173

# 3. (Tùy chọn) Chạy trọn gói cả Frontend + Backend AI Python (MediaPipe & SMPL-X)
npm run dev:full
# Hoặc chạy riêng AI backend: python app.py (Cổng 8000)
```

> **Ghi chú cho các bạn trong nhóm:**  
> Mọi chức năng trên đều đã test cẩn thận, biên dịch không có bất kỳ lỗi nào. Nếu các bạn cần kéo code mới nhất về chỉ cần:
> ```bash
> git fetch origin
> git checkout integrate/fe-model
> git pull origin integrate/fe-model
> ```
