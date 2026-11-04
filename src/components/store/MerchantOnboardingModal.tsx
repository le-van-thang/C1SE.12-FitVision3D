import React, { useState } from 'react';
import { X, Store as StoreIcon, Phone, MapPin, FileCheck2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';

export const MerchantOnboardingModal: React.FC = () => {
  const {
    isOnboardingModalOpen,
    closeOnboarding,
    applyMerchant,
    currentUser,
  } = useAuth();
  const { t } = useI18n();

  const [brandName, setBrandName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [verificationDoc, setVerificationDoc] = useState('');
  const [websiteTrap, setWebsiteTrap] = useState(''); // Honeypot
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOnboardingModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const res = applyMerchant({
      brandName,
      phone,
      address,
      verificationDoc,
      website_trap: websiteTrap,
    });
    setLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || t('merchant.submitFailed'));
    }
  };

  return (
    <div
      className="zf-modal-backdrop animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'rgba(5, 8, 10, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      onClick={closeOnboarding}
    >
      <div
        className="zf-modal-card zf-modal-card--lg"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 520,
          background: '#11191E',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 18,
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8)',
          color: '#FFFFFF',
          padding: '28px 24px',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent top border */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: 'linear-gradient(90deg, rgba(246, 173, 85, 0.4), #F6AD55, rgba(79, 209, 197, 0.4))',
          }}
        />

        {/* Close button */}
        <button
          type="button"
          onClick={closeOnboarding}
          className="zf-modal-close"
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            width: 32,
            height: 32,
            display: 'grid',
            placeItems: 'center',
            background: 'transparent',
            border: 'none',
            color: '#94A3B8',
            borderRadius: 8,
            cursor: 'pointer',
          }}
          aria-label={t('merchant.close')}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              background: 'rgba(246, 173, 85, 0.12)',
              border: '1px solid rgba(246, 173, 85, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F6AD55',
              flexShrink: 0,
            }}
          >
            <StoreIcon size={24} strokeWidth={2} />
          </div>
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '2px 8px',
                borderRadius: 20,
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '.06em',
                background: 'rgba(246, 173, 85, 0.1)',
                color: '#F6AD55',
                border: '1px solid rgba(246, 173, 85, 0.25)',
                marginBottom: 6,
              }}
            >
              <ShieldCheck size={12} /> {t('merchant.badge')}
            </div>
            <h2 style={{ fontSize: 19, fontWeight: 700, margin: 0, letterSpacing: '-0.01em', color: '#FFFFFF' }}>
              {t('merchant.title')}
            </h2>
            <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, marginBottom: 0, lineHeight: 1.5 }}>
              {t('merchant.subtitle')}
            </p>
          </div>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div
            style={{
              marginBottom: 16,
              padding: '10px 14px',
              borderRadius: 10,
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#FCA5A5',
              fontSize: 12,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1, color: '#F87171' }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Honeypot field (hidden from legitimate users) */}
          <input
            type="text"
            name="website_trap"
            value={websiteTrap}
            onChange={(e) => setWebsiteTrap(e.target.value)}
            style={{ display: 'none' }}
            tabIndex={-1}
            autoComplete="off"
          />

          <div className="zf-input-group" style={{ margin: 0 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94A3B8', marginBottom: 6 }}>
              {t('merchant.brandLabel')} <span style={{ color: '#F6AD55' }}>*</span>
            </label>
            <div className="zf-input-wrap" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span className="zf-input-icon" style={{ position: 'absolute', left: 12, color: '#64748B', pointerEvents: 'none' }}>
                <StoreIcon size={16} />
              </span>
              <input
                type="text"
                required
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder={t('merchant.brandPlaceholder')}
                className="zf-form-input"
                style={{
                  width: '100%',
                  height: 40,
                  padding: '0 12px 0 38px',
                  background: '#0A0F12',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 8,
                  color: '#FFFFFF',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div className="zf-input-group" style={{ margin: 0 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94A3B8', marginBottom: 6 }}>
              {t('merchant.phoneLabel')} <span style={{ color: '#F6AD55' }}>*</span>
            </label>
            <div className="zf-input-wrap" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span className="zf-input-icon" style={{ position: 'absolute', left: 12, color: '#64748B', pointerEvents: 'none' }}>
                <Phone size={16} />
              </span>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('merchant.phonePlaceholder')}
                className="zf-form-input mono"
                style={{
                  width: '100%',
                  height: 40,
                  padding: '0 12px 0 38px',
                  background: '#0A0F12',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 8,
                  color: '#FFFFFF',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>
            <p style={{ fontSize: 11, color: '#64748B', margin: '4px 0 0' }}>
              {t('merchant.phoneHint')}
            </p>
          </div>

          <div className="zf-input-group" style={{ margin: 0 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94A3B8', marginBottom: 6 }}>
              {t('merchant.addressLabel')} <span style={{ color: '#F6AD55' }}>*</span>
            </label>
            <div className="zf-input-wrap" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span className="zf-input-icon" style={{ position: 'absolute', left: 12, color: '#64748B', pointerEvents: 'none' }}>
                <MapPin size={16} />
              </span>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t('merchant.addressPlaceholder')}
                className="zf-form-input"
                style={{
                  width: '100%',
                  height: 40,
                  padding: '0 12px 0 38px',
                  background: '#0A0F12',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 8,
                  color: '#FFFFFF',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div className="zf-input-group" style={{ margin: 0 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94A3B8', marginBottom: 6 }}>
              {t('merchant.docLabel')} <span style={{ color: '#F6AD55' }}>*</span>
            </label>
            <div className="zf-input-wrap" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span className="zf-input-icon" style={{ position: 'absolute', left: 12, color: '#64748B', pointerEvents: 'none' }}>
                <FileCheck2 size={16} />
              </span>
              <input
                type="text"
                required
                value={verificationDoc}
                onChange={(e) => setVerificationDoc(e.target.value)}
                placeholder={t('merchant.docPlaceholder')}
                className="zf-form-input"
                style={{
                  width: '100%',
                  height: 40,
                  padding: '0 12px 0 38px',
                  background: '#0A0F12',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 8,
                  color: '#FFFFFF',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>
            <p style={{ fontSize: 11, color: '#64748B', margin: '4px 0 0' }}>
              {t('merchant.docHint')}
            </p>
          </div>

          <div style={{ paddingTop: 6 }}>
            <button
              type="submit"
              disabled={loading}
              className="zf-btn zf-btn--full"
              style={{
                height: 42,
                background: '#F6AD55',
                color: '#0A0F12',
                fontWeight: 600,
                fontSize: 13,
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
              }}
            >
              {loading ? t('merchant.submitting') : t('merchant.submit')}
              <ArrowRight size={16} />
            </button>
          </div>
        </form>

        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: '#94A3B8' }}>
          <span>{t('merchant.applicant')} <strong style={{ color: '#FFFFFF' }}>{currentUser?.full_name}</strong></span>
          <span>{t('merchant.sla')} <strong style={{ color: '#4FD1C5' }}>{t('merchant.slaValue')}</strong></span>
        </div>
      </div>
    </div>
  );
};
