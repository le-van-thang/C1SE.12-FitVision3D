import { query } from '../../config/database.js';
import { ensureCommerceTablesAndSeed } from './commerce.bootstrap.js';

export type MembershipTierId = 'member' | 'silver' | 'gold' | 'vip';

const OFFER_COST_MAP: Record<string, number> = {
  FITMEMBER50: 60,
  CAPSTONE2026: 120,
  FITVISION10: 180,
  FITVIP150: 240,
};

function computeTierFromSpend(totalSpend: number): MembershipTierId {
  if (totalSpend >= 15_000_000) return 'vip';
  if (totalSpend >= 5_000_000) return 'gold';
  if (totalSpend >= 2_000_000) return 'silver';
  return 'member';
}

const SHOP_BURST_WINDOW_MS = 3_000;
const SHOP_MAX_BURST_POSTS = 4;
const SHOP_PRODUCT_WINDOW_MS = 60_000;
const SHOP_MAX_POSTS_PER_WINDOW = 30;
const SHOP_MAX_PRODUCTS_QUOTA = 50;
const shopPostTimestamps = new Map<string, number[]>();

export function assertShopAntiSpam(userId: string): void {
  const now = Date.now();
  const prev = (shopPostTimestamps.get(userId) || []).filter(
    (ts) => now - ts < SHOP_PRODUCT_WINDOW_MS
  );
  const recentBurst = prev.filter((ts) => now - ts < SHOP_BURST_WINDOW_MS);
  if (recentBurst.length >= SHOP_MAX_BURST_POSTS) {
    throw new Error('Phát hiện thao tác gửi quá nhanh (Auto-Click). Vui lòng đợi vài giây rồi thử lại.');
  }
  if (prev.length >= SHOP_MAX_POSTS_PER_WINDOW) {
    const oldest = prev[0];
    const waitSec = Math.max(1, Math.ceil((SHOP_PRODUCT_WINDOW_MS - (now - oldest)) / 1000));
    throw new Error(
      `Hệ thống bảo vệ: Quá nhiều yêu cầu trong 1 phút (${SHOP_MAX_POSTS_PER_WINDOW} lượt). Vui lòng chờ ${waitSec} giây.`
    );
  }
  prev.push(now);
  shopPostTimestamps.set(userId, prev);
}

