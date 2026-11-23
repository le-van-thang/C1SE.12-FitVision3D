import { query } from '../../config/database.js';

const SEED_MARQUEE_VI = [
  'Đo Size Chuẩn Nhân Trắc Học ISO 8559',
  'Đổi sửa size vừa vặn miễn phí trong 14 ngày',
  'Freeship hỏa tốc đơn hàng từ 1.000.000₫',
  'Bảo mật ảnh xử lý tạm thời RAM 100%',
];

const SEED_MARQUEE_EN = [
  'ISO 8559-1 Anthropometric 3D Sizing',
  'Free 14-Day Fit Adjustment Guarantee',
  'Freeship Express Orders from 1,000,000₫',
  'Zero-Retention In-Memory Image Privacy 100%',
];

const SEED_VOUCHERS = [
  {
    code: 'FITVISION50',
    discount_type: 'fixed',
    discount_value: 50000,
    title_vi: 'Giảm 50.000₫ cho mọi đơn từ 600K',
    title_en: '50,000₫ off orders from 600K',
    sub_vi: 'Áp dụng khi chọn size theo gợi ý AI ISO 8559',
    sub_en: 'Applies with ISO 8559 AI size match',
    is_active: true,
    show_on_storefront: true,
  },
  {
    code: 'TAILOR100',
    discount_type: 'fixed',
    discount_value: 100000,
    title_vi: 'Giảm 100.000₫ Bộ May Đo Bespoke',
    title_en: '100,000₫ off Bespoke Sets',
    sub_vi: 'Dành riêng cho Blazer Linen & Đầm Lụa Mulberry',
    sub_en: 'Valid for Linen Blazer & Mulberry Silk',
    is_active: true,
    show_on_storefront: true,
  },
  {
    code: 'FREESHIP3D',
    discount_type: 'fixed',
    discount_value: 35000,
    title_vi: 'Freeship Hỏa Tốc + Đổi Size 14 Ngày',
    title_en: 'Free Express + 14-Day Fit Swap',
    sub_vi: 'Miễn phí chỉnh sửa phom dáng tận nhà toàn quốc',
    sub_en: 'Complimentary nationwide door-to-door adjustment',
    is_active: true,
    show_on_storefront: true,
  },
  {
    code: 'FITVISION10',
    discount_type: 'percent',
    discount_value: 10,
    title_vi: 'Giảm 10% toàn bộ đơn hàng Hội Viên',
    title_en: '10% off Member Atelier orders',
    sub_vi: 'Đặc quyền thành viên FitVision 3D',
    sub_en: 'FitVision 3D Club exclusive privilege',
    is_active: true,
    show_on_storefront: false,
  },
  {
    code: 'CAPSTONE2026',
    discount_type: 'fixed',
    discount_value: 100000,
    title_vi: 'Giảm 100.000₫ BST Atelier Capstone',
    title_en: '100,000₫ off Capstone Atelier Edit',
    sub_vi: 'Ưu đãi đặc biệt từ Ban Quản Trị sàn',
    sub_en: 'Special platform campaign discount',
    is_active: true,
    show_on_storefront: false,
  },
  {
    code: 'FITMEMBER50',
    discount_type: 'fixed',
    discount_value: 50000,
    title_vi: 'Ưu đãi Hội Viên mới 50.000₫',
    title_en: '50,000₫ Atelier Member voucher',
    sub_vi: 'Đổi bằng FitPoints trong mục Hội Viên',
    sub_en: 'Redeemable with FitPoints',
    is_active: true,
    show_on_storefront: false,
  },
  {
    code: 'FITSILVER5',
    discount_type: 'percent',
    discount_value: 5,
    title_vi: 'Giảm 5% đặc quyền Hội Viên Bạc',
    title_en: '5% Silver Atelier member discount',
    sub_vi: 'Dành cho khách hàng hạng Bạc trở lên',
    sub_en: 'For Silver tier members & above',
    is_active: true,
    show_on_storefront: false,
  },
  {
    code: 'FITVIP150',
    discount_type: 'fixed',
    discount_value: 150000,
    title_vi: 'Voucher 150.000₫ Bespoke VIP',
    title_en: '150,000₫ Bespoke VIP privilege',
    sub_vi: 'Ưu đãi riêng trang phục may đo 3D cao cấp',
    sub_en: 'Exclusive 3D Bespoke reward',
    is_active: true,
    show_on_storefront: false,
  },
];

