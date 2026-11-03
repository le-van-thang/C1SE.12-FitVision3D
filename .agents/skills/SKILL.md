---
name: implement-auth-endpoint
description: >-
  Hướng dẫn từng bước xây dựng một endpoint xác thực (Auth Endpoint) chuẩn mực cho Backend,
  đảm bảo tuân thủ cấu trúc envelope ApiResponse, bộ mã lỗi ErrorCode enum, kiểm tra chống spam
  (Honeypot, Disposable email), mã hóa mật khẩu và thiết lập cookie HttpOnly an toàn.
---

# Quy Trình Triển Khai Endpoint Xác Thực (Auth Endpoint Workflow)

Sử dụng quy trình này khi bạn chuẩn bị viết một API mới thuộc phân hệ Authentication (Đăng ký, Đăng nhập, Refresh Token, Quên mật khẩu).

---

## Bước 1: Tra cứu Hợp Đồng API (API Contract Lookup)
Trước khi gõ bất kỳ dòng code nào:
1. Mở file [02_API_CONTRACT.md](file:///e:/Fashion3D_AI/docs/auth/02_API_CONTRACT.md).
2. Xác định chính xác:
   - URL Endpoint (vd: `POST /api/v1/auth/register`).
   - Các trường trong Request Body (tên `camelCase`, kiểu dữ liệu).
   - Mã HTTP thành công và cấu trúc dữ liệu trả về (`data`).
   - Danh sách mã lỗi (`error.code`) có thể xảy ra.

---

## Bước 2: Xây dựng DTO / Validation Schema
1. Khai báo DTO với đầy đủ các decorators hoặc schema validation (Zod, Pydantic, class-validator):
   - `email`: Validate RFC 5322, không trống, tự động lowercase.
   - `password`: Tối thiểu 8 ký tự, regex kiểm tra chữ hoa, thường, số, ký tự đặc biệt.
   - `extraNotes` (Honeypot): Bắt buộc kiểm tra rỗng.
2. Kiểm tra danh sách Disposable Email:
   - Nếu domain của email nằm trong danh sách cấm $\rightarrow$ Ném lỗi `AUTH_DISPOSABLE_EMAIL`.

---

## Bước 3: Triển khai Service Logic
1. **Kiểm tra trùng lặp:** Truy vấn Database. Nếu đã tồn tại $\rightarrow$ Trả về `409 Conflict` kèm code `AUTH_EMAIL_ALREADY_EXISTS`.
2. **Mã hóa mật khẩu:**
   - Dùng thư viện `argon2` hoặc `bcrypt`.
   - Salt rounds $\ge 12$. Tuyệt đối không hash bằng SHA-256 thuần.
3. **Gán trạng thái & Role:**
   - User thông thường: `role = 'USER'`, `status = 'PENDING_VERIFY'`.
   - Shop Owner: `role = 'SHOP_OWNER'`, `status = 'PENDING_APPROVAL'`.

---

## Bước 4: Thiết lập Response & Cookie
1. **Nếu là Login thành công:**
   - Tạo Access Token (JWT, hạn 15 phút).
   - Tạo Refresh Token (Chuỗi ngẫu nhiên, lưu hash vào DB).
   - Gắn Refresh Token vào Response Cookie:
     ```typescript
     res.cookie('refreshToken', token, {
       httpOnly: true,
       secure: process.env.NODE_ENV === 'production',
       sameSite: 'lax',
       path: '/api/v1/auth',
       maxAge: rememberMe ? 30 * 24 * 3600 * 1000 : 24 * 3600 * 1000,
     });
     ```
2. **Đóng gói Response chuẩn:**
   ```json
   {
     "success": true,
     "data": { ... },
     "error": null,
     "timestamp": "2026-11-02T14:30:00.000Z"
   }
   ```

---

## Bước 5: Kiểm tra hoàn thành (Verification)
- [ ] Gửi thử request hợp lệ bằng curl/Postman $\rightarrow$ Nhận mã `200` hoặc `201`.
- [ ] Gửi thử request có `extraNotes = "bot"` $\rightarrow$ Đảm bảo bị chặn hoặc trả kết quả giả lập.
- [ ] Gửi thử email tạm `@mailinator.com` $\rightarrow$ Nhận lỗi `AUTH_DISPOSABLE_EMAIL`.
- [ ] Kiểm tra header response xem có cờ `HttpOnly` trên cookie không.

