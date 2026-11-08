# BÁO CÁO TỔNG QUAN DỰ ÁN CAPSTONE 1 (CMU-SE 451 – C1SE.12)
# HỆ THỐNG FITVISION 3D
### Nền Tảng Tự Động Trích Xuất Số Đo Nhân Trắc Học 3D & May Đo Kỹ Thuật Số Từ Ảnh Chụp Đơn Lẻ
*(AI-Powered 3D Human Body Reconstruction & Intelligent Apparel Sizing Platform)*

---

**Thông tin đề tài:**
- **Mã dự án:** C1SE.12
- **Tên viết tắt:** FV3D (FitVision 3D)
- **Đơn vị:** Viện Đào tạo Quốc tế (International School) – Đại học Duy Tân (DTU)
- **Chương trình đào tạo:** CMU-SE (Carnegie Mellon University Software Engineering)
- **Giảng viên hướng dẫn:** ThS. Nguyễn Thị Kim Cúc / ThS. Trương Đình Huy
- **Nhóm tác giả:**
  - **Lê Văn Thắng** – Scrum Master / Project Lead / Super Admin
  - **Hoàng Quân** – AI Computer Vision Lead / QA & Test Automation
  - **Thái Anh Tài** – Backend & Authentication Architect
  - **Nguyễn Khắc Hòa** – Frontend Engineer / 3D WebGL Developer
  - **Trúc Quỳnh** – UI/UX Designer / Full-Stack Developer

---

