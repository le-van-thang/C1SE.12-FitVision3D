import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  ShieldAlert,
  MessageSquare,
  Send,
  Star,
  Upload,
  Save,
  Sparkles,
  Phone,
  MapPin,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';
import {
  commerceApi,
  type DbProduct,
  type DbShopProfile,
  type DbShopReview,
} from '@/services/commerceApi';
import type { Order } from '@/features/ecommerce/types';
import { showGlobalToast } from '@/components/common/GlobalToastHost';

type ShopTab = 'OVERVIEW' | 'PRODUCTS' | 'ORDERS' | 'SIZE_CHART';

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
  const { currentUser, isAuthenticated, userRole, openSignIn, signOut } = useAuth();
  const { locale, setLocale } = useI18n();
  const [activeTab, setActiveTab] = useState<ShopTab>('OVERVIEW');
  const [shop, setShop] = useState<DbShopProfile | null>(null);
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<DbShopReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Shop profile editable state
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Product creation form + anti-spam guard
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<'shirt' | 'polo' | 'pants' | 'dress' | 'tailored'>('shirt');
  const [newGender, setNewGender] = useState<'male' | 'female' | 'unisex'>('male');
  const [newPrice, setNewPrice] = useState('590000');
  const [newSalePrice, setNewSalePrice] = useState('');
  const [newFabric, setNewFabric] = useState('100% Cotton Cao Cấp');
  const [newStretch, setNewStretch] = useState('Co giãn nhẹ (2-3%)');
  const [newImageUrl, setNewImageUrl] = useState(
    'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=80'
  );
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoFileName, setNewVideoFileName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newColorName, setNewColorName] = useState('Trắng Kem');
  const [newColorHex, setNewColorHex] = useState('#F3F4F6');
  const [isCreating, setIsCreating] = useState(false);
  const [recentSubmitTimestamps, setRecentSubmitTimestamps] = useState<number[]>([]);

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
      setShop(res.data.shop);
      setProducts(res.data.products || []);
      setOrders(res.data.orders || []);
      setReviews(res.data.reviews || []);
      if (res.data.shop) {
        setProfileName(res.data.shop.shop_name || '');
        setProfilePhone(res.data.shop.phone_number || '');
        setProfileAddress(res.data.shop.shop_address || '');
      }
    }
    setIsLoading(false);
  }, [isAuthenticated, userRole]);

  useEffect(() => {
    void loadShopData();
  }, [loadShopData]);

  const totalRevenue = useMemo(
    () => orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + Number(o.total_amount || 0), 0),
    [orders]
  );

  const pendingReviewsCount = useMemo(
    () => reviews.filter((r) => !r.shop_reply).length,
    [reviews]
  );

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
    });
    setIsSavingProfile(false);
    if (res.success && res.data) {
      setShop(res.data);
      showGlobalToast({
        type: 'success',
        title: 'Đã cập nhật hồ sơ Shop!',
        message: 'Tên thương hiệu và thông tin liên hệ đã lưu vào PostgreSQL.',
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

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setNewImageUrl(reader.result);
        showGlobalToast({
          type: 'success',
          title: 'Đã tải ảnh sản phẩm',
          message: `${file.name} (${(file.size / 1024).toFixed(0)} KB) sẵn sàng đăng bán.`,
        });
      }
    };
    reader.readAsDataURL(file);
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

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPrice) return;

    // Client-side Anti-Spam Pre-Check (mirrors PostgreSQL/Backend rate limit: max 3 posts / 60s)
    const now = Date.now();
    const recent = recentSubmitTimestamps.filter((ts) => now - ts < 60_000);
    if (recent.length >= 3) {
      const waitSec = Math.ceil((60_000 - (now - recent[0])) / 1000);
      showGlobalToast({
        type: 'warning',
        title: 'Kích hoạt Chống Spam',
        message: `Bạn vừa đăng liên tiếp 3 sản phẩm/phút. Vui lòng đợi ${waitSec} giây để bảo vệ server.`,
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

    setIsCreating(true);
    const res = await commerceApi.createShopProduct({
      name: newName.trim(),
      category: newCategory,
      genderTarget: newGender,
      price: Number(newPrice),
      salePrice: newSalePrice ? Number(newSalePrice) : null,
      fabricMaterial: newFabric.trim() || 'Cotton Cao Cấp',
      stretchType: newStretch,
      imageUrl: newImageUrl.trim(),
      videoUrl: newVideoUrl.trim() || undefined,
      description: newDescription.trim() || `Thiết kế độc quyền từ ${shop?.shop_name || 'Shop'}.`,
      colorName: newColorName,
      colorHex: newColorHex,
    });
    setIsCreating(false);

    if (res.success && res.data) {
      setRecentSubmitTimestamps([...recent, Date.now()]);
      setShowAddForm(false);
      setNewName('');
      setNewDescription('');
      setNewVideoUrl('');
      setNewVideoFileName('');
      showGlobalToast({
        type: 'success',
        title: 'Đã đăng bán sản phẩm mới!',
        message: `"${res.data.name}" đã hiển thị công khai trên sàn FitVision.`,
      });
      void loadShopData();
    } else {
      showGlobalToast({
        type: 'error',
        title: 'Không thể đăng sản phẩm',
        message: res.error?.message || 'Vui lòng kiểm tra lại dữ liệu hoặc hạn mức chống spam.',
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
              <button
                type="button"
                onClick={openSignIn}
                className="w-full py-3 rounded-xl bg-[#14171C] hover:bg-blue-600 text-white text-xs font-bold cursor-pointer transition-colors"
              >
                Đăng nhập tài khoản Shop
              </button>
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
                  {shop?.shop_name || 'Kênh Người Bán'}
                </h2>
                {shop?.is_mall && (
                  <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider">
                    MALL
                  </span>
                )}
              </div>
              <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
                SELLER CENTER
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
              <TrendingUp size={15} /> Tổng Quan &amp; Hồ Sơ Shop
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
                <Package size={15} /> Sản Phẩm &amp; Video
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
                <ShoppingBag size={15} /> Đơn Hàng &amp; Đánh Giá
              </span>
              <span className="text-[10px] font-mono opacity-80">
                {orders.length}
                {pendingReviewsCount > 0 ? ` • ${pendingReviewsCount}💬` : ''}
              </span>
            </button>

            <div className="pt-3 mt-3 border-t border-slate-100 space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Hỗ Trợ AI Chọn Size
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
                <Ruler size={15} /> Bảng Size Chuẩn 3D
              </button>
              <a
                href="/"
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-blue-700 bg-blue-50/70 hover:bg-blue-100 transition-colors"
              >
                <ArrowLeft size={15} /> Về Trang Chủ Sàn
              </a>
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
            <LogOut size={13} /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-950">
              {shop?.shop_name ? `Gian Hàng ${shop.shop_name}` : 'Kênh Người Bán FitVision'}
            </span>
            {shop?.is_mall ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-extrabold">
                <BadgeCheck size={12} /> FitVision Mall Chính Hãng
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                Gian hàng đã kích hoạt
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadShopData()}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} /> Làm mới
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

        <main className="p-6 space-y-6 max-w-6xl w-full mx-auto">
          {isLoading ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-sm text-slate-500">
              Đang tải dữ liệu gian hàng từ PostgreSQL...
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW & EDIT SHOP PROFILE */}
              {activeTab === 'OVERVIEW' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <p className="text-[11px] font-bold uppercase text-slate-400">Sản phẩm đang bán</p>
                      <p className="text-2xl font-black text-slate-950 mt-2">{products.length}</p>
                      <p className="text-[11px] text-slate-500 mt-1">Hạn mức: tối đa 50 SP</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <p className="text-[11px] font-bold uppercase text-slate-400">Đơn hàng nhận được</p>
                      <p className="text-2xl font-black text-slate-950 mt-2">{orders.length}</p>
                      <p className="text-[11px] text-slate-500 mt-1">Khớp trên hệ thống sàn</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <p className="text-[11px] font-bold uppercase text-slate-400">Tổng doanh thu ước tính</p>
                      <p className="text-2xl font-black text-emerald-700 mt-2">{formatCurrency(totalRevenue)}</p>
                      <p className="text-[11px] text-slate-500 mt-1">Đã trừ đơn hủy</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <p className="text-[11px] font-bold uppercase text-slate-400">Đánh giá chờ trả lời</p>
                      <p className="text-2xl font-black text-amber-600 mt-2">{pendingReviewsCount}</p>
                      <p className="text-[11px] text-slate-500 mt-1">Tổng {reviews.length} đánh giá</p>
                    </div>
                  </div>

                  {/* Quick How-To Flow Card */}
                  <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                        <Sparkles size={12} /> Quy Trình Bán Hàng Thời Trang AI 3D
                      </span>
                      <h3 className="text-lg font-black">
                        Đăng quần áo bán sẵn — AI tự động chọn size cho khách hàng
                      </h3>
                      <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                        Bạn không cần quản lý may đo thủ công. Chỉ cần đăng sản phẩm (kèm ảnh + video thực tế) và cài thông số S / M / L / XL tại mục <b>Bảng Size Chuẩn 3D</b>. Khi khách mua hàng quét vóc dáng 3D trên trang chủ, hệ thống sẽ tự gợi ý size chuẩn nhất từ shop của bạn.
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
                      <Plus size={15} /> Đăng Sản Phẩm Ngay
                    </button>
                  </div>

                  {/* Shop Profile Editor */}
                  <form
                    onSubmit={handleSaveShopProfile}
                    className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-2xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="text-sm font-black text-slate-950">Hồ Sơ Thương Hiệu &amp; Liên Hệ Shop</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Tên thương hiệu này sẽ gắn trực tiếp lên từng thẻ sản phẩm của bạn trên sàn thương mại.
                        </p>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                        Đã liên kết PostgreSQL • ID: {shop?.id?.slice(0, 8)}...
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mb-1.5">
                          <Store size={12} /> Tên Thương Hiệu / Shop *
                        </label>
                        <input
                          required
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          placeholder="VD: Torano Studio"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-slate-900"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mb-1.5">
                          <Phone size={12} /> Hotline CSKH Shop
                        </label>
                        <input
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                          placeholder="VD: 0901 234 567"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-slate-900"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mb-1.5">
                          <MapPin size={12} /> Địa Chỉ Kho / Cửa Hàng
                        </label>
                        <input
                          value={profileAddress}
                          onChange={(e) => setProfileAddress(e.target.value)}
                          placeholder="VD: Quận 1, TP. Hồ Chí Minh"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-slate-900"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSavingProfile}
                        className="px-5 py-2.5 rounded-xl bg-[#14171C] hover:bg-blue-600 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Save size={14} /> {isSavingProfile ? 'Đang lưu...' : 'Lưu Thông Tin Shop'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 2: PRODUCTS + VIDEO + ANTI-SPAM */}
              {activeTab === 'PRODUCTS' && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-black text-slate-950">Kho Sản Phẩm &amp; Video Review</h2>
                      <p className="text-xs text-slate-500">
                        Đăng ảnh + video giới thiệu trang phục để khách xem trực tiếp trên trang chủ.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(!showAddForm)}
                      className="px-4 py-2.5 rounded-xl bg-[#14171C] hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors self-start"
                    >
                      {showAddForm ? <X size={14} /> : <Plus size={14} />}
                      {showAddForm ? 'Đóng Biểu Mẫu' : 'Đăng Sản Phẩm Mới'}
                    </button>
                  </div>

                  {/* Anti-Spam Protection Notice */}
                  <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                    <ShieldAlert size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-950 space-y-1">
                      <p className="font-bold">Hệ Thống Chống Spam &amp; Bảo Vệ Tài Nguyên Server Đang Bật</p>
                      <p className="text-[11px] text-amber-900/90">
                        • Tốc độ đăng bài: tối đa <b>3 sản phẩm / 60 giây</b> &amp; hạn mức <b>50 sản phẩm / Shop</b>.{' '}
                        • Ảnh tải lên: tối đa <b>2MB</b> (JPG/PNG/WEBP).{' '}
                        • Video tải trực tiếp: tối đa <b>12MB</b> (MP4/WebM) hoặc dán link CDN / YouTube không giới hạn dung lượng.
                      </p>
                    </div>
                  </div>

                  {showAddForm && (
                    <form
                      onSubmit={handleCreateProduct}
                      className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-xs"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="text-sm font-black text-slate-950">Đăng Bán Sản Phẩm Mới Lên Sàn</h3>
                        <span className="text-[11px] font-semibold text-slate-400">
                          Thương hiệu gắn tự động: <b className="text-slate-900">{shop?.shop_name}</b>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">Tên Sản Phẩm *</label>
                          <input
                            required
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="VD: Áo Sơ Mi Bamboo Dáng Regular Fit"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">Danh Mục</label>
                          <select
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value as typeof newCategory)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none bg-white"
                          >
                            <option value="shirt">Áo Sơ Mi</option>
                            <option value="polo">Áo Polo &amp; Thun</option>
                            <option value="pants">Quần Tây &amp; Jeans</option>
                            <option value="dress">Đầm / Váy</option>
                            <option value="tailored">Vest &amp; Blazer</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">Giới Tính</label>
                          <select
                            value={newGender}
                            onChange={(e) => setNewGender(e.target.value as typeof newGender)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none bg-white"
                          >
                            <option value="male">Nam</option>
                            <option value="female">Nữ</option>
                            <option value="unisex">Unisex</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">Giá Gốc (VNĐ) *</label>
                          <input
                            required
                            type="number"
                            min={10000}
                            value={newPrice}
                            onChange={(e) => setNewPrice(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">Giá Khuyến Mãi (VNĐ)</label>
                          <input
                            type="number"
                            min={10000}
                            placeholder="Không bắt buộc"
                            value={newSalePrice}
                            onChange={(e) => setNewSalePrice(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">Độ Co Giãn</label>
                          <select
                            value={newStretch}
                            onChange={(e) => setNewStretch(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none bg-white"
                          >
                            <option value="Không co giãn">Không co giãn</option>
                            <option value="Co giãn nhẹ (2-3%)">Co giãn nhẹ (2-3%)</option>
                            <option value="Co giãn tốt (4-way)">Co giãn tốt (4-way)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">Chất Liệu Vải</label>
                          <input
                            value={newFabric}
                            onChange={(e) => setNewFabric(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">Màu Sắc</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={newColorHex}
                              onChange={(e) => setNewColorHex(e.target.value)}
                              className="w-10 h-9 rounded-lg border border-slate-200 cursor-pointer"
                            />
                            <input
                              value={newColorName}
                              onChange={(e) => setNewColorName(e.target.value)}
                              className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            Ảnh Sản Phẩm (Link URL hoặc Tải lên &le; 2MB) *
                          </label>
                          <div className="flex gap-2">
                            <input
                              required
                              value={newImageUrl.startsWith('data:image') ? '[Đã tải file ảnh từ máy]' : newImageUrl}
                              onChange={(e) => setNewImageUrl(e.target.value)}
                              className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none"
                            />
                            <label className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1 cursor-pointer flex-shrink-0">
                              <Upload size={13} /> Ảnh
                              <input type="file" accept="image/*" onChange={handleImageFileUpload} className="hidden" />
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Video URL or Local MP4/WebM Upload */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
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
                            value={newVideoUrl.startsWith('data:video') ? `Video tải lên: ${newVideoFileName}` : newVideoUrl}
                            onChange={(e) => {
                              setNewVideoUrl(e.target.value);
                              setNewVideoFileName('');
                            }}
                            placeholder="Dán link video (.mp4 / YouTube) hoặc bấm nút Upload MP4 bên phải (tối đa 12MB)..."
                            className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:border-slate-900"
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
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Mô Tả Chi Tiết</label>
                        <textarea
                          rows={2}
                          value={newDescription}
                          onChange={(e) => setNewDescription(e.target.value)}
                          placeholder="Chất liệu thoáng mát, giữ phom đẹp..."
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs outline-none"
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
                          <CheckCircle2 size={14} /> {isCreating ? 'Đang đăng lên sàn...' : 'Đăng Lên Sàn Ngay'}
                        </button>
                      </div>
                    </form>
                  )}

                  {products.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-500">
                      Shop bạn chưa có sản phẩm nào. Hãy bấm <b>Đăng Sản Phẩm Mới</b> ở góc trên để mở bán!
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
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                ★ {Number(p.rating || 5).toFixed(1)} ({p.reviews_count || 0} đánh giá)
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
                                  <Eye size={12} /> Hiện lại
                                </>
                              ) : (
                                <>
                                  <EyeOff size={12} /> Tạm ẩn
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteProduct(p)}
                              className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 text-[11px] font-bold flex items-center gap-1 hover:bg-rose-50 cursor-pointer"
                            >
                              <Trash2 size={12} /> Xóa
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
                      <h2 className="text-lg font-black text-slate-950">Đơn Đặt Hàng &amp; Liên Hệ Khách Mua</h2>
                      <p className="text-xs text-slate-500">
                        Hiển thị đầy đủ số điện thoại và địa chỉ người đặt để Shop chủ động xác nhận giao hàng.
                      </p>
                    </div>
                    {orders.length === 0 ? (
                      <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center text-xs text-slate-500">
                        Chưa có đơn hàng nào chứa sản phẩm của Shop bạn.
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
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  {order.status}
                                </span>
                                <span className="text-xs font-mono font-black text-emerald-700">
                                  {formatCurrency(order.total_amount)}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-slate-500">
                              Địa chỉ giao: {order.recipient?.address}
                              {order.recipient?.city ? `, ${order.recipient.city}` : ''}
                            </p>
                            {order.recipient?.note && (
                              <p className="text-[11px] text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg">
                                Ghi chú khách: {order.recipient.note}
                              </p>
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
                        Đánh Giá &amp; Bình Luận Từ Khách Hàng ({reviews.length})
                      </h3>
                      <p className="text-xs text-slate-500">
                        Phản hồi trực tiếp dưới nhận xét của khách hàng giúp tăng độ uy tín cho gian hàng.
                      </p>
                    </div>
                    {reviews.length === 0 ? (
                      <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center text-xs text-slate-500">
                        Chưa có đánh giá nào trên sản phẩm của Shop bạn.
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
                                <span className="font-bold text-blue-700">Phản hồi của Shop: </span>
                                {rev.shop_reply}
                              </div>
                            ) : replyingReviewId === rev.id ? (
                              <div className="flex gap-2 pt-1">
                                <input
                                  value={replyDraft}
                                  onChange={(e) => setReplyDraft(e.target.value)}
                                  placeholder="Cảm ơn bạn đã ủng hộ Shop..."
                                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-slate-900"
                                />
                                <button
                                  type="button"
                                  disabled={isSendingReply}
                                  onClick={() => void handleSendReply(rev.id)}
                                  className="px-3.5 py-2 rounded-xl bg-[#14171C] hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Send size={12} /> Gửi
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplyingReviewId(null);
                                    setReplyDraft('');
                                  }}
                                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold cursor-pointer"
                                >
                                  Hủy
                                </button>
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
                                + Trả lời khách hàng
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
                      <h2 className="text-lg font-black text-slate-950">Bảng Size Chuẩn 3D Theo Sản Phẩm (S / M / L / XL)</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Thiết lập thông số kích cỡ quần áo may sẵn của Shop để AI tự khớp với số đo quét 3D của người mua.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveSizeSpecs}
                      className="px-4 py-2.5 rounded-xl bg-[#14171C] hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start"
                    >
                      <Save size={14} /> Lưu Bảng Size
                    </button>
                  </div>

                  {/* Explanation Banner */}
                  <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 text-xs text-slate-700 leading-relaxed">
                    <b className="text-blue-900">Tại sao Shop TMĐT chỉ cần Bảng Size Chuẩn 3D mà không cần Hồ sơ may đo?</b>{' '}
                    Shop bán quần áo thời trang may sẵn theo size cố định (S, M, L, XL). Khi bạn nhập đúng số đo Ngực / Eo / Vai / Dài áo ở bảng dưới, khách mua chỉ việc dùng camera <b>Quét AI 3D</b> ở trang chủ — hệ thống sẽ tự đối chiếu và gợi ý chính xác size nào của Shop bạn mặc vừa đẹp nhất, giảm tối đa tỷ lệ đổi trả hàng!
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-2xs">
                    <div className="flex flex-wrap items-center gap-2">
                      {(
                        [
                          { id: 'shirt', label: 'Áo Sơ Mi' },
                          { id: 'polo', label: 'Áo Polo & Thun' },
                          { id: 'pants', label: 'Quần Tây & Jeans' },
                          { id: 'dress', label: 'Đầm & Váy' },
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
                            <th className="py-3 px-3">Size</th>
                            {selectedSizeCategory !== 'pants' && (
                              <>
                                <th className="py-3 px-3">Ngực Min (cm)</th>
                                <th className="py-3 px-3">Ngực Max (cm)</th>
                                <th className="py-3 px-3">Rộng Vai (cm)</th>
                              </>
                            )}
                            <th className="py-3 px-3">Eo Min (cm)</th>
                            <th className="py-3 px-3">Eo Max (cm)</th>
                            <th className="py-3 px-3">Hông Max (cm)</th>
                            <th className="py-3 px-3">Dài SP (cm)</th>
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
            </>
          )}
        </main>
      </div>
    </div>
  );
};
