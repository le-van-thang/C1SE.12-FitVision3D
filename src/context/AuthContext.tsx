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
  authModalTab: 'signin' | 'register';
  isOnboardingModalOpen: boolean;
  isStatusModalOpen: boolean;

  openSignIn: () => void;
  openRegister: () => void;
  closeAuthModal: () => void;
  openOnboarding: () => void;
  closeOnboarding: () => void;
  openStatusModal: () => void;
  closeStatusModal: () => void;

  // Auth Operations
  signIn: (email: string, password?: string, website_trap?: string) => { success: boolean; error?: string };
  register: (payload: RegisterPayload) => { success: boolean; error?: string };
  signOut: () => void;

  // Merchant Onboarding & Admin
  applyMerchant: (payload: MerchantOnboardingPayload) => { success: boolean; error?: string };
  approveStore: (storeId: string) => { success: boolean; error?: string };
  rejectStore: (storeId: string, reason: string) => { success: boolean; error?: string };

  // Demo Switcher
  switchDemoRole: (role: 'user' | 'pending' | 'store' | 'admin' | 'guest') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
  // Default to guest for realistic first-load experience, but can be switched with 1-click
  return null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profiles, setProfiles] = useState<Profile[]>(initProfiles);
  const [stores, setStores] = useState<Store[]>(initStores);
  const [currentUserId, setCurrentUserId] = useState<string | null>(initCurrentUserId);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'register'>('signin');
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

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

  // 1. Sign In
  const signIn = useCallback(
    (emailInput: string, passwordInput = '', website_trap = '') => {
      // 1. Honeypot check
      if (checkHoneypot(website_trap)) {
        return { success: false, error: 'Phát hiện hoạt động bot đáng ngờ (Honeypot Triggered).' };
      }

      // 2. Rate limit check
      const limit = RateLimiter.checkLimit('login', 5, 10);
      if (!limit.allowed) {
        return {
          success: false,
          error: `Đăng nhập quá số lần cho phép. Vui lòng thử lại sau ${limit.waitMinutes} phút.`,
        };
      }

      const email = emailInput.trim().toLowerCase();
      const user = profiles.find((p) => p.email.toLowerCase() === email);

      if (!user) {
        return {
          success: false,
          error: 'Tài khoản không tồn tại trên hệ thống. Vui lòng kiểm tra lại email hoặc đăng ký tài khoản mới.',
        };
      }

      // In real backend, password would be hashed. In thick-client mock, we allow simple check.
      setCurrentUserId(user.id);
      setIsAuthModalOpen(false);
      return { success: true };
    },
    [profiles]
  );

  // 2. Register (EQUAL PUBLIC REGISTRATION - STRICTLY role = 'user')
  const register = useCallback(
    (payload: RegisterPayload) => {
      // 1. Honeypot check
      if (checkHoneypot(payload.website_trap)) {
        return { success: false, error: 'Phát hiện bot tự động đăng ký (Honeypot Triggered).' };
      }

      // 2. Rate limiting check
      const limit = RateLimiter.checkLimit('register', 3, 10);
      if (!limit.allowed) {
        return {
          success: false,
          error: `Quá số lần đăng ký cho phép. Vui lòng đợi ${limit.waitMinutes} phút trước khi thử lại.`,
        };
      }

      // 3. Email validation
      const existingEmails = profiles.map((p) => p.email);
      const emailResult = validateEmail(payload.email, existingEmails);
      if (!emailResult.valid) {
        return { success: false, error: emailResult.error };
      }

      // 4. Password validation
      const passResult = validatePassword(payload.password);
      if (!passResult.valid) {
        return { success: false, error: passResult.error };
      }

      if (payload.confirmPassword !== undefined && payload.password !== payload.confirmPassword) {
        return { success: false, error: 'Mật khẩu xác nhận không trùng khớp với mật khẩu đã nhập.' };
      }

      if (payload.termsAgreed !== undefined && !payload.termsAgreed) {
        return { success: false, error: 'Bạn phải đồng ý với Điều khoản Dịch vụ & Chính sách Bảo mật.' };
      }

      const cleanFullName = (payload.fullName || '').trim();
      if (cleanFullName.length < 2) {
        return { success: false, error: 'Họ và tên phải có tối thiểu 2 ký tự.' };
      }

      // STRICT SECURITY RULE: Role is hard-coded to 'user'. No role selector allowed.
      const newUserId = `usr-${Date.now()}`;
      const newProfile: Profile = {
        id: newUserId,
        full_name: cleanFullName,
        email: payload.email.trim().toLowerCase(),
        role: 'user', // HARD-CODED STRICT USER ROLE
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setProfiles((prev) => [...prev, newProfile]);
      setCurrentUserId(newProfile.id);
      setIsAuthModalOpen(false);

      return { success: true };
    },
    [profiles]
  );

  // 3. Sign Out
  const signOut = useCallback(() => {
    setCurrentUserId(null);
    try {
      localStorage.setItem(STORAGE_KEY_USER_ID, 'guest');
    } catch {}
  }, []);

  // 4. Merchant Onboarding (Apply for Store)
  const applyMerchant = useCallback(
    (payload: MerchantOnboardingPayload) => {
      if (!currentUser) {
        return { success: false, error: 'Vui lòng đăng nhập trước khi nộp hồ sơ mở cửa hàng.' };
      }

      // 1. Honeypot check
      if (checkHoneypot(payload.website_trap)) {
        return { success: false, error: 'Phát hiện bot tự động (Honeypot Triggered).' };
      }

      // 2. Rate limiting check
      const limit = RateLimiter.checkLimit('apply_store', 3, 10);
      if (!limit.allowed) {
        return {
          success: false,
          error: `Bạn đã nộp hồ sơ quá nhiều lần. Vui lòng chờ ${limit.waitMinutes} phút.`,
        };
      }

      // 3. Brand name check
      const brandName = (payload.brandName || '').trim();
      if (brandName.length < 3) {
        return { success: false, error: 'Tên thương hiệu/cửa hàng phải có ít nhất 3 ký tự.' };
      }

      const existingBrands = stores.map((s) => s.brand_name.toLowerCase());
      if (existingBrands.includes(brandName.toLowerCase())) {
        return { success: false, error: 'Tên thương hiệu này đã được sử dụng. Vui lòng chọn tên khác.' };
      }

      // 4. Phone validation
      const existingPhones = stores.map((s) => s.phone);
      const phoneResult = validatePhoneNumber(payload.phone, existingPhones);
      if (!phoneResult.valid) {
        return { success: false, error: phoneResult.error };
      }

      // 5. Address check
      const address = (payload.address || '').trim();
      if (address.length < 5) {
        return { success: false, error: 'Địa chỉ xưởng/cửa hàng phải có ít nhất 5 ký tự.' };
      }

      // 6. Verification doc check
      const verificationDoc = (payload.verificationDoc || '').trim();
      if (verificationDoc.length < 3) {
        return {
          success: false,
          error: 'Vui lòng cung cấp mã số GPKD hoặc link Website/Fanpage để xác thực đối tác.',
        };
      }

      // Check if user already has an active store application
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
        // If rejected, update the existing store record to PENDING
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

      // Create new store record
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

  // 5. Admin Approve Store
  const approveStore = useCallback(
    (storeId: string) => {
      const targetStore = stores.find((s) => s.id === storeId);
      if (!targetStore) {
        return { success: false, error: 'Không tìm thấy hồ sơ cửa hàng.' };
      }

      const now = new Date().toISOString();

      // Atomically update store status AND applicant role to 'store'
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

  // 6. Admin Reject Store
  const rejectStore = useCallback(
    (storeId: string, reason: string) => {
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
    },
    []
  );

  // 7. Demo Switcher for Instant Testing
  const switchDemoRole = useCallback(
    (role: 'user' | 'pending' | 'store' | 'admin' | 'guest') => {
      if (role === 'guest') {
        setCurrentUserId(null);
        return;
      }

      const target = TEST_USERS[role];
      if (target) {
        // Ensure user exists in profiles state
        setProfiles((prev) => {
          if (!prev.some((p) => p.id === target.id)) {
            return [...prev, target];
          }
          return prev;
        });
        setCurrentUserId(target.id);
      }
    },
    []
  );

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
        closeAuthModal,
        openOnboarding,
        closeOnboarding,
        openStatusModal,
        closeStatusModal,

        signIn,
        register,
        signOut,

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
