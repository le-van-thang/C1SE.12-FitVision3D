# RULE: TÍCH HỢP DỊCH VỤ AI ĐO ĐẠC 3D (AI SERVICE INTEGRATION RULES)
**Áp dụng:** Tầng tích hợp giữa Web Backend (API) và AI-Tailor Microservice (Python PyTorch/SMPLer-X)

---

## 1. TÍNH CHẤT XỬ LÝ: BẮT BUỘC BẤT ĐỒNG BỘ (ASYNC / NON-BLOCKING)
1. **Thời gian chạy mô hình:** Việc suy luận mô hình 3D (SMPLer-X, ViTPose, trích xuất số đo cơ thể) tốn từ **3 đến 15 giây** (trên GPU) hoặc lâu hơn (trên CPU).
2. **Quy tắc tuyệt đối:**
   - Web API Backend **KHÔNG ĐƯỢC** giữ kết nối HTTP đồng bộ (Blocking request) chờ AI xử lý xong mới trả về cho Client. Điều này sẽ gây nghẽn kết nối và lỗi `504 Gateway Timeout`.
3. **Mô hình xử lý khuyến nghị (Task Queue / Polling):**
   - **Bước 1 (Client $\rightarrow$ Web Backend):** Người dùng upload ảnh $\rightarrow$ Backend lưu ảnh tạm, tạo một bản ghi `MeasurementTask` với `status = 'PROCESSING'` và trả ngay về `taskId` cho Frontend trong vòng < 200ms.
   - **Bước 2 (Web Backend $\rightarrow$ AI-Tailor):** Đẩy task vào hàng đợi (Redis Queue / RabbitMQ) hoặc gọi sang API Python của AI-Tailor.
   - **Bước 3 (AI-Tailor $\rightarrow$ Web Backend):** Sau khi tính toán xong số đo và sinh file `.obj`, AI-Tailor cập nhật kết quả qua Webhook hoặc Web Backend nhận kết quả qua Worker.
   - **Bước 4 (Client lấy kết quả):** Frontend định kỳ poll trạng thái `GET /api/v1/measurements/tasks/:taskId` (mỗi 2 giây một lần) hoặc nhận tín hiệu qua WebSocket/Server-Sent Events.

---

## 2. BẢO MẬT GIAO TIẾP NỘI BỘ (INTERNAL SERVICE AUTH)
1. Dịch vụ AI-Tailor chạy nội bộ (Internal Service) tại cổng riêng (ví dụ: `localhost:8000`).
2. Tuyệt đối **không mở public cổng AI-Tailor ra ngoài internet** để tránh bị kẻ xấu gọi trực tiếp làm cạn kiệt tài nguyên GPU.
3. Mọi request từ Web Backend sang AI-Tailor phải đính kèm Header xác thực bí mật:
   ```http
   X-Internal-Secret: your_internal_secret_key_here
   ```
   Nếu thiếu hoặc sai secret key, AI-Tailor từ chối xử lý ngay lập tức với mã `401 Unauthorized`.

---

## 3. QUẢN LÝ DỮ LIỆU ĐẦU RA 3D (AVATAR & NUMBER FORMAT)
1. **Số đo cơ thể (Measurements):**
   - Đơn vị chuẩn lưu trữ và truyền tải là **Centimet (cm)** (ví dụ: `chest: 92.5`, `waist: 75.0`, `hips: 96.2`, `height: 172.0`).
   - Luôn làm tròn 1 chữ số thập phân (`round(val, 1)`).
2. **File 3D Mesh (`.obj` / `.gltf`):**
   - Đặt tên file theo định dạng: `avatar_{userId}_{timestamp}.obj`.
   - File 3D phải được lưu vào thư mục public tĩnh hoặc dịch vụ lưu trữ đám mây (Cloud Storage / S3 / MinIO).
   - Backend chỉ lưu và trả về cho Frontend đường dẫn URL truy cập tĩnh (vd: `/static/avatars/...`), không nhúng dữ liệu file 3D thô vào JSON response.

---

## 4. XỬ LÝ LỖI QUÁ TẢI (GPU OUT-OF-MEMORY & GRACEFUL DEGRADATION)
1. Khi máy chủ AI quá tải bộ nhớ GPU (CUDA OOM) hoặc ảnh đầu vào không nhận diện được người:
   - AI-Tailor phải bắt ngoại lệ (Exception) và trả về lỗi có cấu trúc:
     ```json
     {
       "success": false,
       "errorCode": "AI_POSE_DETECTION_FAILED",
       "message": "Không thể nhận diện toàn thân trong ảnh. Vui lòng chụp lại theo đúng hướng dẫn (đứng thẳng, rõ toàn thân)."
     }
     ```
   - Không được để Python script bị crash/die tiến trình.

