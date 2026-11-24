import { query } from '../../config/database.js';
import {
  compareVietnameseAccountNames,
  evaluateCccdQrConsistency,
  hashNationalId,
  validateVietnamCCCD,
  validateVietnamTaxCode,
  cassoTaxAndLocalKycProvider,
} from '../shop/kycVerification.js';
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
  entity_type?: 'INDIVIDUAL' | 'HOUSEHOLD' | 'ENTERPRISE';
  tax_code?: string;
  tax_status?: string;
  legal_representative_name?: string;
  national_id_last4?: string;
  business_license_no?: string;
  logo_url?: string;
  banner_url?: string;
  tagline?: string;
  description?: string;
  is_verified: boolean;
  is_mall?: boolean;
  operational_mode?: 'ACTIVE' | 'VACATION';
  tax_lookup_snapshot?: any;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  rejection_reason?: string | null;
  approved_at?: Date | null;
  reviewed_at?: Date | null;
  created_at: Date;
  updated_at: Date;
  owner_name?: string;
  owner_email?: string;
  owner_role?: string;
  documents?: any[];
  bankAccount?: any | null;
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
   * Danh sách toàn bộ hồ sơ nhà may / cửa hàng kèm tài liệu KYC, ngân hàng & thông tin chủ shop
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
        COALESCE(s.entity_type, 'INDIVIDUAL') as entity_type,
        s.tax_code,
        COALESCE(s.tax_status, 'PENDING_REVIEW') as tax_status,
        s.legal_representative_name,
        s.national_id_last4,
        s.business_license_no,
        s.logo_url,
        s.banner_url,
        s.tagline,
        s.description,
        s.is_verified,
        COALESCE(s.is_mall, FALSE) as is_mall,
        COALESCE(s.operational_mode, 'ACTIVE') as operational_mode,
        s.tax_lookup_snapshot,
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
    const shops = await query<AdminShopEntity>(sql);
    if (shops.length === 0) return [];

    const [docs, banks] = await Promise.all([
      query<any>(
        `SELECT id, shop_id, doc_type, file_url, file_name, qr_parsed_payload, verification_status, reviewer_note
         FROM shop_kyc_documents`
      ).catch(() => []),
      query<any>(
        `SELECT id, shop_id, bank_code, bank_name, account_number, account_holder_name, is_primary, name_match_score::float, verification_status
         FROM shop_bank_accounts
         WHERE is_primary = TRUE`
      ).catch(() => []),
    ]);

    return shops.map((s) => ({
      ...s,
      documents: docs.filter((d) => String(d.shop_id) === String(s.id)),
      bankAccount: banks.find((b) => String(b.shop_id) === String(s.id)) || null,
    }));
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
           tax_status = CASE WHEN tax_code IS NOT NULL AND tax_code <> '' THEN 'VERIFIED' ELSE tax_status END,
           rejection_reason = NULL,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [shopId, adminUserId && adminUserId !== 'system' ? adminUserId : null]
    );

    if (shopRows.length === 0) return null;
    const shop = shopRows[0];

    await query(
      `UPDATE shop_kyc_documents
       SET verification_status = 'VERIFIED', updated_at = NOW()
       WHERE shop_id = $1`,
      [shopId]
    ).catch(() => undefined);

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
      const checkRows = await query<{ entity_type: string; status: string; tax_code: string | null }>(
        'SELECT COALESCE(entity_type, \'INDIVIDUAL\') as entity_type, status, tax_code FROM shops WHERE id = $1 LIMIT 1',
        [shopId]
      );
      const target = checkRows[0];
      if (!target) return null;
      if (target.status !== 'APPROVED') {
        throw new AppError(400, ErrorCode.VALIDATION_ERROR, 'Chỉ cửa hàng đã được Duyệt mới có thể cấp huy hiệu FitVision Mall.');
      }
      if (target.entity_type !== 'ENTERPRISE' || !target.tax_code) {
        throw new AppError(
          400,
          ErrorCode.VALIDATION_ERROR,
          'Chỉ mô hình Doanh nghiệp (Enterprise) có GPKD & Mã số thuế hợp lệ mới đủ điều kiện FitVision Mall.'
        );
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
    const shop = rows[0];
    if (!shop) return null;
    const [documents, bankRows] = await Promise.all([
      query<any>('SELECT * FROM shop_kyc_documents WHERE shop_id = $1', [shop.id]).catch(() => []),
      query<any>(
        'SELECT * FROM shop_bank_accounts WHERE shop_id = $1 ORDER BY is_primary DESC LIMIT 1',
        [shop.id]
      ).catch(() => []),
    ]);
    return {
      ...shop,
      documents,
      bankAccount: bankRows[0] || null,
    };
  },

  /**
   * Chủ Shop cập nhật & nộp lại hồ sơ KYC/Thuế/Ngân hàng (khi đang PENDING hoặc bị REJECTED)
   */
  async applyShop(ownerId: string, data: {
    shopName: string;
    phoneNumber: string;
    shopAddress: string;
    businessLicenseNo?: string;
    entityType?: 'INDIVIDUAL' | 'HOUSEHOLD' | 'ENTERPRISE';
    taxCode?: string;
    nationalId?: string;
    legalRepresentativeName?: string;
    bankCode?: string;
    bankName?: string;
    bankAccountNumber?: string;
    bankAccountHolder?: string;
    kycDocuments?: Array<{
      docType: string;
      fileUrl: string;
      fileName?: string;
      qrParsedPayload?: any;
    }>;
  }): Promise<AdminShopEntity> {
    const entityType = data.entityType || 'INDIVIDUAL';
    const cleanNationalId = (data.nationalId || '').replace(/\s+/g, '');
    if (cleanNationalId) {
      const cccdCheck = validateVietnamCCCD(cleanNationalId);
      if (!cccdCheck.valid) {
        throw new AppError(400, ErrorCode.VALIDATION_FAILED, cccdCheck.reason || 'Số CCCD không hợp lệ.');
      }
    }
    const taxValidation = data.taxCode ? validateVietnamTaxCode(data.taxCode) : null;
    if (taxValidation && !taxValidation.valid) {
      throw new AppError(400, ErrorCode.VALIDATION_FAILED, taxValidation.reason || 'Mã số thuế không hợp lệ.');
    }
    if ((entityType === 'HOUSEHOLD' || entityType === 'ENTERPRISE') && !taxValidation?.normalized) {
      throw new AppError(400, ErrorCode.VALIDATION_ERROR, 'Hộ kinh doanh / Doanh nghiệp bắt buộc nhập Mã số thuế hợp lệ.');
    }

    const normalizedTaxCode = taxValidation?.normalized || null;
    const nationalIdHash = cleanNationalId ? hashNationalId(cleanNationalId) : null;
    const taxLookup = normalizedTaxCode
      ? await cassoTaxAndLocalKycProvider.lookupTaxCode(normalizedTaxCode, entityType)
      : null;
    const taxStatus =
      entityType === 'INDIVIDUAL' && !normalizedTaxCode
        ? 'USING_NATIONAL_ID_TEMP'
        : taxLookup?.lookupStatus === 'FOUND'
          ? 'VERIFIED'
          : 'PENDING_REVIEW';

    const existing = await query<AdminShopEntity>(
      'SELECT * FROM shops WHERE owner_id = $1 LIMIT 1',
      [ownerId]
    );

    let shop: AdminShopEntity;
    if (existing.length > 0) {
      const current = existing[0];
      const rows = await query<AdminShopEntity>(
        `UPDATE shops 
         SET shop_name = $2, 
             phone_number = $3, 
             shop_address = $4, 
             business_license_no = $5,
             entity_type = $6,
             tax_code = COALESCE($7, tax_code),
             tax_status = $8,
             legal_representative_name = COALESCE($9, legal_representative_name),
             national_id_last4 = COALESCE($10, national_id_last4),
             national_id_hash = COALESCE($11, national_id_hash),
             tax_lookup_snapshot = COALESCE($12::jsonb, tax_lookup_snapshot),
             status = 'PENDING',
             is_verified = false,
             rejection_reason = NULL,
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [
          current.id,
          data.shopName,
          data.phoneNumber,
          data.shopAddress,
          data.businessLicenseNo || null,
          entityType,
          normalizedTaxCode,
          taxStatus,
          data.legalRepresentativeName || null,
          cleanNationalId ? cleanNationalId.slice(-4) : null,
          nationalIdHash,
          taxLookup ? JSON.stringify(taxLookup) : null,
        ]
      );
      shop = rows[0];
    } else {
      const rows = await query<AdminShopEntity>(
        `INSERT INTO shops (
           owner_id, shop_name, phone_number, shop_address, business_license_no,
           entity_type, tax_code, tax_status, legal_representative_name, national_id_last4, national_id_hash,
           tax_lookup_snapshot, is_verified, status, operational_mode, created_at, updated_at
         ) VALUES (
           $1, $2, $3, $4, $5,
           $6, $7, $8, $9, $10, $11,
           $12::jsonb, false, 'PENDING', 'ACTIVE', NOW(), NOW()
         )
         RETURNING *`,
        [
          ownerId,
          data.shopName,
          data.phoneNumber,
          data.shopAddress,
          data.businessLicenseNo || null,
          entityType,
          normalizedTaxCode,
          taxStatus,
          data.legalRepresentativeName || null,
          cleanNationalId ? cleanNationalId.slice(-4) : null,
          nationalIdHash,
          taxLookup ? JSON.stringify(taxLookup) : null,
        ]
      );
      shop = rows[0];
    }

    if (Array.isArray(data.kycDocuments)) {
      const repName = data.legalRepresentativeName || shop.legal_representative_name || '';
      for (const doc of data.kycDocuments) {
        let verificationStatus = 'PENDING';
        let reviewerNote: string | null = null;
        if (doc.docType === 'CCCD_FRONT' && cleanNationalId) {
          const qrEval = evaluateCccdQrConsistency(cleanNationalId, repName, doc.qrParsedPayload);
          verificationStatus = qrEval.status === 'MATCHED' ? 'VERIFIED' : 'PENDING';
          reviewerNote = qrEval.notes;
        }
        await query(
          `INSERT INTO shop_kyc_documents (shop_id, doc_type, file_url, file_name, qr_parsed_payload, verification_status, reviewer_note)
           VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
           ON CONFLICT (shop_id, doc_type) DO UPDATE SET
             file_url = EXCLUDED.file_url,
             file_name = EXCLUDED.file_name,
             qr_parsed_payload = EXCLUDED.qr_parsed_payload,
             verification_status = EXCLUDED.verification_status,
             reviewer_note = EXCLUDED.reviewer_note,
             updated_at = NOW()`,
          [
            shop.id,
            doc.docType,
            doc.fileUrl,
            doc.fileName || null,
            doc.qrParsedPayload ? JSON.stringify(doc.qrParsedPayload) : null,
            verificationStatus,
            reviewerNote,
          ]
        );
      }
    }

    if (data.bankAccountNumber && data.bankName && data.bankAccountHolder) {
      const expectedName =
        entityType === 'ENTERPRISE' && taxLookup?.businessName
          ? taxLookup.businessName
          : data.legalRepresentativeName || shop.legal_representative_name || data.shopName;
      const cmp = compareVietnameseAccountNames(data.bankAccountHolder, expectedName);
      await query(
        `INSERT INTO shop_bank_accounts (
           shop_id, bank_code, bank_name, account_number, account_holder_name,
           is_primary, name_match_score, verification_status
         ) VALUES ($1, $2, $3, $4, $5, TRUE, $6, $7)
         ON CONFLICT (shop_id, account_number) DO UPDATE SET
           bank_code = EXCLUDED.bank_code,
           bank_name = EXCLUDED.bank_name,
           account_holder_name = EXCLUDED.account_holder_name,
           name_match_score = EXCLUDED.name_match_score,
           verification_status = EXCLUDED.verification_status,
           updated_at = NOW()`,
        [
          shop.id,
          data.bankCode || 'BANK',
          data.bankName,
          data.bankAccountNumber.replace(/\s+/g, ''),
          data.bankAccountHolder.trim(),
          cmp.score,
          cmp.matched ? 'MATCHED' : 'MISMATCHED',
        ]
      );
    }

    return await this.getShopByOwnerId(ownerId) || shop;
  },
};

