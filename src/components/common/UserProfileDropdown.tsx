import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  ChevronDown,
  LogOut,
  Shield,
  Store as StoreIcon,
  Clock,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';
import { useNavigate } from 'react-router-dom';

export const UserProfileDropdown: React.FC<{ variant?: 'light' | 'dark' }> = ({ variant = 'dark' }) => {
  const {
    currentUser,
    currentStore,
    signOut,
    openOnboarding,
    openStatusModal,
  } = useAuth();

  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const isLight = variant === 'light';

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) return null;

  const role = currentUser.role;
  const isPendingStore = currentStore?.status === 'PENDING';
  const isApprovedStore = role === 'store' || currentStore?.status === 'APPROVED';

  const roleLabel =
    role === 'admin'
      ? t('app.role.admin')
      : isApprovedStore
      ? t('app.role.partner')
      : isPendingStore
      ? t('app.role.pendingStore')
      : t('app.role.user');

  const roleBadgeStyle: React.CSSProperties = isLight
    ? role === 'admin'
      ? { background: '#EEF2FF', color: '#4F46E5', borderColor: '#C7D2FE' }
      : isApprovedStore
      ? { background: '#ECFDF5', color: '#059669', borderColor: '#A7F3D0' }
      : isPendingStore
      ? { background: '#FFFBEB', color: '#D97706', borderColor: '#FDE68A' }
      : { background: '#F5F5F4', color: '#57534E', borderColor: '#E7E5E4' }
    : role === 'admin'
      ? { background: 'rgba(99, 102, 241, 0.2)', color: '#A5B4FC', borderColor: 'rgba(99, 102, 241, 0.35)' }
      : isApprovedStore
      ? { background: 'rgba(79, 209, 197, 0.2)', color: '#4FD1C5', borderColor: 'rgba(79, 209, 197, 0.35)' }
      : isPendingStore
      ? { background: 'rgba(246, 173, 85, 0.2)', color: '#FCD34D', borderColor: 'rgba(246, 173, 85, 0.35)' }
      : { background: 'rgba(100, 116, 139, 0.3)', color: '#CBD5E1', borderColor: 'rgba(100, 116, 139, 0.4)' };

  const initial = (currentUser.full_name || 'U').charAt(0).toUpperCase();

  return (
    <div style={{ position: 'relative', display: 'inline-block', textAlign: 'left' }} ref={dropdownRef}>
      {/* Pill trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          height: 36,
          padding: '0 12px 0 6px',
          borderRadius: 999,
          background: isLight ? '#FFFFFF' : '#162229',
          border: isLight ? '1px solid #E7E5E4' : '1px solid rgba(255, 255, 255, 0.12)',
          color: isLight ? '#1C1917' : '#FFFFFF',
          fontSize: 12,
          fontWeight: 500,
          cursor: 'pointer',
          boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.3)',
          userSelect: 'none',
        }}
        id="user-profile-pill"
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: isLight ? '#EFF6FF' : 'rgba(79, 209, 197, 0.2)',
            border: isLight ? '1px solid #BFDBFE' : '1px solid rgba(79, 209, 197, 0.4)',
            color: isLight ? '#1D4ED8' : '#4FD1C5',
            fontWeight: 700,
            fontSize: 11,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {initial}
        </div>
        <span style={{ fontWeight: 600, color: isLight ? '#1C1917' : '#FFFFFF', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {currentUser.full_name}
        </span>
        <span
          style={{
            padding: '2px 8px',
            borderRadius: 20,
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '.06em',
            border: '1px solid',
            ...roleBadgeStyle,
          }}
        >
          {roleLabel}
        </span>
        <ChevronDown size={14} style={{ color: isLight ? '#78716C' : '#94A3B8', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
      </button>

      {/* Floating Dropdown */}
      {isOpen && (
        <div
          className={isLight ? "zf-dropdown-menu--light animate-fade-in" : "zf-dropdown-menu animate-fade-in"}
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: 300,
            background: isLight ? '#FFFFFF' : '#11191E',
            border: isLight ? '1px solid #E7E5E4' : '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 16,
            boxShadow: isLight ? '0 20px 45px -10px rgba(28, 25, 23, 0.15)' : '0 20px 45px -10px rgba(0, 0, 0, 0.85)',
            padding: 16,
            color: isLight ? '#1C1917' : '#FFFFFF',
            zIndex: 1000,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          {/* User Details Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingBottom: 12, borderBottom: isLight ? '1px solid #F5F5F4' : '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: isLight ? '#EFF6FF' : 'linear-gradient(135deg, rgba(79, 209, 197, 0.3), rgba(38, 53, 107, 0.4))',
                border: isLight ? '1px solid #BFDBFE' : '1px solid rgba(79, 209, 197, 0.4)',
                color: isLight ? '#1D4ED8' : '#4FD1C5',
                fontWeight: 700,
                fontSize: 15,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {initial}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: isLight ? '#1C1917' : '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser.full_name}
              </div>
              <div style={{ fontSize: 11, color: isLight ? '#78716C' : '#94A3B8', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser.email}
              </div>
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    padding: '2px 7px',
                    borderRadius: 20,
                    fontSize: 9,
                    fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                    letterSpacing: '.06em',
                    border: '1px solid',
                    ...roleBadgeStyle,
                  }}
                >
                  {roleLabel}
                </span>
                {currentStore && (
                  <span style={{ fontSize: 11, color: isLight ? '#2563EB' : '#4FD1C5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    • {currentStore.brand_name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Role Status Shortcuts */}
          <div style={{ padding: '10px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {role === 'user' && !currentStore && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  openOnboarding();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: isLight ? '#FEF3C7' : 'rgba(246, 173, 85, 0.1)',
                  border: isLight ? '1px solid #FDE68A' : '1px solid rgba(246, 173, 85, 0.3)',
                  color: isLight ? '#B45309' : '#FCD34D',
                  fontSize: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <StoreIcon size={14} />
                  <span>{t('app.menu.partner')}</span>
                </span>
                <span style={{ fontSize: 9, textTransform: 'uppercase', fontFamily: 'var(--font-mono)', fontWeight: 700, background: isLight ? '#FDE68A' : 'rgba(246, 173, 85, 0.2)', padding: '2px 5px', borderRadius: 4 }}>
                  B2B
                </span>
              </button>
            )}

            {isPendingStore && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  openStatusModal();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: isLight ? '#FEF3C7' : 'rgba(246, 173, 85, 0.12)',
                  border: isLight ? '1px solid #FDE68A' : '1px solid rgba(246, 173, 85, 0.3)',
                  color: isLight ? '#B45309' : '#FCD34D',
                  fontSize: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={14} className="animate-pulse" />
                  <span>{t('app.menu.pending')}</span>
                </span>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)' }}>{t('app.menu.details')}</span>
              </button>
            )}

            {currentStore?.status === 'REJECTED' && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  openStatusModal();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.12)',
                  border: isLight ? '1px solid #FECACA' : '1px solid rgba(239, 68, 68, 0.3)',
                  color: isLight ? '#DC2626' : '#F87171',
                  fontSize: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={14} />
                  <span>{t('app.menu.rejected')}</span>
                </span>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)' }}>{t('app.menu.details')}</span>
              </button>
            )}

            {role === 'admin' && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/admin');
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: isLight ? '#EEF2FF' : 'rgba(99, 102, 241, 0.15)',
                  border: isLight ? '1px solid #C7D2FE' : '1px solid rgba(99, 102, 241, 0.3)',
                  color: isLight ? '#4F46E5' : '#A5B4FC',
                  fontSize: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Shield size={14} />
                  <span>{t('app.nav.admin')}</span>
                </span>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)' }}>{t('app.menu.open')}</span>
              </button>
            )}
          </div>

          {/* Sign Out Button */}
          <div style={{ paddingTop: 8, borderTop: isLight ? '1px solid #F5F5F4' : '1px solid rgba(255, 255, 255, 0.08)' }}>
            <button
              type="button"
              onClick={() => {
                signOut();
                setIsOpen(false);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '8px 0',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                color: '#EF4444',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'background .15s',
              }}
            >
              <LogOut size={14} />
              <span>{t('app.menu.signOut')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
