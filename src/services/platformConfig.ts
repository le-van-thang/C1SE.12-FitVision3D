import { commerceApi, type DbProduct } from './commerceApi';

export interface PlatformVoucher {
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  titleVi: string;
  titleEn: string;
  subVi: string;
  subEn: string;
  active: boolean;
  showOnStorefront: boolean;
}

export interface PlatformConfig {
  marqueeEnabled: boolean;
  marqueeItemsVi: string[];
  marqueeItemsEn: string[];
  heroBadgeVi: string;
  heroTitleVi: string;
  heroHighlightVi: string;
  hiddenProductIds: string[];
  priceOverrides: Record<string, number>;
  vouchers: PlatformVoucher[];
}

const STORAGE_KEY = 'fv3d_platform_config_v1';

export const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  marqueeEnabled: true,
  marqueeItemsVi: [
    'Đo Size Chuẩn Nhân Trắc Học ISO 8559',
    'Đổi sửa size vừa vặn miễn phí trong 14 ngày',
    'Freeship hỏa tốc đơn hàng từ 1.000.000₫',
    'Bảo mật ảnh xử lý tạm thời RAM 100%',
  ],
  marqueeItemsEn: [
    'ISO 8559-1 Anthropometric 3D Sizing',
    'Free 14-Day Fit Adjustment Guarantee',
    'Freeship Express Orders from 1,000,000₫',
    'Zero-Retention In-Memory Image Privacy 100%',
  ],
  heroBadgeVi: 'NỀN TẢNG THỜI TRANG MAY ĐO & ĐO SIZE 3D THẾ HỆ MỚI',
  heroTitleVi: 'Phong Cách May Đo',
  heroHighlightVi: 'Chuẩn Xác',
  hiddenProductIds: [],
  priceOverrides: {},
  vouchers: [
    {
      code: 'FITVISION50',
      discountType: 'fixed',
      discountValue: 50000,
      titleVi: 'Giảm 50.000₫ cho mọi đơn từ 600K',
      titleEn: '50,000₫ off orders from 600K',
      subVi: 'Áp dụng khi chọn size theo gợi ý AI ISO 8559',
      subEn: 'Applies with ISO 8559 AI size match',
      active: true,
      showOnStorefront: true,
    },
    {
      code: 'TAILOR100',
      discountType: 'fixed',
      discountValue: 100000,
      titleVi: 'Giảm 100.000₫ Bộ May Đo Bespoke',
      titleEn: '100,000₫ off Bespoke Sets',
      subVi: 'Dành riêng cho Blazer Linen & Đầm Lụa Mulberry',
      subEn: 'Valid for Linen Blazer & Mulberry Silk',
      active: true,
      showOnStorefront: true,
    },
    {
      code: 'FREESHIP3D',
      discountType: 'fixed',
      discountValue: 35000,
      titleVi: 'Freeship Hỏa Tốc + Đổi Size 14 Ngày',
      titleEn: 'Free Express + 14-Day Fit Swap',
      subVi: 'Miễn phí chỉnh sửa phom dáng tận nhà toàn quốc',
      subEn: 'Complimentary nationwide door-to-door adjustment',
      active: true,
      showOnStorefront: true,
    },
    {
      code: 'FITVISION10',
      discountType: 'percent',
      discountValue: 10,
      titleVi: 'Giảm 10% toàn bộ đơn hàng',
      titleEn: '10% Off Entire Order',
      subVi: 'Mã ưu đãi hội viên & chiến dịch đặc biệt',
      subEn: 'Member & special campaign voucher',
      active: true,
      showOnStorefront: false,
    },
    {
      code: 'CAPSTONE2026',
      discountType: 'fixed',
      discountValue: 100000,
      titleVi: 'Giảm 100.000₫ BST Atelier',
      titleEn: '100,000₫ Off Atelier Collection',
      subVi: 'Ưu đãi ra mắt nền tảng FitVision 3D',
      subEn: 'FitVision 3D platform launch privilege',
      active: true,
      showOnStorefront: false,
    },
    {
      code: 'FITMEMBER50',
      discountType: 'fixed',
      discountValue: 50000,
      titleVi: 'Ưu đãi Hội viên -50.000₫',
      titleEn: 'Member Reward -50,000₫',
      subVi: 'Quy đổi từ FitPoints trong Atelier Club',
      subEn: 'Redeemed from Atelier Club FitPoints',
      active: true,
      showOnStorefront: false,
    },
    {
      code: 'FITSILVER5',
      discountType: 'percent',
      discountValue: 5,
      titleVi: 'Đặc quyền Hội viên Bạc -5%',
      titleEn: 'Silver Member -5%',
      subVi: 'Dành cho khách hàng hạng Bạc trở lên',
      subEn: 'For Silver Atelier members and above',
      active: true,
      showOnStorefront: false,
    },
    {
      code: 'FITVIP150',
      discountType: 'fixed',
      discountValue: 150000,
      titleVi: 'Bespoke VIP -150.000₫',
      titleEn: 'Bespoke VIP -150,000₫',
      subVi: 'Mã giảm cao cấp dành cho trang phục may đo',
      subEn: 'Exclusive Bespoke tailoring privilege',
      active: true,
      showOnStorefront: false,
    },
  ],
};

