-- =============================================================================
-- FITVISION 3D - COMPLETE DATABASE SCHEMA (MERGED)
-- Gộp: Auth (Tài) + Business (FITVISION_3D_SPEC.md)
-- Target: PostgreSQL 16 | Database: fitvision3d
-- Ngày tạo: 2026-11-05
-- =============================================================================

-- Kích hoạt extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Hàm tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 1. BẢNG USERS (Auth - từ Tài, mở rộng thêm phone + avatar)
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NULL,
    custom_avatar_mesh_url TEXT NULL,

    -- Phân quyền 3 vai trò
    role VARCHAR(20) NOT NULL DEFAULT 'USER'
        CONSTRAINT chk_users_role CHECK (role IN ('ADMIN', 'SHOP_OWNER', 'USER')),

    -- Vòng đời 5 trạng thái tài khoản
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING_VERIFY'
        CONSTRAINT chk_users_status CHECK (status IN (
            'PENDING_VERIFY',
            'PENDING_APPROVAL',
            'ACTIVE',
            'LOCKED',
            'BANNED'
        )),

    -- Chống brute-force
    failed_login_attempts INT NOT NULL DEFAULT 0,
    lockout_until TIMESTAMPTZ NULL,
    last_login_at TIMESTAMPTZ NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_lower ON users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users (status);

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 2. BẢNG REFRESH_TOKENS (Auth - từ Tài)
-- =============================================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    token_family VARCHAR(64) NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family ON refresh_tokens (token_family);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens (expires_at);

-- =============================================================================
-- 3. BẢNG SHOPS (Auth - từ Tài, mở rộng thêm fields)
-- =============================================================================
CREATE TABLE IF NOT EXISTS shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL UNIQUE,
    shop_name VARCHAR(150) NOT NULL,
    brand_slug VARCHAR(100) UNIQUE,
    phone_number VARCHAR(15) NOT NULL,
    shop_address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NULL,
    contact_email VARCHAR(255) NULL,
    tax_code VARCHAR(20) NULL,
    business_license_no VARCHAR(50) NULL,
    logo_url VARCHAR(255) NULL,
    description TEXT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    approved_at TIMESTAMPTZ NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_shops_owner FOREIGN KEY (owner_id)
        REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_shops_owner_id ON shops (owner_id);

DROP TRIGGER IF EXISTS trg_shops_updated_at ON shops;
CREATE TRIGGER trg_shops_updated_at
    BEFORE UPDATE ON shops FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 4. BẢNG BIOMETRIC_INPUTS (Business - Dữ liệu đầu vào sinh trắc học)
