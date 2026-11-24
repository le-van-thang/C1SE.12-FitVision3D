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
      <header className="h-16 px-4 sm:px-8 border-b border-white/10 bg-[#14171C] text-white shadow-sm sticky top-0 z-50 flex items-center justify-between no-print select-none" id="app-navbar">
        {/* Left: Brand Logo (Admin stays inside /admin; others go to storefront) */}
        <div className="flex items-center gap-3">
          <Link to={isAdmin ? '/admin' : '/'} className="flex items-center gap-2.5" id="brand-link">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Scissors size={18} strokeWidth={2.2} />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-base tracking-tight text-white leading-none uppercase">
                FITVISION <span className="text-blue-400">3D</span>
              </span>
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                {isAdmin ? 'Admin Platform Control' : 'Atelier & May Đo 3D'}
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Dynamic Role-Based Navigation Links */}
        <nav className="hidden md:flex items-center gap-2" aria-label="Main navigation">
          {/* Customer / Guest / Store Tabs (Hidden for pure System Admin) */}
          {!isAdmin && (
            <>
              <Link
                to="/"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  pathname === '/'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white/10 text-slate-100 border border-white/15 hover:bg-white/15 hover:text-white'
                }`}
                id="nav-store"
              >
                <ShoppingBag size={15} strokeWidth={2} />
                <span>{t('ecommerce.nav.store', 'Sàn Thời Trang')}</span>
              </Link>

              <Link
                to="/dashboard"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                  pathname === '/dashboard'
                    ? 'bg-[#F5EBD8] text-[#14171C] border border-[#E5D3B3] shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/10 border border-transparent'
                }`}
                id="nav-dashboard"
              >
                <ScanLine size={15} strokeWidth={2} />
                <span>{t('app.nav.dashboard', 'Phòng Đo 3D')}</span>
              </Link>

              <Link
                to="/?openStudio=1"
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-blue-200 bg-blue-500/15 hover:bg-blue-500/25 hover:text-white border border-blue-400/30 transition-all"
                id="nav-virtual-studio"
              >
                <Sparkles size={15} strokeWidth={2} className="text-blue-300" />
                <span>{t('ecommerce.sidebar.virtualTryOn', 'Phòng Thử Đồ 3D')}</span>
              </Link>

              {isAuthenticated && (
                <Link
                  to="/size-charts"
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                    pathname === '/size-charts'
                      ? 'bg-[#F5EBD8] text-[#14171C] border border-[#E5D3B3] shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-white/10 border border-transparent'
                  }`}
                  id="nav-size-charts"
                >
                  <Table2 size={15} strokeWidth={2} />
                  <span>{t('app.nav.sizeCharts', 'Bảng Kích Cỡ')}</span>
                </Link>
              )}
            </>
          )}

          {/* Chỉ hiển thị cho đối tác Chủ Shop / Nhà May đã được duyệt */}
          {isAuthenticated && isStore && (
            <>
              <Link
                to="/shop"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                  pathname === '/shop'
                    ? 'bg-emerald-400 text-[#14171C] shadow-xs'
                    : 'text-emerald-200 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30'
                }`}
                id="nav-shop"
              >
                <StoreIcon size={15} strokeWidth={2} />
                <span>{t('app.nav.shop', 'Kênh Người Bán')}</span>
              </Link>

              <Link
                to="/tailor"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                  pathname === '/tailor'
                    ? 'bg-amber-400 text-[#14171C] shadow-xs'
                    : 'text-amber-200 bg-amber-400/15 hover:bg-amber-400/25 border border-amber-300/30'
                }`}
                id="nav-tailor"
              >
                <Scissors size={15} strokeWidth={2} />
                <span>{t('app.nav.tailor', 'Studio Nhà May')}</span>
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
                  : 'bg-purple-500/20 text-purple-200 border border-purple-400/30 hover:bg-purple-500/30'
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

        {/* Right: Language Switcher & Auth */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <LanguageSwitcher compact variant="dark" />

          {isAuthenticated ? (
            <UserProfileDropdown variant="dark" />
          ) : (
            <button
              type="button"
              onClick={openSignIn}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black text-xs shadow-sm transition-all cursor-pointer"
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
