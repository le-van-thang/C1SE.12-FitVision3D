import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Sparkles,
  Camera,
  Scissors,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight,
  Ruler,
  ShieldCheck,
  Search,
  Star,
  User as UserIcon,
  LogIn,
  Store,
  Layers,
  HelpCircle,
  Menu,
  X,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { MOCK_PRODUCTS, INITIAL_USER_BODY } from './mockProducts';
import { calculateProductFit } from './fitCalculator';
import { FitAnalysisDrawer } from './FitAnalysisDrawer';
import { SmartCartDrawer } from './SmartCartDrawer';
import { QuickBiometricModal } from './QuickBiometricModal';
import type { FashionProduct, ProductVariant, UserBodyProfile, CartItem } from './types';
import { useAuth } from '@/context/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { MerchantOnboardingModal } from '@/components/store/MerchantOnboardingModal';
import { UserProfileDropdown } from '@/components/common/UserProfileDropdown';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { useI18n } from '@/i18n';

export const FashionStoreHome: React.FC = () => {
  const { isAuthenticated, userRole, openSignIn, openOnboarding } = useAuth();
  const { t, locale } = useI18n();

  // State
  const [userBody, setUserBody] = useState<UserBodyProfile>(() => {
    const saved = sessionStorage.getItem('fv3d_user_body');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_USER_BODY;
  });

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterByMyFitOnly, setFilterByMyFitOnly] = useState<boolean>(false);

  // Cart
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Drawers & Modals
  const [analysisProduct, setAnalysisProduct] = useState<FashionProduct | null>(null);
  const [analysisVariant, setAnalysisVariant] = useState<ProductVariant | null>(null);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState<boolean>(false);
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Save body changes
  const handleSaveBody = (newBody: UserBodyProfile) => {
    setUserBody(newBody);
    sessionStorage.setItem('fv3d_user_body', JSON.stringify(newBody));
  };

  // Pre-calculate fit scores for all products
  const productsWithFit = useMemo(() => {
    return MOCK_PRODUCTS.map((prod) => {
      const fit = calculateProductFit(userBody, prod);
      const recommendedVariant =
        prod.variants.find((v) => v.size_label === fit.recommended_size) || prod.variants[0];
      return {
        ...prod,
        fitResult: fit,
        recommendedVariant,
      };
    });
  }, [userBody]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return productsWithFit.filter((item) => {
      const matchCat = activeCategory === 'all' || item.category === activeCategory;
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.fabric_material.toLowerCase().includes(searchQuery.toLowerCase());
      const matchFit = !filterByMyFitOnly || item.fitResult.match_percentage >= 90;
      return matchCat && matchSearch && matchFit;
    });
  }, [productsWithFit, activeCategory, searchQuery, filterByMyFitOnly]);

  // Cart Actions
  const handleAddToCart = (product: FashionProduct, variant?: ProductVariant) => {
    const targetVariant = variant || product.variants[0];
    const fit = calculateProductFit(userBody, product);

    setCartItems((prev) => {
      const existing = prev.find(
        (ci) => ci.product.id === product.id && ci.variant.id === targetVariant.id
      );
      if (existing) {
        return prev.map((ci) =>
          ci.id === existing.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [
        ...prev,
        {
          id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          product,
          variant: targetVariant,
          quantity: 1,
          fit_score: fit.match_percentage,
          is_ai_recommended: targetVariant.size_label === fit.recommended_size,
        },
      ];
    });

    setIsCartOpen(true);
  };

  const handleOpenAnalysis = (product: FashionProduct) => {
    const fit = calculateProductFit(userBody, product);
    const variant =
      product.variants.find((v) => v.size_label === fit.recommended_size) || product.variants[0];
    setAnalysisProduct(product);
    setAnalysisVariant(variant);
    setIsAnalysisOpen(true);
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#1C1917] font-sans flex flex-col antialiased selection:bg-blue-100 selection:text-blue-900 pb-20 md:pb-0">
      
      {/* ── TOP ANNOUNCEMENT BAR (LUXURY ATELIER PERKS) ── */}
      <aside
        aria-label="Announcement"
        style={{ backgroundColor: '#1E3A8A', color: '#FFFFFF' }}
        className="text-white text-[11px] md:text-xs py-2 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-2 shadow-xs"
      >
        <Sparkles size={14} className="text-amber-300 animate-pulse flex-shrink-0" />
        <span>
          {t('ecommerce.announcement.text', 'Trải nghiệm may đo thông minh 3D & gợi ý size chính xác chuẩn ISO 8559-1 • Miễn phí vận chuyển toàn quốc')}
        </span>
      </aside>

      {/* ── ATELIER LIGHT NAVBAR ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <a href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm group-hover:bg-blue-700 transition-colors">
                <Scissors size={18} strokeWidth={2} />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base md:text-lg tracking-tight text-stone-900 flex items-center gap-1">
                  FitVision <span className="text-blue-600">3D</span>
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-stone-400 -mt-1 hidden sm:block">
                  {t('ecommerce.nav.brandSub', 'Atelier & 3D Sizing')}
                </span>
              </div>
            </a>
          </div>

          {/* Center Navigation Links (Desktop Segmented Control) */}
          <nav className="hidden lg:flex items-center gap-1 p-1 bg-stone-100 rounded-full border border-stone-200/80 text-xs font-semibold">
            {[
              { id: 'all', label: t('ecommerce.nav.all', 'Bộ Sưu Tập') },
              { id: 'shirt', label: t('ecommerce.nav.shirt', 'Áo Sơ Mi Nam') },
              { id: 'polo', label: t('ecommerce.nav.polo', 'Áo Polo Lụa') },
              { id: 'pants', label: t('ecommerce.nav.pants', 'Quần Tây Ý') },
              { id: 'dress', label: t('ecommerce.nav.dress', 'Đầm Lụa Nữ') },
            ].map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-stone-900 font-bold shadow-xs border border-stone-200/70'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-white/50 border border-transparent'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
            <a
              href="/dashboard"
              className="px-3 py-1.5 rounded-full text-stone-600 hover:text-blue-600 hover:bg-white/50 flex items-center gap-1 transition-all"
            >
              <span>{t('ecommerce.nav.lab3d', 'Phòng Lab Đo 3D')}</span>
              <span className="text-[9px] px-1 py-0.2 bg-blue-50 text-blue-700 font-bold rounded border border-blue-200">
                ISO
              </span>
            </a>
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Quick Biometrics Status Pill (Desktop) */}
            <button
              type="button"
              onClick={() => setIsBiometricModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-white hover:bg-stone-50 border border-stone-200 text-xs font-medium text-stone-700 shadow-2xs transition-all cursor-pointer"
              title={t('ecommerce.nav.biometricTooltip', 'Xem và chỉnh sửa số đo cơ thể')}
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              <span className="font-mono text-[11px] text-stone-900 font-semibold whitespace-nowrap">
                {userBody.height_cm}cm • {userBody.weight_kg}kg
              </span>
              <span className="hidden xl:inline text-stone-400 text-[10px] whitespace-nowrap">
                | {t('ecommerce.nav.chestSuffix', 'Ngực')} {userBody.chest_cm}cm
              </span>
            </button>

            {/* Shopping Cart Button */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200/70 border border-stone-200/80 text-stone-700 transition-all flex items-center justify-center cursor-pointer flex-shrink-0"
              aria-label={t('ecommerce.nav.cart', 'Giỏ hàng')}
            >
              <ShoppingBag size={18} />
              {totalCartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shadow">
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* Auth Button or User Profile */}
            {isAuthenticated ? (
              <UserProfileDropdown variant="light" />
            ) : (
              <button
                type="button"
                onClick={openSignIn}
                style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-blue-500/30 transition-all cursor-pointer group flex-shrink-0"
              >
                <LogIn size={14} className="text-white group-hover:scale-110 transition-transform flex-shrink-0" />
                <span className="whitespace-nowrap">{t('ecommerce.nav.login', 'Đăng Nhập')}</span>
              </button>
            )}

            {/* Compact Single Toggle Language Switcher (🌐 VI / 🌐 EN) */}
            <div className="flex-shrink-0">
              <LanguageSwitcher compact variant="light" />
            </div>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-stone-100 text-stone-700 cursor-pointer flex-shrink-0"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-stone-200 bg-white p-4 space-y-3 animate-in slide-in-from-top-2">
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('all');
                  setIsMobileMenuOpen(false);
                }}
                className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-left cursor-pointer"
              >
                {t('ecommerce.nav.allProducts', 'Tất Cả Sản Phẩm')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('shirt');
                  setIsMobileMenuOpen(false);
                }}
                className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-left cursor-pointer"
              >
                {t('ecommerce.nav.shirt', 'Áo Sơ Mi Nam')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('polo');
                  setIsMobileMenuOpen(false);
                }}
                className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-left cursor-pointer"
              >
                {t('ecommerce.nav.polo', 'Áo Polo Lụa')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('pants');
                  setIsMobileMenuOpen(false);
                }}
                className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-left cursor-pointer"
              >
                {t('ecommerce.nav.pants', 'Quần Tây May Đo')}
              </button>
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsBiometricModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="text-xs font-semibold text-blue-600 flex items-center gap-1 cursor-pointer"
              >
                <Ruler size={14} />
                <span>{t('ecommerce.mobileNav.measurements', 'Số đo')}: {userBody.height_cm}cm / {userBody.weight_kg}kg</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  openOnboarding();
                  setIsMobileMenuOpen(false);
                }}
                className="text-xs font-semibold text-stone-600 flex items-center gap-1 cursor-pointer"
              >
                <Store size={14} />
                <span>{t('ecommerce.nav.merchantRegister', 'Mở Gian Hàng B2B')}</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO SECTION (EDITORIAL THESIS - FRONTEND-DESIGN) ── */}
      <section className="relative overflow-hidden bg-white border-b border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Thesis & Value Prop */}
            <div className="lg:col-span-7 space-y-6 text-left">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-900 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                <span>{t('ecommerce.hero.badge', 'Sàn Thời Trang 3D Chuẩn Nhân Trắc Học ISO 8559-1')}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-stone-900 leading-[1.2] sm:leading-[1.18]">
                {t('ecommerce.hero.title1', 'Thời Trang Vừa Vặn')} <br className="hidden sm:inline" />
                <span className="text-blue-600">{t('ecommerce.hero.titleHighlight', 'Tuyệt Đối')}</span> {t('ecommerce.hero.title2', 'Từng Centimet.')}
              </h1>

              <p className="text-stone-600 text-sm sm:text-base leading-relaxed max-w-xl">
                {t('ecommerce.hero.desc', 'Không còn nỗi lo chọn nhầm size hay phiền phức đổi trả. Thuật toán Trí Tuệ Nhân Tạo tự động phân tích vóc dáng và so khớp độ cử động (Ease Allowance) với từng đường kim mũi chỉ của nhà may.')}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="/dashboard"
                  style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
                  className="px-6 py-3.5 rounded-xl hover:bg-blue-700 active:scale-95 text-white font-semibold text-sm shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all"
                >
                  <Camera size={16} className="text-white" />
                  <span>{t('ecommerce.hero.ctaScan', 'Quét Vóc Dáng Bằng AI')}</span>
                  <ChevronRight size={16} className="text-white" />
                </a>

                <a
                  href="#catalog"
                  className="px-6 py-3.5 rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-800 font-semibold text-sm border border-stone-300 transition-all"
                >
                  {t('ecommerce.hero.ctaExplore', 'Khám Phá Bộ Sưu Tập')}
                </a>

                <button
                  type="button"
                  onClick={openOnboarding}
                  className="px-4 py-3.5 rounded-xl bg-transparent hover:bg-stone-100 text-stone-600 hover:text-stone-900 text-xs font-semibold border border-transparent hover:border-stone-200 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Store size={14} className="text-stone-500" />
                  <span>{t('ecommerce.hero.ctaMerchant', 'Đăng ký gian hàng may đo')}</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 border-t border-stone-100 grid grid-cols-3 gap-4 max-w-lg">
                <div>
                  <span className="block font-mono text-xl sm:text-2xl font-bold text-stone-900">
                    {t('ecommerce.hero.statLandmarks', '13 Mốc')}
                  </span>
                  <span className="text-[11px] text-stone-500">{t('ecommerce.hero.statLandmarksSub', 'Chuẩn may đo ISO 8559-1')}</span>
                </div>
                <div>
                  <span className="block font-mono text-xl sm:text-2xl font-bold text-emerald-700">
                    {t('ecommerce.hero.statSatisfaction', '98.6%')}
                  </span>
                  <span className="text-[11px] text-stone-500">{t('ecommerce.hero.statSatisfactionSub', 'Tỷ lệ hài lòng phom dáng')}</span>
                </div>
                <div>
                  <span className="block font-mono text-xl sm:text-2xl font-bold text-stone-900">
                    {t('ecommerce.hero.statReturns', '< 2%')}
                  </span>
                  <span className="text-[11px] text-stone-500">{t('ecommerce.hero.statReturnsSub', 'Tỷ lệ đổi trả hàng')}</span>
                </div>
              </div>

            </div>

            {/* Right Column: Hero Fashion Lookbook Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                
                {/* Main Model Photo */}
                <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-xl border border-stone-200/80 bg-stone-100 relative group">
                  <img
                    src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1000&q=85"
                    alt="FitVision 3D Luxury Fashion"
                    className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                  {/* Overlaid Atelier Badge */}
                  <div className="absolute bottom-4 left-4 right-4 text-white p-3.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300">
                      {t('ecommerce.hero.lookbookCollection', 'Bộ Sưu Tập Sartoria Thu Đông')}
                    </span>
                    <h3 className="text-sm font-semibold text-white">
                      {t('ecommerce.hero.lookbookItem', 'Áo Blazer Deconstructed Linen Pháp')}
                    </h3>
                  </div>
                </div>

                {/* Floating AI Fit Score Badge (Core Hero Feature) */}
                <div className="absolute -top-4 -left-4 sm:-left-6 bg-white/95 backdrop-blur-sm p-3.5 rounded-xl shadow-xl border border-stone-200/90 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-xs z-10">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-mono font-bold text-base flex-shrink-0">
                    98%
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-stone-900">{t('ecommerce.hero.fitBadgeTitle', 'Vừa Vặn Tuyệt Đối')}</span>
                      <CheckCircle2 size={13} className="text-emerald-600" />
                    </div>
                    <p className="text-[11px] text-stone-500">
                      {t('ecommerce.hero.fitBadgeAdvice', 'Gợi ý: Size {size} (Ngực {chest}cm | Eo {waist}cm)')
                        .replace('{size}', 'L')
                        .replace('{chest}', '96')
                        .replace('{waist}', '78')}
                    </p>
                  </div>
                </div>

                {/* Floating Tape Measure Pill */}
                <div className="absolute -bottom-4 -right-4 sm:-right-6 bg-white/95 backdrop-blur-sm py-2.5 px-4 rounded-xl shadow-xl border border-stone-200/90 flex items-center gap-2 z-10">
                  <Ruler size={16} className="text-amber-700" />
                  <span className="text-xs font-mono font-semibold text-stone-800">
                    {t('ecommerce.hero.tapeMeasure', 'Dài tay: 58.5cm • Rộng vai: 43cm')}
                  </span>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── USER BIOMETRIC BAR (CONTROL PANEL) ── */}
      <section className="bg-stone-100/90 border-b border-stone-200 py-3.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          
          <div className="flex items-center gap-3 flex-wrap justify-center md:justify-start">
            <span className="font-semibold text-stone-800 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span>{t('ecommerce.biometricsBar.label', 'Hồ sơ vóc dáng đang áp dụng:')}</span>
            </span>

            <div className="flex items-center gap-2 font-mono text-stone-900 bg-white px-3 py-1.5 rounded-lg border border-stone-200/90 shadow-2xs text-[11px] sm:text-xs">
              <span>{t('ecommerce.biometricsBar.height', 'Cao')}: <b>{userBody.height_cm}cm</b></span>
              <span className="text-stone-300">•</span>
              <span>{t('ecommerce.biometricsBar.weight', 'Nặng')}: <b>{userBody.weight_kg}kg</b></span>
              <span className="text-stone-300">•</span>
              <span>{t('ecommerce.biometricsBar.chest', 'Ngực')}: <b>{userBody.chest_cm}cm</b></span>
              <span className="text-stone-300">•</span>
              <span>{t('ecommerce.biometricsBar.waist', 'Eo')}: <b>{userBody.waist_cm}cm</b></span>
              <span className="text-stone-300">•</span>
              <span>{t('ecommerce.biometricsBar.hip', 'Mông')}: <b>{userBody.hip_cm}cm</b></span>
            </div>

            <button
              type="button"
              onClick={() => setIsBiometricModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <SlidersHorizontal size={13} />
              <span>{t('ecommerce.biometricsBar.editMeasurements', 'Chỉnh sửa số đo')}</span>
            </button>
          </div>

          {/* Toggle Filter by My Fit Only */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filterByMyFitOnly}
                onChange={(e) => setFilterByMyFitOnly(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-stone-300 accent-blue-600 cursor-pointer"
              />
              <span className="font-medium text-stone-800">
                {t('ecommerce.biometricsBar.filterMyFit', 'Chỉ hiển thị trang phục vừa chuẩn vóc dáng tôi (≥ 90%)')}
              </span>
            </label>
          </div>

        </div>
      </section>

      {/* ── MAIN PRODUCT CATALOG SECTION ── */}
      <main id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 flex-1">
        
        {/* Section Heading & Category Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-800">
              {t('ecommerce.catalog.tagline', 'Bộ Sưu Tập Thời Trang Thông Minh')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mt-1">
              {t('ecommerce.catalog.heading', 'Khám Phá Kích Cỡ Dành Riêng Cho Bạn')}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              {t('ecommerce.catalog.subheading', 'Tất cả sản phẩm đã được AI tính toán sẵn kích cỡ tối ưu dựa trên số đo của bạn')}
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder={t('ecommerce.catalog.searchPlaceholder', 'Tìm áo, quần, chất liệu...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-stone-200 text-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-2xs"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          {[
            { id: 'all', label: t('ecommerce.catalog.tabAll', 'Tất Cả Sản Phẩm') },
            { id: 'shirt', label: t('ecommerce.catalog.tabShirt', 'Áo Sơ Mi Nam') },
            { id: 'polo', label: t('ecommerce.catalog.tabPolo', 'Áo Polo Lụa') },
            { id: 'pants', label: t('ecommerce.catalog.tabPants', 'Quần Tây & Chino') },
            { id: 'dress', label: t('ecommerce.catalog.tabDress', 'Đầm Lụa Nữ') },
            { id: 'tailored', label: t('ecommerce.catalog.tabTailored', 'May Đo Bespoke') },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-400 hover:text-stone-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Product Grid (Responsive 2 cols mobile, 4 cols desktop) */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-stone-200 p-8 space-y-3">
            <SlidersHorizontal size={32} className="mx-auto text-stone-300" />
            <h3 className="text-base font-semibold text-stone-800">{t('ecommerce.catalog.emptyTitle', 'Không tìm thấy sản phẩm phù hợp')}</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              {t('ecommerce.catalog.emptyDesc', 'Thử tắt bộ lọc hoặc tìm kiếm từ khóa khác.')}
            </p>
            <button
              onClick={() => {
                setActiveCategory('all');
                setSearchQuery('');
                setFilterByMyFitOnly(false);
              }}
              className="mt-2 text-xs font-semibold text-blue-700 underline"
            >
              {t('ecommerce.catalog.resetFilters', 'Đặt lại tất cả bộ lọc')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => {
              const fit = product.fitResult;
              const isPerfect = fit.match_percentage >= 95;

              return (
                <div
                  key={product.id}
                  className="group bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  
                  {/* Card Top: Image & Overlay Badges */}
                  <div className="relative aspect-[3/4] bg-stone-100 overflow-hidden">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Brand Tag Top Left */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/90 text-stone-800 backdrop-blur shadow-2xs">
                        {product.brand_name}
                      </span>
                    </div>

                    {/* AI Match Score Tag Top Right */}
                    <div className="absolute top-2.5 right-2.5">
                      <div
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 shadow-2xs ${
                          isPerfect
                            ? 'bg-emerald-600 text-white'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        <Sparkles size={10} />
                        <span>{fit.match_percentage}% {t('ecommerce.catalog.fitMatch', 'Vừa')}</span>
                      </div>
                    </div>

                    {/* Quick Fit Peek Action on Hover */}
                    <button
                      type="button"
                      onClick={() => handleOpenAnalysis(product)}
                      className="absolute inset-x-3 bottom-3 py-2 px-3 rounded-xl bg-white/95 text-blue-700 font-bold text-xs shadow-md border border-stone-200/80 backdrop-blur opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-1.5 hover:bg-white cursor-pointer"
                    >
                      <Ruler size={13} className="text-blue-600" />
                      <span>{t('ecommerce.catalog.viewAnalysis', 'Xem Phân Tích Độ Vừa 3D')}</span>
                    </button>
                  </div>

                  {/* Card Bottom: Product Info & Actions */}
                  <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-stone-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </h4>
                      <p className="text-xs text-stone-600 font-medium mt-1 line-clamp-1">
                        {product.fabric_material}
                      </p>
                    </div>

                    {/* AI Size Advice Pill (Clickable for 3D fit analysis) */}
                    <div
                      onClick={() => handleOpenAnalysis(product)}
                      className="p-2.5 rounded-xl bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200/80 text-xs transition-colors cursor-pointer group/fit"
                      title={t('ecommerce.catalog.viewAnalysis', 'Xem Phân Tích Độ Vừa 3D')}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-stone-700 font-semibold">{t('ecommerce.catalog.recommendLabel', 'Khuyên dùng:')}</span>
                        <span className="font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-200 shadow-2xs flex items-center gap-1">
                          <span>Size {fit.recommended_size}</span>
                          <ChevronRight size={12} className="text-blue-500 group-hover/fit:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-700 mt-1 line-clamp-1 font-medium">
                        {locale === 'en' && fit.advisor_advice_en ? fit.advisor_advice_en : fit.advisor_advice_vi}
                      </p>
                    </div>

                    {/* Price and Add to Cart Button */}
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                      <div>
                        {product.sale_price ? (
                          <div className="flex flex-col">
                            <span className="font-extrabold text-stone-900 text-xs sm:text-sm">
                              {product.sale_price.toLocaleString('vi-VN')} ₫
                            </span>
                            <span className="text-[10px] text-stone-400 line-through">
                              {product.price.toLocaleString('vi-VN')} ₫
                            </span>
                          </div>
                        ) : (
                          <span className="font-extrabold text-stone-900 text-xs sm:text-sm">
                            {product.price.toLocaleString('vi-VN')} ₫
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddToCart(product, product.recommendedVariant)}
                        style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
                        className="py-2 px-3.5 rounded-xl hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-blue-500/30 hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer group"
                        title={t('ecommerce.catalog.buySizeTooltip', 'Chọn mua ngay Size {size}').replace('{size}', fit.recommended_size)}
                      >
                        <ShoppingBag size={13} className="text-white group-hover:scale-110 transition-transform" />
                        <span className="tracking-tight">
                          {t('ecommerce.catalog.chooseSize', 'Chọn Size {size}').replace('{size}', fit.recommended_size)}
                        </span>
                      </button>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* ── TECHNOLOGY DEEP DIVE (3-TIER ARCHITECTURE SHOWCASE) ── */}
      <section className="bg-white border-t border-stone-200 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-700">
              {t('ecommerce.tech.subtitle', 'Công Nghệ Đằng Sau Sự Vừa Vặn')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mt-1">
              {t('ecommerce.tech.title', 'Tại Sao FitVision 3D Chuẩn Xác Hơn Bảng Size Thông Thường?')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Ruler size={20} />
              </div>
              <h3 className="font-bold text-stone-900 text-sm">
                {t('ecommerce.tech.f1Title', 'Xấp Xỉ Elip Ramanujan 3D')}
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                {t('ecommerce.tech.f1Desc', 'Không dùng ước lượng thô sơ. Hệ thống cắt lớp mặt phẳng ngực, eo, hông và áp dụng tích phân chu vi elip bậc hai kết hợp mật độ mô sinh học Siri-Deurenberg để trích xuất số đo thực tế.')}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <ShieldCheck size={20} />
              </div>
              <h3 className="font-bold text-stone-900 text-sm">
                {t('ecommerce.tech.f2Title', 'Bảo Mật Quyền Riêng Tư Tuyệt Đối')}
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                {t('ecommerce.tech.f2Desc', 'Ảnh chụp của khách hàng được xử lý ngay trong bộ nhớ tạm In-Memory RAM và tự động xóa vĩnh viễn (Zero-Retention Policy). Không lưu trữ hình ảnh nhạy cảm trên máy chủ.')}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
              <h3 className="font-bold text-stone-900 text-sm">
                {t('ecommerce.tech.f3Title', 'Độ Cử Động May Đo (Ease Allowance)')}
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                {t('ecommerce.tech.f3Desc', 'Áo quần không bao giờ may bằng khít với da thịt. FitVision 3D tính toán chính xác độ chùng vải (ease: +3cm đến +6cm) để đảm bảo bạn mặc đẹp nhưng vẫn cử động thoải mái khi làm việc.')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-stone-900 text-stone-400 text-xs py-10 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-white font-bold text-sm">
              <Scissors size={16} className="text-blue-400" />
              <span>FitVision 3D (C1SE.12)</span>
            </div>
            <p className="text-[11px] text-stone-500">
              {t('ecommerce.footer.capstone', 'Đồ Án Tốt Nghiệp Capstone: Nền Tảng Đo Nhân Trắc Học 3D & Sàn Thương Mại May Đo Thông Minh')}
            </p>
            <p className="text-[10px] text-stone-600">
              {t('ecommerce.footer.credits', 'Trưởng nhóm: Lê Văn Thắng • GVHD: TS. Lê Minh Thái')}
            </p>
          </div>

          <div className="flex items-center gap-6 text-[11px]">
            <a href="/dashboard" className="hover:text-white transition-colors">
              {t('ecommerce.footer.booth', 'Buồng Quét 3D')}
            </a>
            <button
              type="button"
              onClick={openOnboarding}
              className="hover:text-white transition-colors bg-transparent border-0 cursor-pointer"
            >
              {t('ecommerce.footer.registerMerchant', 'Đăng Ký Gian Hàng')}
            </button>
            <a
              href="https://github.com/le-van-thang/C1SE.12-FitVision3D"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              {t('ecommerce.footer.github', 'GitHub Repository')}
            </a>
          </div>
        </div>
      </footer>

      {/* ── MOBILE BOTTOM THUMB NAVIGATION BAR (UI/UX PRO MAX PRIORITY 2) ── */}
      <nav aria-label="Mobile Navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-4 py-2 flex items-center justify-around shadow-lg">
        <button
          type="button"
          onClick={() => setActiveCategory('all')}
          className="flex flex-col items-center gap-1 text-[10px] font-medium text-stone-600 hover:text-blue-600 min-w-[50px] min-h-[44px] justify-center bg-transparent border-0 cursor-pointer"
        >
          <Scissors size={18} />
          <span>{t('ecommerce.mobileNav.explore', 'Khám phá')}</span>
        </button>

        <button
          type="button"
          onClick={() => setIsBiometricModalOpen(true)}
          className="flex flex-col items-center gap-1 text-[10px] font-medium text-stone-600 hover:text-blue-600 min-w-[50px] min-h-[44px] justify-center bg-transparent border-0 cursor-pointer"
        >
          <Ruler size={18} />
          <span>{t('ecommerce.mobileNav.measurements', 'Số đo')}</span>
        </button>

        {/* Central Floating Action Button: 3D Camera Scan */}
        <a
          href="/dashboard"
          className="flex flex-col items-center -mt-5 group"
        >
          <div
            style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
            className="w-12 h-12 rounded-full text-white flex items-center justify-center shadow-lg shadow-blue-600/30 group-hover:scale-105 active:scale-95 transition-all"
          >
            <Camera size={22} className="text-white" />
          </div>
          <span className="text-[9px] font-bold text-blue-700 mt-1">
            {t('ecommerce.mobileNav.scan3d', 'Quét 3D')}
          </span>
        </a>

        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="relative flex flex-col items-center gap-1 text-[10px] font-medium text-stone-600 hover:text-blue-600 min-w-[50px] min-h-[44px] justify-center bg-transparent border-0 cursor-pointer"
        >
          <ShoppingBag size={18} />
          <span>{t('ecommerce.mobileNav.cart', 'Giỏ hàng')}</span>
          {totalCartCount > 0 && (
            <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
              {totalCartCount}
            </span>
          )}
        </button>

        {isAuthenticated ? (
          <a
            href="/dashboard"
            className="flex flex-col items-center gap-1 text-[10px] font-medium text-stone-600 hover:text-blue-600 min-w-[50px] min-h-[44px] justify-center"
          >
            <UserIcon size={18} />
            <span>{t('ecommerce.mobileNav.profile', 'Hồ sơ')}</span>
          </a>
        ) : (
          <button
            type="button"
            onClick={openSignIn}
            className="flex flex-col items-center gap-1 text-[10px] font-medium text-stone-600 hover:text-blue-600 min-w-[50px] min-h-[44px] justify-center bg-transparent border-0 cursor-pointer"
          >
            <LogIn size={18} />
            <span>{t('ecommerce.mobileNav.login', 'Đăng nhập')}</span>
          </button>
        )}
      </nav>

      {/* ── DRAWERS & MODALS ── */}
      <FitAnalysisDrawer
        isOpen={isAnalysisOpen}
        onClose={() => setIsAnalysisOpen(false)}
        product={analysisProduct}
        selectedVariant={analysisVariant}
        userBody={userBody}
        fitResult={
          analysisProduct ? calculateProductFit(userBody, analysisProduct) : null
        }
        onSelectSize={(v) => setAnalysisVariant(v)}
        onAddToCart={() => {
          if (analysisProduct && analysisVariant) {
            handleAddToCart(analysisProduct, analysisVariant);
          }
        }}
      />

      <SmartCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onRemoveItem={(id) => setCartItems((prev) => prev.filter((i) => i.id !== id))}
        onUpdateQuantity={(id, delta) => {
          setCartItems((prev) =>
            prev.map((i) => {
              if (i.id === id) {
                const nextQ = i.quantity + delta;
                return nextQ > 0 ? { ...i, quantity: nextQ } : i;
              }
              return i;
            })
          );
        }}
        onCheckout={() => {
          alert('Tính năng thanh toán demo: Đơn hàng đã được ghi nhận với các size tối ưu theo AI!');
          setCartItems([]);
          setIsCartOpen(false);
        }}
      />

      <QuickBiometricModal
        isOpen={isBiometricModalOpen}
        onClose={() => setIsBiometricModalOpen(false)}
        currentBody={userBody}
        onSaveBody={handleSaveBody}
        onNavigateToCameraScan={() => {
          window.location.href = '/dashboard';
        }}
      />

      {/* Global Modals: Auth & B2B Merchant */}
      <AuthModal />
      <MerchantOnboardingModal />

    </div>
  );
};

