export type ShopEntityType = 'INDIVIDUAL' | 'HOUSEHOLD' | 'ENTERPRISE';

/**
 * 63 Official Vietnam Province / City Birth Registration Codes (Thong tu 07/2016/TT-BCA)
 */
export const VIETNAM_CCCD_PROVINCE_CODES: Record<string, string> = {
  '001': 'Hà Nội',
  '002': 'Hà Giang',
  '004': 'Cao Bằng',
  '006': 'Bắc Kạn',
  '008': 'Tuyên Quang',
  '010': 'Lào Cai',
  '011': 'Điện Biên',
  '012': 'Lai Châu',
  '014': 'Sơn La',
  '015': 'Yên Bái',
  '017': 'Hòa Bình',
  '019': 'Thái Nguyên',
  '020': 'Lạng Sơn',
  '022': 'Quảng Ninh',
  '024': 'Bắc Giang',
  '025': 'Phú Thọ',
  '026': 'Vĩnh Phúc',
  '027': 'Bắc Ninh',
  '030': 'Hải Dương',
  '031': 'Hải Phòng',
  '033': 'Hưng Yên',
  '034': 'Thái Bình',
  '035': 'Hà Nam',
  '036': 'Nam Định',
  '037': 'Ninh Bình',
  '038': 'Thanh Hóa',
  '040': 'Nghệ An',
  '042': 'Hà Tĩnh',
  '044': 'Quảng Bình',
  '045': 'Quảng Trị',
  '046': 'Thừa Thiên Huế',
  '048': 'Đà Nẵng',
  '049': 'Quảng Nam',
  '051': 'Quảng Ngãi',
  '052': 'Bình Định',
  '054': 'Phú Yên',
  '056': 'Khánh Hòa',
  '058': 'Ninh Thuận',
  '060': 'Bình Thuận',
  '062': 'Kon Tum',
  '064': 'Gia Lai',
  '066': 'Đắk Lắk',
  '067': 'Đắk Nông',
  '068': 'Lâm Đồng',
  '070': 'Bình Phước',
  '072': 'Tây Ninh',
  '074': 'Bình Dương',
  '075': 'Đồng Nai',
  '077': 'Bà Rịa - Vũng Tàu',
  '079': 'TP. Hồ Chí Minh',
  '080': 'Long An',
  '082': 'Tiền Giang',
  '083': 'Bến Tre',
  '084': 'Trà Vinh',
  '086': 'Vĩnh Long',
  '087': 'Đồng Tháp',
  '089': 'An Giang',
  '091': 'Kiên Giang',
  '092': 'Cần Thơ',
  '093': 'Hậu Giang',
  '094': 'Sóc Trăng',
  '095': 'Bạc Liêu',
  '096': 'Cà Mau',
};

export const TAX_CODE_REGEX = /^([0-9]{10}|[0-9]{12}|[0-9]{10}-[0-9]{3}|[0-9]{10}-888|[0-9]{12}-888)$/;
export const CCCD_REGEX = /^[0-9]{12}$/;

export interface CccdQrParsedPayload {
  cccd?: string;
  oldCmnd?: string;
  fullName?: string;
  dob?: string;
  gender?: string;
  address?: string;
  issueDate?: string;
}

export function validateVietnamCCCD(cccdRaw: string): {
  valid: boolean;
  provinceName?: string;
  birthYear?: number;
  gender?: 'MALE' | 'FEMALE';
  reason?: string;
} {
  const cccd = String(cccdRaw || '').replace(/\s+/g, '');
  if (!CCCD_REGEX.test(cccd)) {
    return { valid: false, reason: 'Số CCCD phải gồm đúng 12 chữ số.' };
  }
  if (/^(\d)\1{11}$/.test(cccd) || cccd === '012345678901' || cccd === '123456789012') {
    return { valid: false, reason: 'Số CCCD không hợp lệ (chuỗi số lặp hoặc tuần tự giả mạo).' };
  }

  const provinceCode = cccd.slice(0, 3);
  const provinceName = VIETNAM_CCCD_PROVINCE_CODES[provinceCode];
  if (!provinceName) {
    return {
      valid: false,
      reason: `Mã tỉnh/thành "${provinceCode}" trong CCCD không thuộc danh mục 63 tỉnh/TP Việt Nam.`,
    };
  }

  const centuryGenderDigit = parseInt(cccd.charAt(3), 10);
  const yearSuffix = parseInt(cccd.slice(4, 6), 10);
  const centuryBase = 1900 + Math.floor(centuryGenderDigit / 2) * 100;
  const birthYear = centuryBase + yearSuffix;
  const gender: 'MALE' | 'FEMALE' = centuryGenderDigit % 2 === 0 ? 'MALE' : 'FEMALE';

  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;
  if (birthYear > currentYear || age < 18 || age > 105) {
    return {
      valid: false,
      reason: `Năm sinh suy ra từ CCCD (${birthYear}) không hợp lệ hoặc chưa đủ 18 tuổi để đăng ký kinh doanh.`,
    };
  }

  return { valid: true, provinceName, birthYear, gender };
}

