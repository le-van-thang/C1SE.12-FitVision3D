import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Store,
  Package,
  ShoppingBag,
  Plus,
  RefreshCw,
  ArrowLeft,
  BadgeCheck,
  Eye,
  EyeOff,
  Trash2,
  Ruler,
  LogOut,
  TrendingUp,
  CheckCircle2,
  X,
  Video,
  MessageSquare,
  Send,
  Star,
  Upload,
  Save,
  Sparkles,
  Phone,
  MapPin,
  Palette,
  Wand2,
  KeyRound,
  Scissors,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Building2,
  CreditCard,
  PauseCircle,
  ExternalLink,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';
import { AuthModal } from '@/components/auth/AuthModal';
import { GeminiAssistantWidget } from '@/components/ai/GeminiAssistantWidget';
import { ShopSettingsTab } from '@/components/shop/ShopSettingsTab';
import {
  commerceApi,
  type DbProduct,
  type DbShopProfile,
  type DbShopReview,
  type ShopReputationSummary,
} from '@/services/commerceApi';
import { adminApi } from '@/services/adminApi';
import {
  VIETNAM_BANKS,
  validateVietnamCCCD,
  validateVietnamTaxCode,
  type ShopEntityType,
} from '@/utils/shopKycValidation';
import type { Order } from '@/features/ecommerce/types';
import { showGlobalToast } from '@/components/common/GlobalToastHost';

const FASHION_COLOR_PALETTE: { name: string; hex: string }[] = [
  { name: 'Đen Tuyền', hex: '#14171C' },
  { name: 'Trắng Tinh', hex: '#FFFFFF' },
  { name: 'Trắng Kem', hex: '#F3F4F6' },
  { name: 'Be Sữa', hex: '#E6D5B8' },
  { name: 'Vàng Kem', hex: '#FDE68A' },
  { name: 'Vàng Mù Tạt', hex: '#D97706' },
  { name: 'Cam Đất', hex: '#EA580C' },
  { name: 'Đỏ Tươi', hex: '#DC2626' },
  { name: 'Đỏ Đô', hex: '#881337' },
  { name: 'Hồng Phấn', hex: '#F9A8D4' },
  { name: 'Hồng Sen', hex: '#DB2777' },
  { name: 'Tím Lavender', hex: '#A78BFA' },
  { name: 'Tím Than', hex: '#4C1D95' },
  { name: 'Xanh Navy', hex: '#1E3A8A' },
  { name: 'Xanh Dương', hex: '#2563EB' },
  { name: 'Xanh Da Trời', hex: '#60A5FA' },
  { name: 'Xanh Ngọc', hex: '#0D9488' },
  { name: 'Xanh Lá', hex: '#16A34A' },
  { name: 'Xanh Rêu', hex: '#3F6212' },
  { name: 'Xám Nhạt', hex: '#CBD5E1' },
  { name: 'Xám Khói', hex: '#64748B' },
  { name: 'Nâu Bò', hex: '#92400E' },
  { name: 'Nâu Cà Phê', hex: '#451A03' },
];

const ALL_GARMENT_SIZES: ('XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL')[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const DEFAULT_SAMPLE_IMG =
  'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=80';

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return [30, 41, 59];
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [Number.isFinite(r) ? r : 30, Number.isFinite(g) ? g : 41, Number.isFinite(b) ? b : 59];
}

function detectNearestColorName(hex: string): string {
  const [r1, g1, b1] = hexToRgb(hex);
  let best = FASHION_COLOR_PALETTE[0].name;
  let bestDist = Infinity;
  for (const item of FASHION_COLOR_PALETTE) {
    const [r2, g2, b2] = hexToRgb(item.hex);
    const dist = (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      best = item.name;
    }
  }
  return best;
}

async function analyzeImageVisualTone(src: string): Promise<{ dominantColor?: string; brightness: 'light' | 'medium' | 'dark' }> {
  if (!src) return { brightness: 'medium' };
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 48;
        canvas.height = 48;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve({ brightness: 'medium' });
        ctx.drawImage(img, 0, 0, 48, 48);
        const data = ctx.getImageData(12, 12, 24, 24).data;
        let rSum = 0;
        let gSum = 0;
        let bSum = 0;
        const pixels = data.length / 4;
        for (let i = 0; i < data.length; i += 4) {
          rSum += data[i];
          gSum += data[i + 1];
          bSum += data[i + 2];
        }
        const r = Math.round(rSum / pixels);
        const g = Math.round(gSum / pixels);
        const b = Math.round(bSum / pixels);
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        resolve({
          dominantColor: detectNearestColorName(hex),
          brightness: lum > 175 ? 'light' : lum < 85 ? 'dark' : 'medium',
        });
      } catch {
        resolve({ brightness: 'medium' });
      }
    };
    img.onerror = () => resolve({ brightness: 'medium' });
    img.src = src;
  });
}

type ShopTab = 'OVERVIEW' | 'PRODUCTS' | 'ORDERS' | 'SIZE_CHART' | 'SETTINGS';

type GarmentCategoryKey = 'shirt' | 'polo' | 'pants' | 'dress';

interface SizeSpecRow {
  size: 'S' | 'M' | 'L' | 'XL';
  chest_min: number;
  chest_max: number;
  shoulder: number;
  waist_min: number;
  waist_max: number;
  hip_max: number;
  length: number;
}

const DEFAULT_SIZE_SPECS: Record<GarmentCategoryKey, SizeSpecRow[]> = {
  shirt: [
    { size: 'S', chest_min: 86, chest_max: 91, shoulder: 42, waist_min: 72, waist_max: 77, hip_max: 94, length: 70 },
    { size: 'M', chest_min: 92, chest_max: 97, shoulder: 44, waist_min: 78, waist_max: 83, hip_max: 99, length: 72 },
    { size: 'L', chest_min: 98, chest_max: 103, shoulder: 46, waist_min: 84, waist_max: 89, hip_max: 104, length: 74 },
    { size: 'XL', chest_min: 104, chest_max: 110, shoulder: 48, waist_min: 90, waist_max: 96, hip_max: 110, length: 76 },
  ],
  polo: [
    { size: 'S', chest_min: 88, chest_max: 93, shoulder: 42, waist_min: 73, waist_max: 78, hip_max: 94, length: 68 },
    { size: 'M', chest_min: 94, chest_max: 99, shoulder: 44, waist_min: 79, waist_max: 84, hip_max: 99, length: 70 },
    { size: 'L', chest_min: 100, chest_max: 105, shoulder: 46, waist_min: 85, waist_max: 90, hip_max: 104, length: 72 },
    { size: 'XL', chest_min: 106, chest_max: 112, shoulder: 48, waist_min: 91, waist_max: 97, hip_max: 110, length: 74 },
  ],
  pants: [
    { size: 'S', chest_min: 0, chest_max: 0, shoulder: 0, waist_min: 70, waist_max: 74, hip_max: 92, length: 97 },
    { size: 'M', chest_min: 0, chest_max: 0, shoulder: 0, waist_min: 75, waist_max: 79, hip_max: 97, length: 99 },
    { size: 'L', chest_min: 0, chest_max: 0, shoulder: 0, waist_min: 80, waist_max: 85, hip_max: 102, length: 101 },
    { size: 'XL', chest_min: 0, chest_max: 0, shoulder: 0, waist_min: 86, waist_max: 92, hip_max: 108, length: 103 },
  ],
  dress: [
    { size: 'S', chest_min: 80, chest_max: 84, shoulder: 36, waist_min: 62, waist_max: 66, hip_max: 90, length: 94 },
    { size: 'M', chest_min: 85, chest_max: 89, shoulder: 37, waist_min: 67, waist_max: 71, hip_max: 95, length: 96 },
    { size: 'L', chest_min: 90, chest_max: 95, shoulder: 38, waist_min: 72, waist_max: 77, hip_max: 100, length: 98 },
    { size: 'XL', chest_min: 96, chest_max: 102, shoulder: 40, waist_min: 78, waist_max: 84, hip_max: 106, length: 100 },
  ],
};

const SIZE_SPECS_STORAGE_KEY = 'fitvision_shop_size_specs_v1';
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB
const MAX_VIDEO_BYTES = 12 * 1024 * 1024; // 12MB

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

