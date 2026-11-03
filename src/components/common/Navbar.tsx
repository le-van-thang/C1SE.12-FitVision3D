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

          {/* Role pill indicator on Navbar */}
          {isAuthenticated && (
            <span
              className={`hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border ${
                isAdmin
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                  : isStore
                  ? 'bg-teal-500/20 text-[#4FD1C5] border-teal-500/30'
                  : currentStore?.status === 'PENDING'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-slate-700/40 text-slate-300 border-slate-600/40'
              }`}
            >
              {isAdmin
                ? t('app.role.admin')
                : isStore
                ? t('app.role.partner')
                : currentStore?.status === 'PENDING'
                ? t('app.role.pendingStore')
                : t('app.role.user')}
            </span>
          )}
        </div>

        {/* Center: Dynamic Role-Based Navigation Links */}
        <nav className="zf-links" aria-label="Main navigation">
          {/* Guest or Standard User navigation */}
          {(!isAuthenticated || isUser) && (
            <>
              <Link
                to="/dashboard"
                className={`zf-link ${pathname === '/dashboard' ? 'active' : ''}`}
                id="nav-dashboard"
              >
                <ScanLine size={16} strokeWidth={1.5} />
                <span>{t('app.nav.dashboard')}</span>
              </Link>

              {/* Standard User Merchant Onboarding trigger */}
              {isUser && !currentStore && (
                <button
                  type="button"
                  onClick={openOnboarding}
                  className="zf-link"
                  style={{
                    color: '#F6AD55',
                    background: 'rgba(246, 173, 85, 0.1)',
                    border: '1px solid rgba(246, 173, 85, 0.25)',
                    cursor: 'pointer',
                  }}
                  id="nav-partner-register"
                >
                  <StoreIcon size={15} strokeWidth={1.5} />
                  <span>{t('app.nav.partner')}</span>
                </button>
              )}

              {/* Pending Store status badge */}
              {isUser && currentStore?.status === 'PENDING' && (
                <button
                  type="button"
                  onClick={openStatusModal}
                  className="zf-link"
                  style={{
                    color: '#F6AD55',
                    background: 'rgba(246, 173, 85, 0.15)',
                    border: '1px solid rgba(246, 173, 85, 0.35)',
                    cursor: 'pointer',
                  }}
                  id="nav-store-pending-badge"
                  title={t('app.nav.pendingTitle')}
                >
                  <Clock size={15} strokeWidth={1.8} className="animate-pulse" />
                  <span>{t('app.nav.pending')}</span>
                </button>
              )}

              {/* Rejected Store status badge */}
              {isUser && currentStore?.status === 'REJECTED' && (
                <button
                  type="button"
                  onClick={openStatusModal}
                  className="zf-link"
                  style={{
                    color: '#F87171',
                    background: 'rgba(248, 113, 113, 0.15)',
                    border: '1px solid rgba(248, 113, 113, 0.35)',
                    cursor: 'pointer',
                  }}
                  id="nav-store-rejected-badge"
                >
                  <AlertTriangle size={15} strokeWidth={1.8} />
                  <span>{t('app.nav.rejected')}</span>
                </button>
              )}
            </>
          )}

          {/* Approved Partner (role === 'store') or Admin: Unlocks B2B Business Tabs */}
          {(isStore || isAdmin) && (
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

          {/* System Admin (role === 'admin'): Unlocks Admin Portal (Store Applications) */}
          {isAdmin && (
            <Link
              to="/admin"
              className={`zf-link ${pathname === '/admin' ? 'active' : ''}`}
              style={{
                color: pathname === '/admin' ? '#FFFFFF' : '#A5B4FC',
                border: '1px solid rgba(165, 180, 252, 0.3)',
                background: pathname === '/admin' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
              }}
              id="nav-admin"
            >
              <Shield size={16} strokeWidth={1.8} />
              <span>{t('app.nav.admin')}</span>
              {pendingStoresCount > 0 && (
                <span
                  style={{
                    background: '#F59E0B',
                    color: '#000000',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 10,
                    marginLeft: 4,
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
