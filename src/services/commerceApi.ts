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

export interface PayPalPublicConfig {
  configured: boolean;
  mode: 'sandbox' | 'live';
  clientId: string;
  vndRate: number;
  platformFeeRate: number;
  holdDays: number;
}

export interface ShopOrderLedgerItem {
  orderId: string;
  shopId: string | null;
  storeName: string;
  grossVnd: number;
  exchangeRateVnd: number;
  grossUsd: number;
  paypalFeeUsd: number;
  paypalFeeVnd: number;
  platformFeeRate: number;
  platformFeeVnd: number;
  netPayoutVnd: number;
  netPayoutUsd: number;
  orderStatus: string;
  payoutStatus: string;
  paypalCaptureId?: string | null;
  completedAt?: string | null;
  eligibleForPayout: boolean;
  ineligibleReason: string | null;
  eligibleAt: string | null;
  itemsCount: number;
  itemsSummary: Array<{ name: string; size: string; qty: number; unitPriceVnd: number }>;
  createdAt: string;
}

export interface ShopPayoutBatchRecord {
  id: string;
  shop_id: string;
  shop_name: string;
  recipient_paypal_email: string;
  order_ids: string[];
  exchange_rate_vnd: number;
  platform_fee_rate: number;
  gross_vnd: number;
  paypal_fee_vnd: number;
  platform_fee_vnd: number;
  net_payout_vnd: number;
  net_payout_usd: number;
  paypal_payout_batch_id: string | null;
  paypal_payout_item_id: string | null;
  status: string;
  note?: string;
  created_at: string;
  paid_at?: string | null;
}

export interface ShopPayoutLedgerResponse {
  shop: {
    id: string;
    shopName: string;
    status: string;
    paypalPayoutEmail: string | null;
  };
  policy: {
    exchangeRateVnd: number;
    platformFeeRate: number;
    holdDays: number;
    mode: 'sandbox' | 'live';
  };
  summary: {
    readyVnd: number;
    readyUsd: number;
    escrowHoldVnd: number;
    paidOutVnd: number;
    totalPlatformFeeVnd: number;
    totalPaypalFeeVnd: number;
  };
  orderLedgers: ShopOrderLedgerItem[];
  payoutBatches: ShopPayoutBatchRecord[];
}

export interface AdminPayoutOverviewResponse {
  policy: PayPalPublicConfig;
  summary: {
    totalEscrowHoldVnd: number;
    totalReadyDisburseVnd: number;
    totalPlatformCommissionVnd: number;
    totalPaidOutVnd: number;
  };
  shops: Array<{
    shop: DbShopProfile;
    readyOrders: any[];
    holdingOrders: any[];
    paidOutOrders: any[];
    readyNetVnd: number;
    readyNetUsd: number;
    holdingNetVnd: number;
    paidOutNetVnd: number;
    platformCommissionVnd: number;
  }>;
  payoutHistory: ShopPayoutBatchRecord[];
}

export interface DbShopProfile {
  id: string;
  owner_id: string;
  shop_name: string;
  brand_slug?: string | null;
  phone_number: string;
  shop_address: string;
  paypal_payout_email?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | string;
  rejection_reason?: string | null;
  is_verified: boolean;
  is_mall: boolean;
  operational_mode?: 'ACTIVE' | 'VACATION';
  vacation_note?: string | null;
  vacation_until?: string | null;
  banner_url?: string | null;
  logo_url?: string | null;
  tagline?: string | null;
  description?: string | null;
  created_at?: string;
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
      paypal?: PayPalPublicConfig;
    }>(`/bootstrap${includeHidden ? '?includeHidden=1' : ''}`);
  },

  getPayPalConfig() {
    return commerceRequest<PayPalPublicConfig>('/paypal/config');
  },

  createPayPalOrder(payload: {
    customer_name: string;
    recipient: any;
    items: any[];
    coupon_code?: string;
    estimated_delivery?: string;
    measurement_snapshot?: any;
  }) {
    return commerceRequest<{
      paypalOrderId: string;
      approveUrl: string | null;
      paymentGroupId: string;
      totalVnd: number;
      totalUsd: number;
      exchangeRateVnd: number;
      orders: Order[];
    }>('/paypal/create-order', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  capturePayPalOrder(paypalOrderId: string) {
    return commerceRequest<{
      alreadyPaid: boolean;
      paypalOrderId: string;
      captureId: string;
      grossUsd?: number;
      paypalFeeUsd?: number;
      payerEmail?: string | null;
      orders: Order[];
    }>('/paypal/capture-order', {
      method: 'POST',
      body: JSON.stringify({ paypalOrderId }),
    });
  },

  cancelPendingPayPalOrder(paypalOrderId: string) {
    return commerceRequest<{ cancelledIds: string[] }>('/paypal/cancel-pending', {
      method: 'POST',
      body: JSON.stringify({ paypalOrderId }),
    });
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
      reputation?: ShopReputationSummary | null;
      products: DbProduct[];
      orders: Order[];
      reviews?: DbShopReview[];
    }>('/shop/dashboard');
  },

  getShopPayouts() {
    return commerceRequest<ShopPayoutLedgerResponse>('/shop/payouts');
  },

  updateShopPayPalAccount(paypalPayoutEmail: string) {
    return commerceRequest<{ id: string; shop_name: string; paypal_payout_email: string }>(
      '/shop/paypal-account',
      {
        method: 'PUT',
        body: JSON.stringify({ paypalPayoutEmail }),
      }
    );
  },

  getAdminPayouts() {
    return commerceRequest<AdminPayoutOverviewResponse>('/admin/payouts');
  },

  disburseAdminPayouts(shopIds?: string[]) {
    return commerceRequest<{
      batchId: string;
      batchStatus: string;
      payouts: ShopPayoutBatchRecord[];
    }>('/admin/payouts/disburse', {
      method: 'POST',
      body: JSON.stringify({ shopIds }),
    });
  },

  syncAdminPayoutBatch(payoutId: string) {
    return commerceRequest<ShopPayoutBatchRecord>(
      `/admin/payouts/${encodeURIComponent(payoutId)}/sync`,
      { method: 'POST' }
    );
  },

  updateShopProfile(payload: {
    shopName: string;
    phoneNumber: string;
    shopAddress: string;
    paypalPayoutEmail?: string;
    tagline?: string;
    description?: string;
    bannerUrl?: string;
    logoUrl?: string;
    operationalMode?: 'ACTIVE' | 'VACATION';
    vacationNote?: string;
    vacationUntil?: string | null;
  }) {
    return commerceRequest<DbShopProfile>('/shop/profile', {
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

  updateShopProduct(id: string, patch: { isHidden?: boolean; salePrice?: number | null }) {
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
