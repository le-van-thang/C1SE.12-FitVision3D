import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Profile, Store, UserRole } from '@/types/database.types';
import { TEST_USERS, INITIAL_MOCK_STORES } from '@/data/mockData';
import {
  validateEmail,
  validatePhoneNumber,
  validatePassword,
  checkHoneypot,
  RateLimiter,
} from '@/lib/validationRules';
import { authApi } from '@/services/authApi';
import { adminApi } from '@/services/adminApi';
import { showGlobalToast } from '@/components/common/GlobalToastHost';
import { clearTransientStudioPrivacyState, wipeAllUser3DData } from '@/utils/bodyProfileStorage';
import { UserAddress, RefundBankAccount, UserPreferences } from '@/types/settings.types';

const STORAGE_KEY_PROFILES = 'fv3d_auth_profiles_v1';
const STORAGE_KEY_STORES = 'fv3d_auth_stores_v1';
const STORAGE_KEY_USER_ID = 'fv3d_auth_current_user_id_v1';

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  confirmPassword?: string;
  termsAgreed?: boolean;
  website_trap?: string;
}

export interface MerchantOnboardingPayload {
  brandName: string;
  phone: string;
  address: string;
  verificationDoc: string;
  website_trap?: string;
}

export interface UserProfileDetails {
  phone?: string;
  address?: string;
  city?: string;
  gender?: 'male' | 'female' | 'other';
  birth_date?: string;
  notes?: string;
  auth_provider?: 'google' | 'email';
  has_password?: boolean;
}

export interface AuthContextType {
  currentUser: Profile | null;
  currentStore: Store | null;
  stores: Store[];
  profiles: Profile[];
  isAuthenticated: boolean;
  userRole: UserRole | 'guest';

  // Modal Controls
  isAuthModalOpen: boolean;
  authModalTab: 'signin' | 'register' | 'forgot' | 'verify';
  isOnboardingModalOpen: boolean;
  isStatusModalOpen: boolean;

  openSignIn: () => void;
  openRegister: () => void;
  openForgotPassword: () => void;
  openVerifyEmail: (email?: string) => void;
  closeAuthModal: () => void;
  openOnboarding: () => void;
  closeOnboarding: () => void;
  openStatusModal: () => void;
  closeStatusModal: () => void;

  // Auth Operations
  signIn: (
    email: string,
    password?: string,
    website_trap?: string,
    adminOtp?: string
  ) => Promise<{ success: boolean; error?: string; errorCode?: string; requiresAdmin2fa?: boolean; message?: string }>;
  register: (payload: RegisterPayload) => Promise<{ success: boolean; error?: string; devOtp?: string; message?: string }>;
  signOut: () => Promise<void>;
  verifyEmail: (email: string, otp: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string; message?: string; devOtp?: string }>;
  resetPassword: (payload: { email: string; otp: string; newPassword: string; confirmPassword?: string }) => Promise<{ success: boolean; error?: string; message?: string }>;
  signInWithGoogle: (data: { accessToken?: string; email?: string; fullName?: string; credential?: string; avatarUrl?: string; googleId?: string; mode?: 'signin' | 'register' }) => Promise<{ success: boolean; error?: string; errorCode?: string }>;

  // Profile Management
  updateUserProfile: (data: { full_name?: string; avatar_url?: string } & UserProfileDetails) => Promise<{ success: boolean; error?: string }>;
  getUserProfileDetails: (userId?: string) => UserProfileDetails;

  // Sổ địa chỉ nhận hàng (Chuẩn Shopee)
  userAddresses: UserAddress[];
  defaultAddress: UserAddress | null;
  saveAddress: (address: Omit<UserAddress, 'id' | 'createdAt'> & { id?: string }) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;

  // Ngân hàng hoàn tiền
  refundBank: RefundBankAccount | null;
  saveRefundBank: (bank: RefundBankAccount) => void;
  deleteRefundBank: () => void;

  // Cài đặt thông báo & Quyền riêng tư 3D
  userPreferences: UserPreferences;
  updateUserPreferences: (prefs: Partial<UserPreferences>) => void;
  changePassword: (oldPassword: string | undefined, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  revokeAllSessions: () => Promise<{ success: boolean; error?: string }>;
  deleteMy3DData: () => Promise<{ success: boolean; error?: string }>;
  requestAccountLock: (reason?: string) => Promise<{ success: boolean; error?: string }>;

  // Merchant Onboarding & Admin
  applyMerchant: (payload: MerchantOnboardingPayload) => Promise<{ success: boolean; error?: string }>;
  approveStore: (storeId: string) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  rejectStore: (storeId: string, reason: string) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };

