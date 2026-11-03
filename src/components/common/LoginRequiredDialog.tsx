import React from 'react';
import { Lock, ArrowLeft, LogIn } from 'lucide-react';
import { useI18n } from '@/i18n';

interface LoginRequiredDialogProps {
  open: boolean;
  /** Feature the guest tried to open, e.g. "Số đo ISO 8559" */
  feature?: string;
  onBack: () => void;
  onSignIn: () => void;
}

/** Notice shown when a guest clicks a locked feature. Offers "Quay lại" and "Đăng nhập". */
export const LoginRequiredDialog: React.FC<LoginRequiredDialogProps> = ({
  open,
  feature,
  onBack,
  onSignIn,
}) => {
  const { t } = useI18n();
  if (!open) return null;

  return (
    <div
      className="animate-fade-in"
      onClick={onBack}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'rgba(3, 7, 18, 0.8)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 420,
          padding: '30px 28px 24px',
          textAlign: 'center',
          background: 'linear-gradient(180deg, #1E293B 0%, #111827 100%)',
          border: '1px solid #334155',
          borderRadius: 20,
          boxShadow: '0 30px 80px -20px rgba(0,0,0,0.9)',
          color: '#FFFFFF',
        }}
      >
        <div
          style={{
            width: 54,
            height: 54,
            margin: '0 auto 16px',
            display: 'grid',
            placeItems: 'center',
            borderRadius: 16,
            color: '#4FD1C5',
            background: 'rgba(79, 209, 197, 0.12)',
            border: '1px solid rgba(79, 209, 197, 0.4)',
            boxShadow: '0 0 28px rgba(79, 209, 197, 0.25)',
          }}
        >
          <Lock size={24} />
        </div>
        <h3 style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>{t('app.gate.title')}</h3>
        <p style={{ margin: '10px 0 0', fontSize: 13.5, lineHeight: 1.6, color: '#94A3B8' }}>
          {feature ? <b style={{ color: '#E2E8F0' }}>{feature}</b> : t('app.gate.generic')} {t('app.gate.desc')}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 24 }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              height: 44,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              borderRadius: 10,
              background: 'transparent',
              border: '1px solid #334155',
              color: '#CBD5E1',
              fontSize: 13.5,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={16} /> {t('app.gate.back')}
          </button>
          <button
            type="button"
            onClick={onSignIn}
            style={{
              height: 44,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #4FD1C5, #38B2AC)',
              color: '#0A0F12',
              fontSize: 13.5,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 8px 20px -6px rgba(79, 209, 197, 0.55)',
            }}
          >
            <LogIn size={16} /> {t('app.gate.signIn')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginRequiredDialog;

