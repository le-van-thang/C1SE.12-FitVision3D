import { getAccessToken, setAccessToken, authApi } from './authApi';
import type { FashionProduct, Order, OrderStatus } from '@/features/ecommerce/types';

const COMMERCE_API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL
  ? `${import.meta.env.VITE_BACKEND_API_URL}/api/v1/commerce`
  : 'http://localhost:5000/api/v1/commerce';

export interface ApiEnvelope<T = any> {
  success: boolean;
  data: T | null;
  error?: { code: string; message: string } | null;
}

async function commerceRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiEnvelope<T>> {
  const url = `${COMMERCE_API_BASE_URL}${endpoint}`;
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    let res = await fetch(url, { ...options, headers, credentials: 'include' });

    if (res.status === 401 && !endpoint.includes('/refresh')) {
      const refreshRes = await authApi.refreshToken();
      if (refreshRes.success && refreshRes.data?.accessToken) {
        setAccessToken(refreshRes.data.accessToken);
        headers['Authorization'] = `Bearer ${refreshRes.data.accessToken}`;
        res = await fetch(url, { ...options, headers, credentials: 'include' });
      }
    }

    const json = await res.json();
    return json as ApiEnvelope<T>;
  } catch (err: any) {
    return {
      success: false,
      data: null,
      error: { code: 'NETWORK_ERROR', message: err?.message || 'Network error' },
    };
  }
}

export interface DbPlatformSettings {
  id: string;
  marquee_enabled: boolean;
  marquee_items_vi: string[];
  marquee_items_en: string[];
  hero_badge_vi: string;
  hero_title_vi: string;
  hero_highlight_vi: string;
}

export interface DbVoucher {
  code: string;
  discount_type: 'fixed' | 'percent';
  discount_value: number;
  title_vi: string;
  title_en: string;
  sub_vi: string;
  sub_en: string;
  is_active: boolean;
  show_on_storefront: boolean;
}

export interface DbProduct extends FashionProduct {
  is_hidden?: boolean;
  shop_id?: string | null;
  is_mall?: boolean;
  video_url?: string | null;
}

export interface DbProductReview {
  id: number;
  product_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  is_verified_purchase: boolean;
  shop_reply?: string | null;
  created_at: string;
}

export interface DbShopReview extends DbProductReview {
  product_name?: string;
}

export interface ShopReputationSummary {
  ratingAvg: number;
  ratingCount: number;
  responseRate: number;
  activeProductsCount: number;
  tier: 'MALL' | 'PREFERRED' | 'REGULAR';
}

export interface DbShopProfile {
  id: string;
  owner_id: string;
  shop_name: string;
  brand_slug?: string | null;
  phone_number: string;
  contact_email?: string | null;
  shop_address: string;
  pickup_address?: string | null;
  return_address?: string | null;
  return_same_as_pickup?: boolean;
  entity_type?: 'INDIVIDUAL' | 'HOUSEHOLD' | 'ENTERPRISE';
  tax_code?: string | null;
  tax_status?: string | null;
  legal_representative_name?: string | null;
  national_id_last4?: string | null;
  business_license_no?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | string;
  rejection_reason?: string | null;
  is_verified: boolean;
  is_mall: boolean;
  operational_mode?: 'ACTIVE' | 'VACATION';
  vacation_note?: string | null;
  vacation_until?: string | null;
  prep_time_days?: string | null;
  banner_url?: string | null;
  logo_url?: string | null;
  tagline?: string | null;
  description?: string | null;
  quick_reply_template?: string | null;
  notify_new_order_email?: boolean;
  notify_low_stock_email?: boolean;
  size_specs?: Record<string, any[]> | null;
  created_at?: string;
}

export interface DbShopBankAccount {
  id: string;
  bank_code: string;
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  name_match_score: number;
  verification_status: string;
}

export interface PublicStorefrontResponse {
  shop: DbShopProfile;
  reputation: ShopReputationSummary;
  products: DbProduct[];
  reviews: DbShopReview[];
}

export interface DbMembershipLog {
  id: number;
  action_type: string;
  points_delta: number;
  description: string;
  created_at: string;
}

export interface DbMembershipWallet {
  userId: string;
  totalSpend: number;
  tierId: 'member' | 'silver' | 'gold' | 'vip';
  spendPoints: number;
  bonusPoints: number;
  spentPoints: number;
  availablePoints: number;
  unlockedCodes: string[];
  lastCheckInDate: string | null;
  logs: DbMembershipLog[];
}

