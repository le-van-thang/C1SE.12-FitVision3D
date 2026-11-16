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
  Shirt,
  Eye,
  Package,
  Plus,
  LogOut,
  Clock,
  ChevronUp,
  ChevronDown,
  Copy,
  Check,
  Truck,
  RotateCcw,
  Tag,
} from 'lucide-react';
import { MOCK_PRODUCTS, INITIAL_USER_BODY } from './mockProducts';
import { calculateProductFit } from './fitCalculator';
import { FitAnalysisDrawer } from './FitAnalysisDrawer';
import { SmartCartDrawer } from './SmartCartDrawer';
import { QuickBiometricModal } from './QuickBiometricModal';
import { VellVirtualStudioModal } from './VellVirtualStudioModal';
import { MaisonVellRunwayModal } from './MaisonVellRunwayModal';
import { NowhereThermalSlipModal } from './NowhereThermalSlipModal';
import { FashionSidebarNav } from './FashionSidebarNav';
import { QuickAdminModal } from './QuickAdminModal';
import { CustomerProfileModal } from './CustomerProfileModal';
import { CheckoutModal } from './CheckoutModal';
import { GeminiAssistantWidget } from '@/components/ai/GeminiAssistantWidget';
import type { FashionProduct, ProductVariant, UserBodyProfile, CartItem } from './types';
import { useAuth } from '@/context/AuthContext';
import { useOrders } from '@/context/OrderContext';
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
    categoryTagVi: 'BỘ SƯU TẬP THU ĐÔNG',
    categoryTagEn: 'SARTORIA FALL/WINTER',
    titleVi: 'Áo Blazer Linen Pháp Phom May Đo Tự Nhiên',
    titleEn: 'French Normandy Flax Linen Blazer',
    fabricVi: '100% Vải Linen Tự Nhiên Nhập Khẩu Pháp',
    fabricEn: '100% French Normandy Flax Linen',
    price: 1650000,
    originalPrice: 1950000,
    fitPercentage: 98,
    fitSize: 'L',
    fitChest: 96,
    fitWaist: 78,
    imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1000&q=85',
    badgeLabelVi: 'BÁN CHẠY NHẤT',
    badgeLabelEn: 'BESPOKE BESTSELLER',
    badgeColor: 'bg-amber-500 text-white',
  },
  {
    id: 'slide-oxford',
    productId: 'prod-01',
    categoryTagVi: 'ÁO SƠ MI MAY ĐO CAO CẤP',
    categoryTagEn: 'ROYAL TAILORED SHIRT',
    titleVi: 'Áo Sơ Mi Oxford Dệt Nổi Chuẩn Phom May',
    titleEn: 'Royal Tailored Oxford Textured Shirt',
    fabricVi: '100% Cotton Ai Cập Cao Cấp (Sợi dệt mịn 80/2)',
    fabricEn: '100% Egyptian Giza Cotton (80/2 Combed Yarn)',
    price: 590000,
    originalPrice: 680000,
    fitPercentage: 97,
    fitSize: 'M',
    fitChest: 96,
    fitWaist: 78,
    imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1000&q=85',
    badgeLabelVi: 'GIẢM GIÁ 15%',
    badgeLabelEn: 'HOT DEAL -15%',
    badgeColor: 'bg-red-500 text-white',
  },
  {
    id: 'slide-trouser',
    productId: 'prod-03',
    categoryTagVi: 'QUẦN TÂY PHOM Ý MAY ĐO',
    categoryTagEn: 'SARTORIA MILAN TAILORING',
    titleVi: 'Quần Tây Xếp Ly Đôi Phom Chuẩn Tôn Dáng',
    titleEn: 'Italian Double-Pleated Tapered Trousers',
    fabricVi: 'Chất Liệu Len Pha Cao Cấp (70% Len Úc + 30% Sợi Co Giãn)',
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
    categoryTagVi: 'THỜI TRANG THIẾT KẾ NỮ',
    categoryTagEn: 'HAUTE COUTURE DRESS',
    titleVi: 'Đầm Lụa Satin Cổ Đổ Dáng Rủ Cao Cấp',
    titleEn: 'Mulberry Silk Cowl-Neck Bias Cut Dress',
    fabricVi: '100% Lụa Tơ Tằm Dâu Tự Nhiên Mịn Mượt',
    fabricEn: '100% Mulberry Silk Satin 19 Momme',
    price: 1250000,
    originalPrice: 1450000,
    fitPercentage: 98,
    fitSize: 'XS',
    fitChest: 86,
    fitWaist: 68,
    imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=1000&q=85',
    badgeLabelVi: 'LỤA TỰ NHIÊN',
    badgeLabelEn: 'HANDMADE SILK',
    badgeColor: 'bg-rose-500 text-white',
  },
];

