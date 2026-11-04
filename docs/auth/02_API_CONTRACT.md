# ĐẶC TẢ HỢP ĐỒNG API XÁC THỰC (AUTHENTICATION API CONTRACT)
**Dự án:** FitVision3D / Fashion3D  
**Phiên bản:** 1.0.0  
**Giao thức:** RESTful over HTTPS | Định dạng dữ liệu: JSON (`application/json`)  
**Tiêu chuẩn đặt tên:** JSON Request & Response sử dụng `camelCase`

---

## 1. QUY CHUẨN CẤU TRÚC PHẢN HỒI (STANDARD RESPONSE ENVELOPE)

Tất cả các API trong hệ thống đều tuân thủ cấu trúc đồng nhất để Frontend dễ dàng bóc tách dữ liệu thông qua Axios/Fetch Interceptor.

### 1.1. Phản hồi thành công (HTTP 2xx)
```json
{
  "success": true,
  "data": {
    // Dữ liệu cụ thể của từng API
  },
  "error": null,
  "timestamp": "2026-11-02T14:30:00.000Z"
}
```

### 1.2. Phản hồi lỗi (HTTP 4xx / 5xx)
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Thông tin đăng nhập không chính xác.",
    "details": [
      {
        "field": "password",
        "issue": "Mật khẩu không được để trống."
      }
    ]
  },
  "timestamp": "2026-11-02T14:30:00.000Z"
}
```

---

## 2. DANH SÁCH MÃ LỖI CHUẨN (ERROR CODE ENUM)

Frontend sử dụng trường `error.code` để bắt lỗi và hiển thị giao diện tùy biến (không phụ thuộc vào chuỗi `message` của Backend):

| HTTP Status | Error Code | Ý nghĩa | Hành động Frontend khuyến nghị |
| :--- | :--- | :--- | :--- |
| `400` | `VALIDATION_FAILED` | Dữ liệu gửi lên sai định dạng / thiếu trường. | Hiển thị lỗi tương ứng dưới từng input field. |
| `400` | `AUTH_CAPTCHA_REQUIRED` | Phát hiện nguy cơ bot, bắt buộc vượt qua CAPTCHA. | Hiển thị widget Cloudflare Turnstile trên màn hình. |
| `400` | `AUTH_CAPTCHA_FAILED` | Token Turnstile không hợp lệ hoặc đã hết hạn. | Reset lại widget Turnstile để người dùng thử lại. |
| `400` | `AUTH_DISPOSABLE_EMAIL` | Sử dụng email rác/email tạm thời. | Yêu cầu người dùng dùng email thực tế (Gmail, Outlook,...). |
| `400` | `AUTH_TOKEN_EXPIRED` | Mã OTP/Link xác thực/Token reset đã hết hạn. | Đề xuất nút "Gửi lại mã mới". |
| `401` | `AUTH_INVALID_CREDENTIALS` | Sai email hoặc mật khẩu. | Báo lỗi chung trên đầu form đăng nhập. |
| `401` | `AUTH_UNAUTHORIZED` | Access Token không hợp lệ hoặc đã hết hạn. | FE kích hoạt silent call tới `/refresh-token`. |
| `401` | `AUTH_REFRESH_TOKEN_EXPIRED`| Refresh Token hết hạn hoặc bị thu hồi. | Xóa session, điều hướng người dùng về trang Login. |
| `403` | `AUTH_EMAIL_NOT_VERIFIED` | Tài khoản chưa kích hoạt Email/OTP. | Mở modal nhập OTP hoặc nhắc kiểm tra hòm thư. |
| `403` | `AUTH_SHOP_PENDING_APPROVAL`| Tài khoản Shop đang chờ Admin phê duyệt. | Điều hướng sang trang `/shop/pending-approval`. |
| `403` | `AUTH_ACCOUNT_BANNED` | Tài khoản bị Admin cấm vĩnh viễn. | Hiển thị thông báo vi phạm kèm email hỗ trợ. |
| `403` | `FORBIDDEN_INSUFFICIENT_PERMISSIONS` | Không đủ quyền hạn truy cập tài nguyên. | Điều hướng về trang 403 hoặc trang chủ. |
| `409` | `AUTH_EMAIL_ALREADY_EXISTS` | Email đã có người đăng ký. | Báo lỗi trường email và gợi ý chuyển sang Đăng nhập. |
| `423` | `AUTH_ACCOUNT_LOCKED` | Khóa tạm thời do brute-force 10 lần sai. | Khóa form, đếm ngược thời gian mở khóa (15 phút). |
| `429` | `AUTH_RATE_LIMIT_EXCEEDED` | Gửi request quá nhanh (Spam đăng ký / OTP). | Hiển thị cảnh báo chờ $X$ giây trước khi thử lại. |

---

## 3. CHI TIẾT CÁC ENDPOINT (API SPECIFICATIONS)

---

### 3.1. Đăng ký Khách Hàng (`USER`)
- **Endpoint:** `POST /api/v1/auth/register`
- **Quyền truy cập:** Public (Bảo vệ bằng Honeypot & Turnstile)

#### Request Headers:
```http
Content-Type: application/json
```

#### Request Body:
```json
{
  "email": "khachhang@example.com",
  "fullName": "Nguyễn Văn A",
  "password": "Password123@",
  "confirmPassword": "Password123@",
  "termsAgreed": true,
  "turnstileToken": "0.xxxxxx.yyyyyy",      // Token từ Cloudflare Turnstile (nếu có)
  "extraNotes": ""                          // Trường Honeypot (Bắt buộc phải rỗng)
}
```

#### Response:
- **`HTTP 201 Created`**:
```json
{
  "success": true,
  "data": {
    "userId": "usr_9f8b7a6c",
    "email": "khachhang@example.com",
    "status": "PENDING_VERIFY",
    "message": "Đăng ký thành công. Vui lòng kiểm tra email để kích hoạt tài khoản."
  },
  "error": null,
  "timestamp": "2026-11-02T14:30:00.000Z"
}
```

---

### 3.2. Đăng ký Chủ Shop (`SHOP_OWNER`)
- **Endpoint:** `POST /api/v1/auth/register-shop`
- **Quyền truy cập:** Public

#### Request Body:
```json
{
  "email": "chushop@example.com",
  "fullName": "Trần Thị B",
  "password": "ShopPassword123@",
  "confirmPassword": "ShopPassword123@",
  "shopName": "FitVision Fashion Boutique",
  "phoneNumber": "0987654321",
  "shopAddress": "123 Đường Lê Duẩn, Quận 1, TP. Hồ Chí Minh",
  "taxCode": "0312345678",                 // Tùy chọn
  "termsAgreed": true,
  "turnstileToken": "0.xxxxxx.yyyyyy",
  "extraNotes": ""
}
```

#### Response:
- **`HTTP 201 Created`**:
```json
{
  "success": true,
  "data": {
    "userId": "usr_shop_123456",
    "email": "chushop@example.com",
    "role": "SHOP_OWNER",
    "status": "PENDING_APPROVAL",
    "message": "Đăng ký thành công! Hồ sơ cửa hàng đang chờ quản trị viên xét duyệt."
  },
  "error": null,
  "timestamp": "2026-11-02T14:30:00.000Z"
}
```

---

### 3.3. Xác thực Email / Kích hoạt tài khoản
- **Endpoint:** `POST /api/v1/auth/verify-email`
- **Quyền truy cập:** Public

#### Request Body (Hỗ trợ cả 2 hình thức: OTP 6 số hoặc Token qua Link):
```json
{
  "email": "khachhang@example.com",
  "otp": "482910"                           // Dùng cho modal nhập OTP
  // Hoặc: "verificationToken": "a8f3b2..." // Dùng cho click link kích hoạt
}
```

#### Response:
- **`HTTP 200 OK`**:
```json
{
  "success": true,
  "data": {
    "status": "ACTIVE",
    "message": "Kích hoạt tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ."
  },
  "error": null,
  "timestamp": "2026-11-02T14:32:00.000Z"
}
```

---

### 3.4. Gửi lại mã kích hoạt (Resend Verification)
- **Endpoint:** `POST /api/v1/auth/resend-verification`
- **Rate Limit:** Tối đa 3 lần / 15 phút trên 1 email

#### Request Body:
```json
{
  "email": "khachhang@example.com"
}
```

---

### 3.5. Đăng nhập (Login)
- **Endpoint:** `POST /api/v1/auth/login`
- **Quyền truy cập:** Public (Kiểm tra Brute-Force Rate Limiting)

#### Request Body:
```json
{
  "email": "khachhang@example.com",
  "password": "Password123@",
  "rememberMe": true,
  "turnstileToken": "0.xxxxxx"              // Gửi kèm nếu BE báo yêu cầu CAPTCHA
}
```

#### Response Headers:
```http
Set-Cookie: refreshToken=d8f1e...; Path=/api/v1/auth; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000
```

#### Response Body:
- **`HTTP 200 OK`**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900,                        // 900 giây (15 phút)
    "user": {
      "id": "usr_9f8b7a6c",
      "email": "khachhang@example.com",
      "fullName": "Nguyễn Văn A",
      "role": "USER",                       // "ADMIN" | "SHOP_OWNER" | "USER"
      "status": "ACTIVE",
      "avatarUrl": "https://cdn.fitvision3d.com/avatars/default.png"
    }
  },
  "error": null,
  "timestamp": "2026-11-02T14:35:00.000Z"
}
```