export const commerceRepository = {
  async getSettings() {
    await ensureCommerceTablesAndSeed();
    const rows = await query(
      `SELECT id, marquee_enabled, marquee_items_vi, marquee_items_en,
              hero_badge_vi, hero_title_vi, hero_highlight_vi, updated_at
       FROM platform_settings WHERE id = 'default' LIMIT 1`
    );
    return rows[0] || null;
  },

  async saveSettings(input: {
    marqueeEnabled: boolean;
    marqueeItemsVi: string[];
    marqueeItemsEn?: string[];
    heroBadgeVi: string;
    heroTitleVi: string;
    heroHighlightVi: string;
  }) {
    await ensureCommerceTablesAndSeed();
    const rows = await query(
      `INSERT INTO platform_settings (
         id, marquee_enabled, marquee_items_vi, marquee_items_en,
         hero_badge_vi, hero_title_vi, hero_highlight_vi, updated_at
       ) VALUES ('default', $1, $2::jsonb, COALESCE($3::jsonb, '[]'::jsonb), $4, $5, $6, NOW())
       ON CONFLICT (id) DO UPDATE SET
         marquee_enabled = EXCLUDED.marquee_enabled,
         marquee_items_vi = EXCLUDED.marquee_items_vi,
         marquee_items_en = CASE
           WHEN jsonb_array_length(EXCLUDED.marquee_items_en) > 0 THEN EXCLUDED.marquee_items_en
           ELSE platform_settings.marquee_items_en
         END,
         hero_badge_vi = EXCLUDED.hero_badge_vi,
         hero_title_vi = EXCLUDED.hero_title_vi,
         hero_highlight_vi = EXCLUDED.hero_highlight_vi,
         updated_at = NOW()
       RETURNING *`,
      [
        input.marqueeEnabled,
        JSON.stringify(input.marqueeItemsVi),
        input.marqueeItemsEn ? JSON.stringify(input.marqueeItemsEn) : '[]',
        input.heroBadgeVi,
        input.heroTitleVi,
        input.heroHighlightVi,
      ]
    );
    return rows[0];
  },

  async listVouchers() {
    await ensureCommerceTablesAndSeed();
    return query(
      `SELECT code, discount_type, discount_value, title_vi, title_en,
              sub_vi, sub_en, is_active, show_on_storefront, created_at
       FROM vouchers
       ORDER BY created_at DESC`
    );
  },

  async createVoucher(v: {
    code: string;
    discountType: 'fixed' | 'percent';
    discountValue: number;
    titleVi: string;
    titleEn: string;
    subVi: string;
    subEn: string;
    active: boolean;
    showOnStorefront: boolean;
  }) {
    await ensureCommerceTablesAndSeed();
    const rows = await query(
      `INSERT INTO vouchers (
         code, discount_type, discount_value, title_vi, title_en,
         sub_vi, sub_en, is_active, show_on_storefront
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        v.code.toUpperCase(),
        v.discountType,
        v.discountValue,
        v.titleVi,
        v.titleEn,
        v.subVi,
        v.subEn,
        v.active,
        v.showOnStorefront,
      ]
    );
    return rows[0];
  },

  async updateVoucher(
    code: string,
    patch: { is_active?: boolean; show_on_storefront?: boolean }
  ) {
    await ensureCommerceTablesAndSeed();
    const rows = await query(
      `UPDATE vouchers SET
         is_active = COALESCE($2, is_active),
         show_on_storefront = COALESCE($3, show_on_storefront)
       WHERE code = $1
       RETURNING *`,
      [code.toUpperCase(), patch.is_active ?? null, patch.show_on_storefront ?? null]
    );
    return rows[0] || null;
  },

  async deleteVoucher(code: string) {
    await ensureCommerceTablesAndSeed();
    await query('DELETE FROM vouchers WHERE code = $1', [code.toUpperCase()]);
  },

  async listProducts(includeHidden = true) {
    await ensureCommerceTablesAndSeed();
    const whereClause = includeHidden ? '' : 'WHERE is_hidden = FALSE';
    return query(
      `SELECT id, brand_name, shop_id, COALESCE(is_mall, FALSE) AS is_mall, name, name_en, slug, category, gender_target,
              price, sale_price, rating::float, reviews_count, fabric_material, fabric_material_en,
              stretch_type, image_url, secondary_image_url, video_url, description, description_en,
              is_bestseller, is_bespoke, is_hidden, variants, created_at, updated_at
       FROM products
       ${whereClause}
       ORDER BY created_at DESC, id ASC`
    );
  },

  async moderateProduct(
    id: string,
    patch: { is_hidden?: boolean; sale_price?: number | null }
  ) {
    await ensureCommerceTablesAndSeed();
    const hasSalePrice = patch.sale_price !== undefined;
    const rows = await query(
      `UPDATE products SET
         is_hidden = COALESCE($2, is_hidden),
         sale_price = CASE WHEN $3 THEN $4::integer ELSE sale_price END,
         updated_at = NOW()
       WHERE id = $1
       RETURNING *, rating::float`,
      [id, patch.is_hidden ?? null, hasSalePrice, patch.sale_price ?? null]
    );
    return rows[0] || null;
  },

  async listOrders() {
    await ensureCommerceTablesAndSeed();
    return query(
      `SELECT id, customer_id, customer_name, recipient, items,
              subtotal, shipping_fee, discount_amount, total_amount,
              payment_method, payment_status, status, store_name,
              estimated_delivery, created_at, updated_at
       FROM orders
       ORDER BY created_at DESC`
    );
  },

  async createOrder(order: {
    id: string;
    customer_id: string;
    customer_name: string;
    recipient: any;
    items: any[];
    subtotal: number;
    shipping_fee: number;
    discount_amount: number;
    total_amount: number;
    payment_method: string;
    payment_status: string;
    status: string;
    store_name: string;
    estimated_delivery: string;
  }) {
    await ensureCommerceTablesAndSeed();
    const rows = await query(
      `INSERT INTO orders (
         id, customer_id, customer_name, recipient, items,
         subtotal, shipping_fee, discount_amount, total_amount,
         payment_method, payment_status, status, store_name, estimated_delivery
       ) VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        order.id,
        order.customer_id,
        order.customer_name,
        JSON.stringify(order.recipient),
        JSON.stringify(order.items),
        order.subtotal,
        order.shipping_fee,
        order.discount_amount,
        order.total_amount,
        order.payment_method,
        order.payment_status,
        order.status,
        order.store_name,
        order.estimated_delivery,
      ]
    );

    const earnedPts = Math.floor((order.total_amount || 0) / 10_000);
    await this.syncMembershipSpend(order.customer_id);
    if (earnedPts > 0) {
      await query(
        `INSERT INTO membership_point_logs (user_id, action_type, points_delta, description)
         VALUES ($1, 'ORDER_EARN', $2, $3)`,
        [
          order.customer_id,
          earnedPts,
          `Tích điểm đơn hàng ${order.id} (${order.total_amount.toLocaleString('vi-VN')}₫)`,
        ]
      );
    }

    return rows[0];
  },

  async updateOrderStatus(orderId: string, status: string) {
    await ensureCommerceTablesAndSeed();
    const rows = await query(
      `UPDATE orders SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [orderId, status]
    );
    const updated = rows[0];
    if (updated?.customer_id) {
      await this.syncMembershipSpend(updated.customer_id);
    }
    return updated || null;
  },

  async markOrderPaid(orderId: string) {
    await ensureCommerceTablesAndSeed();
    const rows = await query(
      `UPDATE orders SET payment_status = 'paid', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [orderId]
    );
    return rows[0] || null;
  },

  async ensureMembershipRow(userId: string) {
    await ensureCommerceTablesAndSeed();
    const existing = await query('SELECT * FROM user_memberships WHERE user_id = $1 LIMIT 1', [userId]);
    if (existing.length > 0) return existing[0];

    const created = await query(
      `INSERT INTO user_memberships (user_id, total_spend, tier_id, bonus_points, spent_points, unlocked_codes)
       VALUES ($1, 0, 'member', 90, 0, '["FITMEMBER50"]'::jsonb)
       ON CONFLICT (user_id) DO NOTHING
       RETURNING *`,
      [userId]
    );
    if (created.length > 0) {
      await query(
        `INSERT INTO membership_point_logs (user_id, action_type, points_delta, description)
         VALUES ($1, 'WELCOME_BONUS', 90, 'Thưởng chào mừng thành viên Atelier & Hồ sơ 3D (+40 + 50 pts)')`,
        [userId]
      );
      return created[0];
    }
    const retry = await query('SELECT * FROM user_memberships WHERE user_id = $1 LIMIT 1', [userId]);
    return retry[0];
  },

  async syncMembershipSpend(userId: string) {
    await this.ensureMembershipRow(userId);
    const spendRows = await query<{ total_spend: string }>(
      `SELECT COALESCE(SUM(total_amount), 0)::bigint AS total_spend
       FROM orders
       WHERE customer_id = $1 AND status <> 'cancelled'`,
      [userId]
    );
    const totalSpend = parseInt(spendRows[0]?.total_spend || '0', 10);
    const tierId = computeTierFromSpend(totalSpend);

    const updated = await query(
      `UPDATE user_memberships
       SET total_spend = $2, tier_id = $3, updated_at = NOW()
       WHERE user_id = $1
       RETURNING *`,
      [userId, totalSpend, tierId]
    );
    return updated[0];
  },

  async getMembershipWallet(userId: string) {
    const row = await this.syncMembershipSpend(userId);
    const spendPoints = Math.floor((Number(row.total_spend) || 0) / 10_000);
    const bonusPoints = Number(row.bonus_points) || 0;
    const spentPoints = Number(row.spent_points) || 0;
    const availablePoints = Math.max(0, spendPoints + bonusPoints - spentPoints);

    const logs = await query(
      `SELECT id, action_type, points_delta, description, created_at
       FROM membership_point_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 15`,
      [userId]
    );

    return {
      userId,
      totalSpend: Number(row.total_spend) || 0,
      tierId: (row.tier_id || 'member') as MembershipTierId,
      spendPoints,
      bonusPoints,
      spentPoints,
      availablePoints,
      unlockedCodes: Array.isArray(row.unlocked_codes) ? row.unlocked_codes : ['FITMEMBER50'],
      lastCheckInDate: row.last_check_in_date || null,
      logs,
    };
  },

  async dailyCheckIn(userId: string) {
    const row = await this.ensureMembershipRow(userId);
    const today = new Date().toISOString().slice(0, 10);
    if (row.last_check_in_date === today) {
      const wallet = await this.getMembershipWallet(userId);
      return { alreadyCheckedIn: true, wallet };
    }

    await query(
      `UPDATE user_memberships
       SET bonus_points = bonus_points + 20,
           last_check_in_date = $2,
           updated_at = NOW()
       WHERE user_id = $1`,
      [userId, today]
    );
    await query(
      `INSERT INTO membership_point_logs (user_id, action_type, points_delta, description)
       VALUES ($1, 'CHECK_IN', 20, $2)`,
      [userId, `Điểm danh hằng ngày (${today})`]
    );

    const wallet = await this.getMembershipWallet(userId);
    return { alreadyCheckedIn: false, wallet };
  },

  async redeemMembershipVoucher(userId: string, rawCode: string) {
    const code = rawCode.trim().toUpperCase();
    const costPts = OFFER_COST_MAP[code];
    if (!costPts) {
      throw new Error(`Mã ưu đãi ${code} không nằm trong danh sách đổi điểm hội viên.`);
    }

    const wallet = await this.getMembershipWallet(userId);
    if (wallet.unlockedCodes.includes(code)) {
      return { alreadyUnlocked: true, wallet };
    }
    if (wallet.availablePoints < costPts) {
      throw new Error(`Cần thêm ${costPts - wallet.availablePoints} FitPoints để đổi mã ${code}.`);
    }

    const nextUnlocked = [...wallet.unlockedCodes, code];
    await query(
      `UPDATE user_memberships
       SET spent_points = spent_points + $2,
           unlocked_codes = $3::jsonb,
           updated_at = NOW()
       WHERE user_id = $1`,
      [userId, costPts, JSON.stringify(nextUnlocked)]
    );
    await query(
      `INSERT INTO membership_point_logs (user_id, action_type, points_delta, description)
       VALUES ($1, 'REDEEM_VOUCHER', $2, $3)`,
      [userId, -costPts, `Đổi mã ưu đãi ${code} (-${costPts} FitPoints)`]
    );

    const updated = await this.getMembershipWallet(userId);
    return { alreadyUnlocked: false, wallet: updated };
  },

  async ensureShopForUser(userId: string) {
    await ensureCommerceTablesAndSeed();
    const shopRows = await query(
      `SELECT id, owner_id, shop_name, phone_number, shop_address, status, is_verified, COALESCE(is_mall, FALSE) AS is_mall
       FROM shops
       WHERE owner_id = $1
       LIMIT 1`,
      [userId]
    );
    if (shopRows.length > 0) return shopRows[0];

    // If Admin directly promoted a user to SHOP_OWNER without them submitting an application,
    // auto-provision an active shop row in PostgreSQL so /shop works immediately.
    const userRows = await query<{ id: string; full_name: string; email: string; phone: string | null; role: string }>(
      `SELECT id, full_name, email, phone, role FROM users WHERE id = $1 LIMIT 1`,
      [userId]
    );
    const u = userRows[0];
    if (!u || (u.role !== 'SHOP_OWNER' && u.role !== 'ADMIN')) {
      return null;
    }

    const baseName = (u.full_name || u.email.split('@')[0] || 'FitVision').trim();
    const shopName = `${baseName} Fashion`;
    const slug = `shop-${userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)}`;
    const phone = (u.phone || `09${String(Date.now()).slice(-8)}`).slice(0, 15);

    const created = await query(
      `INSERT INTO shops (
         owner_id, shop_name, brand_slug, phone_number, shop_address,
         contact_email, status, is_verified, approved_at, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, 'Việt Nam', $5, 'APPROVED', TRUE, NOW(), NOW(), NOW())
       ON CONFLICT (owner_id) DO NOTHING
       RETURNING id, owner_id, shop_name, phone_number, shop_address, status, is_verified, COALESCE(is_mall, FALSE) AS is_mall`,
      [userId, shopName, slug, phone, u.email]
    );
    if (created.length > 0) return created[0];

    const retry = await query(
      `SELECT id, owner_id, shop_name, phone_number, shop_address, status, is_verified, COALESCE(is_mall, FALSE) AS is_mall
       FROM shops WHERE owner_id = $1 LIMIT 1`,
      [userId]
    );
    return retry[0] || null;
  },

  async updateShopProfile(
    userId: string,
    payload: { shopName?: string; phoneNumber?: string; shopAddress?: string }
  ) {
    const shop = await this.ensureShopForUser(userId);
    if (!shop) {
      throw new Error('Không tìm thấy hồ sơ Shop.');
    }
    const cleanName = String(payload.shopName || shop.shop_name).trim();
    const cleanPhone = String(payload.phoneNumber || shop.phone_number).trim().slice(0, 15);
    const cleanAddr = String(payload.shopAddress || shop.shop_address).trim().slice(0, 255);
    if (cleanName.length < 2) throw new Error('Tên Shop phải có tối thiểu 2 ký tự.');
    if (cleanPhone.length < 8) throw new Error('Số điện thoại Shop không hợp lệ.');

    const updated = await query(
      `UPDATE shops
       SET shop_name = $2, phone_number = $3, shop_address = $4, updated_at = NOW()
       WHERE id = $1
       RETURNING id, owner_id, shop_name, phone_number, shop_address, status, is_verified, COALESCE(is_mall, FALSE) AS is_mall`,
      [shop.id, cleanName, cleanPhone, cleanAddr]
    );
    if (cleanName !== shop.shop_name) {
      await query(
        `UPDATE products SET brand_name = $2, updated_at = NOW() WHERE shop_id = $1`,
        [shop.id, cleanName]
      ).catch(() => undefined);
    }
    return updated[0];
  },

  async getShopDashboard(userId: string) {
    const shop = await this.ensureShopForUser(userId);
    if (!shop) {
      return { shop: null, products: [], orders: [], reviews: [] };
    }

    const products = await query(
      `SELECT id, brand_name, shop_id, COALESCE(is_mall, FALSE) AS is_mall, name, name_en, slug, category, gender_target,
              price, sale_price, rating::float, reviews_count, fabric_material, fabric_material_en,
              stretch_type, image_url, secondary_image_url, video_url, description, description_en,
              is_bestseller, is_bespoke, is_hidden, variants, created_at, updated_at
       FROM products
       WHERE shop_id = $1 OR LOWER(brand_name) = LOWER($2)
       ORDER BY created_at DESC`,
      [shop.id, shop.shop_name]
    );

    const orders = await query(
      `SELECT id, customer_id, customer_name, recipient, items,
              subtotal, shipping_fee, discount_amount, total_amount,
              payment_method, payment_status, status, store_name,
              estimated_delivery, created_at, updated_at
       FROM orders
       WHERE LOWER(COALESCE(store_name, '')) = LOWER($1)
          OR EXISTS (
            SELECT 1 FROM jsonb_array_elements(items) AS el
            WHERE LOWER(COALESCE(el->'product'->>'brand_name', '')) = LOWER($1)
               OR el->'product'->>'shop_id' = $2
          )
       ORDER BY created_at DESC`,
      [shop.shop_name, String(shop.id)]
    );

    const reviews = await query(
      `SELECT r.id, r.product_id, r.user_id, r.user_name, r.rating, r.comment,
              r.is_verified_purchase, r.shop_reply, r.created_at, p.name AS product_name
       FROM product_reviews r
       INNER JOIN products p ON p.id = r.product_id
       WHERE p.shop_id = $1 OR LOWER(p.brand_name) = LOWER($2)
       ORDER BY r.created_at DESC
       LIMIT 30`,
      [shop.id, shop.shop_name]
    );

    return { shop, products, orders, reviews };
  },

  async createShopProduct(userId: string, payload: any) {
    const shop = await this.ensureShopForUser(userId);
    if (!shop) {
      throw new Error('Tài khoản chưa có quyền Chủ Shop hợp lệ.');
    }

    const name = String(payload.name || '').trim();
    const price = Number(payload.price);
    const salePrice = payload.salePrice ? Number(payload.salePrice) : null;
    if (name.length < 3) throw new Error('Tên sản phẩm phải có tối thiểu 3 ký tự.');
    if (!Number.isFinite(price) || price < 1_000) throw new Error('Giá bán phải tối thiểu 1.000₫.');
    if (salePrice !== null && (salePrice < 1_000 || salePrice >= price)) {
      throw new Error('Giá khuyến mãi phải từ 1.000₫ trở lên và thấp hơn giá gốc.');
    }

    const rawImg = String(payload.imageUrl || '').trim();
    if (rawImg.startsWith('data:image/') && rawImg.length > 4_200_000) {
      throw new Error('Ảnh tải lên quá nặng (> 3MB). Vui lòng nén ảnh hoặc dùng link URL.');
    }
    const rawVideo = String(payload.videoUrl || '').trim();
    if (rawVideo) {
      if (rawVideo.startsWith('data:video/') && rawVideo.length > 22_000_000) {
        throw new Error('Video tải lên vượt quá giới hạn 15MB để bảo vệ máy chủ. Hãy dùng link MP4/YouTube hoặc video ngắn hơn.');
      }
      const isHttpVideo = rawVideo.startsWith('http://') || rawVideo.startsWith('https://');
      const isBase64Video = rawVideo.startsWith('data:video/');
      if (!isHttpVideo && !isBase64Video) {
        throw new Error('Định dạng video không hợp lệ (chỉ hỗ trợ link HTTP/HTTPS hoặc file MP4/WebM).');
      }
    }

    // Anti-Spam Rate Limiter & Shop Quota Enforcement (only count valid submissions)
    assertShopAntiSpam(userId);

    const quotaRows = await query<{ cnt: string }>(
      'SELECT COUNT(*)::text AS cnt FROM products WHERE shop_id = $1',
      [shop.id]
    );
    if (parseInt(quotaRows[0]?.cnt || '0', 10) >= SHOP_MAX_PRODUCTS_QUOTA) {
      throw new Error(`Hạn mức tối đa mỗi Shop là ${SHOP_MAX_PRODUCTS_QUOTA} sản phẩm để đảm bảo chất lượng sàn.`);
    }

    const category = ['shirt', 'polo', 'pants', 'dress', 'tailored'].includes(payload.category)
      ? payload.category
      : 'shirt';
    const genderTarget = ['male', 'female', 'unisex'].includes(payload.genderTarget)
      ? payload.genderTarget
      : 'unisex';
    const isPants = category === 'pants';
    const stockMap: Record<string, number> = payload.stockMap || {};

    const defaultTopSpecs: Record<string, any> = {
      XS: { chest_cm: 92, waist_cm: 78, shoulder_cm: 40.5, length_cm: 68, ease_min_cm: 3, ease_max_cm: 6 },
      S: { chest_cm: 96, waist_cm: 82, shoulder_cm: 42, length_cm: 70, ease_min_cm: 3, ease_max_cm: 7 },
      M: { chest_cm: 100, waist_cm: 86, shoulder_cm: 43.5, length_cm: 72, ease_min_cm: 4, ease_max_cm: 8 },
      L: { chest_cm: 104, waist_cm: 90, shoulder_cm: 45, length_cm: 74, ease_min_cm: 4, ease_max_cm: 8 },
      XL: { chest_cm: 108, waist_cm: 94, shoulder_cm: 46.5, length_cm: 76, ease_min_cm: 5, ease_max_cm: 9 },
      XXL: { chest_cm: 114, waist_cm: 100, shoulder_cm: 48.5, length_cm: 78, ease_min_cm: 5, ease_max_cm: 10 },
    };
    const defaultPantSpecs: Record<string, any> = {
      XS: { chest_cm: 0, waist_cm: 72, hip_cm: 90, shoulder_cm: 0, length_cm: 94, ease_min_cm: 1, ease_max_cm: 4 },
      S: { chest_cm: 0, waist_cm: 76, hip_cm: 94, shoulder_cm: 0, length_cm: 96, ease_min_cm: 1, ease_max_cm: 4 },
      M: { chest_cm: 0, waist_cm: 80, hip_cm: 98, shoulder_cm: 0, length_cm: 98, ease_min_cm: 2, ease_max_cm: 4.5 },
      L: { chest_cm: 0, waist_cm: 84, hip_cm: 102, shoulder_cm: 0, length_cm: 100, ease_min_cm: 2, ease_max_cm: 5 },
      XL: { chest_cm: 0, waist_cm: 88, hip_cm: 106, shoulder_cm: 0, length_cm: 102, ease_min_cm: 2, ease_max_cm: 5 },
      XXL: { chest_cm: 0, waist_cm: 94, hip_cm: 112, shoulder_cm: 0, length_cm: 104, ease_min_cm: 2, ease_max_cm: 5 },
    };

    const allowedSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    const requestedSizes: string[] = Array.isArray(payload.sizes) && payload.sizes.length > 0
      ? payload.sizes.filter((s: string) => allowedSizes.includes(s))
      : ['S', 'M', 'L', 'XL'];
    const selectedSizes = requestedSizes.length > 0 ? requestedSizes : ['S', 'M', 'L', 'XL'];

    const fallbackImg =
      rawImg ||
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80';

    const rawColors: { colorName: string; colorHex: string; imageUrl?: string }[] =
      Array.isArray(payload.colorVariants) && payload.colorVariants.length > 0
        ? payload.colorVariants.slice(0, 6).map((c: any) => ({
            colorName: String(c?.colorName || 'Màu Tiêu Chuẩn').trim(),
            colorHex: String(c?.colorHex || '#1E293B').trim(),
            imageUrl: String(c?.imageUrl || fallbackImg).trim(),
          }))
        : [
            {
              colorName: String(payload.colorName || 'Đen Obsidian').trim(),
              colorHex: String(payload.colorHex || '#1E293B').trim(),
              imageUrl: fallbackImg,
            },
          ];

    for (const c of rawColors) {
      if (c.imageUrl && c.imageUrl.startsWith('data:image/') && c.imageUrl.length > 4_200_000) {
        throw new Error(`Ảnh của màu "${c.colorName}" quá nặng (> 3MB). Vui lòng nén ảnh hoặc dùng link URL.`);
      }
    }

    const id = `prod-${Date.now()}`;
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;

    const variants = rawColors.flatMap((c, colorIdx) =>
      selectedSizes.map((sz) => ({
        id: `${id}-c${colorIdx}-${sz.toLowerCase()}`,
        size_label: sz,
        color_name: c.colorName,
        color_hex: c.colorHex,
        image_url: c.imageUrl || fallbackImg,
        sku: `${id.toUpperCase()}-C${colorIdx + 1}-${sz}`,
        stock: Number(stockMap[sz]) || 20,
        spec: isPants ? defaultPantSpecs[sz] : defaultTopSpecs[sz],
      }))
    );

    const imageUrl = rawColors[0]?.imageUrl || fallbackImg;
    const secondaryImageUrl =
      rawColors[1]?.imageUrl && rawColors[1].imageUrl !== imageUrl ? rawColors[1].imageUrl : null;

    const rows = await query(
      `INSERT INTO products (
         id, brand_name, shop_id, is_mall, name, name_en, slug, category, gender_target,
         price, sale_price, rating, reviews_count, fabric_material, fabric_material_en,
         stretch_type, image_url, secondary_image_url, video_url, description, description_en, is_bestseller, is_bespoke, is_hidden, variants
       ) VALUES (
         $1, $2, $3, $4, $5, $5, $6, $7, $8,
         $9, $10, 5.0, 0, $11, $11,
         $12, $13, $14, $15, $16, $16, TRUE, FALSE, FALSE, $17::jsonb
       ) RETURNING *, rating::float`,
      [
        id,
        shop.shop_name,
        shop.id,
        Boolean(shop.is_mall),
        name,
        slug,
        category,
        genderTarget,
        price,
        salePrice && salePrice > 0 && salePrice < price ? salePrice : null,
        String(payload.fabricMaterial || '100% Cotton cao cấp thoáng mát').trim(),
        String(payload.stretchType || 'Co giãn nhẹ (2-3%)'),
        imageUrl,
        secondaryImageUrl,
        rawVideo || null,
        String(payload.description || 'Thiết kế thời trang chuẩn phom dáng, hỗ trợ chọn size chính xác bằng AI quét vóc dáng 3D FitVision.').trim(),
        JSON.stringify(variants),
      ]
    );
    return rows[0];
  },

  suggestProductDescription(payload: any): string {
    const name = String(payload.name || 'Sản phẩm thời trang mới').trim();
    const catMap: Record<string, string> = {
      shirt: 'áo sơ mi thanh lịch, đứng phom vai và thoáng khí suốt ngày dài',
      polo: 'áo polo/thun cổ bẻ trẻ trung, năng động phù hợp cả đi làm và dạo phố',
      pants: 'quần phom chuẩn hiện đại, tôn dáng đôi chân và thoải mái vận động',
      dress: 'thiết kế đầm tôn đường nét cơ thể nhẹ nhàng, thanh thoát',
      tailored: 'áo khoác/blazer cắt rập sắc sảo, sang trọng chuẩn công sở & sự kiện',
    };
    const genderMap: Record<string, string> = {
      male: 'nam giới',
      female: 'nữ giới',
      unisex: 'cả nam và nữ (Unisex)',
    };
    const catDesc = catMap[payload.category] || 'trang phục thiết kế chuẩn phom hiện đại';
    const genderDesc = genderMap[payload.genderTarget] || 'mọi vóc dáng';
    const material = String(payload.fabricMaterial || 'Cotton cao cấp').trim();
    const stretch = String(payload.stretchType || 'Co giãn nhẹ (2-3%)').trim();
    const colors: string[] = Array.isArray(payload.colors) && payload.colors.length > 0
      ? payload.colors.filter(Boolean)
      : ['Màu tiêu chuẩn'];
    const sizes: string[] = Array.isArray(payload.sizes) && payload.sizes.length > 0
      ? payload.sizes
      : ['S', 'M', 'L', 'XL'];
    const toneHint = payload.visualTone?.dominantColor
      ? ` Sắc độ chủ đạo ${payload.visualTone.dominantColor}${payload.visualTone?.brightness === 'light' ? ' tươi sáng, dễ phối đồ' : payload.visualTone?.brightness === 'dark' ? ' trầm sang trọng, che khuyết điểm tốt' : ' hài hòa hiện đại'}.`
      : '';
    const videoLine = payload.hasVideo ? ' Có video quay cận chất vải & lên phom thực tế tại gian hàng.' : '';

    return [
      `${name} — mẫu ${catDesc}, thiết kế dành riêng cho ${genderDesc}.${toneHint}`,
      `• Chất liệu: ${material} kết hợp đặc tính ${stretch.toLowerCase()}, bề mặt vải mềm mịn, ít nhăn và giữ phom bền đẹp sau nhiều lần giặt.`,
      `• Bảng màu đa dạng (${colors.length} phiên bản): ${colors.join(', ')}.${videoLine}`,
      `• Đủ kích cỡ: ${sizes.join(' / ')} — Hỗ trợ công nghệ Quét AI 3D FitVision chỉ với 1 bức ảnh để chọn đúng size vừa vặn nhất theo chiều cao, cân nặng & 13 số đo cơ thể của bạn.`,
    ].join('\n');
  },

  async updateShopProduct(userId: string, isAdmin: boolean, productId: string, patch: any) {
    await ensureCommerceTablesAndSeed();
    const shopRows = await query('SELECT id, shop_name FROM shops WHERE owner_id = $1 LIMIT 1', [userId]);
    const shop = shopRows[0];
    if (!shop && !isAdmin) return null;

    const ownerFilter = isAdmin ? 'TRUE' : '(shop_id = $5 OR LOWER(brand_name) = LOWER($6))';
    const hasSale = patch.salePrice !== undefined;
    const params: any[] = [
      productId,
      typeof patch.isHidden === 'boolean' ? patch.isHidden : null,
      hasSale,
      hasSale ? (patch.salePrice ? Number(patch.salePrice) : null) : null,
    ];
    if (!isAdmin) {
      params.push(shop.id, shop.shop_name);
    }

    const rows = await query(
      `UPDATE products SET
         is_hidden = COALESCE($2, is_hidden),
         sale_price = CASE WHEN $3 THEN $4::integer ELSE sale_price END,
         updated_at = NOW()
       WHERE id = $1 AND ${ownerFilter}
       RETURNING *, rating::float`,
      params
    );
    return rows[0] || null;
  },

  async deleteShopProduct(userId: string, isAdmin: boolean, productId: string) {
    await ensureCommerceTablesAndSeed();
    const shopRows = await query('SELECT id, shop_name FROM shops WHERE owner_id = $1 LIMIT 1', [userId]);
    const shop = shopRows[0];
    if (!shop && !isAdmin) return false;

    const ownerFilter = isAdmin ? 'TRUE' : '(shop_id = $2 OR LOWER(brand_name) = LOWER($3))';
    const params: any[] = isAdmin ? [productId] : [productId, shop.id, shop.shop_name];
    const rows = await query(`DELETE FROM products WHERE id = $1 AND ${ownerFilter} RETURNING id`, params);
    return rows.length > 0;
  },

  async listProductReviews(productId: string) {
    await ensureCommerceTablesAndSeed();
    return query(
      `SELECT id, product_id, user_id, user_name, rating, comment, is_verified_purchase, shop_reply, created_at
       FROM product_reviews
       WHERE product_id = $1
       ORDER BY created_at DESC`,
      [productId]
    );
  },

  async createProductReview(input: {
    productId: string;
    userId: string;
    userName: string;
    rating: number;
    comment: string;
  }) {
    await ensureCommerceTablesAndSeed();
    const purchased = await query<{ cnt: string }>(
      `SELECT COUNT(*)::text AS cnt
       FROM orders
       WHERE customer_id = $1 AND status <> 'cancelled'
         AND EXISTS (
           SELECT 1 FROM jsonb_array_elements(items) AS el
           WHERE el->'product'->>'id' = $2
         )`,
      [input.userId, input.productId]
    );
    const isVerifiedPurchase = parseInt(purchased[0]?.cnt || '0', 10) > 0;

    const inserted = await query(
      `INSERT INTO product_reviews (product_id, user_id, user_name, rating, comment, is_verified_purchase)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [input.productId, input.userId, input.userName, input.rating, input.comment, isVerifiedPurchase]
    );

    const stats = await query<{ avg_rating: string; total_cnt: string }>(
      `SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 5.0)::text AS avg_rating,
              COUNT(*)::text AS total_cnt
       FROM product_reviews
       WHERE product_id = $1`,
      [input.productId]
    );

    const newRating = parseFloat(stats[0]?.avg_rating || '5.0');
    const newCount = parseInt(stats[0]?.total_cnt || '1', 10);

    await query(
      `UPDATE products SET rating = $2, reviews_count = $3, updated_at = NOW() WHERE id = $1`,
      [input.productId, newRating, newCount]
    );

    return {
      review: inserted[0],
      rating: newRating,
      reviews_count: newCount,
    };
  },

  async replyProductReview(reviewId: number, shopReply: string) {
    await ensureCommerceTablesAndSeed();
    const rows = await query(
      `UPDATE product_reviews SET shop_reply = $2 WHERE id = $1 RETURNING *`,
      [reviewId, shopReply]
    );
    return rows[0] || null;
  },
};
