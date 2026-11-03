-- =============================================================================
-- FITVISION 3D - DATABASE SEEDER SCRIPT
-- Seeder: 20261102_000003_seed_admin_user.sql
-- Mục tiêu: Khởi tạo tài khoản Quản trị viên hệ thống (ADMIN) đầu tiên
-- Tuân thủ: @.agent/rules/03-rbac-authorization-rules.md & @.agent/rules/05-db-migration-rules.md
-- =============================================================================

-- Bật extension pgcrypto để sinh hash bcrypt an toàn
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Chèn tài khoản ADMIN (Chỉ thực hiện nếu chưa tồn tại email này)
INSERT INTO users (
    id,
    email,
    password_hash,
    full_name,
    role,
    status,
    failed_login_attempts,
    lockout_until,
    last_login_at,
    created_at,
    updated_at
)
VALUES (
    gen_random_uuid(),
    'admin@fitvision3d.com',
    -- Sử dụng hàm crypt() của PostgreSQL pgcrypto với thuật toán Blowfish (bcrypt) rounds = 12
    -- Mật khẩu mặc định khởi tạo: AdminFitVision2026@
    crypt('AdminFitVision2026@', gen_salt('bf', 12)),
    'System Super Administrator',
    'ADMIN',
    'ACTIVE',
    0,
    NULL,
    NULL,
    NOW(),
    NOW()
)
ON CONFLICT (LOWER(email)) DO NOTHING;

-- Kiểm tra kết quả khởi tạo
SELECT id, email, full_name, role, status, created_at 
FROM users 
WHERE email = 'admin@fitvision3d.com';