  // Demo Switcher
  switchDemoRole: (role: 'user' | 'pending' | 'store' | 'admin' | 'guest') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapBackendUserToProfile(u: { id: string; email: string; fullName?: string; role?: string; avatarUrl?: string; createdAt?: string }): Profile {
  const roleMap: Record<string, UserRole> = {
    ADMIN: 'admin',
    SHOP_OWNER: 'store',
    USER: 'user',
  };
  const isSuperAdminEmail = (u.email || '').toLowerCase() === 'levanthang0166@gmail.com' || (u.email || '').toLowerCase() === 'admin@fitvision3d.com';
  const resolvedRole = isSuperAdminEmail ? 'admin' : (u.role ? roleMap[u.role] : 'user') || 'user';
  return {
    id: u.id,
    full_name: u.fullName || u.email.split('@')[0],
    email: u.email,
    role: resolvedRole,
    avatar_url: u.avatarUrl || null,
    created_at: u.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function initProfiles(): Profile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILES);
    if (raw) {
      const list: Profile[] = JSON.parse(raw);
      return list.map((p) => {
        if (p.email?.toLowerCase() === 'levanthang0166@gmail.com' || p.email?.toLowerCase() === 'admin@fitvision3d.com') {
          return { ...p, role: 'admin' };
        }
        return p;
      });
    }
  } catch {
    // fallback
  }
  return Object.values(TEST_USERS);
}

function initStores(): Store[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STORES);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return [...INITIAL_MOCK_STORES];
}

