-- =============================================================================
-- FITVISION 3D - DATABASE MIGRATION SCRIPT
-- Migration: 20261102_000001_create_auth_and_shops_tables.sql
-- Mục tiêu: Tạo bảng `users` và bảng `shops` chuẩn hóa cho Auth & RBAC 3 Role
-- Tuân thủ: @.agent/rules/05-db-migration-rules.md & @docs/auth/01_BUSINESS_RULES.md
-- =============================================================================

-- Kích hoạt tiện ích mở rộng sinh UUID (nếu chưa có)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. HÀM TỰ ĐỘNG CẬP NHẬT CỘT updated_at
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 2. TẠO BẢNG: users (Tài khoản & Xác thực người dùng toàn hệ thống)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    
    -- Phân quyền 3 Vai trò cốt lõi (ADMIN | SHOP_OWNER | USER)
    role VARCHAR(20) NOT NULL DEFAULT 'USER'
        CONSTRAINT chk_users_role CHECK (role IN ('ADMIN', 'SHOP_OWNER', 'USER')),
        
    -- Vòng đời 5 Trạng thái tài khoản
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING_VERIFY'
        CONSTRAINT chk_users_status CHECK (status IN (
            'PENDING_VERIFY',   -- Chờ xác thực Email/OTP (User)
            'PENDING_APPROVAL', -- Chờ Admin phê duyệt (Shop Owner)
            'ACTIVE',           -- Hoạt động bình thường
            'LOCKED',           -- Khóa tạm thời do brute-force 10 lần
            'BANNED'            -- Bị cấm vĩnh viễn do vi phạm
        )),
        
    -- Trường kỹ thuật phục vụ chống Brute-force & Theo dõi phiên
    failed_login_attempts INT NOT NULL DEFAULT 0,
    lockout_until TIMESTAMPTZ NULL,
    last_login_at TIMESTAMPTZ NULL,
    
    -- Mốc thời gian hệ thống
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ràng buộc Email là duy nhất (không phân biệt chữ hoa/thường)
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_lower ON users (LOWER(email));

-- Đánh index tăng tốc độ truy vấn đăng nhập và lọc quyền
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users (status);
CREATE INDEX IF NOT EXISTS idx_users_lockout ON users (lockout_until);

-- Gắn Trigger tự động cập nhật updated_at cho users
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 3. TẠO BẢNG: shops (Hồ sơ Cửa hàng dành riêng cho SHOP_OWNER - Quan hệ 1-1)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL UNIQUE,
    shop_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    shop_address VARCHAR(255) NOT NULL,
    tax_code VARCHAR(20) NULL,
    logo_url VARCHAR(255) NULL,
    description TEXT NULL,
    approved_at TIMESTAMPTZ NULL,
    
    -- Mốc thời gian hệ thống
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Khóa ngoại liên kết chặt chẽ với users (Xóa user -> Xóa hồ sơ shop)
    CONSTRAINT fk_shops_owner FOREIGN KEY (owner_id) 
        REFERENCES users(id) ON DELETE CASCADE
);

-- Đánh index tìm kiếm theo chủ shop và tên cửa hàng
CREATE INDEX IF NOT EXISTS idx_shops_owner_id ON shops (owner_id);
CREATE INDEX IF NOT EXISTS idx_shops_approved_at ON shops (approved_at);

-- Gắn Trigger tự động cập nhật updated_at cho shops
DROP TRIGGER IF EXISTS trg_shops_updated_at ON shops;
CREATE TRIGGER trg_shops_updated_at
    BEFORE UPDATE ON shops
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROLLBACK SCRIPT (Dành cho hàm down())
-- =============================================================================
/*
DROP TRIGGER IF EXISTS trg_shops_updated_at ON shops;
DROP TABLE IF EXISTS shops;
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
DROP TABLE IF EXISTS users;
DROP FUNCTION IF EXISTS update_updated_at_column();
*/

