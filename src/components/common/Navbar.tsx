import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ScanLine,
  Scissors,
  Table2,
  Box,
  Shield,
  Store as StoreIcon,
  Clock,
  LogIn,
  AlertTriangle,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';
import { LanguageSwitcher } from './LanguageSwitcher';
import { UserProfileDropdown } from './UserProfileDropdown';
import { AuthModal } from '../auth/AuthModal';
import { MerchantOnboardingModal } from '../store/MerchantOnboardingModal';
import { StoreStatusModal } from '../store/StoreStatusModal';

interface NavbarProps {
  onDemoMode?: () => void;
  isDemoMode?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onDemoMode, isDemoMode = false }) => {
  const { pathname } = useLocation();
  const { t } = useI18n();
  const {
    currentStore,
    isAuthenticated,
    userRole,
    stores,
    openSignIn,
    openOnboarding,
    openStatusModal,
    switchDemoRole,
  } = useAuth();

  const isUser = userRole === 'user' || userRole === 'customer';
  const isStore = userRole === 'store' || userRole === 'tailor' || userRole === 'retailer';
  const isAdmin = userRole === 'admin';

  const pendingStoresCount = stores.filter((s) => s.status === 'PENDING').length;

  return (
    <>
      <header className="zf-nav no-print" id="app-navbar">
        {/* Left: Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <a href="/" className="zf-brand" id="brand-link">
            <span className="zf-brand-mark">
              <Box size={16} strokeWidth={1.5} />
            </span>
            <span>FitVision <b>3D</b></span>
          </a>
        
        </div>

        {/* Center: Dynamic Role-Based Navigation Links */}
        <nav className="zf-links" aria-label="Main navigation">
          {/* Always provide quick link to Storefront */}
          <Link
            to="/"
            className={`zf-link ${pathname === '/' ? 'active' : ''}`}
            id="nav-store"
            style={{
              color: '#38BDF8',
              fontWeight: 700,
            }}
          >
            <ShoppingBag size={16} strokeWidth={1.8} />
            <span>{t('ecommerce.nav.store', 'Sàn Thời Trang')}</span>
          </Link>

          {/* Guest or Regular User Navigation */}
          {(!isAuthenticated || isUser) && (
            <Link
              to="/dashboard"
              className={`zf-link ${pathname === '/dashboard' ? 'active' : ''}`}
              id="nav-dashboard"
            >
              <ScanLine size={16} strokeWidth={1.5} />
              <span>{t('app.nav.dashboard')}</span>
            </Link>
          )}

          {/* Approved Partner Navigation */}
          {isAuthenticated && isStore && (
            <>
              <Link
                to="/dashboard"
                className={`zf-link ${pathname === '/dashboard' ? 'active' : ''}`}
                id="nav-dashboard"
              >
                <ScanLine size={16} strokeWidth={1.5} />
                <span>{t('app.nav.dashboard')}</span>
              </Link>
              <Link
                to="/tailor"
                className={`zf-link ${pathname === '/tailor' ? 'active' : ''}`}
                id="nav-tailor"
              >
                <Scissors size={16} strokeWidth={1.5} />
                <span>{t('app.nav.tailor')}</span>
              </Link>
              <Link
                to="/size-charts"
                className={`zf-link ${pathname === '/size-charts' ? 'active' : ''}`}
                id="nav-size-charts"
              >
                <Table2 size={16} strokeWidth={1.5} />
                <span>{t('app.nav.sizeCharts')}</span>
              </Link>
            </>
          )}

          {/* Admin Navigation */}
          {isAuthenticated && isAdmin && (
            <Link
              to="/admin"
              className={`zf-link ${pathname === '/admin' ? 'active' : ''}`}
              id="nav-admin"
              style={{
                color: '#4FD1C5',
                background: 'rgba(79, 209, 197, 0.12)',
                border: '1px solid rgba(79, 209, 197, 0.3)',
              }}
            >
              <Shield size={16} strokeWidth={1.5} />
              <span>{t('app.nav.adminShort')}</span>
              {pendingStoresCount > 0 && (
                <span
                  style={{
                    background: '#F59E0B',
                    color: '#000',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: 8,
                  }}
                >
                  {pendingStoresCount}
                </span>
              )}
            </Link>
          )}
        </nav>

        {/* Right: Role Switcher & Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
          {/* Quick Demo Role Switcher (Khách | Chủ Shop | Admin) */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '3px 8px',
              borderRadius: 20,
              border: '1px solid rgba(255, 255, 255, 0.15)',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            <span style={{ color: '#94A3B8', fontSize: 10, marginRight: 2 }}>ROLE:</span>
            <button
              type="button"
              onClick={() => switchDemoRole('user')}
              style={{
                padding: '2px 8px',
                borderRadius: 12,
                cursor: 'pointer',
                background: userRole === 'user' ? '#38BDF8' : 'transparent',
                color: userRole === 'user' ? '#0F172A' : '#CBD5E1',
                fontWeight: userRole === 'user' ? 800 : 600,
                border: 'none',
              }}
            >
              Khách
            </button>
            <button
              type="button"
              onClick={() => switchDemoRole('store')}
              style={{
                padding: '2px 8px',
                borderRadius: 12,
                cursor: 'pointer',
                background: userRole === 'store' ? '#F59E0B' : 'transparent',
                color: userRole === 'store' ? '#000' : '#CBD5E1',
                fontWeight: userRole === 'store' ? 800 : 600,
                border: 'none',
              }}
            >
              Chủ Shop
            </button>
            <button
              type="button"
              onClick={() => switchDemoRole('admin')}
              style={{
                padding: '2px 8px',
                borderRadius: 12,
                cursor: 'pointer',
                background: userRole === 'admin' ? '#A855F7' : 'transparent',
                color: userRole === 'admin' ? '#FFF' : '#CBD5E1',
                fontWeight: userRole === 'admin' ? 800 : 600,
                border: 'none',
              }}
            >
              Admin
            </button>
          </div>

          <LanguageSwitcher />

          {onDemoMode && (
            <button
              id="btn-demo-mode"
              className="zf-btn"
              style={{
                height: 36,
                padding: '0 14px',
                fontSize: 12,
                fontWeight: 700,
                background: isDemoMode
                  ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(59, 130, 246, 0.25) 100%)',
                border: isDemoMode ? '1.5px solid #34D399' : '1.5px solid #A855F7',
                color: isDemoMode ? '#FFFFFF' : '#E9D5FF',
                borderRadius: '9px',
                boxShadow: isDemoMode ? '0 0 16px rgba(16, 185, 129, 0.4)' : '0 0 14px rgba(168, 85, 247, 0.3)',
                transition: 'all 0.2s ease',
              }}
              onClick={onDemoMode}
            >
              <Sparkles size={13} style={{ color: isDemoMode ? '#FFFFFF' : '#FDE047' }} />
              <span>{isDemoMode ? t('app.nav.demoLoaded') : t('app.nav.loadDemo')}</span>
            </button>
          )}

          {isAuthenticated ? (
            <UserProfileDropdown />
          ) : (
            <button
              type="button"
              onClick={openSignIn}
              className="zf-btn zf-btn--secondary"
              style={{
                height: 36,
                padding: '0 16px',
                fontSize: 13,
                borderColor: 'rgba(79, 209, 197, 0.4)',
                color: '#4FD1C5',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
              id="nav-signin-btn"
            >
              <LogIn size={15} strokeWidth={2} />
              <span>{t('app.nav.signIn')}</span>
            </button>
          )}
        </div>
      </header>

      {/* Global Modals Mounted from Auth Context */}
      <AuthModal />
      <MerchantOnboardingModal />
      <StoreStatusModal />
    </>
  );
};

export default Navbar;
