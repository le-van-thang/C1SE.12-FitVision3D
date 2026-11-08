# HƯỚNG DẪN THỰC THI DATABASE MIGRATIONS & SEEDER
**Dự án:** FitVision3D / Fashion3D  
**Hệ quản trị CSDL:** PostgreSQL / Supabase  
**Tuân thủ:** [`05-db-migration-rules.md`](file:///e:/Fashion3D_AI/.agent/rules/05-db-migration-rules.md)

---

## 1. DANH SÁCH FILE ĐÃ KHỞI TẠO

```text
database/
├── migrations/
│   ├── 20261102_000001_create_auth_and_shops_tables.sql  # Bảng users và shops (1-1)
│   └── 20261102_000002_create_refresh_tokens_table.sql   # Bảng refresh_tokens (JWT Rotation)
└── seeders/
    └── 20261102_000003_seed_admin_user.sql               # Tạo tài khoản ADMIN mặc định
```

---

## 2. THỨ TỰ CHẠY (EXECUTION SEQUENCE)

Bắt buộc chạy theo đúng thứ tự đánh số:

1. **Bước 1 (Tạo bảng users & shops):**  
   Chạy file `database/migrations/20261102_000001_create_auth_and_shops_tables.sql`
2. **Bước 2 (Tạo bảng refresh_tokens):**  
   Chạy file `database/migrations/20261102_000002_create_refresh_tokens_table.sql`
3. **Bước 3 (Khởi tạo Super Admin):**  
   Chạy file `database/seeders/20261102_000003_seed_admin_user.sql`

---

## 3. CÁC HÌNH THỨC THỰC THI

### Cách 1: Chạy trên Supabase Dashboard (Nếu dùng Supabase Cloud)
1. Đăng nhập vào trang quản trị Supabase của dự án.
2. Điều hướng tới mục **SQL Editor** ở thanh menu bên trái.
3. Mở lần lượt từng file `.sql` ở trên, copy toàn bộ nội dung và bấm **Run**.

---

### Cách 2: Chạy qua dòng lệnh PostgreSQL (`psql`)
Mở PowerShell tại thư mục gốc của dự án:
```powershell
# Chạy Migration 1
psql -U postgres -d fitvision3d -f database/migrations/20261102_000001_create_auth_and_shops_tables.sql

# Chạy Migration 2
psql -U postgres -d fitvision3d -f database/migrations/20261102_000002_create_refresh_tokens_table.sql

# Chạy Seeder Admin
psql -U postgres -d fitvision3d -f database/seeders/20261102_000003_seed_admin_user.sql
```

---

### Cách 3: Chạy qua công cụ GUI (DBeaver / pgAdmin / Navicat)
1. Mở cửa sổ **SQL Query Console / Tool** kết nối tới database `fitvision3d`.
2. Mở file `.sql` tương ứng và thực thi (Execute Script `Alt + X` hoặc `F5`).

---

## 4. THÔNG TIN TÀI KHOẢN ADMIN KHỞI TẠO BAN ĐẦU
Sau khi chạy Seeder, bạn có thể dùng tài khoản này để đăng nhập vào trang quản trị:
- **Email:** `admin@fitvision3d.com`
- **Mật khẩu khởi tạo:** `AdminFitVision2026@`
- **Role:** `ADMIN`
- **Status:** `ACTIVE`
- *(Lưu ý: Mật khẩu đã được mã hóa bằng thuật toán `bcrypt` với cost factor = 12 thông qua hàm `crypt()` của pgcrypto).*

