---
name: test-auth-security
description: >-
  Kịch bản và hướng dẫn kiểm thử bảo mật cho phân hệ xác thực: kiểm tra bẫy bot Honeypot,
  chặn email rác, phòng chống brute-force đăng nhập (Rate Limit), cờ bảo mật Cookie HttpOnly,
  và phân quyền trái phép (RBAC Bypass).
---

# Kịch Bản Kiểm Thử Bảo Mật Xác Thực (Auth Security Test Runbook)

Sử dụng kịch bản này sau khi lập trình xong một endpoint xác thực để đối soát và nghiệm thu an toàn bảo mật trước khi bàn giao cho Frontend hoặc đẩy lên GitHub.

---

## 1. Kiểm tra Bẫy Bot Honeypot
- **Mục tiêu:** Đảm bảo bot tự động điền form sẽ bị vô hiệu hóa.
- **Lệnh kiểm thử:**
  ```bash
  curl -X POST http://localhost:5000/api/v1/auth/register \
    -H "Content-Type: application/json" \
    -d '{
      "email": "realuser@gmail.com",
      "fullName": "Test Bot",
      "password": "Password123@",
      "confirmPassword": "Password123@",
      "termsAgreed": true,
      "extraNotes": "I am an automated bot scanner"
    }'
  ```
- **Kỳ vọng:** Database KHÔNG được tạo thêm bản ghi người dùng mới.

---

## 2. Kiểm tra Chặn Disposable Email
- **Mục tiêu:** Ngăn người dùng đăng ký bằng email ảo 10 phút.
- **Lệnh kiểm thử:**
  ```bash
  curl -X POST http://localhost:5000/api/v1/auth/register \
    -H "Content-Type: application/json" \
    -d '{
      "email": "spammer@10minutemail.com",
      "fullName": "Spam User",
      "password": "Password123@",
      "confirmPassword": "Password123@",
      "termsAgreed": true
    }'
  ```
- **Kỳ vọng:** Nhận mã `HTTP 400 Bad Request` với mã lỗi `AUTH_DISPOSABLE_EMAIL`.

---

## 3. Kiểm tra Brute-Force & Rate Limiting
- **Mục tiêu:** Sau 5 lần nhập sai, bật yêu cầu CAPTCHA. Sau 10 lần sai, khóa tạm thời 15 phút.
- **Lệnh kiểm thử:**
  Chạy vòng lặp gửi 10 request sai mật khẩu liên tiếp:
  ```bash
  for i in {1..11}; do
    curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:5000/api/v1/auth/login \
      -H "Content-Type: application/json" \
      -d '{"email":"victim@example.com","password":"WrongPassword123@"}'
  done
  ```
- **Kỳ vọng:**
  - Lần 1–4: Trả về `401 Unauthorized`.
  - Lần 5–9: Trả về `400 Bad Request` kèm `"code": "AUTH_CAPTCHA_REQUIRED"`.
  - Lần 10 trở đi: Trả về `423 Locked` hoặc `429 Too Many Requests`.

---

## 4. Kiểm tra Cờ Cookie HttpOnly & Secure
- **Mục tiêu:** Chống tấn công XSS đánh cắp Refresh Token.
- **Lệnh kiểm thử:**
  ```bash
  curl -i -X POST http://localhost:5000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"valid@example.com","password":"CorrectPassword123@"}'
  ```
- **Kỳ vọng:** Trong Header phản hồi `Set-Cookie`, PHẢI CÓ các chuỗi:
  - `HttpOnly`
  - `SameSite=Lax` (hoặc `Strict`)
  - `Path=/api/v1/auth`

---

## 5. Kiểm tra Phân Quyền RBAC (Role Access Control)
- **Mục tiêu:** Token role `USER` không thể gọi API duyệt shop hoặc xem doanh thu shop khác.
- **Lệnh kiểm thử:**
  ```bash
  curl -X POST http://localhost:5000/api/v1/admin/shops/approve \
    -H "Authorization: Bearer <USER_ACCESS_TOKEN>"
  ```
- **Kỳ vọng:** Nhận mã `HTTP 403 Forbidden` kèm code `FORBIDDEN_INSUFFICIENT_PERMISSIONS`.

