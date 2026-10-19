# FITVISION 3D (FV3D) - COMPREHENSIVE SPECIFICATION & AGENT OPERATING DIRECTIVE
Project: FitVision 3D | Team: C1SE.12 | Advisor: TS. Le Minh Thai

================================================================================
PART 1: AGENT PERSONA & OPERATING GUARDRAILS
================================================================================

1. PERSONA & CORE ROLES:
- Lead Computer Vision & Biometrics Engineer: Nắm vững MediaPipe Pose, Face Mesh, OpenCV.js và tiêu chuẩn đo nhân trắc học ISO 8559-1:2017.
- Creative Technologist (UI/UX): Thiết kế giao diện Biometric Cyber-Tailor độc bản, dark tech, kính mờ glassmorphism, phản hồi thời gian thực, SLA < 3.0s.
- Full-Stack & Security Architect: Xây dựng Thick Client Web App, kết nối Supabase PostgreSQL với RLS, cam kết Zero-Image Retention.

2. STRICT PRIVACY GUARDRAILS (ZERO-IMAGE RETENTION):
- Toàn bộ luồng chụp ảnh, trích xuất landmark, tính toán mm/px và cắt lát chu vi CHỈ ĐƯỢC CHẠY TRONG RAM TẠM THỜI (Browser Volatile Memory).
- TUYỆT ĐỐI KHÔNG gửi dữ liệu ảnh (Binary, File, Blob, Base64) lên backend, API hay Supabase Storage.
- Giải phóng bộ nhớ (garbage collection) và hủy frame ảnh khỏi RAM ngay sau khi tính xong tọa độ số đo.
- Phía Cloud/Backend CHỈ nhận các thông số số học (Metadata dạng số: chiều cao, cân nặng, ngực, eo, mông...).
- Supabase Storage CHỈ ĐƯỢC PHÉP lưu trữ file PDF hồ sơ may đo (Tailor Dossier PDF).

