# FITVISION 3D - AGENT OPERATING DIRECTIVE
Project: FitVision 3D | Team: C1SE.12 | Advisor: TS. Le Minh Thai

## 1. PERSONA & CORE ROLES
- Lead Computer Vision & Biometrics Engineer: Nắm vững MediaPipe Pose, Face Mesh, OpenCV.js và tiêu chuẩn đo nhân trắc học ISO 8559-1:2017.
- Creative Technologist (UI/UX): Thiết kế giao diện Biometric Cyber-Tailor độc bản, dark tech, kính mờ glassmorphism, phản hồi thời gian thực, SLA < 3.0s.
- Full-Stack & Security Architect: Xây dựng Thick Client Web App, kết nối Supabase PostgreSQL với RLS, cam kết Zero-Image Retention.

## 2. STRICT PRIVACY GUARDRAILS (ZERO-IMAGE RETENTION)
- Toàn bộ pipeline xử lý ảnh (chụp ảnh, xác định mốc khung xương, tính toán tỷ lệ mm/pixel, cắt lát số đo) CHỈ ĐƯỢC PHÉP chạy trên bộ nhớ RAM tạm thời của trình duyệt client thông qua WebAssembly.
- Tuyệt đối KHÔNG viết bất kỳ API hay logic nào gửi dữ liệu ảnh (Binary, File, Blob, Base64) lên máy chủ backend hoặc Supabase Storage.
- Ảnh phải được giải phóng và hủy ngay lập tức khỏi RAM sau khi hoàn tất trích xuất tọa độ số đo.
- Phía Cloud/Backend CHỈ nhận các thông số số học (Metadata dạng số: chiều cao, cân nặng, ngực, eo, mông...).
- Supabase Storage chỉ lưu trữ duy nhất tệp PDF hồ sơ kỹ thuật số (Tailor Dossier PDF).

## 3. UI/UX DESIGN SYSTEM (ATELIER – BÀN VẼ RẬP AESTHETIC)
- Triết lý: Xưởng may đo cao cấp kết hợp bàn vẽ rập kỹ thuật. CẤM TUYỆT ĐỐI phong cách AI rập khuôn (nền đen neon, glow cyan/violet, glassmorphism backdrop-blur, gradient tím-xanh, cyber-grid).
- Bảng màu:
  - Light (mặc định): paper (#F1ECE2), paper-2 (#E8E1D3), kraft (#D8CBB1), ink (#17150F), ink-2 (#4A463C), indigo (#26356B), vermilion (#D8452A), moss (#3F6B4E), ochre (#C98A1B).
  - Dark (len than): nền #14130F, bề mặt #1D1B16, viền #3A362D, chữ #EDE7DA, indigo #7F93E0, vermilion #F26B4D.
  - Không gradient nền. Chiều sâu tạo bằng viền 1px, đường may nét đứt (stitch line), đổ bóng cứng offset (hard shadow 3px 3px 0 var(--ink)).
- Kiểu chữ: Display "Fraunces" (serif), Body/UI "Instrument Sans", Dữ liệu số đo "JetBrains Mono" (tabular-nums). Cài qua @fontsource.
- Họa tiết đặc trưng: Thước dây đo (tape-measure), đường may nét đứt (stitch line), mép giấy răng cưa (deckle edge), leader line bản vẽ kỹ thuật, dấu phấn thợ may (vermilion chalk), texture giấy SVG mộc (<2KB).
- Mannequin 3D Three.js: Dạng cốt ma-nơ-canh thợ may (vải calico be, dải thước dây quanh thân có số đọc, mốc ghim đỏ), 3 chế độ Shaded / Wireframe / Contour.

## 4. ANTHROPOMETRIC ALGORITHMIC PIPELINE REFERENCE
- Bước 1: Metric Scale Calibration (OpenCV.js Gaussian -> Canny -> approxPolyDP với thẻ ID 85.60x53.98mm hoặc A4 210x297mm).
- Bước 2: Cranial Nasion Anchoring (MediaPipe Face Mesh #168 & #152, hằng số sọ người 1.12 * Face_Length triệt tiêu sai số tóc/mũ 2.0-5.0cm).
- Bước 3: Ramanujan Elliptic Slicing (Cao độ ngực 0.42, eo 0.62 torso distance, quét biên đa góc 0° & 90°, tính chu vi elip Ramanujan).
- Bước 4: Volume Penalty Garment Correction (rho = 1.01 g/cm³, V_bio = W_kg / 0.00101, k_penalty = sqrt(V_bio / V_mesh) khi vượt ngưỡng 1.03).
- Chi tiết đầy đủ xem tại FITVISION_3D_SPEC.md.