function initCurrentUserId(): string | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_USER_ID);
    if (stored === 'guest') return null;
    if (stored) return stored;
  } catch {
    // fallback
  }
  return null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>(initProfiles);
  const [stores, setStores] = useState<Store[]>(initStores);
  const [currentUserId, setCurrentUserId] = useState<string | null>(initCurrentUserId);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'register' | 'forgot' | 'verify'>('signin');
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const syncMyStoreFromBackend = useCallback(async (userId: string) => {
    try {
      const myRes = await adminApi.getMyStore();
      if (myRes.success && myRes.data) {
        const dbShop = myRes.data;
        const mapped: Store = {
          id: dbShop.id,
          user_id: userId,
          brand_name: dbShop.shop_name,
          phone: dbShop.phone_number,
          address: dbShop.shop_address,
          verification_doc: dbShop.business_license_no || '',
          entity_type: dbShop.entity_type,
          tax_code: dbShop.tax_code,
          tax_status: dbShop.tax_status,
          status: dbShop.status,
          is_approved: dbShop.status === 'APPROVED',
          rejection_reason: dbShop.rejection_reason || null,
          created_at: dbShop.created_at,
          updated_at: dbShop.updated_at,
        };
        setStores((prev) => [mapped, ...prev.filter((s) => s.user_id !== userId && s.id !== mapped.id)]);
        return;
      }
    } catch {
      // ignore offline
    }
  }, []);

  // Initial Session Check from Backend (via silent refresh or cookie)
  useEffect(() => {
    let isMounted = true;
    async function checkSession() {
      try {
        const res = await authApi.getProfile();
        if (res.success && res.data && isMounted) {
          const prof = mapBackendUserToProfile(res.data);
          setProfiles((prev) => {
            const exists = prev.some((p) => p.id === prof.id);
            return exists ? prev.map((p) => (p.id === prof.id ? prof : p)) : [prof, ...prev];
          });
          setCurrentUserId(prof.id);
          await syncMyStoreFromBackend(prof.id);
        }
      } catch {
        // Not logged in with live backend session
      }
    }
    checkSession();
    return () => {
      isMounted = false;
    };
  }, [syncMyStoreFromBackend]);

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
    } catch {}
  }, [profiles]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STORES, JSON.stringify(stores));
    } catch {}
  }, [stores]);

  useEffect(() => {
    try {
      if (currentUserId) {
        localStorage.setItem(STORAGE_KEY_USER_ID, currentUserId);
      } else {
        localStorage.setItem(STORAGE_KEY_USER_ID, 'guest');
      }
    } catch {}
  }, [currentUserId]);

  const rawUser = profiles.find((p) => p.id === currentUserId) || null;
  const isSuperAdmin = (rawUser?.email || '').toLowerCase() === 'levanthang0166@gmail.com' || (rawUser?.email || '').toLowerCase() === 'admin@fitvision3d.com';
  const currentUser: Profile | null = rawUser
    ? {
        ...rawUser,
        role: isSuperAdmin ? 'admin' : rawUser.role,
      }
    : null;
  const currentStore = currentUser ? stores.find((s) => s.user_id === currentUser.id) || null : null;
  const isAuthenticated = Boolean(currentUser);
  const userRole: UserRole | 'guest' = currentUser ? currentUser.role : 'guest';

  // Modal open/close helpers
  const openSignIn = useCallback(() => {
    setAuthModalTab('signin');
    setIsAuthModalOpen(true);
  }, []);

  const openRegister = useCallback(() => {
    setAuthModalTab('register');
    setIsAuthModalOpen(true);
  }, []);

  const openForgotPassword = useCallback(() => {
    setAuthModalTab('forgot');
    setIsAuthModalOpen(true);
  }, []);

  const openVerifyEmail = useCallback((_email?: string) => {
    setAuthModalTab('verify');
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const openOnboarding = useCallback(() => {
    setIsOnboardingModalOpen(true);
  }, []);

  const closeOnboarding = useCallback(() => {
    setIsOnboardingModalOpen(false);
  }, []);

  const openStatusModal = useCallback(() => {
    setIsStatusModalOpen(true);
  }, []);

  const closeStatusModal = useCallback(() => {
    setIsStatusModalOpen(false);
  }, []);

  // 1. Sign In (Live Backend Call + Admin 2FA OTP Support)
  const signIn = useCallback(
    async (emailInput: string, passwordInput = '', website_trap = '', adminOtp?: string) => {
      if (checkHoneypot(website_trap)) {
        return { success: false, errorCode: 'BOT_DETECTED', error: 'Phát hiện hoạt động bot đáng ngờ (Honeypot Triggered).' };
      }

      const limit = RateLimiter.checkLimit('login', 5, 30);
      if (!limit.allowed) {
        return {
          success: false,
          errorCode: 'AUTH_RATE_LIMIT_EXCEEDED',
          error: limit.message || `Đăng nhập quá 5 lần cho phép. Vui lòng thử lại sau ${limit.waitSeconds || 30} giây.`,
        };
      }

      const email = emailInput.trim();
      const res = await authApi.login(email, passwordInput, true, adminOtp);

      if (res.success && res.data?.requiresAdmin2fa) {
        showGlobalToast({
          type: 'info',
          title: 'Yêu cầu xác thực 2 lớp Admin',
          message: res.data.message || 'Vui lòng nhập mã OTP 6 số vừa gửi về Gmail quản trị.',
        });
        return {
          success: false,
          requiresAdmin2fa: true,
          errorCode: 'ADMIN_2FA_REQUIRED',
          message: res.data.message,
        };
      }

      if (res.success && res.data?.user) {
        const profile = mapBackendUserToProfile(res.data.user);
        setProfiles((prev) => {
          const filtered = prev.filter((p) => p.id !== profile.id);
          return [profile, ...filtered];
        });
        setCurrentUserId(profile.id);
        setIsAuthModalOpen(false);
        syncMyStoreFromBackend(profile.id);
        showGlobalToast({
          type: 'success',
          title: 'Đăng nhập thành công!',
          message: `Chào mừng ${profile.full_name} quay lại FitVision 3D.`,
        });
        if (profile.role === 'admin') {
          navigate('/admin', { replace: true });
        } else if (profile.role === 'store') {
          navigate('/shop', { replace: true });
        }
        return { success: true };
      }

      if (res.error?.code === 'AUTH_EMAIL_NOT_VERIFIED') {
        return {
          success: false,
          errorCode: 'AUTH_EMAIL_NOT_VERIFIED',
          error: res.error.message || 'Tài khoản chưa được kích hoạt email.',
        };
      }

      return {
        success: false,
        errorCode: res.error?.code || 'NETWORK_ERROR',
        error:
          res.error?.message ||
          'Không thể kết nối máy chủ xác thực. Vui lòng kiểm tra kết nối và thử lại.',
      };
    },
    []
  );

  // 2. Register (Live Backend Call)
  const register = useCallback(
    async (payload: RegisterPayload) => {
      if (checkHoneypot(payload.website_trap)) {
        return { success: false, errorCode: 'BOT_DETECTED', error: 'Phát hiện bot tự động đăng ký (Honeypot Triggered).' };
      }

      const cleanFullName = (payload.fullName || '').trim();
      if (cleanFullName.length < 2) {
        return { success: false, errorCode: 'AUTH_NAME_REQUIRED', error: 'Họ và tên phải có tối thiểu 2 ký tự.' };
      }

      const passResult = validatePassword(payload.password);
      if (!passResult.valid) {
        return { success: false, errorCode: passResult.code || 'PASSWORD_COMPLEXITY_FAILED', error: passResult.error };
      }

      if (payload.confirmPassword !== undefined && payload.password !== payload.confirmPassword) {
        return { success: false, errorCode: 'AUTH_PASSWORD_MISMATCH', error: 'Mật khẩu xác nhận không trùng khớp với mật khẩu đã nhập.' };
      }

      const limit = RateLimiter.checkLimit('register', 5, 30);
      if (!limit.allowed) {
        return {
          success: false,
          errorCode: 'AUTH_RATE_LIMIT_EXCEEDED',
          error: limit.message || `Quá 5 lần đăng ký cho phép. Vui lòng đợi ${limit.waitSeconds || 30} giây trước khi thử lại.`,
        };
      }

      const res = await authApi.register({
        fullName: cleanFullName,
        email: payload.email.trim(),
        password: payload.password,
        confirmPassword: payload.confirmPassword,
        extraNotes: payload.website_trap,
      });

      if (res.success) {
        showGlobalToast({
          type: 'info',
          title: 'Đăng ký tài khoản thành công!',
          message: 'Vui lòng kiểm tra hộp thư Gmail để lấy mã OTP kích hoạt.',
        });
        return {
          success: true,
          message: res.data?.message || 'Đăng ký thành công! Hãy kiểm tra email để kích hoạt tài khoản.',
          devOtp: res.data?.devOtp,
        };
      }

      return {
        success: false,
        errorCode: res.error?.code,
        error: res.error?.message || 'Đăng ký thất bại. Vui lòng thử lại.',
      };
    },
    []
  );

  // 3. Verify Email OTP
  const verifyEmail = useCallback(async (email: string, otp: string) => {
    const res = await authApi.verifyEmail(email.trim(), otp.trim());
    if (res.success) {
      showGlobalToast({
        type: 'success',
        title: 'Xác thực email thành công!',
        message: 'Tài khoản đã được kích hoạt, bạn có thể đăng nhập ngay.',
      });
      return {
        success: true,
        message: res.data?.message || 'Kích hoạt tài khoản thành công! Bạn có thể đăng nhập ngay.',
      };
    }
    return {
      success: false,
      error: res.error?.message || 'Kích hoạt thất bại. Vui lòng kiểm tra lại mã OTP.',
    };
  }, []);

  // 4. Forgot Password
  const forgotPassword = useCallback(async (email: string) => {
    const res = await authApi.forgotPassword(email.trim());
    if (res.success) {
      return {
        success: true,
        message: res.data?.message || 'Đã gửi mã xác nhận đặt lại mật khẩu đến email.',
        devOtp: res.data?.devOtp,
      };
    }
    return {
      success: false,
      error: res.error?.message || 'Không thể gửi yêu cầu đặt lại mật khẩu.',
    };
  }, []);

  // 5. Reset Password
  const resetPassword = useCallback(
    async (payload: { email: string; otp: string; newPassword: string; confirmPassword?: string }) => {
      const passResult = validatePassword(payload.newPassword);
      if (!passResult.valid) {
        return { success: false, error: passResult.error };
      }
      if (payload.confirmPassword && payload.newPassword !== payload.confirmPassword) {
        return { success: false, error: 'Mật khẩu xác nhận không khớp.' };
      }

      const res = await authApi.resetPassword({
        email: payload.email.trim(),
        otp: payload.otp.trim(),
        newPassword: payload.newPassword,
        confirmNewPassword: payload.confirmPassword,
      });

      if (res.success) {
        showGlobalToast({
          type: 'success',
          title: 'Đặt lại mật khẩu thành công!',
          message: 'Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.',
        });
        return {
          success: true,
          message: res.data?.message || 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.',
        };
      }
      return {
        success: false,
        error: res.error?.message || 'Đặt lại mật khẩu thất bại. Vui lòng kiểm tra mã OTP.',
      };
    },
    []
  );

  // 6. Sign In With Google (Thực tế với xác thực token Google tại backend + khóa tài khoản ADMIN)
  const signInWithGoogle = useCallback(
    async (data: { accessToken?: string; email?: string; fullName?: string; credential?: string; avatarUrl?: string; googleId?: string; mode?: 'signin' | 'register' }) => {
      const res = await authApi.googleLogin(data);
      if (res.success && res.data?.user) {
        const prof = mapBackendUserToProfile(res.data.user);
        setProfiles((prev) => {
          const filtered = prev.filter((p) => p.id !== prof.id);
          return [prof, ...filtered];
        });
        setCurrentUserId(prof.id);
        setIsAuthModalOpen(false);
        syncMyStoreFromBackend(prof.id);
        showGlobalToast({
          type: 'success',
          title: data.mode === 'register' ? 'Đăng ký Google thành công!' : 'Đăng nhập Google thành công!',
          message: `Xin chào ${prof.full_name} · Chúc bạn trải nghiệm FitVision 3D.`,
        });
        if (prof.role === 'admin') {
          navigate('/admin');
        }
        return { success: true };
      }
      return {
        success: false,
        errorCode: res.error?.code,
        error: res.error?.message || 'Đăng nhập bằng Google thất bại.',
      };
    },
    []
  );

  // 7. Sign Out
  const signOut = useCallback(async () => {
    setCurrentUserId(null);
    clearTransientStudioPrivacyState();
    try {
      localStorage.setItem(STORAGE_KEY_USER_ID, 'guest');
    } catch {}
    showGlobalToast({
      type: 'info',
      title: 'Đã đăng xuất tài khoản',
      message: 'Phiên đăng nhập của bạn đã được kết thúc an toàn.',
    });
    try {
      await authApi.logout();
    } catch {}
  }, []);

  // 8. Merchant Onboarding (Apply for Store)
  const applyMerchant = useCallback(
    async (payload: MerchantOnboardingPayload): Promise<{ success: boolean; error?: string }> => {
      if (!currentUser) {
        return { success: false, error: 'Vui lòng đăng nhập trước khi nộp hồ sơ mở cửa hàng.' };
      }

      if (checkHoneypot(payload.website_trap)) {
        return { success: false, error: 'Phát hiện bot tự động (Honeypot Triggered).' };
      }

      const limit = RateLimiter.checkLimit('apply_store', 5, 30);
      if (!limit.allowed) {
        return {
          success: false,
          error: limit.message || `Bạn đã nộp hồ sơ quá 5 lần. Vui lòng chờ ${limit.waitSeconds || 30} giây trước khi thao tác tiếp.`,
        };
      }

      const brandName = (payload.brandName || '').trim();
      if (brandName.length < 3) {
        return { success: false, error: 'Tên thương hiệu/cửa hàng phải có ít nhất 3 ký tự.' };
      }

      const existingBrands = stores.map((s) => s.brand_name.toLowerCase());
      if (existingBrands.includes(brandName.toLowerCase())) {
        return { success: false, error: 'Tên thương hiệu này đã được sử dụng. Vui lòng chọn tên khác.' };
      }

      const existingPhones = stores.map((s) => s.phone);
      const phoneResult = validatePhoneNumber(payload.phone, existingPhones);
      if (!phoneResult.valid) {
        return { success: false, error: phoneResult.error };
      }

      const address = (payload.address || '').trim();
      if (address.length < 5) {
        return { success: false, error: 'Địa chỉ xưởng/cửa hàng phải có ít nhất 5 ký tự.' };
      }

      const verificationDoc = (payload.verificationDoc || '').trim();
      if (verificationDoc.length < 3) {
        return {
          success: false,
          error: 'Vui lòng cung cấp mã số GPKD, mã số thuế hoặc ảnh minh chứng giấy phép.',
        };
      }

      const existingStore = stores.find((s) => s.user_id === currentUser.id);
      const now = new Date().toISOString();

      if (existingStore) {
        if (existingStore.status === 'PENDING') {
          return {
            success: false,
            error: 'Bạn đã có hồ sơ đang chờ xét duyệt. Vui lòng đợi quản trị viên xử lý trong 24h.',
          };
        }
        if (existingStore.status === 'APPROVED') {
          return {
            success: false,
            error: 'Cửa hàng của bạn đã được phê duyệt.',
          };
        }
      }

      // Gửi đồng bộ trực tiếp vào cơ sở dữ liệu PostgreSQL (qua backend API)
      let dbStoreId: string | undefined;
      try {
        const apiRes = await adminApi.applyStore({
          shopName: brandName,
          phoneNumber: payload.phone.trim(),
          shopAddress: address,
          businessLicenseNo: verificationDoc,
        });
        if (!apiRes.success) {
          const errCode = apiRes.error?.code;
          if (errCode !== 'NETWORK_ERROR' && errCode !== 'FETCH_ERROR') {
            return {
              success: false,
              error: apiRes.error?.message || 'Không thể lưu hồ sơ shop vào cơ sở dữ liệu PostgreSQL.',
            };
          }
        } else if (apiRes.data?.id) {
          dbStoreId = apiRes.data.id;
        }
      } catch (dbErr) {
        console.warn('[applyMerchant] PostgreSQL API sync warning:', dbErr);
      }

      if (existingStore) {
        const updatedStores = stores.map((s) =>
          s.id === existingStore.id
            ? {
                ...s,
                id: dbStoreId || s.id,
                brand_name: brandName,
                phone: payload.phone.trim(),
                address,
                verification_doc: verificationDoc,
                status: 'PENDING' as const,
                is_approved: false,
                rejection_reason: null,
                updated_at: now,
              }
            : s
        );
        setStores(updatedStores);
        setIsOnboardingModalOpen(false);
        setIsStatusModalOpen(true);
        showGlobalToast({
          type: 'success',
          title: 'Đã gửi lại hồ sơ mở shop!',
          message: `Hồ sơ "${brandName}" đã được gửi chờ Admin xét duyệt.`,
        });
        return { success: true };
      }

      const newStore: Store = {
        id: dbStoreId || `store-${Date.now()}`,
        user_id: currentUser.id,
        brand_name: brandName,
        phone: payload.phone.trim(),
        address,
        verification_doc: verificationDoc,
        status: 'PENDING',
        is_approved: false,
        rejection_reason: null,
        created_at: now,
        updated_at: now,
      };

      setStores((prev) => [newStore, ...prev]);
      setIsOnboardingModalOpen(false);
      setIsStatusModalOpen(true);
      showGlobalToast({
        type: 'success',
        title: 'Đã gửi hồ sơ mở shop!',
        message: `Hồ sơ "${brandName}" đã được chuyển tới Admin xét duyệt.`,
      });

      return { success: true };
    },
    [currentUser, stores]
  );

  // 9. Admin Approve Store
  const approveStore = useCallback(
    (storeId: string) => {
      const targetStore = stores.find((s) => s.id === storeId);
      if (!targetStore) {
        return { success: false, error: 'Không tìm thấy hồ sơ cửa hàng.' };
      }

      const now = new Date().toISOString();

      setStores((prev) =>
        prev.map((s) =>
          s.id === storeId
            ? {
                ...s,
                status: 'APPROVED',
                is_approved: true,
                rejection_reason: null,
                updated_at: now,
              }
            : s
        )
      );

      setProfiles((prev) =>
        prev.map((p) =>
          p.id === targetStore.user_id
            ? {
                ...p,
                role: 'store',
                updated_at: now,
              }
            : p
        )
      );

      return { success: true };
    },
    [stores]
  );

  // 10. Admin Reject Store
  const rejectStore = useCallback((storeId: string, reason: string) => {
    const cleanReason = (reason || '').trim();
    if (!cleanReason) {
      return { success: false, error: 'Lý do từ chối là bắt buộc để gửi thông báo cho đối tác.' };
    }

    const now = new Date().toISOString();

    setStores((prev) =>
      prev.map((s) =>
        s.id === storeId
          ? {
              ...s,
              status: 'REJECTED',
              is_approved: false,
              rejection_reason: cleanReason,
              updated_at: now,
            }
          : s
      )
    );

    return { success: true };
  }, []);

  // 11. Profile Details & Update
  const getUserProfileDetails = useCallback((userId?: string): UserProfileDetails => {
    const targetId = userId || currentUserId;
    if (!targetId) {
      return {
        phone: '0988 123 456',
        address: '123 Nguyễn Văn Linh, P. Hải Châu',
        city: 'Đà Nẵng',
        gender: 'male',
        notes: 'May đo phom dáng chuẩn, vải tự nhiên',
      };
    }
    try {
      const raw = localStorage.getItem(`fv3d_profile_details_${targetId}`);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      phone: '0988 123 456',
      address: '123 Nguyễn Văn Linh, P. Hải Châu',
      city: 'Đà Nẵng',
      gender: 'male',
      notes: 'May đo phom dáng chuẩn, vải tự nhiên',
    };
  }, [currentUserId]);

  const updateUserProfile = useCallback(
    async (data: { full_name?: string; avatar_url?: string } & UserProfileDetails) => {
      if (!currentUserId) {
        return { success: false, error: 'Vui lòng đăng nhập để cập nhật hồ sơ.' };
      }

      const now = new Date().toISOString();

      setProfiles((prev) =>
        prev.map((p) => {
          if (p.id !== currentUserId) return p;
          return {
            ...p,
            full_name: data.full_name && data.full_name.trim() ? data.full_name.trim() : p.full_name,
            avatar_url: data.avatar_url !== undefined ? data.avatar_url : p.avatar_url,
            updated_at: now,
          };
        })
      );

      const existingDetails = getUserProfileDetails(currentUserId);
      const updatedDetails: UserProfileDetails = {
        phone: data.phone !== undefined ? data.phone.trim() : existingDetails.phone,
        address: data.address !== undefined ? data.address.trim() : existingDetails.address,
        city: data.city !== undefined ? data.city.trim() : existingDetails.city,
        gender: data.gender || existingDetails.gender,
        notes: data.notes !== undefined ? data.notes.trim() : existingDetails.notes,
      };

      try {
        localStorage.setItem(`fv3d_profile_details_${currentUserId}`, JSON.stringify(updatedDetails));
      } catch {}

      return { success: true };
    },
    [currentUserId, getUserProfileDetails]
  );

  // 12. Sổ địa chỉ nhận hàng (Chuẩn Shopee)
  const [userAddresses, setUserAddresses] = useState<UserAddress[]>(() => {
    if (!currentUserId) return [];
    try {
      const raw = localStorage.getItem(`fv3d_addresses_${currentUserId}`);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });

  const [refundBank, setRefundBank] = useState<RefundBankAccount | null>(() => {
    if (!currentUserId) return null;
    try {
      const raw = localStorage.getItem(`fv3d_refund_bank_${currentUserId}`);
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  });

  const [userPreferences, setUserPreferences] = useState<UserPreferences>(() => {
    const defaultPrefs: UserPreferences = {
      emailOrderUpdates: true,
      emailPromotions: false,
      easeAllowancePreference: 'regular',
    };
    if (!currentUserId) return defaultPrefs;
    try {
      const raw = localStorage.getItem(`fv3d_preferences_${currentUserId}`);
      if (raw) return { ...defaultPrefs, ...JSON.parse(raw) };
    } catch {}
    return defaultPrefs;
  });

  // Sync address book and settings when current user switches
  useEffect(() => {
    if (!currentUserId) {
      setUserAddresses([]);
      setRefundBank(null);
      setUserPreferences({
        emailOrderUpdates: true,
        emailPromotions: false,
        easeAllowancePreference: 'regular',
      });
      return;
    }

    try {
      const rawAddr = localStorage.getItem(`fv3d_addresses_${currentUserId}`);
      if (rawAddr) {
        setUserAddresses(JSON.parse(rawAddr));
      } else {
        const details = getUserProfileDetails(currentUserId);
        const currentUserObj = profiles.find((p) => p.id === currentUserId);
        if (details?.address) {
          const initialAddr: UserAddress = {
            id: 'addr-default-' + currentUserId.slice(0, 8),
            recipientName: currentUserObj?.full_name || 'Khách hàng',
            phone: details.phone || '0988 123 456',
            city: details.city || 'Đà Nẵng',
            detailedAddress: details.address,
            label: 'home',
            isDefault: true,
            createdAt: new Date().toISOString(),
          };
          setUserAddresses([initialAddr]);
          localStorage.setItem(`fv3d_addresses_${currentUserId}`, JSON.stringify([initialAddr]));
        } else {
          setUserAddresses([]);
        }
      }

      const rawBank = localStorage.getItem(`fv3d_refund_bank_${currentUserId}`);
      if (rawBank) setRefundBank(JSON.parse(rawBank));
      else setRefundBank(null);

      const rawPrefs = localStorage.getItem(`fv3d_preferences_${currentUserId}`);
      if (rawPrefs) {
        setUserPreferences((prev) => ({ ...prev, ...JSON.parse(rawPrefs) }));
      }
    } catch {}
  }, [currentUserId, getUserProfileDetails, profiles]);

  const defaultAddress = useMemo(() => {
    if (!userAddresses.length) return null;
    return userAddresses.find((a) => a.isDefault) || userAddresses[0];
  }, [userAddresses]);

  const saveAddress = useCallback(
    (addressData: Omit<UserAddress, 'id' | 'createdAt'> & { id?: string }) => {
      if (!currentUserId) return;
      const now = new Date().toISOString();
      setUserAddresses((prev) => {
        let updated: UserAddress[];
        const isDefault = addressData.isDefault || prev.length === 0;

        if (addressData.id) {
          updated = prev.map((item) => {
            if (item.id === addressData.id) {
              return {
                ...item,
                ...addressData,
                isDefault,
              };
            }
            return isDefault ? { ...item, isDefault: false } : item;
          });
        } else {
          const newAddress: UserAddress = {
            ...addressData,
            id: 'addr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            isDefault,
            createdAt: now,
          };
          const mappedPrev = isDefault ? prev.map((a) => ({ ...a, isDefault: false })) : prev;
          updated = [newAddress, ...mappedPrev];
        }

        try {
          localStorage.setItem(`fv3d_addresses_${currentUserId}`, JSON.stringify(updated));
        } catch {}

        return updated;
      });

      showGlobalToast({
        type: 'success',
        title: 'Đã cập nhật sổ địa chỉ',
        message: 'Địa chỉ nhận hàng đã được lưu an toàn.',
      });
    },
    [currentUserId]
  );

  const deleteAddress = useCallback(
    (id: string) => {
      if (!currentUserId) return;
      setUserAddresses((prev) => {
        const remaining = prev.filter((a) => a.id !== id);
        if (remaining.length > 0 && !remaining.some((a) => a.isDefault)) {
          remaining[0].isDefault = true;
        }
        try {
          localStorage.setItem(`fv3d_addresses_${currentUserId}`, JSON.stringify(remaining));
        } catch {}
        return remaining;
      });

      showGlobalToast({
        type: 'info',
        title: 'Đã xóa địa chỉ',
        message: 'Địa chỉ đã được gỡ khỏi sổ địa chỉ của bạn.',
      });
    },
    [currentUserId]
  );

  const setDefaultAddress = useCallback(
    (id: string) => {
      if (!currentUserId) return;
      setUserAddresses((prev) => {
        const updated = prev.map((a) => ({
          ...a,
          isDefault: a.id === id,
        }));
        try {
          localStorage.setItem(`fv3d_addresses_${currentUserId}`, JSON.stringify(updated));
        } catch {}
        return updated;
      });

      showGlobalToast({
        type: 'success',
        title: 'Địa chỉ mặc định',
        message: 'Đã đặt địa chỉ làm mặc định cho các đơn hàng tiếp theo.',
      });
    },
    [currentUserId]
  );

  const saveRefundBank = useCallback(
    (bank: RefundBankAccount) => {
      if (!currentUserId) return;
      setRefundBank(bank);
      try {
        localStorage.setItem(`fv3d_refund_bank_${currentUserId}`, JSON.stringify(bank));
      } catch {}
      showGlobalToast({
        type: 'success',
        title: 'Liên kết ngân hàng thành công',
        message: `Đã lưu tài khoản ${bank.bankCode} (${bank.accountHolderName}) để đối soát hoàn tiền.`,
      });
    },
    [currentUserId]
  );

  const deleteRefundBank = useCallback(() => {
    if (!currentUserId) return;
    setRefundBank(null);
    try {
      localStorage.removeItem(`fv3d_refund_bank_${currentUserId}`);
    } catch {}
    showGlobalToast({
      type: 'info',
      title: 'Đã gỡ tài khoản ngân hàng',
      message: 'Tài khoản hoàn tiền đã được xóa.',
    });
  }, [currentUserId]);

  const updateUserPreferences = useCallback(
    (prefs: Partial<UserPreferences>) => {
      if (!currentUserId) return;
      setUserPreferences((prev) => {
        const updated = { ...prev, ...prefs };
        try {
          localStorage.setItem(`fv3d_preferences_${currentUserId}`, JSON.stringify(updated));
        } catch {}
        return updated;
      });
      showGlobalToast({
        type: 'success',
        title: 'Đã lưu tùy chọn',
        message: 'Cài đặt thông báo & gợi ý kích thước 3D đã được cập nhật.',
      });
    },
    [currentUserId]
  );

  const changePassword = useCallback(
    async (oldPassword: string | undefined, newPassword: string) => {
      try {
        const res = await authApi.changePassword({ oldPassword, newPassword });
        if (res.success) {
          showGlobalToast({
            type: 'success',
            title: 'Đổi mật khẩu thành công',
            message: 'Mật khẩu bảo vệ tài khoản của bạn đã được cập nhật.',
          });
          return { success: true };
        }
        return { success: false, error: res.error?.message || 'Đổi mật khẩu thất bại.' };
      } catch (err: any) {
        return { success: false, error: err.message || 'Lỗi kết nối máy chủ.' };
      }
    },
    []
  );

  const revokeAllSessions = useCallback(async () => {
    try {
      await authApi.revokeAllSessions();
      showGlobalToast({
        type: 'info',
        title: 'Đã đăng xuất toàn bộ thiết bị',
        message: 'Tất cả các phiên làm việc khác đã được hủy an toàn.',
      });
      await signOut();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Lỗi khi hủy phiên đăng nhập.' };
    }
  }, [signOut]);

  const deleteMy3DData = useCallback(async () => {
    try {
      await authApi.deleteMy3DData();
      wipeAllUser3DData(currentUserId);
      showGlobalToast({
        type: 'success',
        title: 'Xóa dữ liệu 3D thành công',
        message: 'Toàn bộ số đo và mesh đã được xóa vĩnh viễn theo chuẩn Zero-Retention.',
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Lỗi khi xóa dữ liệu 3D.' };
    }
  }, [currentUserId]);

  const requestAccountLock = useCallback(
    async (reason?: string) => {
      try {
        await authApi.requestAccountLock(reason);
        showGlobalToast({
          type: 'warning',
          title: 'Tài khoản đã được khóa',
          message: 'Hệ thống đã khóa tài khoản của bạn để bảo mật thông tin.',
        });
        await signOut();
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || 'Lỗi khi yêu cầu khóa tài khoản.' };
      }
    },
    [signOut]
  );

  // 13. Demo Switcher for Instant Testing
  const switchDemoRole = useCallback((role: 'user' | 'pending' | 'store' | 'admin' | 'guest') => {
    if (role === 'guest') {
      setCurrentUserId(null);
      return;
    }

    const target = TEST_USERS[role];
    if (target) {
      setProfiles((prev) => {
        if (!prev.some((p) => p.id === target.id)) {
          return [...prev, target];
        }
        return prev;
      });
      setCurrentUserId(target.id);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentStore,
        stores,
        profiles,
        isAuthenticated,
        userRole,

        isAuthModalOpen,
        authModalTab,
        isOnboardingModalOpen,
        isStatusModalOpen,

        openSignIn,
        openRegister,
        openForgotPassword,
        openVerifyEmail,
        closeAuthModal,
        openOnboarding,
        closeOnboarding,
        openStatusModal,
        closeStatusModal,

        signIn,
        register,
        signOut,
        verifyEmail,
        forgotPassword,
        resetPassword,
        signInWithGoogle,

        updateUserProfile,
        getUserProfileDetails,

        // Sổ địa chỉ & Ngân hàng hoàn tiền & Tùy chọn 3D
        userAddresses,
        defaultAddress,
        saveAddress,
        deleteAddress,
        setDefaultAddress,

        refundBank,
        saveRefundBank,
        deleteRefundBank,

        userPreferences,
        updateUserPreferences,
        changePassword,
        revokeAllSessions,
        deleteMy3DData,
        requestAccountLock,

        applyMerchant,
        approveStore,
        rejectStore,

        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


