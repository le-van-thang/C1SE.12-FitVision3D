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
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  Scissors,
  Sparkles,
  Plus,
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
  const [websiteTrap, setWebsiteTrap] = useState(''); // Honeypot trap
  const formPaneRef = useRef<HTMLDivElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState<string | null>('chest');
  const [activeStagePreset, setActiveStagePreset] = useState<'front' | 'ease'>('front');

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

  const stageHotspots = [
    {
      id: 'chest',
      top: '28%',
      left: '36%',
      title: isEn ? 'Chest Circumference' : 'Vòng ngực 3D',
      metric: '96.0 cm',
      note: isEn
        ? 'Ramanujan quadratic ellipse scan · +4cm Tailored Ease Allowance'
        : 'Cắt lớp elip Ramanujan · Cộng +4cm độ cử động may đo',
    },
    {
      id: 'shoulder',
      top: '21%',
      left: '63%',
      title: isEn ? 'Shoulder Span' : 'Rộng cầu vai',
      metric: '43.0 cm',
      note: isEn
        ? 'ISO 8559 acromion alignment for crisp collar & sleeve drape'
        : 'Định chuẩn mỏm vai ISO 8559 giúp vai áo đứng phom tự nhiên',
    },
    {
      id: 'waist',
      top: '46%',
      left: '58%',
      title: isEn ? 'Natural Waistline' : 'Vòng eo chuẩn',
      metric: '78.0 cm',
      note: isEn
        ? 'Dynamic posture compensation · Zero-Retention RAM extraction'
        : 'Bù trừ tư thế ngồi/đứng · Ảnh xử lý xong xóa ngay khỏi RAM',
    },
  ];

  const inputBaseClass =
    'w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-950 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition-all';

  return (
    <div className="zf-auth-fullscreen animate-fade-in">
      {/* ── CỘT TRÁI: SPIN PRODUCT COOL-GRAY STUDIO STAGE + FITVISION 3D INTERACTIVE MESH ── */}
      <div className="zf-auth-showcase-pane">
        <div className="zf-auth-grid" />
        <div className="zf-auth-orb" />
        <div className="zf-auth-scan" />

        {/* Top Brand Header (Đồng bộ 100% FitVision 3D Storefront) */}
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/25">
              <Scissors size={19} strokeWidth={2.2} />
            </div>
            <div>
              <span className="font-black text-lg tracking-tight text-[#14171C] block leading-tight">
                FitVision <span className="text-blue-600">3D</span>
              </span>
              <span className="text-[11px] font-medium text-slate-600 block">
                {t('app.auth.engine', 'Atelier & Công cụ phân tích hình thể 3D')}
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-slate-300/80 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-800 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{t('app.auth.isoBadge', 'CHUẨN ISO 8559-1')}</span>
          </div>
        </div>

        {/* Center Stage: Interactive 3D Viewport + Spin Product SVG Connectors & Pulsing + Hotspots */}
        <div className="relative z-10 my-auto w-full space-y-2.5">
          <div className="relative rounded-2xl overflow-hidden bg-[#14171C] border border-slate-300 shadow-xl">
            <MeshViewport
              meshParams={DEMO_MESH}
              measurement={DEMO_MEASUREMENT}
              height={meshHeight}
              zonePillAlign="right"
            />

            {/* Spin-Product Inspired Architectural SVG Connector Lines */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <path
                key={`line-chest-${activeHotspot}`}
                d="M 10 28 H 28 L 36 28"
                fill="none"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth="0.4"
                pathLength={1}
                className="fv-connector-path"
              />
              <path
                key={`line-waist-${activeHotspot}`}
                d="M 90 46 H 70 L 58 46"
                fill="none"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth="0.4"
                pathLength={1}
                className="fv-connector-path"
              />
            </svg>

            {/* Spin-Product Interactive Pulsing + Biometric Hotspots */}
            {stageHotspots.map((hs) => {
              const isSelected = activeHotspot === hs.id;
              const isRightSide = parseFloat(hs.left) > 50;
              return (
                <div
                  key={hs.id}
                  style={{ top: hs.top, left: hs.left }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                  onMouseEnter={() => setActiveHotspot(hs.id)}
                >
                  <button
                    type="button"
                    onClick={() => setActiveHotspot(isSelected ? null : hs.id)}
                    className={`relative w-6 h-6 rounded-full flex items-center justify-center shadow-md border transition-transform cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-white scale-110'
                        : 'bg-white/95 text-[#14171C] border-slate-300 hover:scale-110'
                    }`}
                    aria-label={hs.title}
                  >
                    <span className="absolute inset-0 rounded-full bg-blue-400/50 animate-ping" />
                    <Plus size={12} className={`relative z-10 transition-transform ${isSelected ? 'rotate-45' : ''}`} />
                  </button>

                  {isSelected && (
                    <div
                      className={`hidden xl:block absolute top-1/2 -translate-y-1/2 w-52 p-2.5 bg-white/95 backdrop-blur-md text-slate-900 rounded-lg shadow-xl border border-slate-200 pointer-events-none animate-in fade-in duration-200 ${
                        isRightSide ? 'right-8' : 'left-8'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          {hs.title}
                        </span>
                        <span className="font-mono text-xs font-black text-blue-600">{hs.metric}</span>
                      </div>
                      <p className="text-[10px] text-slate-600 leading-snug">{hs.note}</p>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Top-left Spin Product Corner-Bracket Stage Switcher */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 z-20">
              <button
                type="button"
                onClick={() => {
                  setActiveStagePreset('front');
                  setActiveHotspot('chest');
                }}
                className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer transition-all ${
                  activeStagePreset === 'front'
                    ? 'bg-white text-[#14171C] fv-bracket-active shadow-sm'
                    : 'bg-black/45 text-stone-200 hover:bg-black/65 rounded'
                }`}
              >
                {isEn ? '3D Body Scan' : 'Mô hình 3D'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveStagePreset('ease');
                  setActiveHotspot('waist');
                }}
                className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer transition-all ${
                  activeStagePreset === 'ease'
                    ? 'bg-white text-[#14171C] fv-bracket-active shadow-sm'
                    : 'bg-black/45 text-stone-200 hover:bg-black/65 rounded'
                }`}
              >
                {isEn ? 'Ease Allowance' : 'Độ cử động'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 px-1">
            <span className="flex items-center gap-1.5 font-semibold">
              <Layers size={13} className="text-blue-600" />
              <span>{t('app.auth.topology', 'Lưới 3D hai lớp · Khớp 13 điểm ISO')}</span>
            </span>
            <span className="text-emerald-700 font-bold">
              {t('app.auth.latency', 'Độ trễ < 1.25s')}
            </span>
          </div>
        </div>

        {/* Bottom: Spin-Product Notched Editorial Card with FitVision 3D Stats & Privacy Guarantee */}
        <div className="relative z-10 space-y-3">
          <h2 className="font-display text-xl xl:text-2xl font-bold text-[#14171C] leading-snug">
            {t('app.auth.taglinePre', 'Đo lường chuẩn ')}{' '}
            <span className="text-blue-600 italic">{t('app.auth.taglineHi', 'Nhân Trắc Học 3D')}</span>,{' '}
            {t('app.auth.taglinePost', 'vừa vặn từng đường may.')}
          </h2>

          <div className="grid grid-cols-3 gap-2.5">
            {[
              { v: '±0.8cm', l: t('app.auth.chipError', 'Sai số phép đo') },
              { v: '1.25s', l: t('app.auth.chipSpeed', 'Trích xuất 3D') },
              { v: '0 byte', l: t('app.auth.chipRetention', 'Lưu ảnh máy chủ') },
            ].map((s) => (
              <div key={s.l} className="zf-auth-chip">
                <b>{s.v}</b>
                <small>{s.l}</small>
              </div>
            ))}
          </div>

          <div className="fv-notched-card bg-white/95 border border-slate-200 px-5 py-3.5 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
              <strong className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                {t('app.auth.aboutTitle', 'Cam Kết Quyền Riêng Tư FitVision 3D')}
              </strong>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed m-0">
              {t('app.auth.aboutDesc', 'Nền tảng đo nhân trắc học 3D theo chuẩn ISO 8559-1: trích xuất 13 số đo cơ thể và gợi ý size may đo phù hợp. Ảnh chụp chỉ xử lý trên bộ nhớ tạm RAM và xóa ngay lập tức.')}
            </p>
          </div>
        </div>
      </div>

      {/* ── CỘT PHẢI: EDITORIAL LIGHT FORM PANE (ĐỒNG BỘ MÀU STOREFRONT) ── */}
      <div ref={formPaneRef} className="zf-auth-form-pane">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-4 border-b border-slate-200/80 bg-white/80 backdrop-blur-sm shrink-0">
          <button
            type="button"
            onClick={closeAuthModal}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 hover:text-[#14171C] hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft size={15} />
            <span>{t('app.auth.back', 'Quay lại cửa hàng')}</span>
          </button>

          <LanguageSwitcher size="md" variant="light" />

          <button
            type="button"
            onClick={closeAuthModal}
            className="w-9 h-9 grid place-items-center bg-white border border-slate-200 hover:border-blue-600 rounded-xl text-slate-600 hover:text-[#14171C] cursor-pointer transition-colors"
            aria-label={t('app.auth.close', 'Đóng')}
          >
            <X size={17} />
          </button>
        </div>

        {/* Form Body - Centered */}
        <div className="flex-1 flex flex-col justify-center items-center px-5 py-8 w-full">
          <div className="zf-auth-card w-full">
            {/* Header */}
            <div className="mb-5 text-center">
              <div className="zf-auth-badge">
                {authModalTab === 'forgot' ? (
                  <KeyRound size={20} strokeWidth={2} />
                ) : authModalTab === 'verify' ? (
                  <ShieldCheck size={20} strokeWidth={2} />
                ) : (
                  <Lock size={20} strokeWidth={2} />
                )}
              </div>
              <h1 className="font-display text-2xl font-bold text-[#14171C] tracking-tight m-0">
                {authModalTab === 'signin'
                  ? t('app.auth.signinTitle', 'Đăng nhập FitVision 3D')
                  : authModalTab === 'register'
                  ? t('app.auth.registerTitle', 'Tạo tài khoản mới')
                  : authModalTab === 'forgot'
                  ? t('app.auth.forgotTitle', 'Quên mật khẩu')
                  : t('app.auth.verifyTitle', 'Kích hoạt tài khoản')}
              </h1>
              <p className="text-xs text-slate-500 mt-1.5 mb-0">
                {authModalTab === 'signin'
                  ? t('app.auth.signinDesc', 'Truy cập hồ sơ số đo nhân trắc học & phòng thử đồ 3D')
                  : authModalTab === 'register'
                  ? t('app.auth.registerDesc', 'Tạo tài khoản khách hàng để lưu số đo chuẩn ISO 8559')
                  : authModalTab === 'forgot'
                  ? t('app.auth.forgotDesc', 'Khôi phục mật khẩu tài khoản của bạn qua mã xác nhận OTP')
                  : t('app.auth.verifyDesc', 'Nhập mã OTP 6 số để hoàn tất kích hoạt tài khoản')}
              </p>
            </div>

            {/* Tab Switcher */}
            {(authModalTab === 'signin' || authModalTab === 'register') && (
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 border border-slate-200 rounded-xl mb-5">
                <button
                  type="button"
                  onClick={openSignIn}
                  className={`py-2.5 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    authModalTab === 'signin'
                      ? 'bg-white text-[#14171C] shadow-xs border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-800 bg-transparent border border-transparent'
                  }`}
                >
                  {t('app.auth.tabSignin', 'Đăng nhập')}
                </button>
                <button
                  type="button"
                  onClick={openRegister}
                  className={`py-2.5 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    authModalTab === 'register'
                      ? 'bg-white text-[#14171C] shadow-xs border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-800 bg-transparent border border-transparent'
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
                      className="w-full h-11 pl-10 pr-11 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-950 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 p-1 text-slate-400 hover:text-slate-700 bg-transparent border-0 cursor-pointer flex items-center"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                    <input type="checkbox" defaultChecked className="accent-blue-600 cursor-pointer rounded" />
                    <span>{t('app.auth.rememberMe', 'Ghi nhớ đăng nhập')}</span>
                  </label>
                  <button
                    type="button"
                    onClick={openForgotPassword}
                    className="text-blue-600 hover:text-blue-800 font-semibold text-xs bg-transparent border-0 cursor-pointer p-0"
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
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {t('app.auth.orContinueWith', 'Hoặc tiếp tục với')}
                  </span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                {/* Google Sign In */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="h-11 w-full rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-800 font-semibold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-2xs"
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
              <form onSubmit={handleRegister} className="flex flex-col gap-3.5">
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
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    {t('app.auth.nameReg', 'Họ và tên')}
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                      <User size={15} />
                    </span>
                    <input
                      type="text"
                      name="fv3d_reg_fullname"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={isEn ? 'John Doe' : 'Nguyễn Văn A'}
                      className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-950 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    {t('app.auth.emailReg', 'Địa chỉ Email')}
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400 pointer-events-none">
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
                      className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-950 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    {isEn ? 'PASSWORD (6-32 CHARS, NUMBERS & SPECIAL CHAR)' : 'MẬT KHẨU (6-32 KÝ TỰ, SỐ & KÝ TỰ ĐẶC BIỆT)'}
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                      <Lock size={15} />
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
                      className="w-full h-10 pl-10 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-950 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 p-1 text-slate-400 hover:text-slate-700 bg-transparent border-0 cursor-pointer flex items-center"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    {t('app.auth.confirm', 'Xác nhận lại mật khẩu')}
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                      <Lock size={15} />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="fv3d_reg_pass_confirm"
                      required
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t('app.auth.confirmPh', 'Nhập lại mật khẩu')}
                      className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-950 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Terms */}
                <label className="flex items-start gap-2 pt-0.5 text-[11px] text-slate-600 cursor-pointer select-none">
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
                  className="h-11 mt-1 w-full rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer border-0"
                >
                  <span>{loading ? t('app.auth.loadingRegister', 'Đang đăng ký...') : t('app.auth.submitRegister', 'Tạo tài khoản cá nhân')}</span>
                  <ArrowRight size={16} />
                </button>

                <div className="flex items-center gap-3 my-0.5">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {t('app.auth.orContinueWith', 'Hoặc tiếp tục với')}
                  </span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="h-10 w-full rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-800 font-semibold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-2xs"
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
                        className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-950 font-mono text-base font-bold tracking-[0.35em] text-center focus:bg-white focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        {t('app.auth.newPasswordLabel', 'Mật khẩu mới')}
                      </label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder={t('app.auth.newPasswordPh', 'Nhập mật khẩu mới')}
                        className="w-full h-10 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-950 focus:bg-white focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        {t('app.auth.confirmNewPasswordLabel', 'Xác nhận mật khẩu mới')}
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder={t('app.auth.confirmNewPasswordPh', 'Nhập lại mật khẩu mới')}
                        className="w-full h-10 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-950 focus:bg-white focus:border-blue-600 focus:outline-none"
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
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    {t('app.auth.verifyEmailLabel', 'Email cần kích hoạt')}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-10 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-950 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
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
                    className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 text-blue-700 font-mono text-lg font-bold tracking-[0.4em] text-center focus:bg-white focus:border-blue-600 focus:outline-none"
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

            {/* Editorial Trust Footer inside Auth Card */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-4 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Sparkles size={12} className="text-blue-600" />
                <span>ISO 8559-1</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ShieldCheck size={12} className="text-emerald-600" />
                <span>{isEn ? 'RAM Privacy' : 'Bảo mật RAM'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

