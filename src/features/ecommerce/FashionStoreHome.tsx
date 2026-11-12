import React, { useState, useMemo, useEffect } from 'react';
import {
  ShoppingBag,
  Sparkles,
  Camera,
  Scissors,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
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

// ── SHOPEE-STYLE PRODUCT CAMPAIGN BANNER SLIDES ──
interface HeroProductSlide {
  id: string;
  productId: string;
  categoryTagVi: string;
  categoryTagEn: string;
  titleVi: string;
  titleEn: string;
  fabricVi: string;
  fabricEn: string;
  price: number;
  originalPrice?: number;
  fitPercentage: number;
  fitSize: string;
  fitChest: number;
  fitWaist: number;
  imageUrl: string;
  badgeLabelVi: string;
  badgeLabelEn: string;
  badgeColor: string;
}

const HERO_PRODUCT_SLIDES: HeroProductSlide[] = [
  {
    id: 'slide-blazer',
    productId: 'prod-05',
    categoryTagVi: 'BST SARTORIA THU ĐÔNG',
    categoryTagEn: 'SARTORIA FALL/WINTER',
    titleVi: 'Áo Blazer Cấu Trúc Nhẹ Deconstructed Linen Pháp',
    titleEn: 'French Deconstructed Linen Lightweight Blazer',
    fabricVi: '100% Linen Thuần Pháp (Normandy Flax)',
    fabricEn: '100% French Normandy Flax Linen',
    price: 1650000,
    originalPrice: 1950000,
    fitPercentage: 98,
    fitSize: 'L',
    fitChest: 96,
    fitWaist: 78,
    imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1000&q=85',
    badgeLabelVi: 'BESTSELLER MAY ĐO',
    badgeLabelEn: 'BESPOKE BESTSELLER',
    badgeColor: 'bg-amber-500 text-white',
  },
  {
    id: 'slide-oxford',
    productId: 'prod-01',
    categoryTagVi: 'ROYAL TAILORED SHIRT',
    categoryTagEn: 'ROYAL TAILORED SHIRT',
    titleVi: 'Áo Sơ Mi Oxford Dệt Nổi Royal Tailored',
    titleEn: 'Royal Tailored Oxford Textured Shirt',
    fabricVi: '100% Giza Cotton Ai Cập (Sợi chải kỹ 80/2)',
    fabricEn: '100% Egyptian Giza Cotton (80/2 Combed Yarn)',
    price: 590000,
    originalPrice: 680000,
    fitPercentage: 97,
    fitSize: 'M',
    fitChest: 96,
    fitWaist: 78,
    imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1000&q=85',
    badgeLabelVi: 'ƯU ĐÃI HOT -15%',
    badgeLabelEn: 'HOT DEAL -15%',
    badgeColor: 'bg-red-500 text-white',
  },
  {
    id: 'slide-trouser',
    productId: 'prod-03',
    categoryTagVi: 'SARTORIA MILAN TAILORING',
    categoryTagEn: 'SARTORIA MILAN TAILORING',
    titleVi: 'Quần Tây Tapered Fit Xếp Ly Đôi Ý',
    titleEn: 'Italian Double-Pleated Tapered Trousers',
    fabricVi: 'Wool Blend Úc Cao Cấp (70% Wool Úc + 30% Spun Poly)',
    fabricEn: 'Premium Australian Wool Blend (70% Wool)',
    price: 765000,
    originalPrice: 850000,
    fitPercentage: 96,
    fitSize: 'M',
    fitChest: 96,
    fitWaist: 78,
    imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1000&q=85',
    badgeLabelVi: 'THIẾT KẾ ĐỘC QUYỀN',
    badgeLabelEn: 'EXCLUSIVE DESIGN',
    badgeColor: 'bg-blue-600 text-white',
  },
  {
    id: 'slide-dress',
    productId: 'prod-04',
    categoryTagVi: 'L\'ÉTOILE ATELIER HAUTE COUTURE',
    categoryTagEn: 'L\'ÉTOILE ATELIER HAUTE COUTURE',
    titleVi: 'Đầm Lụa Satin Cổ Đổ Silk Bias Cut',
    titleEn: 'Mulberry Silk Cowl-Neck Bias Cut Dress',
    fabricVi: '100% Lụa Tằm Dâu Mulberry Satin 19 Momme',
    fabricEn: '100% Mulberry Silk Satin 19 Momme',
    price: 1250000,
    originalPrice: 1450000,
    fitPercentage: 98,
    fitSize: 'XS',
    fitChest: 86,
    fitWaist: 68,
    imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=1000&q=85',
    badgeLabelVi: 'LỤA TƠ TẰM THỦ CÔNG',
    badgeLabelEn: 'HANDMADE SILK',
    badgeColor: 'bg-rose-500 text-white',
  },
];

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

  // Advanced Filter States (Shopee-style smart filtering)
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [priceRange, setPriceRange] = useState<string>('all'); // 'all' | 'under-600' | '600-1000' | 'above-1000'
  const [fabricFilter, setFabricFilter] = useState<string>('all'); // 'all' | 'cotton' | 'silk' | 'wool' | 'linen'
  const [sortBy, setSortBy] = useState<string>('default'); // 'default' | 'fit-desc' | 'price-asc' | 'price-desc'

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterByMyFitOnly) count++;
    if (priceRange !== 'all') count++;
    if (fabricFilter !== 'all') count++;
    if (sortBy !== 'default') count++;
    return count;
  }, [filterByMyFitOnly, priceRange, fabricFilter, sortBy]);

  const handleResetAllFilters = () => {
    setActiveCategory('all');
    setSearchQuery('');
    setFilterByMyFitOnly(false);
    setPriceRange('all');
    setFabricFilter('all');
    setSortBy('default');
  };

  // Cart
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Drawers & Modals
  const [analysisProduct, setAnalysisProduct] = useState<FashionProduct | null>(null);
  const [analysisVariant, setAnalysisVariant] = useState<ProductVariant | null>(null);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState<boolean>(false);
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Shopee-style Auto-sliding Product Campaign Banner State
  const [activeBannerSlide, setActiveBannerSlide] = useState<number>(0);
  const [isBannerPaused, setIsBannerPaused] = useState<boolean>(false);

  useEffect(() => {
    if (isBannerPaused) return;
    const interval = setInterval(() => {
      setActiveBannerSlide((prev) => (prev + 1) % HERO_PRODUCT_SLIDES.length);
    }, 3600);
    return () => clearInterval(interval);
  }, [isBannerPaused]);

  // Save body changes
  const handleSaveBody = (newBody: UserBodyProfile) => {
    setUserBody(newBody);
    sessionStorage.setItem('fv3d_user_body', JSON.stringify(newBody));
  };

  // Helpers for bilingual product representation
  const getProductName = (p: FashionProduct) => (locale === 'en' && p.name_en ? p.name_en : p.name);
  const getProductFabric = (p: FashionProduct) => (locale === 'en' && p.fabric_material_en ? p.fabric_material_en : p.fabric_material);
  const getProductDesc = (p: FashionProduct) => (locale === 'en' && p.description_en ? p.description_en : p.description);

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
  }, [userBody, locale]);

  // Filtered and Sorted products
  const filteredProducts = useMemo(() => {
    const list = productsWithFit.filter((item) => {
      const matchCat = activeCategory === 'all' || item.category === activeCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        getProductName(item).toLowerCase().includes(q) ||
        item.brand_name.toLowerCase().includes(q) ||
        getProductFabric(item).toLowerCase().includes(q);
      const matchFit = !filterByMyFitOnly || item.fitResult.match_percentage >= 90;

      // Price filter
      const effectivePrice = item.sale_price || item.price;
      let matchPrice = true;
      if (priceRange === 'under-600') matchPrice = effectivePrice < 600000;
      else if (priceRange === '600-1000') matchPrice = effectivePrice >= 600000 && effectivePrice <= 1000000;
      else if (priceRange === 'above-1000') matchPrice = effectivePrice > 1000000;

      // Fabric filter
      let matchFabric = true;
      const fabricText = (item.fabric_material + ' ' + (item.fabric_material_en || '')).toLowerCase();
      if (fabricFilter === 'cotton') matchFabric = fabricText.includes('cotton');
      else if (fabricFilter === 'silk') matchFabric = fabricText.includes('lụa') || fabricText.includes('silk');
      else if (fabricFilter === 'wool') matchFabric = fabricText.includes('wool') || fabricText.includes('len');
      else if (fabricFilter === 'linen') matchFabric = fabricText.includes('linen') || fabricText.includes('lanh');

      return matchCat && matchSearch && matchFit && matchPrice && matchFabric;
    });

    // Sorting
    if (sortBy === 'fit-desc') {
      list.sort((a, b) => b.fitResult.match_percentage - a.fitResult.match_percentage);
    } else if (sortBy === 'price-asc') {
      list.sort((a, b) => (a.sale_price || a.price) - (b.sale_price || b.price));
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => (b.sale_price || b.price) - (a.sale_price || a.price));
    }

    return list;
  }, [productsWithFit, activeCategory, searchQuery, filterByMyFitOnly, priceRange, fabricFilter, sortBy, locale]);

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
      
      {/* ── ATELIER LIGHT NAVBAR (CLEAN TOP POSITION) ── */}
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
              className="relative w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200/80 border border-stone-200/80 text-stone-700 transition-all duration-200 ease-out transform hover:-translate-y-0.5 hover:shadow-xs active:scale-95 flex items-center justify-center cursor-pointer flex-shrink-0"
              aria-label={t('ecommerce.nav.cart', 'Giỏ hàng')}
            >
              <ShoppingBag size={18} />
              {totalCartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shadow animate-in zoom-in-50 duration-200">
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* Auth Button or User Profile with Professional Micro-Interactions */}
            {isAuthenticated ? (
              <UserProfileDropdown variant="light" />
            ) : (
              <button
                type="button"
                onClick={openSignIn}
                style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
                className="relative overflow-hidden inline-flex items-center gap-1.5 px-4 py-2 rounded-full hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 transition-all duration-200 ease-out transform hover:-translate-y-0.5 cursor-pointer group flex-shrink-0 before:absolute before:inset-0 before:-translate-x-full hover:before:translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent before:transition-transform before:duration-700"
              >
                <LogIn size={14} className="text-white group-hover:scale-110 transition-transform duration-200 flex-shrink-0" />
                <span className="whitespace-nowrap tracking-tight">{t('ecommerce.nav.login', 'Đăng Nhập')}</span>
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
              
              {/* Interactive 3D Fit Engine Live Capsule (Novel & Actionable - Replaces generic AI pill) */}
              <button
                type="button"
                onClick={() => setIsBiometricModalOpen(true)}
                className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-stone-900/90 hover:bg-stone-900 text-white border border-stone-700/80 hover:border-blue-400 shadow-md transition-all duration-200 ease-out transform hover:-translate-y-0.5 active:scale-95 cursor-pointer group select-none text-left"
                title={t('ecommerce.nav.biometricTooltip', 'Xem và chỉnh sửa số đo cơ thể')}
              >
                {/* Radar Pulse Effect */}
                <div className="relative flex h-2.5 w-2.5 flex-shrink-0 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </div>

                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  AI FIT v2.5
                </span>

                <span className="text-xs font-medium text-stone-200 flex items-center gap-1.5 truncate">
                  <span>{t('ecommerce.hero.liveEngine', 'Hiệu chuẩn vóc dáng tự động')}:</span>
                  <span className="font-mono text-emerald-400 font-bold">{userBody.height_cm}cm • {userBody.weight_kg}kg</span>
                </span>

                <span className="text-[10px] text-blue-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 flex-shrink-0 border-l border-stone-700 pl-2">
                  {t('ecommerce.hero.editBiometric', 'Đổi số đo')} ➜
                </span>
              </button>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-stone-900 leading-[1.2] sm:leading-[1.18]">
                {t('ecommerce.hero.title1', 'Thời Trang Vừa Vặn')} <br className="hidden sm:inline" />
                <span className="text-blue-600">{t('ecommerce.hero.titleHighlight', 'Tuyệt Đối')}</span> {t('ecommerce.hero.title2', 'Từng Centimet.')}
              </h1>

              <p className="text-stone-600 text-sm sm:text-base leading-relaxed max-w-xl">
                {t('ecommerce.hero.desc', 'Không còn nỗi lo chọn nhầm size hay phiền phức đổi trả. Thuật toán Trí Tuệ Nhân Tạo tự động phân tích vóc dáng và so khớp độ cử động (Ease Allowance) với từng đường kim mũi chỉ của nhà may.')}
              </p>

              {/* Action Buttons on 1 Single Row (No wrapping) */}
              <div className="flex items-center gap-2 sm:gap-3 flex-nowrap overflow-x-auto sm:overflow-visible pb-1 sm:pb-0 scrollbar-none pt-2">
                <a
                  href="/dashboard"
                  style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
                  className="relative overflow-hidden px-4 sm:px-5 py-3 rounded-xl hover:bg-blue-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/40 flex items-center gap-1.5 sm:gap-2 transition-all duration-200 ease-out transform hover:-translate-y-0.5 group cursor-pointer flex-shrink-0 before:absolute before:inset-0 before:-translate-x-full hover:before:translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent before:transition-transform before:duration-700 whitespace-nowrap"
                >
                  <Camera size={15} className="text-white group-hover:scale-110 group-hover:rotate-6 transition-transform duration-200 flex-shrink-0" />
                  <span>{t('ecommerce.hero.ctaScan', 'Quét Vóc Dáng Bằng AI')}</span>
                  <ChevronRight size={15} className="text-white group-hover:translate-x-1 transition-transform duration-200 flex-shrink-0" />
                </a>

                <a
                  href="#catalog"
                  className="px-4 sm:px-5 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-800 font-bold text-xs sm:text-sm border border-stone-300 hover:border-stone-400 hover:shadow-md transition-all duration-200 ease-out transform hover:-translate-y-0.5 cursor-pointer flex-shrink-0 whitespace-nowrap"
                >
                  {t('ecommerce.hero.ctaExplore', 'Khám Phá Bộ Sưu Tập')}
                </a>

                {/* Merchant Button: Prominent Colored Button on the exact same row */}
                <button
                  type="button"
                  onClick={openOnboarding}
                  className="px-3.5 sm:px-4 py-3 rounded-xl bg-amber-50 hover:bg-amber-600 text-amber-900 hover:text-white font-bold text-xs border-2 border-amber-300 hover:border-amber-600 shadow-xs hover:shadow-lg hover:shadow-amber-500/25 flex items-center gap-1.5 transition-all duration-200 ease-out transform hover:-translate-y-0.5 active:scale-95 cursor-pointer group flex-shrink-0 whitespace-nowrap"
                >
                  <Store size={14} className="text-amber-700 group-hover:text-white transition-colors duration-200 flex-shrink-0" />
                  <span>{t('ecommerce.hero.ctaMerchant', 'Đăng ký gian hàng may đo')}</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 border-t-2 border-stone-200 grid grid-cols-3 gap-4 max-w-lg">
                <div>
                  <span className="block font-mono text-xl sm:text-2xl font-black text-stone-950">
                    {t('ecommerce.hero.statLandmarks', '13 Mốc')}
                  </span>
                  <span className="text-xs text-stone-700 font-bold">{t('ecommerce.hero.statLandmarksSub', 'Chuẩn may đo ISO 8559-1')}</span>
                </div>
                <div>
                  <span className="block font-mono text-xl sm:text-2xl font-black text-emerald-700">
                    {t('ecommerce.hero.statSatisfaction', '98.6%')}
                  </span>
                  <span className="text-xs text-stone-700 font-bold">{t('ecommerce.hero.statSatisfactionSub', 'Tỷ lệ hài lòng phom dáng')}</span>
                </div>
                <div>
                  <span className="block font-mono text-xl sm:text-2xl font-black text-stone-950">
                    {t('ecommerce.hero.statReturns', '< 2%')}
                  </span>
                  <span className="text-xs text-stone-700 font-bold">{t('ecommerce.hero.statReturnsSub', 'Tỷ lệ đổi trả hàng')}</span>
                </div>
              </div>

            </div>

            {/* Right Column: Shopee-style Auto-sliding Product Campaign Banner Carousel */}
            <div className="lg:col-span-5 relative pb-6 sm:pb-8">
              <div
                onMouseEnter={() => setIsBannerPaused(true)}
                onMouseLeave={() => setIsBannerPaused(false)}
                className="relative mx-auto max-w-md lg:max-w-none aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl border-2 border-stone-800 bg-stone-900 group select-none"
              >
                {/* Banner Slide Layers with Smooth Cross-Fade & Zoom Transition */}
                {HERO_PRODUCT_SLIDES.map((slide, idx) => {
                  const isActive = idx === activeBannerSlide;
                  return (
                    <div
                      key={slide.id}
                      className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                        isActive ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 pointer-events-none z-0'
                      }`}
                    >
                      <img
                        src={slide.imageUrl}
                        alt={locale === 'en' ? slide.titleEn : slide.titleVi}
                        className="w-full h-full object-cover object-top"
                      />
                      {/* Dark Gradient Overlay for perfect text contrast */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/15 pointer-events-none" />

                      {/* Top Campaign Pills */}
                      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-md ${slide.badgeColor}`}>
                          {locale === 'en' ? slide.badgeLabelEn : slide.badgeLabelVi}
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur border border-white/20">
                          {locale === 'en' ? slide.categoryTagEn : slide.categoryTagVi}
                        </span>
                      </div>

                      {/* Bottom Product Info Card & 3D Size CTA */}
                      <div className="absolute bottom-4 left-4 right-4 z-20 p-4 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 text-white space-y-2.5 shadow-lg">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm sm:text-base font-bold text-white line-clamp-1 drop-shadow-sm">
                              {locale === 'en' ? slide.titleEn : slide.titleVi}
                            </h3>
                            <p className="text-[11px] text-stone-200 line-clamp-1 font-medium mt-0.5">
                              {locale === 'en' ? slide.fabricEn : slide.fabricVi}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="block font-black text-sm sm:text-base text-amber-300">
                              {slide.price.toLocaleString('vi-VN')} ₫
                            </span>
                            {slide.originalPrice && (
                              <span className="text-[10px] text-stone-300 line-through">
                                {slide.originalPrice.toLocaleString('vi-VN')} ₫
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-white/20">
                          <button
                            type="button"
                            onClick={() => {
                              const targetProd = MOCK_PRODUCTS.find((p) => p.id === slide.productId);
                              if (targetProd) handleOpenAnalysis(targetProd);
                            }}
                            className="relative overflow-hidden w-full py-2.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-900/40 hover:shadow-lg flex items-center justify-center gap-1.5 transition-all duration-200 ease-out transform hover:-translate-y-0.5 active:scale-95 cursor-pointer group/cta before:absolute before:inset-0 before:-translate-x-full hover:before:translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent before:transition-transform before:duration-700"
                          >
                            <Sparkles size={13} className="text-amber-300" />
                            <span>{t('ecommerce.hero.bannerTryFit', 'Thử Size 3D Ngay')}</span>
                            <ChevronRight size={13} className="group-hover/cta:translate-x-1 transition-transform duration-200" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Left & Right Glassmorphic Chevrons */}
                <button
                  type="button"
                  onClick={() => setActiveBannerSlide((prev) => (prev - 1 + HERO_PRODUCT_SLIDES.length) % HERO_PRODUCT_SLIDES.length)}
                  aria-label="Previous Banner"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur border border-white/20 transition-all duration-200 transform hover:scale-110 active:scale-90 cursor-pointer shadow-md opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveBannerSlide((prev) => (prev + 1) % HERO_PRODUCT_SLIDES.length)}
                  aria-label="Next Banner"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur border border-white/20 transition-all duration-200 transform hover:scale-110 active:scale-90 cursor-pointer shadow-md opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight size={16} />
                </button>

                {/* Shopee-style Indicator Dots at Bottom */}
                <div className="absolute bottom-2 inset-x-0 z-30 flex items-center justify-center gap-1.5 pointer-events-auto">
                  {HERO_PRODUCT_SLIDES.map((slide, idx) => (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => setActiveBannerSlide(idx)}
                      aria-label={`Go to slide ${idx + 1}`}
                      className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                        idx === activeBannerSlide
                          ? 'w-6 bg-white shadow-sm'
                          : 'w-1.5 bg-white/40 hover:bg-white/70'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Floating AI Fit Score Badge (Reactive to active slide) - Outside overflow-hidden */}
              <div className="absolute -top-3.5 -left-3 sm:-left-5 bg-white p-3 rounded-xl shadow-2xl border-2 border-stone-800 flex items-center gap-2.5 max-w-xs z-30 transition-all duration-300 hover:scale-105">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 border-2 border-emerald-600 flex items-center justify-center text-emerald-800 font-mono font-black text-sm flex-shrink-0">
                  {HERO_PRODUCT_SLIDES[activeBannerSlide].fitPercentage}%
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-black text-stone-900">{t('ecommerce.hero.fitBadgeTitle', 'Vừa Vặn Tuyệt Đối')}</span>
                    <CheckCircle2 size={13} className="text-emerald-600 flex-shrink-0" />
                  </div>
                  <p className="text-[10px] text-stone-700 font-bold">
                    {t('ecommerce.hero.fitBadgeAdvice', 'Gợi ý: Size {size} (Ngực {chest}cm | Eo {waist}cm)')
                      .replace('{size}', HERO_PRODUCT_SLIDES[activeBannerSlide].fitSize)
                      .replace('{chest}', String(HERO_PRODUCT_SLIDES[activeBannerSlide].fitChest))
                      .replace('{waist}', String(HERO_PRODUCT_SLIDES[activeBannerSlide].fitWaist))}
                  </p>
                </div>
              </div>

              {/* Floating Tape Measure Pill - Fully Visible, Bold, High-Contrast & Never Clipped */}
              <div className="absolute -bottom-2 -right-2 sm:-right-4 bg-white py-2 px-3.5 rounded-xl shadow-2xl border-2 border-stone-800 flex items-center gap-2 z-30 transition-all duration-300 hover:scale-105">
                <div className="w-6 h-6 rounded-md bg-amber-100 border border-amber-500 flex items-center justify-center text-amber-800 flex-shrink-0">
                  <Ruler size={14} className="text-amber-800" />
                </div>
                <span className="text-xs font-mono font-black text-stone-900 tracking-tight">
                  {t('ecommerce.hero.tapeMeasure', 'Dài tay: 58.5cm • Rộng vai: 43cm')}
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── USER BIOMETRIC BAR (CONTROL PANEL) ── */}
      <section className="bg-stone-100 border-y-2 border-stone-300 py-3.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          
          <div className="flex items-center gap-3 flex-wrap justify-center md:justify-start">
            <span className="font-black text-stone-900 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-xs" />
              <span>{t('ecommerce.biometricsBar.label', 'Hồ sơ vóc dáng đang áp dụng:')}</span>
            </span>

            <div className="flex items-center gap-2.5 font-mono text-stone-950 bg-white px-3.5 py-1.5 rounded-xl border-2 border-stone-400 shadow-xs text-xs font-bold">
              <span>{t('ecommerce.biometricsBar.height', 'Cao')}: <b className="text-blue-700">{userBody.height_cm}cm</b></span>
              <span className="text-stone-400">•</span>
              <span>{t('ecommerce.biometricsBar.weight', 'Nặng')}: <b className="text-blue-700">{userBody.weight_kg}kg</b></span>
              <span className="text-stone-400">•</span>
              <span>{t('ecommerce.biometricsBar.chest', 'Ngực')}: <b>{userBody.chest_cm}cm</b></span>
              <span className="text-stone-400">•</span>
              <span>{t('ecommerce.biometricsBar.waist', 'Eo')}: <b>{userBody.waist_cm}cm</b></span>
              <span className="text-stone-400">•</span>
              <span>{t('ecommerce.biometricsBar.hip', 'Mông')}: <b>{userBody.hip_cm}cm</b></span>
            </div>

            <button
              type="button"
              onClick={() => setIsBiometricModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 border-2 border-blue-600 text-blue-700 hover:text-blue-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
            >
              <SlidersHorizontal size={13} strokeWidth={2.5} />
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
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-2 border-stone-400 accent-blue-600 cursor-pointer"
              />
              <span className="font-bold text-stone-900">
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
            <span className="text-xs font-black uppercase tracking-widest text-amber-800">
              {t('ecommerce.catalog.tagline', 'Bộ Sưu Tập Thời Trang Thông Minh')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-950 tracking-tight mt-1">
              {t('ecommerce.catalog.heading', 'Khám Phá Kích Cỡ Dành Riêng Cho Bạn')}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 font-medium mt-1">
              {t('ecommerce.catalog.subheading', 'Tất cả sản phẩm đã được AI tính toán sẵn kích cỡ tối ưu dựa trên số đo của bạn')}
            </p>
          </div>

          {/* Search & Filter Control Group */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Glowing Animated Light Border Beam Search Container */}
            <div className="search-beam-card flex-1 md:w-88 group">
              <div className="search-beam-light" />
              <div className="search-beam-inner">
                <div className="mr-2 flex items-center justify-center pointer-events-none text-blue-600 group-hover:text-blue-500 transition-colors flex-shrink-0">
                  <Search size={18} strokeWidth={2.6} />
                </div>
                <input
                  type="text"
                  placeholder={t('ecommerce.catalog.searchPlaceholder', 'Tìm áo, quần, chất liệu...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-full bg-transparent border-0 text-xs sm:text-sm font-bold text-stone-950 placeholder:text-stone-500 focus:outline-none focus:ring-0 pr-6"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 rounded-full text-stone-600 hover:text-stone-950 hover:bg-stone-200 cursor-pointer transition-colors"
                  >
                    <X size={15} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            </div>

            {/* Dedicated Filter Button */}
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`h-12 px-4 sm:px-5 rounded-2xl border-2 font-black text-xs sm:text-sm flex items-center gap-2 transition-all duration-200 ease-out transform hover:-translate-y-0.5 active:scale-95 cursor-pointer flex-shrink-0 shadow-sm ${
                isFilterOpen || activeFilterCount > 0
                  ? 'bg-blue-600 text-white border-blue-700 shadow-md shadow-blue-500/30'
                  : 'bg-white hover:bg-stone-100 text-stone-900 border-2 border-stone-800 hover:border-blue-600 hover:text-blue-600'
              }`}
            >
              <SlidersHorizontal size={16} strokeWidth={2.5} className={isFilterOpen || activeFilterCount > 0 ? 'text-white' : 'text-blue-600'} />
              <span className="whitespace-nowrap">{t('ecommerce.catalog.filterBtn', 'Bộ Lọc')}</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 text-[11px] font-black flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Expandable Advanced Filter Drawer / Panel */}
        {isFilterOpen && (
          <div className="mb-6 p-5 rounded-2xl bg-stone-50 border-2 border-stone-800 shadow-lg animate-in slide-in-from-top-2 duration-200 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-blue-600" />
                <h3 className="font-black text-xs sm:text-sm uppercase tracking-wider text-stone-950">
                  {t('ecommerce.catalog.filterTitle', 'Tùy Chọn Lọc Nâng Cao')}
                </h3>
                {activeFilterCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black">
                    {activeFilterCount} đang chọn
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleResetAllFilters}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
              >
                {t('ecommerce.catalog.resetAllFilters', 'Đặt Lại Bộ Lọc')}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
              {/* Price Filter */}
              <div>
                <label className="block font-black text-stone-900 mb-2">
                  {t('ecommerce.catalog.priceRange', 'Khoảng Giá')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'all', label: t('ecommerce.catalog.priceAll', 'Tất cả') },
                    { id: 'under-600', label: t('ecommerce.catalog.priceUnder600', '< 600.000 ₫') },
                    { id: '600-1000', label: t('ecommerce.catalog.price600To1000', '600k - 1tr') },
                    { id: 'above-1000', label: t('ecommerce.catalog.priceAbove1000', '> 1.000.000 ₫') },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPriceRange(p.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                        priceRange === p.id
                          ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                          : 'bg-white hover:bg-stone-200 text-stone-900 border-stone-300'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fabric Filter */}
              <div>
                <label className="block font-black text-stone-900 mb-2">
                  {t('ecommerce.catalog.fabricTitle', 'Chất Liệu May Mặc')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'all', label: t('ecommerce.catalog.fabricAll', 'Tất cả') },
                    { id: 'cotton', label: t('ecommerce.catalog.fabricCotton', 'Cotton Ai Cập') },
                    { id: 'silk', label: t('ecommerce.catalog.fabricSilk', 'Lụa Tơ Tằm') },
                    { id: 'wool', label: t('ecommerce.catalog.fabricWool', 'Wool Úc') },
                    { id: 'linen', label: t('ecommerce.catalog.fabricLinen', 'Linen Pháp') },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFabricFilter(f.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                        fabricFilter === f.id
                          ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                          : 'bg-white hover:bg-stone-200 text-stone-900 border-stone-300'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sorting Filter */}
              <div>
                <label className="block font-black text-stone-900 mb-2">
                  {t('ecommerce.catalog.sortBy', 'Sắp Xếp Theo')}
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full py-2 px-3 rounded-lg bg-white border-2 border-stone-400 text-xs font-bold text-stone-900 focus:outline-none focus:border-blue-600 cursor-pointer shadow-xs"
                >
                  <option value="default">{t('ecommerce.catalog.sortDefault', 'Mặc định (Bespoke)')}</option>
                  <option value="fit-desc">{t('ecommerce.catalog.sortFitDesc', 'Độ vừa AI cao nhất')}</option>
                  <option value="price-asc">{t('ecommerce.catalog.sortPriceAsc', 'Giá: Thấp đến Cao')}</option>
                  <option value="price-desc">{t('ecommerce.catalog.sortPriceDesc', 'Giá: Cao đến Thấp')}</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Category Pills with Micro-Interactions */}
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
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 ease-out transform hover:-translate-y-0.5 active:scale-95 cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-stone-900 text-white border-2 border-stone-900 shadow-md'
                  : 'bg-white text-stone-800 border-2 border-stone-400 hover:border-stone-700 hover:text-stone-950 hover:bg-stone-50 shadow-2xs'
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
                  className="group bg-white rounded-2xl border-2 border-stone-300 hover:border-stone-600 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
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
                      className="absolute inset-x-3 bottom-3 py-2 px-3 rounded-xl bg-white/95 text-blue-700 font-bold text-xs shadow-md border border-stone-200/80 backdrop-blur opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-1.5 hover:bg-white cursor-pointer"
                    >
                      <Ruler size={13} className="text-blue-600" />
                      <span>{t('ecommerce.catalog.viewAnalysis', 'Xem Phân Tích Độ Vừa 3D')}</span>
                    </button>
                  </div>

                  {/* Card Bottom: Product Info & Actions */}
                  <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-stone-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                        {getProductName(product)}
                      </h4>
                      <p className="text-xs text-stone-600 font-medium mt-1 line-clamp-1">
                        {getProductFabric(product)}
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
                        className="relative overflow-hidden py-2 px-3.5 rounded-xl hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 transition-all duration-200 ease-out transform hover:-translate-y-0.5 flex items-center gap-1.5 cursor-pointer group before:absolute before:inset-0 before:-translate-x-full hover:before:translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent before:transition-transform before:duration-700"
                        title={t('ecommerce.catalog.buySizeTooltip', 'Chọn mua ngay Size {size}').replace('{size}', fit.recommended_size)}
                      >
                        <ShoppingBag size={13} className="text-white group-hover:scale-110 group-hover:rotate-6 transition-transform duration-200" />
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

      {/* ── FOOTER (PROFESSIONAL E-COMMERCE ATELIER FOOTER) ── */}
      <footer className="bg-stone-950 text-stone-300 text-xs py-12 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-stone-800/80">
            {/* Brand & Vision */}
            <div className="md:col-span-2 space-y-3 text-left">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30">
                  <Scissors size={18} strokeWidth={2.2} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg text-white tracking-tight">
                    FitVision <span className="text-blue-400">3D</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800/80">
                    Smart Atelier
                  </span>
                </div>
              </div>

              <p className="text-xs text-stone-400 font-normal leading-relaxed max-w-md">
                {t('ecommerce.footer.desc', 'Nền tảng thương mại điện tử thời trang may đo ứng dụng công nghệ quét 3D và nhân trắc học ISO 8559-1. Đảm bảo trang phục vừa vặn hoàn hảo từng centimet, xóa bỏ nỗi lo chọn nhầm kích cỡ.')}
              </p>

              <div className="flex items-center gap-3 pt-1">
                <div className="px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-[11px] text-stone-300 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>{t('ecommerce.footer.guarantee', 'Cam kết vừa vặn 100% đổi trả miễn phí')}</span>
                </div>
              </div>
            </div>

            {/* Customer Care Links */}
            <div className="space-y-2.5 text-left">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                {t('ecommerce.footer.services', 'Dịch Vụ & Đo Đạc')}
              </h4>
              <ul className="space-y-2 text-stone-400">
                <li>
                  <a href="/dashboard" className="hover:text-white transition-colors duration-200 flex items-center gap-1.5">
                    <Camera size={13} className="text-blue-400" />
                    <span>{t('ecommerce.footer.booth', 'Buồng Quét 3D Online')}</span>
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsBiometricModalOpen(true)}
                    className="hover:text-white transition-colors duration-200 flex items-center gap-1.5 bg-transparent border-0 cursor-pointer text-left p-0 text-xs text-stone-400"
                  >
                    <Ruler size={13} className="text-amber-400" />
                    <span>{t('ecommerce.footer.sizingGuide', 'Hướng Dẫn Lấy Số Đo')}</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={openOnboarding}
                    className="hover:text-white transition-colors duration-200 flex items-center gap-1.5 bg-transparent border-0 cursor-pointer text-left p-0 text-xs text-stone-400"
                  >
                    <Store size={13} className="text-emerald-400" />
                    <span>{t('ecommerce.footer.registerMerchant', 'Dành Cho Nhà May & Đối Tác')}</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Quick Actions & Repository */}
            <div className="space-y-2.5 text-left">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                {t('ecommerce.footer.connect', 'Kết Nối & Hỗ Trợ')}
              </h4>
              <ul className="space-y-2 text-stone-400">
                <li>
                  <a
                    href="https://github.com/le-van-thang/C1SE.12-FitVision3D"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white transition-colors duration-200 flex items-center gap-1.5"
                  >
                    <Layers size={13} className="text-purple-400" />
                    <span>{t('ecommerce.footer.github', 'GitHub Repository')}</span>
                  </a>
                </li>
                <li className="text-[11px] text-stone-400">
                  {t('ecommerce.footer.supportEmail', 'Hỗ trợ: support@fitvision3d.com')}
                </li>
                <li className="text-[11px] text-stone-400">
                  {t('ecommerce.footer.hours', 'Hoạt động: 8:00 - 21:00 (T2 - CN)')}
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Copyright and Standards */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-stone-300">
            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
              <span className="font-semibold text-white">© 2026 FitVision 3D Inc.</span>
              <span className="text-stone-700">•</span>
              <span className="px-2 py-0.5 rounded bg-stone-900 border border-stone-700 text-stone-200 font-mono text-[10px]">
                {t('ecommerce.footer.isoBadge', 'Chuẩn ISO 8559-1:2014')}
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 font-mono text-[10px]">
                {t('ecommerce.footer.privacyBadge', 'Bảo Mật RAM 100%')}
              </span>
            </div>

            <p className="text-stone-400 text-center sm:text-right font-medium">
              {t('ecommerce.footer.tagline', 'Thời Trang Vừa Vặn Chuẩn Xác Cho Mọi Vóc Dáng')}
            </p>
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
          alert(t('ecommerce.drawer.checkoutDemoNotice', 'Tính năng thanh toán demo: Đơn hàng đã được ghi nhận với các size tối ưu theo AI!'));
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

