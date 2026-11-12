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
  } = useAuth();

  const isUser = userRole === 'user' || userRole === 'customer';
  const isStore = userRole === 'store' || userRole === 'tailor' || userRole === 'retailer';
  const isAdmin = userRole === 'admin';

  const pendingStoresCount = stores.filter((s) => s.status === 'PENDING').length;

  return (
    <>
      <header className="h-16 px-4 sm:px-8 border-b-2 border-slate-200 bg-white shadow-xs sticky top-0 z-40 flex items-center justify-between no-print select-none" id="app-navbar">
        {/* Left: Brand Logo (Đồng bộ với sàn thương mại thời trang) */}
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-2.5" id="brand-link">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Scissors size={18} strokeWidth={2} />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-base tracking-tight text-slate-900 leading-none">
                FitVision <span className="text-blue-600">3D</span>
              </span>
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                Atelier & May Đo 3D
              </span>
            </div>
          </a>
        </div>

        {/* Center: Dynamic Role-Based Navigation Links (Phân luồng nghiêm ngặt) */}
        <nav className="hidden md:flex items-center gap-2" aria-label="Main navigation">
          {/* Link Sàn Thời Trang */}
          <Link
            to="/"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
              pathname === '/'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100'
            }`}
            id="nav-store"
          >
            <ShoppingBag size={15} strokeWidth={2} />
            <span>{t('ecommerce.nav.store', 'Sàn Thời Trang')}</span>
          </Link>

          {/* Link Phòng Đo Nhân Trắc Học 3D */}
          <Link
            to="/dashboard"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
              pathname === '/dashboard'
                ? 'bg-slate-900 text-white shadow-xs border-2 border-slate-900'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
            id="nav-dashboard"
          >
            <ScanLine size={15} strokeWidth={2} />
            <span>{t('app.nav.dashboard', 'Phòng Đo 3D')}</span>
          </Link>

          {/* Chỉ hiển thị cho đối tác Nhà May đã được duyệt */}
          {isAuthenticated && isStore && (
            <>
              <Link
                to="/tailor"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                  pathname === '/tailor'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                }`}
                id="nav-tailor"
              >
                <Scissors size={15} strokeWidth={2} />
                <span>{t('app.nav.tailor', 'Studio Nhà May')}</span>
              </Link>
              <Link
                to="/size-charts"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                  pathname === '/size-charts'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                }`}
                id="nav-size-charts"
              >
                <Table2 size={15} strokeWidth={2} />
                <span>{t('app.nav.sizeCharts', 'Bảng Kích Cỡ')}</span>
              </Link>
            </>
          )}

          {/* Chỉ hiển thị cho Admin */}
          {isAuthenticated && isAdmin && (
            <Link
              to="/admin"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                pathname === '/admin'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-purple-50 text-purple-900 border-2 border-purple-300 hover:bg-purple-100'
              }`}
              id="nav-admin"
            >
              <Shield size={14} strokeWidth={2} />
              <span>{t('app.nav.adminShort', 'Quản Trị Sàn')}</span>
              {pendingStoresCount > 0 && (
                <span className="bg-amber-500 text-white text-[10px] font-mono px-1.5 py-0.2 rounded-full">
                  {pendingStoresCount}
                </span>
              )}
            </Link>
          )}
        </nav>

        {/* Right: Quick Demo Data Loader, Language Switcher & Auth */}
        <div className="flex items-center gap-3">
          {/* Nút nạp dữ liệu mẫu */}
          {onDemoMode && (
            <button
              id="btn-demo-mode"
              type="button"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                isDemoMode
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-purple-50 hover:bg-purple-100 text-purple-950 border-2 border-purple-200 shadow-2xs'
              }`}
              onClick={onDemoMode}
            >
              <Sparkles size={14} className={isDemoMode ? 'text-white' : 'text-purple-600'} />
              <span>{isDemoMode ? t('app.nav.demoLoaded', 'Đã nạp mẫu') : t('app.nav.loadDemo', 'Tải dữ liệu mẫu')}</span>
            </button>
          )}

          <LanguageSwitcher compact variant="light" />

          {isAuthenticated ? (
            <UserProfileDropdown />
          ) : (
            <button
              type="button"
              onClick={openSignIn}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs shadow-sm transition-all cursor-pointer"
              id="nav-signin-btn"
            >
              <LogIn size={15} strokeWidth={2.4} />
              <span>{t('app.nav.signIn', 'Đăng Nhập')}</span>
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