export function loadPlatformConfig(): PlatformConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_PLATFORM_CONFIG,
        ...parsed,
        vouchers: Array.isArray(parsed.vouchers) && parsed.vouchers.length > 0
          ? parsed.vouchers
          : DEFAULT_PLATFORM_CONFIG.vouchers,
        hiddenProductIds: Array.isArray(parsed.hiddenProductIds) ? parsed.hiddenProductIds : [],
        priceOverrides: parsed.priceOverrides && typeof parsed.priceOverrides === 'object' ? parsed.priceOverrides : {},
        marqueeItemsVi: Array.isArray(parsed.marqueeItemsVi) && parsed.marqueeItemsVi.length > 0
          ? parsed.marqueeItemsVi
          : DEFAULT_PLATFORM_CONFIG.marqueeItemsVi,
      };
    }
  } catch {
    // ignore storage errors
  }
  return DEFAULT_PLATFORM_CONFIG;
}

export function savePlatformConfig(config: PlatformConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new Event('fv3d-platform-config-updated'));
  } catch {
    // ignore
  }
}

export function resetPlatformConfig(): PlatformConfig {
  savePlatformConfig(DEFAULT_PLATFORM_CONFIG);
  return DEFAULT_PLATFORM_CONFIG;
}

export async function syncPlatformConfigFromBackend(
  includeHidden = true
): Promise<{ config: PlatformConfig; products: DbProduct[] } | null> {
  const res = await commerceApi.getBootstrap(includeHidden);
  if (!res.success || !res.data) return null;

  const { settings, vouchers, products } = res.data;
  const hiddenProductIds = products.filter((p) => Boolean(p.is_hidden)).map((p) => p.id);
  const priceOverrides: Record<string, number> = {};
  products.forEach((p) => {
    if (p.sale_price && p.sale_price > 0) {
      priceOverrides[p.id] = p.sale_price;
    }
  });

  const mappedVouchers: PlatformVoucher[] = Array.isArray(vouchers)
    ? vouchers.map((v) => ({
        code: v.code,
        discountType: v.discount_type,
        discountValue: v.discount_value,
        titleVi: v.title_vi,
        titleEn: v.title_en,
        subVi: v.sub_vi || '',
        subEn: v.sub_en || '',
        active: Boolean(v.is_active),
        showOnStorefront: Boolean(v.show_on_storefront),
      }))
    : DEFAULT_PLATFORM_CONFIG.vouchers;

  const merged: PlatformConfig = {
    marqueeEnabled: settings ? Boolean(settings.marquee_enabled) : DEFAULT_PLATFORM_CONFIG.marqueeEnabled,
    marqueeItemsVi:
      settings && Array.isArray(settings.marquee_items_vi) && settings.marquee_items_vi.length > 0
        ? settings.marquee_items_vi
        : DEFAULT_PLATFORM_CONFIG.marqueeItemsVi,
    marqueeItemsEn:
      settings && Array.isArray(settings.marquee_items_en) && settings.marquee_items_en.length > 0
        ? settings.marquee_items_en
        : DEFAULT_PLATFORM_CONFIG.marqueeItemsEn,
    heroBadgeVi: settings?.hero_badge_vi || DEFAULT_PLATFORM_CONFIG.heroBadgeVi,
    heroTitleVi: settings?.hero_title_vi || DEFAULT_PLATFORM_CONFIG.heroTitleVi,
    heroHighlightVi: settings?.hero_highlight_vi || DEFAULT_PLATFORM_CONFIG.heroHighlightVi,
    hiddenProductIds,
    priceOverrides,
    vouchers: mappedVouchers.length > 0 ? mappedVouchers : DEFAULT_PLATFORM_CONFIG.vouchers,
  };

  savePlatformConfig(merged);
  return { config: merged, products };
}
