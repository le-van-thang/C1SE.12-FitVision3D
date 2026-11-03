import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  signIn: (email: string, password?: string, website_trap?: string) => Promise<{ success: boolean; error?: string; errorCode?: string }>;
  register: (payload: RegisterPayload) => Promise<{ success: boolean; error?: string; devOtp?: string; message?: string }>;
  signOut: () => Promise<void>;
  verifyEmail: (email: string, otp: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string; message?: string; devOtp?: string }>;
  resetPassword: (payload: { email: string; otp: string; newPassword: string; confirmPassword?: string }) => Promise<{ success: boolean; error?: string; message?: string }>;
  signInWithGoogle: (data: { email?: string; fullName?: string; credential?: string; avatarUrl?: string; googleId?: string }) => Promise<{ success: boolean; error?: string }>;

  // Merchant Onboarding & Admin
  applyMerchant: (payload: MerchantOnboardingPayload) => { success: boolean; error?: string };
  approveStore: (storeId: string) => { success: boolean; error?: string };
  rejectStore: (storeId: string, reason: string) => { success: boolean; error?: string };

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
  return {
    id: u.id,
    full_name: u.fullName || u.email.split('@')[0],
    email: u.email,
    role: (u.role ? roleMap[u.role] : 'user') || 'user',
    avatar_url: u.avatarUrl || null,
    created_at: u.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function initProfiles(): Profile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILES);
    if (raw) return JSON.parse(raw);
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
  const [profiles, setProfiles] = useState<Profile[]>(initProfiles);
  const [stores, setStores] = useState<Store[]>(initStores);
  const [currentUserId, setCurrentUserId] = useState<string | null>(initCurrentUserId);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'register' | 'forgot' | 'verify'>('signin');
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

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
        }
      } catch {
        // Not logged in with live backend session
      }
    }
    checkSession();
    return () => {
      isMounted = false;
    };
  }, []);

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

  const currentUser = profiles.find((p) => p.id === currentUserId) || null;
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

  // 1. Sign In (Live Backend Call)
  const signIn = useCallback(
    async (emailInput: string, passwordInput = '', website_trap = '') => {
      if (checkHoneypot(website_trap)) {
        return { success: false, error: 'Phát hiện hoạt động bot đáng ngờ (Honeypot Triggered).' };
      }

      const limit = RateLimiter.checkLimit('login', 5, 10);
      if (!limit.allowed) {
        return {
          success: false,
          error: `Đăng nhập quá số lần cho phép. Vui lòng thử lại sau ${limit.waitMinutes} phút.`,
        };
      }

      const email = emailInput.trim();
      const res = await authApi.login(email, passwordInput);

      if (res.success && res.data?.user) {
        const profile = mapBackendUserToProfile(res.data.user);
        setProfiles((prev) => {
          const filtered = prev.filter((p) => p.id !== profile.id);
          return [profile, ...filtered];
        });
        setCurrentUserId(profile.id);
        setIsAuthModalOpen(false);
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
        errorCode: res.error?.code,
        error: res.error?.message || 'Email hoặc mật khẩu không chính xác.',
      };
    },
    []
  );

  // 2. Register (Live Backend Call)
  const register = useCallback(
    async (payload: RegisterPayload) => {
      if (checkHoneypot(payload.website_trap)) {
        return { success: false, error: 'Phát hiện bot tự động đăng ký (Honeypot Triggered).' };
      }

      const limit = RateLimiter.checkLimit('register', 3, 10);
      if (!limit.allowed) {
        return {
          success: false,
          error: `Quá số lần đăng ký cho phép. Vui lòng đợi ${limit.waitMinutes} phút trước khi thử lại.`,
        };
      }

      const cleanFullName = (payload.fullName || '').trim();
      if (cleanFullName.length < 2) {
        return { success: false, error: 'Họ và tên phải có tối thiểu 2 ký tự.' };
      }

      const passResult = validatePassword(payload.password);
      if (!passResult.valid) {
        return { success: false, error: passResult.error };
      }

      if (payload.confirmPassword !== undefined && payload.password !== payload.confirmPassword) {
        return { success: false, error: 'Mật khẩu xác nhận không trùng khớp với mật khẩu đã nhập.' };
      }

      const res = await authApi.register({
        fullName: cleanFullName,
        email: payload.email.trim(),
        password: payload.password,
        confirmPassword: payload.confirmPassword,
        extraNotes: payload.website_trap,
      });

      if (res.success) {
        return {
          success: true,
          message: res.data?.message || 'Đăng ký thành công! Hãy kiểm tra email để kích hoạt tài khoản.',
          devOtp: res.data?.devOtp,
        };
      }

      return {
        success: false,
        error: res.error?.message || 'Đăng ký thất bại. Vui lòng thử lại.',
      };
    },
    []
  );

  // 3. Verify Email OTP
  const verifyEmail = useCallback(async (email: string, otp: string) => {
    const res = await authApi.verifyEmail(email.trim(), otp.trim());
    if (res.success) {
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

  // 6. Sign In With Google (Thực tế với dữ liệu từ Google OAuth)
  const signInWithGoogle = useCallback(
    async (data: { email?: string; fullName?: string; credential?: string; avatarUrl?: string; googleId?: string }) => {
      const res = await authApi.googleLogin(data);
      if (res.success && res.data?.user) {
        const prof = mapBackendUserToProfile(res.data.user);
        setProfiles((prev) => {
          const filtered = prev.filter((p) => p.id !== prof.id);
          return [prof, ...filtered];
        });
        setCurrentUserId(prof.id);
        setIsAuthModalOpen(false);
        return { success: true };
      }
      return {
        success: false,
        error: res.error?.message || 'Đăng nhập bằng Google thất bại.',
      };
    },
    []
  );

  // 7. Sign Out
  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {}
    setCurrentUserId(null);
    try {
      localStorage.setItem(STORAGE_KEY_USER_ID, 'guest');
    } catch {}
  }, []);

  // 8. Merchant Onboarding (Apply for Store)
  const applyMerchant = useCallback(
    (payload: MerchantOnboardingPayload) => {
      if (!currentUser) {
        return { success: false, error: 'Vui lòng đăng nhập trước khi nộp hồ sơ mở cửa hàng.' };
      }

      if (checkHoneypot(payload.website_trap)) {
        return { success: false, error: 'Phát hiện bot tự động (Honeypot Triggered).' };
      }

      const limit = RateLimiter.checkLimit('apply_store', 3, 10);
      if (!limit.allowed) {
        return {
          success: false,
          error: `Bạn đã nộp hồ sơ quá nhiều lần. Vui lòng chờ ${limit.waitMinutes} phút.`,
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
          error: 'Vui lòng cung cấp mã số GPKD hoặc link Website/Fanpage để xác thực đối tác.',
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
        const updatedStores = stores.map((s) =>
          s.id === existingStore.id
            ? {
                ...s,
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
        return { success: true };
      }

      const newStore: Store = {
        id: `store-${Date.now()}`,
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

  // 11. Demo Switcher for Instant Testing
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