export const ShopPortal: React.FC = () => {
  const { currentUser, isAuthenticated, userRole, isAuthModalOpen, openSignIn, openOnboarding, signOut } = useAuth();
  const { locale, setLocale, t } = useI18n();
  const [activeTab, setActiveTab] = useState<ShopTab>('OVERVIEW');
  const [shop, setShop] = useState<DbShopProfile | null>(null);
  const [kycDocuments, setKycDocuments] = useState<any[]>([]);
  const [bankAccount, setBankAccount] = useState<any | null>(null);
  const [reputation, setReputation] = useState<ShopReputationSummary | null>(null);
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<DbShopReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Shop profile & operational mode editable state
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [profileTagline, setProfileTagline] = useState('');
  const [operationalMode, setOperationalMode] = useState<'ACTIVE' | 'VACATION'>('ACTIVE');
  const [vacationNote, setVacationNote] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // KYC Resubmission state (when shop status is PENDING or REJECTED)
  const [resubmitEntityType, setResubmitEntityType] = useState<ShopEntityType>('INDIVIDUAL');
  const [resubmitTaxCode, setResubmitTaxCode] = useState('');
  const [resubmitNationalId, setResubmitNationalId] = useState('');
  const [resubmitLicenseNo, setResubmitLicenseNo] = useState('');
  const [resubmitBankCode, setResubmitBankCode] = useState('VCB');
  const [resubmitBankName, setResubmitBankName] = useState('Vietcombank');
  const [resubmitBankAcc, setResubmitBankAcc] = useState('');
  const [resubmitBankHolder, setResubmitBankHolder] = useState('');
  const [isResubmittingKyc, setIsResubmittingKyc] = useState(false);

  // Product creation form + Multi-Color & Size Variants + Anti-Spam guard
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<'shirt' | 'polo' | 'pants' | 'dress' | 'tailored'>('shirt');
  const [newGender, setNewGender] = useState<'male' | 'female' | 'unisex'>('male');
  const [newPrice, setNewPrice] = useState('');
  const [newSalePrice, setNewSalePrice] = useState('');
  const [discountMode, setDiscountMode] = useState<'discount_amount' | 'final_price'>('discount_amount');
  const [newFabric, setNewFabric] = useState('100% Cotton Cao Cấp');
  const [newStretch, setNewStretch] = useState('Co giãn nhẹ (2-3%)');
  const [newIsBespoke, setNewIsBespoke] = useState(false);
  const [colorVariants, setColorVariants] = useState<{ colorName: string; colorHex: string; imageUrl: string }[]>([
    { colorName: 'Trắng Kem', colorHex: '#F3F4F6', imageUrl: DEFAULT_SAMPLE_IMG },
  ]);
  const [selectedSizes, setSelectedSizes] = useState<('XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL')[]>(['S', 'M', 'L', 'XL']);
  const [sizeStockMap, setSizeStockMap] = useState<Record<string, number>>({
    XS: 10,
    S: 20,
    M: 30,
    L: 30,
    XL: 20,
    XXL: 10,
  });
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoFileName, setNewVideoFileName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [authNeedsRelogin, setAuthNeedsRelogin] = useState(false);
  const [recentSubmitTimestamps, setRecentSubmitTimestamps] = useState<number[]>([]);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    price?: string;
    salePrice?: string;
  }>({});
  const nameInputRef = useRef<HTMLInputElement>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);
  const salePriceInputRef = useRef<HTMLInputElement>(null);

  // Order & Review interactions
  const [replyingReviewId, setReplyingReviewId] = useState<number | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Embedded 3D Size Spec Matrix state (Light Atelier Theme inside /shop)
  const [selectedSizeCategory, setSelectedSizeCategory] = useState<GarmentCategoryKey>('shirt');
  const [sizeSpecs, setSizeSpecs] = useState<Record<GarmentCategoryKey, SizeSpecRow[]>>(() => {
    try {
      const saved = localStorage.getItem(SIZE_SPECS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback to defaults
    }
    return DEFAULT_SIZE_SPECS;
  });

  const loadShopData = useCallback(async () => {
    if (!isAuthenticated || (userRole !== 'store' && userRole !== 'admin')) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const res = await commerceApi.getShopDashboard();
    if (res.success && res.data) {
      setAuthNeedsRelogin(false);
      setShop(res.data.shop);
      setKycDocuments(res.data.documents || []);
      setBankAccount(res.data.bankAccount || null);
      setReputation(res.data.reputation || null);
      setProducts(res.data.products || []);
      setOrders(res.data.orders || []);
      setReviews(res.data.reviews || []);
      if (res.data.shop) {
        const s = res.data.shop;
        setProfileName(s.shop_name || '');
        setProfilePhone(s.phone_number || '');
        setProfileAddress(s.shop_address || '');
        setProfileTagline(s.tagline || '');
        setOperationalMode(s.operational_mode === 'VACATION' ? 'VACATION' : 'ACTIVE');
        setVacationNote(s.vacation_note || '');
        setResubmitEntityType((s.entity_type as ShopEntityType) || 'INDIVIDUAL');
        setResubmitTaxCode(s.tax_code || '');
        setResubmitLicenseNo(s.business_license_no || '');
      }
      if (res.data.bankAccount) {
        setResubmitBankCode(res.data.bankAccount.bank_code || 'VCB');
        setResubmitBankName(res.data.bankAccount.bank_name || 'Vietcombank');
        setResubmitBankAcc(res.data.bankAccount.account_number || '');
        setResubmitBankHolder(res.data.bankAccount.account_holder_name || '');
      }
    } else if (res.error?.code === 'AUTH_UNAUTHORIZED') {
      setAuthNeedsRelogin(true);
    }
    setIsLoading(false);
  }, [isAuthenticated, userRole]);

  useEffect(() => {
    void loadShopData();
  }, [loadShopData]);

  useEffect(() => {
    if (!isAuthModalOpen && authNeedsRelogin) {
      void loadShopData();
    }
  }, [isAuthModalOpen, authNeedsRelogin, loadShopData]);

  const totalRevenue = useMemo(
    () => orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + Number(o.total_amount || 0), 0),
    [orders]
  );

  const pendingReviewsCount = useMemo(
    () => reviews.filter((r) => !r.shop_reply).length,
    [reviews]
  );

  const handleUpdateOrderStatus = async (orderId: string, nextStatus: Order['status']) => {
    const res = await commerceApi.updateOrderStatus(orderId, nextStatus);
    if (res.success && res.data) {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? res.data! : o)));
      showGlobalToast({
        type: 'success',
        title: `Đã cập nhật đơn #${orderId}`,
        message: `Trạng thái mới: ${nextStatus.toUpperCase()}`,
      });
    } else {
      showGlobalToast({
        type: 'error',
        title: 'Không thể cập nhật trạng thái',
        message: res.error?.message || 'Vui lòng thử lại.',
      });
    }
  };

  const handleSaveShopProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profileName.trim().length < 2) {
      showGlobalToast({
        type: 'warning',
        title: 'Tên thương hiệu quá ngắn',
        message: 'Vui lòng nhập tên Shop từ 2 ký tự trở lên.',
      });
      return;
    }
    setIsSavingProfile(true);
    const res = await commerceApi.updateShopProfile({
      shopName: profileName.trim(),
      phoneNumber: profilePhone.trim(),
      shopAddress: profileAddress.trim(),
      tagline: profileTagline.trim(),
      operationalMode,
      vacationNote: operationalMode === 'VACATION' ? vacationNote.trim() : '',
    });
    setIsSavingProfile(false);
    if (res.success && res.data) {
      setShop(res.data);
      showGlobalToast({
        type: 'success',
        title: 'Đã cập nhật hồ sơ Shop!',
        message: 'Tên thương hiệu và thông tin liên hệ đã được cập nhật.',
      });
      void loadShopData();
    } else {
      showGlobalToast({
        type: 'error',
        title: 'Cập nhật thất bại',
        message: res.error?.message || 'Không thể lưu thông tin Shop.',
      });
    }
  };

  const handleResubmitKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resubmitNationalId.trim()) {
      const cccdCheck = validateVietnamCCCD(resubmitNationalId);
      if (!cccdCheck.valid) {
        showGlobalToast({ type: 'error', title: 'CCCD không hợp lệ', message: cccdCheck.reason || '' });
        return;
      }
    }
    if (resubmitTaxCode.trim()) {
      const mstCheck = validateVietnamTaxCode(resubmitTaxCode);
      if (!mstCheck.valid) {
        showGlobalToast({ type: 'error', title: 'Mã số thuế không hợp lệ', message: mstCheck.reason || '' });
        return;
      }
    }
    setIsResubmittingKyc(true);
    const res = await adminApi.applyStore({
      shopName: profileName.trim() || shop?.shop_name || 'Gian hàng FitVision',
      phoneNumber: profilePhone.trim() || shop?.phone_number || '0901234567',
      shopAddress: profileAddress.trim() || shop?.shop_address || 'Việt Nam',
      entityType: resubmitEntityType,
      taxCode: resubmitTaxCode.trim() || undefined,
      nationalId: resubmitNationalId.trim() || undefined,
      legalRepresentativeName: shop?.legal_representative_name || currentUser?.full_name,
      businessLicenseNo: resubmitLicenseNo.trim() || undefined,
      bankCode: resubmitBankCode,
      bankName: resubmitBankName,
      bankAccountNumber: resubmitBankAcc.trim() || undefined,
      bankAccountHolder: resubmitBankHolder.trim() || undefined,
    });
    setIsResubmittingKyc(false);
    if (res.success) {
      showGlobalToast({
        type: 'success',
        title: 'Đã cập nhật & gửi lại hồ sơ KYC!',
        message: 'Ban quản trị sẽ thẩm định lại hồ sơ thuế & định danh của bạn.',
      });
      void loadShopData();
    } else {
      showGlobalToast({
        type: 'error',
        title: 'Không thể nộp lại hồ sơ',
        message: res.error?.message || 'Vui lòng kiểm tra lại các trường thông tin.',
      });
    }
  };

  const handleVariantImageUpload = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showGlobalToast({
        type: 'error',
        title: 'Sai định dạng ảnh',
        message: 'Chỉ chấp nhận tệp ảnh JPG, PNG hoặc WEBP.',
      });
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      showGlobalToast({
        type: 'warning',
        title: 'Chống Spam Dung Lượng Ảnh',
        message: 'Ảnh sản phẩm tải lên tối đa 2MB để bảo vệ tốc độ tải trang.',
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const resultDataUrl = reader.result;
        setColorVariants((prev) =>
          prev.map((item, i) => (i === idx ? { ...item, imageUrl: resultDataUrl } : item))
        );
        showGlobalToast({
          type: 'success',
          title: 'Đã tải ảnh cho màu áo/quần',
          message: `${file.name} (${(file.size / 1024).toFixed(0)} KB) — Xem trước ngay bên dưới.`,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleToggleSizeOption = (sz: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL') => {
    setSelectedSizes((prev) => {
      if (prev.includes(sz)) {
        if (prev.length === 1) {
          showGlobalToast({
            type: 'warning',
            title: 'Cần tối thiểu 1 size',
            message: 'Sản phẩm phải mở bán ít nhất 1 kích cỡ.',
          });
          return prev;
        }
        return prev.filter((s) => s !== sz);
      }
      return [...prev, sz].sort((a, b) => ALL_GARMENT_SIZES.indexOf(a) - ALL_GARMENT_SIZES.indexOf(b));
    });
  };

  const handleSuggestDescription = async () => {
    setIsGeneratingDesc(true);
    const primaryImg = colorVariants[0]?.imageUrl || DEFAULT_SAMPLE_IMG;
    const tone = await analyzeImageVisualTone(primaryImg);

    const res = await commerceApi.suggestShopProductDescription({
      name: newName.trim() || 'Sản phẩm thời trang thiết kế',
      category: newCategory,
      genderTarget: newGender,
      fabricMaterial: newFabric,
      stretchType: newStretch,
      colors: colorVariants.map((c) => c.colorName.trim()).filter(Boolean),
      sizes: selectedSizes,
      hasVideo: Boolean(newVideoUrl.trim()),
      visualTone: tone,
    });
    setIsGeneratingDesc(false);

    if (res.success && res.data?.description) {
      setNewDescription(res.data.description);
      showGlobalToast({
        type: 'success',
        title: 'AI đã gợi ý mô tả sản phẩm!',
        message: tone.dominantColor
          ? `Nhận diện sắc ảnh ${tone.dominantColor} & ${colorVariants.length} phiên bản màu.`
          : 'Đã tự động soạn mô tả chuẩn sàn TMĐT từ thông số sản phẩm.',
      });
    } else {
      // Offline graceful fallback
      const colorsStr = colorVariants.map((c) => c.colorName).join(', ');
      setNewDescription(
        `${newName.trim() || 'Mẫu trang phục cao cấp'} — chất liệu ${newFabric}, ${newStretch.toLowerCase()}, đứng phom sang trọng.\n• Phiên bản màu sắc: ${colorsStr}.\n• Kích cỡ sẵn có: ${selectedSizes.join(' / ')} — Hỗ trợ Quét AI 3D FitVision chỉ với 1 bức ảnh để gợi ý size chuẩn vóc dáng.`
      );
      showGlobalToast({
        type: 'info',
        title: 'Đã tạo mô tả gợi ý nhanh!',
        message: 'Bạn có thể chỉnh sửa thêm trước khi đăng bán.',
      });
    }
  };

  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      showGlobalToast({
        type: 'error',
        title: 'Sai định dạng Video',
        message: 'Vui lòng chọn tệp MP4 hoặc WebM hợp lệ.',
      });
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      showGlobalToast({
        type: 'warning',
        title: 'Chống Spam & Quá Tải Server',
        message: `Video tải trực tiếp tối đa 12MB (file hiện tại ${(file.size / 1024 / 1024).toFixed(1)}MB). Với video dài hơn, hãy dán link MP4/YouTube CDN.`,
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewVideoUrl(reader.result);
        setNewVideoFileName(file.name);
        showGlobalToast({
          type: 'success',
          title: 'Đã đính kèm Video Review',
          message: `${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const focusAndScrollField = (ref: React.RefObject<HTMLInputElement | null>) => {
    const el = ref.current;
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      el.focus();
    }, 220);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) return;

    const nextErrors: { name?: string; price?: string; salePrice?: string } = {};
    const trimmedName = newName.trim();
    const numericPrice = Number(newPrice);
    const rawPromo = newSalePrice.trim() ? Number(newSalePrice) : null;
    const resolvedSalePrice =
      rawPromo === null
        ? null
        : discountMode === 'discount_amount'
          ? numericPrice - rawPromo
          : rawPromo;

    if (trimmedName.length < 3) {
      nextErrors.name = 'Vui lòng nhập tên sản phẩm tối thiểu 3 ký tự.';
    }
    if (!newPrice.trim() || !Number.isFinite(numericPrice) || numericPrice < 1000) {
      nextErrors.price = 'Vui lòng nhập giá gốc hợp lệ (tối thiểu 1.000₫).';
    }
    if (rawPromo !== null) {
      if (!Number.isFinite(rawPromo) || rawPromo <= 0) {
        nextErrors.salePrice = 'Số tiền nhập phải lớn hơn 0.';
      } else if (
        resolvedSalePrice === null ||
        resolvedSalePrice < 1000 ||
        (Number.isFinite(numericPrice) && resolvedSalePrice >= numericPrice)
      ) {
        nextErrors.salePrice =
          discountMode === 'discount_amount'
            ? 'Số tiền giảm phải nhỏ hơn giá gốc và giá sau giảm tối thiểu 1.000₫.'
            : 'Giá sau giảm phải từ 1.000₫ và thấp hơn giá gốc.';
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      if (nextErrors.name) {
        focusAndScrollField(nameInputRef);
        showGlobalToast({ type: 'warning', title: 'Thiếu thông tin sản phẩm', message: nextErrors.name });
      } else if (nextErrors.price) {
        focusAndScrollField(priceInputRef);
        showGlobalToast({ type: 'warning', title: 'Chưa đúng giá gốc', message: nextErrors.price });
      } else if (nextErrors.salePrice) {
        focusAndScrollField(salePriceInputRef);
        showGlobalToast({ type: 'warning', title: 'Giá khuyến mãi chưa hợp lệ', message: nextErrors.salePrice });
      }
      return;
    }
    setFieldErrors({});

    // True Bot / Auto-Click Burst Protection only (ignores normal human speed)
    const now = Date.now();
    const recentMinute = recentSubmitTimestamps.filter((ts) => now - ts < 60_000);
    const recentBurst = recentMinute.filter((ts) => now - ts < 3_000);
    if (recentBurst.length >= 4 || recentMinute.length >= 30) {
      showGlobalToast({
        type: 'warning',
        title: 'Thao tác quá nhanh',
        message: 'Phát hiện gửi yêu cầu liên tiếp bất thường (Auto-Click). Vui lòng đợi vài giây.',
      });
      return;
    }

    if (products.length >= 50) {
      showGlobalToast({
        type: 'warning',
        title: 'Đạt giới hạn 50 sản phẩm/Shop',
        message: 'Vui lòng xóa bớt sản phẩm cũ hoặc liên hệ Admin nâng hạn mức.',
      });
      return;
    }

    const cleanColors = colorVariants.map((c) => ({
      colorName: c.colorName.trim() || detectNearestColorName(c.colorHex),
      colorHex: c.colorHex,
      imageUrl: c.imageUrl.trim() || DEFAULT_SAMPLE_IMG,
    }));

    setIsCreating(true);
    const res = await commerceApi.createShopProduct({
      name: trimmedName,
      category: newCategory,
      genderTarget: newGender,
      price: numericPrice,
      salePrice: resolvedSalePrice,
      isBespoke: newIsBespoke || newCategory === 'tailored',
      fabricMaterial: newFabric.trim() || 'Cotton Cao Cấp',
      stretchType: newStretch,
      imageUrl: cleanColors[0].imageUrl,
      videoUrl: newVideoUrl.trim() || undefined,
      description:
        newDescription.trim() ||
        `Thiết kế độc quyền từ ${shop?.shop_name || 'Shop'} — Đủ màu (${cleanColors.map((c) => c.colorName).join(', ')}), hỗ trợ chọn size AI 3D FitVision.`,
      colorName: cleanColors[0].colorName,
      colorHex: cleanColors[0].colorHex,
      colorVariants: cleanColors,
      sizes: selectedSizes,
      stockMap: sizeStockMap,
    });
    setIsCreating(false);

    if (res.success && res.data) {
      setRecentSubmitTimestamps([...recentMinute, Date.now()]);
      setShowAddForm(false);
      setNewName('');
      setNewPrice('');
      setNewSalePrice('');
      setNewDescription('');
      setNewVideoUrl('');
      setNewVideoFileName('');
      setNewIsBespoke(false);
      setColorVariants([{ colorName: 'Trắng Kem', colorHex: '#F3F4F6', imageUrl: DEFAULT_SAMPLE_IMG }]);
      setSelectedSizes(['S', 'M', 'L', 'XL']);
      showGlobalToast({
        type: 'success',
        title: 'Đã đăng bán sản phẩm mới!',
        message: `"${res.data.name}" (${cleanColors.length} màu, ${selectedSizes.length} size) đã hiển thị trên sàn FitVision.`,
      });
      void loadShopData();
    } else {
      if (res.error?.code === 'AUTH_UNAUTHORIZED') {
        setAuthNeedsRelogin(true);
      }
      showGlobalToast({
        type: 'error',
        title: 'Không thể đăng sản phẩm',
        message: res.error?.message || 'Vui lòng kiểm tra lại dữ liệu hoặc đăng nhập lại.',
      });
    }
  };

  const handleToggleHide = async (p: DbProduct) => {
    const res = await commerceApi.updateShopProduct(p.id, { isHidden: !p.is_hidden });
    if (res.success) {
      showGlobalToast({
        type: 'info',
        title: p.is_hidden ? 'Đã mở bán lại' : 'Đã tạm ẩn sản phẩm',
        message: p.name,
      });
      void loadShopData();
    }
  };

  const handleDeleteProduct = async (p: DbProduct) => {
    const res = await commerceApi.deleteShopProduct(p.id);
    if (res.success) {
      showGlobalToast({ type: 'warning', title: 'Đã xóa sản phẩm', message: p.name });
      void loadShopData();
    }
  };

  const handleSendReply = async (reviewId: number) => {
    if (!replyDraft.trim()) return;
    setIsSendingReply(true);
    const res = await commerceApi.replyProductReview(reviewId, replyDraft.trim());
    setIsSendingReply(false);
    if (res.success) {
      setReplyingReviewId(null);
      setReplyDraft('');
      showGlobalToast({
        type: 'success',
        title: 'Đã phản hồi đánh giá!',
        message: 'Câu trả lời của Shop đã hiển thị ngay dưới bình luận khách hàng.',
      });
      void loadShopData();
    } else {
      showGlobalToast({
        type: 'error',
        title: 'Gửi phản hồi thất bại',
        message: res.error?.message || 'Vui lòng thử lại.',
      });
    }
  };

  const handleSizeCellChange = (
    size: SizeSpecRow['size'],
    field: keyof Omit<SizeSpecRow, 'size'>,
    val: number
  ) => {
    setSizeSpecs((prev) => ({
      ...prev,
      [selectedSizeCategory]: prev[selectedSizeCategory].map((row) =>
        row.size === size ? { ...row, [field]: Number.isFinite(val) ? val : 0 } : row
      ),
    }));
  };

  const handleSaveSizeSpecs = () => {
    try {
      localStorage.setItem(SIZE_SPECS_STORAGE_KEY, JSON.stringify(sizeSpecs));
      showGlobalToast({
        type: 'success',
        title: 'Đã lưu Bảng Size Chuẩn 3D!',
        message: 'Thuật toán AI Fit sẽ đối chiếu thông số S/M/L/XL này với vóc dáng khách mua.',
      });
    } catch {
      showGlobalToast({ type: 'error', title: 'Lỗi lưu trình duyệt', message: 'Không thể ghi localStorage.' });
    }
  };

  if (!isAuthenticated || (userRole !== 'store' && userRole !== 'admin')) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] text-slate-900 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <Store size={30} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-950">Kênh Người Bán FitVision</h1>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Vui lòng đăng nhập bằng tài khoản Chủ Shop đã được Admin cấp quyền để quản lý gian hàng, sản phẩm &amp; video trên sàn.
            </p>
          </div>
          <div className="flex flex-col gap-2.5">
            {!isAuthenticated && (
              <>
                <button
                  type="button"
                  onClick={openSignIn}
                  className="w-full py-3 rounded-xl bg-[#14171C] hover:bg-blue-600 text-white text-xs font-bold cursor-pointer transition-colors"
                >
                  Đăng nhập tài khoản Shop
                </button>
                <button
                  type="button"
                  onClick={openOnboarding}
                  className="w-full py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold cursor-pointer transition-colors"
                >
                  Đăng ký Mở Tài Khoản Chủ Shop (KYC &amp; Thuế)
                </button>
              </>
            )}
            <a
              href="/"
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <ArrowLeft size={14} /> Về Trang Chủ Mua Sắm
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-slate-900 flex font-sans">
      {/* Left Fixed Seller Sidebar - Unified Atelier Light Palette */}
      <aside className="w-[260px] bg-white border-r border-slate-200/80 flex flex-col justify-between sticky top-0 h-screen flex-shrink-0">
        <div>
          <div className="p-5 border-b border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#14171C] text-white flex items-center justify-center font-black shadow-xs">
              <Store size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs font-black text-slate-950 truncate">
                  {shop?.shop_name || t('shopPortal.brandFallback')}
                </h2>
                {shop?.is_mall && (
                  <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider">
                    MALL
                  </span>
                )}
              </div>
              <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
                {t('shopPortal.sellerCenter')}
              </p>
            </div>
          </div>

          <nav className="p-3 space-y-1">
            <button
              type="button"
              onClick={() => setActiveTab('OVERVIEW')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'OVERVIEW'
                  ? 'bg-[#14171C] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
              }`}
            >
              <TrendingUp size={15} /> {t('shopPortal.navOverview')}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('PRODUCTS')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'PRODUCTS'
                  ? 'bg-[#14171C] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Package size={15} /> {t('shopPortal.navProducts')}
              </span>
              <span className="text-[10px] font-mono opacity-80">{products.length}/50</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ORDERS')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'ORDERS'
                  ? 'bg-[#14171C] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <ShoppingBag size={15} /> {t('shopPortal.navOrders')}
              </span>
              <span className="text-[10px] font-mono opacity-80">
                {orders.length}
                {pendingReviewsCount > 0 ? ` • ${pendingReviewsCount}💬` : ''}
              </span>
            </button>

            <div className="pt-3 mt-3 border-t border-slate-100 space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t('shopPortal.navAiSection')}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('SIZE_CHART')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'SIZE_CHART'
                    ? 'bg-[#14171C] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                <Ruler size={15} /> {t('shopPortal.navSizeChart')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('SETTINGS')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'SETTINGS'
                    ? 'bg-[#14171C] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Settings size={15} /> {t('shopPortal.navSettings')}
                </span>
                {shop?.operational_mode === 'VACATION' && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[9px] font-black">
                    {t('shopPortal.badgeVacationShort')}
                  </span>
                )}
              </button>
              <Link
                to="/"
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-blue-700 bg-blue-50/70 hover:bg-blue-100 transition-colors"
              >
                <ArrowLeft size={15} /> {t('shopPortal.navBackHome')}
              </Link>
            </div>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100 space-y-2">
          <div className="px-2 py-1.5">
            <p className="text-xs font-bold text-slate-900 truncate">{currentUser?.full_name}</p>
            <p className="text-[10px] text-slate-400 truncate">{currentUser?.email}</p>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="w-full py-2 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut size={13} /> {t('shopPortal.signOut')}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-950">
              {shop?.shop_name ? shop.shop_name : t('shopPortal.brandFallback')}
            </span>
            {authNeedsRelogin ? (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                {t('shopPortal.reloginTitle')}
              </span>
            ) : shop?.is_mall ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-extrabold">
                <BadgeCheck size={12} /> {t('shopStorefront.tierMall')}
              </span>
            ) : shop ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                {t('shopPortal.statusActive')}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadShopData()}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} /> {t('shopPortal.refresh')}
            </button>
            <div className="flex items-center bg-slate-100 rounded-full p-0.5 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setLocale('vi')}
                className={`px-2 py-0.5 rounded-full cursor-pointer ${
                  locale === 'vi' ? 'bg-white shadow-2xs text-slate-950' : 'text-slate-500'
                }`}
              >
                VI
              </button>
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={`px-2 py-0.5 rounded-full cursor-pointer ${
                  locale === 'en' ? 'bg-white shadow-2xs text-slate-950' : 'text-slate-500'
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </header>

        <main className="p-6 pb-24 space-y-6 max-w-6xl w-full mx-auto">
          {authNeedsRelogin && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <KeyRound size={18} className="text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black text-rose-950">
                    Phiên xác thực Access Token đã hết hạn hoặc bị mất khi chuyển trang
                  </p>
                  <p className="text-[11px] text-rose-800 mt-0.5">
                    Bấm nút bên cạnh để đăng nhập lại nhanh tài khoản <b>{currentUser?.email}</b> trước khi đăng sản phẩm.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={openSignIn}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer flex-shrink-0"
              >
                Đăng nhập lại ngay
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-sm text-slate-500">
              Đang tải dữ liệu gian hàng từ PostgreSQL...
            </div>
          ) : shop && shop.status !== 'APPROVED' ? (
            <div className="space-y-6">
              <div
                className={`rounded-3xl border-2 p-6 space-y-4 ${
                  shop.status === 'REJECTED' || shop.status === 'SUSPENDED'
                    ? 'bg-rose-50/70 border-rose-200'
                    : 'bg-amber-50/70 border-amber-200'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        shop.status === 'REJECTED' || shop.status === 'SUSPENDED'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {shop.status === 'PENDING' ? <Clock size={24} /> : <AlertTriangle size={24} />}
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-800">
                        Trạng thái KYC Shop: {shop.status}
                      </span>
                      <h2 className="text-lg font-black text-slate-950 mt-1.5">
                        {shop.status === 'PENDING'
                          ? 'Hồ sơ KYC & Thuế đang chờ Quản trị viên thẩm định'
                          : shop.status === 'SUSPENDED'
                            ? 'Gian hàng hiện đang bị Tạm đình chỉ hoạt động'
                            : 'Hồ sơ KYC cần chỉnh sửa và nộp lại'}
                      </h2>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Tính năng đăng sản phẩm &amp; xử lý đơn sẽ tự động mở khóa ngay sau khi Admin phê duyệt hồ sơ của bạn.
                      </p>
                      {shop.rejection_reason && (
                        <div className="mt-2.5 px-3.5 py-2.5 rounded-xl bg-white border border-rose-200 text-xs text-rose-800 font-semibold">
                          Lý do từ Admin: {shop.rejection_reason}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-white rounded-2xl border border-slate-200 p-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-400">Loại hình &amp; Đại diện</div>
                    <div className="font-bold text-slate-900 mt-1">{shop.entity_type || 'INDIVIDUAL'}</div>
                    <div className="text-slate-600">CCCD: •••• •••• {shop.national_id_last4 || 'Chưa cập nhật'}</div>
                    <div className="text-slate-600">Tài liệu đã nộp: {kycDocuments.length} tệp</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-400">Thông tin Thuế &amp; GPKD</div>
                    <div className="font-mono font-bold text-slate-900 mt-1">
                      MST: {shop.tax_code || 'Dùng CCCD tạm thời'}
                    </div>
                    <div className="text-slate-600">Trạng thái thuế: {shop.tax_status || 'PENDING_REVIEW'}</div>
                    {shop.business_license_no && <div className="text-slate-600">GPKD: {shop.business_license_no}</div>}
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-400">Tài khoản Ngân hàng</div>
                    {bankAccount ? (
                      <>
                        <div className="font-bold text-slate-900 mt-1">{bankAccount.bank_name}</div>
                        <div className="font-mono text-slate-700">{bankAccount.account_number}</div>
                        <div className="text-slate-600">
                          {bankAccount.account_holder_name} ({bankAccount.verification_status})
                        </div>
                      </>
                    ) : (
                      <div className="text-slate-400 mt-1">Chưa liên kết ngân hàng</div>
                    )}
                  </div>
                </div>
              </div>

              {shop.status !== 'SUSPENDED' && (
                <form
                  onSubmit={handleResubmitKyc}
                  className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-2xs"
                >
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-black text-slate-950 flex items-center gap-1.5">
                      <ShieldCheck size={16} className="text-blue-600" /> Bổ Sung / Cập Nhật Lại Hồ Sơ KYC &amp; Thuế
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Cập nhật các thông tin còn thiếu hoặc sai sót để gửi lại cho Quản trị viên duyệt.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        <Building2 size={11} className="inline mr-1" /> Loại hình kinh doanh
                      </label>
                      <select
                        value={resubmitEntityType}
                        onChange={(e) => setResubmitEntityType(e.target.value as ShopEntityType)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                      >
                        <option value="INDIVIDUAL">Cá nhân / Thợ may</option>
                        <option value="HOUSEHOLD">Hộ kinh doanh</option>
                        <option value="ENTERPRISE">Doanh nghiệp (Mall)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Mã số thuế (10 / 12 / -888)</label>
                      <input
                        value={resubmitTaxCode}
                        onChange={(e) => setResubmitTaxCode(e.target.value)}
                        placeholder="0108928374 hoặc 0108928374-888"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Cập nhật Số CCCD (12 số)</label>
                      <input
                        value={resubmitNationalId}
                        onChange={(e) => setResubmitNationalId(e.target.value)}
                        placeholder="Để trống nếu giữ CCCD cũ"
                        maxLength={12}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Số GPKD (Hộ KD / DN)</label>
                      <input
                        value={resubmitLicenseNo}
                        onChange={(e) => setResubmitLicenseNo(e.target.value)}
                        placeholder="VD: 0108928374"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        <CreditCard size={11} className="inline mr-1" /> Ngân hàng &amp; STK
                      </label>
                      <div className="flex gap-1.5">
                        <select
                          value={resubmitBankCode}
                          onChange={(e) => {
                            const code = e.target.value;
                            setResubmitBankCode(code);
                            setResubmitBankName(VIETNAM_BANKS.find((b) => b.code === code)?.name || code);
                          }}
                          className="w-24 px-2 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                        >
                          {VIETNAM_BANKS.map((b) => (
                            <option key={b.code} value={b.code}>{b.code}</option>
                          ))}
                        </select>
                        <input
                          value={resubmitBankAcc}
                          onChange={(e) => setResubmitBankAcc(e.target.value)}
                          placeholder="Số tài khoản"
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Tên Chủ TK Ngân hàng</label>
                      <input
                        value={resubmitBankHolder}
                        onChange={(e) => setResubmitBankHolder(e.target.value)}
                        placeholder="NGUYEN VAN AN"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs uppercase"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isResubmittingKyc}
                      className="px-5 py-2.5 rounded-xl bg-[#14171C] hover:bg-blue-600 text-white text-xs font-bold cursor-pointer disabled:opacity-60"
                    >
                      {isResubmittingKyc ? 'Đang gửi lại hồ sơ...' : 'Lưu & Gửi Lại Admin Duyệt'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW & EDIT SHOP PROFILE */}
              {activeTab === 'OVERVIEW' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <p className="text-[11px] font-bold uppercase text-slate-400">{t('shopPortal.kpiProducts')}</p>
                      <p className="text-2xl font-black text-slate-950 mt-2 font-mono tabular-nums">{products.length}</p>
                      <p className="text-[11px] text-slate-500 mt-1">{t('shopPortal.kpiProductsSub')}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <p className="text-[11px] font-bold uppercase text-slate-400">{t('shopPortal.kpiOrders')}</p>
                      <p className="text-2xl font-black text-slate-950 mt-2 font-mono tabular-nums">{orders.length}</p>
                      <p className="text-[11px] text-slate-500 mt-1">{t('shopPortal.kpiOrdersSub')}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <p className="text-[11px] font-bold uppercase text-slate-400">{t('shopPortal.kpiRevenue')}</p>
                      <p className="text-2xl font-black text-emerald-700 mt-2 font-mono tabular-nums">{formatCurrency(totalRevenue)}</p>
                      <p className="text-[11px] text-slate-500 mt-1">{t('shopPortal.kpiRevenueSub')}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <p className="text-[11px] font-bold uppercase text-slate-400">{t('shopPortal.kpiReviews')}</p>
                      <p className="text-2xl font-black text-amber-600 mt-2 font-mono tabular-nums">{pendingReviewsCount}</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {t('shopPortal.kpiReviewsTotal').replace('{count}', String(reviews.length))}
                      </p>
                    </div>
                  </div>

                  {/* Quick How-To Flow Card */}
                  <div className="bg-[#14171C] text-white rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                        <Sparkles size={12} /> {t('shopPortal.flowBadge')}
                      </span>
                      <h3 className="text-lg font-black">{t('shopPortal.flowTitle')}</h3>
                      <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                        {t('shopPortal.flowDesc')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('PRODUCTS');
                        setShowAddForm(true);
                      }}
                      className="px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black flex items-center gap-1.5 flex-shrink-0 cursor-pointer transition-colors"
                    >
                      <Plus size={15} /> {t('shopPortal.flowCta')}
                    </button>
                  </div>

                  {/* Shop Summary & Quick Link to Settings Tab */}
                  {shop && (
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-900 overflow-hidden shrink-0">
                            {shop.logo_url ? (
                              <img src={shop.logo_url} alt={shop.shop_name} className="w-full h-full object-cover" />
                            ) : (
                              shop.shop_name.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-black text-slate-950 truncate">{shop.shop_name}</h3>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  shop.operational_mode === 'VACATION'
                                    ? 'bg-amber-100 text-amber-900'
                                    : 'bg-emerald-100 text-emerald-900'
                                }`}
                              >
                                {shop.operational_mode === 'VACATION'
                                  ? t('shopPortal.statusVacation')
                                  : t('shopPortal.statusActive')}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 truncate mt-0.5">
                              {shop.tagline || t('shopPortal.noTagline')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap shrink-0">
                          <Link
                            to={`/stores/${encodeURIComponent(shop.brand_slug || shop.shop_name)}`}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3.5 py-2 rounded-xl transition-colors"
                          >
                            <ExternalLink size={13} /> {t('shopPortal.viewStorefront')}
                          </Link>
                          <button
                            type="button"
                            onClick={() => setActiveTab('SETTINGS')}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#14171C] hover:bg-slate-800 px-4 py-2 rounded-xl cursor-pointer transition-colors"
                          >
                            <Settings size={13} /> {t('shopPortal.openSettings')}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                          <p className="text-[11px] text-slate-500">{t('shopPortal.summaryContact')}</p>
                          <p className="font-bold text-slate-900 mt-1 font-mono">{shop.phone_number}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {t('shopPortal.summarySla')}: {shop.prep_time_days || '1–2 ngày làm việc'}
                          </p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                          <p className="text-[11px] text-slate-500">{t('shopPortal.summaryTax')}</p>
                          <p className="font-bold text-slate-900 mt-1">
                            {shop.entity_type || 'INDIVIDUAL'} • <span className="font-mono">{shop.tax_code || 'CCCD'}</span>
                          </p>
                          <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">{shop.tax_status}</p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                          <p className="text-[11px] text-slate-500">{t('shopPortal.summaryBank')}</p>
                          {bankAccount ? (
                            <>
                              <p className="font-bold text-slate-900 mt-1 truncate">{bankAccount.bank_name}</p>
                              <p className="text-[11px] font-mono text-slate-600 mt-0.5">
                                {bankAccount.account_number} ({bankAccount.verification_status})
                              </p>
                            </>
                          ) : (
                            <p className="text-[11px] text-amber-700 font-semibold mt-1">
                              {t('shopPortal.summaryBankMissing')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: PRODUCTS + VIDEO + ANTI-SPAM */}
              {activeTab === 'PRODUCTS' && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-black text-slate-950">{t('shopPortal.productsTitle')}</h2>
                      <p className="text-xs text-slate-500">{t('shopPortal.productsSubtitle')}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(!showAddForm)}
                      className="px-4 py-2.5 rounded-xl bg-[#14171C] hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors self-start"
                    >
                      {showAddForm ? <X size={14} /> : <Plus size={14} />}
                      {showAddForm ? t('shopPortal.closeFormBtn') : t('shopPortal.addProductBtn')}
                    </button>
                  </div>

                  {showAddForm && (
                    <form
                      noValidate
                      onSubmit={handleCreateProduct}
                      className="bg-white rounded-3xl border-2 border-slate-300 p-6 space-y-5 shadow-md"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                        <h3 className="text-sm font-black text-slate-950">{t('shopPortal.addFormTitle')}</h3>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {t('shopPortal.autoBrandLabel')} <b className="text-slate-950">{shop?.shop_name}</b>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <label className="text-[11px] font-bold text-slate-800 block mb-1">
                            {t('shopPortal.fieldProductName')}
                          </label>
                          <input
                            ref={nameInputRef}
                            value={newName}
                            onChange={(e) => {
                              setNewName(e.target.value);
                              if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
                            }}
                            placeholder={t('shopPortal.fieldProductNamePlaceholder')}
                            className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs font-medium text-slate-950 placeholder:text-slate-400 outline-none focus:ring-2 ${
                              fieldErrors.name
                                ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-600'
                                : 'border-slate-400 focus:border-slate-950 focus:ring-slate-900/10'
                            }`}
                          />
                          {fieldErrors.name && (
                            <p className="text-[11px] font-bold text-rose-600 mt-1">{fieldErrors.name}</p>
                          )}
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-800 block mb-1">
                            {t('shopPortal.fieldCategory')}
                          </label>
                          <select
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value as typeof newCategory)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-400 bg-white text-xs font-medium text-slate-950 outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-900/10"
                          >
                            <option value="shirt">{t('shopPortal.sizeCatShirt')}</option>
                            <option value="polo">{t('shopPortal.sizeCatPolo')}</option>
                            <option value="pants">{t('shopPortal.sizeCatPants')}</option>
                            <option value="dress">{t('shopPortal.sizeCatDress')}</option>
                            <option value="tailored">{t('shopPortal.sizeCatTailored')}</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="text-[11px] font-bold text-slate-800 block mb-1">
                            {t('shopPortal.fieldGender')}
                          </label>
                          <select
                            value={newGender}
                            onChange={(e) => setNewGender(e.target.value as typeof newGender)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-400 bg-white text-xs font-medium text-slate-950 outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-900/10"
                          >
                            <option value="male">{t('shopPortal.genderMale')}</option>
                            <option value="female">{t('shopPortal.genderFemale')}</option>
                            <option value="unisex">{t('shopPortal.genderUnisex')}</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-800 block mb-1">
                            {t('shopPortal.fieldBasePrice')}
                          </label>
                          <input
                            ref={priceInputRef}
                            type="number"
                            min={1000}
                            placeholder="590000"
                            value={newPrice}
                            onChange={(e) => {
                              setNewPrice(e.target.value);
                              if (fieldErrors.price) setFieldErrors((prev) => ({ ...prev, price: undefined }));
                            }}
                            className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs font-mono font-semibold text-slate-950 placeholder:text-slate-400 placeholder:font-sans placeholder:font-normal outline-none focus:ring-2 ${
                              fieldErrors.price
                                ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-600'
                                : 'border-slate-400 focus:border-slate-950 focus:ring-slate-900/10'
                            }`}
                          />
                          {fieldErrors.price && (
                            <p className="text-[11px] font-bold text-rose-600 mt-1">{fieldErrors.price}</p>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <label className="text-[11px] font-bold text-slate-800">
                              {discountMode === 'discount_amount'
                                ? t('shopPortal.fieldDiscountAmount')
                                : t('shopPortal.fieldFinalPrice')}
                            </label>
                            <div className="inline-flex rounded-lg bg-slate-200 p-0.5 text-[9px] font-bold">
                              <button
                                type="button"
                                onClick={() => setDiscountMode('discount_amount')}
                                className={`px-1.5 py-0.5 rounded-md cursor-pointer ${
                                  discountMode === 'discount_amount' ? 'bg-white text-slate-950 shadow-2xs' : 'text-slate-600'
                                }`}
                              >
                                {t('shopPortal.discountModeOff')}
                              </button>
                              <button
                                type="button"
                                onClick={() => setDiscountMode('final_price')}
                                className={`px-1.5 py-0.5 rounded-md cursor-pointer ${
                                  discountMode === 'final_price' ? 'bg-white text-slate-950 shadow-2xs' : 'text-slate-600'
                                }`}
                              >
                                Giá bán cuối
                              </button>
                            </div>
                          </div>
                          <input
                            ref={salePriceInputRef}
                            type="number"
                            min={1000}
                            placeholder={
                              discountMode === 'discount_amount'
                                ? 'VD: 5000 (trừ 5k vào giá gốc)'
                                : 'VD: 45000 (giá bán cuối)'
                            }
                            value={newSalePrice}
                            onChange={(e) => {
                              setNewSalePrice(e.target.value);
                              if (fieldErrors.salePrice) setFieldErrors((prev) => ({ ...prev, salePrice: undefined }));
                            }}
                            className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs font-mono font-semibold text-slate-950 placeholder:text-slate-400 placeholder:font-sans placeholder:font-normal outline-none focus:ring-2 ${
                              fieldErrors.salePrice
                                ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-600'
                                : 'border-slate-400 focus:border-slate-950 focus:ring-slate-900/10'
                            }`}
                          />
                          {Number(newPrice) >= 1000 && Number(newSalePrice) > 0 && (() => {
                            const orig = Number(newPrice);
                            const promoVal = Number(newSalePrice);
                            const finalVnd = discountMode === 'discount_amount' ? orig - promoVal : promoVal;
                            const discountVnd = orig - finalVnd;
                            const pct = Math.round((discountVnd / orig) * 100);
                            if (finalVnd >= 1000 && finalVnd < orig) {
                              return (
                                <p className="text-[11px] mt-1 font-medium text-emerald-700">
                                  Hiển thị trang chủ:{' '}
                                  <span className="line-through text-slate-400 font-mono">{orig.toLocaleString('vi-VN')}₫</span>{' '}
                                  ➔ <b className="font-mono text-rose-600">{finalVnd.toLocaleString('vi-VN')}₫</b>{' '}
                                  <span className="text-[10px]">(-{pct}% • giảm {discountVnd.toLocaleString('vi-VN')}₫)</span>
                                </p>
                              );
                            }
                            return null;
                          })()}
                          {fieldErrors.salePrice && (
                            <p className="text-[11px] font-bold text-rose-600 mt-1">{fieldErrors.salePrice}</p>
                          )}
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-800 block mb-1">Độ Co Giãn</label>
                          <select
                            value={newStretch}
                            onChange={(e) => setNewStretch(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-400 bg-white text-xs font-medium text-slate-950 outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-900/10"
                          >
                            <option value="Không co giãn">Không co giãn</option>
                            <option value="Co giãn nhẹ (2-3%)">Co giãn nhẹ (2-3%)</option>
                            <option value="Co giãn tốt (4-way)">Co giãn tốt (4-way)</option>
                          </select>
                        </div>
                      </div>

                      <label className="flex items-center gap-2.5 p-3 rounded-xl border border-amber-300 bg-amber-50/70 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newIsBespoke || newCategory === 'tailored'}
                          onChange={(e) => setNewIsBespoke(e.target.checked)}
                          className="w-4 h-4 accent-amber-700 cursor-pointer"
                        />
                        <div className="text-xs">
                          <span className="font-bold text-amber-950 block">
                            Cho phép May Đo Bespoke (May theo 13 số đo 3D cá nhân)
                          </span>
                          <span className="text-[11px] text-amber-800">
                            Khách có thể đặt may đo riêng 1-1 kèm hồ sơ 13 số đo 3D gửi về Xưởng May của bạn.
                          </span>
                        </div>
                      </label>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] font-bold text-slate-800 block mb-1">Chất Liệu Vải</label>
                          <input
                            value={newFabric}
                            onChange={(e) => setNewFabric(e.target.value)}
                            placeholder="VD: 100% Cotton Bamboo"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-400 bg-white text-xs font-medium text-slate-950 placeholder:text-slate-400 outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-900/10"
                          />
                        </div>

                        {/* All Garment Sizes Selection (XS -> XXL) */}
                        <div>
                          <label className="text-[11px] font-bold text-slate-800 block mb-1">
                            Kích Cỡ Mở Bán (Chọn nhiều size) *
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {ALL_GARMENT_SIZES.map((sz) => {
                              const active = selectedSizes.includes(sz);
                              return (
                                <button
                                  key={sz}
                                  type="button"
                                  onClick={() => handleToggleSizeOption(sz)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border cursor-pointer transition-all ${
                                    active
                                      ? 'bg-[#14171C] text-white border-[#14171C] shadow-2xs'
                                      : 'bg-white text-slate-600 border-slate-400 hover:border-slate-900'
                                  }`}
                                >
                                  {sz}
                                </button>
                              );
                            })}
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selectedSizes.map((sz) => (
                              <label key={sz} className="inline-flex items-center gap-1 text-[10px] text-slate-600 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-300">
                                <span className="font-bold text-slate-800">{sz}:</span>
                                <input
                                  type="number"
                                  min={1}
                                  max={999}
                                  value={sizeStockMap[sz] ?? 20}
                                  onChange={(e) =>
                                    setSizeStockMap((prev) => ({
                                      ...prev,
                                      [sz]: Math.max(1, Number(e.target.value) || 1),
                                    }))
                                  }
                                  className="w-11 bg-transparent font-mono font-semibold text-slate-950 outline-none"
                                />
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Multi-Color Variants + Per-Color Image Upload & Instant Clickable Thumbnail Preview */}
                      <div className="p-4 rounded-2xl bg-slate-100/70 border border-slate-300 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <label className="text-[11px] font-bold text-slate-950 flex items-center gap-1.5">
                              <Palette size={14} className="text-blue-600" />
                              Màu Sắc &amp; Ảnh Theo Từng Màu ({colorVariants.length}/6 màu)
                            </label>
                            <p className="text-[10px] text-slate-600 mt-0.5">
                              Chọn màu từ bảng màu sẽ tự đồng bộ tên màu. Bấm trực tiếp vào <b>ảnh mẫu</b> hoặc nút <b>Ảnh</b> để tải ảnh cho từng màu.
                            </p>
                          </div>
                          {colorVariants.length < 6 && (
                            <button
                              type="button"
                              onClick={() =>
                                setColorVariants((prev) => [
                                  ...prev,
                                  {
                                    colorName: FASHION_COLOR_PALETTE[(prev.length * 3) % FASHION_COLOR_PALETTE.length].name,
                                    colorHex: FASHION_COLOR_PALETTE[(prev.length * 3) % FASHION_COLOR_PALETTE.length].hex,
                                    imageUrl: prev[0]?.imageUrl || DEFAULT_SAMPLE_IMG,
                                  },
                                ])
                              }
                              className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <Plus size={12} /> Thêm màu khác
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          {colorVariants.map((cv, idx) => (
                            <div
                              key={idx}
                              className="bg-white rounded-2xl border border-slate-300 p-3 flex gap-3 items-start shadow-xs"
                            >
                              {/* Clickable Instant Thumbnail Preview */}
                              <label
                                className="relative flex-shrink-0 cursor-pointer group"
                                title="Bấm vào ảnh này để chọn ảnh sản phẩm từ máy"
                              >
                                <img
                                  src={cv.imageUrl || DEFAULT_SAMPLE_IMG}
                                  alt={cv.colorName}
                                  className="w-20 h-24 rounded-xl object-cover border-2 border-slate-300 group-hover:border-blue-600 bg-slate-100 transition-colors"
                                />
                                <span className="absolute inset-x-1 bottom-1 py-0.5 rounded-md bg-black/70 text-white text-[9px] font-bold text-center opacity-85 group-hover:opacity-100 transition-opacity">
                                  Đổi ảnh
                                </span>
                                {idx === 0 && (
                                  <span className="absolute -top-1.5 -left-1.5 px-1.5 py-0.5 rounded bg-[#14171C] text-white text-[9px] font-bold shadow-xs">
                                    Ảnh chính
                                  </span>
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleVariantImageUpload(idx, e)}
                                  className="hidden"
                                />
                              </label>

                              <div className="flex-1 min-w-0 space-y-2">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    value={cv.colorHex}
                                    onChange={(e) => {
                                      const nextHex = e.target.value;
                                      const autoName = detectNearestColorName(nextHex);
                                      setColorVariants((prev) =>
                                        prev.map((item, i) =>
                                          i === idx ? { ...item, colorHex: nextHex, colorName: autoName } : item
                                        )
                                      );
                                    }}
                                    className="w-8 h-8 rounded-lg border border-slate-400 cursor-pointer flex-shrink-0"
                                    title="Bấm để chọn màu — Tự nhận diện tên màu"
                                  />
                                  <input
                                    value={cv.colorName}
                                    onChange={(e) => {
                                      const nextName = e.target.value;
                                      setColorVariants((prev) =>
                                        prev.map((item, i) => (i === idx ? { ...item, colorName: nextName } : item))
                                      );
                                    }}
                                    placeholder="Tên màu (VD: Xanh Navy)"
                                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-400 bg-white text-xs font-bold text-slate-950 outline-none focus:border-slate-950"
                                  />
                                  {colorVariants.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setColorVariants((prev) => prev.filter((_, i) => i !== idx))
                                      }
                                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 cursor-pointer"
                                      title="Xóa màu này"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  )}
                                </div>

                                {/* Quick color swatches */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {FASHION_COLOR_PALETTE.slice(0, 7).map((preset) => (
                                    <button
                                      key={preset.hex}
                                      type="button"
                                      onClick={() =>
                                        setColorVariants((prev) =>
                                          prev.map((item, i) =>
                                            i === idx ? { ...item, colorHex: preset.hex, colorName: preset.name } : item
                                          )
                                        )
                                      }
                                      className="w-4 h-4 rounded-full border border-slate-400 cursor-pointer hover:scale-110 transition-transform"
                                      style={{ backgroundColor: preset.hex }}
                                      title={preset.name}
                                    />
                                  ))}
                                </div>

                                <div className="flex gap-1.5">
                                  <input
                                    value={cv.imageUrl.startsWith('data:image') ? '✓ Đã chọn ảnh từ máy (bấm ảnh trái để đổi)' : cv.imageUrl}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setColorVariants((prev) =>
                                        prev.map((item, i) => (i === idx ? { ...item, imageUrl: val } : item))
                                      );
                                    }}
                                    placeholder="Dán link ảnh URL..."
                                    className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-slate-400 bg-white text-[11px] text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-950"
                                  />
                                  <label className="px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-900 border border-slate-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer flex-shrink-0">
                                    <Upload size={12} /> Ảnh
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => handleVariantImageUpload(idx, e)}
                                      className="hidden"
                                    />
                                  </label>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Video URL or Local MP4/WebM Upload + Live Preview */}
                      <div className="p-4 rounded-2xl bg-slate-100/70 border border-slate-300 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
                            <Video size={14} className="text-blue-600" />
                            Video Giới Thiệu / Thử Đồ Thực Tế (Tùy chọn • MP4 / WebM / YouTube)
                          </label>
                          {newVideoUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setNewVideoUrl('');
                                setNewVideoFileName('');
                              }}
                              className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                            >
                              Gỡ video
                            </button>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            value={newVideoUrl.startsWith('data:video') ? `✓ Video tải lên: ${newVideoFileName}` : newVideoUrl}
                            onChange={(e) => {
                              setNewVideoUrl(e.target.value);
                              setNewVideoFileName('');
                            }}
                            placeholder="Dán link video (.mp4 / YouTube) hoặc bấm nút Upload MP4 bên phải (tối đa 12MB)..."
                            className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-400 bg-white text-xs text-slate-950 placeholder:text-slate-400 outline-none focus:border-slate-950"
                          />
                          <label className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer flex-shrink-0">
                            <Upload size={13} /> Chọn File Video (&le;12MB)
                            <input
                              type="file"
                              accept="video/mp4,video/webm"
                              onChange={handleVideoFileUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                        {newVideoUrl && !newVideoUrl.includes('youtube.com') && !newVideoUrl.includes('youtu.be') && (
                          <video
                            src={newVideoUrl}
                            controls
                            playsInline
                            className="w-56 h-36 rounded-xl border border-slate-300 bg-black object-cover mt-2"
                          />
                        )}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                          <label className="text-[11px] font-bold text-slate-800">
                            Mô Tả Chi Tiết Sản Phẩm
                          </label>
                          <button
                            type="button"
                            disabled={isGeneratingDesc}
                            onClick={() => void handleSuggestDescription()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-300 text-[11px] font-bold cursor-pointer transition-colors disabled:opacity-60"
                          >
                            <Wand2 size={12} />
                            {isGeneratingDesc ? 'AI đang phân tích ảnh...' : '✨ AI Gợi Ý Mô Tả Từ Ảnh & Thông Số'}
                          </button>
                        </div>
                        <textarea
                          rows={4}
                          value={newDescription}
                          onChange={(e) => setNewDescription(e.target.value)}
                          placeholder="Bấm nút 'AI Gợi Ý Mô Tả Từ Ảnh' bên trên để tự động viết mô tả chuẩn SEO sàn TMĐT hoặc tự gõ tại đây..."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-400 bg-white text-xs text-slate-950 placeholder:text-slate-400 outline-none leading-relaxed focus:border-slate-950 focus:ring-2 focus:ring-slate-900/10"
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddForm(false)}
                          className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold cursor-pointer"
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          disabled={isCreating}
                          className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 size={14} /> {isCreating ? t('shopPortal.publishingBtn') : t('shopPortal.publishBtn')}
                        </button>
                      </div>
                    </form>
                  )}

                  {products.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-500">
                      {t('shopPortal.emptyProducts')}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {products.map((p) => (
                        <div
                          key={p.id}
                          className={`bg-white rounded-2xl border p-4 flex flex-col justify-between gap-3 transition-opacity ${
                            p.is_hidden ? 'border-slate-200 opacity-60' : 'border-slate-200'
                          }`}
                        >
                          <div className="flex gap-3">
                            <div className="relative flex-shrink-0">
                              <img
                                src={p.image_url}
                                alt={p.name}
                                className="w-20 h-24 rounded-xl object-cover border border-slate-100"
                              />
                              {p.video_url && (
                                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-white text-[9px] font-bold flex items-center gap-0.5">
                                  <Video size={9} /> Video
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 mb-1">
                                {p.is_mall && (
                                  <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-black uppercase">
                                    MALL
                                  </span>
                                )}
                                <span className="text-[10px] font-bold uppercase text-slate-400">{p.category}</span>
                              </div>
                              <h4 className="text-xs font-bold text-slate-950 line-clamp-2">{p.name}</h4>
                              <p className="text-xs font-mono font-black text-emerald-700 mt-1.5">
                                {formatCurrency(p.sale_price ?? p.price)}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5 font-mono tabular-nums">
                                ★ {(p.reviews_count || 0) > 0 ? Number(p.rating ?? 0).toFixed(1) : '0.0'} ({p.reviews_count || 0} {t('shopPortal.reviewsCountUnit')})
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
                            <button
                              type="button"
                              onClick={() => void handleToggleHide(p)}
                              className="flex-1 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-slate-50 cursor-pointer"
                            >
                              {p.is_hidden ? (
                                <>
                                  <Eye size={12} /> {t('shopPortal.productShow')}
                                </>
                              ) : (
                                <>
                                  <EyeOff size={12} /> {t('shopPortal.productHide')}
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteProduct(p)}
                              className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 text-[11px] font-bold flex items-center gap-1 hover:bg-rose-50 cursor-pointer"
                            >
                              <Trash2 size={12} /> {t('shopPortal.productDelete')}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CUSTOMER ORDERS & REVIEWS/REPLIES */}
              {activeTab === 'ORDERS' && (
                <div className="space-y-8">
                  {/* Orders Section */}
                  <div className="space-y-3">
                    <div>
                      <h2 className="text-lg font-black text-slate-950">{t('shopPortal.ordersTitle')}</h2>
                      <p className="text-xs text-slate-500">{t('shopPortal.ordersSubtitle')}</p>
                    </div>
                    {orders.length === 0 ? (
                      <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center text-xs text-slate-500">
                        {t('shopPortal.emptyOrders')}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {orders.map((order) => (
                          <div key={order.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <span className="font-mono text-xs font-black text-slate-950">
                                  #{order.id}
                                </span>
                                <span className="ml-2 text-xs font-bold text-slate-700">
                                  {order.recipient?.full_name || order.customer_name}
                                </span>
                                {order.recipient?.phone && (
                                  <span className="ml-2 text-xs font-mono text-blue-700">{order.recipient.phone}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <select
                                  value={order.status}
                                  onChange={(e) =>
                                    void handleUpdateOrderStatus(order.id, e.target.value as Order['status'])
                                  }
                                  aria-label={`Order ${order.id}`}
                                  className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200 cursor-pointer"
                                >
                                  <option value="pending">{t('shopPortal.orderStatusPending')}</option>
                                  <option value="confirmed">{t('shopPortal.orderStatusConfirmed')}</option>
                                  <option value="tailoring">{t('shopPortal.orderStatusTailoring')}</option>
                                  <option value="shipping">{t('shopPortal.orderStatusShipping')}</option>
                                  <option value="completed">{t('shopPortal.orderStatusCompleted')}</option>
                                  <option value="cancelled">{t('shopPortal.orderStatusCancelled')}</option>
                                </select>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  order.payment_status === 'paid'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  {order.payment_status === 'paid' ? t('shopPortal.paidBadge') : t('shopPortal.unpaidBadge')}
                                </span>
                                <span className="text-xs font-mono font-black text-emerald-700">
                                  {formatCurrency(order.total_amount)}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-slate-500">
                              {t('shopPortal.shippingAddressLabel')} {order.recipient?.address}
                              {order.recipient?.city ? `, ${order.recipient.city}` : ''}
                            </p>
                            {order.recipient?.note && (
                              <p className="text-[11px] text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg">
                                {t('shopPortal.customerNoteLabel')} {order.recipient.note}
                              </p>
                            )}
                            {order.measurement_snapshot && (
                              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 space-y-1.5">
                                <div className="flex items-center justify-between text-[11px] font-black text-blue-900 uppercase">
                                  <span>📏 {t('shopPortal.attached3dMeasurements')}</span>
                                  <span className="font-mono font-semibold text-blue-700">
                                    {order.measurement_snapshot.stature_cm}cm · {order.measurement_snapshot.weight_kg}kg
                                  </span>
                                </div>
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-[11px] font-mono text-slate-800">
                                  <span>{t('shopPortal.chestShort')}: <b>{order.measurement_snapshot.chest_circ_cm}</b></span>
                                  <span>{t('shopPortal.waistShort')}: <b>{order.measurement_snapshot.waist_circ_cm}</b></span>
                                  <span>{t('shopPortal.hipShort')}: <b>{order.measurement_snapshot.hip_circ_cm}</b></span>
                                  {order.measurement_snapshot.shoulder_breadth_cm != null && (
                                    <span>{t('shopPortal.shoulderShort')}: <b>{order.measurement_snapshot.shoulder_breadth_cm}</b></span>
                                  )}
                                  {order.measurement_snapshot.arm_length_cm != null && (
                                    <span>{t('shopPortal.armShort')}: <b>{order.measurement_snapshot.arm_length_cm}</b></span>
                                  )}
                                  {order.measurement_snapshot.inseam_cm != null && (
                                    <span>{t('shopPortal.inseamShort')}: <b>{order.measurement_snapshot.inseam_cm}</b></span>
                                  )}
                                </div>
                                <div className="pt-2 border-t border-blue-200/70 flex justify-end">
                                  <Link
                                    to={`/tailor?orderId=${encodeURIComponent(order.id)}`}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#14171C] hover:bg-blue-700 text-white text-[11px] font-extrabold transition-colors"
                                  >
                                    <Scissors size={12} />
                                    <span>{t('shopPortal.openTailor3d')}</span>
                                  </Link>
                                </div>
                              </div>
                            )}
                            {!order.measurement_snapshot && order.has_bespoke_items && (
                              <div className="pt-1 flex justify-end">
                                <Link
                                  to={`/tailor?orderId=${encodeURIComponent(order.id)}`}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-[#14171C] text-[11px] font-extrabold transition-colors"
                                >
                                  <Scissors size={12} />
                                  <span>{t('shopPortal.openTailor3d')}</span>
                                </Link>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Customer Reviews & Shop Reply Section */}
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-base font-black text-slate-950 flex items-center gap-2">
                        <MessageSquare size={17} className="text-blue-600" />
                        {t('shopPortal.reviewsTitle')} ({reviews.length})
                      </h3>
                      <p className="text-xs text-slate-500">{t('shopPortal.ordersSubtitle')}</p>
                    </div>
                    {reviews.length === 0 ? (
                      <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center text-xs text-slate-500">
                        {t('shopPortal.emptyReviews')}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {reviews.map((rev) => (
                          <div key={rev.id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-slate-950">{rev.user_name}</span>
                                <span className="flex items-center gap-0.5 text-amber-500 text-xs font-bold">
                                  <Star size={12} fill="currentColor" /> {rev.rating}.0
                                </span>
                                {rev.product_name && (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                    {rev.product_name}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400">
                                {new Date(rev.created_at).toLocaleString('vi-VN')}
                              </span>
                            </div>

                            <p className="text-xs text-slate-700">{rev.comment}</p>

                            {rev.shop_reply ? (
                              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-slate-800">
                                <span className="font-bold text-blue-700">{t('shopPortal.shopReplyLabel')} </span>
                                {rev.shop_reply}
                              </div>
                            ) : replyingReviewId === rev.id ? (
                              <div className="space-y-2 pt-1">
                                <div className="flex gap-2">
                                  <input
                                    value={replyDraft}
                                    onChange={(e) => setReplyDraft(e.target.value)}
                                    placeholder={t('shopPortal.replyPlaceholder')}
                                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-slate-900"
                                  />
                                  <button
                                    type="button"
                                    disabled={isSendingReply}
                                    onClick={() => void handleSendReply(rev.id)}
                                    className="px-3.5 py-2 rounded-xl bg-[#14171C] hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    <Send size={12} /> {t('shopPortal.replySend')}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReplyingReviewId(null);
                                      setReplyDraft('');
                                    }}
                                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold cursor-pointer"
                                  >
                                    {t('shopPortal.replyCancel')}
                                  </button>
                                </div>
                                {shop?.quick_reply_template && (
                                  <button
                                    type="button"
                                    onClick={() => setReplyDraft(shop.quick_reply_template || '')}
                                    className="text-[11px] font-bold text-amber-700 hover:text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <Sparkles size={11} /> {t('shopPortal.insertQuickReply')}
                                  </button>
                                )}
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setReplyingReviewId(rev.id);
                                  setReplyDraft('');
                                }}
                                className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                              >
                                {t('shopPortal.replyAction')}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: BUILT-IN LIGHT ATELIER 3D SIZE SPEC MATRIX (NO EXTERNAL REDIRECTS) */}
              {activeTab === 'SIZE_CHART' && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-black text-slate-950">{t('shopPortal.sizeChartTitle')}</h2>
                      <p className="text-xs text-slate-500 mt-0.5">{t('shopPortal.sizeChartSubtitle')}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveSizeSpecs}
                      className="px-4 py-2.5 rounded-xl bg-[#14171C] hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start"
                    >
                      <Save size={14} /> {t('shopPortal.saveSizeChart')}
                    </button>
                  </div>

                  {/* Explanation Banner */}
                  <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 text-xs text-slate-700 leading-relaxed">
                    <b className="text-blue-900">{t('shopPortal.sizeExplainTitle')}</b>{' '}
                    {t('shopPortal.sizeExplainDesc')}
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-2xs">
                    <div className="flex flex-wrap items-center gap-2">
                      {(
                        [
                          { id: 'shirt', label: t('shopPortal.sizeCatShirt') },
                          { id: 'polo', label: t('shopPortal.sizeCatPolo') },
                          { id: 'pants', label: t('shopPortal.sizeCatPants') },
                          { id: 'dress', label: t('shopPortal.sizeCatDress') },
                        ] as { id: GarmentCategoryKey; label: string }[]
                      ).map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedSizeCategory(cat.id)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                            selectedSizeCategory === cat.id
                              ? 'bg-[#14171C] text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                            <th className="py-3 px-3">{t('shopPortal.colSize')}</th>
                            {selectedSizeCategory !== 'pants' && (
                              <>
                                <th className="py-3 px-3">{t('shopPortal.colChestMin')}</th>
                                <th className="py-3 px-3">{t('shopPortal.colChestMax')}</th>
                                <th className="py-3 px-3">{t('shopPortal.colShoulder')}</th>
                              </>
                            )}
                            <th className="py-3 px-3">{t('shopPortal.colWaistMin')}</th>
                            <th className="py-3 px-3">{t('shopPortal.colWaistMax')}</th>
                            <th className="py-3 px-3">{t('shopPortal.colHipMax')}</th>
                            <th className="py-3 px-3">{t('shopPortal.colLength')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {sizeSpecs[selectedSizeCategory].map((row) => (
                            <tr key={row.size} className="hover:bg-slate-50/70">
                              <td className="py-2.5 px-3 font-black text-slate-950">{row.size}</td>
                              {selectedSizeCategory !== 'pants' && (
                                <>
                                  <td className="py-2 px-3">
                                    <input
                                      type="number"
                                      value={row.chest_min}
                                      onChange={(e) => handleSizeCellChange(row.size, 'chest_min', Number(e.target.value))}
                                      className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono text-xs"
                                    />
                                  </td>
                                  <td className="py-2 px-3">
                                    <input
                                      type="number"
                                      value={row.chest_max}
                                      onChange={(e) => handleSizeCellChange(row.size, 'chest_max', Number(e.target.value))}
                                      className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono text-xs"
                                    />
                                  </td>
                                  <td className="py-2 px-3">
                                    <input
                                      type="number"
                                      value={row.shoulder}
                                      onChange={(e) => handleSizeCellChange(row.size, 'shoulder', Number(e.target.value))}
                                      className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono text-xs"
                                    />
                                  </td>
                                </>
                              )}
                              <td className="py-2 px-3">
                                <input
                                  type="number"
                                  value={row.waist_min}
                                  onChange={(e) => handleSizeCellChange(row.size, 'waist_min', Number(e.target.value))}
                                  className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono text-xs"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="number"
                                  value={row.waist_max}
                                  onChange={(e) => handleSizeCellChange(row.size, 'waist_max', Number(e.target.value))}
                                  className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono text-xs"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="number"
                                  value={row.hip_max}
                                  onChange={(e) => handleSizeCellChange(row.size, 'hip_max', Number(e.target.value))}
                                  className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono text-xs"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="number"
                                  value={row.length}
                                  onChange={(e) => handleSizeCellChange(row.size, 'length', Number(e.target.value))}
                                  className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono text-xs"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: SHOP SETTINGS (CHUẨN SHOPEE SELLER CENTRE) */}
              {activeTab === 'SETTINGS' && shop && (
                <ShopSettingsTab
                  shop={shop}
                  bankAccount={bankAccount}
                  reputation={reputation}
                  userEmail={currentUser?.email}
                  onShopUpdated={(updated) => setShop(updated)}
                  onBankUpdated={(updated) => setBankAccount(updated)}
                  onReloadDashboard={loadShopData}
                  onSignedOutAll={async () => {
                    await signOut();
                  }}
                />
              )}
            </>
          )}
        </main>
      </div>
      <AuthModal />
      {isAuthenticated && userRole === 'store' && (
        <GeminiAssistantWidget
          botId="shop"
          accountKey={currentUser?.id || null}
          isAuthenticated={isAuthenticated}
        />
      )}
    </div>
  );
};
