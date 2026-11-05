import { getAccessToken, setAccessToken, authApi } from './authApi';

const ADMIN_API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL 
  ? `${import.meta.env.VITE_BACKEND_API_URL}/api/v1/admin`
  : 'http://localhost:5000/api/v1/admin';

export interface AdminStats {
  totalUsers: number;
  totalStores: number;
  pendingStores: number;
  approvedStores: number;
  rejectedStores: number;
  totalMeasurements: number;
}

export interface AdminStoreItem {
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
  is_verified: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejection_reason?: string | null;
  approved_at?: string | null;
  created_at: string;
  updated_at: string;
  owner_name?: string;
  owner_email?: string;
  owner_role?: string;
}

export interface AdminUserItem {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  role: 'ADMIN' | 'SHOP_OWNER' | 'USER';
  status: 'PENDING_VERIFY' | 'PENDING_APPROVAL' | 'ACTIVE' | 'LOCKED' | 'BANNED';
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminAuditLogItem {
  id: string;
  user_id?: string;
  action_type: string;
  execution_time_ms: number;
  zero_retention_flag: boolean;
  ip_address_hash: string;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

export interface AdminApiResponse<T = any> {
  success: boolean;
  data: T | null;
  message?: string;
  error?: {
    code: string;
    message: string;
  } | null;
}

async function adminRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<AdminApiResponse<T>> {
  const url = `${ADMIN_API_BASE_URL}${endpoint}`;
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (res.status === 401) {
      // Refresh token if needed
      const refreshed = await authApi.refreshToken();
      if (refreshed.success && refreshed.data?.accessToken) {
        setAccessToken(refreshed.data.accessToken);
        headers['Authorization'] = `Bearer ${refreshed.data.accessToken}`;
        const retryRes = await fetch(url, { ...options, headers, credentials: 'include' });
        return await retryRes.json();
      }
    }

    return await res.json();
  } catch (err: any) {
    console.error(`[adminApi Error ${endpoint}]:`, err.message);
    return {
      success: false,
      data: null,
      error: {
        code: 'NETWORK_ERROR',
        message: err.message || 'Lỗi kết nối máy chủ máy chủ Admin.',
      },
    };
  }
}

export const adminApi = {
  /**
   * Lấy chỉ số tổng quan từ PostgreSQL
   */
  async getStats(): Promise<AdminApiResponse<AdminStats>> {
    return await adminRequest<AdminStats>('/stats');
  },

  /**
   * Lấy toàn bộ danh sách hồ sơ nhà may / cửa hàng thực tế từ PostgreSQL
   */
  async getStores(): Promise<AdminApiResponse<AdminStoreItem[]>> {
    return await adminRequest<AdminStoreItem[]>('/stores');
  },

  /**
   * Duyệt hồ sơ nhà may
   */
  async approveStore(storeId: string): Promise<AdminApiResponse<AdminStoreItem>> {
    return await adminRequest<AdminStoreItem>(`/stores/${storeId}/approve`, {
      method: 'POST',
    });
  },

  /**
   * Từ chối hồ sơ kèm lý do
   */
  async rejectStore(storeId: string, reason: string): Promise<AdminApiResponse<AdminStoreItem>> {
    return await adminRequest<AdminStoreItem>(`/stores/${storeId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  /**
   * Lấy danh sách toàn bộ người dùng thực tế từ PostgreSQL
   */
  async getUsers(): Promise<AdminApiResponse<AdminUserItem[]>> {
    return await adminRequest<AdminUserItem[]>('/users');
  },

  /**
   * Khóa / Mở khóa người dùng
   */
  async updateUserStatus(userId: string, status: string): Promise<AdminApiResponse<AdminUserItem>> {
    return await adminRequest<AdminUserItem>(`/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  /**
   * Thay đổi vai trò người dùng (USER, SHOP_OWNER, ADMIN)
   */
  async updateUserRole(userId: string, role: string): Promise<AdminApiResponse<AdminUserItem>> {
    return await adminRequest<AdminUserItem>(`/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  /**
   * Lấy nhật ký kiểm toán hệ thống
   */
  async getAuditLogs(limit = 50): Promise<AdminApiResponse<AdminAuditLogItem[]>> {
    return await adminRequest<AdminAuditLogItem[]>(`/audit-logs?limit=${limit}`);
  },

  /**
   * Người dùng nộp đơn mở cửa hàng vào PostgreSQL
   */
  async applyStore(payload: {
    shopName: string;
    phoneNumber: string;
    shopAddress: string;
    businessLicenseNo?: string;
  }): Promise<AdminApiResponse<AdminStoreItem>> {
    return await adminRequest<AdminStoreItem>('/stores/apply', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
