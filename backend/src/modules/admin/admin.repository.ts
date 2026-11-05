import { query } from '../../config/database.js';

export interface AdminShopEntity {
  id: string;
  owner_id: string;
  shop_name: string;
  brand_slug?: string;
  phone_number: string;
  shop_address: string;
  city?: string;
  contact_email?: string;
  tax_code?: string;
  business_license_no?: string;
  logo_url?: string;
  description?: string;
  is_verified: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejection_reason?: string | null;
  approved_at?: Date | null;
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
   * Danh sách toàn bộ hồ sơ nhà may / cửa hàng kèm thông tin chủ shop
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
        s.tax_code,
        s.business_license_no,
        s.logo_url,
        s.description,
        s.is_verified,
        COALESCE(s.status, CASE WHEN s.is_verified THEN 'APPROVED' ELSE 'PENDING' END) as status,
        s.rejection_reason,
        s.approved_at,
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
  async approveShop(shopId: string): Promise<AdminShopEntity | null> {
    const shopRows = await query<AdminShopEntity>(
      `UPDATE shops 
       SET is_verified = true, 
           status = 'APPROVED', 
           approved_at = NOW(), 
           rejection_reason = NULL,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [shopId]
    );

    if (shopRows.length === 0) return null;
    const shop = shopRows[0];

    // Cập nhật người dùng tương ứng thành SHOP_OWNER & ACTIVE
    await query(
      `UPDATE users 
       SET role = 'SHOP_OWNER', 
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
  async rejectShop(shopId: string, reason: string): Promise<AdminShopEntity | null> {
    const shopRows = await query<AdminShopEntity>(
      `UPDATE shops 
       SET is_verified = false, 
           status = 'REJECTED', 
           rejection_reason = $2, 
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [shopId, reason]
    );

    if (shopRows.length === 0) return null;
    return shopRows[0];
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
   * Người dùng nộp đơn mở cửa hàng
   */
  async applyShop(ownerId: string, data: {
    shopName: string;
    phoneNumber: string;
    shopAddress: string;
    businessLicenseNo?: string;
  }): Promise<AdminShopEntity> {
    const existing = await query<AdminShopEntity>(
      'SELECT * FROM shops WHERE owner_id = $1 LIMIT 1',
      [ownerId]
    );

    if (existing.length > 0) {
      const current = existing[0];
      const rows = await query<AdminShopEntity>(
        `UPDATE shops 
         SET shop_name = $2, 
             phone_number = $3, 
             shop_address = $4, 
             business_license_no = $5,
             status = 'PENDING',
             is_verified = false,
             rejection_reason = NULL,
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [current.id, data.shopName, data.phoneNumber, data.shopAddress, data.businessLicenseNo || null]
      );
      return rows[0];
    }

    const rows = await query<AdminShopEntity>(
      `INSERT INTO shops (owner_id, shop_name, phone_number, shop_address, business_license_no, is_verified, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, false, 'PENDING', NOW(), NOW())
       RETURNING *`,
      [ownerId, data.shopName, data.phoneNumber, data.shopAddress, data.businessLicenseNo || null]
    );
    return rows[0];
  },
};
