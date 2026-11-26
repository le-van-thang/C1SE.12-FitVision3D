// =============================================================================
// FITVISION 3D - USER SETTINGS & ADDRESS BOOK TYPES
// Tài khoản của tôi & Tuân thủ Zero-Image Retention
// =============================================================================

export type AddressType = 'home' | 'office' | 'other';

export interface UserAddress {
  id: string;
  recipientName: string;
  phone: string;
  city: string;
  district?: string;
  ward?: string;
  detailedAddress: string;
  label: AddressType;
  isDefault: boolean;
  createdAt: string;
}

export interface RefundBankAccount {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string; // Tên viết hoa không dấu
  isVerified?: boolean;
  linkedAt?: string;
}

export type EaseAllowanceType = 'slim' | 'regular' | 'relaxed';

export interface UserPreferences {
  emailOrderUpdates: boolean;
  emailPromotions: boolean;
  easeAllowancePreference: EaseAllowanceType;
}

export interface UserSessionInfo {
  id: string;
  device: string;
  browser: string;
  os: string;
  ipAddress: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface SupportedBank {
  code: string;
  shortName: string;
  name: string;
  bin: string;
}

export const VIETNAM_BANKS: SupportedBank[] = [
  { code: 'VCB', shortName: 'Vietcombank', name: 'Ngân hàng TMCP Ngoại thương Việt Nam', bin: '970436' },
  { code: 'MB', shortName: 'MBBank', name: 'Ngân hàng TMCP Quân Đội', bin: '970422' },
  { code: 'TCB', shortName: 'Techcombank', name: 'Ngân hàng TMCP Kỹ Thương Việt Nam', bin: '970407' },
  { code: 'BIDV', shortName: 'BIDV', name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam', bin: '970418' },
  { code: 'CTG', shortName: 'VietinBank', name: 'Ngân hàng TMCP Công Thương Việt Nam', bin: '970415' },
  { code: 'ACB', shortName: 'ACB', name: 'Ngân hàng TMCP Á Châu', bin: '970416' },
  { code: 'VPB', shortName: 'VPBank', name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng', bin: '970432' },
  { code: 'TPB', shortName: 'TPBank', name: 'Ngân hàng TMCP Tiên Phong', bin: '970423' },
  { code: 'STB', shortName: 'Sacombank', name: 'Ngân hàng TMCP Sài Gòn Thương Tín', bin: '970403' },
  { code: 'HDB', shortName: 'HDBank', name: 'Ngân hàng TMCP Phát triển TP.HCM', bin: '970437' },
  { code: 'VIB', shortName: 'VIB', name: 'Ngân hàng TMCP Quốc tế Việt Nam', bin: '970441' },
];