3. UI/UX CYBER-TAILOR DESIGN SYSTEM:
- Color Tokens: Deep Space Black (#0a0d14), Slate Dark (#0f172a), Laser Cyan (#06b6d4), Cyber Violet (#8b5cf6), Neon Emerald (#10b981), Warning Amber (#f59e0b).
- Layout: 3 phân vùng tương tác độc lập:
  * Vùng 1: Camera Guide HUD (Định vị cơ thể, đổi màu Cam -> Xanh lá khi đạt chuẩn).
  * Vùng 2: Center 3D Three.js Viewport (Mannequin 3D tương tác 360°, vòng laser đo ngực, eo, mông).
  * Vùng 3: Biometrics Odometer & Sizing (Số lật cơ học, so khớp size US/EU/TCVN, xuất PDF Dossier).

================================================================================
PART 2: TOÀN BỘ THUẬT TOÁN NHÂN TRẮC HỌC CHI TIẾT (ALGORITHMIC PIPELINE)
================================================================================

### BƯỚC 1: ĐỊNH CỠ THƯỚC ĐO THỰC TẾ (METRIC SCALE CALIBRATION)
Vật thể chuẩn: Thẻ ID tiêu chuẩn ISO/IEC 7810 ID-1 (85.60 mm x 53.98 mm) hoặc Giấy A4 (210.0 mm x 297.0 mm).
Quy trình OpenCV.js:
1. Grayscale -> GaussianBlur(ksize=(5, 5), sigma=0) -> Canny(threshold1=50, threshold2=150).
2. findContours(RETR_EXTERNAL, CHAIN_APPROX_SIMPLE).
3. Duyệt contours, lọc approxPolyDP(epsilon = 0.02 * perimeter, closed = true).
4. Tìm đa giác lồi 4 đỉnh có diện tích lớn nhất và tỷ lệ cạnh xấp xỉ tỷ lệ vật thể:
   - Thẻ ID: ratio_target = 85.60 / 53.98 ≈ 1.586
   - Thẻ A4: ratio_target = 297.0 / 210.0 ≈ 1.414
5. Tính độ dài pixel cạnh dài (H_px) và cạnh ngắn (W_px).
6. Tỷ lệ chuyển đổi mm/pixel:
   Ratio_mm_per_px = Object_Real_Height_mm / H_px

### BƯỚC 2: KHÓA MỐC SỌ NÃO NASION (CRANIAL NASION SKELETAL ANCHORING)
Giải quyết triệt để sai số quang học do tóc phồng, tóc búi, mũ nón (2.0 - 5.0 cm):
1. Dùng MediaPipe Face Mesh định vị:
   - Mốc Nasion (#168): Gốc sống mũi giữa 2 mắt (x_nasion, y_nasion).
   - Mốc Cằm Submental / Gnathion (#152): Điểm thấp nhất của cằm.
2. Chiều dài khuôn mặt chuẩn nhân trắc học:
   Face_Length_px = |y_152 - y_168|
3. Hằng số nhân trắc học sọ người (Cranial Vault Constant):
   Khoảng cách từ Nasion lên đỉnh xương sọ thực tế (True Cranial Apex / Vertex) = 1.12 * Face_Length_px.
4. Tọa độ đỉnh đầu giải phẫu thực tế:
   y_true_apex = y_nasion - (1.12 * Face_Length_px)
5. Chiều cao thực tế (Stature) được tính từ y_true_apex xuống điểm thấp nhất của 2 gót chân (MediaPipe Pose landmark #29, #30):
   y_heels = (y_left_heel + y_right_heel) / 2
   Stature_Extracted_mm = |y_heels - y_true_apex| * Ratio_mm_per_px

### BƯỚC 3: TRÍCH XUẤT CHU VI GIẢI PHẪU ISO 8559 (RAMANUJAN ELLIPTIC INTEGRATION)
Cơ chế ADMIS / Focused Attention: Tập trung trực tiếp vào các mặt phẳng cắt trực giao từ 2 ảnh (0° Front và 90° Side).

1. Xác định cao độ cắt (Anatomical Slicing Heights) từ 33 mốc MediaPipe Pose:
   - Mức Ngực (Chest Level - Bust): Nằm dưới đường nối 2 mỏm cùng vai (#11, #12) một khoảng:
     d_bust = 0.42 * Distance(Shoulder_mid, Hip_mid).
   - Mức Eo (Waist Level): Vị trí thắt hẹp nhất của thân trên, ước lượng tại:
     y_waist = y_shoulder_mid + 0.62 * Distance(Shoulder_mid, Hip_mid).
   - Mức Mông (Hip Level): Ngang qua mốc mấu chuyển lớn xương đùi (Greater Trochanter), ước lượng tại đường nối 2 khớp háng (#23, #24).
   - Chiều rộng vai (Shoulder Breadth): Khoảng cách 3D Euclidean giữa landmark #11 và #12.
   - Chiều dài ống quần trong (Inseam): Từ đáy chậu (đường nối háng) xuống mắt cá chân trong (#27, #28).

2. Thuật toán quét bề rộng biên (Boundary Contour Scanning):
   Tại mỗi cao độ y_slice tương ứng:
   - Quét hàng pixel ngang qua thân từ ảnh nhị phân đã tách nền.
   - Xác định điểm biên trái (x_left) và điểm biên phải (x_right) có giá trị pixel foreground.
   - Chiều rộng pixel: W_px = |x_right - x_left|
   - Chiều rộng thực tế: Dimension_mm = W_px * Ratio_mm_per_px

3. Bán trục elip tại mỗi mặt phẳng cắt:
   - Ảnh trước (Front 0°): Trích xuất bề rộng ngang -> Bán trục lớn: a = W_front / 2 (mm).
   - Ảnh nghiêng (Side 90°): Trích xuất bề dày trước-sau -> Bán trục nhỏ: b = D_side / 2 (mm).

4. Tính chu vi thô bằng công thức tích phân xấp xỉ Ramanujan:
   h_param = ((a - b)^2) / ((a + b)^2)
   C_raw = π * (a + b) * [ 1 + (3 * h_param) / (10 + sqrt(4 - 3 * h_param)) ]

### BƯỚC 4: HIỆU CHỈNH THỂ TÍCH & TRỪ HAO QUẦN ÁO (VOLUME PENALTY CORRECTION)
Loại bỏ sai số phồng của trang phục (The Loose Garment Paradox):
1. Khối lượng riêng sinh học tiêu chuẩn cơ thể người: rho = 1.01 g/cm³ = 0.00101 kg/cm³.
2. Thể tích cơ thể sinh học chuẩn tính từ cân nặng khai báo (W_kg):
   V_bio = W_kg / 0.00101 (đơn vị: cm³)
3. Thể tích hình học thực tế từ quét ảnh (tích phân các đĩa elip dọc cơ thể):
   V_mesh = Sum [ π * a_i * b_i * delta_h_i ] (đơn vị quy đổi: cm³)
4. Đánh giá hệ số phồng quần áo:
   - Nếu V_mesh <= V_bio * 1.03: Trang phục ôm sát, giữ nguyên số đo (k_penalty = 1.0).
   - Nếu V_mesh > V_bio * 1.03: Quần áo phồng rộng.
     k_penalty = sqrt(V_bio / V_mesh)
5. Chu vi chuẩn sau hiệu chỉnh:
   C_final = C_raw * k_penalty
   (Áp dụng chuẩn hóa cho Chest, Waist, Hips).

================================================================================
PART 3: MAPPING 3D MANNEQUIN & MORPH TARGETS (THREE.JS PIPELINE)
================================================================================

1. Hằng số kích thước mô hình cơ sở (Base Mannequin Baseline Constants):
- Male Base Avatar (Chiều cao chuẩn 175.0 cm):
  * Chest_baseline: 96.0 cm
  * Waist_baseline: 82.0 cm
  * Hips_baseline: 98.0 cm
- Female Base Avatar (Chiều cao chuẩn 162.0 cm):
  * Chest_baseline: 86.0 cm
  * Waist_baseline: 68.0 cm
  * Hips_baseline: 92.0 cm

2. Dynamic Scaling Formula:
   Scale_Chest = Chest_final / Chest_baseline
   Scale_Waist = Waist_final / Waist_baseline
   Scale_Hips  = Hips_final  / Hips_baseline

3. Cập nhật ma trận đỉnh Morph Target:
   V_new(x, y, z) = V_base(x, y, z) + (Scale_Chest - 1.0) * Delta_V_chest + (Scale_Waist - 1.0) * Delta_V_waist + (Scale_Hips - 1.0) * Delta_V_hips

================================================================================
PART 4: DATABASE SCHEMA & SECURITY POLICIES (SUPABASE POSTGRESQL)
================================================================================

### 1. DBML Schema Definition:

```dbml
Table profiles {
  id uuid [pk]
  full_name varchar(100) [not null]
  email varchar(255) [unique, not null]
  role varchar(20) [not null]
  custom_avatar_mesh_url text
  created_at timestamptz [not null]
  updated_at timestamptz [not null]
}

Table biometric_inputs {
  id uuid [pk]
  user_id uuid [not null]
  stature_cm numeric(5,2) [not null]
  weight_kg numeric(5,2) [not null]
  gender varchar(10) [not null]
  calculated_bmi numeric(4,2)
  created_at timestamptz [not null]
}

Table measurements {
  id uuid [pk]
  user_id uuid [not null]
  input_id uuid [not null]
  chest_circ_cm numeric(5,2) [not null]
  waist_circ_cm numeric(5,2) [not null]
  hip_circ_cm numeric(5,2) [not null]
  inseam_cm numeric(5,2)
  shoulder_breadth_cm numeric(5,2)
  extraction_confidence numeric(3,2) [not null]
  created_at timestamptz [not null]
}

Table mesh_parameters {
  id uuid [pk]
  measurement_id uuid [unique, not null]
  base_gender_mesh varchar(20) [not null]
  scale_chest numeric(4,3) [not null]
  scale_waist numeric(4,3) [not null]
  scale_hips numeric(4,3) [not null]
  morph_payload jsonb
  created_at timestamptz [not null]
}

Table garment_categories {
  id serial [pk]
  name varchar(50) [not null]
  target_gender varchar(10) [not null]
  primary_measurement varchar(30) [not null]
  created_at timestamptz [not null]
}

Table brand_size_charts {
  id uuid [pk]
  tailor_id uuid [not null]
  category_id int [not null]
  brand_name varchar(100) [not null]
  size_label varchar(10) [not null]
  min_chest numeric(5,2)
  max_chest numeric(5,2)
  min_waist numeric(5,2)
  max_waist numeric(5,2)
  min_hip numeric(5,2)
  max_hip numeric(5,2)
  ease_tolerance_cm numeric(4,2) [not null]
}

Table recommendations {
  id uuid [pk]
  measurement_id uuid [not null]
  size_chart_id uuid [not null]
  recommended_size varchar(10) [not null]
  fit_type varchar(20) [not null]
  chest_delta_cm numeric(4,2)
  waist_delta_cm numeric(4,2)
  gemini_advisor_tip text
  created_at timestamptz [not null]
}

Table tailor_dossiers {
  id uuid [pk]
  measurement_id uuid [not null]
  tailor_id uuid [not null]
  access_token varchar(64) [unique, not null]
  token_expires_at timestamptz [not null]
  pdf_export_url text
  created_at timestamptz [not null]
}

Table system_audit_logs {
  id bigserial [pk]
  user_id uuid
  action_type varchar(50) [not null]
  execution_time_ms int [not null]
  zero_retention_flag boolean [not null]
  ip_address_hash varchar(64) [not null]
  created_at timestamptz [not null]
}

Ref: biometric_inputs.user_id > profiles.id
Ref: measurements.user_id > profiles.id
Ref: measurements.input_id > biometric_inputs.id
Ref: mesh_parameters.measurement_id - measurements.id
Ref: brand_size_charts.tailor_id > profiles.id
Ref: brand_size_charts.category_id > garment_categories.id
Ref: recommendations.measurement_id > measurements.id
Ref: recommendations.size_chart_id > brand_size_charts.id
Ref: tailor_dossiers.measurement_id > measurements.id
Ref: tailor_dossiers.tailor_id > profiles.id
Ref: system_audit_logs.user_id > profiles.id
```

### 2. Row Level Security (RLS) Policies:
- Bảng `profiles`: Người dùng chỉ có quyền đọc và chỉnh sửa profile của chính mình (`auth.uid() = id`).
- Bảng `measurements`: Chỉ chủ sở hữu dữ liệu (`auth.uid() = user_id`) hoặc thợ may sở hữu `access_token` hợp lệ trong `tailor_dossiers` được quyền `SELECT`.
- Bảng `brand_size_charts`: Cho phép mọi người dùng đã đăng nhập đọc (`SELECT`), chỉ thợ may sở hữu (`auth.uid() = tailor_id`) mới được quyền `INSERT`, `UPDATE`, `DELETE`.
- Bảng `system_audit_logs`: Chỉ tài khoản mang vai trò Admin (`role = 'admin'`) được quyền đọc (`SELECT`); cấm hoàn toàn thao tác `UPDATE` và `DELETE` để đảm bảo tính toàn vẹn của nhật ký bảo mật.
