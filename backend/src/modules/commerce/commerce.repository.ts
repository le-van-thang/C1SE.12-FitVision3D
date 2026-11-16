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
      `SELECT id, brand_name, name, name_en, slug, category, gender_target,
              price, sale_price, rating::float, reviews_count, fabric_material, fabric_material_en,
              stretch_type, image_url, secondary_image_url, description, description_en,
              is_bestseller, is_bespoke, is_hidden, variants, created_at, updated_at
       FROM products
       ${whereClause}
       ORDER BY id ASC`
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
};
