import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Layers,
  Box,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { MeshViewport } from '@/features/anthropometry/MeshViewport';
import { DEMO_MESH, DEMO_MEASUREMENT } from '@/data/mockData';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalTab,
    closeAuthModal,
    openRegister,
    openSignIn,
    openForgotPassword,
    openVerifyEmail,
    signIn,
    register,
    verifyEmail,
    forgotPassword,
    resetPassword,
    signInWithGoogle,
  } = useAuth();
  const { t, locale } = useI18n();

  // Inputs strictly initialized to EMPTY strings (user types everything)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(true);
  const [websiteTrap, setWebsiteTrap] = useState('');
  const formPaneRef = useRef<HTMLDivElement>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({}); // Honeypot trap
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Forgot password & Verify states
  const [forgotStep, setForgotStep] = useState<'request' | 'reset'>('request');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Anti-autofill: keep readOnly until user explicitly focuses or clicks
  const [emailUnlocked, setEmailUnlocked] = useState(false);
  const [passwordUnlocked, setPasswordUnlocked] = useState(false);

  // Reset inputs and unlock flags whenever the modal opens or tab switches
  useEffect(() => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setEmailUnlocked(false);
    setPasswordUnlocked(false);
    if (authModalTab === 'signin' || authModalTab === 'register') {
      setForgotStep('request');
      setOtpCode('');
      setNewPassword('');
      setConfirmNewPassword('');
    }
  }, [authModalTab, isAuthModalOpen]);

  // Responsive 3D viewport height so the showcase never overflows the screen
  const [meshHeight, setMeshHeight] = useState(() =>
    Math.max(150, Math.min(320, window.innerHeight - 520)),
  );
  useEffect(() => {
    const onResize = () => setMeshHeight(Math.max(150, Math.min(320, window.innerHeight - 520)));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  
  // Helper dịch mã lỗi sang ngôn ngữ đang chọn (VI/EN)
  const getLocalizedErrorMessage = (code?: string, rawMsg?: string): string => {
    const isEn = locale === 'en';

    // Xử lý theo nội dung rawMsg trước để bắt chính xác các câu từ backend
    if (rawMsg) {
      const lower = rawMsg.toLowerCase();
      if (lower.includes('vui lòng nhập email') || lower.includes('nhập địa chỉ email') || lower.includes('email.')) {
        return t('app.authErrors.AUTH_EMAIL_REQUIRED');
      }
      if (lower.includes('vui lòng nhập mật khẩu') || lower.includes('mật khẩu không được để trống') || lower.includes('mật khẩu mới')) {
        return t('app.authErrors.AUTH_PASSWORD_REQUIRED');
      }
      if (lower.includes('họ và tên') || lower.includes('tối thiểu 2 ký tự')) {
        return t('app.authErrors.AUTH_NAME_REQUIRED');
      }
      if (lower.includes('không chính xác') || lower.includes('email hoặc mật khẩu')) {
        return t('app.authErrors.AUTH_INVALID_CREDENTIALS');
      }
      if (lower.includes('chưa được kích hoạt')) {
        return t('app.authErrors.AUTH_EMAIL_NOT_VERIFIED');
      }
      if (lower.includes('đã được đăng ký') || lower.includes('đã được sử dụng')) {
        return t('app.authErrors.AUTH_EMAIL_ALREADY_EXISTS');
      }
      if (lower.includes('tạm thời') || lower.includes('rác') || lower.includes('disposable')) {
        return t('app.authErrors.AUTH_DISPOSABLE_EMAIL');
      }
      if (lower.includes('không trùng khớp') || lower.includes('không khớp') || lower.includes('mismatch')) {
        return t('app.authErrors.AUTH_PASSWORD_MISMATCH');
      }
      if (lower.includes('quá số lần') || lower.includes('quá nhiều lần') || lower.includes('rate limit') || lower.includes('đợi 1-2 phút') || lower.includes('đợi 10 phút')) {
        return t('app.authErrors.AUTH_RATE_LIMIT_EXCEEDED');
      }
      if (lower.includes('tạm khóa') || lower.includes('bị khóa') || lower.includes('locked')) {
        return t('app.authErrors.AUTH_ACCOUNT_LOCKED');
      }
      if (lower.includes('tạm ngưng') || lower.includes('bị vô hiệu') || lower.includes('banned')) {
        return t('app.authErrors.AUTH_ACCOUNT_BANNED');
      }
      if (lower.includes('mã otp') || lower.includes('hết hạn') || lower.includes('otp')) {
        return t('app.authErrors.AUTH_OTP_INVALID');
      }
      if (lower.includes('máy chủ xác thực') || lower.includes('network') || lower.includes('failed to fetch') || lower.includes('lỗi mạng')) {
        return t('app.authErrors.NETWORK_ERROR');
      }
      if (lower.includes('bot') || lower.includes('honeypot')) {
        return t('app.authErrors.BOT_DETECTED');
      }
      if (lower.includes('google')) {
        return t('app.authErrors.GOOGLE_LOGIN_FAILED');
      }
    }

    // Xử lý theo mã lỗi chuẩn (code)
    if (code) {
      if (code === 'VALIDATION_FAILED') {
        if (rawMsg?.toLowerCase().includes('email')) return t('app.authErrors.AUTH_EMAIL_REQUIRED');
        if (rawMsg?.toLowerCase().includes('mật khẩu') || rawMsg?.toLowerCase().includes('password')) return t('app.authErrors.AUTH_PASSWORD_REQUIRED');
        return t('app.authErrors.VALIDATION_FAILED');
      }
      const key = "app.authErrors." + code;
      const translated = t(key);
      if (translated && translated !== key) {
        return translated;
      }
    }

    // Nếu đang ở tiếng Anh mà thông điệp vẫn chứa chữ tiếng Việt, không bao giờ để lọt
    if (isEn && rawMsg && /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(rawMsg)) {
      return t('app.authErrors.DEFAULT_ERROR');
    }

    return rawMsg || t('app.authErrors.DEFAULT_ERROR');
  };

  const renderInlineError = () => {
    if (!errorMessage) return null;
    return (
      <div
        style={{
          padding: '10px 14px',
          borderRadius: 8,
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          color: '#FCA5A5',
          fontSize: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          marginBottom: 10,
          marginTop: 4,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={16} className="shrink-0 text-red-400" />
          <span style={{ flex: 1, lineHeight: 1.4 }}>{errorMessage}</span>
        </div>
        {(errorMessage.includes('chưa được kích hoạt') ||
          errorMessage.toLowerCase().includes('activated') ||
          errorMessage.includes('OTP')) && (
          <button
            type="button"
            onClick={() => openVerifyEmail(email)}
            style={{
              alignSelf: 'flex-start',
              background: '#4FD1C5',
              color: '#0A0F12',
              border: 'none',
              borderRadius: 6,
              padding: '5px 12px',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              marginTop: 2,
            }}
          >
            👉 Nhập mã kích hoạt OTP ngay
          </button>
        )}
      </div>
    );
  };

  if (!isAuthModalOpen) return null;

  // 1. Handle Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    const res = await signIn(email, password, websiteTrap);
    setLoading(false);

    if (!res.success) {
      if (res.errorCode === 'AUTH_EMAIL_NOT_VERIFIED') {
        setErrorMessage(getLocalizedErrorMessage('AUTH_EMAIL_NOT_VERIFIED', res.error));
      formPaneRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setErrorMessage(getLocalizedErrorMessage((res as any).errorCode, res.error));
      formPaneRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // 2. Handle Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    const res = await register({
      fullName,
      email,
      password,
      confirmPassword,
      termsAgreed,
      website_trap: websiteTrap,
    });
    setLoading(false);

    if (res.success) {
      setSuccessMessage(t('app.auth.successRegister'));
      setOtpCode('');
      openVerifyEmail(email);
    } else {
      setErrorMessage(getLocalizedErrorMessage((res as any)?.errorCode, res.error));
      formPaneRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 3. Handle Verify Email
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    const res = await verifyEmail(email, otpCode || '123456');
    setLoading(false);

    if (res.success) {
      setSuccessMessage(t('app.auth.successVerify'));
      setTimeout(() => {
        openSignIn();
      }, 1200);
    } else {
      setErrorMessage(getLocalizedErrorMessage('AUTH_OTP_INVALID', res.error));
    }
  };

  // 4. Handle Request Forgot Password OTP
  const handleRequestForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage(t('app.authErrors.AUTH_EMAIL_REQUIRED'));
      return;
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    const res = await forgotPassword(email);
    setLoading(false);

    if (res.success) {
      setSuccessMessage(t('app.auth.successForgot'));
      setOtpCode('');
      setForgotStep('reset');
    } else {
      setErrorMessage(getLocalizedErrorMessage(undefined, res.error));
    }
  };

  // 5. Handle Reset Password with OTP
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setErrorMessage(t('app.authErrors.AUTH_PASSWORD_MISMATCH'));
      return;
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    const res = await resetPassword({
      email,
      otp: otpCode,
      newPassword,
      confirmPassword: confirmNewPassword,
    });
    setLoading(false);

    if (res.success) {
      setSuccessMessage(t('app.auth.successReset'));
      setTimeout(() => {
        setPassword('');
        openSignIn();
      }, 1500);
    } else {
      setErrorMessage(getLocalizedErrorMessage(undefined, res.error));
    }
  };

  // 6. Handle Google Login với Google OAuth 2.0 Popup chuẩn quốc tế
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!googleClientId || googleClientId.trim() === '') {
      setErrorMessage(t('app.authErrors.GOOGLE_CONFIG_MISSING'));
      return;
    }

    if (typeof window === 'undefined' || !(window as any).google?.accounts?.oauth2) {
      setErrorMessage(t('app.authErrors.GOOGLE_SDK_LOADING'));
      return;
    }

    try {
      const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: googleClientId.trim(),
        scope: 'email profile openid',
        prompt: 'select_account',
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            setLoading(false);
            if (tokenResponse.error !== 'popup_closed_by_user') {
              setErrorMessage(`${t('app.authErrors.GOOGLE_LOGIN_FAILED')}: ${tokenResponse.error_description || tokenResponse.error}`);
            }
            return;
          }

          if (tokenResponse.access_token) {
            setLoading(true);
            try {
              // Lấy thông tin tài khoản thật từ Google OpenID API
              const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              });
              const googleUser = await userInfoRes.json();

              if (!googleUser.email) {
                setLoading(false);
                setErrorMessage(t('app.authErrors.GOOGLE_LOGIN_FAILED'));
                return;
              }

              // Gửi thông tin tài khoản thật về Backend để cấp Access Token & HttpOnly Cookie
              const res = await signInWithGoogle({
                email: googleUser.email,
                fullName: googleUser.name || googleUser.email.split('@')[0],
                avatarUrl: googleUser.picture,
                googleId: googleUser.sub,
              });

              setLoading(false);
              if (!res.success) {
                setErrorMessage(getLocalizedErrorMessage('GOOGLE_LOGIN_FAILED', res.error));
              }
            } catch (err: any) {
              setLoading(false);
              setErrorMessage(t('app.authErrors.GOOGLE_LOGIN_FAILED'));
            }
          }
        },
      });

      // Bật cửa sổ Popup chọn tài khoản Google thật
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(t('app.authErrors.GOOGLE_LOGIN_FAILED'));
    }
  };

  return (
    <div className="zf-auth-fullscreen animate-fade-in">
      {/* ── CỘT TRÁI: VISUAL SHOWCASE (CHIA ĐÔI TOÀN MÀN HÌNH TRÊN DESKTOP) ── */}
      <div className="zf-auth-showcase-pane">
        {/* Ambient radial lighting */}
        <div
          style={{
            position: 'absolute',
            top: -80,
            left: -80,
            width: 380,
            height: 380,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(79, 209, 197, 0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Decorative blueprint grid + drifting orb + scan beam */}
        <div className="zf-auth-grid" />
        <div className="zf-auth-orb" />
        <div className="zf-auth-scan" />

        {/* Top Header & Certifications */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(79, 209, 197, 0.15)',
                border: '1px solid rgba(79, 209, 197, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4FD1C5',
              }}
            >
              <Box size={22} strokeWidth={2} />
            </div>
            <div>
              <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                FitVision <b style={{ color: '#4FD1C5', fontWeight: 700 }}>3D</b>
              </span>
              <p style={{ margin: 0, fontSize: 11, color: '#94A3B8' }}>
                {t('app.auth.engine')}
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '.06em',
              background: 'rgba(79, 209, 197, 0.1)',
              border: '1px solid rgba(79, 209, 197, 0.25)',
              color: '#4FD1C5',
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#4FD1C5',
                boxShadow: '0 0 8px #4FD1C5',
              }}
            />
            {t('app.auth.isoBadge')}
          </div>
        </div>

        {/* Center: Live 3D Wireframe Mannequin Mesh */}
        <div style={{ margin: 'auto 0', position: 'relative', zIndex: 2, width: '100%' }}>
          <div
            style={{
              borderRadius: 16,
              overflow: 'hidden',
              background: '#070B0E',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.8), inset 0 0 30px rgba(0, 0, 0, 0.6)',
            }}
          >
            <MeshViewport
              meshParams={DEMO_MESH}
              measurement={DEMO_MEASUREMENT}
              height={meshHeight}
              zonePillAlign="right"
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 11,
              color: '#94A3B8',
              fontFamily: 'var(--font-mono)',
              marginTop: 10,
              padding: '0 6px',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Layers size={13} style={{ color: '#4FD1C5' }} /> {t('app.auth.topology')}
            </span>
            <span style={{ color: '#A3E635' }}>{t('app.auth.latency')}</span>
          </div>
        </div>

        {/* Tagline + stat chips */}
        <div style={{ position: 'relative', zIndex: 2, marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.25, color: '#FFFFFF' }}>
            {t('app.auth.taglinePre')}<span style={{ color: '#4FD1C5' }}>{t('app.auth.taglineHi')}</span>,
            <br />
            {t('app.auth.taglinePost')}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 14 }}>
            {[
              { v: '±0.8cm', l: t('app.auth.chipError') },
              { v: '1.25s', l: t('app.auth.chipSpeed') },
              { v: '0 byte', l: t('app.auth.chipRetention') },
            ].map((s) => (
              <div key={s.l} className="zf-auth-chip">
                <b>{s.v}</b>
                <small>{s.l}</small>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Privacy & RAM-only retention guarantee */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            padding: '16px 20px',
            borderRadius: 14,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <ShieldCheck size={18} style={{ color: '#4FD1C5' }} />
            <strong style={{ fontSize: 13, color: '#FFFFFF', fontWeight: 600 }}>
              {t('app.auth.aboutTitle')}
            </strong>
          </div>
          <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, lineHeight: 1.55 }}>
            {t('app.auth.aboutDesc')}
          </p>
        </div>
      </div>

      {/* ── CỘT PHẢI: FORM VIEW TOÀN MÀN HÌNH ── */}
      <div ref={formPaneRef} className="zf-auth-form-pane">
        {/* Top bar with Back button and Close [X] */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 28px',
            borderBottom: '1px solid #1E293B',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={closeAuthModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              padding: '6px 10px',
              borderRadius: 8,
              transition: 'color .15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
          >
            <ArrowLeft size={16} />
            <span>{t('app.auth.back')}</span>
          </button>

          <LanguageSwitcher size="md" />

          <button
            type="button"
            onClick={closeAuthModal}
            style={{
              width: 36,
              height: 36,
              display: 'grid',
              placeItems: 'center',
              background: '#0F172A',
              border: '1px solid #1E293B',
              borderRadius: 10,
              color: '#94A3B8',
              cursor: 'pointer',
              transition: 'all .15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#FFFFFF';
              e.currentTarget.style.borderColor = '#4FD1C5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94A3B8';
              e.currentTarget.style.borderColor = '#1E293B';
            }}
            aria-label={t('app.auth.close')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body - Centered vertically and horizontally */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '32px 24px',
            width: '100%',
          }}
        >
          <div className="zf-auth-card" style={{ width: '100%', maxWidth: 460 }}>
            {/* Header */}
            <div style={{ marginBottom: 22, textAlign: 'center' }}>
              <div className="zf-auth-badge">
                {authModalTab === 'forgot' ? (
                  <KeyRound size={22} strokeWidth={2} />
                ) : authModalTab === 'verify' ? (
                  <ShieldCheck size={22} strokeWidth={2} />
                ) : (
                  <Lock size={22} strokeWidth={2} />
                )}
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                {authModalTab === 'signin'
                  ? t('app.auth.signinTitle', 'Đăng nhập')
                  : authModalTab === 'register'
                  ? t('app.auth.registerTitle', 'Tạo tài khoản mới')
                  : authModalTab === 'forgot'
                  ? t('app.auth.forgotTitle', 'Quên mật khẩu')
                  : t('app.auth.verifyTitle', 'Kích hoạt tài khoản')}
              </h1>
              <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 8, marginBottom: 0 }}>
                {authModalTab === 'signin'
                  ? t('app.auth.signinDesc', 'Truy cập cổng đo lường nhân trắc học 3D của bạn')
                  : authModalTab === 'register'
                  ? t('app.auth.registerDesc', 'Tạo tài khoản khách hàng để trải nghiệm thử đồ 3D')
                  : authModalTab === 'forgot'
                  ? t('app.auth.forgotDesc', 'Khôi phục mật khẩu tài khoản của bạn qua mã xác nhận OTP')
                  : t('app.auth.verifyDesc', 'Nhập mã OTP 6 số để hoàn tất kích hoạt tài khoản')}
              </p>
            </div>

            {/* Tab Switcher (Chỉ hiển thị khi ở tab signin hoặc register) */}
            {(authModalTab === 'signin' || authModalTab === 'register') && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 4,
                  padding: 4,
                  background: '#030712',
                  border: '1px solid #1E293B',
                  borderRadius: 12,
                  marginBottom: 24,
                }}
              >
                <button
                  type="button"
                  onClick={openSignIn}
                  style={{
                    padding: '10px 14px',
                    fontSize: 13,
                    fontWeight: authModalTab === 'signin' ? 600 : 500,
                    border: 'none',
                    borderRadius: 9,
                    background: authModalTab === 'signin' ? '#1F2937' : 'transparent',
                    color: authModalTab === 'signin' ? '#4FD1C5' : '#94A3B8',
                    cursor: 'pointer',
                    transition: 'all .15s',
                    boxShadow: authModalTab === 'signin' ? '0 1px 3px rgba(0, 0, 0, 0.4)' : 'none',
                  }}
                >
                  {t('app.auth.tabSignin', 'Đăng nhập')}
                </button>
                <button
                  type="button"
                  onClick={openRegister}
                  style={{
                    padding: '10px 14px',
                    fontSize: 13,
                    fontWeight: authModalTab === 'register' ? 600 : 500,
                    border: 'none',
                    borderRadius: 9,
                    background: authModalTab === 'register' ? '#1F2937' : 'transparent',
                    color: authModalTab === 'register' ? '#4FD1C5' : '#94A3B8',
                    cursor: 'pointer',
                    transition: 'all .15s',
                    boxShadow: authModalTab === 'register' ? '0 1px 3px rgba(0, 0, 0, 0.4)' : 'none',
                  }}
                >
                  {t('app.auth.tabRegister', 'Tạo tài khoản')}
                </button>
              </div>
            )}

            {/* Success Message Banner */}
            {successMessage && (
              <div
                style={{
                  marginBottom: 18,
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: 'rgba(79, 209, 197, 0.12)',
                  border: '1px solid rgba(79, 209, 197, 0.35)',
                  color: '#4FD1C5',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                }}
              >
                <CheckCircle2 size={17} style={{ flexShrink: 0, marginTop: 1, color: '#4FD1C5' }} />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Error Message Banner */}
            {errorMessage && (
              <div
                style={{
                  marginBottom: 18,
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#FCA5A5',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                }}
              >
                <AlertCircle size={17} style={{ flexShrink: 0, marginTop: 1, color: '#F87171' }} />
                <div style={{ flex: 1 }}>
                  <span>{errorMessage}</span>
                  {(errorMessage.includes('chưa được kích hoạt') || errorMessage.toLowerCase().includes('activated') || errorMessage.includes('OTP')) && (
                    <div style={{ marginTop: 6 }}>
                      <button
                        type="button"
                        onClick={() => openVerifyEmail(email)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#4FD1C5',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          padding: 0,
                        }}
                      >
                        {t('app.authErrors.CLICK_TO_VERIFY', 'Bấm vào đây để nhập mã kích hoạt')} (OTP: 123456)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── 1. SIGN IN FORM ── */}
            {authModalTab === 'signin' && (
              <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Browser autofill traps (off-screen) */}
                <input
                  type="text"
                  name="b_trap_username"
                  style={{ position: 'absolute', top: -9999, left: -9999, opacity: 0, pointerEvents: 'none' }}
                  tabIndex={-1}
                  autoComplete="off"
                />
                <input
                  type="password"
                  name="b_trap_password"
                  style={{ position: 'absolute', top: -9999, left: -9999, opacity: 0, pointerEvents: 'none' }}
                  tabIndex={-1}
                  autoComplete="off"
                />

                {/* Hidden Honeypot Trap */}
                <input
                  type="text"
                  name="website_trap"
                  value={websiteTrap}
                  onChange={(e) => setWebsiteTrap(e.target.value)}
                  style={{ display: 'none' }}
                  tabIndex={-1}
                  autoComplete="off"
                />

                {/* Email Field */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '.06em',
                      color: '#94A3B8',
                      marginBottom: 7,
                    }}
                  >
                    {t('app.auth.email', 'Địa chỉ Email')}
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: 14, color: '#64748B', pointerEvents: 'none' }}>
                      <Mail size={16} />
                    </span>
                    <input
                      type="email"
                      name="fv3d_user_email"
                      required
                      autoComplete="off"
                      readOnly={!emailUnlocked}
                      onFocus={() => setEmailUnlocked(true)}
                      onClick={() => setEmailUnlocked(true)}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('app.auth.emailPh', 'name@company.com')}
                      style={{
                        width: '100%',
                        height: 46,
                        padding: '0 14px 0 42px',
                        background: '#030712', boxShadow: '0 0 0 1000px #030712 inset', colorScheme: 'dark',
                        border: '1px solid #1E293B',
                        borderRadius: 10,
                        color: '#FFFFFF',
                        fontSize: 14,
                        fontFamily: 'inherit',
                        outline: 'none',
                        transition: 'border-color .15s',
                        caretColor: '#4FD1C5',
                      }}
                      onFocusCapture={(e) => {
                        setEmailUnlocked(true);
                        e.currentTarget.style.borderColor = '#4FD1C5';
                      }}
                      onBlur={(e) => (e.currentTarget.style.borderColor = '#1E293B')}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '.06em',
                      color: '#94A3B8',
                      marginBottom: 7,
                    }}
                  >
                    {t('app.auth.password', 'Mật khẩu')}
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: 14, color: '#64748B', pointerEvents: 'none' }}>
                      <Lock size={16} />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="fv3d_user_pass"
                      required
                      autoComplete="new-password"
                      readOnly={!passwordUnlocked}
                      onFocus={() => setPasswordUnlocked(true)}
                      onClick={() => setPasswordUnlocked(true)}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('app.auth.passwordPh', 'Mật khẩu của bạn')}
                      style={{
                        width: '100%',
                        height: 46,
                        padding: '0 44px 0 42px',
                        background: '#030712', boxShadow: '0 0 0 1000px #030712 inset', colorScheme: 'dark',
                        border: '1px solid #1E293B',
                        borderRadius: 10,
                        color: '#FFFFFF',
                        fontSize: 14,
                        fontFamily: 'inherit',
                        outline: 'none',
                        transition: 'border-color .15s',
                        caretColor: '#4FD1C5',
                      }}
                      onFocusCapture={(e) => {
                        setPasswordUnlocked(true);
                        e.currentTarget.style.borderColor = '#4FD1C5';
                      }}
                      onBlur={(e) => (e.currentTarget.style.borderColor = '#1E293B')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: 12,
                        background: 'transparent',
                        border: 'none',
                        color: '#94A3B8',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 4,
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <span style={{ display: 'block', color: '#EF4444', fontSize: 11, marginTop: 4, fontWeight: 500 }}>
                      * {fieldErrors.password}
                    </span>
                  )}
                </div>

                {/* Remember Me & Forgot Password Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94A3B8', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked style={{ accentColor: '#4FD1C5', cursor: 'pointer' }} />
                    <span>{t('app.auth.rememberMe', 'Ghi nhớ đăng nhập')}</span>
                  </label>
                  <button
                    type="button"
                    onClick={openForgotPassword}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#4FD1C5',
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    {t('app.auth.forgotPassword', 'Quên mật khẩu?')}
                  </button>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    height: 48,
                    marginTop: 4,
                    background: '#4FD1C5',
                    color: '#0A0F12',
                    fontWeight: 600,
                    fontSize: 14,
                    borderRadius: 10,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    width: '100%',
                    transition: 'opacity .15s, transform .15s',
                    boxShadow: '0 4px 14px rgba(79, 209, 197, 0.25)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.92')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  {loading ? t('app.auth.loadingSignin', 'Đang xác thực...') : t('app.auth.submitSignin', 'Đăng nhập')}
                  <ArrowRight size={17} />
                </button>

                {/* OR divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '6px 0' }}>
                  <div style={{ flex: 1, height: 1, background: '#1E293B' }} />
                  <span style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    {t('app.auth.orContinueWith', 'Hoặc tiếp tục với')}
                  </span>
                  <div style={{ flex: 1, height: 1, background: '#1E293B' }} />
                </div>

                {/* Google Sign In Button */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  style={{
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    background: '#0B1318',
                    border: '1px solid #1E293B',
                    borderRadius: 10,
                    color: '#E2E8F0',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all .15s',
                    width: '100%',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#4FD1C5';
                    e.currentTarget.style.background = '#111C23';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#1E293B';
                    e.currentTarget.style.background = '#0B1318';
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{t('app.auth.googleSignIn', 'Đăng nhập với Google')}</span>
                </button>
              </form>
            )}

            {/* ── 2. REGISTER FORM ── */}
            {authModalTab === 'register' && (
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Browser autofill traps (off-screen) */}
                <input
                  type="text"
                  name="b_trap_username"
                  style={{ position: 'absolute', top: -9999, left: -9999, opacity: 0, pointerEvents: 'none' }}
                  tabIndex={-1}
                  autoComplete="off"
                />
                <input
                  type="password"
                  name="b_trap_password"
                  style={{ position: 'absolute', top: -9999, left: -9999, opacity: 0, pointerEvents: 'none' }}
                  tabIndex={-1}
                  autoComplete="off"
                />

                {/* Hidden Honeypot Trap */}
                <input
                  type="text"
                  name="website_trap"
                  value={websiteTrap}
                  onChange={(e) => setWebsiteTrap(e.target.value)}
                  style={{ display: 'none' }}
                  tabIndex={-1}
                  autoComplete="off"
                />

                {/* Full Name */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '.06em',
                      color: '#94A3B8',
                      marginBottom: 5,
                    }}
                  >
                    {t('app.auth.nameReg', 'Họ và tên')}
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: 14, color: '#64748B', pointerEvents: 'none' }}>
                      <User size={16} />
                    </span>
                    <input
                      type="text"
                      name="fv3d_reg_fullname"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={locale === 'en' ? 'John Doe' : 'Nguyễn Văn A'}
                      style={{
                        width: '100%',
                        height: 42,
                        padding: '0 14px 0 42px',
                        background: '#030712', boxShadow: '0 0 0 1000px #030712 inset', colorScheme: 'dark',
                        border: '1px solid #1E293B',
                        borderRadius: 10,
                        color: '#FFFFFF',
                        fontSize: 13,
                        fontFamily: 'inherit',
                        outline: 'none',
                        caretColor: '#4FD1C5',
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#4FD1C5')}
                      onBlur={(e) => (e.target.style.borderColor = '#1E293B')}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '.06em',
                      color: '#94A3B8',
                      marginBottom: 5,
                    }}
                  >
                    {t('app.auth.emailReg', 'Địa chỉ Email')}
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: 14, color: '#64748B', pointerEvents: 'none' }}>
                      <Mail size={16} />
                    </span>
                    <input
                      type="email"
                      name="fv3d_reg_email"
                      required
                      autoComplete="off"
                      readOnly={!emailUnlocked}
                      onFocus={() => setEmailUnlocked(true)}
                      onClick={() => setEmailUnlocked(true)}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      style={{
                        width: '100%',
                        height: 42,
                        padding: '0 14px 0 42px',
                        background: '#030712', boxShadow: '0 0 0 1000px #030712 inset', colorScheme: 'dark',
                        border: '1px solid #1E293B',
                        borderRadius: 10,
                        color: '#FFFFFF',
                        fontSize: 13,
                        fontFamily: 'inherit',
                        outline: 'none',
                        caretColor: '#4FD1C5',
                      }}
                      onFocusCapture={(e) => {
                        setEmailUnlocked(true);
                        e.currentTarget.style.borderColor = '#4FD1C5';
                      }}
                      onBlur={(e) => (e.currentTarget.style.borderColor = '#1E293B')}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '.06em',
                      color: '#94A3B8',
                      marginBottom: 5,
                    }}
                  >
                    {locale === 'en' ? 'PASSWORD (6-32 CHARS, NUMBERS & SPECIAL CHAR)' : 'MẬT KHẨU (6-32 KÝ TỰ, GỒM SỐ & KÝ TỰ ĐẶC BIỆT)'}
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: 14, color: '#64748B', pointerEvents: 'none' }}>
                      <Lock size={16} />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="fv3d_reg_pass"
                      required
                      autoComplete="new-password"
                      readOnly={!passwordUnlocked}
                      onFocus={() => setPasswordUnlocked(true)}
                      onClick={() => setPasswordUnlocked(true)}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="FitVision@2026"
                      style={{
                        width: '100%',
                        height: 42,
                        padding: '0 44px 0 42px',
                        background: '#030712', boxShadow: '0 0 0 1000px #030712 inset', colorScheme: 'dark',
                        border: '1px solid #1E293B',
                        borderRadius: 10,
                        color: '#FFFFFF',
                        fontSize: 13,
                        fontFamily: 'inherit',
                        outline: 'none',
                        caretColor: '#4FD1C5',
                      }}
                      onFocusCapture={(e) => {
                        setPasswordUnlocked(true);
                        e.currentTarget.style.borderColor = '#4FD1C5';
                      }}
                      onBlur={(e) => (e.currentTarget.style.borderColor = '#1E293B')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: 12,
                        background: 'transparent',
                        border: 'none',
                        color: '#94A3B8',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 4,
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '.06em',
                      color: '#94A3B8',
                      marginBottom: 5,
                    }}
                  >
                    {t('app.auth.confirm', 'Xác nhận lại mật khẩu')}
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: 14, color: '#64748B', pointerEvents: 'none' }}>
                      <Lock size={16} />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="fv3d_reg_pass_confirm"
                      required
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t('app.auth.confirmPh', 'Nhập lại mật khẩu')}
                      style={{
                        width: '100%',
                        height: 42,
                        padding: '0 14px 0 42px',
                        background: '#030712', boxShadow: '0 0 0 1000px #030712 inset', colorScheme: 'dark',
                        border: '1px solid #1E293B',
                        borderRadius: 10,
                        color: '#FFFFFF',
                        fontSize: 13,
                        fontFamily: 'inherit',
                        outline: 'none',
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#4FD1C5')}
                      onBlur={(e) => (e.target.style.borderColor = '#1E293B')}
                    />
                  </div>
                </div>

                {/* Privacy Terms Checkbox */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, paddingTop: 4 }}>
                  <input
                    type="checkbox"
                    id="terms-fullscreen"
                    checked={termsAgreed}
                    onChange={(e) => setTermsAgreed(e.target.checked)}
                    style={{ width: 16, height: 16, marginTop: 2, accentColor: '#4FD1C5', cursor: 'pointer' }}
                  />
                  <label
                    htmlFor="terms-fullscreen"
                    style={{ fontSize: 12, color: '#94A3B8', cursor: 'pointer', lineHeight: 1.45 }}
                  >
                    {t('app.auth.terms', 'Tôi đồng ý với Điều khoản Sử dụng và Cam kết Bảo vệ Dữ liệu')}
                  </label>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    height: 46,
                    marginTop: 6,
                    background: '#4FD1C5',
                    color: '#0A0F12',
                    fontWeight: 600,
                    fontSize: 14,
                    borderRadius: 10,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    width: '100%',
                    transition: 'opacity .15s',
                    boxShadow: '0 4px 14px rgba(79, 209, 197, 0.25)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.92')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  {loading ? t('app.auth.loadingRegister', 'Đang đăng ký...') : t('app.auth.submitRegister', 'Tạo tài khoản')}
                  <ArrowRight size={17} />
                </button>

                {/* OR divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
                  <div style={{ flex: 1, height: 1, background: '#1E293B' }} />
                  <span style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    {t('app.auth.orContinueWith', 'Hoặc tiếp tục với')}
                  </span>
                  <div style={{ flex: 1, height: 1, background: '#1E293B' }} />
                </div>

                {/* Google Sign In Button */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  style={{
                    height: 42,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    background: '#0B1318',
                    border: '1px solid #1E293B',
                    borderRadius: 10,
                    color: '#E2E8F0',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all .15s',
                    width: '100%',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#4FD1C5';
                    e.currentTarget.style.background = '#111C23';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#1E293B';
                    e.currentTarget.style.background = '#0B1318';
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{t('app.auth.googleSignUp', 'Đăng ký nhanh với Google')}</span>
                </button>
              </form>
            )}

            {/* ── 3. FORGOT PASSWORD VIEW ── */}
            {authModalTab === 'forgot' && (
              <div>
                {forgotStep === 'request' ? (
                  <form onSubmit={handleRequestForgotOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '.06em',
                          color: '#94A3B8',
                          marginBottom: 7,
                        }}
                      >
                        {t('app.auth.forgotEmailLabel', 'Địa chỉ Email cần lấy lại mật khẩu')}
                      </label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <span style={{ position: 'absolute', left: 14, color: '#64748B', pointerEvents: 'none' }}>
                          <Mail size={16} />
                        </span>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@company.com"
                          style={{
                            width: '100%',
                            height: 46,
                            padding: '0 14px 0 42px',
                            background: '#030712', boxShadow: '0 0 0 1000px #030712 inset', colorScheme: 'dark',
                            border: '1px solid #1E293B',
                            borderRadius: 10,
                            color: '#FFFFFF',
                            fontSize: 14,
                            fontFamily: 'inherit',
                            outline: 'none',
                            caretColor: '#4FD1C5',
                          }}
                          onFocus={(e) => (e.target.style.borderColor = '#4FD1C5')}
                          onBlur={(e) => (e.target.style.borderColor = '#1E293B')}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        height: 46,
                        background: '#4FD1C5',
                        color: '#0A0F12',
                        fontWeight: 600,
                        fontSize: 14,
                        borderRadius: 10,
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        marginTop: 4,
                      }}
                    >
                      {loading ? t('app.auth.sendingOtpBtn', 'Đang gửi mã...') : t('app.auth.sendOtpBtn', 'Gửi mã xác nhận OTP')}
                      <ArrowRight size={17} />
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* OTP Field */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#94A3B8' }}>
                          {t('app.auth.otpLabel', 'Mã OTP xác thực (6 số)')}
                        </label>
                        <span style={{ fontSize: 11, color: '#4FD1C5', fontFamily: 'monospace' }}>{locale === 'en' ? 'Check your Gmail inbox' : 'Đã gửi tới Gmail của bạn'}</span>
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="123456"
                        style={{
                          width: '100%',
                          height: 42,
                          padding: '0 14px',
                          background: '#030712', boxShadow: '0 0 0 1000px #030712 inset', colorScheme: 'dark',
                          border: '1px solid #1E293B',
                          borderRadius: 10,
                          color: '#FFFFFF',
                          fontSize: 16,
                          letterSpacing: 4,
                          fontWeight: 700,
                          textAlign: 'center',
                          outline: 'none',
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#4FD1C5')}
                        onBlur={(e) => (e.target.style.borderColor = '#1E293B')}
                      />
                    </div>

                    {/* New Password */}
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#94A3B8', marginBottom: 5 }}>{t('app.auth.newPasswordLabel', 'Mật khẩu mới')}</label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder={t('app.auth.newPasswordPh', 'Nhập mật khẩu mới')}
                        style={{
                          width: '100%',
                          height: 42,
                          padding: '0 14px',
                          background: '#030712', boxShadow: '0 0 0 1000px #030712 inset', colorScheme: 'dark',
                          border: '1px solid #1E293B',
                          borderRadius: 10,
                          color: '#FFFFFF',
                          fontSize: 13,
                          outline: 'none',
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#4FD1C5')}
                        onBlur={(e) => (e.target.style.borderColor = '#1E293B')}
                      />
                    </div>

                    {/* Confirm New Password */}
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#94A3B8', marginBottom: 5 }}>{t('app.auth.confirmNewPasswordLabel', 'Xác nhận mật khẩu mới')}</label>
                      <input
                        type="password"
                        required
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder={t('app.auth.confirmNewPasswordPh', 'Nhập lại mật khẩu mới')}
                        style={{
                          width: '100%',
                          height: 42,
                          padding: '0 14px',
                          background: '#030712', boxShadow: '0 0 0 1000px #030712 inset', colorScheme: 'dark',
                          border: '1px solid #1E293B',
                          borderRadius: 10,
                          color: '#FFFFFF',
                          fontSize: 13,
                          outline: 'none',
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#4FD1C5')}
                        onBlur={(e) => (e.target.style.borderColor = '#1E293B')}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        height: 46,
                        background: '#4FD1C5',
                        color: '#0A0F12',
                        fontWeight: 600,
                        fontSize: 14,
                        borderRadius: 10,
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        marginTop: 6,
                      }}
                    >
                      {loading ? t('app.auth.updatingPasswordBtn', 'Đang cập nhật...') : t('app.auth.updatePasswordBtn', 'Cập nhật mật khẩu')}
                      <ArrowRight size={17} />
                    </button>
                  </form>
                )}

                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <button
                    type="button"
                    onClick={openSignIn}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94A3B8',
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#4FD1C5')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
                  >
                    {t('app.auth.backToSignIn', '← Quay lại Đăng nhập')}
                  </button>
                </div>
              </div>
            )}

            {/* ── 4. VERIFY EMAIL VIEW ── */}
            {authModalTab === 'verify' && (
              <form onSubmit={handleVerifyEmail} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#94A3B8', marginBottom: 7 }}>{t('app.auth.verifyEmailLabel', 'Email cần kích hoạt')}</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      height: 42,
                      padding: '0 14px',
                      background: '#030712', boxShadow: '0 0 0 1000px #030712 inset', colorScheme: 'dark',
                      border: '1px solid #1E293B',
                      borderRadius: 10,
                      color: '#FFFFFF',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#94A3B8' }}>
                      {t('app.auth.verifyOtpLabel', 'Mã kích hoạt OTP (6 chữ số)')}
                    </label>
                    <span style={{ fontSize: 11, color: '#4FD1C5', fontFamily: 'monospace' }}>{locale === 'en' ? 'Check your Gmail inbox' : 'Đã gửi tới Gmail của bạn'}</span>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    style={{
                      width: '100%',
                      height: 44,
                      padding: '0 14px',
                      background: '#030712', boxShadow: '0 0 0 1000px #030712 inset', colorScheme: 'dark',
                      border: '1px solid #1E293B',
                      borderRadius: 10,
                      color: '#4FD1C5',
                      fontSize: 18,
                      letterSpacing: 6,
                      fontWeight: 700,
                      textAlign: 'center',
                      outline: 'none',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#4FD1C5')}
                    onBlur={(e) => (e.target.style.borderColor = '#1E293B')}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    height: 46,
                    background: '#4FD1C5',
                    color: '#0A0F12',
                    fontWeight: 600,
                    fontSize: 14,
                    borderRadius: 10,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    marginTop: 4,
                  }}
                >
                  {loading ? t('app.auth.activatingBtn', 'Đang kích hoạt...') : t('app.auth.activateBtn', 'Kích hoạt tài khoản ngay')}
                  <CheckCircle2 size={17} />
                </button>

                <div style={{ textAlign: 'center', marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={openSignIn}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94A3B8',
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#4FD1C5')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
                  >
                    {t('app.auth.backToSignIn', '← Quay lại Đăng nhập')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

