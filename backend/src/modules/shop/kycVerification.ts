import crypto from 'crypto';
import { env } from '../../config/env.js';
import {
  type ShopEntityType,
  validateVietnamCCCD,
  validateVietnamTaxCode,
} from './kycRules.js';

export * from './kycRules.js';

export function hashNationalId(cccd: string): string {
  return crypto
    .createHash('sha256')
    .update(`fv3d_nid:${cccd.trim()}:${env.KYC_HASH_PEPPER}`)
    .digest('hex');
}

export interface TaxLookupResult {
  taxCode: string;
  checksumValid: boolean;
  lookupStatus: 'FOUND' | 'NOT_FOUND' | 'NOT_CONFIGURED' | 'PERSONAL_UNLISTED' | 'ERROR';
  businessName?: string;
  internationalName?: string;
  address?: string;
  operationalStatus?: string;
  provider: string;
  message: string;
}

export interface KycEkycProvider {
  readonly name: string;
  lookupTaxCode(taxCode: string, entityType?: ShopEntityType): Promise<TaxLookupResult>;
}

export const cassoTaxAndLocalKycProvider: KycEkycProvider = {
  name: 'casso-open-platform+local-checks',

  async lookupTaxCode(
    taxCodeRaw: string,
    entityType: ShopEntityType = 'ENTERPRISE'
  ): Promise<TaxLookupResult> {
    const check = validateVietnamTaxCode(taxCodeRaw);
    if (!check.valid) {
      return {
        taxCode: check.normalized,
        checksumValid: false,
        lookupStatus: 'ERROR',
        provider: this.name,
        message: check.reason || 'Mã số thuế không hợp lệ.',
      };
    }

    if (check.kind === 'PERSONAL_CCCD_12' && entityType === 'INDIVIDUAL') {
      return {
        taxCode: check.normalized,
        checksumValid: true,
        lookupStatus: 'PERSONAL_UNLISTED',
        provider: this.name,
        message:
          'CCCD 12 số hợp lệ theo cấu trúc 63 tỉnh/TP. Hồ sơ cá nhân được đối soát qua QR CCCD & Chủ TK ngân hàng.',
      };
    }

    const cassoKey = env.CASSO_API_KEY;
    if (!cassoKey) {
      return {
        taxCode: check.normalized,
        checksumValid: true,
        lookupStatus: 'NOT_CONFIGURED',
        provider: this.name,
        message:
          'MST đạt chuẩn Checksum Mod-11. Chưa cấu hình CASSO_API_KEY nên chưa tra cứu tự động Tổng cục Thuế.',
      };
    }

    const endpoint =
      entityType === 'HOUSEHOLD'
        ? `${env.CASSO_OPENAPI_URL}/idkit/v1/household/${encodeURIComponent(check.normalized)}`
        : `${env.CASSO_OPENAPI_URL}/idkit/v1/business/${encodeURIComponent(check.normalized)}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);
      const res = await fetch(endpoint, {
        headers: {
          Authorization: `Apikey ${cassoKey}`,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.status === 404) {
        return {
          taxCode: check.normalized,
          checksumValid: true,
          lookupStatus: 'NOT_FOUND',
          provider: 'casso-open-platform',
          message: 'Không tìm thấy doanh nghiệp/hộ kinh doanh mang MST này trên dữ liệu Casso.',
        };
      }
      if (!res.ok) {
        return {
          taxCode: check.normalized,
          checksumValid: true,
          lookupStatus: 'ERROR',
          provider: 'casso-open-platform',
          message: `Casso API trả về HTTP ${res.status}. Chuyển sang duyệt thủ công.`,
        };
      }

      const body: any = await res.json();
      const payload = body?.data || body;
      return {
        taxCode: check.normalized,
        checksumValid: true,
        lookupStatus: payload?.name ? 'FOUND' : 'NOT_FOUND',
        businessName: payload?.name || payload?.shortName,
        internationalName: payload?.internationalName,
        address: payload?.address,
        operationalStatus: payload?.status || 'Đang hoạt động',
        provider: 'casso-open-platform',
        message: payload?.name
          ? `Tìm thấy: ${payload.name}`
          : 'Không có thông tin doanh nghiệp trong phản hồi.',
      };
    } catch (err: any) {
      return {
        taxCode: check.normalized,
        checksumValid: true,
        lookupStatus: 'ERROR',
        provider: 'casso-open-platform',
        message: `Không thể kết nối Casso Open Platform (${err?.message || 'timeout'}).`,
      };
    }
  },
};