const SEED_PRODUCTS = [
  {
    id: 'prod-01',
    brand_name: 'Sartoria Milan',
    name: 'Áo Sơ Mi Oxford Dệt Nổi Royal Tailored',
    name_en: 'Royal Tailored Oxford Textured Shirt',
    slug: 'ao-so-mi-oxford-royal',
    category: 'shirt',
    gender_target: 'male',
    price: 680000,
    sale_price: 590000,
    rating: 4.9,
    reviews_count: 142,
    fabric_material: '100% Giza Cotton Ai Cập (Sợi chải kỹ 80/2)',
    fabric_material_en: '100% Egyptian Giza Cotton (80/2 Combed Yarn)',
    stretch_type: 'Không co giãn',
    image_url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
    secondary_image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
    description:
      'Chế tác từ sợi bông Giza quý hiếm dệt cấu trúc Oxford thanh lịch. Phom dáng Regular Slim tôn bờ vai và lồng ngực vững chãi, chống nhăn tự nhiên.',
    description_en:
      'Crafted from rare Egyptian Giza cotton with classic Oxford weave. Regular Slim silhouette highlights broad shoulders and firm chest with natural wrinkle resistance.',
    is_bestseller: true,
    is_bespoke: false,
    variants: [
      { id: 'var-01-s', size_label: 'S', color_name: 'Trắng Sữa (Optic White)', color_hex: '#FAFAF9', sku: 'OXF-WHT-S', stock: 14, spec: { chest_cm: 98, waist_cm: 84, shoulder_cm: 42, length_cm: 71, ease_min_cm: 3, ease_max_cm: 7 } },
      { id: 'var-01-m', size_label: 'M', color_name: 'Trắng Sữa (Optic White)', color_hex: '#FAFAF9', sku: 'OXF-WHT-M', stock: 28, spec: { chest_cm: 102, waist_cm: 88, shoulder_cm: 43.5, length_cm: 73, ease_min_cm: 4, ease_max_cm: 8 } },
      { id: 'var-01-l', size_label: 'L', color_name: 'Trắng Sữa (Optic White)', color_hex: '#FAFAF9', sku: 'OXF-WHT-L', stock: 35, spec: { chest_cm: 106, waist_cm: 92, shoulder_cm: 45, length_cm: 75, ease_min_cm: 4, ease_max_cm: 8 } },
      { id: 'var-01-xl', size_label: 'XL', color_name: 'Trắng Sữa (Optic White)', color_hex: '#FAFAF9', sku: 'OXF-WHT-XL', stock: 12, spec: { chest_cm: 110, waist_cm: 96, shoulder_cm: 46.5, length_cm: 76.5, ease_min_cm: 5, ease_max_cm: 9 } },
    ],
  },
  {
    id: 'prod-02',
    brand_name: 'Nordic Thread',
    name: 'Áo Polo Dệt Kim Piqué Silk Blend',
    name_en: 'Piqué Silk Blend Knitted Polo',
    slug: 'ao-polo-pique-silk-blend',
    category: 'polo',
    gender_target: 'male',
    price: 520000,
    sale_price: null,
    rating: 4.8,
    reviews_count: 98,
    fabric_material: '85% Cotton chải kỹ + 15% Lụa Tự Nhiên',
    fabric_material_en: '85% Combed Cotton + 15% Natural Silk',
    stretch_type: 'Co giãn nhẹ (2-3%)',
    image_url: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80',
    secondary_image_url: null,
    description:
      'Thiết kế cổ sơ mi dệt liền khối không quăn mép. Sự pha trộn lụa tự nhiên mang lại bề mặt bóng mờ quý phái và độ thoáng khí tuyệt đối.',
    description_en:
      'One-piece knitted shirt collar that never curls. Natural silk blend delivers understated luster and supreme all-day breathability.',
    is_bestseller: true,
    is_bespoke: false,
    variants: [
      { id: 'var-02-s', size_label: 'S', color_name: 'Xanh Navy Hoàng Gia', color_hex: '#1E3A8A', sku: 'POLO-NVY-S', stock: 18, spec: { chest_cm: 96, waist_cm: 82, shoulder_cm: 41.5, length_cm: 69, ease_min_cm: 2, ease_max_cm: 6 } },
      { id: 'var-02-m', size_label: 'M', color_name: 'Xanh Navy Hoàng Gia', color_hex: '#1E3A8A', sku: 'POLO-NVY-M', stock: 22, spec: { chest_cm: 100, waist_cm: 86, shoulder_cm: 43, length_cm: 71, ease_min_cm: 3, ease_max_cm: 6.5 } },
      { id: 'var-02-l', size_label: 'L', color_name: 'Xanh Navy Hoàng Gia', color_hex: '#1E3A8A', sku: 'POLO-NVY-L', stock: 40, spec: { chest_cm: 104, waist_cm: 90, shoulder_cm: 44.5, length_cm: 73, ease_min_cm: 3, ease_max_cm: 7 } },
      { id: 'var-02-xl', size_label: 'XL', color_name: 'Xanh Navy Hoàng Gia', color_hex: '#1E3A8A', sku: 'POLO-NVY-XL', stock: 9, spec: { chest_cm: 108, waist_cm: 94, shoulder_cm: 46, length_cm: 74.5, ease_min_cm: 4, ease_max_cm: 8 } },
    ],
  },
  {
    id: 'prod-03',
    brand_name: 'Sartoria Milan',
    name: 'Quần Tây Tapered Fit Xếp Ly Đôi Ý',
    name_en: 'Italian Double-Pleated Tapered Trousers',
    slug: 'quan-tay-tapered-y',
    category: 'pants',
    gender_target: 'male',
    price: 850000,
    sale_price: 765000,
    rating: 5.0,
    reviews_count: 73,
    fabric_material: 'Wool Blend Cao Cấp (70% Wool Úc + 30% Spun Poly)',
    fabric_material_en: 'Premium Australian Wool Blend (70% Wool + 30% Spun Poly)',
    stretch_type: 'Co giãn nhẹ (2-3%)',
    image_url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
    secondary_image_url: null,
    description:
      'Thiết kế cạp cao Gurkha kèm đai chỉnh hông Side-adjusters không cần thắt lưng. Phom dáng xếp ly đôi buông rủ thanh lịch kéo dài đôi chân.',
    description_en:
      'Gurkha high-rise waistband with side-adjusters for a clean beltless look. Double forward pleats create an elegant drape that elongates leg lines.',
    is_bestseller: false,
    is_bespoke: true,
    variants: [
      { id: 'var-03-s', size_label: 'S', color_name: 'Xám Khói Charcoal', color_hex: '#334155', sku: 'TR-CHR-S', stock: 10, spec: { chest_cm: 0, waist_cm: 78, hip_cm: 96, shoulder_cm: 0, length_cm: 97, ease_min_cm: 1, ease_max_cm: 4 } },
      { id: 'var-03-m', size_label: 'M', color_name: 'Xám Khói Charcoal', color_hex: '#334155', sku: 'TR-CHR-M', stock: 25, spec: { chest_cm: 0, waist_cm: 82, hip_cm: 100, shoulder_cm: 0, length_cm: 99, ease_min_cm: 2, ease_max_cm: 4.5 } },
      { id: 'var-03-l', size_label: 'L', color_name: 'Xám Khói Charcoal', color_hex: '#334155', sku: 'TR-CHR-L', stock: 30, spec: { chest_cm: 0, waist_cm: 86, hip_cm: 104, shoulder_cm: 0, length_cm: 101, ease_min_cm: 2, ease_max_cm: 5 } },
      { id: 'var-03-xl', size_label: 'XL', color_name: 'Xám Khói Charcoal', color_hex: '#334155', sku: 'TR-CHR-XL', stock: 8, spec: { chest_cm: 0, waist_cm: 90, hip_cm: 108, shoulder_cm: 0, length_cm: 102.5, ease_min_cm: 2, ease_max_cm: 5 } },
    ],
  },
  {
    id: 'prod-04',
    brand_name: "L'Étoile Atelier",
    name: 'Đầm Lụa Satin Cổ Đổ Silk Bias Cut',
    name_en: 'Mulberry Silk Cowl-Neck Bias Cut Dress',
    slug: 'dam-lua-satin-co-do',
    category: 'dress',
    gender_target: 'female',
    price: 1250000,
    sale_price: null,
    rating: 4.9,
    reviews_count: 64,
    fabric_material: '100% Lụa Tằm Dâu Mulberry Satin 19 Momme',
    fabric_material_en: '100% Mulberry Silk Satin 19 Momme',
    stretch_type: 'Không co giãn',
    image_url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80',
    secondary_image_url: null,
    description:
      'Kỹ thuật cắt xéo vải Bias-cut độc quyền ôm sát từng đường cong cơ thể mà không gây bó thắt. Cổ đổ quyến rũ tôn xương quai xanh.',
    description_en:
      'Proprietary bias-cut technique wraps natural curves gracefully without tightness. Dramatic cowl neck gracefully frames the collarbone.',
    is_bestseller: false,
    is_bespoke: true,
    variants: [
      { id: 'var-04-xs', size_label: 'XS', color_name: 'Vàng Champagne Ánh Kim', color_hex: '#FDE68A', sku: 'DRS-GLD-XS', stock: 6, spec: { chest_cm: 82, waist_cm: 64, hip_cm: 88, shoulder_cm: 37, length_cm: 118, ease_min_cm: 1.5, ease_max_cm: 4 } },
      { id: 'var-04-s', size_label: 'S', color_name: 'Vàng Champagne Ánh Kim', color_hex: '#FDE68A', sku: 'DRS-GLD-S', stock: 14, spec: { chest_cm: 86, waist_cm: 68, hip_cm: 92, shoulder_cm: 38, length_cm: 120, ease_min_cm: 2, ease_max_cm: 4.5 } },
      { id: 'var-04-m', size_label: 'M', color_name: 'Vàng Champagne Ánh Kim', color_hex: '#FDE68A', sku: 'DRS-GLD-M', stock: 18, spec: { chest_cm: 90, waist_cm: 72, hip_cm: 96, shoulder_cm: 39, length_cm: 122, ease_min_cm: 2, ease_max_cm: 5 } },
      { id: 'var-04-l', size_label: 'L', color_name: 'Vàng Champagne Ánh Kim', color_hex: '#FDE68A', sku: 'DRS-GLD-L', stock: 7, spec: { chest_cm: 94, waist_cm: 76, hip_cm: 100, shoulder_cm: 40.5, length_cm: 123.5, ease_min_cm: 2, ease_max_cm: 5 } },
    ],
  },
  {
    id: 'prod-05',
    brand_name: 'Atelier 12',
    name: 'Áo Blazer Cấu Trúc Nhẹ Deconstructed Linen',
    name_en: 'Deconstructed French Linen Lightweight Blazer',
    slug: 'ao-blazer-linen-deconstructed',
    category: 'tailored',
    gender_target: 'unisex',
    price: 1850000,
    sale_price: 1650000,
    rating: 4.95,
    reviews_count: 51,
    fabric_material: '100% Linen Thuần Pháp (Normandy Flax 240gsm)',
    fabric_material_en: '100% French Normandy Flax Linen (240gsm)',
    stretch_type: 'Không co giãn',
    image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
    secondary_image_url: null,
    description:
      'Loại bỏ hoàn toàn đệm vai cứng nhắc, may nửa lót bán thủ công mang lại cảm giác nhẹ bẫng và bay bổng trong tiết trời hè thu.',
    description_en:
      'Zero rigid shoulder pads with semi-lined artisan tailoring for an airy, weightless feel through summer and autumn.',
    is_bestseller: false,
    is_bespoke: true,
    variants: [
      { id: 'var-05-s', size_label: 'S', color_name: 'Nâu Cát Mộc (Sand Beige)', color_hex: '#D7C4B7', sku: 'BLZ-SND-S', stock: 8, spec: { chest_cm: 100, waist_cm: 88, shoulder_cm: 43, length_cm: 72, ease_min_cm: 5, ease_max_cm: 9 } },
      { id: 'var-05-m', size_label: 'M', color_name: 'Nâu Cát Mộc (Sand Beige)', color_hex: '#D7C4B7', sku: 'BLZ-SND-M', stock: 15, spec: { chest_cm: 104, waist_cm: 92, shoulder_cm: 44.5, length_cm: 74, ease_min_cm: 5, ease_max_cm: 10 } },
      { id: 'var-05-l', size_label: 'L', color_name: 'Nâu Cát Mộc (Sand Beige)', color_hex: '#D7C4B7', sku: 'BLZ-SND-L', stock: 20, spec: { chest_cm: 108, waist_cm: 96, shoulder_cm: 46, length_cm: 76, ease_min_cm: 6, ease_max_cm: 10.5 } },
      { id: 'var-05-xl', size_label: 'XL', color_name: 'Nâu Cát Mộc (Sand Beige)', color_hex: '#D7C4B7', sku: 'BLZ-SND-XL', stock: 5, spec: { chest_cm: 112, waist_cm: 100, shoulder_cm: 47.5, length_cm: 77.5, ease_min_cm: 6, ease_max_cm: 11 } },
    ],
  },
  {
    id: 'prod-06',
    brand_name: 'Nordic Thread',
    name: 'Quần Chino Slim Tapered Vải Cotton Co Giãn',
    name_en: 'Stretch Cotton Twill Slim Tapered Chinos',
    slug: 'quan-chino-cotton-stretch',
    category: 'pants',
    gender_target: 'male',
    price: 590000,
    sale_price: null,
    rating: 4.75,
    reviews_count: 110,
    fabric_material: '97% Cotton chéo Twill + 3% Elastane',
    fabric_material_en: '97% Cotton Twill + 3% Elastane Comfort Stretch',
    stretch_type: 'Co giãn tốt (4-way)',
    image_url: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80',
    secondary_image_url: null,
    description:
      'Chất vải chéo Twill bền bỉ bổ sung sợi co giãn giúp đứng ngồi vận động thoải mái mà không bị gãy ly quần.',
    description_en:
      'Robust twill weave infused with elastane stretch ensures crisp creases and ease of movement between sitting and walking.',
    is_bestseller: false,
    is_bespoke: false,
    variants: [
      { id: 'var-06-s', size_label: 'S', color_name: 'Xanh Rêu Ôliu (Olive Drab)', color_hex: '#556B2F', sku: 'CHN-OLV-S', stock: 12, spec: { chest_cm: 0, waist_cm: 76, hip_cm: 94, shoulder_cm: 0, length_cm: 96, ease_min_cm: 1, ease_max_cm: 3.5 } },
      { id: 'var-06-m', size_label: 'M', color_name: 'Xanh Rêu Ôliu (Olive Drab)', color_hex: '#556B2F', sku: 'CHN-OLV-M', stock: 24, spec: { chest_cm: 0, waist_cm: 80, hip_cm: 98, shoulder_cm: 0, length_cm: 98, ease_min_cm: 1.5, ease_max_cm: 4 } },
      { id: 'var-06-l', size_label: 'L', color_name: 'Xanh Rêu Ôliu (Olive Drab)', color_hex: '#556B2F', sku: 'CHN-OLV-L', stock: 28, spec: { chest_cm: 0, waist_cm: 84, hip_cm: 102, shoulder_cm: 0, length_cm: 100, ease_min_cm: 2, ease_max_cm: 4.5 } },
      { id: 'var-06-xl', size_label: 'XL', color_name: 'Xanh Rêu Ôliu (Olive Drab)', color_hex: '#556B2F', sku: 'CHN-OLV-XL', stock: 14, spec: { chest_cm: 0, waist_cm: 88, hip_cm: 106, shoulder_cm: 0, length_cm: 101.5, ease_min_cm: 2, ease_max_cm: 5 } },
    ],
  },
];

