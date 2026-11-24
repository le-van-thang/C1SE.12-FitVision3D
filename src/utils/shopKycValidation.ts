import jsQR from 'jsqr';

export type ShopEntityType = 'INDIVIDUAL' | 'HOUSEHOLD' | 'ENTERPRISE';

export const VIETNAM_CCCD_PROVINCE_CODES: Record<string, string> = {
  '001': 'Hà Nội', '002': 'Hà Giang', '004': 'Cao Bằng', '006': 'Bắc Kạn',
  '008': 'Tuyên Quang', '010': 'Lào Cai', '011': 'Điện Biên', '012': 'Lai Châu',
  '014': 'Sơn La', '015': 'Yên Bái', '017': 'Hòa Bình', '019': 'Thái Nguyên',
  '020': 'Lạng Sơn', '022': 'Quảng Ninh', '024': 'Bắc Giang', '025': 'Phú Thọ',
  '026': 'Vĩnh Phúc', '027': 'Bắc Ninh', '030': 'Hải Dương', '031': 'Hải Phòng',
  '033': 'Hưng Yên', '034': 'Thái Bình', '035': 'Hà Nam', '036': 'Nam Định',
  '037': 'Ninh Bình', '038': 'Thanh Hóa', '040': 'Nghệ An', '042': 'Hà Tĩnh',
  '044': 'Quảng Bình', '045': 'Quảng Trị', '046': 'Thừa Thiên Huế', '048': 'Đà Nẵng',
  '049': 'Quảng Nam', '051': 'Quảng Ngãi', '052': 'Bình Định', '054': 'Phú Yên',
  '056': 'Khánh Hòa', '058': 'Ninh Thuận', '060': 'Bình Thuận', '062': 'Kon Tum',
  '064': 'Gia Lai', '066': 'Đắk Lắk', '067': 'Đắk Nông', '068': 'Lâm Đồng',
  '070': 'Bình Phước', '072': 'Tây Ninh', '074': 'Bình Dương', '075': 'Đồng Nai',
  '077': 'Bà Rịa - Vũng Tàu', '079': 'TP. Hồ Chí Minh', '080': 'Long An', '082': 'Tiền Giang',
  '083': 'Bến Tre', '084': 'Trà Vinh', '086': 'Vĩnh Long', '087': 'Đồng Tháp',
  '089': 'An Giang', '091': 'Kiên Giang', '092': 'Cần Thơ', '093': 'Hậu Giang',
  '094': 'Sóc Trăng', '095': 'Bạc Liêu', '096': 'Cà Mau',
};

export const TAX_CODE_REGEX = /^([0-9]{10}|[0-9]{12}|[0-9]{10}-[0-9]{3}|[0-9]{10}-888|[0-9]{12}-888)$/;
export const CCCD_REGEX = /^[0-9]{12}$/;

export function validateVietnamCCCD(cccdRaw: string): {
  valid: boolean;
  provinceName?: string;
  birthYear?: number;
  gender?: 'MALE' | 'FEMALE';
  reason?: string;
} {
  const cccd = String(cccdRaw || '').replace(/\s+/g, '');
  if (!CCCD_REGEX.test(cccd)) {
    return { valid: false, reason: 'Số CCCD gắn chip phải gồm đúng 12 chữ số.' };
  }
  if (/^(\d)\1{11}$/.test(cccd) || cccd === '012345678901' || cccd === '123456789012') {
    return { valid: false, reason: 'Số CCCD không hợp lệ (chuỗi số lặp hoặc tuần tự giả mạo).' };
  }
  const provinceCode = cccd.slice(0, 3);
  const provinceName = VIETNAM_CCCD_PROVINCE_CODES[provinceCode];
  if (!provinceName) {
    return {
      valid: false,
      reason: `Mã tỉnh/TP "${provinceCode}" trong CCCD không thuộc danh mục 63 tỉnh/TP Việt Nam.`,
    };
  }
  const centuryGenderDigit = parseInt(cccd.charAt(3), 10);
  const yearSuffix = parseInt(cccd.slice(4, 6), 10);
  const birthYear = 1900 + Math.floor(centuryGenderDigit / 2) * 100 + yearSuffix;
  const age = new Date().getFullYear() - birthYear;
  if (birthYear > new Date().getFullYear() || age < 18 || age > 105) {
    return { valid: false, reason: `Năm sinh suy ra (${birthYear}) không hợp lệ hoặc chưa đủ 18 tuổi.` };
  }
  return {
    valid: true,
    provinceName,
    birthYear,
    gender: centuryGenderDigit % 2 === 0 ? 'MALE' : 'FEMALE',
  };
}