export function isValidMst10Checksum(mst10: string): boolean {
  if (!/^\d{10}$/.test(mst10)) return false;
  if (/^(\d)\1{9}$/.test(mst10)) return false;

  const weights = [31, 29, 23, 19, 17, 13, 7, 5, 3];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(mst10.charAt(i), 10) * weights[i];
  }
  const remainder = sum % 11;
  const checkDigit = (10 - remainder) % 11;
  if (checkDigit === 10) return false;
  return checkDigit === parseInt(mst10.charAt(9), 10);
}

export function validateVietnamTaxCode(taxRaw: string): {
  valid: boolean;
  normalized: string;
  kind?: 'ENTERPRISE_10' | 'BRANCH_13' | 'PERSONAL_CCCD_12' | 'ECOMMERCE_888';
  reason?: string;
} {
  const normalized = String(taxRaw || '').replace(/\s+/g, '').toUpperCase();
  if (!normalized) {
    return { valid: false, normalized: '', reason: 'Mã số thuế không được để trống.' };
  }
  if (!TAX_CODE_REGEX.test(normalized)) {
    return {
      valid: false,
      normalized,
      reason:
        'Mã số thuế không đúng chuẩn VN (10 số, 12 số CCCD, 10 số-chi nhánh 001, hoặc hậu tố -888 TMĐT).',
    };
  }

  if (normalized.endsWith('-888')) {
    const base = normalized.slice(0, -4);
    const ok = base.length === 10 ? isValidMst10Checksum(base) : validateVietnamCCCD(base).valid;
    if (!ok) {
      return {
        valid: false,
        normalized,
        reason: 'Mã số thuế TMĐT (-888) có phần gốc không vượt qua kiểm tra cấu trúc/checksum.',
      };
    }
    return { valid: true, normalized, kind: 'ECOMMERCE_888' };
  }

  if (normalized.includes('-')) {
    const [base, branch] = normalized.split('-');
    if (branch === '000' || !isValidMst10Checksum(base)) {
      return {
        valid: false,
        normalized,
        reason: 'Mã số thuế chi nhánh (13 số) sai checksum Mod-11 hoặc mã chi nhánh 000.',
      };
    }
    return { valid: true, normalized, kind: 'BRANCH_13' };
  }

  if (normalized.length === 12) {
    const cccdCheck = validateVietnamCCCD(normalized);
    if (!cccdCheck.valid) {
      return {
        valid: false,
        normalized,
        reason: cccdCheck.reason || 'Mã số thuế 12 số không khớp cấu trúc CCCD hợp lệ.',
      };
    }
    return { valid: true, normalized, kind: 'PERSONAL_CCCD_12' };
  }

  if (!isValidMst10Checksum(normalized)) {
    return {
      valid: false,
      normalized,
      reason: 'Mã số thuế 10 số không đúng chữ số kiểm tra (Checksum Mod-11). Vui lòng kiểm tra lại.',
    };
  }
  return { valid: true, normalized, kind: 'ENTERPRISE_10' };
}

export function normalizeVietnameseText(input: string): string {
  return String(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function compareVietnameseAccountNames(
  accountHolderName: string,
  expectedOwnerOrCompanyName: string
): { matched: boolean; score: number } {
  const a = normalizeVietnameseText(accountHolderName);
  const b = normalizeVietnameseText(expectedOwnerOrCompanyName);
  if (!a || !b) return { matched: false, score: 0 };
  if (a === b) return { matched: true, score: 100 };

  const tokensA = new Set(a.split(' ').filter(Boolean));
  const tokensB = new Set(b.split(' ').filter(Boolean));
  let overlap = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) overlap++;
  }
  const union = new Set([...tokensA, ...tokensB]).size;
  const score = union > 0 ? Math.round((overlap / union) * 100) : 0;
  return {
    matched: score >= 80,
    score,
  };
}

export function evaluateCccdQrConsistency(
  submittedNationalId: string,
  submittedFullName: string,
  qr?: CccdQrParsedPayload | null
): { status: 'MATCHED' | 'MISMATCHED' | 'NOT_DETECTED'; notes: string } {
  if (!qr || !qr.cccd) {
    return {
      status: 'NOT_DETECTED',
      notes: 'Chưa đọc được mã QR từ ảnh mặt trước CCCD (cần Admin đối soát ảnh thủ công).',
    };
  }
  const idMatch = qr.cccd.replace(/\s+/g, '') === submittedNationalId.replace(/\s+/g, '');
  const nameCompare = compareVietnameseAccountNames(qr.fullName || '', submittedFullName);
  if (idMatch && nameCompare.matched) {
    return {
      status: 'MATCHED',
      notes: `QR CCCD khớp 100% số định danh và họ tên (${qr.fullName}).`,
    };
  }
  return {
    status: 'MISMATCHED',
    notes: `QR CCCD không khớp hồ sơ nhập tay (QR: ${qr.cccd} / ${qr.fullName || 'N/A'}).`,
  };
}