let bootstrapPromise: Promise<void> | null = null;

export async function ensureCommerceTablesAndSeed(): Promise<void> {
  if (bootstrapPromise) return bootstrapPromise;

  bootstrapPromise = (async () => {
    try {
      await query(`ALTER TABLE shops ALTER COLUMN business_license_no TYPE TEXT;`).catch(() => undefined);

      await query(`
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

        CREATE TABLE IF NOT EXISTS vouchers (
          code VARCHAR(40) PRIMARY KEY,
          discount_type VARCHAR(20) NOT NULL,
          discount_value INTEGER NOT NULL,
          title_vi TEXT NOT NULL,
          title_en TEXT NOT NULL,
          sub_vi TEXT NOT NULL DEFAULT '',
          sub_en TEXT NOT NULL DEFAULT '',
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          show_on_storefront BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS products (
          id VARCHAR(50) PRIMARY KEY,
          brand_name VARCHAR(160) NOT NULL,
          name VARCHAR(255) NOT NULL,
          name_en VARCHAR(255),
          slug VARCHAR(255) NOT NULL,
          category VARCHAR(40) NOT NULL,
          gender_target VARCHAR(20) NOT NULL DEFAULT 'unisex',
          price INTEGER NOT NULL,
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

        CREATE TABLE IF NOT EXISTS membership_point_logs (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(120) NOT NULL,
          action_type VARCHAR(40) NOT NULL,
          points_delta INTEGER NOT NULL,
          description TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        ALTER TABLE shops ADD COLUMN IF NOT EXISTS is_mall BOOLEAN NOT NULL DEFAULT FALSE;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS shop_id UUID;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS is_mall BOOLEAN NOT NULL DEFAULT FALSE;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS shop_id UUID;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS has_bespoke_items BOOLEAN NOT NULL DEFAULT FALSE;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS measurement_snapshot JSONB;
        CREATE INDEX IF NOT EXISTS idx_orders_shop_id ON orders (shop_id);

        CREATE TABLE IF NOT EXISTS product_reviews (
          id SERIAL PRIMARY KEY,
          product_id VARCHAR(50) NOT NULL,
          user_id VARCHAR(120) NOT NULL,
          user_name VARCHAR(255) NOT NULL,
          rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
          comment TEXT NOT NULL,
          is_verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
          shop_reply TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await query(`
        UPDATE products SET is_mall = TRUE
        WHERE id IN ('prod-01', 'prod-03', 'prod-04', 'prod-05') AND is_mall = FALSE;
      `).catch(() => undefined);

      const reviewCountRes = await query<{ count: string }>('SELECT COUNT(*) as count FROM product_reviews');
      if (parseInt(reviewCountRes[0]?.count || '0', 10) === 0) {
        const seedReviews = [
          {
            product_id: 'prod-01',
            user_id: 'usr-101',
            user_name: 'Lê Văn Thắng',
            rating: 5,
            comment: 'Vải Cotton Giza đứng phom rất đẹp, mặc đi làm cả ngày ít nhăn. Chọn size M theo gợi ý AI 3D chuẩn vừa vai luôn.',
            is_verified_purchase: true,
            shop_reply: 'Cảm ơn anh Thắng đã tin tưởng Sartoria Milan Mall! Rất vui vì gợi ý AI giúp anh chọn vừa size M ngay lần đầu.',
          },
          {
            product_id: 'prod-03',
            user_id: 'usr-102',
            user_name: 'TS. Lê Minh Thái',
            rating: 5,
            comment: 'Chất len Úc rủ phom, phần cạp quần rất thoải mái khi ngồi lâu.',
            is_verified_purchase: true,
            shop_reply: null,
          },
          {
            product_id: 'prod-02',
            user_id: 'usr-101',
            user_name: 'Minh Khôi',
            rating: 5,
            comment: 'Áo Polo mát, cổ áo dệt đứng form không bị nhão sau khi giặt.',
            is_verified_purchase: false,
            shop_reply: 'Nordic Thread cảm ơn bạn đã đánh giá 5 sao!',
          },
          {
            product_id: 'prod-05',
            user_id: 'usr-101',
            user_name: 'Hoàng Nam',
            rating: 5,
            comment: 'Blazer Linen nhẹ, mặc mùa hè cực thoáng mà vẫn lịch sự.',
            is_verified_purchase: true,
            shop_reply: null,
          },
        ];
        for (const r of seedReviews) {
          await query(
            `INSERT INTO product_reviews (product_id, user_id, user_name, rating, comment, is_verified_purchase, shop_reply)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [r.product_id, r.user_id, r.user_name, r.rating, r.comment, r.is_verified_purchase, r.shop_reply]
          );
        }
      }

      // Seed default platform settings
      await query(
        `INSERT INTO platform_settings (id, marquee_enabled, marquee_items_vi, marquee_items_en)
         VALUES ('default', TRUE, $1::jsonb, $2::jsonb)
         ON CONFLICT (id) DO NOTHING`,
        [JSON.stringify(SEED_MARQUEE_VI), JSON.stringify(SEED_MARQUEE_EN)]
      );

      // Seed 8 platform vouchers
      for (const v of SEED_VOUCHERS) {
        await query(
          `INSERT INTO vouchers (code, discount_type, discount_value, title_vi, title_en, sub_vi, sub_en, is_active, show_on_storefront)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (code) DO NOTHING`,
          [v.code, v.discount_type, v.discount_value, v.title_vi, v.title_en, v.sub_vi, v.sub_en, v.is_active, v.show_on_storefront]
        );
      }

      // Seed 6 signature products
      for (const p of SEED_PRODUCTS) {
        await query(
          `INSERT INTO products (
             id, brand_name, name, name_en, slug, category, gender_target,
             price, sale_price, rating, reviews_count, fabric_material, fabric_material_en,
             stretch_type, image_url, secondary_image_url, description, description_en,
             is_bestseller, is_bespoke, is_hidden, variants
           ) VALUES (
             $1, $2, $3, $4, $5, $6, $7,
             $8, $9, $10, $11, $12, $13,
             $14, $15, $16, $17, $18,
             $19, $20, FALSE, $21::jsonb
           ) ON CONFLICT (id) DO NOTHING`,
          [
            p.id,
            p.brand_name,
            p.name,
            p.name_en,
            p.slug,
            p.category,
            p.gender_target,
            p.price,
            p.sale_price,
            p.rating,
            p.reviews_count,
            p.fabric_material,
            p.fabric_material_en,
            p.stretch_type,
            p.image_url,
            p.secondary_image_url,
            p.description,
            p.description_en,
            p.is_bestseller,
            p.is_bespoke,
            JSON.stringify(p.variants),
          ]
        );
      }

      console.log('✅ PostgreSQL Commerce & Membership schema bootstrapped & seeded.');
    } catch (err: any) {
      console.error('❌ Commerce bootstrap failed:', err?.message || err);
      bootstrapPromise = null;
    }
  })();

  return bootstrapPromise;
}