export const commerceApi = {
  getBootstrap(includeHidden = false) {
    return commerceRequest<{
      settings: DbPlatformSettings | null;
      vouchers: DbVoucher[];
      products: DbProduct[];
    }>(`/bootstrap${includeHidden ? '?includeHidden=1' : ''}`);
  },

  getOrders() {
    return commerceRequest<Order[]>('/orders');
  },

  createOrder(order: Order) {
    return commerceRequest<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  },

  updateOrderStatus(orderId: string, status: OrderStatus) {
    return commerceRequest<Order>(`/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  markOrderPaid(orderId: string) {
    return commerceRequest<Order>(`/orders/${encodeURIComponent(orderId)}/pay`, {
      method: 'PATCH',
    });
  },

  saveSettings(payload: {
    marqueeEnabled: boolean;
    marqueeItemsVi: string[];
    marqueeItemsEn?: string[];
    heroBadgeVi: string;
    heroTitleVi: string;
    heroHighlightVi: string;
  }) {
    return commerceRequest<DbPlatformSettings>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  createVoucher(payload: {
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
    return commerceRequest<DbVoucher>('/admin/vouchers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateVoucher(code: string, patch: { active?: boolean; showOnStorefront?: boolean }) {
    return commerceRequest<DbVoucher>(`/admin/vouchers/${encodeURIComponent(code)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  },

  deleteVoucher(code: string) {
    return commerceRequest<{ deleted: boolean; code: string }>(
      `/admin/vouchers/${encodeURIComponent(code)}`,
      { method: 'DELETE' }
    );
  },

  moderateProduct(id: string, patch: { isHidden?: boolean; salePrice?: number | null }) {
    return commerceRequest<DbProduct>(`/admin/products/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  },

  getMembership() {
    return commerceRequest<DbMembershipWallet>('/membership');
  },

  checkInMembership() {
    return commerceRequest<{ alreadyCheckedIn: boolean; wallet: DbMembershipWallet }>(
      '/membership/check-in',
      { method: 'POST' }
    );
  },

  redeemMembershipVoucher(code: string) {
    return commerceRequest<{ alreadyUnlocked: boolean; wallet: DbMembershipWallet }>(
      '/membership/redeem',
      { method: 'POST', body: JSON.stringify({ code }) }
    );
  },

  getPublicStores() {
    return commerceRequest<Array<DbShopProfile & { reputation: ShopReputationSummary }>>('/stores');
  },

  getPublicStorefront(slug: string) {
    return commerceRequest<PublicStorefrontResponse>(`/stores/${encodeURIComponent(slug)}`);
  },

  getShopDashboard() {
    return commerceRequest<{
      shop: DbShopProfile | null;
      documents?: Array<{
        id: string;
        doc_type: string;
        file_url: string;
        file_name?: string;
        qr_parsed_payload?: any;
        verification_status: string;
        reviewer_note?: string;
      }>;
      bankAccount?: {
        id: string;
        bank_code: string;
        bank_name: string;
        account_number: string;
        account_holder_name: string;
        name_match_score: number;
        verification_status: string;
      } | null;
      reputation?: ShopReputationSummary | null;
      products: DbProduct[];
      orders: Order[];
      reviews?: DbShopReview[];
    }>('/shop/dashboard');
  },

  updateShopProfile(payload: {
    shopName?: string;
    phoneNumber?: string;
    contactEmail?: string | null;
    shopAddress?: string;
    pickupAddress?: string;
    returnAddress?: string;
    returnSameAsPickup?: boolean;
    tagline?: string;
    description?: string;
    bannerUrl?: string | null;
    logoUrl?: string | null;
    operationalMode?: 'ACTIVE' | 'VACATION';
    vacationNote?: string;
    vacationUntil?: string | null;
    prepTimeDays?: string;
    quickReplyTemplate?: string | null;
    notifyNewOrderEmail?: boolean;
    notifyLowStockEmail?: boolean;
    sizeSpecs?: Record<string, any[]> | null;
  }) {
    return commerceRequest<DbShopProfile>('/shop/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  updateShopBankAccount(payload: {
    bankCode: string;
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
    currentPassword: string;
  }) {
    return commerceRequest<DbShopBankAccount>('/shop/bank-account', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  createShopProduct(payload: {
    name: string;
    category: 'shirt' | 'polo' | 'pants' | 'dress' | 'tailored';
    genderTarget: 'male' | 'female' | 'unisex';
    price: number;
    salePrice?: number | null;
    isBespoke?: boolean;
    fabricMaterial: string;
    stretchType: string;
    imageUrl: string;
    videoUrl?: string;
    description: string;
    colorName?: string;
    colorHex?: string;
    colorVariants?: { colorName: string; colorHex: string; imageUrl?: string }[];
    sizes?: ('XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL')[];
    stockMap?: Record<string, number>;
  }) {
    return commerceRequest<DbProduct>('/shop/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  suggestShopProductDescription(payload: {
    name: string;
    category: string;
    genderTarget: string;
    fabricMaterial: string;
    stretchType: string;
    colors: string[];
    sizes: string[];
    hasVideo?: boolean;
    visualTone?: { dominantColor?: string; brightness?: string };
  }) {
    return commerceRequest<{ description: string }>('/shop/suggest-description', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateShopProduct(
    id: string,
    patch: {
      isHidden?: boolean;
      salePrice?: number | null;
      name?: string;
      category?: 'shirt' | 'polo' | 'pants' | 'dress' | 'tailored';
      genderTarget?: 'male' | 'female' | 'unisex';
      price?: number;
      isBespoke?: boolean;
      fabricMaterial?: string;
      stretchType?: string;
      imageUrl?: string;
      videoUrl?: string | null;
      description?: string;
      colorVariants?: { colorName: string; colorHex: string; imageUrl?: string }[];
      sizes?: ('XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL')[];
      stockMap?: Record<string, number>;
    }
  ) {
    return commerceRequest<DbProduct>(`/shop/products/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  },

  deleteShopProduct(id: string) {
    return commerceRequest<{ deleted: boolean; id: string }>(
      `/shop/products/${encodeURIComponent(id)}`,
      { method: 'DELETE' }
    );
  },

  getProductReviews(productId: string) {
    return commerceRequest<DbProductReview[]>(`/products/${encodeURIComponent(productId)}/reviews`);
  },

  createProductReview(productId: string, payload: { rating: number; comment: string; userName?: string }) {
    return commerceRequest<{ review: DbProductReview; rating: number; reviews_count: number }>(
      `/products/${encodeURIComponent(productId)}/reviews`,
      { method: 'POST', body: JSON.stringify(payload) }
    );
  },

  replyProductReview(reviewId: number, reply: string) {
    return commerceRequest<DbProductReview>(`/reviews/${reviewId}/reply`, {
      method: 'PATCH',
      body: JSON.stringify({ reply }),
    });
  },
};
