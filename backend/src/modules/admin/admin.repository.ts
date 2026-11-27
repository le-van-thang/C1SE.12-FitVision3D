import { query } from '../../config/database.js';
import crypto from 'crypto';
import { hashPassword } from '../../utils/password.js';
import { AppError } from '../../utils/responseEnvelope.js';
import { ErrorCode } from '../../constants/errorCodes.js';

export interface AdminShopEntity {
  id: string;
  owner_id: string;
  shop_name: string;
  brand_slug?: string;
  phone_number: string;
  shop_address: string;
  city?: string;
  contact_email?: string;
  paypal_payout_email?: string | null;
  logo_url?: string;
  banner_url?: string;
  tagline?: string;
  description?: string;
  is_verified: boolean;
  is_mall?: boolean;
  operational_mode?: 'ACTIVE' | 'VACATION';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  rejection_reason?: string | null;
  approved_at?: Date | null;
  reviewed_at?: Date | null;
  created_at: Date;
  updated_at: Date;
  owner_name?: string;
  owner_email?: string;
  owner_role?: string;
}

export interface AdminUserEntity {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  role: 'ADMIN' | 'SHOP_OWNER' | 'USER';
  status: 'PENDING_VERIFY' | 'PENDING_APPROVAL' | 'ACTIVE' | 'LOCKED' | 'BANNED';
  last_login_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface AdminStats {
  totalUsers: number;
  totalStores: number;
  pendingStores: number;
  approvedStores: number;
  rejectedStores: number;
  totalMeasurements: number;
}

export const adminRepository = {
  /**
   * Lấy tổng hợp chỉ số thống kê nền tảng từ PostgreSQL
   */
  async getStats(): Promise<AdminStats> {
    try {
      const userRes = await query<{ count: string }>('SELECT COUNT(*) as count FROM users');
      const storeRes = await query<{ status: string; count: string }>(
        'SELECT COALESCE(status, \'PENDING\') as status, COUNT(*) as count FROM shops GROUP BY status'
      );
      const measRes = await query<{ count: string }>('SELECT COUNT(*) as count FROM measurements');

      let totalStores = 0;
      let pendingStores = 0;
      let approvedStores = 0;
      let rejectedStores = 0;

      for (const row of storeRes) {
        const c = parseInt(row.count, 10) || 0;
        totalStores += c;
        if (row.status === 'APPROVED') approvedStores += c;
        else if (row.status === 'REJECTED') rejectedStores += c;
        else pendingStores += c;
      }

      return {
        totalUsers: parseInt(userRes[0]?.count || '0', 10),
        totalStores,
        pendingStores,
        approvedStores,
        rejectedStores,
        totalMeasurements: parseInt(measRes[0]?.count || '0', 10),
      };
    } catch (err) {
      console.error('[adminRepository.getStats Error]:', err);
      return {
        totalUsers: 0,
        totalStores: 0,
        pendingStores: 0,
        approvedStores: 0,
        rejectedStores: 0,
        totalMeasurements: 0,
      };
    }
  },

  /**
   * Danh sách toàn bộ hồ sơ nhà may / cửa hàng kèm thông tin chủ shop & PayPal nhận giải ngân
   */
  async getAllShops(): Promise<AdminShopEntity[]> {
    const sql = `
      SELECT 
        s.id,
        s.owner_id,
        s.shop_name,
        s.brand_slug,
        s.phone_number,
        s.shop_address,
        s.city,
        s.contact_email,
        s.paypal_payout_email,
        s.logo_url,
        s.banner_url,
        s.tagline,
        s.description,
        s.is_verified,
        COALESCE(s.is_mall, FALSE) as is_mall,
        COALESCE(s.operational_mode, 'ACTIVE') as operational_mode,
        COALESCE(s.status, CASE WHEN s.is_verified THEN 'APPROVED' ELSE 'PENDING' END) as status,
        s.rejection_reason,
        s.approved_at,
        s.reviewed_at,
        s.created_at,
        s.updated_at,
        u.full_name as owner_name,
        u.email as owner_email,
        u.role as owner_role
      FROM shops s
      LEFT JOIN users u ON s.owner_id = u.id
      ORDER BY s.created_at DESC
    `;
    return await query<AdminShopEntity>(sql);
  },

  /**
   * Phê duyệt hồ sơ cửa hàng & tự động thăng hạng tài khoản chủ sở hữu
   */
  async approveShop(shopId: string, adminUserId?: string): Promise<AdminShopEntity | null> {
    const shopRows = await query<AdminShopEntity>(
      `UPDATE shops 
       SET is_verified = true, 
           status = 'APPROVED', 
           approved_at = NOW(), 
           reviewed_at = NOW(),
           reviewed_by = $2,
           rejection_reason = NULL,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [shopId, adminUserId && adminUserId !== 'system' ? adminUserId : null]
    );

    if (shopRows.length === 0) return null;
    const shop = shopRows[0];

    // Cập nhật người dùng tương ứng thành SHOP_OWNER & ACTIVE (giữ nguyên ADMIN nếu tài khoản là Admin)
    await query(
      `UPDATE users 
       SET role = CASE WHEN role = 'ADMIN' THEN 'ADMIN' ELSE 'SHOP_OWNER' END, 
           status = 'ACTIVE', 
           updated_at = NOW() 
       WHERE id = $1`,
      [shop.owner_id]
    );

    return shop;
  },

  /**
   * Từ chối hồ sơ cửa hàng kèm lý do
   */
  async rejectShop(shopId: string, reason: string, adminUserId?: string): Promise<AdminShopEntity | null> {
    const shopRows = await query<AdminShopEntity>(
      `UPDATE shops 
       SET is_verified = false, 
           status = 'REJECTED', 
           rejection_reason = $2, 
           reviewed_at = NOW(),
           reviewed_by = $3,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [shopId, reason, adminUserId && adminUserId !== 'system' ? adminUserId : null]
    );

    if (shopRows.length === 0) return null;
    return shopRows[0];
  },

  /**
   * Tạm đình chỉ cửa hàng vi phạm (ẩn toàn bộ sản phẩm công khai)
   */
  async suspendShop(shopId: string, reason: string, adminUserId?: string): Promise<AdminShopEntity | null> {
    const shopRows = await query<AdminShopEntity>(
      `UPDATE shops 
       SET is_verified = false, 
           status = 'SUSPENDED', 
           rejection_reason = $2, 
           reviewed_at = NOW(),
           reviewed_by = $3,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [shopId, reason, adminUserId && adminUserId !== 'system' ? adminUserId : null]
    );
    if (shopRows.length === 0) return null;
    const shop = shopRows[0];
    await query(
      `UPDATE products SET is_hidden = TRUE, updated_at = NOW()
       WHERE shop_id = $1 OR LOWER(brand_name) = LOWER($2)`,
      [shop.id, shop.shop_name]
    ).catch(() => undefined);
    return shop;
  },

  /**
   * Cấp / thu hồi huy hiệu FitVision Mall chính hãng cho Shop và đồng bộ sản phẩm
   */
  async setShopMall(shopId: string, isMall: boolean): Promise<AdminShopEntity | null> {
    if (isMall) {
      const checkRows = await query<{ status: string }>(
        'SELECT status FROM shops WHERE id = $1 LIMIT 1',
        [shopId]
      );
      const target = checkRows[0];
      if (!target) return null;
      if (target.status !== 'APPROVED') {
        throw new AppError(400, ErrorCode.VALIDATION_ERROR, 'Chỉ cửa hàng đã được Duyệt mới có thể cấp huy hiệu FitVision Mall.');
      }
    }

    const shopRows = await query<AdminShopEntity>(
      `UPDATE shops
       SET is_mall = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [shopId, isMall]
    );
    if (shopRows.length === 0) return null;
    const shop = shopRows[0];
    await query(
      `UPDATE products
       SET is_mall = $2, updated_at = NOW()
       WHERE shop_id = $1 OR LOWER(brand_name) = LOWER($3)`,
      [shop.id, isMall, shop.shop_name]
    ).catch(() => undefined);
    return shop;
  },

  /**
   * Danh sách người dùng hệ thống
   */
  async getAllUsers(): Promise<AdminUserEntity[]> {
    const sql = `
      SELECT id, email, full_name, phone, role, status, last_login_at, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `;
    return await query<AdminUserEntity>(sql);
  },

  /**
   * Cập nhật trạng thái người dùng (Khóa / Kích hoạt)
   */
  async updateUserStatus(userId: string, status: string): Promise<AdminUserEntity | null> {
    const rows = await query<AdminUserEntity>(
      `UPDATE users 
       SET status = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING id, email, full_name, phone, role, status, last_login_at, created_at, updated_at`,
      [userId, status]
    );
    return rows[0] || null;
  },

  /**
   * Cập nhật vai trò người dùng (USER, SHOP_OWNER, ADMIN)
   */
  async updateUserRole(userId: string, role: string): Promise<AdminUserEntity | null> {
    const rows = await query<AdminUserEntity>(
      `UPDATE users 
       SET role = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING id, email, full_name, phone, role, status, last_login_at, created_at, updated_at`,
      [userId, role]
    );
    return rows[0] || null;
  },

  /**
   * Lấy nhật ký kiểm toán hệ thống
   */
  async getAuditLogs(limit = 50) {
    const sql = `
      SELECT 
        l.id,
        l.user_id,
        l.measurement_id,
        l.action_type,
        l.execution_time_ms,
        l.zero_retention_flag,
        l.ip_address_hash,
        l.created_at,
        u.email as user_email,
        u.full_name as user_name
      FROM system_audit_logs l
      LEFT JOIN users u ON l.user_id = u.id
      ORDER BY l.created_at DESC
      LIMIT $1
    `;
    return await query(sql, [limit]);
  },

  /**
   * Ghi log kiểm toán
   */
  async logAction(data: {
    userId?: string;
    actionType: string;
    executionTimeMs?: number;
    ipAddressHash?: string;
  }) {
    try {
      await query(
        `INSERT INTO system_audit_logs (user_id, action_type, execution_time_ms, zero_retention_flag, ip_address_hash, created_at)
         VALUES ($1, $2, $3, true, $4, NOW())`,
        [
          data.userId || null,
          data.actionType,
          data.executionTimeMs || 0,
          data.ipAddressHash || 'local-loopback',
        ]
      );
    } catch (err) {
      console.warn('[logAction Warn]: Could not write audit log:', err);
    }
  },

  /**
   * Lấy hồ sơ shop của chính người dùng đang đăng nhập
   */
  async getShopByOwnerId(ownerId: string): Promise<AdminShopEntity | null> {
    const rows = await query<AdminShopEntity>(
      'SELECT * FROM shops WHERE owner_id = $1 LIMIT 1',
      [ownerId]
    );
    return rows[0] || null;
  },

  /**
   * Chủ Shop cập nhật & nộp lại hồ sơ gian hàng (khi đang PENDING hoặc bị REJECTED)
   */
  async applyShop(ownerId: string, data: {
    shopName: string;
    phoneNumber: string;
    shopAddress: string;
    paypalPayoutEmail?: string;
    tagline?: string;
  }): Promise<AdminShopEntity> {
    const cleanName = String(data.shopName || '').trim();
    const cleanPhone = String(data.phoneNumber || '').trim();
    const cleanAddress = String(data.shopAddress || '').trim();
    const cleanPaypal = String(data.paypalPayoutEmail || '').trim().toLowerCase() || null;

    if (cleanName.length < 3) {
      throw new AppError(400, ErrorCode.VALIDATION_FAILED, 'Tên cửa hàng phải có tối thiểu 3 ký tự.');
    }

    const existing = await query<AdminShopEntity>(
      'SELECT * FROM shops WHERE owner_id = $1 LIMIT 1',
      [ownerId]
    );

    if (existing.length > 0) {
      const current = existing[0];
      if (current.status === 'APPROVED') {
        throw new AppError(
          400,
          ErrorCode.VALIDATION_FAILED,
          'Gian hàng đã được duyệt. Vui lòng cập nhật thông tin ở trang Hồ sơ Shop.'
        );
      }
      const rows = await query<AdminShopEntity>(
        `UPDATE shops 
         SET shop_name = $2, 
             phone_number = $3, 
             shop_address = $4,
             paypal_payout_email = COALESCE($5, paypal_payout_email),
             tagline = COALESCE($6, tagline),
             status = 'PENDING',
             is_verified = false,
             rejection_reason = NULL,
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [current.id, cleanName, cleanPhone, cleanAddress, cleanPaypal, data.tagline || null]
      );
      return rows[0];
    }

    const brandSlug = `${cleanName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'shop'}-${ownerId.slice(0, 6)}`;

    const rows = await query<AdminShopEntity>(
      `INSERT INTO shops (
         owner_id, shop_name, brand_slug, phone_number, shop_address, paypal_payout_email, tagline,
         is_verified, status, operational_mode, created_at, updated_at
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7,
         false, 'PENDING', 'ACTIVE', NOW(), NOW()
       )
       RETURNING *`,
      [ownerId, cleanName, brandSlug, cleanPhone, cleanAddress, cleanPaypal, data.tagline || null]
    );
    return rows[0];
  },

  /**
   * Admin cấp tài khoản Shop & gian hàng từ một User có sẵn (Cách A: tách tài khoản SHOP_OWNER riêng + cấp mật khẩu, hoặc Cách B: nâng cấp trực tiếp)
   */
  async provisionShopForUser(
    targetUserId: string,
    payload: {
      mode?: 'SEPARATE_ACCOUNT' | 'PROMOTE_CURRENT';
      shopEmail?: string;
      temporaryPassword?: string;
      shopName?: string;
      phoneNumber?: string;
      shopAddress?: string;
      paypalPayoutEmail?: string;
      autoApprove?: boolean;
    },
    adminUserId?: string
  ) {
    const userRows = await query<{
      id: string;
      email: string;
      full_name: string;
      phone: string | null;
      role: string;
    }>('SELECT id, email, full_name, phone, role FROM users WHERE id = $1 LIMIT 1', [targetUserId]);
    const targetUser = userRows[0];
    if (!targetUser) {
      throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, 'Không tìm thấy người dùng mục tiêu.');
    }

    const mode = payload.mode === 'PROMOTE_CURRENT' ? 'PROMOTE_CURRENT' : 'SEPARATE_ACCOUNT';
    const autoApprove = payload.autoApprove !== false;
    const cleanShopName = String(payload.shopName || `${targetUser.full_name} Atelier`).trim();
    const cleanPhone = String(payload.phoneNumber || targetUser.phone || '0909000111').trim().slice(0, 15);
    const cleanAddr = String(payload.shopAddress || 'TP. Hồ Chí Minh, Việt Nam').trim().slice(0, 255);
    const cleanPaypalEmail = String(payload.paypalPayoutEmail || '').trim().toLowerCase() || null;

    if (cleanShopName.length < 3) {
      throw new AppError(400, ErrorCode.VALIDATION_ERROR, 'Tên cửa hàng phải có tối thiểu 3 ký tự.');
    }

    const dupName = await query<{ id: string }>(
      'SELECT id FROM shops WHERE LOWER(shop_name) = LOWER($1) AND owner_id <> $2 LIMIT 1',
      [cleanShopName, targetUserId]
    );
    if (dupName.length > 0) {
      throw new AppError(409, ErrorCode.VALIDATION_FAILED, 'Tên thương hiệu cửa hàng này đã tồn tại.');
    }

    const localPart = targetUser.email.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase() || 'partner';
    const shopEmail =
      mode === 'SEPARATE_ACCOUNT'
        ? String(payload.shopEmail || `shop.${localPart}@fitvision3d.com`).trim().toLowerCase()
        : targetUser.email.toLowerCase();

    const providedPassword =
      typeof payload.temporaryPassword === 'string' ? payload.temporaryPassword.trim() : '';
    let ownerUserId = targetUser.id;
    const userStatus = autoApprove ? 'ACTIVE' : 'PENDING_APPROVAL';
    let tempPassword = '';

    if (mode === 'SEPARATE_ACCOUNT') {
      tempPassword = providedPassword || `Shop@${crypto.randomBytes(3).toString('hex')}!`;
      const passwordHash = await hashPassword(tempPassword);
      const existingShopUser = await query<{ id: string; role: string }>(
        'SELECT id, role FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1',
        [shopEmail]
      );
      if (existingShopUser.length > 0) {
        throw new AppError(
          409,
          ErrorCode.AUTH_EMAIL_ALREADY_EXISTS,
          `Email Shop "${shopEmail}" đã tồn tại trên hệ thống. Vui lòng chọn email khác.`
        );
      }

      const newOwnerId = crypto.randomUUID();
      await query(
        `INSERT INTO users (id, email, password_hash, full_name, phone, role, status, failed_login_attempts, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'SHOP_OWNER', $6, 0, NOW(), NOW())`,
        [newOwnerId, shopEmail, passwordHash, targetUser.full_name, cleanPhone, userStatus]
      );
      ownerUserId = newOwnerId;
    } else if (providedPassword.length >= 6) {
      tempPassword = providedPassword;
      const passwordHash = await hashPassword(tempPassword);
      await query(
        `UPDATE users
         SET role = CASE WHEN role = 'ADMIN' THEN 'ADMIN' ELSE 'SHOP_OWNER' END,
             status = $2, password_hash = $3, updated_at = NOW()
         WHERE id = $1`,
        [targetUser.id, userStatus, passwordHash]
      );
    } else {
      await query(
        `UPDATE users
         SET role = CASE WHEN role = 'ADMIN' THEN 'ADMIN' ELSE 'SHOP_OWNER' END,
             status = $2, updated_at = NOW()
         WHERE id = $1`,
        [targetUser.id, userStatus]
      );
    }

    const slugBase = cleanShopName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
    const brandSlug = `${slugBase || 'shop'}-${ownerUserId.slice(0, 6)}`;
    const shopStatus = autoApprove ? 'APPROVED' : 'PENDING';

    const existingShop = await query<AdminShopEntity>(
      'SELECT * FROM shops WHERE owner_id = $1 LIMIT 1',
      [ownerUserId]
    );
    let shop: AdminShopEntity;
    if (existingShop.length > 0) {
      const rows = await query<AdminShopEntity>(
        `UPDATE shops
         SET shop_name = $2, phone_number = $3, shop_address = $4,
             paypal_payout_email = COALESCE($5, paypal_payout_email),
             status = $6, is_verified = $7,
             approved_at = CASE WHEN $7 THEN NOW() ELSE approved_at END,
             reviewed_at = NOW(), reviewed_by = $8, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [
          existingShop[0].id,
          cleanShopName,
          cleanPhone,
          cleanAddr,
          cleanPaypalEmail,
          shopStatus,
          autoApprove,
          adminUserId && adminUserId !== 'system' ? adminUserId : null,
        ]
      );
      shop = rows[0];
    } else {
      const rows = await query<AdminShopEntity>(
        `INSERT INTO shops (
           owner_id, shop_name, brand_slug, phone_number, shop_address, contact_email,
           paypal_payout_email, status, is_verified, is_mall, operational_mode,
           approved_at, reviewed_at, reviewed_by, created_at, updated_at
         ) VALUES (
           $1, $2, $3, $4, $5, $6,
           $7, $8, $9, FALSE, 'ACTIVE',
           CASE WHEN $9 THEN NOW() ELSE NULL END, NOW(), $10, NOW(), NOW()
         )
         RETURNING *`,
        [
          ownerUserId,
          cleanShopName,
          brandSlug,
          cleanPhone,
          cleanAddr,
          shopEmail,
          cleanPaypalEmail,
          shopStatus,
          autoApprove,
          adminUserId && adminUserId !== 'system' ? adminUserId : null,
        ]
      );
      shop = rows[0];
    }

    return {
      shop,
      ownerUserId,
      credentials: {
        loginUrl: '/shop',
        shopEmail,
        temporaryPassword: tempPassword,
        originalUserEmail: targetUser.email,
        mode,
        autoApproved: autoApprove,
        brandSlug: shop.brand_slug || brandSlug,
      },
    };
  },
};