- **`HTTP 400 Bad Request` (Cần xác thực Captcha):**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "AUTH_CAPTCHA_REQUIRED",
    "message": "Bạn đã nhập sai nhiều lần. Vui lòng xác thực CAPTCHA để tiếp tục."
  },
  "timestamp": "2026-11-02T14:35:00.000Z"
}
```

---

### 3.6. Cấp mới Access Token (Refresh Token)
- **Endpoint:** `POST /api/v1/auth/refresh-token`
- **Quyền truy cập:** Yêu cầu có `refreshToken` hợp lệ trong Cookie.

#### Request Headers:
```http
Cookie: refreshToken=d8f1e...
```

#### Response Body:
- **`HTTP 200 OK`**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new_token...",
    "expiresIn": 900
  },
  "error": null,
  "timestamp": "2026-11-02T14:50:00.000Z"
}
```
*(Đồng thời ghi đè Refresh Token mới vào Cookie - Refresh Token Rotation).*

---

### 3.7. Đăng xuất (Logout)
- **Endpoint:** `POST /api/v1/auth/logout`
- **Quyền truy cập:** Authenticated (có Access Token hoặc Cookie)

#### Hành vi:
- Backend vô hiệu hóa Refresh Token trong Database.
- Xóa cookie: `Set-Cookie: refreshToken=; Path=/api/v1/auth; Max-Age=0; HttpOnly; Secure; SameSite=Lax`.

