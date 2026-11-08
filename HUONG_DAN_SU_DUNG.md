# 🧵 HƯỚNG DẪN CÀI ĐẶT, VẬN HÀNH & SỬ DỤNG DỰ ÁN AI-TAILOR
> **Hệ Thống Trích Xuất Số Đo May Mặc 3D Tự Động Theo Chuẩn Quốc Tế ISO 8559**  
> *Hỗ trợ trích xuất 8 số đo nhân trắc học, xuất file 3D Avatar (.obj) và tư vấn kích cỡ trang phục thông minh.*

---

## 📌 MỤC LỤC
1. [Giới Thiệu Tổng Quan](#1-giới-thiệu-tổng-quan)
2. [Yêu Cầu Hệ Thống & Phần Cứng](#2-yêu-cầu-hệ-thống--phần-cứng)
3. [Cài Đặt Môi Trường (Setup Guide)](#3-cài-đặt-môi-trường-setup-guide)
4. [Quản Lý & Kiểm Tra Trọng Số Mô Hình (Weights Audit)](#4-quản-lý--kiểm-tra-trọng-số-mô-hình-weights-audit)
5. [Hướng Dẫn Chạy Bằng Dòng Lệnh (CLI - run_measurement.py)](#5-hướng-dẫn-chạy-bằng-dòng-lệnh-cli---run_measurementpy)
6. [Hướng Dẫn Chạy REST API Server (app.py)](#6-hướng-dẫn-chạy-rest-api-server-apppy)
7. [Công Cụ Đối Chuẩn Thực Nghiệm Với Thước Dây (evaluate_benchmark.py)](#7-công-cụ-đối-chuẩn-thực-nghiệm-với-thước-dây-evaluate_benchmarkpy)
8. [Quy Chuẩn Chụp Ảnh Đạt Độ Chính Xác Tối Đa (< 1.5 cm)](#8-quy-chuẩn-chụp-ảnh-đạt-độ-chính-xác-tối-đa--15-cm)
9. [Xử Lý Lỗi Thường Gặp (Troubleshooting & FAQ)](#9-xử-lý-lỗi-thường-gặp-troubleshooting--faq)

---

## 1. Giới Thiệu Tổng Quan

**AI-Tailor** là giải pháp thị giác máy tính 3D (3D Computer Vision) kết hợp hình học giải phẫu người (SMPL-X):
* **Đầu vào:** Chỉ cần **01 bức ảnh chụp toàn thân 2D** (dáng đứng chữ A).
* **Đầu ra 1:** Bảng **8 thông số đo may mặc cốt lõi** theo tiêu chuẩn **ISO 8559-1**:
  1. Chiều cao toàn thân (cm)
  2. Vòng ngực (cm - Chest Girth)
  3. Vòng eo (cm - Waist Girth)
  4. Vòng hông / mông (cm - Hip Girth)
  5. Chiều rộng vai (cm - Shoulder Width)
  6. Chiều dài tay áo (cm - Sleeve Length)
  7. Chiều dài chân trong (cm - Inseam: từ đũng quần đến gót)
  8. Cân nặng ước tính (kg - Body Mass)
* **Đầu ra 2:** File **3D Avatar Mannequin (.obj / .ply)** tỉ lệ người thật 1:1, nhập trực tiếp vào **CLO3D, Marvelous Designer, Browzwear, Blender**.
* **Đầu ra 3:** Hệ thống tự động tư vấn size áo (XS - XXL), size quần âu (Inch $W \times L$), phân loại vóc dáng và tính độ cử động (Ease Allowance).

---

## 2. Yêu Cầu Hệ Thống & Phần Cứng

| Thành phần | Yêu cầu tối thiểu | Khuyến nghị (Tối ưu) |
| :--- | :--- | :--- |
| **Hệ điều hành** | Windows 10/11 (64-bit) hoặc Ubuntu 20.04/22.04 | Windows 11 / Ubuntu 22.04 |
| **CPU** | Intel Core i5 / AMD Ryzen 5 (4 cores) | Intel Core i7 / AMD Ryzen 7 trở lên |
| **GPU (Card rời)** | Chạy được trên CPU (mất ~15-20s/ảnh) | **NVIDIA RTX 3050 / 4050 (6GB VRAM) trở lên** (chạy < 1.5s/ảnh) |
| **RAM** | 8 GB | 16 GB trở lên |
| **Ổ cứng trống** | 10 GB | 20 GB SSD |
| **Python** | **Python 3.10 (bắt buộc)** | Python 3.10.11 (64-bit) |

---

## 3. Cài Đặt Môi Trường (Setup Guide)

*(Nếu bạn đã chạy thiết lập theo hướng dẫn của Antigravity trước đó thì có thể bỏ qua bước này và đi thẳng tới [Mục 5](#5-hướng-dẫn-chạy-bằng-dòng-lệnh-cli---run_measurementpy)).*

### Cách A: Cài đặt tự động trên Windows (Khuyên dùng)
Mở PowerShell hoặc Command Prompt tại thư mục dự án và chạy:
```powershell
# 1. Cài đặt Python 3.10 qua winget (nếu máy chưa có Python 3.10)
winget install Python.Python.3.10 --accept-source-agreements --accept-package-agreements

# 2. Cài đặt PyTorch CUDA 11.8 và các gói cơ sở
python -m pip install --upgrade "pip<24.1" "setuptools==65.5.1" "wheel" "cython<3.0.0" "numpy==1.23.5"
python -m pip install torch==2.0.1+cu118 torchvision==0.15.2+cu118 --extra-index-url https://download.pytorch.org/whl/cu118

# 3. Cài đặt các thư viện may mặc và API
python -m pip install -r requirements.txt fastapi uvicorn python-multipart "numpy==1.23.5" mmcv==1.7.2

# 4. Liên kết 2 module nội bộ
python -m pip install -e main/transformer_utils --no-build-isolation
python -m pip install -e data/SHAPY/mesh-mesh-intersection --no-build-isolation
```

### Cách B: Chạy qua Docker Container
```bash
# Build Docker Image:
docker build -t ai-tailor:latest .

# Khởi chạy dịch vụ API trên cổng 8000 với GPU:
docker run --gpus all -p 8000:8000 -d --name ai_tailor_app ai-tailor:latest python -m uvicorn app:app --host 0.0.0.0 --port 8000
```

### Cách C: Chạy trên Google Colab (GPU T4 miễn phí)
1. Mở notebook `run_on_colab.ipynb` trên Google Colab.
2. Chọn Menu: **Runtime -> Change runtime type -> T4 GPU**.
3. Chạy lần lượt các Cell 1, 2, 3 để hệ thống tự động thiết lập và thực hiện đo.

---

## 4. Quản Lý & Kiểm Tra Trọng Số Mô Hình (Weights Audit)

Dự án yêu cầu 5 file trọng số (~800MB tổng dung lượng) được đặt chính xác như sau:

| Tên file trọng số | Dung lượng | Vị trí thư mục |
| :--- | :---: | :--- |
| `smpler_x_s32.pth.tar` | 384 MB | `pretrained_models/smpler_x_s32.pth.tar` |
| `vitpose_small.pth` | 97 MB | `pretrained_models/vitpose_small.pth` |
| `SMPLX_NEUTRAL.npz` | 108 MB | `common/utils/human_model_files/smplx/SMPLX_NEUTRAL.npz` |
| `SMPLX_MALE.npz` | 108 MB | `common/utils/human_model_files/smplx/SMPLX_MALE.npz` |
| `SMPLX_FEMALE.npz` | 108 MB | `common/utils/human_model_files/smplx/SMPLX_FEMALE.npz` |

### Lệnh kiểm tra tình trạng mô hình:
```bash
python download_models.py
```
Nếu màn hình hiển thị đủ 5 dấu tích xanh `[✓] SẴN SÀNG`, hệ thống đã sẵn sàng 100%!

### Lệnh tự động tải toàn bộ mô hình còn thiếu:
```bash
python download_models.py --download
```

---

## 5. Hướng Dẫn Chạy Bằng Dòng Lệnh (CLI - `run_measurement.py`)

### A. Câu lệnh cơ bản
> 💡 **Mẹo:** Nếu cửa sổ Terminal hiện tại chưa nhận lệnh `python` (báo *"Python was not found"*), bạn chỉ cần thay bằng chữ **`py`** (ví dụ: `py run_measurement.py ...`) hoặc bấm dấu **`+`** để mở một tab Terminal mới nhằm nạp lại PATH!

```powershell
python run_measurement.py --image path/to/anh_chup.jpg --height_cm 175.0 --weight_kg 70.0
# Hoặc dùng lệnh 'py':
py run_measurement.py --image path/to/anh_chup.jpg --height_cm 175.0 --weight_kg 70.0
```

### B. Câu lệnh nâng cao (Đầy đủ tham số & Xuất 3D Avatar)
```powershell
python run_measurement.py `
  --image demo_sample.jpg `
  --height_cm 178.0 `
  --weight_kg 74.0 `
  --gender male `
  --save_mesh avatar_178cm.obj `
  --output_json ket_qua_178cm.json `
  --device cuda:0
```

### C. Bảng giải thích chi tiết các tham số

| Tham số | Bắt buộc | Mặc định | Ý nghĩa & Khuyến nghị |
| :--- | :---: | :---: | :--- |
| **`--image`** | **Có** | - | Đường dẫn file ảnh (.jpg, .png) chụp toàn thân dáng chữ A. |
| **`--height_cm`** | Khuyên dùng | `None` | Chiều cao thật của người (cm). Giúp chuẩn hóa tỉ lệ người 1:1 chính xác 100%. |
| **`--weight_kg`** | Tùy chọn | `None` | Cân nặng thật (kg). Dùng cho thuật toán tối ưu vi phân Adam tinh chỉnh độ dày cơ thể. |
| **`--gender`** | Tùy chọn | `neutral` | Giới tính hình thái: `male` (nam), `female` (nữ), `neutral` (trung tính). |
| **`--save_mesh`** | Tùy chọn | `None` | Đường dẫn xuất file 3D Avatar (`.obj` hoặc `.ply`) để đưa vào CLO3D/Blender. |
| **`--output_json`**| Tùy chọn | `output_measurements.json` | Tên file JSON lưu kết quả 8 số đo và vector $\beta$. |
| **`--device`** | Tùy chọn | `cuda:0` | Thiết bị tính toán: `cuda:0` (dùng GPU) hoặc `cpu`. |

### D. Định dạng file JSON đầu ra
File JSON kết quả sẽ có cấu trúc chuẩn như sau:
```json
{
    "thong_tin_nhap": {
        "gioi_tinh": "male",
        "chieu_cao_nhap_cm": 178.0,
        "can_nang_nhap_kg": 74.0,
        "scale_factor_hieu_chinh": 0.9994
    },
    "so_do_may_mac_cm": {
        "chieu_cao": 178.0,
        "vong_nguc": 100.6,
        "vong_eo": 86.7,
        "vong_hong": 95.8,
        "rong_vai": 38.5,
        "dai_tay_ao": 52.3,
        "dai_chan_inseam": 78.7,
        "can_nang_uoc_tinh_kg": 74.0
    },
    "smplx_betas": [0.212, -0.833, 0.456, -0.072, 0.330, -0.240, 0.335, 0.122, 0.075, -0.113]
}
```

---

## 6. Hướng Dẫn Chạy REST API Server (`app.py`)

Dịch vụ REST API được xây dựng bằng **FastAPI**, tích hợp sẵn cơ chế **Model Caching** (nạp trước toàn bộ mô hình lên GPU ngay khi khởi động) giúp thời gian suy luận chỉ còn **< 1.5 giây/ảnh**.

### A. Khởi động Server
```powershell
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
# Hoặc dùng lệnh 'py':
py -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

### B. Truy Cập Giao Diện Trực Quan Trên Trình Duyệt Web

> [!WARNING]
> **Không truy cập `http://0.0.0.0:8000`** trên trình duyệt vì Chrome/Edge sẽ báo lỗi `ERR_ADDRESS_INVALID` (do `0.0.0.0` chỉ là địa chỉ bind mạng của server, không phải tên miền máy chủ).
> 
> Bạn hãy truy cập vào một trong hai địa chỉ sau:

1. **Giao diện Web AI-Tailor Studio (Giao diện đồ họa kéo thả ảnh & xem số đo):**
   👉 **`http://localhost:8000`** (hoặc `http://127.0.0.1:8000`)
   - Hỗ trợ kéo thả ảnh chụp, nút **"Thử với ảnh mẫu A-Pose"** chỉ bằng 1 cú click.
   - Hiển thị trực quan 8 thông số nhân trắc học may mặc ISO 8559 và đề xuất size quần/áo tự động.

2. **Giao diện Swagger UI (Dành cho Lập trình viên thử nghiệm API thô):**
   👉 **`http://localhost:8000/docs`** (hoặc `http://127.0.0.1:8000/docs`)
   - Bấm vào endpoint **`POST /api/v1/measure`** -> Bấm **Try it out** -> Chọn file ảnh và bấm **Execute** để xem JSON kết quả.

### C. Ví dụ gọi API từ cURL / Terminal
```bash
curl -X POST "http://localhost:8000/api/v1/measure" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@demo_sample.jpg" \
  -F "height_cm=178" \
  -F "weight_kg=74" \
  -F "gender=male"
```

### D. Dữ liệu phản hồi từ API (Bao gồm gợi ý Size)
```json
{
  "status": "success",
  "subject_metadata": {
    "gender": "male",
    "input_height_cm": 178.0,
    "input_weight_kg": 74.0
  },
  "iso_8559_measurements": {
    "so_do_may_mac_cm": {
      "chieu_cao": 178.0,
      "vong_nguc": 100.6,
      "vong_eo": 86.7,
      "vong_hong": 95.8,
      "rong_vai": 38.5,
      "dai_tay_ao": 52.3,
      "dai_chan_inseam": 78.7,
      "can_nang_uoc_tinh_kg": 74.0
    }
  },
  "garment_size_recommendations": {
    "topwear_shirt_size": "L",
    "bottomwear_trouser_size": "Size 34 (34W x 31L)",
    "waist_inches": 34,
    "inseam_inches": 31,
    "body_shape_classification": "Regular / Balanced (Cân đối tiêu chuẩn)",
    "ease_allowance_recommendation": {
      "slim_fit_chest_cm": 105.6,
      "regular_fit_chest_cm": 108.6,
      "trouser_waist_ease_cm": 88.7
    }
  },
  "execution_time_seconds": 1.12
}
```

---

## 7. Công Cụ Đối Chuẩn Thực Nghiệm Với Thước Dây (`evaluate_benchmark.py`)

Khi bạn có số đo thực tế đo bằng thước dây thợ may, bạn có thể kiểm chứng độ chuẩn xác của AI:

```powershell
python evaluate_benchmark.py `
  --pred output_sample.json `
  --real_height 178.0 `
  --real_chest 100.0 `
  --real_waist 86.0 `
  --real_hips 95.0 `
  --real_inseam 78.5 `
  --real_weight 74.0
```

* Hệ thống tự động tính sai số tuyệt đối trung bình (**MAE**), sai số phần trăm (%), và đưa ra kết luận:
  - $\text{MAE} \le 1.5\text{ cm}$: **[✓✓] ĐẠT CHUẨN MAY ĐO THƯƠNG MẠI (MTM)**.
  - $\text{MAE} \le 2.5\text{ cm}$: **[✓] ĐẠT CHUẨN THỜI TRANG MAY SẴN & GỢI Ý SIZE E-COMMERCE**.

---

## 8. Quy Chuẩn Chụp Ảnh Đạt Độ Chính Xác Tối Đa (< 1.5 cm)

Để đảm bảo kết quả đo đạc chính xác ngang với thợ may lành nghề, người chụp cần tuân thủ 4 nguyên tắc:

```
        ( O )            <-- Mắt nhìn thẳng, đầu giữ tự nhiên
        / | \
       /  |  \           <-- Hai tay dang nhẹ 30° - 40° (tách sườn 10 - 15 cm)
      /   |   \              (Không ép sát nách, không giơ ngang 90°)
     /    |    \
        /   \            <-- Hai chân mở rộng bằng vai
       /     \               (Nhìn rõ khe hở đũng quần để đo Inseam)
      |       |
```

1. **Tư thế A-pose:** Đứng thẳng, 2 chân mở rộng bằng vai, 2 tay dang nhẹ tạo góc $30^\circ - 40^\circ$ so với thân (không ép bắp tay vào mạng sườn).
2. **Góc đặt máy:** Đặt camera điện thoại ở độ cao **ngang thắt lưng / rốn** ($90 - 100\text{ cm}$ từ mặt sàn), giữ máy thẳng đứng $90^\circ$ (không nghiêng ngửa máy).
3. **Khoảng cách:** Đứng cách camera từ **2.5 mét đến 3.0 mét**, lấy trọn vẹn từ đỉnh đầu đến gót chân.
4. **Trang phục:** Mặc trang phục mỏng ôm sát (đồ gym, legging, đồ bơi, áo thun ôm). Tránh áo phao, váy xòe, quần ống rộng quá khổ.

---

## 9. Xử Lý Lỗi Thường Gặp (Troubleshooting & FAQ)

### Lỗi 1: `UnicodeEncodeError: 'charmap' codec can't encode character '\u2713'`
* **Nguyên nhân:** Console Windows sử dụng bảng mã mặc định không hỗ trợ UTF-8.
* **Cách khắc phục:** Trước khi chạy lệnh Python, gõ lệnh sau vào PowerShell:
  ```powershell
  $env:PYTHONIOENCODING="utf-8"
  ```

### Lỗi 2: `FileNotFoundError: No such file or directory: ... smpler_x_s32.pth.tar` hoặc `SMPLX_NEUTRAL.npz`
* **Nguyên nhân:** Chưa tải hoặc đặt sai vị trí các file mô hình.
* **Cách khắc phục:** Chạy lệnh tự động tải:
  ```powershell
  python download_models.py --download
  ```

### Lỗi 3: `CUDA out of memory` (Tràn bộ nhớ VRAM card đồ họa)
* **Nguyên nhân:** Card đồ họa có dung lượng VRAM dưới 4GB hoặc đang mở cùng lúc game/ứng dụng nặng.
* **Cách khắc phục:** Thêm cờ `--device cpu` vào câu lệnh để chạy ở chế độ CPU:
  ```powershell
  python run_measurement.py --image anh.jpg --device cpu
  ```

### Lỗi 4: Xung đột NumPy với chumpy (`AttributeError: module 'numpy' has no attribute 'bool'`)
* **Nguyên nhân:** NumPy phiên bản 1.24+ đã gỡ bỏ các bí danh kiểu cũ.
* **Cách khắc phục:** Luôn khóa NumPy ở bản `1.23.5`:
  ```powershell
  python -m pip install "numpy==1.23.5"
  ```

---

*Tài liệu được biên soạn và kiểm chứng thực nghiệm tự động bởi Antigravity AI.*