export const FashionStoreHome: React.FC = () => {
  const { isAuthenticated, userRole, currentUser, currentStore, signOut, openSignIn, openOnboarding, openStatusModal } = useAuth();
  const { getUserOrders } = useOrders();
  const { t, locale } = useI18n();

  const userOrders = getUserOrders(currentUser?.id);

  // State: Only expose personalized measurements when authenticated (never show mock data to guests)
  const [userBody, setUserBody] = useState<UserBodyProfile>(INITIAL_USER_BODY);
  const [hasBodyProfile, setHasBodyProfile] = useState<boolean>(false);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      setHasBodyProfile(false);
      setFilterByMyFitOnly(false);
      return;
    }

    const storageKey = `fv3d_user_body_${currentUser.id}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setUserBody(JSON.parse(saved));
        setHasBodyProfile(true);
        return;
      } catch {
        // ignore invalid stored payload
      }
    }

    // Seed default anthropometric profile only for built-in demo accounts
    const isSeededDemo =
      currentUser.id.startsWith('usr-') ||
      (currentUser.email || '').toLowerCase() === 'levanthanglvt01@gmail.com';
    if (isSeededDemo) {
      setUserBody(INITIAL_USER_BODY);
      setHasBodyProfile(true);
    } else {
      setHasBodyProfile(false);
    }
  }, [isAuthenticated, currentUser]);

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterByMyFitOnly, setFilterByMyFitOnly] = useState<boolean>(false);

  // Advanced Filter States
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [priceRange, setPriceRange] = useState<string>('all'); // 'all' | 'under-600' | '600-1000' | 'above-1000'
  const [fabricFilter, setFabricFilter] = useState<string>('all'); // 'all' | 'cotton' | 'silk' | 'wool' | 'linen'
  const [sizeFilter, setSizeFilter] = useState<string>('all'); // 'all' | 'XS' | 'S' | 'M' | 'L' | 'XL'
  const [colorFilter, setColorFilter] = useState<string>('all'); // 'all' | color_hex
  const [sortBy, setSortBy] = useState<string>('default'); // 'default' | 'fit-desc' | 'price-asc' | 'price-desc'
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [copiedVoucherCode, setCopiedVoucherCode] = useState<string | null>(null);

  const availableColorFilters = useMemo(() => {
    const map = new Map<string, string>();
    MOCK_PRODUCTS.forEach((p) => {
      p.variants.forEach((v) => {
        if (!map.has(v.color_hex)) {
          map.set(v.color_hex, v.color_name.split('(')[0].trim());
        }
      });
    });
    return Array.from(map.entries()).map(([hex, name]) => ({ hex, name }));
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterByMyFitOnly) count++;
    if (priceRange !== 'all') count++;
    if (fabricFilter !== 'all') count++;
    if (sizeFilter !== 'all') count++;
    if (colorFilter !== 'all') count++;
    if (sortBy !== 'default') count++;
    return count;
  }, [filterByMyFitOnly, priceRange, fabricFilter, sizeFilter, colorFilter, sortBy]);

  const handleResetAllFilters = () => {
    setActiveCategory('all');
    setSearchQuery('');
    setFilterByMyFitOnly(false);
    setPriceRange('all');
    setFabricFilter('all');
    setSizeFilter('all');
    setColorFilter('all');
    setSortBy('default');
  };

  const handleCopyVoucher = (code: string) => {
    navigator.clipboard?.writeText(code).catch(() => undefined);
    setCopiedVoucherCode(code);
    setTimeout(() => setCopiedVoucherCode(null), 2000);
  };

  // Cart
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Drawers & Modals
  const [analysisProduct, setAnalysisProduct] = useState<FashionProduct | null>(null);
  const [analysisVariant, setAnalysisVariant] = useState<ProductVariant | null>(null);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState<boolean>(false);
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState<boolean>(false);
  const [isVellStudioOpen, setIsVellStudioOpen] = useState<boolean>(false);
  const [isMaisonRunwayOpen, setIsMaisonRunwayOpen] = useState<boolean>(false);
  const [isThermalSlipOpen, setIsThermalSlipOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [profileModalTab, setProfileModalTab] = useState<'profile' | 'membership' | 'measurements' | 'orders' | 'merchant'>('profile');
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const [isBodyProfileCollapsed, setIsBodyProfileCollapsed] = useState<boolean>(false);

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

  // Save body changes per-user in localStorage
  const handleSaveBody = (newBody: UserBodyProfile) => {
    setUserBody(newBody);
    setHasBodyProfile(true);
    if (isAuthenticated && currentUser) {
      localStorage.setItem(`fv3d_user_body_${currentUser.id}`, JSON.stringify(newBody));
    }
  };

  // Gated actions for personalized 3D Studio & Biometric measurements
  const handleOpenBiometrics = () => {
    if (!isAuthenticated) {
      openSignIn();
      return;
    }
    setIsBiometricModalOpen(true);
  };

  const handleOpenVirtualStudio = () => {
    setIsVellStudioOpen(true);
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

      // Size & Color filter
      const matchSize = sizeFilter === 'all' || item.variants.some((v) => v.size_label === sizeFilter);
      const matchColor = colorFilter === 'all' || item.variants.some((v) => v.color_hex === colorFilter);

      return matchCat && matchSearch && matchFit && matchPrice && matchFabric && matchSize && matchColor;
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
  }, [productsWithFit, activeCategory, searchQuery, filterByMyFitOnly, priceRange, fabricFilter, sizeFilter, colorFilter, sortBy, locale]);

  // Category counts for vertical sidebar and horizontal tabs
  const categoryCounts = useMemo(() => {
    return {
      all: MOCK_PRODUCTS.length,
      shirt: MOCK_PRODUCTS.filter((p) => p.category === 'shirt').length,
      polo: MOCK_PRODUCTS.filter((p) => p.category === 'polo').length,
      pants: MOCK_PRODUCTS.filter((p) => p.category === 'pants').length,
      dress: MOCK_PRODUCTS.filter((p) => p.category === 'dress').length,
      tailored: MOCK_PRODUCTS.filter((p) => p.category === 'tailored').length,
    };
  }, []);

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

  const handleChangeCartVariant = (cartItemId: string, newVariantId: string) => {
    setCartItems((prev) =>
      prev.map((ci) => {
        if (ci.id !== cartItemId) return ci;
        const nextVariant = ci.product.variants.find((v) => v.id === newVariantId);
        if (!nextVariant) return ci;
        const fit = calculateProductFit(userBody, ci.product);
        return {
          ...ci,
          variant: nextVariant,
          fit_score: fit.match_percentage,
          is_ai_recommended: nextVariant.size_label === fit.recommended_size,
        };
      })
    );
  };

  const handleAddComboToCart = (productIds: string[]) => {
    const toAdd = MOCK_PRODUCTS.filter((p) => productIds.includes(p.id));
    if (toAdd.length === 0) return;

    setCartItems((prev) => {
      let next = [...prev];
      toAdd.forEach((product) => {
        const fit = calculateProductFit(userBody, product);
        const recVariant = product.variants.find((v) => v.size_label === fit.recommended_size) || product.variants[0];
        const existingIdx = next.findIndex(
          (ci) => ci.product.id === product.id && ci.variant.id === recVariant.id
        );
        if (existingIdx >= 0) {
          next[existingIdx] = { ...next[existingIdx], quantity: next[existingIdx].quantity + 1 };
        } else {
          next.push({
            id: `cart-${Date.now()}-${product.id}-${Math.random().toString(36).substr(2, 4)}`,
            product,
            variant: recVariant,
            quantity: 1,
            fit_score: fit.match_percentage,
            is_ai_recommended: recVariant.size_label === fit.recommended_size,
          });
        }
      });
      return next;
    });
    setIsCartOpen(true);
  };

  const handleOpenAnalysis = (product: FashionProduct) => {
    if (!isAuthenticated) {
      openSignIn();
      return;
    }
    if (!hasBodyProfile) {
      setIsBiometricModalOpen(true);
      return;
    }
    const fit = calculateProductFit(userBody, product);
    const variant =
      product.variants.find((v) => v.size_label === fit.recommended_size) || product.variants[0];
    setAnalysisProduct(product);
    setAnalysisVariant(variant);
    setIsAnalysisOpen(true);
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#14161A] font-sans flex flex-col antialiased selection:bg-blue-100 selection:text-blue-900">

      {/* ── UNIFIED STICKY TOP STACK: MARQUEE + OBSIDIAN HEADER + WHITE CATEGORY NAV ── */}
      <div className="sticky top-0 z-40 w-full shadow-md">
        {/* ── BAND 1: TOP EDITORIAL CONTINUOUS MARQUEE ANNOUNCEMENT BAR ── */}
        <div className="bg-[#0B0D10] text-amber-300 text-[11px] font-semibold border-b border-white/10 overflow-hidden">
          <div className="h-8 flex items-center overflow-hidden">
            <div className="animate-fv-marquee flex items-center">
              {[0, 1].map((dupIdx) => (
                <div key={dupIdx} className="flex items-center gap-8 pr-8 whitespace-nowrap">
                  <span className="flex items-center gap-1.5 text-amber-300">
                    <Sparkles size={11} />
                    <span>{locale === 'en' ? 'ISO 8559-1 Anthropometric 3D Sizing' : 'Đo Size Chuẩn Nhân Trắc Học ISO 8559'}</span>
                  </span>
                  <span className="text-stone-600">•</span>
                  <span className="text-stone-200">
                    {locale === 'en' ? 'Free 14-Day Fit Adjustment Guarantee' : 'Đổi sửa size vừa vặn miễn phí trong 14 ngày'}
                  </span>
                  <span className="text-stone-600">•</span>
                  <span className="text-emerald-400">
                    {locale === 'en' ? 'Freeship Express Orders from 1,000,000₫' : 'Freeship hỏa tốc đơn hàng từ 1.000.000₫'}
                  </span>
                  <span className="text-stone-600">•</span>
                  <span className="text-stone-200">
                    {locale === 'en' ? 'Zero-Retention In-Memory Image Privacy 100%' : 'Bảo mật ảnh xử lý tạm thời RAM 100%'}
                  </span>
                  <span className="text-stone-600">•</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── BAND 2: PRIMARY DARK EDITORIAL HEADER ── */}
        <header className="relative z-30 bg-[#14171C] text-white border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-5">
            
            {/* Left: Menu Drawer Toggle (Desktop & Mobile) + Brand Wordmark */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/15 text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label={t('ecommerce.sidebar.openMenu', 'Mở menu danh mục & 3D')}
                title={t('ecommerce.sidebar.openMenu', 'Danh mục & Tính năng 3D')}
              >
                <Menu size={18} />
              </button>

              <a href="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm group-hover:bg-blue-500 transition-colors">
                  <Scissors size={17} strokeWidth={2.2} />
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-base sm:text-lg tracking-wider uppercase text-white leading-none">
                    FitVision <span className="text-blue-400">3D</span>
                  </span>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-stone-400 hidden sm:block mt-0.5">
                    {t('ecommerce.sidebar.brandSub', 'Atelier & May Đo 3D')}
                  </span>
                </div>
              </a>
            </div>

            {/* Center (Desktop): Crisp White Search Bar on Dark Header */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const el = document.getElementById('catalog');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hidden md:flex flex-1 max-w-md lg:max-w-lg"
            >
              <div className="flex items-center w-full h-10 pl-4 pr-1 rounded-xl bg-white text-slate-900 border border-white/20 focus-within:ring-2 focus-within:ring-blue-500 transition-all shadow-inner">
                <input
                  type="text"
                  placeholder={t('ecommerce.catalog.searchPlaceholder', 'Bạn đang tìm áo sơ mi, blazer, quần tây...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-full bg-transparent border-0 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 pr-2"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 mr-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
                <button
                  type="submit"
                  className="h-8 px-3 rounded-lg bg-[#14171C] hover:bg-blue-600 text-white flex items-center justify-center gap-1.5 text-xs font-bold transition-colors cursor-pointer shrink-0"
                  aria-label="Search"
                >
                  <Search size={14} />
                  <span className="hidden lg:inline">{t('ecommerce.topbar.searchBtn', 'Tìm')}</span>
                </button>
              </div>
            </form>

            {/* Right: Language Switch + 3D Tools + Account Popover + Cart */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              <div className="hidden sm:block">
                <LanguageSwitcher compact variant="dark" />
              </div>

              {/* Phòng Thử Đồ Ảo 3D */}
              <button
                type="button"
                onClick={handleOpenVirtualStudio}
                className="hidden xl:flex flex-col items-center justify-center px-2.5 py-1 rounded-lg hover:bg-white/10 text-stone-200 hover:text-white transition-colors cursor-pointer"
                title={t('ecommerce.topbar.virtualRoom', 'Phòng Thử Đồ Ảo 3D')}
              >
                <Sparkles size={17} className="text-blue-400" />
                <span className="text-[10px] font-semibold mt-0.5 whitespace-nowrap">
                  {locale === 'en' ? '3D Try-On' : 'Thử Đồ 3D'}
                </span>
              </button>

              {/* Quét Đo AI 3D (ISO) */}
              <a
                href="/dashboard"
                className="hidden sm:flex flex-col items-center justify-center px-2.5 py-1 rounded-lg hover:bg-white/10 text-stone-200 hover:text-white transition-colors cursor-pointer"
                title={t('ecommerce.topbar.aiScan', 'Quét Đo AI 3D (ISO)')}
              >
                <Camera size={17} className="text-emerald-400" />
                <span className="text-[10px] font-semibold mt-0.5 whitespace-nowrap">
                  {locale === 'en' ? '3D Scan' : 'Quét AI 3D'}
                </span>
              </a>

              {/* Tài Khoản (Popover Dropdown khi đã đăng nhập / Nút Đăng nhập khi chưa) */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center overflow-hidden shrink-0">
                      {currentUser?.avatar_url ? (
                        <img
                          src={currentUser.avatar_url}
                          alt={currentUser.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (currentUser?.full_name || 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="hidden md:block text-left max-w-[110px]">
                      <span className="text-xs font-bold text-white block truncate leading-none">
                        {currentUser?.full_name || t('ecommerce.sidebar.customerDefault', 'Khách Hàng')}
                      </span>
                      <span className={`text-[9px] font-semibold block truncate mt-0.5 ${userRole === 'admin' ? 'text-amber-300' : 'text-blue-300'}`}>
                        {userRole === 'admin'
                          ? (locale === 'en' ? '🛡️ Super Admin' : '🛡️ Quản Trị Viên')
                          : userRole === 'store' || currentStore?.status === 'APPROVED'
                          ? t('ecommerce.sidebar.roleStore', '✂️ Chủ Shop')
                          : currentStore?.status === 'PENDING'
                          ? t('ecommerce.sidebar.rolePending', '⏳ Chờ Duyệt')
                          : t('ecommerce.sidebar.roleCustomer', 'Khách Hàng')}
                      </span>
                    </div>
                    <ChevronDown size={13} className={`text-stone-300 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isUserMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsUserMenuOpen(false)}
                      />
                      <div className="absolute top-full right-0 mt-2.5 w-72 bg-slate-100 rounded-2xl border border-slate-300 shadow-2xl z-50 animate-in slide-in-from-top-2 duration-150 overflow-hidden text-slate-900">
                        <div className="px-4 py-3 bg-[#14171C] text-white flex items-center justify-between">
                          <div className="min-w-0">
                            <span className={`text-[10px] font-bold uppercase tracking-wider block ${userRole === 'admin' ? 'text-amber-300' : 'text-blue-400'}`}>
                              {userRole === 'admin'
                                ? 'SUPER ADMINISTRATOR'
                                : t('ecommerce.sidebar.menuTitle', 'Tài Khoản Cá Nhân')}
                            </span>
                            <span className="text-xs font-mono font-semibold text-white truncate block">
                              {currentUser?.email}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
                          >
                            <X size={13} />
                          </button>
                        </div>

                        <div className="p-2 space-y-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              setProfileModalTab('profile');
                              setIsProfileModalOpen(true);
                            }}
                            className="w-full px-3 py-2 rounded-xl text-left bg-white hover:bg-blue-50 text-xs font-bold text-slate-800 flex items-center justify-between border border-slate-200 hover:border-blue-300 cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <UserIcon size={14} className="text-blue-600" />
                              <span>{t('ecommerce.sidebar.menuProfile', 'Hồ sơ cá nhân & Chỉnh sửa')}</span>
                            </div>
                            <ChevronRight size={13} className="text-slate-400" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              setProfileModalTab('orders');
                              setIsProfileModalOpen(true);
                            }}
                            className="w-full px-3 py-2 rounded-xl text-left bg-white hover:bg-blue-50 text-xs font-bold text-slate-800 flex items-center justify-between border border-slate-200 hover:border-blue-300 cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <Package size={14} className="text-blue-600" />
                              <span>{t('ecommerce.sidebar.menuOrders', 'Đơn hàng của tôi')}</span>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-blue-600 text-white">
                              {userOrders.length}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              setProfileModalTab('measurements');
                              setIsProfileModalOpen(true);
                            }}
                            className="w-full px-3 py-2 rounded-xl text-left bg-white hover:bg-purple-50 text-xs font-bold text-slate-800 flex items-center justify-between border border-slate-200 hover:border-purple-300 cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <Ruler size={14} className="text-purple-600" />
                              <span>{t('ecommerce.sidebar.menuMeasurements', 'Số đo vóc dáng 3D')}</span>
                            </div>
                            <ChevronRight size={13} className="text-slate-400" />
                          </button>

                          {userRole === 'admin' ? (
                            <div className="space-y-1.5">
                              <a
                                href="/admin"
                                className="w-full px-3 py-2 rounded-xl text-left bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white flex items-center justify-between cursor-pointer transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <ShieldCheck size={14} />
                                  <span>{locale === 'en' ? 'Admin Control Portal (/admin)' : 'Cổng Quản Trị Admin (/admin)'}</span>
                                </div>
                                <ChevronRight size={13} />
                              </a>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsUserMenuOpen(false);
                                  setIsAdminModalOpen(true);
                                }}
                                className="w-full px-3 py-2 rounded-xl text-left bg-white hover:bg-indigo-50 text-xs font-bold text-indigo-800 flex items-center justify-between border border-indigo-200 cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  <SlidersHorizontal size={14} />
                                  <span>{locale === 'en' ? 'Quick Approve Stores' : 'Duyệt Shop & Quản Lý Nhanh'}</span>
                                </div>
                                <ChevronRight size={13} className="text-indigo-400" />
                              </button>
                            </div>
                          ) : userRole === 'store' || currentStore?.status === 'APPROVED' ? (
                            <a
                              href="/tailor"
                              className="w-full px-3 py-2 rounded-xl text-left bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white flex items-center justify-between cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <Store size={14} />
                                <span>{t('ecommerce.sidebar.menuTailorChannel', 'Vào Kênh Nhà May (/tailor)')}</span>
                              </div>
                              <ChevronRight size={13} />
                            </a>
                          ) : currentStore?.status === 'PENDING' ? (
                            <button
                              type="button"
                              onClick={() => {
                                setIsUserMenuOpen(false);
                                openStatusModal();
                              }}
                              className="w-full px-3 py-2 rounded-xl text-left bg-amber-50 hover:bg-amber-100 text-xs font-bold text-amber-900 flex items-center justify-between border border-amber-300 cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <Clock size={14} className="text-amber-600 animate-pulse" />
                                <span>{t('ecommerce.sidebar.menuPendingApproval', 'Hồ sơ chờ Admin duyệt')}</span>
                              </div>
                              <ChevronRight size={13} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setIsUserMenuOpen(false);
                                setProfileModalTab('merchant');
                                setIsProfileModalOpen(true);
                              }}
                              className="w-full px-3 py-2 rounded-xl text-left bg-amber-500 hover:bg-amber-600 text-xs font-bold text-white flex items-center justify-between cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <Store size={14} />
                                <span>{t('ecommerce.sidebar.menuRegisterStore', 'Đăng ký mở gian hàng')}</span>
                              </div>
                              <ChevronRight size={13} />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              signOut();
                            }}
                            className="w-full px-3 py-2 rounded-xl text-left bg-rose-50 hover:bg-rose-100 text-xs font-bold text-rose-700 flex items-center gap-2 border border-rose-200 cursor-pointer"
                          >
                            <LogOut size={14} />
                            <span>{t('ecommerce.sidebar.menuSignOut', 'Đăng xuất tài khoản')}</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={openSignIn}
                  className="flex flex-col items-center justify-center px-2.5 py-1 rounded-lg hover:bg-white/10 text-stone-200 hover:text-white transition-colors cursor-pointer"
                >
                  <UserIcon size={17} />
                  <span className="text-[10px] font-semibold mt-0.5 whitespace-nowrap">
                    {t('ecommerce.topbar.login', 'Đăng Nhập')}
                  </span>
                </button>
              )}

              {/* Giỏ Hàng */}
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative flex flex-col items-center justify-center px-2.5 py-1 rounded-lg hover:bg-white/10 text-stone-200 hover:text-white transition-colors cursor-pointer"
              >
                <div className="relative">
                  <ShoppingBag size={17} />
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-amber-400 text-slate-950 text-[9px] font-mono font-extrabold flex items-center justify-center shadow-xs">
                    {totalCartCount}
                  </span>
                </div>
                <span className="text-[10px] font-semibold mt-0.5 whitespace-nowrap">
                  {t('ecommerce.topbar.cart', 'Giỏ Hàng')}
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* ── BAND 3: CRISP WHITE CATEGORY NAVIGATION BAR WITH HOVER MEGA-MENU (Z-20 UNDER STICKY HEADER) ── */}
        <nav
          className="bg-white border-b border-slate-200 hidden lg:block relative z-20"
          onMouseLeave={() => setActiveMegaMenu(null)}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-11 flex items-center justify-between gap-3">
            <div className="flex items-center gap-4 xl:gap-5 min-w-0">
              {[
                { id: 'all', label: locale === 'en' ? 'ALL ITEMS' : 'TẤT CẢ', megaKey: null },
                { id: 'shirt', label: locale === 'en' ? 'SHIRTS' : 'ÁO SƠ MI', megaKey: 'tops' },
                { id: 'polo', label: locale === 'en' ? 'POLO' : 'ÁO POLO', megaKey: 'tops' },
                { id: 'pants', label: locale === 'en' ? 'TROUSERS & CHINO' : 'QUẦN TÂY & CHINO', megaKey: 'bottoms' },
                { id: 'dress', label: locale === 'en' ? 'SILK DRESSES' : 'ĐẦM LỤA', megaKey: 'bottoms' },
                { id: 'tailored', label: locale === 'en' ? 'BESPOKE' : 'MAY ĐO BESPOKE', megaKey: 'tops' },
              ].map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onMouseEnter={() => setActiveMegaMenu(cat.megaKey)}
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setActiveMegaMenu(null);
                      const el = document.getElementById('catalog');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`relative h-11 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                      isActive ? 'text-blue-600' : 'text-slate-700 hover:text-slate-950'
                    }`}
                  >
                    <span>{cat.label}</span>
                    {cat.megaKey && <ChevronDown size={11} className="opacity-60" />}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                    )}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={handleOpenVirtualStudio}
                className="h-7 px-3 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
              >
                <Sparkles size={11} className="shrink-0" />
                <span>{locale === 'en' ? '3D STUDIO' : 'PHÒNG THỬ ĐỒ 3D'}</span>
              </button>
            </div>

            {/* Live 3D Body Status Pill on Right */}
            <button
              type="button"
              onClick={!isAuthenticated ? openSignIn : handleOpenBiometrics}
              className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[11px] font-semibold text-slate-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${isAuthenticated && hasBodyProfile ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              {isAuthenticated && hasBodyProfile ? (
                <span className="font-mono font-bold text-slate-900">
                  {userBody.height_cm}cm · {userBody.weight_kg}kg
                </span>
              ) : (
                <span>
                  {!isAuthenticated
                    ? (locale === 'en' ? '3D Profile' : 'Chưa đồng bộ 3D')
                    : (locale === 'en' ? 'Set 3D Size' : 'Thiết lập số đo 3D')}
                </span>
              )}
            </button>
          </div>

          {/* Floating Image-Card Mega-Menu Panel (Torano-Inspired Visual Taxonomy) */}
          {activeMegaMenu && (
            <div className="absolute left-0 right-0 top-11 bg-white border-b border-slate-200 shadow-xl z-40 animate-in fade-in duration-150">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                    {activeMegaMenu === 'tops'
                      ? (locale === 'en' ? 'Tops, Shirts, Polos & Bespoke Blazers' : 'Áo Sơ Mi · Polo · Blazer May Đo ISO 8559')
                      : (locale === 'en' ? 'Italian Trousers, Chinos & Mulberry Silk Dresses' : 'Quần Tây · Chino Ý & Đầm Lụa Mulberry')}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCategory('all');
                      setActiveMegaMenu(null);
                    }}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    {locale === 'en' ? 'View full collection »' : 'Xem tất cả sản phẩm »'}
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  {(activeMegaMenu === 'tops'
                    ? [
                        { id: 'shirt', fabric: 'cotton', labelVi: 'Áo Sơ Mi Oxford Ai Cập', labelEn: 'Egyptian Cotton Shirts', img: MOCK_PRODUCTS[0].image_url, count: categoryCounts.shirt },
                        { id: 'polo', fabric: 'silk', labelVi: 'Áo Polo Lụa Piqué', labelEn: 'Silk Blend Polos', img: MOCK_PRODUCTS[1].image_url, count: categoryCounts.polo },
                        { id: 'tailored', fabric: 'linen', labelVi: 'Blazer Linen Pháp', labelEn: 'French Linen Blazers', img: MOCK_PRODUCTS[4].image_url, count: categoryCounts.tailored },
                        { id: 'all', fabric: 'all', labelVi: 'Thử Đồ Ảo 3D Studio', labelEn: '3D Virtual Fitting Room', img: MOCK_PRODUCTS[0].secondary_image_url || MOCK_PRODUCTS[0].image_url, isStudio: true, count: categoryCounts.all },
                      ]
                    : [
                        { id: 'pants', fabric: 'wool', labelVi: 'Quần Tây Xếp Ly Ý', labelEn: 'Italian Wool Trousers', img: MOCK_PRODUCTS[2].image_url, count: 1 },
                        { id: 'pants', fabric: 'cotton', labelVi: 'Quần Chino Co Giãn 4D', labelEn: 'Stretch Cotton Chinos', img: MOCK_PRODUCTS[5].image_url, count: 1 },
                        { id: 'dress', fabric: 'silk', labelVi: 'Đầm Lụa Satin Bias-Cut', labelEn: 'Mulberry Silk Dresses', img: MOCK_PRODUCTS[3].image_url, count: categoryCounts.dress },
                        { id: 'all', fabric: 'all', labelVi: 'Xem Toàn Bộ Phối Đồ', labelEn: 'Browse Mix & Match', img: MOCK_PRODUCTS[2].image_url, isLookbook: true, count: categoryCounts.all },
                      ]
                  ).map((tile, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setActiveMegaMenu(null);
                        if ('isStudio' in tile && tile.isStudio) {
                          handleOpenVirtualStudio();
                          return;
                        }
                        if ('isLookbook' in tile && tile.isLookbook) {
                          setActiveCategory('all');
                          setFabricFilter('all');
                          const lb = document.getElementById('lookbook-combo');
                          if (lb) lb.scrollIntoView({ behavior: 'smooth' });
                          return;
                        }
                        setActiveCategory(tile.id);
                        setFabricFilter(tile.fabric);
                        const el = document.getElementById('catalog');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="group text-left rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/60 hover:bg-white p-2.5 flex items-center gap-3 transition-all cursor-pointer"
                    >
                      <img
                        src={tile.img}
                        alt=""
                        className="w-14 h-18 object-cover rounded-lg border border-slate-200 flex-shrink-0 group-hover:scale-105 transition-transform"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-extrabold text-slate-900 group-hover:text-blue-600 block line-clamp-2">
                          {locale === 'en' ? tile.labelEn : tile.labelVi}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-500 mt-1 block">
                          {tile.count} {locale === 'en' ? 'items' : 'mẫu chuẩn phom'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </nav>
      </div>

      {/* ── MAIN CONTENT WRAPPER ── */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* ── BAND 4: WIDE EDITORIAL STUDIO-GRAY HERO BANNER ── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#7B7A76] via-[#6B6A66] to-[#585754] text-white border-b border-stone-500/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              {/* Left Column: Editorial Serif Headline & CTAs */}
              <div className="lg:col-span-7 space-y-5 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 text-amber-200 border border-white/20 text-[11px] font-bold tracking-wider uppercase backdrop-blur-xs">
                  <Sparkles size={13} className="text-amber-300" />
                  <span>{t('ecommerce.hero.badge', 'NỀN TẢNG THỜI TRANG MAY ĐO & ĐO SIZE 3D THẾ HỆ MỚI')}</span>
                </div>

                <h1 className="font-display text-3xl sm:text-5xl lg:text-[50px] font-bold tracking-normal text-white leading-[1.18] drop-shadow-xs">
                  {t('ecommerce.hero.title1', 'Phong Cách May Đo')} <br className="hidden sm:inline" />
                  <span className="text-amber-200 italic">{t('ecommerce.hero.titleHighlight', 'Chuẩn Xác')}</span>{' '}
                  {t('ecommerce.hero.title2', 'Theo Vóc Dáng Bạn.')}
                </h1>

                <p className="text-stone-100/95 text-sm sm:text-base leading-relaxed max-w-xl font-normal">
                  {t('ecommerce.hero.desc', 'Không còn nỗi lo chọn nhầm size hay phiền phức đổi trả. Thuật toán Trí Tuệ Nhân Tạo tự động phân tích vóc dáng và so khớp độ cử động (Ease Allowance) với từng đường kim mũi chỉ của nhà may.')}
                </p>

                <div className="flex items-center gap-2.5 flex-wrap pt-2">
                  <button
                    type="button"
                    onClick={handleOpenVirtualStudio}
                    className="h-11 px-4 sm:px-5 rounded-xl bg-white hover:bg-stone-100 active:scale-95 text-[#14171C] font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer"
                  >
                    <Sparkles size={15} className="text-blue-600 shrink-0" />
                    <span>{locale === 'en' ? '3D Virtual Try-On' : 'Thử Đồ Ảo 3D'}</span>
                  </button>

                  <a
                    href="/dashboard"
                    className="h-11 px-4 sm:px-5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer border border-blue-400/40"
                  >
                    <Camera size={15} className="text-white shrink-0" />
                    <span>{t('ecommerce.hero.ctaScan', 'Quét Vóc Dáng AI 30s')}</span>
                  </a>

                  {isAuthenticated && userRole !== 'store' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setProfileModalTab('merchant');
                        setIsProfileModalOpen(true);
                      }}
                      className="h-11 px-4 sm:px-5 rounded-xl bg-[#F5EBD8] hover:bg-white active:scale-95 text-[#14171C] font-bold text-xs sm:text-sm shadow-md border border-[#E5D3B3] flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer"
                    >
                      <Store size={15} className="text-[#9A6E27] shrink-0" />
                      <span>{locale === 'en' ? 'Open Tailor Store' : 'Mở Gian Hàng May Đo'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('catalog');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="h-11 px-4 sm:px-5 rounded-xl bg-[#F5EBD8] hover:bg-white active:scale-95 text-[#14171C] font-bold text-xs sm:text-sm shadow-md border border-[#E5D3B3] flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer"
                    >
                      <ShoppingBag size={15} className="text-[#9A6E27] shrink-0" />
                      <span>{t('ecommerce.hero.ctaExplore', 'Khám Phá Bộ Sưu Tập')}</span>
                    </button>
                  )}
                </div>

                {/* Architectural Editorial Proof Strip inside Hero */}
                <div className="pt-5 mt-2 border-t border-white/20 grid grid-cols-3 gap-4 max-w-xl">
                  <div>
                    <span className="font-mono text-base sm:text-lg font-extrabold text-amber-200 block leading-tight">
                      {t('ecommerce.hero.statLandmarks', '13 Mốc')}
                    </span>
                    <span className="text-[11px] text-stone-200/90 font-medium">
                      {t('ecommerce.hero.statLandmarksSub', 'Chuẩn may đo ISO 8559-1')}
                    </span>
                  </div>
                  <div className="border-l border-white/15 pl-4">
                    <span className="font-mono text-base sm:text-lg font-extrabold text-white block leading-tight">
                      &lt; 1.2%
                    </span>
                    <span className="text-[11px] text-stone-200/90 font-medium">
                      {locale === 'en' ? 'Ramanujan 3D accuracy' : 'Sai số cắt lớp Elip 3D'}
                    </span>
                  </div>
                  <div className="border-l border-white/15 pl-4">
                    <span className="font-mono text-base sm:text-lg font-extrabold text-emerald-300 block leading-tight">
                      0s Save
                    </span>
                    <span className="text-[11px] text-stone-200/90 font-medium">
                      {locale === 'en' ? 'RAM zero-retention privacy' : 'Xóa ảnh tức thì trên RAM'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Product Slide Preview */}
              <div
                className="lg:col-span-5 relative"
                onMouseEnter={() => setIsBannerPaused(true)}
                onMouseLeave={() => setIsBannerPaused(false)}
              >
                <div className="relative mx-auto max-w-md lg:max-w-none aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border border-white/15 bg-stone-900 group">
                  <img
                    src={HERO_PRODUCT_SLIDES[activeBannerSlide].imageUrl}
                    alt={HERO_PRODUCT_SLIDES[activeBannerSlide].titleVi}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                  {/* Top Floating Match Badge — Show personalized % only when signed in with measurements */}
                  <div className="absolute top-4 right-4 z-10 animate-in fade-in slide-in-from-top-2">
                    {isAuthenticated && hasBodyProfile ? (
                      <div className="bg-emerald-600 text-white px-3 py-1.5 rounded-2xl shadow-xl flex items-center gap-1.5 text-xs font-mono font-black border border-emerald-400/40">
                        <CheckCircle2 size={14} />
                        <span>{HERO_PRODUCT_SLIDES[activeBannerSlide].fitPercentage}% {t('ecommerce.hero.perfectFit', 'Vừa Vặn Tuyệt Đối')}</span>
                      </div>
                    ) : (
                      <div className="bg-slate-900/85 backdrop-blur-md text-white px-3 py-1.5 rounded-2xl shadow-xl flex items-center gap-1.5 text-xs font-bold border border-white/20">
                        <Ruler size={13} className="text-blue-400" />
                        <span>{locale === 'en' ? 'ISO 8559 3D Tailored' : 'Chuẩn May Đo ISO 8559'}</span>
                      </div>
                    )}
                  </div>

                  {/* Slide Carousel Controls */}
                  <button
                    type="button"
                    onClick={() =>
                      setActiveBannerSlide(
                        (prev) => (prev - 1 + HERO_PRODUCT_SLIDES.length) % HERO_PRODUCT_SLIDES.length
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center backdrop-blur-sm transition-all cursor-pointer opacity-70 group-hover:opacity-100"
                    aria-label="Previous Slide"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setActiveBannerSlide((prev) => (prev + 1) % HERO_PRODUCT_SLIDES.length)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center backdrop-blur-sm transition-all cursor-pointer opacity-70 group-hover:opacity-100"
                    aria-label="Next Slide"
                  >
                    <ChevronRight size={16} />
                  </button>

                  {/* Bottom Product Details Card */}
                  <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-black/55 backdrop-blur-md border border-white/20 text-white space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold block">
                      {locale === 'en' ? HERO_PRODUCT_SLIDES[activeBannerSlide].categoryTagEn : HERO_PRODUCT_SLIDES[activeBannerSlide].categoryTagVi}
                    </span>
                    <h3 className="text-sm font-bold text-white leading-snug line-clamp-1">
                      {locale === 'en' ? HERO_PRODUCT_SLIDES[activeBannerSlide].titleEn : HERO_PRODUCT_SLIDES[activeBannerSlide].titleVi}
                    </h3>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-amber-300 font-mono font-bold">
                        {HERO_PRODUCT_SLIDES[activeBannerSlide].price.toLocaleString('vi-VN')} ₫
                      </span>
                      {isAuthenticated && hasBodyProfile ? (
                        <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-700/60 font-bold">
                          {t('ecommerce.hero.suggestedSize', 'Gợi ý: Size {size}').replace('{size}', HERO_PRODUCT_SLIDES[activeBannerSlide].fitSize)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-200 bg-slate-900/70 px-2 py-0.5 rounded-md border border-white/20 font-semibold">
                          {locale === 'en' ? 'Sign in for AI size' : 'Đăng nhập để gợi ý size'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Slide Indicators */}
                  <div className="absolute bottom-1 left-0 right-0 flex items-center justify-center gap-1.5 pb-1">
                    {HERO_PRODUCT_SLIDES.map((slide, idx) => (
                      <button
                        key={slide.id}
                        type="button"
                        onClick={() => setActiveBannerSlide(idx)}
                        className={`h-1.5 rounded-full transition-all cursor-pointer ${
                          activeBannerSlide === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
                        }`}
                        aria-label={`Slide ${idx + 1}`}
                      />
                    ))}
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>

      {/* ── BAND 4B: EXCLUSIVE BESPOKE VOUCHER STRIP (CHAMPAGNE CREAM #F5EBD8) ── */}
      <section className="bg-[#F5EBD8]/75 border-b border-amber-200/80 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#14171C] text-amber-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Tag size={10} />
                <span>{locale === 'en' ? 'Website Exclusive' : 'Ưu Đãi Độc Quyền Web'}</span>
              </span>
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
                {locale === 'en' ? 'Bespoke Tailoring & ISO 8559 Privileges' : 'Đặc Quyền May Đo & Quét Dáng 3D'}
              </h3>
            </div>
            <span className="text-[11px] font-medium text-slate-600">
              {locale === 'en' ? 'Click any voucher code to copy instantly' : 'Chạm vào mã để sao chép nhanh khi thanh toán'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                code: 'FITVISION50',
                titleVi: 'Giảm 50.000₫ cho mọi đơn từ 600K',
                titleEn: '50,000₫ off orders from 600K',
                subVi: 'Áp dụng khi chọn size theo gợi ý AI ISO 8559',
                subEn: 'Applies with ISO 8559 AI size match',
              },
              {
                code: 'TAILOR100',
                titleVi: 'Giảm 100.000₫ Bộ May Đo Bespoke',
                titleEn: '100,000₫ off Bespoke Sets',
                subVi: 'Dành riêng cho Blazer Linen & Đầm Lụa Mulberry',
                subEn: 'Valid for Linen Blazer & Mulberry Silk',
              },
              {
                code: 'FREESHIP3D',
                titleVi: 'Freeship Hỏa Tốc + Đổi Size 14 Ngày',
                titleEn: 'Free Express + 14-Day Fit Swap',
                subVi: 'Miễn phí chỉnh sửa phom dáng tận nhà toàn quốc',
                subEn: 'Complimentary nationwide door-to-door adjustment',
              },
            ].map((v) => {
              const isCopied = copiedVoucherCode === v.code;
              return (
                <div
                  key={v.code}
                  onClick={() => handleCopyVoucher(v.code)}
                  className="bg-white rounded-xl border border-amber-200/90 hover:border-[#C8963E] p-3 flex items-center justify-between gap-3 shadow-2xs transition-all cursor-pointer group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-black text-slate-950 tracking-wider">
                        {v.code}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    </div>
                    <p className="text-xs font-bold text-slate-900 truncate mt-0.5">
                      {locale === 'en' ? v.titleEn : v.titleVi}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {locale === 'en' ? v.subEn : v.subVi}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 flex-shrink-0 transition-colors cursor-pointer ${
                      isCopied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#14171C] text-white group-hover:bg-blue-600'
                    }`}
                  >
                    {isCopied ? <Check size={11} /> : <Copy size={11} />}
                    <span>{isCopied ? (locale === 'en' ? 'Copied' : 'Đã chép') : (locale === 'en' ? 'Copy' : 'Sao chép')}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── BAND 5: 2-COLUMN EDITORIAL CATALOG SECTION ── */}
      <main id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 flex-1 w-full">

        {/* Editorial Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 mb-6 border-b border-slate-200">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600">
              {t('ecommerce.catalog.tagline', 'BỘ SƯU TẬP THỜI TRANG THÔNG MINH')}
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#14171C] tracking-tight mt-1">
              {t('ecommerce.catalog.heading', 'Khám Phá Kích Cỡ Dành Riêng Cho Bạn')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              {t('ecommerce.catalog.subheading', 'Tất cả sản phẩm đã được AI tính toán sẵn kích cỡ tối ưu dựa trên số đo của bạn')}
            </p>
          </div>

          <div className="self-start md:self-auto flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleOpenVirtualStudio}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#14171C] hover:bg-black text-white text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Sparkles size={15} className="text-amber-400" />
              <span>{t('ecommerce.sidebar.virtualTryOn', 'Thử Đồ Ảo 3D')}</span>
            </button>

            <a
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Camera size={15} className="text-white" />
              <span>{t('ecommerce.topbar.aiScan', 'Quét Đo AI 3D (ISO)')}</span>
            </a>
          </div>
        </div>

        {/* ── GUEST ONBOARDING BAR (When not authenticated) ── */}
        {!isAuthenticated && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-slate-50 to-white border border-blue-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
                <Sparkles size={17} />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                  {t('ecommerce.guestBanner.title', 'Trải nghiệm mua sắm chuẩn may đo cá nhân hóa')}
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5">
                  {t('ecommerce.guestBanner.desc', 'Đăng nhập để tự động lưu số đo vóc dáng 13 điểm chuẩn ISO 8559 và nhận đề xuất size chính xác cho mọi thương hiệu.')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
              <button
                type="button"
                onClick={openSignIn}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                {t('ecommerce.guestBanner.login', 'Đăng Nhập')}
              </button>
              <button
                type="button"
                onClick={handleOpenBiometrics}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                {t('ecommerce.guestBanner.quickMeasurements', 'Nhập Số Đo Nhanh')}
              </button>
            </div>
          </div>
        )}

        {/* ── SUPER ADMIN COMMAND BAR (When browsing storefront as Admin) ── */}
        {userRole === 'admin' && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-indigo-50 via-slate-50 to-white border-[1.5px] border-indigo-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
                <ShieldCheck size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-950">
                    {locale === 'en' ? 'Super Admin Mode — Viewing Customer Storefront' : 'Chế Độ Super Admin — Đang Xem Giao Diện Cửa Hàng'}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold text-[10px]">
                    ADMIN
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-700 mt-0.5">
                  {locale === 'en'
                    ? 'Open the dedicated Admin Control Portal (/admin) to manage users, approve partner shops, and inspect audit logs.'
                    : 'Mở Trang Quản Trị (/admin) để phê duyệt nhà may, quản lý người dùng và xem nhật ký hệ thống.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
              <a
                href="/admin"
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ShieldCheck size={14} />
                <span>{locale === 'en' ? 'Open Admin Portal' : 'Vào Trang Quản Trị (/admin)'}</span>
              </a>
              <button
                type="button"
                onClick={() => setIsAdminModalOpen(true)}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-white hover:bg-indigo-50 text-indigo-800 border border-indigo-300 text-xs font-bold transition-all cursor-pointer"
              >
                {locale === 'en' ? 'Quick Review Shops' : 'Duyệt Shop Nhanh'}
              </button>
            </div>
          </div>
        )}

        {/* ── TAILOR / MERCHANT STORE BAR (When in Store Role) ── */}
        {userRole === 'store' && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50/60 to-white border border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
                <Store size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-950">
                    {t('ecommerce.storeBanner.title', 'Chế Độ Chủ Shop & Nhà May May Đo B2B')}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold text-[10px]">
                    Atelier Active
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-700 mt-0.5">
                  {t('ecommerce.storeBanner.desc', 'Quản lý rập mẫu áo sơ mi, blazer và thông số Ease Allowance cho từng size rập.')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
              <button
                type="button"
                onClick={openOnboarding}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus size={14} />
                <span>{t('ecommerce.storeBanner.addPattern', 'Thêm Mẫu Rập May')}</span>
              </button>
              <a
                href="/tailor"
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <span>{t('ecommerce.storeBanner.studio', 'Studio Quản Trị')}</span>
                <ChevronRight size={14} />
              </a>
            </div>
          </div>
        )}

        {/* ── MOBILE / TABLET SEARCH, CATEGORY PILLS & FILTER TOGGLE (< lg) ── */}
        <div className="lg:hidden space-y-3 mb-6">
          <div className="flex items-center h-11 px-3.5 rounded-xl bg-white border border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-500/15 transition-all">
            <Search size={17} className="text-slate-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              placeholder={t('ecommerce.catalog.searchPlaceholder', 'Tìm áo, quần, chất liệu...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-full bg-transparent border-0 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: t('ecommerce.catalog.tabAll', 'Tất Cả Sản Phẩm'), count: categoryCounts.all },
              { id: 'shirt', label: t('ecommerce.catalog.tabShirt', 'Áo Sơ Mi Nam'), count: categoryCounts.shirt },
              { id: 'polo', label: t('ecommerce.catalog.tabPolo', 'Áo Polo Lụa'), count: categoryCounts.polo },
              { id: 'pants', label: t('ecommerce.catalog.tabPants', 'Quần Tây & Chino'), count: categoryCounts.pants },
              { id: 'dress', label: t('ecommerce.catalog.tabDress', 'Đầm Lụa Nữ'), count: categoryCounts.dress },
              { id: 'tailored', label: t('ecommerce.catalog.tabTailored', 'May Đo Bespoke'), count: categoryCounts.tailored },
            ].map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3.5 py-1.5 text-xs font-bold whitespace-nowrap rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#14171C] text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`text-[10px] font-mono ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`py-2 px-3.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isFilterOpen || activeFilterCount > 0
                  ? 'bg-[#14171C] text-white border-[#14171C]'
                  : 'bg-white text-slate-800 border-slate-200'
              }`}
            >
              <SlidersHorizontal size={14} />
              <span>{t('ecommerce.catalog.filterBtn', 'Bộ lọc & Số đo')}</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] font-black flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={!isAuthenticated ? openSignIn : handleOpenBiometrics}
              className="py-2 px-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer truncate"
            >
              <Ruler size={13} />
              <span className="truncate">
                {isAuthenticated && hasBodyProfile
                  ? `${userBody.height_cm}cm · ${userBody.weight_kg}kg`
                  : (locale === 'en' ? '3D Body Profile' : 'Hồ Sơ Vóc Dáng 3D')}
              </span>
            </button>
          </div>

          {isFilterOpen && (
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  {t('ecommerce.catalog.filterTitle', 'Lọc Theo Giá, Chất Liệu & Độ Vừa')}
                </span>
                <button
                  type="button"
                  onClick={handleResetAllFilters}
                  className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  {t('ecommerce.catalog.resetFilters', 'Đặt lại bộ lọc')}
                </button>
              </div>

              {isAuthenticated && hasBodyProfile && (
                <label className="flex items-center gap-2 cursor-pointer select-none px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <input
                    type="checkbox"
                    checked={filterByMyFitOnly}
                    onChange={(e) => setFilterByMyFitOnly(e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                  />
                  <span className="font-bold text-slate-900">
                    {t('ecommerce.biometricsBar.filterMyFit', 'Chỉ hiện đồ vừa chuẩn dáng tôi (≥ 90%)')}
                  </span>
                </label>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="font-bold text-slate-800 mb-1.5">{t('ecommerce.catalog.priceRange', 'Khoảng Giá')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'all', label: t('ecommerce.catalog.priceAll', 'Tất cả mức giá') },
                      { id: 'under-600', label: t('ecommerce.catalog.priceUnder600', 'Dưới 600.000 ₫') },
                      { id: '600-1000', label: t('ecommerce.catalog.price600To1000', '600k - 1.000.000 ₫') },
                      { id: 'above-1000', label: t('ecommerce.catalog.priceAbove1000', 'Trên 1.000.000 ₫') },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPriceRange(p.id)}
                        className={`px-2.5 py-1.5 rounded-lg font-bold border cursor-pointer ${
                          priceRange === p.id ? 'bg-[#14171C] text-white border-[#14171C]' : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-bold text-slate-800 mb-1.5">{t('ecommerce.catalog.fabricTitle', 'Chất Liệu May Đo')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'all', label: t('ecommerce.catalog.fabricAll', 'Tất cả chất liệu') },
                      { id: 'cotton', label: t('ecommerce.catalog.fabricCotton', 'Cotton Ai Cập') },
                      { id: 'silk', label: t('ecommerce.catalog.fabricSilk', 'Lụa Tơ Tằm') },
                      { id: 'wool', label: t('ecommerce.catalog.fabricWool', 'Wool Úc') },
                      { id: 'linen', label: t('ecommerce.catalog.fabricLinen', 'Linen Pháp') },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFabricFilter(f.id)}
                        className={`px-2.5 py-1.5 rounded-lg font-bold border cursor-pointer ${
                          fabricFilter === f.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-bold text-slate-800 mb-1.5">{locale === 'en' ? 'Size' : 'Kích Cỡ'}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['all', 'XS', 'S', 'M', 'L', 'XL'].map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSizeFilter(sz)}
                        className={`px-2.5 py-1.5 rounded-lg font-mono font-bold border cursor-pointer ${
                          sizeFilter === sz ? 'bg-[#14171C] text-white border-[#14171C]' : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {sz === 'all' ? (locale === 'en' ? 'All' : 'Tất cả') : sz}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-bold text-slate-800 mb-1.5">{locale === 'en' ? 'Color' : 'Màu Sắc'}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setColorFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                        colorFilter === 'all' ? 'bg-[#14171C] text-white border-[#14171C]' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {locale === 'en' ? 'All' : 'Tất cả'}
                    </button>
                    {availableColorFilters.map((col) => (
                      <button
                        key={col.hex}
                        type="button"
                        onClick={() => setColorFilter(col.hex)}
                        className={`w-6 h-6 rounded-full border cursor-pointer transition-transform ${
                          colorFilter === col.hex ? 'ring-2 ring-blue-600 ring-offset-2 scale-110 border-slate-400' : 'border-slate-300'
                        }`}
                        style={{ backgroundColor: col.hex }}
                        title={col.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 2-COLUMN WORKSPACE: LEFT FILTER + 3D BODY PROFILE (3 cols) | RIGHT PRODUCT GRID (9 cols) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT SIDEBAR: 3D BIOMETRIC PROFILE & CLEAN EDITORIAL FILTERS (Desktop sticky) */}
          <aside className="hidden lg:block lg:col-span-3 space-y-5 sticky top-[156px]">

            {/* Card 1: Compact 3D Body Profile Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isAuthenticated && hasBodyProfile ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-900 truncate">
                    {t('ecommerce.sidebar.bodyProfileTitle', 'Hồ Sơ Vóc Dáng 3D')}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={!isAuthenticated ? openSignIn : handleOpenBiometrics}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer flex-shrink-0"
                >
                  {isAuthenticated && hasBodyProfile
                    ? t('ecommerce.sidebar.editMeasurements', 'Đổi số đo')
                    : (locale === 'en' ? 'Set up' : 'Thiết lập')}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    {t('ecommerce.biometrics.height', 'Chiều cao')}
                  </span>
                  <span className="font-mono text-sm font-black text-slate-900">
                    {isAuthenticated && hasBodyProfile ? `${userBody.height_cm} cm` : '— cm'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    {t('ecommerce.biometrics.weight', 'Cân nặng')}
                  </span>
                  <span className="font-mono text-sm font-black text-slate-900">
                    {isAuthenticated && hasBodyProfile ? `${userBody.weight_kg} kg` : '— kg'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    {t('ecommerce.biometrics.chest', 'Vòng ngực')}
                  </span>
                  <span className="font-mono text-sm font-black text-slate-900">
                    {isAuthenticated && hasBodyProfile ? `${userBody.chest_cm} cm` : '— cm'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    {t('ecommerce.biometrics.waist', 'Vòng eo')}
                  </span>
                  <span className="font-mono text-sm font-black text-slate-900">
                    {isAuthenticated && hasBodyProfile ? `${userBody.waist_cm} cm` : '— cm'}
                  </span>
                </div>
              </div>

              {isAuthenticated && hasBodyProfile ? (
                <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={filterByMyFitOnly}
                    onChange={(e) => setFilterByMyFitOnly(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-blue-600 border-slate-300 accent-blue-600 cursor-pointer flex-shrink-0"
                  />
                  <span className="text-[11px] font-bold text-slate-800 leading-snug">
                    {t('ecommerce.biometricsBar.filterMyFit', 'Chỉ hiện đồ vừa chuẩn dáng tôi (≥ 90%)')}
                  </span>
                </label>
              ) : (
                <button
                  type="button"
                  onClick={!isAuthenticated ? openSignIn : handleOpenBiometrics}
                  className="w-full py-2 px-3 rounded-xl bg-[#14171C] hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Ruler size={13} className="text-blue-400" />
                  <span>
                    {!isAuthenticated
                      ? (locale === 'en' ? 'Sign in for 3D Fit' : 'Đăng nhập đo độ vừa 3D')
                      : (locale === 'en' ? 'Enter 3D Measurements' : 'Nhập số đo vóc dáng 3D')}
                  </span>
                </button>
              )}
            </div>

            {/* Card 2: Accordion-style Storefront Filters (Torano Rhythm) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <SlidersHorizontal size={13} className="text-blue-600" />
                  <span>{t('ecommerce.catalog.filterBtn', 'Bộ Lọc Sản Phẩm')}</span>
                </span>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetAllFilters}
                    className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    {t('ecommerce.catalog.resetFilters', 'Đặt lại')}
                  </button>
                )}
              </div>

              {/* Filter Group A: Categories */}
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 mb-2.5">
                  {locale === 'en' ? 'Category' : 'Loại Sản Phẩm'}
                </h4>
                <div className="space-y-1.5">
                  {[
                    { id: 'all', label: t('ecommerce.catalog.tabAll', 'Tất Cả Sản Phẩm'), count: categoryCounts.all },
                    { id: 'shirt', label: t('ecommerce.catalog.tabShirt', 'Áo Sơ Mi Nam'), count: categoryCounts.shirt },
                    { id: 'polo', label: t('ecommerce.catalog.tabPolo', 'Áo Polo Lụa'), count: categoryCounts.polo },
                    { id: 'pants', label: t('ecommerce.catalog.tabPants', 'Quần Tây & Chino'), count: categoryCounts.pants },
                    { id: 'dress', label: t('ecommerce.catalog.tabDress', 'Đầm Lụa Nữ'), count: categoryCounts.dress },
                    { id: 'tailored', label: t('ecommerce.catalog.tabTailored', 'May Đo Bespoke'), count: categoryCounts.tailored },
                  ].map((cat) => {
                    const isActive = activeCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActiveCategory(cat.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-slate-900 text-white font-bold'
                            : 'text-slate-700 hover:bg-slate-100 font-medium'
                        }`}
                      >
                        <span className="truncate">{cat.label}</span>
                        <span className={`text-[10px] font-mono ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                          {cat.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filter Group B: Fabric Material */}
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-extrabold text-slate-900 mb-2.5">
                  {t('ecommerce.catalog.fabricTitle', 'Chất Liệu Vải')}
                </h4>
                <div className="space-y-1.5">
                  {[
                    { id: 'all', label: t('ecommerce.catalog.fabricAll', 'Tất cả chất liệu') },
                    { id: 'cotton', label: t('ecommerce.catalog.fabricCotton', 'Cotton Ai Cập') },
                    { id: 'silk', label: t('ecommerce.catalog.fabricSilk', 'Lụa Tơ Tằm') },
                    { id: 'wool', label: t('ecommerce.catalog.fabricWool', 'Wool Úc') },
                    { id: 'linen', label: t('ecommerce.catalog.fabricLinen', 'Linen Pháp') },
                  ].map((f) => (
                    <label
                      key={f.id}
                      className="flex items-center gap-2 px-1 py-0.5 text-xs text-slate-700 hover:text-slate-950 cursor-pointer select-none"
                    >
                      <input
                        type="radio"
                        name="fabricFilter"
                        checked={fabricFilter === f.id}
                        onChange={() => setFabricFilter(f.id)}
                        className="accent-blue-600 cursor-pointer"
                      />
                      <span className={fabricFilter === f.id ? 'font-bold text-blue-700' : 'font-medium'}>
                        {f.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filter Group C: Size Chips */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-xs font-extrabold text-slate-900">
                    {locale === 'en' ? 'Size' : 'Kích Cỡ'}
                  </h4>
                  {sizeFilter !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setSizeFilter('all')}
                      className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      {locale === 'en' ? 'Clear' : 'Bỏ chọn'}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {['XS', 'S', 'M', 'L', 'XL'].map((sz) => {
                    const isSelected = sizeFilter === sz;
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSizeFilter(isSelected ? 'all' : sz)}
                        className={`py-1.5 rounded-lg text-[11px] font-mono font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#14171C] text-white border-[#14171C] shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filter Group D: Color Swatches */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-xs font-extrabold text-slate-900">
                    {locale === 'en' ? 'Color' : 'Màu Sắc'}
                  </h4>
                  {colorFilter !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setColorFilter('all')}
                      className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      {locale === 'en' ? 'All' : 'Tất cả'}
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  {availableColorFilters.map((col) => {
                    const isSelected = colorFilter === col.hex;
                    return (
                      <button
                        key={col.hex}
                        type="button"
                        onClick={() => setColorFilter(isSelected ? 'all' : col.hex)}
                        className={`w-6 h-6 rounded-full border cursor-pointer transition-all ${
                          isSelected
                            ? 'ring-2 ring-blue-600 ring-offset-2 scale-110 border-slate-500'
                            : 'border-slate-300 hover:scale-105'
                        }`}
                        style={{ backgroundColor: col.hex }}
                        title={col.name}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Filter Group E: Price Range */}
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-extrabold text-slate-900 mb-2.5">
                  {t('ecommerce.catalog.priceRange', 'Khoảng Giá')}
                </h4>
                <div className="space-y-1.5">
                  {[
                    { id: 'all', label: t('ecommerce.catalog.priceAll', 'Tất cả mức giá') },
                    { id: 'under-600', label: t('ecommerce.catalog.priceUnder600', 'Dưới 600.000 ₫') },
                    { id: '600-1000', label: t('ecommerce.catalog.price600To1000', '600k - 1.000.000 ₫') },
                    { id: 'above-1000', label: t('ecommerce.catalog.priceAbove1000', 'Trên 1.000.000 ₫') },
                  ].map((p) => (
                    <label
                      key={p.id}
                      className="flex items-center gap-2 px-1 py-0.5 text-xs text-slate-700 hover:text-slate-950 cursor-pointer select-none"
                    >
                      <input
                        type="radio"
                        name="priceRangeFilter"
                        checked={priceRange === p.id}
                        onChange={() => setPriceRange(p.id)}
                        className="accent-[#14171C] cursor-pointer"
                      />
                      <span className={priceRange === p.id ? 'font-bold text-slate-950' : 'font-medium'}>
                        {p.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* RIGHT MAIN CATALOG AREA (9 cols) */}
          <div className="lg:col-span-9 space-y-5">

            {/* Catalog Header Bar: Result Count + Active Search Tag + Sort Select */}
            <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-bold text-slate-800">
                  {t('ecommerce.catalog.showingResults', 'Hiển thị {count} trang phục').replace('{count}', String(filteredProducts.length))}
                </span>
                {isAuthenticated && hasBodyProfile && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ISO 8559 Active
                  </span>
                )}
                {searchQuery && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-800">
                    <span>{t('ecommerce.catalog.searchingFor', 'Từ khóa:')} "{searchQuery}"</span>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="p-0.5 rounded-full hover:bg-blue-200 text-blue-600 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetAllFilters}
                    className="hidden sm:inline-flex text-xs font-bold text-rose-600 hover:underline cursor-pointer mr-1"
                  >
                    {t('ecommerce.catalog.resetFilters', 'Xóa bộ lọc')} ({activeFilterCount})
                  </button>
                )}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value="default">{t('ecommerce.catalog.sortDefault', 'Sắp xếp: Mặc định')}</option>
                  <option value="fit-desc">{t('ecommerce.catalog.sortFitDesc', 'Độ vừa AI cao nhất')}</option>
                  <option value="price-asc">{t('ecommerce.catalog.sortPriceAsc', 'Giá: Thấp đến Cao')}</option>
                  <option value="price-desc">{t('ecommerce.catalog.sortPriceDesc', 'Giá: Cao đến Thấp')}</option>
                </select>
              </div>
            </div>

            {/* 3-COLUMN HARMONIOUS PRODUCT GRID */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
                <SlidersHorizontal size={36} className="mx-auto text-slate-300" />
                <h3 className="text-base font-extrabold text-slate-900">
                  {t('ecommerce.catalog.emptyTitle', 'Không tìm thấy sản phẩm phù hợp')}
                </h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto font-medium">
                  {t('ecommerce.catalog.emptyDesc', 'Thử tắt bộ lọc hoặc tìm kiếm từ khóa khác.')}
                </p>
                <button
                  type="button"
                  onClick={handleResetAllFilters}
                  className="mt-2 px-4 py-2 rounded-xl bg-[#14171C] text-white text-xs font-bold hover:bg-black cursor-pointer"
                >
                  {t('ecommerce.catalog.resetAllFilters', 'Đặt lại tất cả bộ lọc')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {filteredProducts.map((product) => {
                  const fit = product.fitResult;
                  const isPerfect = fit.match_percentage >= 95;

                  // Unique variants by size_label for Quick-Size hover buttons
                  const sizeVariants = product.variants.filter(
                    (v, idx, arr) => arr.findIndex((x) => x.size_label === v.size_label) === idx
                  );
                  // Unique color swatches
                  const colorSwatches = product.variants.filter(
                    (v, idx, arr) => arr.findIndex((x) => x.color_hex === v.color_hex) === idx
                  );

                  return (
                    <div
                      key={product.id}
                      className="group bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 overflow-hidden shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                    >
                      {/* Top: Product Media (Dual-Image Hover Crossfade) + Quick-Size Strip */}
                      <div className="relative aspect-[3/4] bg-slate-100 overflow-hidden">
                        <img
                          src={product.image_url}
                          alt={getProductName(product)}
                          onClick={() => handleOpenAnalysis(product)}
                          className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105 cursor-pointer"
                          loading="lazy"
                        />
                        {product.secondary_image_url && (
                          <img
                            src={product.secondary_image_url}
                            alt=""
                            onClick={() => handleOpenAnalysis(product)}
                            className="absolute inset-0 w-full h-full object-cover object-top opacity-0 group-hover:opacity-100 transition-opacity duration-500 cursor-pointer"
                            loading="lazy"
                          />
                        )}

                        {/* Brand Tag Top Left */}
                        <div className="absolute top-2.5 left-2.5 pointer-events-none">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-white/95 text-slate-900 shadow-2xs border border-slate-200/80">
                            {product.brand_name}
                          </span>
                        </div>

                        {/* Fit Score Top Right (Authenticated + Biometrics only; ISO 8559 badge for guests) */}
                        <div className="absolute top-2.5 right-2.5 pointer-events-none">
                          {isAuthenticated && hasBodyProfile ? (
                            <div
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black flex items-center gap-1 shadow-md ${
                                isPerfect ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                              }`}
                            >
                              <Sparkles size={10} />
                              <span>{fit.match_percentage}% {t('ecommerce.catalog.fitMatch', 'Vừa')}</span>
                            </div>
                          ) : (
                            <div className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#14171C]/85 text-white backdrop-blur flex items-center gap-1 border border-white/15">
                              <Ruler size={10} className="text-blue-300" />
                              <span>ISO 8559</span>
                            </div>
                          )}
                        </div>

                        {/* Torano-inspired Quick-Size Hover Bar */}
                        <div className="absolute inset-x-2.5 bottom-2.5 p-2 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
                          <div className="flex items-center justify-between mb-1.5 px-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              {locale === 'en' ? 'Quick Add Size' : 'Chọn nhanh size'}
                            </span>
                            {isAuthenticated && hasBodyProfile && (
                              <span className="text-[10px] font-mono font-bold text-blue-600">
                                {locale === 'en' ? `Best: ${fit.recommended_size}` : `Gợi ý: ${fit.recommended_size}`}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-4 gap-1">
                            {sizeVariants.slice(0, 4).map((variant) => {
                              const isRec = isAuthenticated && hasBodyProfile && variant.size_label === fit.recommended_size;
                              return (
                                <button
                                  key={variant.id}
                                  type="button"
                                  onClick={() => handleAddToCart(product, variant)}
                                  className={`py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer active:scale-95 ${
                                    isRec
                                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                                      : 'bg-slate-100 text-slate-900 hover:bg-[#14171C] hover:text-white'
                                  }`}
                                  title={locale === 'en' ? `Add Size ${variant.size_label}` : `Thêm nhanh Size ${variant.size_label}`}
                                >
                                  {variant.size_label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Bottom: Clean Editorial Metadata, Swatches, 3D Fit & Add to Cart */}
                      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-1.5">
                          <h4
                            onClick={() => handleOpenAnalysis(product)}
                            className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors cursor-pointer"
                          >
                            {getProductName(product)}
                          </h4>

                          {/* Price + Color Swatch Dots Row */}
                          <div className="flex items-center justify-between gap-2 pt-0.5">
                            <div className="flex items-baseline gap-1.5 flex-wrap">
                              {product.sale_price ? (
                                <>
                                  <span className="font-black text-slate-950 text-xs sm:text-sm">
                                    {product.sale_price.toLocaleString('vi-VN')} ₫
                                  </span>
                                  <span className="text-[11px] text-slate-400 line-through font-medium">
                                    {product.price.toLocaleString('vi-VN')} ₫
                                  </span>
                                </>
                              ) : (
                                <span className="font-black text-slate-950 text-xs sm:text-sm">
                                  {product.price.toLocaleString('vi-VN')} ₫
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0" title={getProductFabric(product)}>
                              {colorSwatches.slice(0, 4).map((sw) => (
                                <span
                                  key={sw.id}
                                  className="w-3 h-3 rounded-full border border-slate-300 shadow-2xs"
                                  style={{ backgroundColor: sw.color_hex }}
                                  title={sw.color_name}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Compact 1-line AI Fit Insight (Authenticated) or Auth Prompt */}
                        <div
                          onClick={() => handleOpenAnalysis(product)}
                          className="px-2.5 py-2 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-200 text-[11px] transition-colors cursor-pointer flex items-center justify-between gap-2"
                          title={t('ecommerce.catalog.viewAnalysis', 'Xem Phân Tích Độ Vừa 3D')}
                        >
                          {isAuthenticated && hasBodyProfile ? (
                            <>
                              <span className="text-slate-700 font-medium truncate">
                                <strong className="text-blue-700 font-mono">Size {fit.recommended_size}</strong>
                                {' · '}
                                {locale === 'en' && fit.advisor_advice_en ? fit.advisor_advice_en : fit.advisor_advice_vi}
                              </span>
                              <ChevronRight size={13} className="text-blue-600 flex-shrink-0" />
                            </>
                          ) : (
                            <>
                              <span className="text-slate-600 font-semibold truncate">
                                {!isAuthenticated
                                  ? (locale === 'en' ? 'Sign in for AI size advice' : 'Đăng nhập để gợi ý size chuẩn')
                                  : (locale === 'en' ? 'Add body profile for AI size' : 'Cập nhật số đo để gợi ý size')}
                              </span>
                              <ChevronRight size={13} className="text-slate-400 flex-shrink-0" />
                            </>
                          )}
                        </div>

                        {/* Card Actions: Phân tích 3D + Thử 3D + Chọn Mua */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenAnalysis(product)}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                              title={t('ecommerce.catalog.viewAnalysis', 'Phân tích độ vừa 3D')}
                            >
                              <Ruler size={14} className="text-blue-600" />
                            </button>
                            <button
                              type="button"
                              onClick={handleOpenVirtualStudio}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                              title={t('ecommerce.sidebar.virtualTryOn', 'Thử đồ ảo 3D (VELL Studio)')}
                            >
                              <Sparkles size={14} className="text-purple-600" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddToCart(product, product.recommendedVariant)}
                            className="flex-1 py-2 px-3 rounded-xl bg-[#14171C] hover:bg-blue-600 active:scale-95 text-white text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                            title={isAuthenticated && hasBodyProfile
                              ? t('ecommerce.catalog.buySizeTooltip', 'Chọn mua ngay Size {size}').replace('{size}', fit.recommended_size)
                              : (locale === 'en' ? 'Add to Cart' : 'Thêm vào giỏ hàng')}
                          >
                            <ShoppingBag size={13} className="text-white" />
                            <span>
                              {isAuthenticated && hasBodyProfile
                                ? t('ecommerce.catalog.chooseSize', 'Chọn Size {size}').replace('{size}', fit.recommended_size)
                                : (locale === 'en' ? 'Select & Buy' : 'Chọn Mua')}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {/* ── MIX & MATCH 3D COMBO LOOKBOOK SECTION ── */}
            <section id="lookbook-combo" className="pt-8 mt-4 border-t border-slate-200 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600">
                    {locale === 'en' ? '3D Coordinated Looks' : 'Phối Đồ Chuẩn Phom 3D'}
                  </span>
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-[#14171C] mt-0.5">
                    {locale === 'en' ? 'Mix & Match Bundles — Better Together' : 'Combo Phối Đồ May Đo — Mua Cả Bộ Tiết Kiệm Hơn'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleOpenVirtualStudio}
                  className="self-start sm:self-auto text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{locale === 'en' ? 'Preview in 3D Fitting Room »' : 'Thử phối đồ trong Phòng 3D »'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  {
                    id: 'combo-milan',
                    titleVi: 'Set Công Sở Milan Chuẩn Phom Ý',
                    titleEn: 'Milan Office Bespoke Set',
                    subVi: 'Sơ Mi Oxford Ai Cập + Quần Tây Xếp Ly Đôi Úc',
                    subEn: 'Egyptian Oxford Shirt + Australian Wool Trousers',
                    productIds: ['prod-01', 'prod-03'],
                    savings: 175000,
                    imgLeft: MOCK_PRODUCTS[0].image_url,
                    imgRight: MOCK_PRODUCTS[2].image_url,
                  },
                  {
                    id: 'combo-riviera',
                    titleVi: 'Set Smart-Casual Linen Cuối Tuần',
                    titleEn: 'Riviera Smart-Casual Linen Set',
                    subVi: 'Blazer Linen Pháp + Quần Chino Co Giãn 4 Chiều',
                    subEn: 'French Linen Blazer + 4-Way Stretch Chinos',
                    productIds: ['prod-05', 'prod-06'],
                    savings: 200000,
                    imgLeft: MOCK_PRODUCTS[4].image_url,
                    imgRight: MOCK_PRODUCTS[5].image_url,
                  },
                ].map((combo) => {
                  const bundleProducts = MOCK_PRODUCTS.filter((p) => combo.productIds.includes(p.id));
                  const totalBundlePrice = bundleProducts.reduce((sum, p) => sum + (p.sale_price || p.price), 0);
                  return (
                    <div
                      key={combo.id}
                      className="rounded-2xl bg-[#F4F5F7] border border-slate-200 p-4 flex flex-col sm:flex-row gap-4 items-stretch"
                    >
                      <div className="grid grid-cols-2 gap-2 sm:w-44 flex-shrink-0">
                        <img
                          src={combo.imgLeft}
                          alt=""
                          className="w-full h-36 sm:h-40 object-cover object-top rounded-xl border border-white shadow-xs"
                          loading="lazy"
                        />
                        <img
                          src={combo.imgRight}
                          alt=""
                          className="w-full h-36 sm:h-40 object-cover object-top rounded-xl border border-white shadow-xs"
                          loading="lazy"
                        />
                      </div>

                      <div className="flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <span className="inline-block px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold">
                            {locale === 'en'
                              ? `Save ${combo.savings.toLocaleString('vi-VN')}₫`
                              : `Tiết kiệm ${combo.savings.toLocaleString('vi-VN')}₫`}
                          </span>
                          <h4 className="font-display text-base font-bold text-slate-950 mt-1.5">
                            {locale === 'en' ? combo.titleEn : combo.titleVi}
                          </h4>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {locale === 'en' ? combo.subEn : combo.subVi}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/80">
                          <div>
                            <span className="text-[10px] text-slate-500 block">
                              {locale === 'en' ? 'Bundle Total' : 'Trọn bộ 2 món'}
                            </span>
                            <span className="font-black text-sm text-slate-950">
                              {totalBundlePrice.toLocaleString('vi-VN')} ₫
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddComboToCart(combo.productIds)}
                            className="px-3.5 py-2 rounded-xl bg-[#14171C] hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <ShoppingBag size={13} />
                            <span>{locale === 'en' ? 'Add Full Look' : 'Mua Trọn Bộ'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* ── BAND 6: MINIMALIST TECHNOLOGY TRUST STRIP ── */}
      <section className="bg-white border-t border-slate-200 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600">
              {t('ecommerce.tech.subtitle', 'Công Nghệ Đằng Sau Sự Vừa Vặn')}
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#14171C] tracking-tight mt-1.5">
              {t('ecommerce.tech.title', 'Tại Sao FitVision 3D Chuẩn Xác Hơn Bảng Size Thông Thường?')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#FAFAFB] border border-slate-200/90 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/70 text-blue-600 flex items-center justify-center">
                <Ruler size={20} />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                {t('ecommerce.tech.f1Title', 'Xấp Xỉ Elip Ramanujan 3D')}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t('ecommerce.tech.f1Desc', 'Không dùng ước lượng thô sơ. Hệ thống cắt lớp mặt phẳng ngực, eo, hông và áp dụng tích phân chu vi elip bậc hai kết hợp mật độ mô sinh học Siri-Deurenberg để trích xuất số đo thực tế.')}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAFAFB] border border-slate-200/90 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/70 text-emerald-600 flex items-center justify-center">
                <ShieldCheck size={20} />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                {t('ecommerce.tech.f2Title', 'Bảo Mật Quyền Riêng Tư Tuyệt Đối')}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t('ecommerce.tech.f2Desc', 'Ảnh chụp của khách hàng được xử lý ngay trong bộ nhớ tạm In-Memory RAM và tự động xóa vĩnh viễn (Zero-Retention Policy). Không lưu trữ hình ảnh nhạy cảm trên máy chủ.')}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAFAFB] border border-slate-200/90 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/70 text-amber-600 flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                {t('ecommerce.tech.f3Title', 'Độ Cử Động May Đo (Ease Allowance)')}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t('ecommerce.tech.f3Desc', 'Áo quần không bao giờ may bằng khít với da thịt. FitVision 3D tính toán chính xác độ chùng vải (ease: +3cm đến +6cm) để đảm bảo bạn mặc đẹp nhưng vẫn cử động thoải mái khi làm việc.')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── BAND 6B: 4-COLUMN COMMITMENT BAR (WARM CHAMPAGNE #F5EBD8) ── */}
      <section className="bg-[#F5EBD8] border-t border-amber-200/80 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-amber-200 flex items-center justify-center text-[#14171C] flex-shrink-0 shadow-2xs">
                <Truck size={18} />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-950">
                  {locale === 'en' ? 'Express Freeship' : 'Freeship Toàn Quốc'}
                </h4>
                <p className="text-[11px] text-slate-700">
                  {locale === 'en' ? 'Orders from 1,000,000₫ & ISO VIP' : 'Giao hỏa tốc nội thành từ 1.000.000₫'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-amber-200 flex items-center justify-center text-[#14171C] flex-shrink-0 shadow-2xs">
                <RotateCcw size={18} />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-950">
                  {locale === 'en' ? '14-Day Fit Adjustment' : 'Đổi Sửa Size 14 Ngày'}
                </h4>
                <p className="text-[11px] text-slate-700">
                  {locale === 'en' ? 'Complimentary size swap guaranteed' : 'Miễn phí đổi size tận nhà 100%'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-amber-200 flex items-center justify-center text-[#14171C] flex-shrink-0 shadow-2xs">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-950">
                  {locale === 'en' ? 'RAM Zero-Retention' : 'Bảo Mật Ảnh RAM 100%'}
                </h4>
                <p className="text-[11px] text-slate-700">
                  {locale === 'en' ? 'Zero photo storage on servers' : 'Không lưu trữ ảnh chụp vóc dáng'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-amber-200 flex items-center justify-center text-[#14171C] flex-shrink-0 shadow-2xs">
                <Ruler size={18} />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-950">
                  {locale === 'en' ? 'ISO 8559-1 Standard' : 'Chuẩn Nhân Trắc ISO 8559'}
                </h4>
                <p className="text-[11px] text-slate-700">
                  {locale === 'en' ? '13-point precision body mapping' : 'Hiệu chuẩn Ease Allowance từng cm'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BAND 7: DEEP CHARCOAL EDITORIAL FOOTER ── */}
      <footer className="bg-[#14171C] text-slate-300 text-xs pt-14 pb-24 md:pb-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-white/10">
            {/* Brand & Vision */}
            <div className="md:col-span-2 space-y-3.5 text-left">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30">
                  <Scissors size={18} strokeWidth={2.2} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg text-white tracking-tight">
                    FitVision <span className="text-blue-400">3D</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-200 border border-white/15">
                    {t('ecommerce.footer.smartTailoring', 'May Đo Thông Minh')}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 font-normal leading-relaxed max-w-md">
                {t('ecommerce.footer.desc', 'Nền tảng thương mại điện tử thời trang may đo ứng dụng công nghệ quét 3D và nhân trắc học ISO 8559-1. Đảm bảo trang phục vừa vặn hoàn hảo từng centimet, xóa bỏ nỗi lo chọn nhầm kích cỡ.')}
              </p>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] text-slate-200 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>{t('ecommerce.footer.guarantee', 'Cam kết vừa vặn 100% đổi trả miễn phí')}</span>
                </div>
              </div>

              {/* Payment Method Badges */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                {['COD', 'VietQR', 'SePay', 'ATM / Visa'].map((pm) => (
                  <span
                    key={pm}
                    className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-[10px] font-mono font-bold text-slate-300"
                  >
                    {pm}
                  </span>
                ))}
              </div>
            </div>

            {/* Customer Care Links */}
            <div className="space-y-3 text-left">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
                {t('ecommerce.footer.services', 'Dịch Vụ & Đo Đạc')}
              </h4>
              <ul className="space-y-2.5 text-slate-400">
                <li>
                  <a href="/dashboard" className="hover:text-white transition-colors duration-200 flex items-center gap-2 font-medium">
                    <Camera size={13} className="text-blue-400" />
                    <span>{t('ecommerce.footer.booth', 'Buồng Quét 3D Online')}</span>
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={handleOpenBiometrics}
                    className="hover:text-white transition-colors duration-200 flex items-center gap-2 bg-transparent border-0 cursor-pointer text-left p-0 text-xs text-slate-400 font-medium"
                  >
                    <Ruler size={13} className="text-amber-400" />
                    <span>{t('ecommerce.footer.sizingGuide', 'Hướng Dẫn Lấy Số Đo')}</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={openOnboarding}
                    className="hover:text-white transition-colors duration-200 flex items-center gap-2 bg-transparent border-0 cursor-pointer text-left p-0 text-xs text-slate-400 font-medium"
                  >
                    <Store size={13} className="text-emerald-400" />
                    <span>{t('ecommerce.footer.registerMerchant', 'Dành Cho Nhà May & Đối Tác')}</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Quick Actions & Repository */}
            <div className="space-y-3 text-left">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
                {t('ecommerce.footer.connect', 'Kết Nối & Hỗ Trợ')}
              </h4>
              <ul className="space-y-2.5 text-slate-400">
                <li>
                  <a
                    href="https://github.com/le-van-thang/C1SE.12-FitVision3D"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white transition-colors duration-200 flex items-center gap-2 font-medium"
                  >
                    <Layers size={13} className="text-purple-400" />
                    <span>{t('ecommerce.footer.github', 'GitHub Repository')}</span>
                  </a>
                </li>
                <li className="text-[11px] text-slate-400 font-medium">
                  {t('ecommerce.footer.supportEmail', 'Hỗ trợ: support@fitvision3d.com')}
                </li>
                <li className="text-[11px] text-slate-400 font-medium">
                  {t('ecommerce.footer.hours', 'Hoạt động: 8:00 - 21:00 (T2 - CN)')}
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright and Standards */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
              <span className="font-semibold text-white">© 2026 FitVision 3D Inc.</span>
              <span className="text-slate-600">•</span>
              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 font-mono text-[10px]">
                {t('ecommerce.footer.isoBadge', 'Chuẩn ISO 8559-1:2014')}
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 font-mono text-[10px]">
                {t('ecommerce.footer.privacyBadge', 'Bảo Mật RAM 100%')}
              </span>
            </div>

            <p className="text-slate-400 text-center sm:text-right font-medium">
              {t('ecommerce.footer.tagline', 'Thời Trang Vừa Vặn Chuẩn Xác Cho Mọi Vóc Dáng')}
            </p>
          </div>
        </div>
      </footer>
      </div> {/* End Right Main Content Area */}

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
          onClick={handleOpenBiometrics}
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
        onAddSuggestedToCart={(comp, variant) => handleAddToCart(comp, variant)}
        onOpenVirtualStudio={handleOpenVirtualStudio}
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
        onChangeVariant={handleChangeCartVariant}
        onClearCart={() => setCartItems([])}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutModalOpen(true);
        }}
      />

      {/* 3-Step E-Commerce Checkout Modal (Học hỏi theo luồng chuẩn đồ án: Giỏ hàng -> Thông tin giao hàng & VietQR -> Đặt hàng thành công) */}
      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        items={cartItems}
        onClearCart={() => setCartItems([])}
        userBody={userBody}
        onOpenMyOrders={() => {
          setIsCheckoutModalOpen(false);
          setProfileModalTab('orders');
          setIsProfileModalOpen(true);
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

      {/* VELL Virtual 3D Styling Studio (Auth Gated — Never Shows Mock Measurements to Guests) */}
      <VellVirtualStudioModal
        isOpen={isVellStudioOpen}
        onClose={() => setIsVellStudioOpen(false)}
        userBody={userBody}
        isAuthenticated={isAuthenticated}
        hasBodyProfile={hasBodyProfile}
        onOpenSignIn={openSignIn}
        onOpenBiometrics={handleOpenBiometrics}
        onAddToCart={(fakeProduct, size) => {
          const fakeVariant: ProductVariant = {
            id: `var-${fakeProduct.id}-${size}`,
            size_label: (['XS', 'S', 'M', 'L', 'XL', 'XXL'].includes(size) ? size : 'M') as ProductVariant['size_label'],
            color_name: 'Couture Edition',
            color_hex: '#1E293B',
            sku: `${fakeProduct.id}-${size}`,
            stock: 12,
            spec: {
              chest_cm: userBody.chest_cm + 5,
              waist_cm: userBody.waist_cm + 5,
              shoulder_cm: 44,
              length_cm: 72,
              ease_min_cm: 4,
              ease_max_cm: 8,
            },
          };
          handleAddToCart(fakeProduct, fakeVariant);
          setIsVellStudioOpen(false);
          setIsCartOpen(true);
        }}
      />

      {/* Maison Vell Runway Depth Lookbook Modal (From UI/Maison Vell.docx) */}
      <MaisonVellRunwayModal
        isOpen={isMaisonRunwayOpen}
        onClose={() => setIsMaisonRunwayOpen(false)}
        userBody={userBody}
        onAddToCart={(piece) => {
          const fakeProd: FashionProduct = {
            id: piece.id,
            brand_name: 'Maison Vell Couture',
            name: piece.name,
            slug: `maison-vell-${piece.id}`,
            category: 'dress',
            gender_target: 'unisex',
            price: piece.price,
            fabric_material: 'Silk & Cashmere Couture',
            stretch_type: 'Co giãn nhẹ (2-3%)',
            image_url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80',
            description: 'Trang phục couture từ bộ sưu tập Runway Maison Vell SS27',
            rating: 5.0,
            reviews_count: 24,
            variants: [
              {
                id: `var-${piece.id}-${piece.size}`,
                size_label: (['XS', 'S', 'M', 'L', 'XL', 'XXL'].includes(piece.size) ? piece.size : 'M') as ProductVariant['size_label'],
                color_name: 'Catwalk Edition',
                color_hex: '#1E293B',
                sku: `${piece.id}-${piece.size}`,
                stock: 5,
                spec: {
                  chest_cm: userBody.chest_cm + 4,
                  waist_cm: userBody.waist_cm + 4,
                  shoulder_cm: 43,
                  length_cm: 80,
                  ease_min_cm: 3,
                  ease_max_cm: 6,
                },
              },
            ],
          };
          handleAddToCart(fakeProd, fakeProd.variants[0]);
          setIsCartOpen(true);
        }}
      />

      {/* Nowhere Thermal Receipt Bespoke Fit Slip Modal (From UI/HERO.docx) */}
      <NowhereThermalSlipModal
        isOpen={isThermalSlipOpen}
        onClose={() => setIsThermalSlipOpen(false)}
        userBody={userBody}
        userName={isAuthenticated ? 'Thắng Lê' : 'Khách Thử Nghiệm'}
      />

      {/* Quick Admin Management Modal (Dành riêng cho Quản Trị Viên) */}
      <QuickAdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />

      {/* Customer Profile & Merchant Onboarding Modal (Hồ Sơ Khách Hàng Đầy Đủ) */}
      <CustomerProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userBody={userBody}
        onOpenBiometrics={() => setIsBiometricModalOpen(true)}
        initialTab={profileModalTab}
      />

      {/* ── PROFESSIONAL VERTICAL SIDEBAR DRAWER (THANH DỌC) ── */}
      <FashionSidebarNav
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeCategory={activeCategory}
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          const el = document.getElementById('catalog');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        categoryCounts={categoryCounts}
        userBody={userBody}
        hasBodyProfile={hasBodyProfile}
        userRole={userRole}
        userName={currentUser?.full_name || currentUser?.email || 'Thắng Lê'}
        avatarUrl={currentUser?.avatar_url || undefined}
        onOpenVellStudio={handleOpenVirtualStudio}
        onOpenMaisonRunway={handleOpenVirtualStudio}
        onOpenThermalSlip={() => setIsThermalSlipOpen(true)}
        onOpenBiometrics={handleOpenBiometrics}
        onOpenOnboarding={openOnboarding}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenOrders={() => {
          setProfileModalTab('orders');
          setIsProfileModalOpen(true);
        }}
        isAuthenticated={isAuthenticated}
        onOpenSignIn={openSignIn}
        onSignOut={signOut}
      />

      {/* Floating FitVision 3D Assistant Mascot Chatbot */}
      <GeminiAssistantWidget
        isAuthenticated={isAuthenticated}
        hasBodyProfile={hasBodyProfile}
        onOpenSignIn={openSignIn}
        userBody={
          isAuthenticated && hasBodyProfile
            ? {
                height_cm: userBody.height_cm,
                weight_kg: userBody.weight_kg,
                chest_cm: userBody.chest_cm,
                waist_cm: userBody.waist_cm,
                hip_cm: userBody.hip_cm,
              }
            : undefined
        }
      />

    </div>
  );
};

