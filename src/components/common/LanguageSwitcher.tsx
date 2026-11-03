import React from 'react';
import { Globe } from 'lucide-react';
import { useI18n, type Locale } from '@/i18n';

interface LanguageSwitcherProps {
  /** Slightly larger variant used on full-screen pages */
  size?: 'sm' | 'md';
}

const OPTIONS: Locale[] = ['vi', 'en'];

/** Segmented VI | EN switch. Choice is persisted by I18nProvider (localStorage). */
export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ size = 'sm' }) => {
  const { locale, setLocale, t } = useI18n();
  const h = size === 'md' ? 36 : 32;

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
        background: 'rgba(15, 23, 42, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
      }}
    >
      <Globe size={14} style={{ margin: '0 4px 0 7px', color: '#4FD1C5', flexShrink: 0 }} />
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
              padding: '0 10px',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '.05em',
              fontFamily: 'var(--font-mono)',
              background: active ? '#4FD1C5' : 'transparent',
              color: active ? '#0A0F12' : '#94A3B8',
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

