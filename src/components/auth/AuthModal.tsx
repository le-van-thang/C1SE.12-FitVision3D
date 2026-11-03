import React, { useState, useEffect } from 'react';
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
    signIn,
    register,
  } = useAuth();
  const { t } = useI18n();

  // Inputs strictly initialized to EMPTY strings (user types everything)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(true);
  const [websiteTrap, setWebsiteTrap] = useState(''); // Honeypot trap
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Anti-autofill: keep readOnly until user explicitly focuses or clicks
  const [emailUnlocked, setEmailUnlocked] = useState(false);
  const [passwordUnlocked, setPasswordUnlocked] = useState(false);

  // Reset inputs and unlock flags whenever the modal opens or tab switches
  useEffect(() => {
    setEmail('');
    setPassword('');
    setFullName('');
    setConfirmPassword('');
    setErrorMessage(null);
    setEmailUnlocked(false);
    setPasswordUnlocked(false);
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

  if (!isAuthModalOpen) return null;

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const res = signIn(email, password, websiteTrap);
    setLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || t('app.auth.failSignin'));
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const res = register({
      fullName,
      email,
      password,
      confirmPassword,
      termsAgreed,
      website_trap: websiteTrap,
    });
    setLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || t('app.auth.failRegister'));
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
      <div className="zf-auth-form-pane">
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
                <Lock size={22} strokeWidth={2} />
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                {authModalTab === 'signin' ? t('app.auth.signinTitle') : t('app.auth.registerTitle')}
              </h1>
              <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 8, marginBottom: 0 }}>
                {authModalTab === 'signin'
                  ? t('app.auth.signinDesc')
                  : t('app.auth.registerDesc')}
              </p>
            </div>

            {/* Tab Switcher */}
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
                {t('app.auth.tabSignin')}
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
                {t('app.auth.tabRegister')}
              </button>
            </div>

            {/* Error Message */}
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
                <span>{errorMessage}</span>
              </div>
            )}

            {/* ── SIGN IN FORM ── */}
            {authModalTab === 'signin' ? (
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

                {/* Email Field (Strictly empty, no prefill, browser autofill disabled) */}
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
                    {t('app.auth.email')}
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
                      placeholder={t('app.auth.emailPh')}
                      style={{
                        width: '100%',
                        height: 46,
                        padding: '0 14px 0 42px',
                        background: '#030712',
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

                {/* Password Field (Strictly empty, no prefill) */}
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
                    {t('app.auth.password')}
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
                      placeholder={t('app.auth.passwordPh')}
                      style={{
                        width: '100%',
                        height: 46,
                        padding: '0 44px 0 42px',
                        background: '#030712',
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
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    height: 48,
                    marginTop: 8,
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
                  {loading ? t('app.auth.loadingSignin') : t('app.auth.submitSignin')}
                  <ArrowRight size={17} />
                </button>
              </form>
            ) : (
              /* ── REGISTER FORM ── */
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
                    {t('app.auth.fullName')}
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: 14, color: '#64748B', pointerEvents: 'none' }}>
                      <User size={16} />
                    </span>
                    <input
                      type="text"
                      name="fv3d_reg_fullname"
                      required
                      autoComplete="off"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t('app.auth.fullNamePh')}
                      style={{
                        width: '100%',
                        height: 42,
                        padding: '0 14px 0 42px',
                        background: '#030712',
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

                {/* Email Address */}
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
                    {t('app.auth.emailReg')}
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
                        background: '#030712',
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
                    {t('app.auth.passwordReg')}
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
                        background: '#030712',
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
                    {t('app.auth.confirm')}
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
                      placeholder={t('app.auth.confirmPh')}
                      style={{
                        width: '100%',
                        height: 42,
                        padding: '0 14px 0 42px',
                        background: '#030712',
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
                    {t('app.auth.terms')}
                  </label>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    height: 46,
                    marginTop: 8,
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
                  {loading ? t('app.auth.loadingRegister') : t('app.auth.submitRegister')}
                  <ArrowRight size={17} />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
