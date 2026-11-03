# RULE: QUẢN LÝ BIẾN MÔI TRƯỜNG & BẢO MẬT SECRET (ENV & SECRET RULES)
**Áp dụng:** Toàn bộ thành viên phát triển và cấu hình hạ tầng

---

## 1. NGUYÊN TẮC BẢO MẬT BIẾN MÔI TRƯỜNG
1. **Tuyệt đối cấm commit file `.env` lên GitHub:**
   - File `.env` chứa mật khẩu cơ sở dữ liệu, JWT Secret, API Keys thực tế.
   - Luôn kiểm tra file `.gitignore` phải chứa các dòng:
     ```gitignore
     .env
     .env.local
     .env.production
     *.pem
     *.key
     ```
2. **Luôn duy trì và đồng bộ file `.env.example`:**
   - Mỗi khi bạn hoặc đồng nghiệp thêm một biến môi trường mới vào Backend hoặc Frontend, **BẮT BUỘC** phải thêm biến đó vào `.env.example` với giá trị mẫu/giả lập và ghi chú ý nghĩa.

---

## 2. DANH MỤC BIẾN MÔI TRƯỜNG CHUẨN CẦN CÓ (VÍ DỤ CHO BACKEND)

Nội dung chuẩn của file `.env.example`:

```bash
# ==========================================
# CẤU HÌNH CỔNG & MÔI TRƯỜNG
# ==========================================
NODE_ENV=development
PORT=5000
API_PREFIX=/api/v1
CLIENT_ORIGIN=http://localhost:3000

# ==========================================
# CƠ SỞ DỮ LIỆU
# ==========================================
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_secure_password_here
DB_NAME=fitvision3d

# ==========================================
# XÁC THỰC & BẢO MẬT TOKEN (JWT & COOKIE)
# ==========================================
# Sinh ngẫu nhiên: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_ACCESS_SECRET=your_super_secret_jwt_access_key_min_32_chars
JWT_ACCESS_EXPIRES_IN=15m

JWT_REFRESH_SECRET=your_super_secret_jwt_refresh_key_min_32_chars
JWT_REFRESH_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN_REMEMBER=30d

# ==========================================
# CHỐNG BOT (CLOUDFLARE TURNSTILE)
# ==========================================
TURNSTILE_SITE_KEY=0x4AAAAAA...
TURNSTILE_SECRET_KEY=0x4AAAAAA...

# ==========================================
# TÍCH HỢP AI-TAILOR 3D WORKER
# ==========================================
AI_TAILOR_SERVICE_URL=http://localhost:8000
INTERNAL_SERVICE_API_KEY=fitvision_internal_ai_secret_key_2026

# ==========================================
# DỊCH VỤ EMAIL (GỬI OTP / XÁC THỰC)
# ==========================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=no-reply@fitvision3d.com
SMTP_PASS=your_app_password
EMAIL_FROM="FitVision3D Support <no-reply@fitvision3d.com>"
```

---

## 3. CƠ CHẾ VALIDATE BIẾN MÔI TRƯỜNG KHI KHỞI ĐỘNG (FAIL-FAST)
- Backend **BẮT BUỘC** phải kiểm tra các biến môi trường quan trọng ngay khi khởi chạy (sử dụng Zod, Envalid, hoặc Joi).
- Nếu thiếu một biến bắt buộc (như `JWT_ACCESS_SECRET` hoặc `DB_HOST`), ứng dụng phải **dừng ngay lập tức (Exit Process with Code 1)** kèm thông báo lỗi rõ ràng trên terminal, thay vì chạy tiếp rồi báo lỗi lúc người dùng gọi API.

