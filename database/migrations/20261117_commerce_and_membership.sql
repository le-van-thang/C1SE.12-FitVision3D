-- ============================================================================
-- FitVision 3D - Commerce, CMS, Catalog Moderation & Real Membership Schema
-- Date: 2026-11-17
-- ============================================================================

-- 1. Platform CMS Settings (Marquee + Hero Banner)
CREATE TABLE IF NOT EXISTS platform_settings (
  id VARCHAR(40) PRIMARY KEY DEFAULT 'default',
  marquee_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  marquee_items_vi JSONB NOT NULL DEFAULT '[]'::jsonb,
  marquee_items_en JSONB NOT NULL DEFAULT '[]'::jsonb,
  hero_badge_vi TEXT NOT NULL DEFAULT 'NỀN TẢNG THỜI TRANG MAY ĐO & ĐO SIZE 3D THẾ HỆ MỚI',
  hero_title_vi TEXT NOT NULL DEFAULT 'Phong Cách May Đo',
  hero_highlight_vi TEXT NOT NULL DEFAULT 'Chuẩn Xác',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Platform & Membership Vouchers
CREATE TABLE IF NOT EXISTS vouchers (
  code VARCHAR(40) PRIMARY KEY,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('fixed', 'percent')),
  discount_value INTEGER NOT NULL CHECK (discount_value > 0),
  title_vi TEXT NOT NULL,
  title_en TEXT NOT NULL,
  sub_vi TEXT NOT NULL DEFAULT '',
  sub_en TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  show_on_storefront BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Products Catalog (Pre-seeded with 6 Signature Atelier Items, Admin price/visibility control)
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(50) PRIMARY KEY,
  brand_name VARCHAR(160) NOT NULL,
  name VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  slug VARCHAR(255) NOT NULL,
  category VARCHAR(40) NOT NULL,
  gender_target VARCHAR(20) NOT NULL DEFAULT 'unisex',
  price INTEGER NOT NULL CHECK (price > 0),
  sale_price INTEGER,
  rating NUMERIC(3,2) NOT NULL DEFAULT 4.90,
  reviews_count INTEGER NOT NULL DEFAULT 0,
  fabric_material TEXT NOT NULL,
  fabric_material_en TEXT,
  stretch_type VARCHAR(100) NOT NULL DEFAULT 'Không co giãn',
  image_url TEXT NOT NULL,
  secondary_image_url TEXT,
  description TEXT NOT NULL,
  description_en TEXT,
  is_bestseller BOOLEAN NOT NULL DEFAULT FALSE,
  is_bespoke BOOLEAN NOT NULL DEFAULT FALSE,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  variants JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Orders Table (Real Checkout + Admin/Shop Dispatch)
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(40) PRIMARY KEY,
  customer_id VARCHAR(120) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  recipient JSONB NOT NULL,
  items JSONB NOT NULL,
  subtotal INTEGER NOT NULL,
  shipping_fee INTEGER NOT NULL DEFAULT 0,
  discount_amount INTEGER NOT NULL DEFAULT 0,
  total_amount INTEGER NOT NULL,
  payment_method VARCHAR(40) NOT NULL DEFAULT 'cod',
  payment_status VARCHAR(40) NOT NULL DEFAULT 'unpaid',
  status VARCHAR(40) NOT NULL DEFAULT 'pending',
  store_name VARCHAR(255),
  estimated_delivery VARCHAR(40),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);

-- 5. User Memberships (Real PostgreSQL Atelier Loyalty Wallet & Tiering)
CREATE TABLE IF NOT EXISTS user_memberships (
  user_id VARCHAR(120) PRIMARY KEY,
  total_spend INTEGER NOT NULL DEFAULT 0,
  tier_id VARCHAR(20) NOT NULL DEFAULT 'member',
  bonus_points INTEGER NOT NULL DEFAULT 90,
  spent_points INTEGER NOT NULL DEFAULT 0,
  unlocked_codes JSONB NOT NULL DEFAULT '["FITMEMBER50"]'::jsonb,
  last_check_in_date VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Membership Point Transaction Logs
CREATE TABLE IF NOT EXISTS membership_point_logs (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(120) NOT NULL,
  action_type VARCHAR(40) NOT NULL,
  points_delta INTEGER NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_membership_logs_user ON membership_point_logs (user_id, created_at DESC);
