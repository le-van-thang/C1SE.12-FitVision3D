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
  const [isVellStudioOpen, setIsVellStudioOpen] = useState<boolean>(false);
  const [isMaisonRunwayOpen, setIsMaisonRunwayOpen] = useState<boolean>(false);
  const [isThermalSlipOpen, setIsThermalSlipOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [profileModalTab, setProfileModalTab] = useState<'profile' | 'measurements' | 'orders' | 'merchant'>('profile');
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
    <div className="min-h-screen bg-[#FAFAF9] text-[#1C1917] font-sans flex flex-col lg:flex-row antialiased selection:bg-blue-100 selection:text-blue-900">
      
      {/* ── DESKTOP PERMANENT VERTICAL SIDEBAR (THANH DỌC TỪ TRÊN XUỐNG) ── */}
      <aside className="hidden lg:flex w-64 xl:w-72 shrink-0 border-r-2 border-stone-800 bg-white flex-col justify-between sticky top-0 h-screen select-none z-30 shadow-xs overflow-hidden">
        {/* Brand Header */}
        <div className="h-16 px-4 border-b-2 border-black flex items-center justify-between flex-shrink-0 bg-stone-50">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm border border-black">
              <Scissors size={18} strokeWidth={2} />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-base tracking-tight text-stone-900 leading-none">
                FitVision <span className="text-blue-600">3D</span>
              </span>
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-500 mt-0.5">
                {t('ecommerce.sidebar.brandSub', 'Atelier & May Đo 3D')}
              </span>
            </div>
          </a>

          {/* Nút đổi ngôn ngữ VI/EN tinh gọn đặt góc trên bên phải header */}
          <LanguageSwitcher compact variant="light" />
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Hồ sơ vóc dáng 3D (ĐẬM NÉT TUYỆT ĐỐI - KHUNG VIỀN ĐEN DÀY 2.5PX BAO TOÀN BỘ) */}
          <div className="rounded-2xl border-[2.5px] border-black shadow-sm overflow-hidden bg-white text-stone-900">
            {/* Header màu xám tương phản cao, viền đen dày 2px, nút thu gọn/mở rộng */}
            <div className="bg-slate-200 border-b-2 border-black px-3.5 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-300 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-950">
                  {t('ecommerce.sidebar.bodyProfileTitle', 'HỒ SƠ VÓC DÁNG 3D')}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsBiometricModalOpen(true)}
                  className="text-[11px] font-black text-blue-700 hover:text-blue-900 hover:underline cursor-pointer transition-colors"
                >
                  {t('ecommerce.sidebar.editMeasurements', 'Đổi số đo')}
                </button>
                <button
                  type="button"
                  onClick={() => setIsBodyProfileCollapsed(!isBodyProfileCollapsed)}
                  className="p-1 rounded-md hover:bg-slate-300 text-slate-900 transition-colors cursor-pointer"
                  title={isBodyProfileCollapsed ? t('ecommerce.sidebar.expandMeasurements', 'Mở rộng chi tiết 4 ô số đo') : t('ecommerce.sidebar.collapseMeasurements', 'Thu gọn số đo')}
                >
                  {isBodyProfileCollapsed ? <ChevronDown size={14} strokeWidth={2.5} /> : <ChevronUp size={14} strokeWidth={2.5} />}
                </button>
              </div>
            </div>

            {/* Chế độ Thu Gọn: Hiển thị 1 thanh tóm tắt siêu gọn & viền bọc rõ nét */}
            {isBodyProfileCollapsed ? (
              <div className="p-3 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-slate-950 px-0.5">
                  <span className="font-mono">{userBody.height_cm}cm · {userBody.weight_kg}kg</span>
                  <span className="text-slate-700 font-mono text-[11px]">N:{userBody.chest_cm}cm · E:{userBody.waist_cm}cm</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer pt-2 text-xs text-slate-950 font-black border-t-2 border-black">
                  <input
                    type="checkbox"
                    checked={filterByMyFitOnly}
                    onChange={(e) => setFilterByMyFitOnly(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-2 border-black accent-blue-600 cursor-pointer"
                  />
                  <span className="font-black text-xs text-slate-950">{t('ecommerce.sidebar.onlyFitting', 'Chỉ hiện đồ vừa vặn (≥ 90%)')}</span>
                </label>
              </div>
            ) : (
              /* Chế độ Mở Rộng: 4 ô số đo có viền đen dày 2px rõ nét */
              <div className="p-3 bg-white space-y-2.5">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Chiều cao */}
                  <div className="bg-sky-50 p-2.5 rounded-xl border-2 border-black text-sky-950 shadow-2xs">
                    <span className="text-sky-900 text-[10px] block font-black uppercase tracking-wider">{t('ecommerce.sidebar.height', 'Chiều cao')}</span>
                    <span className="font-black text-sky-950 text-sm">{userBody.height_cm} cm</span>
                  </div>
                  {/* Cân nặng */}
                  <div className="bg-purple-50 p-2.5 rounded-xl border-2 border-black text-purple-950 shadow-2xs">
                    <span className="text-purple-900 text-[10px] block font-black uppercase tracking-wider">{t('ecommerce.sidebar.weight', 'Cân nặng')}</span>
                    <span className="font-black text-purple-950 text-sm">{userBody.weight_kg} kg</span>
                  </div>
                  {/* Vòng ngực */}
                  <div className="bg-emerald-50 p-2.5 rounded-xl border-2 border-black text-emerald-950 shadow-2xs">
                    <span className="text-emerald-900 text-[10px] block font-black uppercase tracking-wider">{t('ecommerce.sidebar.chest', 'Vòng ngực')}</span>
                    <span className="font-black text-emerald-950 text-sm">{userBody.chest_cm} cm</span>
                  </div>
                  {/* Vòng eo */}
                  <div className="bg-amber-50 p-2.5 rounded-xl border-2 border-black text-amber-950 shadow-2xs">
                    <span className="text-amber-900 text-[10px] block font-black uppercase tracking-wider">{t('ecommerce.sidebar.waist', 'Vòng eo')}</span>
                    <span className="font-black text-amber-950 text-sm">{userBody.waist_cm} cm</span>
                  </div>
                </div>

                {/* Lọc đồ vừa vặn */}
                <label className="flex items-center gap-2 cursor-pointer pt-2 text-xs text-slate-950 font-black border-t-2 border-black">
                  <input
                    type="checkbox"
                    checked={filterByMyFitOnly}
                    onChange={(e) => setFilterByMyFitOnly(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-2 border-black accent-blue-600 cursor-pointer"
                  />
                  <span className="font-black text-xs text-slate-950">{t('ecommerce.sidebar.onlyFitting', 'Chỉ hiện đồ vừa vặn (≥ 90%)')}</span>
                </label>
              </div>
            )}
          </div>

          {/* Đường ngăn cách cực đậm 2.5px giữa Hồ Sơ Vóc Dáng và Tính Năng May Đo 3D */}
          <div className="border-t-[2.5px] border-black my-3.5" />

          {/* Module tính năng may đo & 3D (MỌI NÚT ĐỀU CÓ VIỀN ĐEN 2PX BAO NGOÀI RÕ NÉT) */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-800 px-1 block">
              {t('ecommerce.sidebar.featuresTitle', 'TÍNH NĂNG MAY ĐO & 3D')}
            </span>

            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('catalog');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full px-3 py-2.5 rounded-xl bg-blue-100 hover:bg-blue-200 text-slate-950 font-black text-xs flex items-center justify-between transition-all border-2 border-black shadow-xs cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs border border-black">
                  <ShoppingBag size={14} />
                </div>
                <span>{t('ecommerce.sidebar.collection', 'Bộ Sưu Tập Thời Trang')}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-white text-slate-950 font-mono font-black border-2 border-black">
                {MOCK_PRODUCTS.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsVellStudioOpen(true)}
              className="w-full px-3 py-2.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-slate-950 font-black text-xs flex items-center justify-between transition-all border-2 border-black shadow-xs cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-700 text-white flex items-center justify-center shadow-xs border border-black">
                  <Sparkles size={14} className="text-amber-300" />
                </div>
                <span>{t('ecommerce.sidebar.virtualTryOn', 'Phòng Thử Đồ Ảo 3D')}</span>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded-md bg-white text-slate-950 font-mono font-black border-2 border-black">
                3D AI
              </span>
            </button>

            <a
              href="/dashboard"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-950 font-black text-xs flex items-center justify-between transition-all border-2 border-black shadow-xs cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center shadow-xs border border-black">
                  <Ruler size={14} />
                </div>
                <span>{t('ecommerce.sidebar.measurementLab', 'Phòng Đo Nhân Trắc Học')}</span>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded-md bg-white text-slate-950 font-mono font-black border-2 border-black">
                ISO 8559
              </span>
            </a>
          </div>

          {/* Đường kẻ phân cách rõ nét dày 2px giữa Nhóm Tính Năng và Danh Mục */}
          <div className="border-t-2 border-black my-3" />

          {/* Danh mục thời trang thuần Việt (MỖI NÚT ĐỀU CÓ VIỀN ĐEN 2PX BAO NGOÀI RIÊNG BIỆT) */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-800 px-1 block">
              {t('ecommerce.sidebar.categoriesTitle', 'DANH MỤC THỜI TRANG')}
            </span>

            {[
              { id: 'all', label: t('ecommerce.categories.all', 'Tất Cả Sản Phẩm'), count: categoryCounts.all },
              { id: 'shirt', label: t('ecommerce.categories.shirt', 'Áo Sơ Mi May Đo'), count: categoryCounts.shirt },
              { id: 'polo', label: t('ecommerce.categories.polo', 'Áo Polo Cao Cấp'), count: categoryCounts.polo },
              { id: 'pants', label: t('ecommerce.categories.pants', 'Quần Tây & Chino Ý'), count: categoryCounts.pants },
              { id: 'dress', label: t('ecommerce.categories.dress', 'Đầm & Váy Lụa Tự Nhiên'), count: categoryCounts.dress },
              { id: 'tailored', label: t('ecommerce.categories.tailored', 'Thiết Kế May Đo Riêng'), count: categoryCounts.tailored },
            ].map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat.id);
                    const el = document.getElementById('catalog');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-black flex items-center justify-between transition-all cursor-pointer border-2 ${
                    isActive
                      ? 'bg-black text-white border-black shadow-md scale-[1.01]'
                      : 'bg-white hover:bg-slate-100 text-slate-950 border-black shadow-2xs'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-black border ${
                      isActive ? 'bg-white/20 text-white border-white/30' : 'bg-slate-100 text-slate-950 border-black'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

        </div>

        {/* Chân thanh điều hướng: Hồ Sơ Người Dùng Phân Tách Màu Rõ Rệt, Khung Viền Đen 2.5px Đậm Nét */}
        <div className="p-3.5 border-t-[2.5px] border-black bg-slate-200 flex-shrink-0 relative">
          {isAuthenticated ? (
            <div className="relative">
              {/* User Pill Button: Viền đen 2px rõ nét, hiển thị avatar thật nếu có */}
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="w-full p-2.5 rounded-xl bg-white border-2 border-black hover:border-blue-600 shadow-sm hover:shadow-md flex items-center justify-between transition-all cursor-pointer group"
                title={t('ecommerce.sidebar.userPillTooltip', 'Bấm để mở menu quản lý tài khoản & đơn hàng')}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs border-2 border-black overflow-hidden group-hover:scale-105 transition-transform">
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
                  <div className="text-left min-w-0">
                    <span className="font-black text-xs text-slate-950 block truncate leading-tight group-hover:text-blue-700">
                      {currentUser?.full_name || t('ecommerce.sidebar.customerDefault', 'Khách Hàng')}
                    </span>
                    <span className="text-[10px] text-blue-700 font-black block truncate">
                      {userRole === 'store' || currentStore?.status === 'APPROVED'
                        ? t('ecommerce.sidebar.roleStore', '✂️ Chủ Shop')
                        : currentStore?.status === 'PENDING'
                        ? t('ecommerce.sidebar.rolePending', '⏳ Chờ Duyệt Shop')
                        : t('ecommerce.sidebar.roleCustomer', '👤 Khách Hàng')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {userOrders.length > 0 && (
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-mono font-black flex items-center justify-center shadow-xs border border-black">
                      {userOrders.length}
                    </span>
                  )}
                  <ChevronUp
                    size={16}
                    className={`text-slate-900 transition-transform ${isUserMenuOpen ? 'rotate-180 text-blue-600' : ''}`}
                  />
                </div>
              </button>

              {/* Floating Popover Menu khi bấm vào User Pill */}
              {isUserMenuOpen && (
                <>
                  {/* Invisible Backdrop để click ra ngoài tự đóng */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsUserMenuOpen(false)}
                  />

                  <div className="absolute bottom-full left-0 right-0 mb-2 p-2 bg-white rounded-2xl border-2 border-black shadow-2xl z-50 animate-in slide-in-from-bottom-2 duration-150 space-y-1">
                    {/* Header thông tin trong popover */}
                    <div className="px-2.5 py-1.5 border-b-2 border-black flex items-center justify-between">
                      <div className="min-w-0">
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">
                          {t('ecommerce.sidebar.menuTitle', 'Tài Khoản Cá Nhân')}
                        </span>
                        <span className="text-xs font-mono font-black text-slate-900 truncate block">
                          {currentUser?.email}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* 1. Hồ Sơ Cá Nhân & Chỉnh Sửa Thông Tin */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setProfileModalTab('profile');
                        setIsProfileModalOpen(true);
                      }}
                      className="w-full px-2.5 py-2 rounded-xl text-left hover:bg-slate-100 text-xs font-black text-slate-900 flex items-center justify-between transition-colors cursor-pointer group border border-transparent hover:border-black"
                    >
                      <div className="flex items-center gap-2">
                        <UserIcon size={14} className="text-blue-600" />
                        <span>{t('ecommerce.sidebar.menuProfile', 'Hồ sơ cá nhân & Chỉnh sửa')}</span>
                      </div>
                      <ChevronRight size={13} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    {/* 2. Đơn Hàng Của Tôi */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setProfileModalTab('orders');
                        setIsProfileModalOpen(true);
                      }}
                      className="w-full px-2.5 py-2 rounded-xl text-left hover:bg-blue-50 text-xs font-black text-blue-900 flex items-center justify-between transition-colors cursor-pointer group border border-transparent hover:border-blue-400"
                    >
                      <div className="flex items-center gap-2">
                        <Package size={14} className="text-blue-700" />
                        <span>{t('ecommerce.sidebar.menuOrders', 'Đơn hàng của tôi')}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-black bg-blue-100 text-blue-800 border-2 border-black">
                        {userOrders.length}
                      </span>
                    </button>

                    {/* 3. Hồ Sơ Số Đo Vóc Dáng 3D */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setProfileModalTab('measurements');
                        setIsProfileModalOpen(true);
                      }}
                      className="w-full px-2.5 py-2 rounded-xl text-left hover:bg-purple-50 text-xs font-black text-purple-900 flex items-center justify-between transition-colors cursor-pointer group border border-transparent hover:border-purple-400"
                    >
                      <div className="flex items-center gap-2">
                        <Ruler size={14} className="text-purple-600" />
                        <span>{t('ecommerce.sidebar.menuMeasurements', 'Số đo vóc dáng 3D')}</span>
                      </div>
                      <ChevronRight size={13} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    {/* 4. Đăng Ký Mở Gian Hàng May Đo B2B */}
                    {userRole === 'store' || currentStore?.status === 'APPROVED' ? (
                      <a
                        href="/tailor"
                        className="w-full px-2.5 py-2 rounded-xl text-left bg-emerald-50 hover:bg-emerald-100 text-xs font-black text-emerald-950 flex items-center justify-between transition-colors cursor-pointer border-2 border-emerald-400"
                      >
                        <div className="flex items-center gap-2">
                          <Store size={14} className="text-emerald-700" />
                          <span>{t('ecommerce.sidebar.menuTailorChannel', 'Vào Kênh Nhà May (/tailor)')}</span>
                        </div>
                        <ChevronRight size={13} className="text-emerald-600" />
                      </a>
                    ) : currentStore?.status === 'PENDING' ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          openStatusModal();
                        }}
                        className="w-full px-2.5 py-2 rounded-xl text-left bg-amber-50 hover:bg-amber-100 text-xs font-black text-amber-900 flex items-center justify-between transition-colors cursor-pointer border-2 border-amber-400"
                      >
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-amber-600 animate-pulse" />
                          <span>{t('ecommerce.sidebar.menuPendingApproval', 'Hồ sơ chờ Admin duyệt')}</span>
                        </div>
                        <ChevronRight size={13} className="text-amber-500" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setProfileModalTab('merchant');
                          setIsProfileModalOpen(true);
                        }}
                        className="w-full px-2.5 py-2 rounded-xl text-left bg-amber-500 hover:bg-amber-600 text-white text-xs font-black flex items-center justify-between transition-colors cursor-pointer shadow-sm border-2 border-black"
                      >
                        <div className="flex items-center gap-2">
                          <Store size={14} />
                          <span>{t('ecommerce.sidebar.menuRegisterStore', 'Đăng ký mở gian hàng')}</span>
                        </div>
                        <ChevronRight size={13} />
                      </button>
                    )}

                    {/* 5. Đăng Xuất Tài Khoản */}
                    <div className="border-t-2 border-black pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          signOut();
                        }}
                        className="w-full px-2.5 py-2 rounded-xl text-left hover:bg-rose-50 text-xs font-black text-rose-600 flex items-center gap-2 transition-colors cursor-pointer border border-transparent hover:border-rose-400"
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
            <div>
              {/* Duy nhất 1 nút Đăng Nhập gọn gàng khi chưa đăng nhập */}
              <button
                type="button"
                onClick={openSignIn}
                className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-black shadow-sm border-2 border-black transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <LogIn size={15} strokeWidth={2.5} />
                <span>{t('ecommerce.sidebar.signInSignUp', 'Đăng Nhập / Đăng Ký')}</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── RIGHT MAIN CONTENT AREA (BÊN PHẢI THANH DỌC) ── */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Mobile-only Top Bar (<lg) */}
        <header className="lg:hidden sticky top-0 z-40 bg-white border-b-2 border-stone-800 px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 cursor-pointer"
              aria-label={t('ecommerce.sidebar.openMenu', 'Mở menu dọc')}
            >
              <Menu size={18} />
            </button>
            <a href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                <Scissors size={15} />
              </div>
              <span className="font-black text-sm tracking-tight text-stone-900">
                FitVision <span className="text-blue-600">3D</span>
              </span>
            </a>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBiometricModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 text-xs font-mono font-bold text-stone-800"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{userBody.height_cm}cm</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative w-8 h-8 rounded-full bg-stone-100 text-stone-800 flex items-center justify-center cursor-pointer"
            >
              <ShoppingBag size={16} />
              {totalCartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Desktop Top Utility Bar (Search & Quick Action Triggers) - Viền phân cách rõ nét, không bị chìm */}
        <div className="hidden lg:flex items-center justify-between px-6 py-3 border-b-2 border-black bg-white shadow-xs sticky top-0 z-20">
          {/* Thanh tìm kiếm vừa vặn, viền sắc nét, khi bấm vào ĐẬM HƠN RÕ RỆT */}
          <div className="relative w-72 sm:w-80 lg:w-[360px] xl:w-[410px] shrink-0 group">
            <div className="flex items-center w-full h-11 px-3.5 rounded-2xl bg-slate-100 border-2 border-black hover:border-black focus-within:border-[2.5px] focus-within:border-black focus-within:bg-white focus-within:ring-2 focus-within:ring-black focus-within:shadow-md shadow-2xs transition-all">
              <div className="mr-2.5 flex items-center justify-center pointer-events-none text-slate-900 group-focus-within:text-black transition-colors flex-shrink-0">
                <Search size={18} strokeWidth={2.6} />
              </div>
              <input
                type="text"
                placeholder={t('ecommerce.catalog.searchPlaceholder', 'Tìm áo, quần, chất liệu...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-full bg-transparent border-0 text-xs sm:text-sm font-black text-slate-950 placeholder:text-slate-600 placeholder:font-bold focus:outline-none focus:ring-0 pr-1"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 rounded-full text-slate-600 hover:text-black hover:bg-slate-200 cursor-pointer transition-colors"
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>

          {/* Quick Action Triggers & Shopping Cart - NÚT BẤM VIỀN ĐEN 2PX ĐẬM NÉT RÕ RÀNG */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsVellStudioOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-950 border-2 border-black text-xs font-black transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-2xs"
            >
              <Sparkles size={15} className="text-purple-600" />
              <span>{t('ecommerce.topbar.virtualRoom', 'Phòng Thử Đồ Ảo 3D')}</span>
            </button>

            <a
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-950 border-2 border-black text-xs font-black transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-2xs"
            >
              <Camera size={15} className="text-blue-600" />
              <span>{t('ecommerce.topbar.aiScan', 'Quét Đo AI 3D (ISO)')}</span>
            </a>

            <button
              type="button"
              onClick={() => {
                setProfileModalTab('orders');
                setIsProfileModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-950 border-2 border-black text-xs font-black transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
              title={t('ecommerce.topbar.orders', 'Đơn Hàng')}
            >
              <Package size={15} className="text-slate-800" />
              <span>{t('ecommerce.topbar.orders', 'Đơn Hàng')}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-black shadow-sm transition-all cursor-pointer border-2 border-black active:scale-95"
            >
              <ShoppingBag size={15} />
              <span>{t('ecommerce.topbar.cart', 'Giỏ Hàng')}</span>
              {totalCartCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-mono font-bold flex items-center justify-center">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── CORE HERO BANNER (100% AUTHENTIC FITVISION 3D - NO FILLER TEXT OR UNRELATED MODELS) ── */}
        <section className="relative overflow-hidden bg-white border-b-2 border-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-14">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              {/* Left Column: Value Proposition & Action Buttons */}
              <div className="lg:col-span-7 space-y-5 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-900 border-2 border-black text-xs font-black shadow-2xs">
                  <Sparkles size={13} className="text-blue-600" />
                  <span>{t('ecommerce.hero.badge', 'NỀN TẢNG THỜI TRANG MAY ĐO & ĐO SIZE 3D THẾ HỆ MỚI')}</span>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-stone-950 leading-[1.2]">
                  {t('ecommerce.hero.title1', 'Thời Trang Vừa Vặn')} <br className="hidden sm:inline" />
                  <span className="text-blue-600">{t('ecommerce.hero.titleHighlight', 'Tuyệt Đối')}</span> {t('ecommerce.hero.title2', 'Từng Centimet.')}
                </h1>

                <p className="text-stone-700 text-sm sm:text-base leading-relaxed max-w-xl font-bold">
                  {t('ecommerce.hero.desc', 'Không còn nỗi lo chọn nhầm size hay phiền phức đổi trả. Thuật toán Trí Tuệ Nhân Tạo tự động phân tích vóc dáng và so khớp độ cử động (Ease Allowance) với từng đường kim mũi chỉ của nhà may.')}
                </p>

                {/* Nút hành động tương phản cao & viền đen 2px rõ nét */}
                <div className="flex items-center gap-3 flex-wrap pt-2">
                  <button
                    type="button"
                    onClick={() => setIsVellStudioOpen(true)}
                    className="px-5 py-3 rounded-xl bg-stone-950 hover:bg-black active:scale-95 text-white font-black text-xs sm:text-sm shadow-xl flex items-center gap-2 transition-all cursor-pointer hover:scale-105 border-2 border-black"
                  >
                    <Sparkles size={16} className="text-yellow-400" />
                    <span>{t('ecommerce.hero.ctaTryOn', 'Thử Đồ Ảo 3D (Phòng Thử AI)')}</span>
                  </button>

                  <a
                    href="/dashboard"
                    className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs sm:text-sm shadow-md flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 border-2 border-black"
                  >
                    <Camera size={15} />
                    <span>{t('ecommerce.hero.ctaScan', 'Quét Vóc Dáng AI 30s')}</span>
                  </a>

                  {isAuthenticated && userRole !== 'store' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setProfileModalTab('merchant');
                        setIsProfileModalOpen(true);
                      }}
                      className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-black text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer hover:scale-105 border-2 border-black"
                    >
                      <Store size={16} className="text-white" />
                      <span>{t('ecommerce.hero.ctaMerchant', 'Đăng Ký Gian Hàng May Đo')}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('catalog');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-950 font-black text-xs sm:text-sm border-2 border-black flex items-center gap-2 transition-all cursor-pointer hover:scale-105"
                    >
                      <ShoppingBag size={16} className="text-slate-900" />
                      <span>{t('ecommerce.hero.ctaExplore', 'Khám Phá Bộ Sưu Tập')}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column: Interactive Product Slide Preview */}
              <div
                className="lg:col-span-5 relative"
                onMouseEnter={() => setIsBannerPaused(true)}
                onMouseLeave={() => setIsBannerPaused(false)}
              >
                <div className="relative mx-auto max-w-md lg:max-w-none aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-2 border-stone-800 bg-stone-900 group">
                  <img
                    src={HERO_PRODUCT_SLIDES[activeBannerSlide].imageUrl}
                    alt={HERO_PRODUCT_SLIDES[activeBannerSlide].titleVi}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                  {/* Top Floating Match Badge */}
                  <div className="absolute top-4 right-4 z-10 animate-in fade-in slide-in-from-top-2">
                    <div className="bg-emerald-600 text-white px-3 py-1.5 rounded-2xl shadow-xl flex items-center gap-1.5 text-xs font-mono font-black border border-emerald-400/40">
                      <CheckCircle2 size={14} />
                      <span>{HERO_PRODUCT_SLIDES[activeBannerSlide].fitPercentage}% {t('ecommerce.hero.perfectFit', 'Vừa Vặn Tuyệt Đối')}</span>
                    </div>
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
                  <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white space-y-1">
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
                      <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-700/60 font-bold">
                        {t('ecommerce.hero.suggestedSize', 'Gợi ý: Size {size}').replace('{size}', HERO_PRODUCT_SLIDES[activeBannerSlide].fitSize)}
                      </span>
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

      {/* ── MAIN PRODUCT CATALOG SECTION (HIGH-FASHION EDITORIAL GRID) ── */}
      <main id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 flex-1">
        
        {/* Section Heading & Interactive VELL Studio Banner */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-blue-700">
              {t('ecommerce.catalog.tagline', 'BỘ SƯU TẬP THỜI TRANG THÔNG MINH')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-950 tracking-tight mt-1">
              {t('ecommerce.catalog.heading', 'Khám Phá Kích Cỡ Dành Riêng Cho Bạn')}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 font-medium mt-1">
              {t('ecommerce.catalog.subheading', 'Tất cả sản phẩm đã được AI tính toán sẵn kích cỡ tối ưu dựa trên số đo của bạn')}
            </p>
          </div>

          {/* Action Triggers */}
          <div className="self-start md:self-auto flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setIsVellStudioOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-950 hover:bg-black text-white text-xs sm:text-sm font-black shadow-lg border-2 border-stone-800 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <Sparkles size={15} className="text-amber-400" />
              <span>{t('ecommerce.sidebar.virtualTryOn', 'Thử Đồ Ảo 3D')}</span>
            </button>

            <a
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-black shadow-md border-2 border-blue-700 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <Camera size={15} className="text-white" />
              <span>{t('ecommerce.topbar.aiScan', 'Quét Đo AI 3D (ISO)')}</span>
            </a>
          </div>
        </div>

        {/* ── GUEST ONBOARDING BAR (When not authenticated) ── */}
        {!isAuthenticated && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-white border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-sm">
                <Sparkles size={18} />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-stone-900">
                  {t('ecommerce.guestBanner.title', 'Trải nghiệm mua sắm chuẩn may đo cá nhân hóa')}
                </h4>
                <p className="text-[11px] sm:text-xs text-stone-600 mt-0.5">
                  {t('ecommerce.guestBanner.desc', 'Đăng nhập để tự động lưu số đo vóc dáng 13 điểm chuẩn ISO 8559 và nhận đề xuất size chính xác cho mọi thương hiệu.')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
              <button
                type="button"
                onClick={openSignIn}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                {t('ecommerce.guestBanner.login', 'Đăng Nhập')}
              </button>
              <button
                type="button"
                onClick={() => setIsBiometricModalOpen(true)}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-800 border border-stone-200 text-xs font-bold transition-all cursor-pointer"
              >
                {t('ecommerce.guestBanner.quickMeasurements', 'Nhập Số Đo Nhanh')}
              </button>
            </div>
          </div>
        )}

        {/* ── TAILOR / MERCHANT STORE BAR (When in Store Role) ── */}
        {userRole === 'store' && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50/60 to-white border border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-sm">
                <Store size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-stone-950">
                    {t('ecommerce.storeBanner.title', 'Chế Độ Chủ Shop & Nhà May May Đo B2B')}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold text-[10px]">
                    Atelier Active
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-stone-700 mt-0.5">
                  {t('ecommerce.storeBanner.desc', 'Quản lý rập mẫu áo sơ mi, blazer và thông số Ease Allowance cho từng size rập.')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
              <button
                type="button"
                onClick={openOnboarding}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
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

        {/* ── MINIMALIST LUXURY CATEGORY TABS (NO THICK CLUNKY BLOCKS!) ── */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 border-b border-stone-200 scrollbar-none">
          {[
            { id: 'all', label: t('ecommerce.catalog.tabAll', 'Tất Cả Sản Phẩm'), count: MOCK_PRODUCTS.length },
            { id: 'shirt', label: t('ecommerce.catalog.tabShirt', 'Áo Sơ Mi Nam'), count: MOCK_PRODUCTS.filter(p => p.category === 'shirt').length },
            { id: 'polo', label: t('ecommerce.catalog.tabPolo', 'Áo Polo Lụa'), count: MOCK_PRODUCTS.filter(p => p.category === 'polo').length },
            { id: 'pants', label: t('ecommerce.catalog.tabPants', 'Quần Tây & Chino'), count: MOCK_PRODUCTS.filter(p => p.category === 'pants').length },
            { id: 'dress', label: t('ecommerce.catalog.tabDress', 'Đầm Lụa Nữ'), count: MOCK_PRODUCTS.filter(p => p.category === 'dress').length },
            { id: 'tailored', label: t('ecommerce.catalog.tabTailored', 'May Đo Bespoke'), count: MOCK_PRODUCTS.filter(p => p.category === 'tailored').length },
          ].map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`relative px-4 py-2 text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-2 rounded-xl ${
                  isActive
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-950 hover:bg-stone-100'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-white/20 text-white font-bold' : 'bg-stone-200/80 text-stone-600'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── ACTION TOOLBAR (SEARCH, BIOMETRIC TOGGLE, ADVANCED FILTER) ── */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-3 sm:p-4 mb-8 shadow-xs flex flex-wrap items-center justify-between gap-3">
          
          {/* Left: Clean Modern Search Box (Đậm màu, viền sắc nét) */}
          <div className="relative w-full sm:w-80 group">
            <div className="flex items-center w-full h-11 px-3.5 rounded-2xl bg-slate-100 border-2 border-slate-300 hover:border-slate-400 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100 shadow-xs transition-all">
              <div className="mr-2 flex items-center justify-center pointer-events-none text-slate-600 group-focus-within:text-blue-600 transition-colors flex-shrink-0">
                <Search size={18} strokeWidth={2.4} />
              </div>
              <input
                type="text"
                placeholder={t('ecommerce.catalog.searchPlaceholder', 'Tìm áo, quần, chất liệu...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-full bg-transparent border-0 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-500 placeholder:font-medium focus:outline-none focus:ring-0 pr-2"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-200 cursor-pointer transition-colors"
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>

          {/* Center: Smart Biometric Fit Toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none px-3.5 py-2 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-xs transition-colors">
            <input
              type="checkbox"
              checked={filterByMyFitOnly}
              onChange={(e) => setFilterByMyFitOnly(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-stone-300 accent-blue-600 cursor-pointer"
            />
            <span className="font-bold text-stone-900">
              {t('ecommerce.biometricsBar.filterMyFit', 'Chỉ hiện đồ vừa chuẩn dáng tôi (≥ 90%)')}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              ISO 8559
            </span>
          </label>

          {/* Right: Quick Sort & Filter Drawer Button */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="py-2 px-3 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800 focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="default">{t('ecommerce.catalog.sortDefault', 'Sắp xếp: Mặc định')}</option>
              <option value="fit-desc">{t('ecommerce.catalog.sortFitDesc', 'Độ vừa AI cao nhất')}</option>
              <option value="price-asc">{t('ecommerce.catalog.sortPriceAsc', 'Giá: Thấp đến Cao')}</option>
              <option value="price-desc">{t('ecommerce.catalog.sortPriceDesc', 'Giá: Cao đến Thấp')}</option>
            </select>

            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`py-2 px-3.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isFilterOpen || activeFilterCount > 0
                  ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200'
              }`}
            >
              <SlidersHorizontal size={14} />
              <span>{t('ecommerce.catalog.filterBtn', 'Lọc nâng cao')}</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-400 text-stone-950 text-[10px] font-black flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

        </div>

        {/* Expandable Advanced Filter Drawer (Price Range & Fabric) */}
        {isFilterOpen && (
          <div className="mb-8 p-5 rounded-2xl bg-white border border-stone-200 shadow-md animate-in slide-in-from-top-2 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <span className="font-extrabold text-xs uppercase tracking-wider text-stone-900">
                {t('ecommerce.catalog.filterTitle', 'Tùy Chọn Lọc Nâng Cao Theo Giá & Chất Liệu')}
              </span>
              <button
                type="button"
                onClick={handleResetAllFilters}
                className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
              >
                {t('ecommerce.catalog.resetFilters', 'Đặt lại bộ lọc')}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-stone-800 mb-2">{t('ecommerce.catalog.priceRange', 'Khoảng Giá')}:</label>
                <div className="flex flex-wrap gap-2">
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
                      className={`px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer ${
                        priceRange === p.id ? 'bg-stone-900 text-white border-stone-900' : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block font-bold text-stone-800 mb-2">{t('ecommerce.catalog.fabricTitle', 'Chất Liệu May Đo')}:</label>
                <div className="flex flex-wrap gap-2">
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
                      className={`px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer ${
                        fabricFilter === f.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SPACIOUS 4-COLUMN PRODUCT GRID (FARFETCH / ZARA AESTHETIC) ── */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-stone-200 p-8 space-y-3">
            <SlidersHorizontal size={36} className="mx-auto text-stone-300" />
            <h3 className="text-base font-extrabold text-stone-900">{t('ecommerce.catalog.emptyTitle', 'Không tìm thấy sản phẩm phù hợp')}</h3>
            <p className="text-xs text-stone-600 max-w-sm mx-auto font-medium">
              {t('ecommerce.catalog.emptyDesc', 'Thử tắt bộ lọc hoặc tìm kiếm từ khóa khác.')}
            </p>
            <button
              onClick={handleResetAllFilters}
              className="mt-2 text-xs font-extrabold text-blue-600 hover:underline cursor-pointer"
            >
              {t('ecommerce.catalog.resetAllFilters', 'Đặt lại tất cả bộ lọc')}
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
                  className="group bg-white rounded-2xl border border-stone-200/90 hover:border-stone-400 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
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
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-white/95 text-stone-900 backdrop-blur shadow-2xs border border-stone-200">
                        {product.brand_name}
                      </span>
                    </div>

                    {/* AI Match Score Tag Top Right */}
                    <div className="absolute top-2.5 right-2.5">
                      <div
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black flex items-center gap-1 shadow-md ${
                          isPerfect ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                        }`}
                      >
                        <Sparkles size={10} />
                        <span>{fit.match_percentage}% {t('ecommerce.catalog.fitMatch', 'Vừa')}</span>
                      </div>
                    </div>

                    {/* Quick 3D Fit Peek Action on Hover */}
                    <button
                      type="button"
                      onClick={() => handleOpenAnalysis(product)}
                      className="absolute inset-x-3 bottom-3 py-2 px-3 rounded-xl bg-white/95 text-blue-700 font-black text-xs shadow-md border border-stone-300 backdrop-blur opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-1.5 hover:bg-white cursor-pointer"
                    >
                      <Ruler size={14} className="text-blue-600" />
                      <span>{t('ecommerce.catalog.viewAnalysis', 'Xem Phân Tích Độ Vừa 3D')}</span>
                    </button>
                  </div>

                  {/* Card Bottom: Product Info & Actions */}
                  <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="font-extrabold text-xs sm:text-sm text-stone-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                        {getProductName(product)}
                      </h4>
                      <p className="text-xs text-stone-600 font-medium mt-1 line-clamp-1">
                        {getProductFabric(product)}
                      </p>
                    </div>

                    {/* AI Size Advice Pill (Clickable for 3D fit analysis) */}
                    <div
                      onClick={() => handleOpenAnalysis(product)}
                      className="p-2.5 rounded-xl bg-blue-50/80 hover:bg-blue-100 border border-blue-200 text-xs transition-colors cursor-pointer group/fit"
                      title={t('ecommerce.catalog.viewAnalysis', 'Xem Phân Tích Độ Vừa 3D')}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-stone-800 font-bold">{t('ecommerce.catalog.recommendLabel', 'Khuyên dùng:')}</span>
                        <span className="font-mono font-black text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-300 shadow-2xs flex items-center gap-1">
                          <span>Size {fit.recommended_size}</span>
                          <ChevronRight size={12} className="text-blue-500 group-hover/fit:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-700 mt-1 line-clamp-1 font-bold">
                        {locale === 'en' && fit.advisor_advice_en ? fit.advisor_advice_en : fit.advisor_advice_vi}
                      </p>
                    </div>

                    {/* Price and Action Buttons */}
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                      <div>
                        {product.sale_price ? (
                          <div className="flex flex-col">
                            <span className="font-black text-stone-950 text-xs sm:text-sm">
                              {product.sale_price.toLocaleString('vi-VN')} ₫
                            </span>
                            <span className="text-[10px] text-stone-400 line-through font-bold">
                              {product.price.toLocaleString('vi-VN')} ₫
                            </span>
                          </div>
                        ) : (
                          <span className="font-black text-stone-950 text-xs sm:text-sm">
                            {product.price.toLocaleString('vi-VN')} ₫
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setIsVellStudioOpen(true)}
                          className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                          title={t('ecommerce.sidebar.virtualTryOn', 'Thử đồ ảo 3D (VELL Studio)')}
                        >
                          <Sparkles size={14} className="text-purple-600" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAddToCart(product, product.recommendedVariant)}
                          style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
                          className="relative overflow-hidden py-2 px-3 sm:px-3.5 rounded-xl hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 transition-all duration-200 ease-out transform hover:-translate-y-0.5 flex items-center gap-1.5 cursor-pointer group whitespace-nowrap"
                          title={t('ecommerce.catalog.buySizeTooltip', 'Chọn mua ngay Size {size}').replace('{size}', fit.recommended_size)}
                        >
                          <ShoppingBag size={13} className="text-white group-hover:scale-110 transition-transform duration-200" />
                          <span className="tracking-tight">
                            {t('ecommerce.catalog.chooseSize', 'Chọn Size {size}').replace('{size}', fit.recommended_size)}
                          </span>
                        </button>
                      </div>
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

      {/* ── FOOTER (GIAO DIỆN XANH DA TRỜI NHẠT THANH LỊCH) ── */}
      <footer className="bg-sky-50 text-slate-700 text-xs py-12 border-t-2 border-sky-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-sky-200">
            {/* Brand & Vision */}
            <div className="md:col-span-2 space-y-3 text-left">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30">
                  <Scissors size={18} strokeWidth={2.2} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg text-slate-900 tracking-tight">
                    FitVision <span className="text-blue-600">3D</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300">
                    {t('ecommerce.footer.smartTailoring', 'May Đo Thông Minh')}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 font-normal leading-relaxed max-w-md">
                {t('ecommerce.footer.desc', 'Nền tảng thương mại điện tử thời trang may đo ứng dụng công nghệ quét 3D và nhân trắc học ISO 8559-1. Đảm bảo trang phục vừa vặn hoàn hảo từng centimet, xóa bỏ nỗi lo chọn nhầm kích cỡ.')}
              </p>

              <div className="flex items-center gap-3 pt-1">
                <div className="px-3 py-1.5 rounded-lg bg-white border-2 border-sky-200 text-[11px] text-slate-800 flex items-center gap-2 shadow-xs">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>{t('ecommerce.footer.guarantee', 'Cam kết vừa vặn 100% đổi trả miễn phí')}</span>
                </div>
              </div>
            </div>

            {/* Customer Care Links */}
            <div className="space-y-2.5 text-left">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                {t('ecommerce.footer.services', 'Dịch Vụ & Đo Đạc')}
              </h4>
              <ul className="space-y-2 text-slate-600">
                <li>
                  <a href="/dashboard" className="hover:text-blue-600 transition-colors duration-200 flex items-center gap-1.5 font-medium">
                    <Camera size={13} className="text-blue-600" />
                    <span>{t('ecommerce.footer.booth', 'Buồng Quét 3D Online')}</span>
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsBiometricModalOpen(true)}
                    className="hover:text-blue-600 transition-colors duration-200 flex items-center gap-1.5 bg-transparent border-0 cursor-pointer text-left p-0 text-xs text-slate-600 font-medium"
                  >
                    <Ruler size={13} className="text-amber-600" />
                    <span>{t('ecommerce.footer.sizingGuide', 'Hướng Dẫn Lấy Số Đo')}</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={openOnboarding}
                    className="hover:text-blue-600 transition-colors duration-200 flex items-center gap-1.5 bg-transparent border-0 cursor-pointer text-left p-0 text-xs text-slate-600 font-medium"
                  >
                    <Store size={13} className="text-emerald-600" />
                    <span>{t('ecommerce.footer.registerMerchant', 'Dành Cho Nhà May & Đối Tác')}</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Quick Actions & Repository */}
            <div className="space-y-2.5 text-left">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                {t('ecommerce.footer.connect', 'Kết Nối & Hỗ Trợ')}
              </h4>
              <ul className="space-y-2 text-slate-600">
                <li>
                  <a
                    href="https://github.com/le-van-thang/C1SE.12-FitVision3D"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-blue-600 transition-colors duration-200 flex items-center gap-1.5 font-medium"
                  >
                    <Layers size={13} className="text-purple-600" />
                    <span>{t('ecommerce.footer.github', 'GitHub Repository')}</span>
                  </a>
                </li>
                <li className="text-[11px] text-slate-600 font-medium">
                  {t('ecommerce.footer.supportEmail', 'Hỗ trợ: support@fitvision3d.com')}
                </li>
                <li className="text-[11px] text-slate-600 font-medium">
                  {t('ecommerce.footer.hours', 'Hoạt động: 8:00 - 21:00 (T2 - CN)')}
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Copyright and Standards */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-600">
            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
              <span className="font-semibold text-slate-900">© 2026 FitVision 3D Inc.</span>
              <span className="text-sky-300">•</span>
              <span className="px-2 py-0.5 rounded bg-white border border-sky-200 text-slate-700 font-mono text-[10px]">
                {t('ecommerce.footer.isoBadge', 'Chuẩn ISO 8559-1:2014')}
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-300 text-emerald-800 font-mono text-[10px]">
                {t('ecommerce.footer.privacyBadge', 'Bảo Mật RAM 100%')}
              </span>
            </div>

            <p className="text-slate-600 text-center sm:text-right font-medium">
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

      {/* VELL Virtual 3D Styling Studio (Scan Line Wipe Effect) */}
      <VellVirtualStudioModal
        isOpen={isVellStudioOpen}
        onClose={() => setIsVellStudioOpen(false)}
        userBody={userBody}
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
        userRole={userRole}
        userName={currentUser?.full_name || currentUser?.email || 'Thắng Lê'}
        avatarUrl={currentUser?.avatar_url || undefined}
        onOpenVellStudio={() => setIsVellStudioOpen(true)}
        onOpenMaisonRunway={() => setIsVellStudioOpen(true)}
        onOpenThermalSlip={() => setIsThermalSlipOpen(true)}
        onOpenBiometrics={() => setIsBiometricModalOpen(true)}
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

      {/* Floating Gemini 2.5 Fashion & Fit Stylist Chatbot */}
      <GeminiAssistantWidget
        userBody={{
          height_cm: userBody.height_cm,
          weight_kg: userBody.weight_kg,
          chest_cm: userBody.chest_cm,
          waist_cm: userBody.waist_cm,
          hip_cm: userBody.hip_cm,
        }}
      />

    </div>
  );
};

