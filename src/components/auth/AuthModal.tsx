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
  ArrowLeft,
  CheckCircle2,
  Scissors,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { FitVisionAuthShowcase } from './FitVisionAuthShowcase';

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
  const [websiteTrap, setWebsiteTrap] = useState(''); // Honeypot trap
  const formPaneRef = useRef<HTMLDivElement>(null);
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

  // Lock background page scroll while full-screen auth portal is open
  useEffect(() => {
    if (!isAuthModalOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isAuthModalOpen]);

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

  const isEn = locale === 'en';

  const handleGoHome = () => {
    closeAuthModal();
    if (window.location.pathname !== '/') {
      window.location.href = '/';
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const inputBaseClass =
    'w-full h-11 pl-10 pr-4 rounded-xl bg-white border-[1.5px] border-slate-400/80 shadow-2xs text-sm font-medium text-[#14171C] placeholder:text-slate-400 hover:border-slate-500 focus:border-blue-600 focus:outline-none transition-all';

  return (
    <div className="zf-auth-fullscreen animate-fade-in">
      {/* ── UNIFIED TOP STOREFRONT HEADER (#14171C OBSIDIAN) ── */}
      <header className="h-14 sm:h-16 px-4 sm:px-8 bg-[#14171C] text-white border-b border-white/10 flex items-center justify-between gap-4 shrink-0 z-30">
        {/* Left: Clickable FitVision 3D Brand -> Quay lại trang chủ */}
        <button
          type="button"
          onClick={handleGoHome}
          className="flex items-center gap-2.5 group bg-transparent border-0 p-0 text-left cursor-pointer"
          title={isEn ? 'Back to FitVision 3D Storefront' : 'Quay lại trang chủ FitVision 3D'}
        >
          <div className="w-9 h-9 rounded-xl bg-blue-600 group-hover:bg-blue-500 text-white flex items-center justify-center shadow-sm transition-colors">
            <Scissors size={18} strokeWidth={2.2} />
          </div>
          <div>
            <span className="font-black text-base sm:text-lg tracking-tight text-white block leading-none">
              FitVision <span className="text-blue-400">3D</span>
            </span>
            <span className="text-[10px] font-medium text-stone-400 group-hover:text-amber-300 flex items-center gap-1 mt-0.5 transition-colors">
              <ArrowLeft size={10} />
              <span>{t('app.auth.back', 'Quay lại trang chủ')}</span>
            </span>
          </div>
        </button>

        {/* Right: VI/EN + Close Button */}
        <div className="flex items-center gap-2.5">
          <LanguageSwitcher compact variant="dark" />
          <button
            type="button"
            onClick={closeAuthModal}
            className="w-9 h-9 grid place-items-center bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-white cursor-pointer transition-colors"
            aria-label={t('app.auth.close', 'Đóng')}
          >
            <X size={17} />
          </button>
        </div>
      </header>

      {/* ── MAIN SPLIT BODY: 54% LIVE 3D ATELIER STAGE | 46% EDITORIAL FORM SHEET ── */}
      <div className="zf-auth-body">
        <FitVisionAuthShowcase />

        <div ref={formPaneRef} className="zf-auth-form-pane px-6 sm:px-10 py-5 sm:py-6">
          <div className="zf-auth-sheet">
            {/* Editorial Header */}
            <div className="mb-4">
              <h1 className="font-sans text-2xl sm:text-[26px] font-extrabold text-[#14171C] tracking-tight m-0 leading-snug">
                {authModalTab === 'signin'
                  ? t('app.auth.signinTitle', 'Đăng nhập FitVision 3D')
                  : authModalTab === 'register'
                  ? t('app.auth.registerTitle', 'Tạo tài khoản mới')
                  : authModalTab === 'forgot'
                  ? t('app.auth.forgotTitle', 'Quên mật khẩu')
                  : t('app.auth.verifyTitle', 'Kích hoạt tài khoản')}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 mb-0">
                {authModalTab === 'signin'
                  ? t('app.auth.signinDesc', 'Truy cập hồ sơ số đo vóc dáng 3D & phòng thử đồ ảo')
                  : authModalTab === 'register'
                  ? t('app.auth.registerDesc', 'Tạo tài khoản để lưu số đo vóc dáng 3D cá nhân')
                  : authModalTab === 'forgot'
                  ? t('app.auth.forgotDesc', 'Khôi phục mật khẩu tài khoản của bạn qua mã xác nhận OTP')
                  : t('app.auth.verifyDesc', 'Nhập mã OTP 6 số để hoàn tất kích hoạt tài khoản')}
              </p>
            </div>

            {/* Clean Segmented Tab Switcher (Obsidian #14171C Active Tab) */}
            {(authModalTab === 'signin' || authModalTab === 'register') && (
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-200/70 border border-stone-300/60 rounded-xl mb-4">
                <button
                  type="button"
                  onClick={openSignIn}
                  className={`py-2.5 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    authModalTab === 'signin'
                      ? 'bg-[#14171C] text-white shadow-sm'
                      : 'text-slate-600 hover:text-[#14171C] bg-transparent'
                  }`}
                >
                  {t('app.auth.tabSignin', 'Đăng nhập')}
                </button>
                <button
                  type="button"
                  onClick={openRegister}
                  className={`py-2.5 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    authModalTab === 'register'
                      ? 'bg-[#14171C] text-white shadow-sm'
                      : 'text-slate-600 hover:text-[#14171C] bg-transparent'
                  }`}
                >
                  {t('app.auth.tabRegister', 'Tạo tài khoản')}
                </button>
              </div>
            )}

            {/* Success Message Banner */}
            {successMessage && (
              <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
                <span className="font-medium leading-relaxed">{successMessage}</span>
              </div>
            )}

            {/* Error Message Banner */}
            {errorMessage && (
              <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
                <div className="flex-1">
                  <span className="font-medium leading-relaxed">{errorMessage}</span>
                  {(errorMessage.includes('chưa được kích hoạt') ||
                    errorMessage.toLowerCase().includes('activated') ||
                    errorMessage.includes('OTP')) && (
                    <div className="mt-1.5">
                      <button
                        type="button"
                        onClick={() => openVerifyEmail(email)}
                        className="text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer bg-transparent border-0 p-0 text-xs"
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
              <form onSubmit={handleSignIn} className="flex flex-col gap-4">
                {/* Browser autofill & honeypot traps */}
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
                <input
                  type="text"
                  name="website_trap"
                  value={websiteTrap}
                  onChange={(e) => setWebsiteTrap(e.target.value)}
                  style={{ display: 'none' }}
                  tabIndex={-1}
                  autoComplete="off"
                />

                {/* Email */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    {t('app.auth.email', 'Địa chỉ Email')}
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400 pointer-events-none">
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
                      onFocusCapture={() => setEmailUnlocked(true)}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('app.auth.emailPh', 'name@company.com')}
                      className={inputBaseClass}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    {t('app.auth.password', 'Mật khẩu')}
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400 pointer-events-none">
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
                      onFocusCapture={() => setPasswordUnlocked(true)}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('app.auth.passwordPh', 'Mật khẩu của bạn')}
                      className="w-full h-11 pl-10 pr-11 rounded-xl bg-white border-[1.5px] border-slate-400/80 shadow-2xs text-sm font-medium text-[#14171C] placeholder:text-slate-400 hover:border-slate-500 focus:border-blue-600 focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 p-1 text-slate-500 hover:text-[#14171C] bg-transparent border-0 cursor-pointer flex items-center"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 text-slate-700 font-medium cursor-pointer select-none">
                    <input type="checkbox" defaultChecked className="accent-blue-600 cursor-pointer rounded" />
                    <span>{t('app.auth.rememberMe', 'Ghi nhớ đăng nhập')}</span>
                  </label>
                  <button
                    type="button"
                    onClick={openForgotPassword}
                    className="text-blue-600 hover:text-blue-800 font-bold text-xs bg-transparent border-0 cursor-pointer p-0"
                  >
                    {t('app.auth.forgotPassword', 'Quên mật khẩu?')}
                  </button>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={loading}
                  className="h-12 mt-1 w-full rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer border-0"
                >
                  <span>{loading ? t('app.auth.loadingSignin', 'Đang xác thực...') : t('app.auth.submitSignin', 'Đăng nhập ngay')}</span>
                  <ArrowRight size={16} />
                </button>

                {/* OR divider */}
                <div className="flex items-center gap-3 my-1">
                  <div className="flex-1 h-px bg-slate-300/80" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {t('app.auth.orContinueWith', 'Hoặc tiếp tục với')}
                  </span>
                  <div className="flex-1 h-px bg-slate-300/80" />
                </div>

                {/* Google Sign In */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="h-11 w-full rounded-xl bg-white hover:bg-slate-50 border-[1.5px] border-slate-400/85 hover:border-[#14171C] text-[#14171C] font-bold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xs"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>{t('app.auth.googleSignIn', 'Đăng nhập với Google')}</span>
                </button>
              </form>
            )}

            {/* ── 2. REGISTER FORM ── */}
            {authModalTab === 'register' && (
              <form onSubmit={handleRegister} className="flex flex-col gap-3">
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
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    {t('app.auth.nameReg', 'Họ và tên')}
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-500 pointer-events-none">
                      <User size={15} />
                    </span>
                    <input
                      type="text"
                      name="fv3d_reg_fullname"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={isEn ? 'John Doe' : 'Nguyễn Văn A'}
                      className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border-[1.5px] border-slate-400/80 shadow-2xs text-xs sm:text-sm font-medium text-[#14171C] placeholder:text-slate-400 hover:border-slate-500 focus:border-blue-600 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    {t('app.auth.emailReg', 'Địa chỉ Email')}
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-500 pointer-events-none">
                      <Mail size={15} />
                    </span>
                    <input
                      type="email"
                      name="fv3d_reg_email"
                      required
                      autoComplete="off"
                      readOnly={!emailUnlocked}
                      onFocus={() => setEmailUnlocked(true)}
                      onClick={() => setEmailUnlocked(true)}
                      onFocusCapture={() => setEmailUnlocked(true)}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border-[1.5px] border-slate-400/80 shadow-2xs text-xs sm:text-sm font-medium text-[#14171C] placeholder:text-slate-400 hover:border-slate-500 focus:border-blue-600 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Password + Confirm Password Side-by-Side (Clean Ergonomic Layout) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      {isEn ? 'Password (6-32)' : 'Mật khẩu (6-32 ký tự)'}
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-slate-500 pointer-events-none">
                        <Lock size={14} />
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="fv3d_reg_pass"
                        required
                        autoComplete="new-password"
                        readOnly={!passwordUnlocked}
                        onFocus={() => setPasswordUnlocked(true)}
                        onClick={() => setPasswordUnlocked(true)}
                        onFocusCapture={() => setPasswordUnlocked(true)}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="FitVision@2026"
                        className="w-full h-10 pl-9 pr-9 rounded-xl bg-white border-[1.5px] border-slate-400/80 shadow-2xs text-xs sm:text-sm font-medium text-[#14171C] placeholder:text-slate-400 hover:border-slate-500 focus:border-blue-600 focus:outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 p-1 text-slate-500 hover:text-[#14171C] bg-transparent border-0 cursor-pointer flex items-center"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      {t('app.auth.confirm', 'Xác nhận mật khẩu')}
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-slate-500 pointer-events-none">
                        <Lock size={14} />
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="fv3d_reg_pass_confirm"
                        required
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={t('app.auth.confirmPh', 'Nhập lại')}
                        className="w-full h-10 pl-9 pr-3 rounded-xl bg-white border-[1.5px] border-slate-400/80 shadow-2xs text-xs sm:text-sm font-medium text-[#14171C] placeholder:text-slate-400 hover:border-slate-500 focus:border-blue-600 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <label className="flex items-start gap-2 pt-0.5 text-[11px] text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    id="terms-fullscreen"
                    checked={termsAgreed}
                    onChange={(e) => setTermsAgreed(e.target.checked)}
                    className="mt-0.5 accent-blue-600 cursor-pointer rounded"
                  />
                  <span className="leading-snug">
                    {t('app.auth.terms', 'Tôi đồng ý với Điều khoản Sử dụng và Cam kết Bảo vệ Dữ liệu')}
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="h-11 mt-0.5 w-full rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer border-0"
                >
                  <span>{loading ? t('app.auth.loadingRegister', 'Đang đăng ký...') : t('app.auth.submitRegister', 'Tạo tài khoản cá nhân')}</span>
                  <ArrowRight size={16} />
                </button>

                <div className="flex items-center gap-3 my-0.5">
                  <div className="flex-1 h-px bg-slate-300/80" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {t('app.auth.orContinueWith', 'Hoặc tiếp tục với')}
                  </span>
                  <div className="flex-1 h-px bg-slate-300/80" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="h-10.5 py-2.5 w-full rounded-xl bg-white hover:bg-slate-50 border-[1.5px] border-slate-400/85 hover:border-[#14171C] text-[#14171C] font-bold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xs"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>{t('app.auth.googleSignUp', 'Đăng ký nhanh với Google')}</span>
                </button>
              </form>
            )}

            {/* ── 3. FORGOT PASSWORD VIEW ── */}
            {authModalTab === 'forgot' && (
              <div>
                {forgotStep === 'request' ? (
                  <form onSubmit={handleRequestForgotOtp} className="flex flex-col gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        {t('app.auth.forgotEmailLabel', 'Địa chỉ Email cần lấy lại mật khẩu')}
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                          <Mail size={16} />
                        </span>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@company.com"
                          className={inputBaseClass}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="h-11 w-full rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer border-0"
                    >
                      <span>{loading ? t('app.auth.sendingOtpBtn', 'Đang gửi mã...') : t('app.auth.sendOtpBtn', 'Gửi mã xác nhận OTP')}</span>
                      <ArrowRight size={16} />
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleResetPassword} className="flex flex-col gap-3.5">
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                          {t('app.auth.otpLabel', 'Mã OTP xác thực (6 số)')}
                        </label>
                        <span className="text-[11px] font-mono font-semibold text-blue-600">
                          {isEn ? 'Check your Gmail inbox' : 'Đã gửi tới Gmail của bạn'}
                        </span>
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="123456"
                        className="w-full h-11 px-4 rounded-xl bg-white border-[1.5px] border-slate-400/80 shadow-2xs text-[#14171C] font-mono text-base font-bold tracking-[0.35em] text-center focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                        {t('app.auth.newPasswordLabel', 'Mật khẩu mới')}
                      </label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder={t('app.auth.newPasswordPh', 'Nhập mật khẩu mới')}
                        className="w-full h-10 px-4 rounded-xl bg-white border-[1.5px] border-slate-400/80 shadow-2xs text-sm text-[#14171C] focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                        {t('app.auth.confirmNewPasswordLabel', 'Xác nhận mật khẩu mới')}
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder={t('app.auth.confirmNewPasswordPh', 'Nhập lại mật khẩu mới')}
                        className="w-full h-10 px-4 rounded-xl bg-white border-[1.5px] border-slate-400/80 shadow-2xs text-sm text-[#14171C] focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="h-11 mt-1 w-full rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer border-0"
                    >
                      <span>{loading ? t('app.auth.updatingPasswordBtn', 'Đang cập nhật...') : t('app.auth.updatePasswordBtn', 'Cập nhật mật khẩu')}</span>
                      <ArrowRight size={16} />
                    </button>
                  </form>
                )}

                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={openSignIn}
                    className="text-xs font-semibold text-slate-500 hover:text-blue-600 bg-transparent border-0 cursor-pointer"
                  >
                    {t('app.auth.backToSignIn', '← Quay lại Đăng nhập')}
                  </button>
                </div>
              </div>
            )}

            {/* ── 4. VERIFY EMAIL VIEW ── */}
            {authModalTab === 'verify' && (
              <form onSubmit={handleVerifyEmail} className="flex flex-col gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    {t('app.auth.verifyEmailLabel', 'Email cần kích hoạt')}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-10 px-4 rounded-xl bg-white border-[1.5px] border-slate-400/80 shadow-2xs text-sm text-[#14171C] focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      {t('app.auth.verifyOtpLabel', 'Mã kích hoạt OTP (6 chữ số)')}
                    </label>
                    <span className="text-[11px] font-mono font-semibold text-blue-600">
                      {isEn ? 'Check your Gmail inbox' : 'Đã gửi tới Gmail của bạn'}
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full h-11 px-4 rounded-xl bg-white border-[1.5px] border-slate-400/80 shadow-2xs text-blue-700 font-mono text-lg font-bold tracking-[0.4em] text-center focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer border-0"
                >
                  <span>{loading ? t('app.auth.activatingBtn', 'Đang kích hoạt...') : t('app.auth.activateBtn', 'Kích hoạt tài khoản ngay')}</span>
                  <CheckCircle2 size={16} />
                </button>

                <div className="text-center mt-2">
                  <button
                    type="button"
                    onClick={openSignIn}
                    className="text-xs font-semibold text-slate-500 hover:text-blue-600 bg-transparent border-0 cursor-pointer"
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

