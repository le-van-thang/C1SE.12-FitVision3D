# RULE: TIÊU CHUẨN BẢO MẬT & CHỐNG SPAM
**Áp dụng:** Tầng Controller, Middleware, và Service của phân hệ Authentication

## 1. Kiểm tra Honeypot (Bẫy Bot)
- Mọi request gửi tới `POST /auth/register` và `POST /auth/register-shop` phải kiểm tra trường `extraNotes` (hoặc `honeypot`).
- Nếu trường này có giá trị (không rỗng):
  - Hủy tiến trình tạo tài khoản ngay lập tức (không chạy DB query, không chạy hàm hash mật khẩu).
  - Phản hồi `HTTP 200 OK` giả lập để bot tưởng thành công và rời đi, hoặc trả về `400 Bad Request`.

## 2. Lọc Email Rác (Disposable Email Blacklist)
- Trước khi lưu người dùng mới, tách phần domain của email và kiểm tra với danh sách cấm:
  `mailinator.com`, `10minutemail.com`, `tempmail.com`, `guerrillamail.com`, `throwawaymail.com`, `getnada.com`, `yopmail.com`, v.v.
- Nếu thuộc danh sách: Ném lỗi `HTTP 400 Bad Request` kèm code `AUTH_DISPOSABLE_EMAIL`.

## 3. Rate Limiting (Giới hạn tần suất)
- `POST /auth/register`: Giới hạn tối đa 3 requests / 10 phút trên cùng 1 địa chỉ IP.
- `POST /auth/resend-verification`: Tối đa 3 requests / 15 phút trên cùng 1 email.
- `POST /auth/login`: Sau 5 lần nhập sai liên tiếp trên cùng IP/Tài khoản, bắt buộc bật cờ yêu cầu CAPTCHA (`turnstileToken`). Nhập sai 10 lần liên tiếp $\rightarrow$ Khóa 15 phút (`423 Locked`).

## 4. Bảo mật Token & Mật khẩu
- Mật khẩu: Bắt buộc hash bằng `Argon2id` hoặc `bcrypt` (rounds $\ge 12$). Tuyệt đối không lưu plaintext.
- Access Token: JWT có hạn ngắn (15 phút), chứa payload: `{ sub: userId, role: userRole, status: userStatus }`.
- Refresh Token: Phải được thiết lập vào HTTP Response Cookie với:
  - `httpOnly: true`
  - `secure: true` (trong môi trường Production)
  - `sameSite: 'lax'`
  - `path: '/api/v1/auth'`
- Không bao giờ log mật khẩu, token, hoặc OTP ra console hay log file.

