# 🏛️ FITVISION 3D (FV3D) - DATABASE DESIGN SPECIFICATION
> **Hệ quản trị:** PostgreSQL 16 (Hỗ trợ UUID, JSONB, RLS, Audit Logs)  
> **Công cụ trực quan hóa ERD:** dbdiagram.io (Cú pháp chuẩn DBML)  
> **Nguyên tắc:** Giữ nguyên 100% các bảng Auth, Shop, Sinh trắc học & 3D hiện có; mở rộng nhóm E-Commerce Sàn thời trang.

---

## 📋 1. MÃ NGUỒN DBML HOÀN CHỈNH (COPY VÀO DBDÍAGRAM.IO)

```dbml
// ========================================================
// FITVISION 3D (FV3D) - DATABASE DESIGN SPECIFICATION
// Standard Architecture: Monorepo Express + PostgreSQL + AI
// ========================================================

// ========================================================
// --- NHÓM 1: ĐỊNH DANH & XÁC THỰC (AUTH & USERS) ---
// ========================================================
Table users {
  id uuid [pk, default: `gen_random_uuid()`]
  email varchar(255) [unique, not null]
  password_hash varchar(255) [not null]
  full_name varchar(100) [not null]
  phone varchar(20)
  custom_avatar_mesh_url text
  role varchar(20) [not null, default: 'USER', note: 'ADMIN | SHOP_OWNER | USER']
  status varchar(20) [not null, default: 'PENDING_VERIFY', note: 'PENDING_VERIFY | PENDING_APPROVAL | ACTIVE | LOCKED | BANNED']
  failed_login_attempts int [not null, default: 0]
  lockout_until timestamptz
  last_login_at timestamptz
  created_at timestamptz [not null, default: `now()`]
  updated_at timestamptz [not null, default: `now()`]
}

Table refresh_tokens {
  id uuid [pk, default: `gen_random_uuid()`]
  user_id uuid [not null]
  token_hash varchar(255) [unique, not null]
  token_family varchar(64) [not null]
  is_revoked boolean [not null, default: false]
  expires_at timestamptz [not null]
  created_at timestamptz [not null, default: `now()`]
}

Table system_audit_logs {
  id bigserial [pk]
  user_id uuid [null]
  measurement_id uuid [null]
  action_type varchar(50) [not null]
  execution_time_ms int [not null]
  zero_retention_flag boolean [not null, default: true]
  ip_address_hash varchar(64) [not null]
  created_at timestamptz [not null, default: `now()`]
}

// ========================================================
// --- NHÓM 2: GIAN HÀNG & BẢNG SIZE TRANG PHỤC ---
// ========================================================
Table shops {
  id uuid [pk, default: `gen_random_uuid()`]
  owner_id uuid [unique, not null]
  shop_name varchar(150) [not null]
  brand_slug varchar(100) [unique]
  phone_number varchar(15) [not null]
  shop_address varchar(255) [not null]
  city varchar(100)
  contact_email varchar(255)
  tax_code varchar(20)
  business_license_no varchar(50)
  logo_url varchar(255)
  description text
  is_verified boolean [not null, default: false]
  approved_at timestamptz
  created_at timestamptz [not null, default: `now()`]
  updated_at timestamptz [not null, default: `now()`]
}

Table garment_categories {
  id serial [pk]
  name varchar(50) [not null]
  slug varchar(80) [unique, not null]
  target_gender varchar(10) [not null, note: 'male | female | unisex']
  primary_measurement varchar(30) [not null]
  created_at timestamptz [not null, default: `now()`]
}

Table brand_size_charts {
  id uuid [pk, default: `gen_random_uuid()`]
  shop_id uuid [null]
  category_id int [not null]
  brand_name varchar(100) [not null]
  size_label varchar(10) [not null]
  min_chest numeric(5,2)
  max_chest numeric(5,2)
  min_waist numeric(5,2)
  max_waist numeric(5,2)
  min_hip numeric(5,2)
  max_hip numeric(5,2)
  ease_tolerance_cm numeric(4,2) [not null, default: 0.0]
  created_at timestamptz [not null, default: `now()`]
}

// ========================================================
// --- NHÓM 3: THÔNG SỐ SINH TRẮC & 3D MESH RECOVERY ---
// ========================================================
Table biometric_inputs {
  id uuid [pk, default: `gen_random_uuid()`]
  user_id uuid [not null]
  stature_cm numeric(5,2) [not null]
  weight_kg numeric(5,2) [not null]
  gender varchar(10) [not null, note: 'male | female | neutral']
  calculated_bmi numeric(4,2)
  created_at timestamptz [not null, default: `now()`]

  indexes {
    (id, user_id) [unique, name: "uq_biometric_input_user"]
  }
}

Table measurements {
  id uuid [pk, default: `gen_random_uuid()`]
  user_id uuid [not null]
  input_id uuid [not null]
  chest_circ_cm numeric(5,2) [not null]
  waist_circ_cm numeric(5,2) [not null]
  hip_circ_cm numeric(5,2) [not null]
  inseam_cm numeric(5,2)
  shoulder_breadth_cm numeric(5,2)
  arm_length_cm numeric(5,2)
  bicep_circ_cm numeric(5,2)
  wrist_circ_cm numeric(5,2)
  thigh_circ_cm numeric(5,2)
  calf_circ_cm numeric(5,2)
  ankle_circ_cm numeric(5,2)
  extraction_confidence numeric(3,2)
  created_at timestamptz [not null, default: `now()`]
}

Table mesh_parameters {
  id uuid [pk, default: `gen_random_uuid()`]
  measurement_id uuid [unique, not null]
  base_gender_mesh varchar(20) [not null]
  scale_chest numeric(4,3) [not null]
  scale_waist numeric(4,3) [not null]
  scale_hips numeric(4,3) [not null]
  morph_payload jsonb
  created_at timestamptz [not null, default: `now()`]
}

// ========================================================
// --- NHÓM 4: KHUYẾN NGHỊ SIZE & HỒ SƠ MAY MẶC ---
// ========================================================
Table recommendations {
  id uuid [pk, default: `gen_random_uuid()`]
  measurement_id uuid [not null]
  size_chart_id uuid [null]
  recommended_size varchar(10) [not null]
  fit_type varchar(20) [not null]
  chest_delta_cm numeric(4,2)
  waist_delta_cm numeric(4,2)
  gemini_advisor_tip text
  created_at timestamptz [not null, default: `now()`]
}

Table tailor_dossiers {
  id uuid [pk, default: `gen_random_uuid()`]
  measurement_id uuid [not null]
  shop_id uuid [not null]
  access_token varchar(64) [unique, not null]
  token_expires_at timestamptz [not null]
  pdf_export_url text
  created_at timestamptz [not null, default: `now()`]
}

// ========================================================
// --- NHÓM 5: THƯƠNG MẠI ĐIỆN TỬ, SẢN PHẨM & SIZE MAY MẶC (MỚI) ---
// ========================================================
Table products {
  id uuid [pk, default: `gen_random_uuid()`]
  shop_id uuid [not null]
  category_id int [not null]
  name varchar(255) [not null]
  slug varchar(255) [unique, not null]
  description text
  fabric_material varchar(100)
  stretch_factor numeric(3,2) [not null, default: 1.00, note: 'Độ co giãn vải (1.0 = không dãn)']
  base_price numeric(12,0) [not null]
  sale_price numeric(12,0)
  images jsonb [not null, note: 'Mảng danh sách URL ảnh']
  model_3d_asset_url text [note: 'File 3D trang phục GLTF/GLB để thử đồ']
  is_featured boolean [not null, default: false]
  is_published boolean [not null, default: true]
  created_at timestamptz [not null, default: `now()`]
  updated_at timestamptz [not null, default: `now()`]
}

Table product_variants {
  id uuid [pk, default: `gen_random_uuid()`]
  product_id uuid [not null]
  size_label varchar(10) [not null, note: 'S | M | L | XL | 30 | 31']
  color_name varchar(50) [not null]
  color_hex varchar(10) [not null]
  sku varchar(60) [unique, not null]
  stock_quantity int [not null, default: 0]
  additional_price numeric(12,0) [not null, default: 0]
  created_at timestamptz [not null, default: `now()`]
}

Table product_garment_specs {
  id uuid [pk, default: `gen_random_uuid()`]
  variant_id uuid [unique, not null]
  garment_chest_cm numeric(5,2) [note: 'Vòng ngực thực tế áo']
  garment_waist_cm numeric(5,2) [note: 'Vòng eo thực tế áo/quần']
  garment_hips_cm numeric(5,2) [note: 'Vòng hông thực tế']
  garment_shoulder_cm numeric(5,2) [note: 'Rộng vai áo']
  garment_sleeve_cm numeric(5,2) [note: 'Dài tay áo']
  garment_length_cm numeric(5,2) [note: 'Chiều dài thân áo / Dài quần']
  ease_tolerance_min numeric(4,2) [not null, default: 2.0]
  ease_tolerance_max numeric(4,2) [not null, default: 6.0]
}

// ========================================================
// --- NHÓM 6: GIỎ HÀNG, ĐẶT HÀNG & ĐÁNH GIÁ (MỚI) ---
// ========================================================
Table carts {
  id uuid [pk, default: `gen_random_uuid()`]
  user_id uuid [unique, not null]
  created_at timestamptz [not null, default: `now()`]
  updated_at timestamptz [not null, default: `now()`]
}

Table cart_items {
  id uuid [pk, default: `gen_random_uuid()`]
  cart_id uuid [not null]
  variant_id uuid [not null]
  quantity int [not null, default: 1]
  is_ai_recommended boolean [not null, default: false]
  fit_score_snapshot numeric(5,2) [note: '% vừa vặn lúc add giỏ hàng, vd 98.5%']
  created_at timestamptz [not null, default: `now()`]
  updated_at timestamptz [not null, default: `now()`]
}

Table orders {
  id uuid [pk, default: `gen_random_uuid()`]
  user_id uuid [not null]
  order_code varchar(30) [unique, not null]
  total_amount numeric(12,0) [not null]
  shipping_fee numeric(12,0) [not null, default: 0]
  recipient_name varchar(100) [not null]
  recipient_phone varchar(20) [not null]
  shipping_address text [not null]
  order_status varchar(20) [not null, default: 'PENDING', note: 'PENDING | CONFIRMED | SHIPPING | DELIVERED | CANCELLED']
  payment_status varchar(20) [not null, default: 'UNPAID', note: 'UNPAID | PAID | REFUNDED']
  payment_method varchar(20) [not null, default: 'COD', note: 'COD | VNPAY | MOMO | BANK_TRANSFER']
  customer_notes text
  created_at timestamptz [not null, default: `now()`]
  updated_at timestamptz [not null, default: `now()`]
}

Table order_items {
  id uuid [pk, default: `gen_random_uuid()`]
  order_id uuid [not null]
  variant_id uuid [not null]
  product_name varchar(255) [not null]
  size_label varchar(10) [not null]
  color_name varchar(50) [not null]
  unit_price numeric(12,0) [not null]
  quantity int [not null]
  subtotal numeric(12,0) [not null]
}

Table product_reviews {
  id uuid [pk, default: `gen_random_uuid()`]
  product_id uuid [not null]
  user_id uuid [not null]
  order_id uuid [null]
  rating_star smallint [not null, note: '1-5 sao']
  fit_feedback varchar(20) [not null, note: 'TOO_SMALL | JUST_RIGHT | TOO_LARGE']
  comment text
  review_images jsonb
  created_at timestamptz [not null, default: `now()`]
}

// ========================================================
// --- RELATIONSHIPS (RÀNG BUỘC KHÓA NGOẠI HOÀN CHỈNH) ---
// ========================================================
// Nhóm Auth & Shop
Ref: shops.owner_id - users.id [delete: cascade]
Ref: refresh_tokens.user_id > users.id [delete: cascade]

// Nhóm Sinh trắc & Đo đạc 3D
Ref: biometric_inputs.user_id > users.id [delete: cascade]
Ref: measurements.user_id > users.id [delete: cascade]
Ref: measurements.input_id > biometric_inputs.id [delete: cascade]
Ref: mesh_parameters.measurement_id - measurements.id [delete: cascade]

// Nhóm Size & Hồ sơ may
Ref: brand_size_charts.shop_id > shops.id [delete: cascade]
Ref: brand_size_charts.category_id > garment_categories.id [delete: restrict]
Ref: recommendations.measurement_id > measurements.id [delete: cascade]
Ref: recommendations.size_chart_id > brand_size_charts.id [delete: set null]
Ref: tailor_dossiers.measurement_id > measurements.id [delete: cascade]
Ref: tailor_dossiers.shop_id > shops.id [delete: cascade]

// Nhóm Audit Log
Ref: system_audit_logs.user_id > users.id [delete: set null]
Ref: system_audit_logs.measurement_id > measurements.id [delete: set null]

// Nhóm Sản phẩm & Biến thể E-Commerce (MỚI)
Ref: products.shop_id > shops.id [delete: cascade]
Ref: products.category_id > garment_categories.id [delete: restrict]
Ref: product_variants.product_id > products.id [delete: cascade]
Ref: product_garment_specs.variant_id - product_variants.id [delete: cascade]

// Nhóm Giỏ hàng & Đơn hàng (MỚI)
Ref: carts.user_id - users.id [delete: cascade]
Ref: cart_items.cart_id > carts.id [delete: cascade]
Ref: cart_items.variant_id > product_variants.id [delete: restrict]

Ref: orders.user_id > users.id [delete: restrict]
Ref: order_items.order_id > orders.id [delete: cascade]
Ref: order_items.variant_id > product_variants.id [delete: restrict]

// Nhóm Đánh giá (MỚI)
Ref: product_reviews.product_id > products.id [delete: cascade]
Ref: product_reviews.user_id > users.id [delete: cascade]
Ref: product_reviews.order_id > orders.id [delete: set null]
```
