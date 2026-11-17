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

export interface DbShopProfile {
  id: string;
  owner_id: string;
  shop_name: string;
  phone_number: string;
  shop_address: string;
  status: string;
  is_verified: boolean;
  is_mall: boolean;
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

  getShopDashboard() {
    return commerceRequest<{
      shop: DbShopProfile | null;
      products: DbProduct[];
      orders: Order[];
    }>('/shop/dashboard');
  },

  createShopProduct(payload: {
    name: string;
    category: 'shirt' | 'polo' | 'pants' | 'dress' | 'tailored';
    genderTarget: 'male' | 'female' | 'unisex';
    price: number;
    salePrice?: number | null;
    fabricMaterial: string;
    stretchType: string;
    imageUrl: string;
    description: string;
    colorName?: string;
    colorHex?: string;
    stockMap?: { S: number; M: number; L: number; XL: number };
  }) {
    return commerceRequest<DbProduct>('/shop/products', {
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
