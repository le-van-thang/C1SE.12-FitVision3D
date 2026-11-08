/**
 * FitVision 3D - Auth API Client
 * Kết nối trực tiếp vào Backend Service (http://localhost:5000/api/v1/auth)
 */

const API_BASE_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:5000/api/v1/auth';

let inMemoryAccessToken: string | null = null;

export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token;
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: any[];
  } | null;
  timestamp: string;
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const currentLocale = typeof window !== 'undefined' ? (localStorage.getItem('fv3d_locale_preference') || 'vi') : 'vi';
  const headers: Record<string, string> = {
    'Accept-Language': currentLocale,
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (inMemoryAccessToken) {
    headers['Authorization'] = `Bearer ${inMemoryAccessToken}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // BẮT BUỘC: Nhận và gửi HttpOnly Cookie RefreshToken
    });

    // Handle token expired (401) by attempting silent refresh
    if (res.status === 401 && endpoint !== '/login' && endpoint !== '/refresh-token' && endpoint !== '/register') {
      const refreshed = await authApi.refreshToken();
      if (refreshed.success && refreshed.data?.accessToken) {
        setAccessToken(refreshed.data.accessToken);
        headers['Authorization'] = `Bearer ${refreshed.data.accessToken}`;
        // Retry original request once
        const retryRes = await fetch(url, { ...options, headers, credentials: 'include' });
        return await retryRes.json();
      }
    }

    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      data: null,
      error: {
        code: 'NETWORK_ERROR',
        message: err.message || 'Không thể kết nối đến máy chủ xác thực (localhost:5000).',
      },
      timestamp: new Date().toISOString(),
    };
  }
}

export const authApi = {
  // 1. Đăng ký Khách Hàng
  async register(data: { fullName: string; email: string; password: string; confirmPassword?: string; extraNotes?: string }) {
    return request('/register', {
      method: 'POST',
      body: JSON.stringify({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword || data.password,
        termsAgreed: true,
        extraNotes: data.extraNotes || '',
      }),
    });
  },

  // 2. Đăng ký Chủ Shop
  async registerShop(data: {
    shopName: string;
    phoneNumber: string;
    shopAddress: string;
    fullName: string;
    email: string;
    password: string;
    taxCode?: string;
  }) {
    return request('/register-shop', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        confirmPassword: data.password,
        termsAgreed: true,
        extraNotes: '',
      }),
    });
  },

  // 3. Đăng nhập
  async login(email: string, password: string, rememberMe = true) {
    const res = await request<{
      accessToken: string;
      expiresIn: number;
      user: {
        id: string;
        email: string;
        fullName: string;
        role: 'USER' | 'SHOP_OWNER' | 'ADMIN';
        status: string;
      };
    }>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, rememberMe }),
    });

    if (res.success && res.data?.accessToken) {
      setAccessToken(res.data.accessToken);
    }
    return res;
  },

  // 4. Kích hoạt Email OTP
  async verifyEmail(email: string, otp: string) {
    return request('/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  // 5. Silent Refresh Token
  async refreshToken() {
    const res = await request<{ accessToken: string; expiresIn: number }>('/refresh-token', {
      method: 'POST',
    });
    if (res.success && res.data?.accessToken) {
      setAccessToken(res.data.accessToken);
    }
    return res;
  },

  // 6. Đăng xuất
  async logout() {
    const res = await request('/logout', { method: 'POST' });
    setAccessToken(null);
    return res;
  },

  // 7. Lấy Profile hiện tại (GET /me)
  async getProfile() {
    return request<{
      id: string;
      email: string;
      fullName: string;
      role: 'USER' | 'SHOP_OWNER' | 'ADMIN';
      status: string;
      createdAt: string;
    }>('/me', { method: 'GET' });
  },

  // 8. Quên mật khẩu
  async forgotPassword(email: string) {
    return request<{ message: string; devOtp?: string }>('/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // 9. Đặt lại mật khẩu
  async resetPassword(data: { email: string; otp: string; newPassword: string; confirmNewPassword?: string }) {
    return request<{ message: string }>('/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        otp: data.otp,
        newPassword: data.newPassword,
        confirmNewPassword: data.confirmNewPassword || data.newPassword,
      }),
    });
  },

  // 10. Đăng nhập với Google
  async googleLogin(data: { email?: string; fullName?: string; credential?: string; googleId?: string; avatarUrl?: string }) {
    const res = await request<{
      accessToken: string;
      expiresIn: number;
      user: {
        id: string;
        email: string;
        fullName: string;
        role: 'USER' | 'SHOP_OWNER' | 'ADMIN';
        status: string;
      };
    }>('/google', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (res.success && res.data?.accessToken) {
      setAccessToken(res.data.accessToken);
    }
    return res;
  },
};

