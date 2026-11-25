import { pool, query } from '../../config/database.js';
import { ensureCommerceTablesAndSeed } from './commerce.bootstrap.js';
import { AppError } from '../../utils/responseEnvelope.js';
import { ErrorCode } from '../../constants/errorCodes.js';

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

const ALLOWED_ORDER_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'tailoring', 'shipping', 'completed', 'cancelled'],
  confirmed: ['tailoring', 'shipping', 'completed', 'cancelled'],
  tailoring: ['shipping', 'completed', 'cancelled'],
  shipping: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

const FREESHIP_THRESHOLD_VND = 1_000_000;
const STANDARD_SHIPPING_FEE_VND = 30_000;

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

  async listOrdersForActor(actor: { sub: string; role: string }) {
    await ensureCommerceTablesAndSeed();
    if (actor.role === 'ADMIN') {
      return query(
        `SELECT id, customer_id, customer_name, recipient, items,
                subtotal, shipping_fee, discount_amount, total_amount,
                payment_method, payment_status, status, store_name, shop_id,
                has_bespoke_items, measurement_snapshot,
                estimated_delivery, created_at, updated_at
         FROM orders
         ORDER BY created_at DESC`
      );
    }

    if (actor.role === 'SHOP_OWNER') {
      const shopRows = await query<{ id: string; shop_name: string }>(
        'SELECT id, shop_name FROM shops WHERE owner_id = $1 LIMIT 1',
        [actor.sub]
      );
      const shop = shopRows[0];
      if (!shop) {
        return query(
          `SELECT id, customer_id, customer_name, recipient, items,
                  subtotal, shipping_fee, discount_amount, total_amount,
                  payment_method, payment_status, status, store_name, shop_id,
                  has_bespoke_items, measurement_snapshot,
                  estimated_delivery, created_at, updated_at
           FROM orders
           WHERE customer_id = $1
           ORDER BY created_at DESC`,
          [actor.sub]
        );
      }

      return query(
        `SELECT id, customer_id, customer_name, recipient, items,
                subtotal, shipping_fee, discount_amount, total_amount,
                payment_method, payment_status, status, store_name, shop_id,
                has_bespoke_items, measurement_snapshot,
                estimated_delivery, created_at, updated_at
         FROM orders
         WHERE shop_id = $1
            OR LOWER(COALESCE(store_name, '')) = LOWER($2)
            OR EXISTS (
              SELECT 1 FROM jsonb_array_elements(items) AS el
              WHERE LOWER(COALESCE(el->'product'->>'brand_name', '')) = LOWER($2)
            )
         ORDER BY created_at DESC`,
        [shop.id, shop.shop_name]
      );
    }

    return query(
      `SELECT id, customer_id, customer_name, recipient, items,
              subtotal, shipping_fee, discount_amount, total_amount,
              payment_method, payment_status, status, store_name, shop_id,
              has_bespoke_items, measurement_snapshot,
              estimated_delivery, created_at, updated_at
       FROM orders
       WHERE customer_id = $1
       ORDER BY created_at DESC`,
      [actor.sub]
    );
  },

  async createOrder(order: {
    id: string;
    customer_id: string;
    customer_name: string;
    recipient: any;
    items: any[];
    coupon_code?: string;
    subtotal: number;
    shipping_fee: number;
    discount_amount: number;
    total_amount: number;
    payment_method: string;
    payment_status: string;
    status: string;
    store_name: string;
    estimated_delivery: string;
    measurement_snapshot?: any;
  }) {
    await ensureCommerceTablesAndSeed();
    if (!Array.isArray(order.items) || order.items.length === 0) {
      throw new AppError(400, ErrorCode.VALIDATION_FAILED, 'Đơn hàng phải có ít nhất 1 sản phẩm.');
    }

    const client = await pool.connect();
    let hasBespoke = false;
    let resolvedShopId: string | null = null;
    let resolvedStoreName = order.store_name || 'FitVision Atelier';
    let computedSubtotal = 0;
    const distinctShopKeys = new Set<string>();
    const normalizedItems: any[] = [];

    try {
      await client.query('BEGIN');

      // 1. Validate & deduct variant stock atomically for every item, recomputing authoritative price
      for (const item of order.items) {
        const productId = item?.product?.id;
        const qty = Math.max(1, Math.floor(Number(item?.quantity) || 1));
        if (!productId) {
          throw new AppError(400, ErrorCode.VALIDATION_FAILED, 'Thiếu mã sản phẩm trong đơn hàng.');
        }

        const prodRes = await client.query<{
          id: string;
          name: string;
          price: number;
          sale_price: number | null;
          variants: any[];
          is_bespoke: boolean;
          is_hidden: boolean;
          shop_id: string | null;
          brand_name: string;
        }>(
          `SELECT id, name, price, sale_price, variants, is_bespoke, is_hidden, shop_id, brand_name
           FROM products
           WHERE id = $1
           FOR UPDATE`,
          [productId]
        );

        const dbProd = prodRes.rows[0];
        if (!dbProd) {
          throw new AppError(
            404,
            ErrorCode.RESOURCE_NOT_FOUND,
            `Sản phẩm "${item?.product?.name || productId}" không tồn tại trong hệ thống.`
          );
        }
        if (dbProd.is_hidden) {
          throw new AppError(
            400,
            ErrorCode.VALIDATION_FAILED,
            `Sản phẩm "${dbProd.name}" hiện đang tạm ẩn hoặc ngừng kinh doanh.`
          );
        }

        const shopKey = dbProd.shop_id ? `id:${dbProd.shop_id}` : `brand:${String(dbProd.brand_name || '').trim().toLowerCase()}`;
        distinctShopKeys.add(shopKey);
        if (distinctShopKeys.size > 1) {
          throw new AppError(
            400,
            ErrorCode.VALIDATION_FAILED,
            'Mỗi đơn hàng chỉ áp dụng cho sản phẩm thuộc cùng một gian hàng. Vui lòng tách đơn riêng cho từng Shop.'
          );
        }

        if (dbProd.is_bespoke || item?.product?.is_bespoke) {
          hasBespoke = true;
        }
        if (!resolvedShopId && dbProd.shop_id) {
          resolvedShopId = dbProd.shop_id;
        }
        if (dbProd.brand_name) {
          resolvedStoreName = dbProd.brand_name;
        }

        // Check if target Shop is Approved and NOT in Vacation Mode
        const shopCheck = await client.query<{
          id: string;
          shop_name: string;
          status: string;
          operational_mode: string;
          vacation_note: string | null;
        }>(
          `SELECT id, shop_name, status, COALESCE(operational_mode, 'ACTIVE') AS operational_mode, vacation_note
           FROM shops
           WHERE id = $1 OR LOWER(shop_name) = LOWER($2)
           LIMIT 1`,
          [dbProd.shop_id, dbProd.brand_name]
        );
        const ownerShop = shopCheck.rows[0];
        if (ownerShop) {
          if (!resolvedShopId) resolvedShopId = ownerShop.id;
          if (ownerShop.status === 'SUSPENDED') {
            throw new AppError(
              400,
              ErrorCode.VALIDATION_FAILED,
              `Gian hàng "${ownerShop.shop_name}" hiện đang tạm ngưng hoạt động.`
            );
          }
          if (ownerShop.status !== 'APPROVED') {
            throw new AppError(
              400,
              ErrorCode.VALIDATION_FAILED,
              `Gian hàng "${ownerShop.shop_name}" chưa hoàn tất phê duyệt để nhận đơn mới.`
            );
          }
          if (ownerShop.operational_mode === 'VACATION') {
            throw new AppError(
              400,
              ErrorCode.VALIDATION_FAILED,
              ownerShop.vacation_note
                ? `Gian hàng "${ownerShop.shop_name}" đang ở chế độ Tạm nghỉ: ${ownerShop.vacation_note}`
                : `Gian hàng "${ownerShop.shop_name}" hiện đang tạm nghỉ nhận đơn mới.`
            );
          }
        }

        const variants = Array.isArray(dbProd.variants) ? [...dbProd.variants] : [];
        const targetVariantId = item?.variant?.id;
        const targetSku = item?.variant?.sku;
        const targetSize = item?.variant?.size_label;

        const vIdx = variants.findIndex(
          (v: any) =>
            (targetVariantId && v.id === targetVariantId) ||
            (targetSku && v.sku === targetSku) ||
            (targetSize && v.size_label === targetSize)
        );

        if (variants.length > 0 && vIdx < 0) {
          throw new AppError(
            400,
            ErrorCode.VALIDATION_FAILED,
            `Biến thể/size của sản phẩm "${dbProd.name}" không hợp lệ.`
          );
        }

        let matchedVariant = item?.variant || {};
        if (vIdx >= 0) {
          const currentStock = Number(variants[vIdx].stock ?? 0);
          if (currentStock < qty) {
            throw new AppError(
              400,
              ErrorCode.VALIDATION_FAILED,
              `Sản phẩm "${dbProd.name}" (Size ${variants[vIdx].size_label}) chỉ còn ${currentStock} chiếc trong kho.`
            );
          }
          variants[vIdx] = {
            ...variants[vIdx],
            stock: currentStock - qty,
          };
          matchedVariant = variants[vIdx];
          await client.query(
            `UPDATE products SET variants = $2::jsonb, updated_at = NOW() WHERE id = $1`,
            [dbProd.id, JSON.stringify(variants)]
          );
        }

        const authoritativePrice = Number(dbProd.sale_price ?? dbProd.price ?? 0);
        computedSubtotal += authoritativePrice * qty;
        normalizedItems.push({
          ...item,
          quantity: qty,
          variant: matchedVariant,
          product: {
            ...(item?.product || {}),
            id: dbProd.id,
            name: dbProd.name,
            brand_name: dbProd.brand_name,
            shop_id: dbProd.shop_id ?? item?.product?.shop_id ?? null,
            price: Number(dbProd.price),
            sale_price: dbProd.sale_price != null ? Number(dbProd.sale_price) : undefined,
            is_bespoke: Boolean(dbProd.is_bespoke || item?.product?.is_bespoke),
          },
        });
      }

      // 2. Recompute voucher discount & shipping fee strictly on server
      const wallet = await this.getMembershipWallet(order.customer_id);
      const cleanCoupon = order.coupon_code ? order.coupon_code.trim().toUpperCase() : '';
      let computedDiscount = 0;

      if (cleanCoupon) {
        const voucherRes = await client.query<{
          code: string;
          discount_type: 'fixed' | 'percent';
          discount_value: number;
          is_active: boolean;
        }>(
          `SELECT code, discount_type, discount_value, is_active
           FROM vouchers
           WHERE UPPER(code) = UPPER($1)
           LIMIT 1`,
          [cleanCoupon]
        );
        const voucher = voucherRes.rows[0];
        if (!voucher || !voucher.is_active) {
          throw new AppError(400, ErrorCode.VALIDATION_FAILED, `Mã giảm giá "${cleanCoupon}" không hợp lệ hoặc đã hết hạn.`);
        }
        if (OFFER_COST_MAP[cleanCoupon] && !wallet.unlockedCodes.includes(cleanCoupon)) {
          throw new AppError(400, ErrorCode.VALIDATION_FAILED, `Mã ${cleanCoupon} cần đổi bằng FitPoints trong mục Hội Viên trước khi sử dụng.`);
        }
        if (cleanCoupon === 'FITSILVER5' && wallet.tierId === 'member') {
          throw new AppError(400, ErrorCode.VALIDATION_FAILED, 'Mã FITSILVER5 chỉ áp dụng từ hạng Hội Viên Bạc trở lên.');
        }
        if (cleanCoupon === 'FITVISION50' && computedSubtotal < 600_000) {
          throw new AppError(400, ErrorCode.VALIDATION_FAILED, 'Mã FITVISION50 yêu cầu đơn hàng tối thiểu 600.000₫.');
        }
        if (cleanCoupon === 'TAILOR100' && !hasBespoke) {
          throw new AppError(400, ErrorCode.VALIDATION_FAILED, 'Mã TAILOR100 chỉ áp dụng cho đơn có sản phẩm May đo Bespoke.');
        }

        const val = Number(voucher.discount_value || 0);
        computedDiscount =
          voucher.discount_type === 'percent'
            ? Math.min(computedSubtotal, Math.round((computedSubtotal * Math.min(100, Math.max(0, val))) / 100))
            : Math.min(computedSubtotal, Math.max(0, val));
      }

      const isFreeShipping =
        computedSubtotal >= FREESHIP_THRESHOLD_VND ||
        wallet.tierId === 'gold' ||
        wallet.tierId === 'vip' ||
        cleanCoupon === 'FREESHIP3D';
      const computedShippingFee = isFreeShipping ? 0 : STANDARD_SHIPPING_FEE_VND;
      const computedTotal = Math.max(0, computedSubtotal - computedDiscount + computedShippingFee);

      // 3. Auto-attach latest 13-metric 3D snapshot from PostgreSQL when placing bespoke order
      let finalSnapshot = order.measurement_snapshot ?? null;
      if (hasBespoke && !finalSnapshot) {
        const snapRes = await client.query(
          `SELECT
             m.chest_circ_cm, m.waist_circ_cm, m.hip_circ_cm,
             m.shoulder_breadth_cm, m.arm_length_cm, m.inseam_cm,
             m.bicep_circ_cm, m.wrist_circ_cm, m.thigh_circ_cm, m.calf_circ_cm, m.ankle_circ_cm,
             m.source, m.created_at,
             b.stature_cm, b.weight_kg, b.gender, b.calculated_bmi
           FROM measurements m
           JOIN biometric_inputs b ON b.id = m.input_id
           WHERE m.user_id::text = $1
           ORDER BY m.created_at DESC
           LIMIT 1`,
          [order.customer_id]
        ).catch(() => ({ rows: [] as any[] }));

        if (snapRes.rows.length > 0) {
          const r = snapRes.rows[0];
          finalSnapshot = {
            stature_cm: Number(r.stature_cm),
            weight_kg: Number(r.weight_kg),
            gender: r.gender,
            calculated_bmi: Number(r.calculated_bmi),
            chest_circ_cm: Number(r.chest_circ_cm),
            waist_circ_cm: Number(r.waist_circ_cm),
            hip_circ_cm: Number(r.hip_circ_cm),
            shoulder_breadth_cm: r.shoulder_breadth_cm != null ? Number(r.shoulder_breadth_cm) : null,
            arm_length_cm: r.arm_length_cm != null ? Number(r.arm_length_cm) : null,
            inseam_cm: r.inseam_cm != null ? Number(r.inseam_cm) : null,
            bicep_circ_cm: r.bicep_circ_cm != null ? Number(r.bicep_circ_cm) : null,
            wrist_circ_cm: r.wrist_circ_cm != null ? Number(r.wrist_circ_cm) : null,
            thigh_circ_cm: r.thigh_circ_cm != null ? Number(r.thigh_circ_cm) : null,
            calf_circ_cm: r.calf_circ_cm != null ? Number(r.calf_circ_cm) : null,
            ankle_circ_cm: r.ankle_circ_cm != null ? Number(r.ankle_circ_cm) : null,
            source: r.source || 'scan',
            captured_at: new Date(r.created_at).toISOString(),
          };
        }
      }

      const rows = await client.query(
        `INSERT INTO orders (
           id, customer_id, customer_name, recipient, items,
           subtotal, shipping_fee, discount_amount, total_amount,
           payment_method, payment_status, status, store_name, shop_id,
           has_bespoke_items, measurement_snapshot, estimated_delivery
         ) VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6,$7,$8,$9,$10,'unpaid','pending',$11,$12,$13,$14::jsonb,$15)
         RETURNING *`,
        [
          order.id,
          order.customer_id,
          order.customer_name,
          JSON.stringify(order.recipient),
          JSON.stringify(normalizedItems),
          computedSubtotal,
          computedShippingFee,
          computedDiscount,
          computedTotal,
          order.payment_method,
          resolvedStoreName,
          resolvedShopId,
          hasBespoke,
          finalSnapshot ? JSON.stringify(finalSnapshot) : null,
          order.estimated_delivery,
        ]
      );

      await client.query('COMMIT');
      return rows.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async updateOrderStatus(
    orderId: string,
    nextStatus: string,
    actor: { sub: string; role: string }
  ) {
    await ensureCommerceTablesAndSeed();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const orderRes = await client.query(
        `SELECT * FROM orders WHERE id = $1 FOR UPDATE`,
        [orderId]
      );
      const existing = orderRes.rows[0];
      if (!existing) {
        await client.query('ROLLBACK');
        return null;
      }

      // Enforce strict RBAC ownership
      if (actor.role === 'USER') {
        if (existing.customer_id !== actor.sub) {
          throw new AppError(403, ErrorCode.FORBIDDEN_INSUFFICIENT_PERMISSIONS, 'Bạn không có quyền thao tác đơn hàng này.');
        }
        if (nextStatus !== 'cancelled') {
          throw new AppError(403, ErrorCode.FORBIDDEN_INSUFFICIENT_PERMISSIONS, 'Khách hàng chỉ có thể hủy đơn hàng đang chờ xác nhận.');
        }
        if (!['pending', 'confirmed'].includes(existing.status)) {
          throw new AppError(400, ErrorCode.VALIDATION_FAILED, 'Đơn hàng đang cắt may hoặc giao hàng, không thể hủy.');
        }
      } else if (actor.role === 'SHOP_OWNER') {
        const shopRows = await client.query<{ id: string; shop_name: string }>(
          'SELECT id, shop_name FROM shops WHERE owner_id = $1 LIMIT 1',
          [actor.sub]
        );
        const shop = shopRows.rows[0];
        const ownsOrder =
          shop &&
          (existing.shop_id === shop.id ||
            String(existing.store_name || '').toLowerCase() === shop.shop_name.toLowerCase());
        if (!ownsOrder) {
          throw new AppError(403, ErrorCode.FORBIDDEN_INSUFFICIENT_PERMISSIONS, 'Bạn không có quyền cập nhật đơn hàng của gian hàng khác.');
        }
      }

      // Enforce forward-only order state machine
      if (existing.status !== nextStatus) {
        const allowed = ALLOWED_ORDER_TRANSITIONS[existing.status] || [];
        if (!allowed.includes(nextStatus)) {
          throw new AppError(
            400,
            ErrorCode.VALIDATION_FAILED,
            `Không thể chuyển trạng thái đơn từ "${existing.status}" sang "${nextStatus}".`
          );
        }
      }

      // Restore variant stock when transitioning into 'cancelled'
      if (nextStatus === 'cancelled' && existing.status !== 'cancelled' && Array.isArray(existing.items)) {
        for (const item of existing.items) {
          const productId = item?.product?.id;
          const qty = Math.max(1, Math.floor(Number(item?.quantity) || 1));
          if (!productId) continue;

          const prodRes = await client.query<{ id: string; variants: any[] }>(
            `SELECT id, variants FROM products WHERE id = $1 FOR UPDATE`,
            [productId]
          );
          const dbProd = prodRes.rows[0];
          if (!dbProd || !Array.isArray(dbProd.variants)) continue;

          const variants = [...dbProd.variants];
          const targetVariantId = item?.variant?.id;
          const targetSku = item?.variant?.sku;
          const targetSize = item?.variant?.size_label;

          const vIdx = variants.findIndex(
            (v: any) =>
              (targetVariantId && v.id === targetVariantId) ||
              (targetSku && v.sku === targetSku) ||
              (targetSize && v.size_label === targetSize)
          );

          if (vIdx >= 0) {
            const currentStock = Number(variants[vIdx].stock ?? 0);
            variants[vIdx] = {
              ...variants[vIdx],
              stock: currentStock + qty,
            };
            await client.query(
              `UPDATE products SET variants = $2::jsonb, updated_at = NOW() WHERE id = $1`,
              [dbProd.id, JSON.stringify(variants)]
            );
          }
        }
      }

      const updRes = await client.query(
        `UPDATE orders SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
        [orderId, nextStatus]
      );

      await client.query('COMMIT');
      const updated = updRes.rows[0];
      if (updated?.customer_id) {
        if (nextStatus === 'completed') {
          await this.awardOrderEarnPointsIfNeeded(updated);
        } else if (nextStatus === 'cancelled') {
          await this.reconcileCancelledOrderPoints(updated);
        }
        await this.syncMembershipSpend(updated.customer_id);
      }
      return updated || null;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async awardOrderEarnPointsIfNeeded(order: { id: string; customer_id: string; total_amount: number }) {
    const earnedPts = Math.floor((Number(order.total_amount) || 0) / 10_000);
    if (earnedPts <= 0 || !order.customer_id) return;
    const tag = `đơn hàng ${order.id} `;
    const existingLog = await query<{ id: number }>(
      `SELECT id FROM membership_point_logs
       WHERE user_id = $1 AND action_type = 'ORDER_EARN' AND description LIKE $2
       LIMIT 1`,
      [order.customer_id, `%${tag}%`]
    );
    if (existingLog.length > 0) return;

    await query(
      `INSERT INTO membership_point_logs (user_id, action_type, points_delta, description)
       VALUES ($1, 'ORDER_EARN', $2, $3)`,
      [
        order.customer_id,
        earnedPts,
        `Tích điểm đơn hàng ${order.id} (${Number(order.total_amount).toLocaleString('vi-VN')}₫)`,
      ]
    );
  },

  async reconcileCancelledOrderPoints(order: { id: string; customer_id: string; total_amount: number }) {
    const earnedPts = Math.floor((Number(order.total_amount) || 0) / 10_000);
    if (earnedPts <= 0 || !order.customer_id) return;
    const earned = await query<{ id: number }>(
      `SELECT id FROM membership_point_logs
       WHERE user_id = $1 AND action_type = 'ORDER_EARN' AND description LIKE $2
       LIMIT 1`,
      [order.customer_id, `%đơn hàng ${order.id} %`]
    );
    if (earned.length === 0) return;
    const deducted = await query<{ id: number }>(
      `SELECT id FROM membership_point_logs
       WHERE user_id = $1 AND action_type = 'ORDER_CANCEL_DEDUCT' AND description LIKE $2
       LIMIT 1`,
      [order.customer_id, `%${order.id}%`]
    );
    if (deducted.length > 0) return;
    await query(
      `INSERT INTO membership_point_logs (user_id, action_type, points_delta, description)
       VALUES ($1, 'ORDER_CANCEL_DEDUCT', $2, $3)`,
      [order.customer_id, -earnedPts, `Hoàn điểm do hủy đơn hàng ${order.id}`]
    );
  },

  async confirmOrderPaidBySePayWebhook(params: {
    content: string;
    transferAmount: number;
    referenceCode?: string;
  }) {
    await ensureCommerceTablesAndSeed();
    const rawContent = String(params.content || '').toUpperCase();
    const match = rawContent.match(/FV3D[- ]?(\d{4,8})/);
    if (!match) {
      return { matched: false as const, reason: 'ORDER_CODE_NOT_FOUND' };
    }
    const normalizedOrderId = `FV3D-${match[1]}`;
    const existingRows = await query('SELECT * FROM orders WHERE id = $1 LIMIT 1', [normalizedOrderId]);
    const existing = existingRows[0];
    if (!existing) {
      return { matched: false as const, reason: 'ORDER_NOT_FOUND', orderId: normalizedOrderId };
    }
    const requiredAmount = Number(existing.total_amount || 0);
    if (Number(params.transferAmount || 0) < requiredAmount) {
      return {
        matched: false as const,
        reason: 'INSUFFICIENT_AMOUNT',
        orderId: normalizedOrderId,
        expected: requiredAmount,
        received: Number(params.transferAmount || 0),
      };
    }
    if (existing.payment_status === 'paid') {
      return { matched: true as const, alreadyPaid: true, order: existing };
    }
    const rows = await query(
      `UPDATE orders SET payment_status = 'paid', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [normalizedOrderId]
    );
    const updated = rows[0] || existing;
    if (updated?.customer_id && updated?.status !== 'cancelled') {
      await this.awardOrderEarnPointsIfNeeded(updated);
      await this.syncMembershipSpend(updated.customer_id);
    }
    return { matched: true as const, alreadyPaid: false, order: updated };
  },

  async markOrderPaid(orderId: string, actor: { sub: string; role: string }) {
    await ensureCommerceTablesAndSeed();
    if (actor.role === 'USER') {
      throw new AppError(
        403,
        ErrorCode.FORBIDDEN_INSUFFICIENT_PERMISSIONS,
        'Khách hàng không thể tự xác nhận thanh toán đơn hàng.'
      );
    }
    const existingRows = await query('SELECT * FROM orders WHERE id = $1 LIMIT 1', [orderId]);
    const existing = existingRows[0];
    if (!existing) return null;

    if (actor.role === 'SHOP_OWNER') {
      const shopRows = await query<{ id: string; shop_name: string }>(
        'SELECT id, shop_name FROM shops WHERE owner_id = $1 LIMIT 1',
        [actor.sub]
      );
      const shop = shopRows[0];
      const ownsOrder =
        shop &&
        (existing.shop_id === shop.id ||
          String(existing.store_name || '').toLowerCase() === shop.shop_name.toLowerCase());
      if (!ownsOrder) {
        throw new AppError(403, ErrorCode.FORBIDDEN_INSUFFICIENT_PERMISSIONS, 'Bạn không có quyền xác nhận thanh toán đơn hàng của gian hàng khác.');
      }
    }

    const rows = await query(
      `UPDATE orders SET payment_status = 'paid', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [orderId]
    );
    const updated = rows[0] || null;
    if (updated?.customer_id && updated?.status !== 'cancelled') {
      await this.awardOrderEarnPointsIfNeeded(updated);
      await this.syncMembershipSpend(updated.customer_id);
    }
    return updated;
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
       WHERE customer_id = $1 AND status <> 'cancelled' AND (payment_status = 'paid' OR status = 'completed')`,
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
      `SELECT id, owner_id, shop_name, brand_slug, phone_number, shop_address,
              entity_type, tax_code, tax_status, business_license_no,
              legal_representative_name, national_id_last4,
              status, rejection_reason, is_verified, COALESCE(is_mall, FALSE) AS is_mall,
              COALESCE(operational_mode, 'ACTIVE') AS operational_mode,
              vacation_note, vacation_until, banner_url, logo_url, tagline, description,
              approved_at, created_at
       FROM shops
       WHERE owner_id = $1
       LIMIT 1`,
      [userId]
    );
    return shopRows[0] || null;
  },

  async computeShopReputation(shopId: string, shopName: string, isMall: boolean) {
    const revStats = await query<{
      avg_rating: string | null;
      total_reviews: string;
      replied_reviews: string;
    }>(
      `SELECT ROUND(AVG(r.rating)::numeric, 1)::text AS avg_rating,
              COUNT(r.id)::text AS total_reviews,
              COUNT(CASE WHEN r.shop_reply IS NOT NULL AND LENGTH(TRIM(r.shop_reply)) > 0 THEN 1 END)::text AS replied_reviews
       FROM product_reviews r
       INNER JOIN products p ON p.id = r.product_id
       WHERE p.shop_id = $1 OR LOWER(p.brand_name) = LOWER($2)`,
      [shopId, shopName]
    );

    const row = revStats[0];
    const totalReviews = parseInt(row?.total_reviews || '0', 10);
    const repliedReviews = parseInt(row?.replied_reviews || '0', 10);
    const avgRating = totalReviews > 0 ? parseFloat(row?.avg_rating || '5.0') : 5.0;
    const responseRate = totalReviews > 0 ? Math.round((repliedReviews / totalReviews) * 100) : 100;

    const prodStats = await query<{ cnt: string }>(
      `SELECT COUNT(*)::text AS cnt
       FROM products
       WHERE (shop_id = $1 OR LOWER(brand_name) = LOWER($2)) AND is_hidden = FALSE`,
      [shopId, shopName]
    );
    const activeProductsCount = parseInt(prodStats[0]?.cnt || '0', 10);

    const tier: 'MALL' | 'PREFERRED' | 'REGULAR' = isMall
      ? 'MALL'
      : avgRating >= 4.7 && responseRate >= 80 && totalReviews >= 1
        ? 'PREFERRED'
        : 'REGULAR';

    return {
      ratingAvg: avgRating,
      ratingCount: totalReviews,
      responseRate,
      activeProductsCount,
      tier,
    };
  },

  async listPublicStores() {
    await ensureCommerceTablesAndSeed();
    const shops = await query<any>(
      `SELECT id, shop_name, brand_slug, shop_address, city, entity_type,
              COALESCE(is_mall, FALSE) AS is_mall,
              COALESCE(operational_mode, 'ACTIVE') AS operational_mode,
              vacation_note, vacation_until, banner_url, logo_url, tagline, description, created_at
       FROM shops
       WHERE status = 'APPROVED'
       ORDER BY is_mall DESC, created_at DESC`
    );

    const enriched = await Promise.all(
      shops.map(async (s: any) => ({
        ...s,
        reputation: await this.computeShopReputation(s.id, s.shop_name, Boolean(s.is_mall)),
      }))
    );
    return enriched;
  },

  async getPublicStorefrontBySlug(slugOrBrand: string) {
    await ensureCommerceTablesAndSeed();
    const target = String(slugOrBrand || '').trim();
    const shops = await query<any>(
      `SELECT id, shop_name, brand_slug, phone_number, shop_address, city, entity_type,
              COALESCE(is_mall, FALSE) AS is_mall,
              COALESCE(operational_mode, 'ACTIVE') AS operational_mode,
              vacation_note, vacation_until, banner_url, logo_url, tagline, description, created_at
       FROM shops
       WHERE status = 'APPROVED'
         AND (LOWER(brand_slug) = LOWER($1) OR LOWER(shop_name) = LOWER($1) OR id::text = $1)
       LIMIT 1`,
      [target]
    );

    const shop = shops[0];
    if (!shop) {
      // Check if pre-seeded brand exists on products without explicit shop row
      const seedProds = await query(
        `SELECT id, brand_name, shop_id, COALESCE(is_mall, FALSE) AS is_mall, name, name_en, slug, category, gender_target,
                price, sale_price, rating::float, reviews_count, fabric_material, fabric_material_en,
                stretch_type, image_url, secondary_image_url, video_url, description, description_en,
                is_bestseller, is_bespoke, is_hidden, variants, created_at, updated_at
         FROM products
         WHERE (LOWER(brand_name) = LOWER($1) OR LOWER(REPLACE(brand_name, ' ', '-')) = LOWER($1))
           AND is_hidden = FALSE
         ORDER BY created_at DESC`,
        [target]
      );
      if (seedProds.length === 0) return null;
      const brandName = seedProds[0].brand_name;
      const reputation = await this.computeShopReputation('00000000-0000-0000-0000-000000000000', brandName, Boolean(seedProds[0].is_mall));
      return {
        shop: {
          id: seedProds[0].shop_id || brandName,
          shop_name: brandName,
          brand_slug: brandName.toLowerCase().replace(/\s+/g, '-'),
          shop_address: 'Việt Nam',
          entity_type: seedProds[0].is_mall ? 'ENTERPRISE' : 'INDIVIDUAL',
          is_mall: Boolean(seedProds[0].is_mall),
          operational_mode: 'ACTIVE',
          tagline: 'Thương hiệu đối tác FitVision 3D Atelier',
        },
        reputation,
        products: seedProds,
        reviews: [],
      };
    }

    const [reputation, products, reviews] = await Promise.all([
      this.computeShopReputation(shop.id, shop.shop_name, Boolean(shop.is_mall)),
      query(
        `SELECT id, brand_name, shop_id, COALESCE(is_mall, FALSE) AS is_mall, name, name_en, slug, category, gender_target,
                price, sale_price, rating::float, reviews_count, fabric_material, fabric_material_en,
                stretch_type, image_url, secondary_image_url, video_url, description, description_en,
                is_bestseller, is_bespoke, is_hidden, variants, created_at, updated_at
         FROM products
         WHERE (shop_id = $1 OR LOWER(brand_name) = LOWER($2)) AND is_hidden = FALSE
         ORDER BY created_at DESC`,
        [shop.id, shop.shop_name]
      ),
      query(
        `SELECT r.id, r.product_id, r.user_name, r.rating, r.comment, r.is_verified_purchase, r.shop_reply, r.created_at, p.name AS product_name
         FROM product_reviews r
         INNER JOIN products p ON p.id = r.product_id
         WHERE p.shop_id = $1 OR LOWER(p.brand_name) = LOWER($2)
         ORDER BY r.created_at DESC
         LIMIT 20`,
        [shop.id, shop.shop_name]
      ),
    ]);

    return { shop, reputation, products, reviews };
  },

  async updateShopProfile(
    userId: string,
    payload: {
      shopName?: string;
      phoneNumber?: string;
      shopAddress?: string;
      tagline?: string;
      description?: string;
      bannerUrl?: string;
      logoUrl?: string;
      operationalMode?: 'ACTIVE' | 'VACATION';
      vacationNote?: string;
      vacationUntil?: string | null;
    }
  ) {
    const shop = await this.ensureShopForUser(userId);
    if (!shop) {
      throw new Error('Không tìm thấy hồ sơ Shop.');
    }
    const cleanName = String(payload.shopName || shop.shop_name).trim();
    const cleanPhone = String(payload.phoneNumber || shop.phone_number).trim().slice(0, 15);
    const cleanAddr = String(payload.shopAddress || shop.shop_address).trim().slice(0, 255);
    const cleanTagline = payload.tagline !== undefined ? String(payload.tagline).trim().slice(0, 255) : shop.tagline;
    const cleanDesc = payload.description !== undefined ? String(payload.description).trim() : shop.description;
    const cleanBanner = payload.bannerUrl !== undefined ? String(payload.bannerUrl).trim() : shop.banner_url;
    const cleanLogo = payload.logoUrl !== undefined ? String(payload.logoUrl).trim() : shop.logo_url;
    const opMode =
      payload.operationalMode === 'VACATION' || payload.operationalMode === 'ACTIVE'
        ? payload.operationalMode
        : shop.operational_mode || 'ACTIVE';
    const vacNote =
      payload.vacationNote !== undefined ? String(payload.vacationNote).trim() : shop.vacation_note;
    const vacUntil =
      payload.vacationUntil !== undefined
        ? payload.vacationUntil
          ? new Date(payload.vacationUntil)
          : null
        : shop.vacation_until;

    if (cleanName.length < 2) throw new Error('Tên Shop phải có tối thiểu 2 ký tự.');
    if (cleanPhone.length < 8) throw new Error('Số điện thoại Shop không hợp lệ.');

    const updated = await query(
      `UPDATE shops
       SET shop_name = $2, phone_number = $3, shop_address = $4,
           tagline = $5, description = $6, banner_url = $7, logo_url = $8,
           operational_mode = $9, vacation_note = $10, vacation_until = $11,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, owner_id, shop_name, brand_slug, phone_number, shop_address,
                 entity_type, tax_code, tax_status, status, is_verified,
                 COALESCE(is_mall, FALSE) AS is_mall,
                 COALESCE(operational_mode, 'ACTIVE') AS operational_mode,
                 vacation_note, vacation_until, banner_url, logo_url, tagline, description`,
      [
        shop.id,
        cleanName,
        cleanPhone,
        cleanAddr,
        cleanTagline || null,
        cleanDesc || null,
        cleanBanner || null,
        cleanLogo || null,
        opMode,
        vacNote || null,
        vacUntil,
      ]
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
      return {
        shop: null,
        documents: [],
        bankAccount: null,
        reputation: null,
        products: [],
        orders: [],
        reviews: [],
      };
    }

    const [documents, bankRows, reputation] = await Promise.all([
      query(
        `SELECT id, doc_type, file_url, file_name, qr_parsed_payload, verification_status, reviewer_note, updated_at
         FROM shop_kyc_documents
         WHERE shop_id = $1
         ORDER BY created_at ASC`,
        [shop.id]
      ),
      query(
        `SELECT id, bank_code, bank_name, account_number, account_holder_name, is_primary, name_match_score::float, verification_status
         FROM shop_bank_accounts
         WHERE shop_id = $1
         ORDER BY is_primary DESC, created_at ASC
         LIMIT 1`,
        [shop.id]
      ),
      this.computeShopReputation(shop.id, shop.shop_name, Boolean(shop.is_mall)),
    ]);

    if (shop.status !== 'APPROVED') {
      return {
        shop,
        documents,
        bankAccount: bankRows[0] || null,
        reputation,
        products: [],
        orders: [],
        reviews: [],
      };
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
              payment_method, payment_status, status, store_name, shop_id,
              has_bespoke_items, measurement_snapshot, estimated_delivery, created_at, updated_at
       FROM orders
       WHERE shop_id = $1
          OR LOWER(COALESCE(store_name, '')) = LOWER($2)
          OR EXISTS (
            SELECT 1 FROM jsonb_array_elements(items) AS el
            WHERE LOWER(COALESCE(el->'product'->>'brand_name', '')) = LOWER($2)
               OR el->'product'->>'shop_id' = $3
          )
       ORDER BY created_at DESC`,
      [shop.id, shop.shop_name, String(shop.id)]
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

    return {
      shop,
      documents,
      bankAccount: bankRows[0] || null,
      reputation,
      products,
      orders,
      reviews,
    };
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

    const isBespoke = Boolean(payload.isBespoke || category === 'tailored');

    const rows = await query(
      `INSERT INTO products (
         id, brand_name, shop_id, is_mall, name, name_en, slug, category, gender_target,
         price, sale_price, rating, reviews_count, fabric_material, fabric_material_en,
         stretch_type, image_url, secondary_image_url, video_url, description, description_en, is_bestseller, is_bespoke, is_hidden, variants
       ) VALUES (
         $1, $2, $3, $4, $5, $5, $6, $7, $8,
         $9, $10, 5.0, 0, $11, $11,
         $12, $13, $14, $15, $16, $16, TRUE, $18, FALSE, $17::jsonb
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
        isBespoke,
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
       WHERE customer_id = $1 AND status <> 'cancelled' AND (status = 'completed' OR payment_status = 'paid')
         AND EXISTS (
           SELECT 1 FROM jsonb_array_elements(items) AS el
           WHERE el->'product'->>'id' = $2
         )`,
      [input.userId, input.productId]
    );
    const isVerifiedPurchase = parseInt(purchased[0]?.cnt || '0', 10) > 0;
    if (!isVerifiedPurchase) {
      throw new AppError(
        403,
        ErrorCode.FORBIDDEN_INSUFFICIENT_PERMISSIONS,
        'Bạn cần mua và thanh toán hoặc hoàn tất đơn hàng chứa sản phẩm này trước khi gửi đánh giá.'
      );
    }

    const dupReview = await query<{ id: number }>(
      `SELECT id FROM product_reviews WHERE product_id = $1 AND user_id = $2 LIMIT 1`,
      [input.productId, input.userId]
    );
    if (dupReview.length > 0) {
      throw new AppError(400, ErrorCode.VALIDATION_FAILED, 'Bạn đã đánh giá sản phẩm này rồi.');
    }

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

  async replyProductReview(
    reviewId: number,
    shopReply: string,
    actor?: { sub: string; role: string }
  ) {
    await ensureCommerceTablesAndSeed();

    const reviewRows = await query<{
      id: number;
      product_id: string;
      shop_id: string | null;
      brand_name: string;
    }>(
      `SELECT r.id, r.product_id, p.shop_id, p.brand_name
       FROM product_reviews r
       INNER JOIN products p ON p.id = r.product_id
       WHERE r.id = $1
       LIMIT 1`,
      [reviewId]
    );
    const reviewRow = reviewRows[0];
    if (!reviewRow) return null;

    if (actor && actor.role !== 'ADMIN') {
      const shopRows = await query<{ id: string; shop_name: string }>(
        'SELECT id, shop_name FROM shops WHERE owner_id = $1 LIMIT 1',
        [actor.sub]
      );
      const shop = shopRows[0];
      const ownsProduct =
        Boolean(shop) &&
        (String(reviewRow.shop_id || '') === String(shop.id) ||
          String(reviewRow.brand_name || '').toLowerCase() === String(shop.shop_name || '').toLowerCase());

      if (!ownsProduct) {
        throw new AppError(
          403,
          ErrorCode.FORBIDDEN_INSUFFICIENT_PERMISSIONS,
          'Bạn không có quyền phản hồi đánh giá thuộc sản phẩm của cửa hàng khác.'
        );
      }
    }

    const rows = await query(
      `UPDATE product_reviews SET shop_reply = $2 WHERE id = $1 RETURNING *`,
      [reviewId, shopReply]
    );
    return rows[0] || null;
  },
};