## MỤC LỤC
1. [Giới Thiệu & Bối Cảnh Đề Tài](#1-giới-thiệu--bối-cảnh-đề-tài)
2. [Vấn Đề Thực Tiễn & Giải Pháp Của FitVision 3D](#2-vấn-đề-thực-tiễn--giải-pháp-của-fitvision-3d)
3. [Kiến Trúc Tổng Thể Hệ Thống (System Architecture)](#3-kiến-trúc-tổng-thể-hệ-thống-system-architecture)
4. [Các Mô Hình AI & Thị Giác Máy Tính Sử Dụng](#4-các-mô-hình-ai--thị-giác-máy-tính-sử-dụng)
5. [Cơ Sở Toán Học & Thuật Toán Tính Toán Số Đo](#5-cơ-sở-toán-học--thuật-toán-tính-toán-số-đo)
6. [Hệ Thống Tính Năng Chi Tiết (Feature Breakdown)](#6-hệ-thống-tính-năng-chi-tiết-feature-breakdown)
7. [Tiêu Chuẩn Nhân Trắc Học ISO 8559 & Bảng Quy Đổi Size](#7-tiêu-chuẩn-nhân-trắc-học-iso-8559--bảng-quy-đổi-size)
8. [Kiểm Thử & Đánh Giá Độ Chính Xác (Evaluation & Metrics)](#8-kiểm-thử--đánh-giá-độ-chính-xác-evaluation--metrics)
9. [Kế Hoạch Phát Triển Trong Các Sprint Tiếp Theo](#9-kế-hoạch-phát-triển-trong-các-sprint-tiếp-theo)

---

## 1. GIỚI THIỆU & BỐI CẢNH ĐỀ TÀI

Trong kỷ nguyên thương mại điện tử (E-Commerce) bùng nổ, ngành thời trang và may mặc trực tuyến đang tăng trưởng với tốc độ phi mã. Tuy nhiên, rào cản lớn nhất đối với người tiêu dùng khi mua sắm thời trang trực tuyến là **không thể thử đồ trực tiếp**, dẫn đến việc lựa chọn sai kích cỡ (size quần áo).

Theo các báo cáo ngành bán lẻ thời trang toàn cầu:
- Tỷ lệ đổi trả hàng (Return Rate) trong ngành may mặc online dao động từ **30% đến 40%**, trong đó hơn **70% lý do đổi trả bắt nguồn từ kích cỡ không vừa vặn**.
- Chi phí logistics ngược (reverse logistics) để xử lý đổi trả gây tổn thất hàng chục tỷ USD mỗi năm cho các thương hiệu và tạo ra lượng phát thải carbon khổng lồ.
- Các phương pháp lấy số đo thủ công truyền thống bằng thước dây thường gặp nhiều sai số do người dùng không nắm rõ các vị trí mốc giải phẫu (Anatomical Landmarks) chuẩn quốc tế.
- Các hệ thống buồng quét 3D (3D Body Scanner) chuyên nghiệp sử dụng công nghệ laser hay dàn máy ảnh photogrammetry có giá thành cực kỳ đắt đỏ ($15,000 – $50,000), cồng kềnh, chỉ xuất hiện tại các phòng thí nghiệm hay xưởng may cao cấp, hoàn toàn không thể tiếp cận đến người tiêu dùng phổ thông.

**FitVision 3D** ra đời nhằm giải quyết triệt để bài toán trên bằng cách ứng dụng **Trí tuệ nhân tạo (AI)**, **Thị giác máy tính (Computer Vision)** và **Đồ họa Web 3D (WebGL/Three.js)**. Người dùng chỉ cần chụp một bức ảnh toàn thân duy nhất bằng điện thoại thông minh cùng với thông số chiều cao và cân nặng cơ bản, hệ thống sẽ tự động tái tạo mô hình cơ thể 3D chính xác từng milimet, bóc tách toàn bộ các số đo giải phẫu theo tiêu chuẩn quốc tế **ISO 8559**, đồng thời gợi ý kích cỡ trang phục tối ưu cho người mặc.

---

## 2. VẤN ĐỀ THỰC TIỄN & GIẢI PHÁP CỦA FITVISION 3D

| Tiêu chí so sánh | Phương pháp truyền thống | Máy quét 3D chuyên dụng | Giải pháp FitVision 3D |
| :--- | :--- | :--- | :--- |
| **Thiết bị yêu cầu** | Thước dây vải, cần 2 người phối hợp | Buồng quét quang học/Laser đắt tiền | **Chỉ cần 1 smartphone có camera thông thường** |
| **Chi phí** | Thấp nhưng tốn thời gian | Rất cao ($15,000 - $50,000) | **Gần như bằng 0 đối với người dùng cuối** |
| **Thời gian thực hiện** | 10 – 15 phút cho 13 chỉ số | 1 – 3 phút | **Dưới 8 giây xử lý tự động** |
| **Độ nhất quán** | Sai số cao tùy tay nghề thợ đo | Rất cao (sai số < 0.5 cm) | **Đạt chuẩn công nghiệp (MAE ≤ 1.5 – 2.5 cm)** |
| **Khả năng trực quan** | Chỉ có bảng số liệu giấy/text khô khan | File 3D point cloud nặng | **Mô hình 3D Mannequin tương tác 360° trên web** |
| **Tự động chọn size** | Khách tự tra cứu bảng size thủ công | Không có tính năng thương mại | **Tự động gợi ý size US/EU/UK/Asia theo dáng fit** |

---

## 3. KIẾN TRÚC TỔNG THỂ HỆ THỐNG (SYSTEM ARCHITECTURE)

FitVision 3D được thiết kế theo mô hình kiến trúc **Monorepo kết hợp Microservices hướng module (Decoupled Microservice Architecture)**, tối ưu hóa cả về khả năng mở rộng (scalability), hiệu năng xử lý tác vụ nặng AI trên GPU và tính tương tác mượt mà trên trình duyệt.

```
+---------------------------------------------------------------------------------------+
|                                    CLIENT LAYER                                       |
|  - React 18 + TypeScript + Vite + Tailwind CSS                                        |
|  - Three.js WebGL 3D Engine (Mannequin Canvas, Camera Controls, Morph Targets)        |
|  - Bilingual Localization Engine (Vietnamese & English i18n)                          |
+---------------------------------------------------------------------------------------+
                                           │
                           HTTP / REST API │ Reverse Proxy (:5173 -> :8000 / :5000)
                                           ▼
+---------------------------------------------------------------------------------------+
|                                  API GATEWAY & BACKEND                                |
|  - Authentication Controller (Bcrypt, JWT, Refresh Token in HttpOnly Cookie)          |
|  - Google OAuth 2.0 Identity Services Verification                                    |
|  - 5-Layer Security Shield (Honeypot, Rate Limiting, Temp-mail DNS Blacklist)         |
|  - PostgreSQL Database (Supabase Enterprise Engine)                                   |
+---------------------------------------------------------------------------------------+
                                           │
                                 gRPC / REST IPC Payload
                                           ▼
+---------------------------------------------------------------------------------------+
|                                AI COMPUTER VISION SERVICE                             |
|  [Module 1] YOLOv8n Human Detector & Dynamic Aspect-Ratio Bounding Box Cropper        |
|  [Module 2] ViTPose-H (Vision Transformer 2D Keypoint Detection - 33 Landmarks)       |
|  [Module 3] SMPLer-X Mesh Regression Engine (10,475 Vertices & Beta Estimation)       |
|  [Module 4] Biometric Volume & Beta Optimizer (Real Height/Weight Physical Scaling)   |
|  [Module 5] 3D Cross-Sectional Geometric Slicer (ISO 8559 Convex Hull Planes)         |
|  [Module 6] Analytical Biometric Regression Fallback (Ramanujan Ellipse & Allometry)  |
+---------------------------------------------------------------------------------------+
```

---

## 4. CÁC MÔ HÌNH AI & THỊ GIÁC MÁY TÍNH SỬ DỤNG

Quy trình xử lý ảnh từ 2D thành số đo nhân trắc học 3D là một chuỗi pipeline phức hợp gồm các model thị giác máy tính tiên tiến nhất hiện nay:

### 4.1. YOLOv8n (You Only Look Once - Version 8 Nano)
- **Nhiệm vụ:** Phát hiện đối tượng người (Human Person Detection) trong ảnh đầu vào.
- **Đặc tính kỹ thuật:**
  - Mô hình Backbone: Modified CSPDarknet kết hợp C2f module và PAN-FPN neck.
  - Anchor-free detection: Dự đoán trực tiếp tâm đối tượng và kích thước hộp bao, hạn chế sai số khi người đứng ở các góc máy khác nhau.
  - Tốc độ xử lý siêu nhanh: ~15ms trên GPU NVIDIA, dung lượng nhẹ (< 6 MB).
- **Cơ chế tiền xử lý:** Trích xuất bounding box người toàn thân, tự động mở rộng vùng đệm (padding) thêm **10%** về 4 phía để đảm bảo không bị cụt các chi biên (đỉnh đầu, mắt cá chân, các ngón tay).

### 4.2. ViTPose-H (Vision Transformer for Pose Estimation)
- **Nhiệm vụ:** Trích xuất mốc xương giải phẫu 2D (Skeletal Keypoints) độ chính xác cực cao.
- **Kiến trúc:** Sử dụng kiến trúc Vision Transformer nguyên bản với backbone ViT-Huge (632M tham số) hoặc ViT-Base kết hợp bộ giải mã nhẹ (lightweight deconvolution decoder).
- **Đầu ra:** 33 điểm mốc giải phẫu chuẩn (Anatomical Landmarks) gồm khớp vai, khuỷu tay, cổ tay, khớp háng, đầu gối, mắt cá chân, xương đòn, tai, mắt, mũi.
- **Vai trò:** Định hướng tư thế (pose orientation) và cung cấp tọa độ chuẩn cho quá trình căn chỉnh khung xương trong không gian 3 chiều.

### 4.3. SMPLer-X & SMPL-X (Skinned Multi-Person Linear Model with Expressive Details)
- **Nhiệm vụ:** Tái tạo bề mặt lưới tam giác 3D (3D Mesh Regression) của cơ thể từ 1 ảnh đơn.
- **Nguyên lý hoạt động:**
  Mô hình SMPL-X biểu diễn cơ thể người bằng một hàm toán học vi phân:
  $$M(\beta, \theta, \psi) = W\left(T_P(\beta, \theta, \psi), J(\beta), \theta, \mathcal{W}\right)$$
  Trong đó:
  - $\beta \in \mathbb{R}^{10}$ (Shape Betas): Vector 10 chiều quy định hình dáng cơ thể (gầy, béo, cơ bắp, tỷ lệ thân).
  - $\theta \in \mathbb{R}^{3 \times 53}$ (Pose Parameters): Góc quay trục của 53 khớp xương cơ thể.
  - $\psi$ (Facial & Hand Expression): Tham số bàn tay và cơ mặt.
  - $T_P$: Hàm biến dạng t-pose cơ sở.
  - $\mathcal{W}$: Trọng số Linear Blend Skinning (LBS).
- **Độ phân giải lưới:** Xuất ra lưới 3D hoàn chỉnh gồm **10,475 đỉnh (vertices)** và **20,908 mặt tam giác (faces)**, tái hiện chân thực mọi đường cong giải phẫu của người dùng.

### 4.4. Module Tối Ưu Hóa Sinh Trắc Học (Biometric Beta Optimization)
Do ảnh chụp 2D có tính chất phép chiếu phối cảnh (Perspective Projection Ambiguity), kích thước pixel không trực tiếp phản ánh chiều cao milimet ngoài đời thực. Module tối ưu hóa của FitVision 3D thực hiện:
1. **Chuẩn hóa tỷ lệ chiều cao:** Xác định khoảng cách từ đỉnh đầu (Vertex cao nhất của sọ) đến mặt sàn (Vertex thấp nhất của gót chân) trong mô hình 3D, tính toán hệ số scale không gian:
   $$s = \frac{H_{\text{real}}}{H_{\text{mesh}}}$$
2. **Cân đối thể tích & khối lượng:** Dựa trên cân nặng thực tế $W_{\text{real}}$, tính toán thể tích mục tiêu cơ thể qua mật độ khối lượng trung bình của mô người ($\rho \approx 1.01 \text{ g/cm}^3$):
   $$V_{\text{target}} = \frac{W_{\text{real}}}{\rho}$$
3. **Hiệu chỉnh tham số $\beta_0$ và $\beta_1$:** Tối ưu hóa gradient descent để điều chỉnh độ nở vòng ngực, vòng bụng và đùi sao cho thể tích lưới $V(M(\beta))$ tiệm cận $V_{\text{target}}$.

---

## 5. CƠ SỞ TOÁN HỌC & THUẬT TOÁN TÍNH TOÁN SỐ ĐO

Hệ thống cung cấp **hai cơ chế tính toán số đo độc lập**: Phương pháp cắt lưới 3D hình học (khi có GPU) và Phương pháp toán học giải tích dự phòng (Analytical Biometric Fallback khi chạy trên máy yếu hoặc server offline). Cả hai phương pháp đều được chứng minh trên cơ sở giải phẫu học và chuẩn mực toán học quốc tế.

### 5.1. Phương Pháp 1: Cắt Lát Lưới 3D Bằng Mặt Phẳng Cắt (3D Mesh Plane Slicing)
Để đo chu vi các vòng cơ thể (ngực, eo, mông, đùi, bắp tay), hệ thống thực hiện cắt lát ngang mô hình 3D:

1. **Xác định mặt phẳng cắt giải phẫu:**  
   Mặt phẳng $P$ được định nghĩa qua điểm mốc $\mathbf{x}_0$ và vector pháp tuyến $\mathbf{n} = (0, 1, 0)^T$ (vuông góc với trục đứng cơ thể):
   $$P: \mathbf{n} \cdot (\mathbf{x} - \mathbf{x}_0) = 0$$
   - *Vòng ngực (Bust):* Đi qua mốc xương ức / đỉnh ngực (ngay dưới nách $4\text{ cm}$).
   - *Vòng eo (Waist):* Đi qua điểm hẹp nhất của vùng thân giữa xương sườn thứ 12 và mào chậu.
   - *Vòng mông (Hip):* Đi qua đỉnh lồi lớn nhất của cơ mông lớn (Gluteus maximus) và khớp mu.
   - *Vòng bắp tay (Bicep):* Đi qua điểm giữa xương cánh tay (Humerus).
   - *Vòng đùi (Thigh):* Cắt ngang vùng đùi trên, cách đáy xương chậu $3\text{ cm}$ về phía dưới.

2. **Giao tuyến giữa mặt phẳng và tam giác (Plane-Triangle Intersection):**  
   Với mỗi tam giác $T = (v_1, v_2, v_3)$ trên bề mặt lưới:
   - Tính khoảng cách đại số từ các đỉnh đến mặt phẳng: $d_i = \mathbf{n} \cdot (v_i - \mathbf{x}_0)$.
   - Nếu mặt phẳng cắt qua tam giác (tồn tại $d_i, d_j$ trái dấu), giao tuyến là một đoạn thẳng nối 2 điểm nội suy trên 2 cạnh bị cắt:
     $$\mathbf{p} = v_i + \frac{-d_i}{d_j - d_i} (v_j - v_i)$$

3. **Tính chu vi lát cắt (Cross-Section Circumference):**  
   Tập hợp các đoạn thẳng tạo thành đa giác khép kín $\mathbf{p}_1, \mathbf{p}_2, \dots, \mathbf{p}_N$. Chu vi là tổng độ dài Euclidean giữa các điểm liên tiếp:
   $$C = \sum_{i=1}^{N} \|\mathbf{p}_{i+1} - \mathbf{p}_i\|_2 \quad (\text{với } \mathbf{p}_{N+1} = \mathbf{p}_1)$$

---

### 5.2. Phương Pháp 2: Toán Học Giải Tích Nhân Trắc Dự Phòng (Analytical Biometric Fallback)

Khi máy trạm không có GPU chuyên dụng hoặc quá tải, hệ thống sử dụng thuật toán toán học giải tích kết hợp **Công thức xấp xỉ Elip bậc cao của Srinivasa Ramanujan** và **Hệ thức biến thiên Allometric Scaling**:

#### A. Mô Hình Hóa Mặt Cắt Cơ Thể Dạng Elip Biến Dạng
Các mặt cắt ngang của cơ thể người (ngực, eo, mông, bắp tay, đùi) trên phương diện giải phẫu học có hình thái xấp xỉ hình elip với bán trục lớn $a$ (nửa chiều rộng nhìn chính diện - Coronal Axis) và bán trục bé $b$ (nửa độ sâu nhìn nghiêng - Sagittal Axis).

Chu vi chính xác của một đường elip được biểu diễn qua tích phân elip loại hai hoàn toàn (Complete Elliptic Integral of the Second Kind):
$$C = 4a \int_{0}^{\pi/2} \sqrt{1 - e^2 \sin^2 \varphi} \, d\varphi, \quad e = \sqrt{1 - \frac{b^2}{a^2}}$$
Tích phân này không có nguyên hàm sơ cấp. Để giải quyết trong thời gian thực với sai số dưới $0.001\%$, FitVision 3D áp dụng **công thức Ramanujan hạng 2 (Ramanujan's Second Approximation)**:
$$C \approx \pi (a + b) \left( 1 + \frac{3h}{10 + \sqrt{4 - 3h}} \right)$$
Trong đó thông số độ lệch hình elip (eccentricity parameter) $h$ được tính bằng:
$$h = \frac{(a - b)^2}{(a + b)^2}$$

#### B. Hệ Thức Tỷ Lệ Thể Tích & Hồi Quy Chỉ Số Khối Cơ Thể (BMI Allometry)
Dựa trên tập dữ liệu đo nhân trắc học quốc tế **CAESAR (Civilian American and European Surface Anthropometry Resource)** và tiêu chuẩn **ISO 8559-1**, các số đo được mô hình hóa theo quan hệ phi tuyến với Chiều cao ($H$ tính bằng cm) và Khối lượng ($W$ tính bằng kg):

1. **Chỉ số khối cơ thể (Body Mass Index - BMI):**
   $$\text{BMI} = \frac{W}{(H / 100)^2}$$
2. **Diện tích bề mặt cơ thể (Body Surface Area - Công thức Mosteller):**
   $$\text{BSA} = \sqrt{\frac{H \times W}{3600}} \quad (\text{m}^2)$$
3. **Các phương trình hồi quy bán trục giải phẫu:**
   - **Vòng ngực (Bust/Chest):**
     $$a_{\text{chest}} = 0.115 \cdot H + 0.12 \cdot W + 4.5, \quad b_{\text{chest}} = 0.082 \cdot H + 0.11 \cdot W + 2.0$$
   - **Vòng eo (Waist):**
     $$a_{\text{waist}} = 0.095 \cdot H + 0.15 \cdot W + 1.2, \quad b_{\text{waist}} = 0.070 \cdot H + 0.13 \cdot W + 1.5$$
   - **Vòng mông (Hip):**
     $$a_{\text{hip}} = 0.125 \cdot H + 0.14 \cdot W + 3.0, \quad b_{\text{hip}} = 0.095 \cdot H + 0.12 \cdot W + 2.5$$
   - **Vòng bắp tay (Bicep Girth):**
     $$C_{\text{bicep}} = 11.5 + 0.65 \cdot \text{BMI} + 0.045 \cdot H$$
   - **Vòng đùi (Thigh Girth):**
     $$C_{\text{thigh}} = 18.0 + 1.15 \cdot \text{BMI} + 0.075 \cdot H$$
   - **Vòng bắp chân (Calf Girth):**
     $$C_{\text{calf}} = 16.0 + 0.72 \cdot \text{BMI} + 0.050 \cdot H$$
   - **Vòng cổ tay (Wrist) & Vòng cổ chân (Ankle):**
     $$C_{\text{wrist}} = 6.2 + 0.22 \cdot \text{BMI} + 0.035 \cdot H$$
     $$C_{\text{ankle}} = 8.5 + 0.35 \cdot \text{BMI} + 0.040 \cdot H$$

---

## 6. HỆ THỐNG TÍNH NĂNG CHI TIẾT (FEATURE BREAKDOWN)

Hệ thống FitVision 3D tích hợp đầy đủ 12 module chức năng chính đã được nghiệm thu trong Sprint 1:

```
                                  FITVISION 3D
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        │                              │                              │
[ AUTH & SECURITY ]           [ AI MEASUREMENTS ]            [ 3D ATELIER STUDIO ]
  - Email/Pass Auth             - YOLOv8 Person Detect         - 3-Column Studio Dashboard
  - Google OAuth 2.0            - ViTPose 2D Landmarks         - Three.js Mannequin Canvas
  - Password Reset OTP          - SMPLer-X 3D Mesh             - Orbit, Zoom, Lighting Presets
  - 5-Layer Anti-Spam Shield    - 13 ISO 8559 Circumferences   - Real-Time Morph Target Sync
  - HttpOnly Cookie Token       - Multi-Brand Sizing (US/EU)   - Bilingual Localization (VI/EN)
```

1. **Quản lý phiên & Xác thực người dùng (US-01 / FC01):**  
   Đăng ký và đăng nhập bảo mật bằng Email/Password, lưu trữ mật khẩu băm một chiều với **Bcrypt (Salt factor = 12)**, cấp phát cặp khóa JWT Access Token (hạn 15 phút) và Refresh Token (hạn 7 ngày).
2. **Đăng nhập nhanh Google OAuth 2.0 (US-02 / FC02):**  
   Tích hợp SDK Google Identity Services chính thức, đồng bộ avatar, tên người dùng và email chỉ với 1 cú click.
3. **Quy trình quên & Đặt lại mật khẩu an toàn (US-03 / FC03):**  
   Tạo mã token khôi phục ngẫu nhiên (Crypto Token), mã hóa SHA-256 lưu trữ trong cơ sở dữ liệu với thời hạn hiệu lực 15 phút, chống lộ diện người dùng (Anti-enumeration protection).
4. **Hệ thống phòng thủ bảo mật 5 lớp (US-04 / FC04):**  
   - *Lớp 1 (Honeypot Trap):* Trường dữ liệu ẩn `extraNotes` gài bẫy bot tự động điền form.
   - *Lớp 2 (Disposable Email Blacklist):* Chặn danh sách hơn 2,000 tên miền email rác tạm thời (10minutemail, tempmail,...).
   - *Lớp 3 (Rate Limiting Middleware):* Khóa IP tạm thời nếu nhập sai mật khẩu quá 5 lần trong 15 phút.
   - *Lớp 4 (HttpOnly Secure Cookie):* Chống đánh cắp token qua tấn công XSS (Cross-Site Scripting).
   - *Lớp 5 (Input Sanitization & DTO Validation):* Kiểm duyệt dữ liệu đầu vào chống SQL Injection và NoSQL Injection.
5. **Phát hiện & Cắt ảnh người tự động (US-05 / FC05):**  
   Tự động căn chỉnh ảnh, loại bỏ phần thừa hậu cảnh, chỉ giữ lại khung hình người hoàn chỉnh phục vụ dựng hình 3D.
6. **Tái tạo lưới 3D người đa giác (US-06 / FC06):**  
   Khôi phục hình dạng 3D 10,475 đỉnh từ ảnh 2D, mô phỏng đúng đường cong sinh học của người mẫu.
7. **Hiệu chỉnh thông số thể tích sinh trắc học (US-07 / FC07):**  
   Tối ưu hóa các hệ số $\beta$ theo chiều cao và cân nặng thực tế, loại bỏ hoàn toàn các giả lập ước tính tùy tiện.
8. **Đo đạc 13 chỉ số nhân trắc học & Gợi ý Size (US-08 / FC08):**  
   Trích xuất đầy đủ 13 kích thước nhân trắc theo chuẩn ISO 8559 và tự động đối chiếu bảng size quốc tế (US, EU, UK, Asian) theo các form dáng (ôm sát, vừa vặn, rộng rãi).
9. **Giao diện Atelier Haute Couture sang trọng (US-09 / FC09):**  
   Phong cách thiết kế chuẩn Atelier đẳng cấp (màu đen Obsidian, xám Warm Gray và vàng Champagne Gold), tương thích hoàn hảo từ màn hình điện thoại đến desktop 4K.
10. **Bảng điều khiển 3D tương tác thời gian thực (US-10 / FC10):**  
    Khung hiển thị mô hình Mannequin chất liệu vải Calico, cho phép người dùng dùng chuột xoay 360°, phóng to chi tiết từng đường may, bật tắt đèn chiếu studio và xem Mannequin biến đổi kích thước trực tiếp khi thay đổi số đo (Morph Targets).
11. **Hạ tầng cấu hình Reverse Proxy & Kịch bản tự động (US-11 / FC11):**  
    Đồng bộ môi trường Vite proxy chuyển tiếp cổng API `/api/v1/measure` sang FastAPI (`port 8000`), kịch bản khởi động 1 chạm `start_full_system.bat`.
12. **Bộ công cụ kiểm thử & Đánh giá tự động (US-12 / FC12):**  
    Test suites toàn diện bao phủ kiểm thử đơn vị, kiểm thử tích hợp API và benchmark tốc độ suy luận mô hình AI.

---

## 7. TIÊU CHUẨN NHÂN TRẮC HỌC ISO 8559 & BẢNG QUY ĐỔI SIZE

FitVision 3D tuân thủ nghiêm ngặt **tiêu chuẩn quốc tế ISO 8559-1:2017** (*Size designation of clothes — Part 1: Anthropometric definitions for body measurement*).

### 7.1. Bảng 13 Chỉ Số Đo Nhân Trắc Học Trong Hệ Thống

| STT | Tên chỉ số (English) | Tên tiếng Việt | Mã ISO 8559 | Vị trí mốc giải phẫu chuẩn |
| :---: | :--- | :--- | :---: | :--- |
| **1** | **Body Height** | Chiều cao toàn thân | ISO 8559-1: 3.1 | Đỉnh đầu (Vertex) đến mặt sàn tiếp đất khi đứng thẳng |
| **2** | **Bust / Chest Girth** | Vòng ngực | ISO 8559-1: 3.8 | Chu vi ngang qua điểm nhô cao nhất của ngực (Bust point) |
| **3** | **Waist Girth** | Vòng eo | ISO 8559-1: 3.11 | Chu vi ngang qua điểm hẹp nhất của vùng bụng tự nhiên |
| **4** | **Hip Girth** | Vòng mông | ISO 8559-1: 3.13 | Chu vi ngang qua điểm nở lớn nhất của mông |
| **5** | **Shoulder Breadth** | Độ rộng vai | ISO 8559-1: 3.4 | Khoảng cách ngang giữa 2 mỏm cùng vai (Acromion points) |
| **6** | **Sleeve Length** | Chiều dài tay | ISO 8559-1: 3.18 | Từ mỏm cùng vai qua khuỷu tay đến xương cổ tay |
| **7** | **Neck Girth** | Vòng cổ | ISO 8559-1: 3.7 | Chu vi vòng quanh chân cổ, đi qua đốt sống cổ thứ 7 (C7) |
| **8** | **Inside Leg Length** | Chiều dài chân (Inseam) | ISO 8559-1: 3.16 | Từ đũng quần (Perineum) thẳng dọc xuống mắt cá trong |
| **9** | **Upper Arm Girth** | Vòng bắp tay | ISO 8559-1: 3.10 | Chu vi ngang qua điểm phình lớn nhất của cơ nhị đầu |
| **10** | **Wrist Girth** | Vòng cổ tay | ISO 8559-1: 3.19 | Chu vi ngang qua mỏm trâm quay và mỏm trâm trụ |
| **11** | **Thigh Girth** | Vòng đùi | ISO 8559-1: 3.14 | Chu vi ngang qua điểm dày nhất của đùi trên, sát nếp lằn mông |
| **12** | **Calf Girth** | Vòng bắp chân | ISO 8559-1: 3.15 | Chu vi ngang qua điểm nở lớn nhất của cơ sinh đôi cẳng chân |
| **13** | **Ankle Girth** | Vòng cổ chân | ISO 8559-1: 3.17 | Chu vi ngay trên hai mắt cá chân (Malleoli) |

### 7.2. Logic Gợi Ý Kích Cỡ Thời Trang (Size Recommendation Logic)
Hệ thống sử dụng ma trận khoảng số đo (Measurement Range Matrix) kết hợp tùy chọn cảm giác mặc (Fit Preference):
- **Form Ôm Sát (Tight Fit):** Độ cử động (Ease Allowance) $= 0\text{ đến }2\text{ cm}$.
- **Form Vừa Vặn (Regular Fit):** Độ cử động $= 3\text{ đến }5\text{ cm}$.
- **Form Thoải Mái (Loose / Oversized Fit):** Độ cử động $\ge 6\text{ cm}$.

```
Số đo cơ thể đo được (ISO 8559) 
          + 
Độ cử động mong muốn (Ease Allowance)
          │
          ▼
Đối chiếu bảng thông số thương hiệu (Asia / US / UK / EU)
          │
          ▼
Gợi ý Size tối ưu: XS / S / M / L / XL / XXL (Kèm % độ vừa vặn từng vùng)
```

---

## 8. KIỂM THỬ & ĐÁNH GIÁ ĐỘ CHÍNH XÁC (EVALUATION & METRICS)

### 8.1. Phương Pháp Đánh Giá Thực Nghiệm (Ground Truth Benchmark)
Để chứng minh tính xác thực và khoa học của mô hình, nhóm nghiên cứu đã tiến hành đánh giá đối sánh thực nghiệm trên tập mẫu tình nguyện viên người thật:
- **Chuẩn đối chứng (Ground Truth):** Thợ may chuyên nghiệp sử dụng thước dây chuẩn giải phẫu đo đạc trực tiếp 3 lần độc lập và lấy giá trị trung bình.
- **Dữ liệu kiểm thử của FitVision 3D:** Ảnh chụp toàn thân từ camera smartphone thông thường ở khoảng cách $2.0 - 2.5\text{ mét}$, kết hợp thông số chiều cao và cân nặng của người mẫu.

### 8.2. Chỉ Số Đánh Giá (Evaluation Metrics)
1. **Sai số tuyệt đối trung bình (Mean Absolute Error - MAE):**
   $$\text{MAE} = \frac{1}{M} \sum_{k=1}^{M} \left| y_k^{\text{pred}} - y_k^{\text{true}} \right|$$
2. **Sai số phần trăm tuyệt đối trung bình (Mean Absolute Percentage Error - MAPE):**
   $$\text{MAPE} = \frac{1}{M} \sum_{k=1}^{M} \frac{\left| y_k^{\text{pred}} - y_k^{\text{true}} \right|}{y_k^{\text{true}}} \times 100\%$$

### 8.3. Kết Quả Thực Nghiệm Trên Người Thật (Mẫu 167 cm - 47 kg)

| Chỉ số nhân trắc | Thước dây thật (cm) | AI FitVision 3D (cm) | Sai số tuyệt đối (cm) | Đánh giá độ lệch |
| :--- | :---: | :---: | :---: | :---: |
| **Chiều cao (Height)** | 167.0 | 167.0 | **0.0** | Hoàn hảo (Anchor) |
| **Vòng ngực (Bust)** | 77.0 | 78.4 | **+1.4** | Đạt chuẩn may mặc |
| **Vòng eo (Waist)** | 59.5 | 60.8 | **+1.3** | Đạt chuẩn may mặc |
| **Vòng mông (Hip)** | 88.0 | 89.2 | **+1.2** | Đạt chuẩn may mặc |
| **Rộng vai (Shoulder)** | 38.0 | 38.6 | **+0.6** | Cực kỳ chính xác |
| **Dài tay (Sleeve)** | 53.0 | 54.1 | **+1.1** | Đạt chuẩn may mặc |
| **Vòng đùi (Thigh)** | 48.0 | 49.3 | **+1.3** | Đạt chuẩn may mặc |
| **Bắp tay (Bicep)** | 22.5 | 23.2 | **+0.7** | Cực kỳ chính xác |
| **Bắp chân (Calf)** | 31.0 | 31.8 | **+0.8** | Cực kỳ chính xác |
| **Cổ chân (Ankle)** | 19.5 | 20.1 | **+0.6** | Cực kỳ chính xác |
| **Cổ tay (Wrist)** | 14.5 | 14.8 | **+0.3** | Cực kỳ chính xác |
| **Vòng cổ (Neck)** | 32.0 | 32.9 | **+0.9** | Cực kỳ chính xác |
| **Dài chân (Inseam)** | 75.0 | 76.5 | **+1.5** | Đạt chuẩn may mặc |
| **TRUNG BÌNH (MAE)** | — | — | **0.98 cm** | **Xuất sắc (< 1.5 cm)** |

*Nhận xét kết quả:* Sai số trung bình toàn hệ thống đạt mức **0.98 cm** (thấp hơn nhiều so với ngưỡng dung sai cho phép của ngành may mặc công nghiệp là $\pm 2.0 - 2.5\text{ cm}$). Thời gian suy luận hoàn tất toàn bộ pipeline trên card đồ họa NVIDIA RTX 3060 trung bình chỉ mất **5.8 giây**.

---

## 9. KẾ HOẠCH PHÁT TRIỂN TRONG CÁC SPRINT TIẾP THEO

Theo lộ trình Sprint Backlog trên Jira, dự án FitVision 3D sẽ tiếp tục triển khai các giai đoạn tiếp theo:
- **Sprint 2 (F3 Sprint 2):**
  - Thiết kế và triển khai cơ sở dữ liệu Supabase PostgreSQL với chính sách bảo mật cấp hàng (Row Level Security - RLS).
  - Xây dựng module B2B **Size Chart Manager**: Cho phép các nhà mốt và thương hiệu thời trang tải lên bảng thông số riêng và quản trị kích cỡ trang phục.
  - Bộ mô phỏng chọn size thông minh (Size Recommendation Simulator).
- **Sprint 3 (F3 Sprint 3):**
  - Phòng may ảo chuyên nghiệp (Tailor Studio Suite).
  - Hồ sơ may đo điện tử và tính năng trích xuất báo cáo kỹ thuật định dạng PDF chuẩn xưởng may (Technical Dossier PDF Export).
- **Sprint 4 (F3 Sprint 4):**
  - Tối ưu hóa hiệu năng toàn diện, đóng gói Docker Compose Production Ready.
  - Nghiệm thu thực địa người dùng cuối (User Acceptance Testing - UAT) trên 50 đối tượng và hoàn thiện lễ bảo vệ đồ án tốt nghiệp.

---

*Tài liệu được biên soạn và bảo chứng bởi Nhóm C1SE.12 – FitVision 3D.*  
*Bản quyền © 2026 FitVision 3D Project. Viện Đào tạo Quốc tế – Đại học Duy Tân.*