#### Response:
- **`HTTP 200 OK`**:
```json
{
  "success": true,
  "data": {
    "message": "Đăng xuất thành công."
  },
  "error": null,
  "timestamp": "2026-11-02T14:55:00.000Z"
}
```

---

### 3.8. Quên mật khẩu & Đặt lại mật khẩu (Password Recovery)

#### A. Yêu cầu link/mã quên mật khẩu:
- **Endpoint:** `POST /api/v1/auth/forgot-password`
- **Body:** `{ "email": "khachhang@example.com" }`
- **Bảo mật:** Luôn trả về `HTTP 200 OK` với thông báo: *"Nếu email của bạn tồn tại trên hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đến hòm thư."* (Tuyệt đối không báo lỗi nếu email không tồn tại).

#### B. Đặt lại mật khẩu mới:
- **Endpoint:** `POST /api/v1/auth/reset-password`
- **Body:**
```json
{
  "resetToken": "tok_reset_39b8c...",
  "newPassword": "NewPassword123@",
  "confirmPassword": "NewPassword123@"
}
```
- **Hành vi:** Đổi mật khẩu, hủy toàn bộ các phiên đăng nhập cũ (thu hồi toàn bộ Refresh Tokens của user).

---

### 3.9. Lấy thông tin phiên hiện tại (Get Profile / Me)
- **Endpoint:** `GET /api/v1/auth/me`
- **Headers:** `Authorization: Bearer <accessToken>`

#### Response Body:
```json
{
  "success": true,
  "data": {
    "id": "usr_9f8b7a6c",
    "email": "khachhang@example.com",
    "fullName": "Nguyễn Văn A",
    "role": "USER",
    "status": "ACTIVE",
    "createdAt": "2026-10-15T08:00:00.000Z"
  },
  "error": null,
  "timestamp": "2026-11-02T15:00:00.000Z"
}
```

