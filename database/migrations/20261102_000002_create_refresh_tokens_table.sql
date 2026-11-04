-- =============================================================================
-- FITVISION 3D - DATABASE MIGRATION SCRIPT
-- Migration: 20261102_000002_create_refresh_tokens_table.sql
-- Mục tiêu: Quản lý phiên đăng nhập Refresh Token, hỗ trợ Token Rotation & Replay Attack Defense
-- Tuân thủ: @docs/auth/04_SECURITY_AND_ANTI_SPAM.md
-- =============================================================================

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,       -- Lưu hash SHA-256 của Refresh Token
    token_family VARCHAR(64) NOT NULL,             -- Nhóm phiên đăng nhập (phát hiện tái sử dụng trái phép)
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,     -- Đã bị thu hồi hay chưa
    expires_at TIMESTAMPTZ NOT NULL,               -- Thời điểm hết hạn (7 ngày hoặc 30 ngày)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE
);

-- Đánh index phục vụ truy vấn tra cứu và dọn dẹp token
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family ON refresh_tokens (token_family);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens (expires_at);

-- =============================================================================
-- ROLLBACK SCRIPT (Dành cho hàm down())
-- =============================================================================
/*
DROP TABLE IF EXISTS refresh_tokens;
*/