-- =============================================================================
CREATE TABLE IF NOT EXISTS biometric_inputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    stature_cm NUMERIC(5,2) NOT NULL,
    weight_kg NUMERIC(5,2) NOT NULL,
    gender VARCHAR(10) NOT NULL
        CONSTRAINT chk_biometric_gender CHECK (gender IN ('male', 'female', 'neutral')),
    calculated_bmi NUMERIC(4,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_biometric_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_biometric_user_id ON biometric_inputs (user_id);

-- =============================================================================
-- 5. BẢNG MEASUREMENTS (Business - Kết quả đo AI)
-- =============================================================================
CREATE TABLE IF NOT EXISTS measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    input_id UUID NOT NULL,
    chest_circ_cm NUMERIC(5,2) NOT NULL,
    waist_circ_cm NUMERIC(5,2) NOT NULL,
    hip_circ_cm NUMERIC(5,2) NOT NULL,
    inseam_cm NUMERIC(5,2),
    shoulder_breadth_cm NUMERIC(5,2),
    arm_length_cm NUMERIC(5,2),
    extraction_confidence NUMERIC(3,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_measurements_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_measurements_input FOREIGN KEY (input_id)
        REFERENCES biometric_inputs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_measurements_user_id ON measurements (user_id);
CREATE INDEX IF NOT EXISTS idx_measurements_input_id ON measurements (input_id);

-- =============================================================================
-- 6. BẢNG MESH_PARAMETERS (Business - Thông số 3D model)
-- =============================================================================
CREATE TABLE IF NOT EXISTS mesh_parameters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    measurement_id UUID UNIQUE NOT NULL,
    base_gender_mesh VARCHAR(20) NOT NULL,
    scale_chest NUMERIC(4,3) NOT NULL,
    scale_waist NUMERIC(4,3) NOT NULL,
    scale_hips NUMERIC(4,3) NOT NULL,
    morph_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_mesh_measurement FOREIGN KEY (measurement_id)
        REFERENCES measurements(id) ON DELETE CASCADE
);

-- =============================================================================
-- 7. BẢNG GARMENT_CATEGORIES (Business - Loại trang phục)
-- =============================================================================
CREATE TABLE IF NOT EXISTS garment_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    target_gender VARCHAR(10) NOT NULL,
    primary_measurement VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed dữ liệu cơ bản
INSERT INTO garment_categories (name, target_gender, primary_measurement) VALUES
    ('Áo sơ mi nam', 'male', 'chest_circ_cm'),
    ('Áo thun nam', 'male', 'chest_circ_cm'),
    ('Quần tây nam', 'male', 'waist_circ_cm'),
    ('Quần jean nam', 'male', 'waist_circ_cm'),
    ('Áo sơ mi nữ', 'female', 'chest_circ_cm'),
    ('Áo thun nữ', 'female', 'chest_circ_cm'),
    ('Quần tây nữ', 'female', 'waist_circ_cm'),
    ('Váy / Đầm', 'female', 'waist_circ_cm'),
    ('Áo khoác unisex', 'neutral', 'chest_circ_cm')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 8. BẢNG BRAND_SIZE_CHARTS (Business - Bảng size thương hiệu)
-- =============================================================================
CREATE TABLE IF NOT EXISTS brand_size_charts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NULL,
    category_id INT NOT NULL,
    brand_name VARCHAR(100) NOT NULL,
    size_label VARCHAR(10) NOT NULL,
    min_chest NUMERIC(5,2),
    max_chest NUMERIC(5,2),
    min_waist NUMERIC(5,2),
    max_waist NUMERIC(5,2),
    min_hip NUMERIC(5,2),
    max_hip NUMERIC(5,2),
    ease_tolerance_cm NUMERIC(4,2) NOT NULL DEFAULT 0.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_size_chart_shop FOREIGN KEY (shop_id)
        REFERENCES shops(id) ON DELETE CASCADE,
    CONSTRAINT fk_size_chart_category FOREIGN KEY (category_id)
        REFERENCES garment_categories(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_size_charts_shop ON brand_size_charts (shop_id);
CREATE INDEX IF NOT EXISTS idx_size_charts_brand ON brand_size_charts (brand_name);

-- Seed bảng size phổ biến (Shopee / Uniqlo style)
INSERT INTO brand_size_charts (category_id, brand_name, size_label, min_chest, max_chest, min_waist, max_waist, min_hip, max_hip, ease_tolerance_cm) VALUES
    -- Áo sơ mi nam (category_id = 1)
    (1, 'Shopee Standard', 'S',   84, 88,  70, 74,  NULL, NULL, 2.0),
    (1, 'Shopee Standard', 'M',   88, 92,  74, 78,  NULL, NULL, 2.0),
    (1, 'Shopee Standard', 'L',   92, 96,  78, 82,  NULL, NULL, 2.0),
    (1, 'Shopee Standard', 'XL',  96, 100, 82, 86,  NULL, NULL, 2.0),
    (1, 'Shopee Standard', 'XXL', 100, 106, 86, 92, NULL, NULL, 2.0),
    -- Quần tây nam (category_id = 3)
    (3, 'Shopee Standard', 'S',   NULL, NULL, 70, 74, 88, 92,   1.5),
    (3, 'Shopee Standard', 'M',   NULL, NULL, 74, 78, 92, 96,   1.5),
    (3, 'Shopee Standard', 'L',   NULL, NULL, 78, 82, 96, 100,  1.5),
    (3, 'Shopee Standard', 'XL',  NULL, NULL, 82, 86, 100, 104, 1.5),
    (3, 'Shopee Standard', 'XXL', NULL, NULL, 86, 92, 104, 110, 1.5)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 9. BẢNG RECOMMENDATIONS (Business - Gợi ý size)
-- =============================================================================
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    measurement_id UUID NOT NULL,
    size_chart_id UUID NULL,
    recommended_size VARCHAR(10) NOT NULL,
    fit_type VARCHAR(20) NOT NULL,
    chest_delta_cm NUMERIC(4,2),
    waist_delta_cm NUMERIC(4,2),
    gemini_advisor_tip TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_recommendation_measurement FOREIGN KEY (measurement_id)
        REFERENCES measurements(id) ON DELETE CASCADE,
    CONSTRAINT fk_recommendation_size_chart FOREIGN KEY (size_chart_id)
        REFERENCES brand_size_charts(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_recommendations_measurement ON recommendations (measurement_id);

-- =============================================================================
-- 10. BẢNG SYSTEM_AUDIT_LOGS (Audit - Log hệ thống)
-- =============================================================================
CREATE TABLE IF NOT EXISTS system_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NULL,
    measurement_id UUID NULL,
    action_type VARCHAR(50) NOT NULL,
    execution_time_ms INT NOT NULL,
    zero_retention_flag BOOLEAN NOT NULL DEFAULT TRUE,
    ip_address_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_audit_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_audit_measurement FOREIGN KEY (measurement_id)
        REFERENCES measurements(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_user_id ON system_audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON system_audit_logs (action_type);

-- =============================================================================
-- 11. SEED TÀI KHOẢN ADMIN
-- =============================================================================
INSERT INTO users (id, email, password_hash, full_name, role, status, failed_login_attempts)
VALUES (
    gen_random_uuid(),
    'admin@fitvision3d.com',
    crypt('AdminFitVision2026@', gen_salt('bf', 12)),
    'System Super Administrator',
    'ADMIN', 'ACTIVE', 0
),
(
    '708f1bd6-f6fa-4bfe-b7d2-ad1c260d6625',
    'levanthang0166@gmail.com',
    crypt('FitVision@2026', gen_salt('bf', 12)),
    'Lê Văn Thắng',
    'ADMIN', 'ACTIVE', 0
)
ON CONFLICT (LOWER(email)) DO UPDATE
SET role = 'ADMIN', status = 'ACTIVE';

-- =============================================================================
-- KIỂM TRA KẾT QUẢ
-- =============================================================================
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

