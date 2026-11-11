-- ========================================================
-- FITVISION 3D - POSTGRESQL EXTENSION SCHEMA FOR E-COMMERCE
-- Chạy trên cơ sở dữ liệu PostgreSQL 16 hiện tại
-- Không làm ảnh hưởng hoặc thay đổi dữ liệu các bảng cũ
-- ========================================================

-- 1. BẢNG SẢN PHẨM THỜI TRANG (PRODUCTS)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  category_id INT NOT NULL REFERENCES garment_categories(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  fabric_material VARCHAR(100),
  stretch_factor NUMERIC(3,2) NOT NULL DEFAULT 1.00,
  base_price NUMERIC(12,0) NOT NULL,
  sale_price NUMERIC(12,0),
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  model_3d_asset_url TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. BẢNG BIẾN THỂ SẢN PHẨM: SIZE & MÀU (PRODUCT_VARIANTS)
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size_label VARCHAR(10) NOT NULL, -- S, M, L, XL, 30, 31...
  color_name VARCHAR(50) NOT NULL,
  color_hex VARCHAR(10) NOT NULL,
  sku VARCHAR(60) UNIQUE NOT NULL,
  stock_quantity INT NOT NULL DEFAULT 0,
  additional_price NUMERIC(12,0) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. BẢNG THÔNG SỐ MAY MẶC CHI TIẾT CỦA TỪNG SIZE (PRODUCT_GARMENT_SPECS)
-- Dùng để AI so khớp trực tiếp với bảng measurements của người dùng
CREATE TABLE IF NOT EXISTS product_garment_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID UNIQUE NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  garment_chest_cm NUMERIC(5,2),
  garment_waist_cm NUMERIC(5,2),
  garment_hips_cm NUMERIC(5,2),
  garment_shoulder_cm NUMERIC(5,2),
  garment_sleeve_cm NUMERIC(5,2),
  garment_length_cm NUMERIC(5,2),
  ease_tolerance_min NUMERIC(4,2) NOT NULL DEFAULT 2.0,
  ease_tolerance_max NUMERIC(4,2) NOT NULL DEFAULT 6.0
);

-- 4. BẢNG GIỎ HÀNG (CARTS & CART_ITEMS)
CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
  quantity INT NOT NULL DEFAULT 1,
  is_ai_recommended BOOLEAN NOT NULL DEFAULT FALSE,
  fit_score_snapshot NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. BẢNG ĐƠN HÀNG (ORDERS & ORDER_ITEMS)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  order_code VARCHAR(30) UNIQUE NOT NULL,
  total_amount NUMERIC(12,0) NOT NULL,
  shipping_fee NUMERIC(12,0) NOT NULL DEFAULT 0,
  recipient_name VARCHAR(100) NOT NULL,
  recipient_phone VARCHAR(20) NOT NULL,
  shipping_address TEXT NOT NULL,
  order_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  payment_status VARCHAR(20) NOT NULL DEFAULT 'UNPAID',
  payment_method VARCHAR(20) NOT NULL DEFAULT 'COD',
  customer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
  product_name VARCHAR(255) NOT NULL,
  size_label VARCHAR(10) NOT NULL,
  color_name VARCHAR(50) NOT NULL,
  unit_price NUMERIC(12,0) NOT NULL,
  quantity INT NOT NULL,
  subtotal NUMERIC(12,0) NOT NULL
);

-- 6. BẢNG ĐÁNH GIÁ SẢN PHẨM & ĐỘ CHUẨN SIZE (PRODUCT_REVIEWS)
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  rating_star SMALLINT NOT NULL CHECK (rating_star BETWEEN 1 AND 5),
  fit_feedback VARCHAR(20) NOT NULL, -- 'TOO_SMALL' | 'JUST_RIGHT' | 'TOO_LARGE'
  comment TEXT,
  review_images JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

