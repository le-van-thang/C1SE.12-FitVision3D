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

        {/* Right: Auth Profile Pill or Sleek Sign In Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
          <LanguageSwitcher />

          {onDemoMode && (
            <button
              id="btn-demo-mode"
              className="zf-btn zf-btn--secondary"
              style={{ height: 34, fontSize: 12 }}
              onClick={onDemoMode}
            >
              {isDemoMode ? t('app.nav.demoLoaded') : t('app.nav.loadDemo')}
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
