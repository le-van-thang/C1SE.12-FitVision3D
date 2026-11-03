# RULE: QUẢN LÝ DATABASE VÀ MIGRATION (DATABASE MIGRATION RULES)
**Áp dụng:** Toàn bộ thành viên phát triển Backend & Database

---

## 1. NGUYÊN TẮC VÀNG: KHÔNG SỬA TRỰC TIẾP TRÊN DATABASE GUI
1. **Tuyệt đối không dùng các công cụ UI** (như DBeaver, Navicat, pgAdmin, phpMyAdmin) để tự ý tạo bảng, thêm/sửa/xóa cột trên Database dùng chung hoặc local mà không tạo file code tương ứng.
2. Mọi thay đổi cấu trúc bảng (Schema changes) **BẮT BUỘC** phải được ghi lại bằng một **File Migration** trong mã nguồn (vd: TypeORM, Prisma, Knex, Sequelize, Flyway, Alembic).

---

## 2. QUY CHUẨN ĐẶT TÊN & NỘI DUNG MIGRATION
1. **Tên file Migration:** Bắt buộc có tiền tố timestamp hoặc số thứ tự tăng dần và mô tả ngắn gọn:
   - Ví dụ: `20261102_150000_create_users_table.ts` hoặc `20261102_160000_add_rbac_and_shop_to_users.ts`.
2. **Tính độc lập & Khả năng Rollback (Hoàn tác):**
   - Mỗi file migration nên có cả 2 hàm: `up()` (áp dụng thay đổi) và `down()` (hủy bỏ thay đổi) khi dùng các framework hỗ trợ.
   - Không được sửa nội dung của một file migration đã được merge vào nhánh chính (`main`/`develop`) và đã chạy trên máy của đồng đội. Nếu cần sửa, phải **tạo một file migration mới** tiếp theo.

---

## 3. CẤU TRÚC BẢNG `users` PHỤC VỤ AUTH & RBAC (CHUẨN HÓA)
Khi bạn hoặc đồng nghiệp tạo/cập nhật bảng `users`, bắt buộc đảm bảo các cột dữ liệu sau:

```sql
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,                         -- UUID v4
    email VARCHAR(255) UNIQUE NOT NULL,                 -- Email chuẩn RFC 5322 (lowercase)
    password_hash VARCHAR(255) NOT NULL,                -- Hash Argon2id hoặc bcrypt
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',           -- 'ADMIN' | 'SHOP_OWNER' | 'USER'
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING_VERIFY',-- 'PENDING_VERIFY' | 'PENDING_APPROVAL' | 'ACTIVE' | 'LOCKED' | 'BANNED'
    
    -- Thông tin bổ sung cho Chủ Shop (SHOP_OWNER)
    shop_name VARCHAR(150) NULL,
    phone_number VARCHAR(15) NULL,
    shop_address VARCHAR(255) NULL,
    tax_code VARCHAR(20) NULL,
    
    -- Trường kỹ thuật & bảo mật
    failed_login_attempts INT DEFAULT 0,                -- Đếm số lần nhập sai liên tiếp
    lockout_until TIMESTAMP NULL,                       -- Thời điểm hết hạn khóa tạm thời
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. DỮ LIỆU KHỞI TẠO BAN ĐẦU (SEEDERS)
1. Tài khoản `ADMIN` đầu tiên của hệ thống **BẮT BUỘC** phải được tạo thông qua script **Seeder** (hoặc CLI command), không tạo qua API:
   - Email: `admin@fitvision3d.com` (hoặc cấu hình qua biến môi trường `INITIAL_ADMIN_EMAIL`).
   - Mật khẩu: Phải hash chuẩn trước khi nạp vào DB.
   - `role: 'ADMIN'`, `status: 'ACTIVE'`.
2. Không commit dữ liệu tài khoản test cá nhân vào file Seeder chung của dự án.

---

## 5. QUY TRÌNH KHI PULL CODE TỪ ĐỒNG NGHIỆP
Mỗi lần pull code mới từ GitHub về có dính tới database:
```bash
# 1. Kéo code mới
git pull origin develop

# 2. Chạy lệnh cập nhật database ngay lập tức
npm run migrate:up   # (hoặc: npx prisma migrate dev / alembic upgrade head)
```
Nếu có lỗi xung đột migration, liên hệ ngay với người vừa commit file migration đó để đối soát, không tự ý xóa bảng hay drop database.