export function isValidMst10Checksum(mst10: string): boolean {
  if (!/^\d{10}$/.test(mst10) || /^(\d)\1{9}$/.test(mst10)) return false;
  const weights = [31, 29, 23, 19, 17, 13, 7, 5, 3];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(mst10.charAt(i), 10) * weights[i];
  }
  const checkDigit = (10 - (sum % 11)) % 11;
  if (checkDigit === 10) return false;
  return checkDigit === parseInt(mst10.charAt(9), 10);
}

export function validateVietnamTaxCode(taxRaw: string): {
  valid: boolean;
  normalized: string;
  kind?: string;
  reason?: string;
} {
  const normalized = String(taxRaw || '').replace(/\s+/g, '').toUpperCase();
  if (!TAX_CODE_REGEX.test(normalized)) {
    return {
      valid: false,
      normalized,
      reason: 'Mã số thuế không đúng chuẩn VN (10 số, 12 số CCCD, 10-xxx, hoặc hậu tố -888).',
    };
  }
  if (normalized.endsWith('-888')) {
    const base = normalized.slice(0, -4);
    const ok = base.length === 10 ? isValidMst10Checksum(base) : validateVietnamCCCD(base).valid;
    return ok
      ? { valid: true, normalized, kind: 'ECOMMERCE_888' }
      : { valid: false, normalized, reason: 'Mã số thuế TMĐT (-888) không hợp lệ theo Checksum/CCCD gốc.' };
  }
  if (normalized.includes('-')) {
    const [base, branch] = normalized.split('-');
    if (branch === '000' || !isValidMst10Checksum(base)) {
      return { valid: false, normalized, reason: 'Mã số thuế chi nhánh sai Checksum Mod-11.' };
    }
    return { valid: true, normalized, kind: 'BRANCH_13' };
  }
  if (normalized.length === 12) {
    const check = validateVietnamCCCD(normalized);
    return check.valid
      ? { valid: true, normalized, kind: 'PERSONAL_CCCD_12' }
      : { valid: false, normalized, reason: check.reason };
  }
  if (!isValidMst10Checksum(normalized)) {
    return { valid: false, normalized, reason: 'Mã số thuế 10 số sai chữ số kiểm tra (Mod-11).' };
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

export function compareVietnameseAccountNames(accountHolderName: string, legalName: string): {
  matched: boolean;
  score: number;
} {
  const a = normalizeVietnameseText(accountHolderName);
  const b = normalizeVietnameseText(legalName);
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
  return { matched: score >= 80, score };
}

export interface CccdQrParsedPayload {
  cccd?: string;
  oldCmnd?: string;
  fullName?: string;
  dob?: string;
  gender?: string;
  address?: string;
  issueDate?: string;
}

/**
 * Tier 2: Decode Vietnam Chip CCCD Front QR code locally via jsQR
 */
export async function decodeCccdQrFromDataUrl(dataUrl: string): Promise<CccdQrParsedPayload | null> {
  if (!dataUrl.startsWith('data:image/')) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const maxDim = 1400;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Scan full image first, then top-right quadrant (where Vietnam CCCD QR sits)
        const regions = [
          { x: 0, y: 0, w: canvas.width, h: canvas.height },
          {
            x: Math.floor(canvas.width * 0.55),
            y: 0,
            w: Math.ceil(canvas.width * 0.45),
            h: Math.ceil(canvas.height * 0.55),
          },
        ];

        for (const r of regions) {
          const imgData = ctx.getImageData(r.x, r.y, r.w, r.h);
          const decoded = jsQR(imgData.data, imgData.width, imgData.height);
          if (decoded?.data && decoded.data.includes('|')) {
            const parts = decoded.data.split('|').map((s) => s.trim());
            if (parts.length >= 3 && /^\d{12}$/.test(parts[0])) {
              resolve({
                cccd: parts[0],
                oldCmnd: parts[1] || undefined,
                fullName: parts[2] || undefined,
                dob: parts[3] || undefined,
                gender: parts[4] || undefined,
                address: parts[5] || undefined,
                issueDate: parts[6] || undefined,
              });
              return;
            }
          }
        }
        resolve(null);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

export const VIETNAM_BANKS = [
  { code: 'VCB', name: 'Vietcombank' },
  { code: 'TCB', name: 'Techcombank' },
  { code: 'MB', name: 'MB Bank' },
  { code: 'BIDV', name: 'BIDV' },
  { code: 'ICB', name: 'VietinBank' },
  { code: 'ACB', name: 'ACB' },
  { code: 'VPB', name: 'VPBank' },
  { code: 'TPB', name: 'TPBank' },
  { code: 'STB', name: 'Sacombank' },
  { code: 'VIB', name: 'VIB' },
  { code: 'MSB', name: 'MSB' },
];

