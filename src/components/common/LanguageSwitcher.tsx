import React from 'react';
import { Globe } from 'lucide-react';
import { useI18n, type Locale } from '@/i18n';

interface LanguageSwitcherProps {
  /** Slightly larger variant used on full-screen pages */
  size?: 'sm' | 'md';
  /** Color theme: light for Atelier luxury storefront, dark for lab/dashboard */
  variant?: 'light' | 'dark';
}

const OPTIONS: Locale[] = ['vi', 'en'];

/** Segmented VI | EN switch. Choice is persisted by I18nProvider (localStorage). */
export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ size = 'sm', variant = 'light' }) => {
  const { locale, setLocale, t } = useI18n();
  const h = size === 'md' ? 36 : 32;
  const isLight = variant === 'light';

  return (
    <div
      role="group"
      aria-label={t('app.lang.label')}
      title={t('app.lang.label')}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        height: h,
        padding: 3,
        borderRadius: 999,
        background: isLight ? '#F5F5F4' : 'rgba(15, 23, 42, 0.7)',
        border: isLight ? '1px solid #E7E5E4' : '1px solid rgba(255, 255, 255, 0.12)',
      }}
    >
      <Globe size={14} style={{ margin: '0 4px 0 7px', color: isLight ? '#2563EB' : '#4FD1C5', flexShrink: 0 }} />
      {OPTIONS.map((code) => {
        const active = locale === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            aria-pressed={active}
            title={t(`app.lang.${code}`)}
            style={{
              height: '100%',
              padding: '0 9px',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '.05em',
              fontFamily: 'var(--font-mono)',
              background: active ? (isLight ? '#FFFFFF' : '#4FD1C5') : 'transparent',
              color: active ? (isLight ? '#1C1917' : '#0A0F12') : (isLight ? '#78716C' : '#94A3B8'),
              boxShadow: active && isLight ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              transition: 'background .15s, color .15s',
            }}
          >
            {code.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
};

export default LanguageSwitcher;

