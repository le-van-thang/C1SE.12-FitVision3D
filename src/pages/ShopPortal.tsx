import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Store,
  Package,
  ShoppingBag,
  LayoutDashboard,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  ArrowLeft,
  BadgeCheck,
  Phone,
  MapPin,
  LogOut,
  Ruler,
  Users,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  commerceApi,
  type DbProduct,
  type DbShopProfile,
} from '@/services/commerceApi';
import type { Order, OrderStatus } from '@/features/ecommerce/types';
import { showGlobalToast } from '@/components/common/GlobalToastHost';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';

type ShopTab = 'OVERVIEW' | 'PRODUCTS' | 'ORDERS';

const PRESET_IMAGES = [
  {
    label: 'Áo Sơ Mi Oxford',
    url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Áo Polo Dệt Kim',
    url: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Quần Tây / Chino',
    url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Blazer Thời Trang',
    url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Đầm Lụa Nữ',
    url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80',
  },
];

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  tailoring: 'Đang đóng gói / Chuẩn bị',
  shipping: 'Đang giao hàng',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

export const ShopPortal: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, signOut } = useAuth();

  const [tab, setTab] = useState<ShopTab>('OVERVIEW');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [shop, setShop] = useState<DbShopProfile | null>(null);
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Create Product Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState<'shirt' | 'polo' | 'pants' | 'dress' | 'tailored'>('shirt');
  const [prodGender, setProdGender] = useState<'male' | 'female' | 'unisex'>('unisex');
  const [prodPrice, setProdPrice] = useState('590000');
  const [prodSalePrice, setProdSalePrice] = useState('');
  const [prodFabric, setProdFabric] = useState('100% Cotton cao cấp thoáng mát');
  const [prodImage, setProdImage] = useState(PRESET_IMAGES[0].url);
  const [prodDesc, setProdDesc] = useState('');
  const [stockS, setStockS] = useState('15');
  const [stockM, setStockM] = useState('25');
  const [stockL, setStockL] = useState('25');
  const [stockXL, setStockXL] = useState('15');

  const fetchShopData = useCallback(async () => {
    setIsLoading(true);
    const res = await commerceApi.getShopDashboard();
    if (res.success && res.data) {
      setShop(res.data.shop);
      setProducts(res.data.products || []);
      setOrders(res.data.orders || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchShopData();
  }, [fetchShopData]);

  const totalRevenue = useMemo(
    () => orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + (o.total_amount || 0), 0),
    [orders]
  );

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await commerceApi.createShopProduct({
      name: prodName.trim(),
      category: prodCategory,
      genderTarget: prodGender,
      price: Number(prodPrice),
      salePrice: prodSalePrice ? Number(prodSalePrice) : null,
      fabricMaterial: prodFabric.trim(),
      stretchType: 'Co giãn nhẹ (2-3%)',
      imageUrl: prodImage.trim(),
      description: prodDesc.trim(),
      stockMap: {
        S: Number(stockS) || 15,
        M: Number(stockM) || 25,
        L: Number(stockL) || 25,
        XL: Number(stockXL) || 15,
      },
    });
    setIsSubmitting(false);

    if (!res.success || !res.data) {
      showGlobalToast({
        type: 'error',
        title: 'Đăng sản phẩm thất bại',
        message: res.error?.message || 'Vui lòng kiểm tra thông tin sản phẩm.',
      });
      return;
    }

    setProducts((prev) => [res.data!, ...prev]);
    setProdName('');
    setProdDesc('');
    setProdSalePrice('');
    setShowAddForm(false);
    showGlobalToast({
      type: 'success',
      title: 'Đã đăng sản phẩm lên sàn!',
      message: `"${res.data.name}" đã lưu vào PostgreSQL và hiển thị trên trang chủ.`,
    });
  };

  const handleToggleProductVisibility = async (prod: DbProduct) => {
    const nextHidden = !prod.is_hidden;
    const res = await commerceApi.updateShopProduct(prod.id, { isHidden: nextHidden });
    if (res.success && res.data) {
      setProducts((prev) => prev.map((p) => (p.id === prod.id ? res.data! : p)));
      showGlobalToast({
        type: 'info',
        title: nextHidden ? 'Đã tạm ẩn sản phẩm' : 'Đã mở bán sản phẩm',
        message: prod.name,
      });
    }
  };

  const handleDeleteProduct = async (prod: DbProduct) => {
    const res = await commerceApi.deleteShopProduct(prod.id);
    if (res.success) {
      setProducts((prev) => prev.filter((p) => p.id !== prod.id));
      showGlobalToast({
        type: 'warning',
        title: 'Đã xóa sản phẩm',
        message: prod.name,
      });
    }
  };

  const handleUpdateOrder = async (orderId: string, status: OrderStatus) => {
    const res = await commerceApi.updateOrderStatus(orderId, status);
    if (res.success) {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
      showGlobalToast({
        type: 'success',
        title: `Đã cập nhật đơn ${orderId}`,
        message: `Trạng thái mới: ${ORDER_STATUS_LABELS[status]}`,
      });
    }
  };

  const renderSidebar = () => (
    <div className="flex flex-col h-full bg-white text-[#14161A]">
      <div className="h-16 px-5 border-b border-slate-200 flex items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#14171C] flex items-center justify-center text-white">
            <Store size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm truncate max-w-[130px]">
                {shop?.shop_name || 'Kênh Người Bán'}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              {shop?.is_mall ? (
                <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white text-[9px] font-black uppercase">
                  MALL
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Seller Center
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1.5">
        {[
          { id: 'OVERVIEW', label: 'Tổng Quan Shop', icon: <LayoutDashboard size={16} /> },
          { id: 'PRODUCTS', label: `Sản Phẩm (${products.length})`, icon: <Package size={16} /> },
          { id: 'ORDERS', label: `Đơn Hàng (${orders.length})`, icon: <ShoppingBag size={16} /> },
        ].map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setTab(item.id as ShopTab);
                setMobileNavOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                active
                  ? 'bg-[#14171C] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-[#F7F7F5] hover:text-[#14161A]'
              }`}
            >
              <span className={active ? 'text-amber-300' : 'text-slate-400'}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}

        <div className="pt-4 mt-4 border-t border-slate-200 space-y-1">
          <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Công Cụ AI Size 3D
          </p>
          <Link
            to="/size-charts"
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-[#F7F7F5] hover:text-[#14161A]"
          >
            <Ruler size={15} className="text-blue-600" />
            <span>Bảng Size Chuẩn 3D</span>
          </Link>
          <Link
            to="/tailor"
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-[#F7F7F5] hover:text-[#14161A]"
          >
            <Users size={15} className="text-emerald-600" />
            <span>Hồ Sơ Vóc Dáng Khách</span>
          </Link>
          <Link
            to="/"
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-[#F7F7F5] hover:text-[#14161A]"
          >
            <ArrowLeft size={15} />
            <span>Quay Lại Trang Chủ Sàn</span>
          </Link>
        </div>
      </nav>

      <div className="p-3.5 border-t border-slate-200 bg-[#F7F7F5] space-y-2">
        <div className="text-xs font-bold truncate">{currentUser?.full_name}</div>
        <button
          type="button"
          onClick={async () => {
            await signOut();
            navigate('/');
          }}
          className="w-full py-2 px-3 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 text-rose-600 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <LogOut size={13} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#14161A] flex font-sans antialiased">
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 lg:sticky lg:top-0 lg:h-screen bg-white border-r border-slate-200 z-30">
        {renderSidebar()}
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileNavOpen(false)} />
          <aside className="relative w-72 bg-white h-full z-10">
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              className="absolute top-4 right-3 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center"
            >
              <X size={16} />
            </button>
            {renderSidebar()}
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 h-16 px-4 sm:px-8 bg-white/95 backdrop-blur-md border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center"
            >
              <Menu size={18} />
            </button>
            <span className="text-xs font-extrabold text-[#14161A]">
              Kênh Người Bán · {shop?.shop_name || 'FitVision Seller'}
            </span>
            {shop?.is_mall && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-black">
                <BadgeCheck size={12} />
                <span>FitVision Mall Chính Hãng</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={fetchShopData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold cursor-pointer"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin text-blue-600' : ''} />
              <span>Làm mới</span>
            </button>
            <LanguageSwitcher />
          </div>
        </header>

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
          {!shop && !isLoading ? (
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
              <Store size={36} className="mx-auto text-slate-400" />
              <h2 className="text-lg font-bold">Tài khoản chưa liên kết Shop trong PostgreSQL</h2>
              <p className="text-xs text-slate-500">
                Hãy đăng ký mở Shop từ trang chủ hoặc nhờ Admin duyệt hồ sơ của bạn trước khi đăng bán sản phẩm.
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#14171C] text-white text-xs font-bold"
              >
                <ArrowLeft size={14} />
                <span>Về Trang Chủ</span>
              </Link>
            </div>
          ) : (
            <>
              {tab === 'OVERVIEW' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-2xs">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Doanh Thu Của Shop
                      </span>
                      <div className="mt-2 text-2xl font-black font-mono text-emerald-700">
                        {totalRevenue.toLocaleString('vi-VN')} ₫
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{orders.length} đơn đặt hàng</p>
                    </div>
                    <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-2xs">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Sản Phẩm Đang Bán
                      </span>
                      <div className="mt-2 text-2xl font-black font-mono text-[#14161A]">
                        {products.filter((p) => !p.is_hidden).length} / {products.length}
                      </div>
                      <p className="text-[11px] text-blue-600 mt-1 font-semibold cursor-pointer" onClick={() => setTab('PRODUCTS')}>
                        Đăng thêm sản phẩm →
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-2xs">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Chứng Nhận Gian Hàng
                      </span>
                      <div className="mt-2 text-lg font-black text-[#14161A]">
                        {shop?.is_mall ? 'FitVision Mall ✓' : 'Shop Xác Minh'}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 truncate">
                        {shop?.shop_address}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'PRODUCTS' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
                    <div>
                      <h2 className="text-base font-extrabold">Sản Phẩm Của {shop?.shop_name}</h2>
                      <p className="text-xs text-slate-500">
                        Mọi sản phẩm đăng mới sẽ lưu vào PostgreSQL và hiển thị ngay trên trang chủ sàn FitVision 3D.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddForm((v) => !v)}
                      className="px-4 py-2 rounded-xl bg-[#14171C] hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 transition"
                    >
                      <Plus size={14} />
                      <span>{showAddForm ? 'Đóng Form' : 'Đăng Sản Phẩm Mới'}</span>
                    </button>
                  </div>

                  {showAddForm && (
                    <form
                      onSubmit={handleCreateProduct}
                      className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm"
                    >
                      <h3 className="text-sm font-extrabold border-b border-slate-100 pb-2">
                        Thông Tin Sản Phẩm Mới
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-2">
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">
                            Tên sản phẩm *
                          </label>
                          <input
                            type="text"
                            required
                            value={prodName}
                            onChange={(e) => setProdName(e.target.value)}
                            placeholder="VD: Áo Sơ Mi Linen Phom Rộng Minimalist"
                            className="w-full h-9 px-3 rounded-xl bg-[#F7F7F5] border border-slate-200 text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">
                            Danh mục *
                          </label>
                          <select
                            value={prodCategory}
                            onChange={(e) => setProdCategory(e.target.value as any)}
                            className="w-full h-9 px-3 rounded-xl bg-[#F7F7F5] border border-slate-200 text-xs"
                          >
                            <option value="shirt">Áo Sơ Mi</option>
                            <option value="polo">Áo Polo</option>
                            <option value="pants">Quần Tây / Chino</option>
                            <option value="dress">Đầm Lụa</option>
                            <option value="tailored">Áo Khoác / Blazer</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">
                            Giá gốc (₫) *
                          </label>
                          <input
                            type="number"
                            required
                            value={prodPrice}
                            onChange={(e) => setProdPrice(e.target.value)}
                            className="w-full h-9 px-3 rounded-xl bg-[#F7F7F5] border border-slate-200 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">
                            Giá khuyến mãi (₫)
                          </label>
                          <input
                            type="number"
                            value={prodSalePrice}
                            onChange={(e) => setProdSalePrice(e.target.value)}
                            placeholder="Không bắt buộc"
                            className="w-full h-9 px-3 rounded-xl bg-[#F7F7F5] border border-slate-200 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">
                            Giới tính
                          </label>
                          <select
                            value={prodGender}
                            onChange={(e) => setProdGender(e.target.value as any)}
                            className="w-full h-9 px-3 rounded-xl bg-[#F7F7F5] border border-slate-200 text-xs"
                          >
                            <option value="unisex">Unisex</option>
                            <option value="male">Nam</option>
                            <option value="female">Nữ</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">
                            Chất liệu vải
                          </label>
                          <input
                            type="text"
                            value={prodFabric}
                            onChange={(e) => setProdFabric(e.target.value)}
                            className="w-full h-9 px-3 rounded-xl bg-[#F7F7F5] border border-slate-200 text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
                          URL Hình ảnh sản phẩm (hoặc chọn nhanh mẫu bên dưới)
                        </label>
                        <input
                          type="url"
                          value={prodImage}
                          onChange={(e) => setProdImage(e.target.value)}
                          className="w-full h-9 px-3 rounded-xl bg-[#F7F7F5] border border-slate-200 text-xs mb-2"
                        />
                        <div className="flex flex-wrap gap-1.5">
                          {PRESET_IMAGES.map((img) => (
                            <button
                              key={img.label}
                              type="button"
                              onClick={() => setProdImage(img.url)}
                              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-semibold border cursor-pointer ${
                                prodImage === img.url
                                  ? 'bg-[#14171C] text-white border-[#14171C]'
                                  : 'bg-slate-50 text-slate-700 border-slate-200'
                              }`}
                            >
                              {img.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: 'Tồn Size S', val: stockS, set: setStockS },
                          { label: 'Tồn Size M', val: stockM, set: setStockM },
                          { label: 'Tồn Size L', val: stockL, set: setStockL },
                          { label: 'Tồn Size XL', val: stockXL, set: setStockXL },
                        ].map((s) => (
                          <div key={s.label}>
                            <label className="text-[10.5px] font-bold text-slate-600 block mb-1">
                              {s.label}
                            </label>
                            <input
                              type="number"
                              value={s.val}
                              onChange={(e) => s.set(e.target.value)}
                              className="w-full h-8 px-2.5 rounded-lg bg-[#F7F7F5] border border-slate-200 text-xs font-mono"
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
                          Mô tả sản phẩm
                        </label>
                        <textarea
                          rows={2}
                          value={prodDesc}
                          onChange={(e) => setProdDesc(e.target.value)}
                          placeholder="Thông tin chất liệu, kiểu dáng, hướng dẫn chọn size..."
                          className="w-full p-2.5 rounded-xl bg-[#F7F7F5] border border-slate-200 text-xs"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-5 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                      >
                        {isSubmitting ? 'Đang lưu...' : 'Xác Nhận Đăng Bán Lên Sàn'}
                      </button>
                    </form>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {products.length === 0 ? (
                      <div className="md:col-span-2 p-10 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-500">
                        Shop của bạn chưa đăng sản phẩm nào. Bấm <strong>Đăng Sản Phẩm Mới</strong> để bắt đầu bán hàng trên sàn FitVision 3D!
                      </div>
                    ) : (
                      products.map((p) => (
                        <div
                          key={p.id}
                          className="p-4 rounded-2xl bg-white border border-slate-200 flex gap-4 shadow-2xs"
                        >
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="w-20 h-24 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-bold uppercase text-amber-700">
                                  {p.brand_name}
                                </span>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                    p.is_hidden
                                      ? 'bg-rose-50 text-rose-700'
                                      : 'bg-emerald-50 text-emerald-700'
                                  }`}
                                >
                                  {p.is_hidden ? 'Đang ẩn' : 'Đang bán'}
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-[#14161A] truncate mt-0.5">{p.name}</h4>
                              <p className="font-mono text-xs font-black text-blue-700 mt-1">
                                {(p.sale_price || p.price).toLocaleString('vi-VN')} ₫
                              </p>
                            </div>
                            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => handleToggleProductVisibility(p)}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                              >
                                {p.is_hidden ? <Eye size={12} /> : <EyeOff size={12} />}
                                <span>{p.is_hidden ? 'Hiện bán' : 'Tạm ẩn'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(p)}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 size={12} />
                                <span>Xóa</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {tab === 'ORDERS' && (
                <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase text-slate-500">
                        <tr>
                          <th className="py-3.5 px-4 font-bold">Mã Đơn</th>
                          <th className="py-3.5 px-4 font-bold">Thông Tin Liên Hệ Khách</th>
                          <th className="py-3.5 px-4 font-bold">Sản Phẩm Đặt Mua</th>
                          <th className="py-3.5 px-4 font-bold">Tổng Tiền</th>
                          <th className="py-3.5 px-4 font-bold">Xử Lý Đơn</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {orders.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-10 text-center text-slate-500">
                              Chưa có khách nào đặt hàng từ Shop của bạn.
                            </td>
                          </tr>
                        ) : (
                          orders.map((o) => (
                            <tr key={o.id} className="hover:bg-slate-50/70">
                              <td className="py-3.5 px-4 align-top">
                                <span className="font-mono font-bold text-blue-700 block">{o.id}</span>
                                <span className="text-[11px] text-slate-400">
                                  {new Date(o.created_at).toLocaleDateString('vi-VN')}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 align-top space-y-1">
                                <div className="font-bold text-[#14161A]">{o.recipient?.full_name || o.customer_name}</div>
                                <div className="flex items-center gap-1 font-mono text-[11px] text-blue-700 font-semibold">
                                  <Phone size={11} />
                                  <span>{o.recipient?.phone}</span>
                                </div>
                                <div className="flex items-start gap-1 text-[11px] text-slate-500 max-w-xs">
                                  <MapPin size={11} className="shrink-0 mt-0.5" />
                                  <span>{o.recipient?.address}, {o.recipient?.city}</span>
                                </div>
                                {o.recipient?.note && (
                                  <p className="text-[10.5px] italic text-amber-800 bg-amber-50 px-2 py-1 rounded">
                                    Ghi chú: {o.recipient.note}
                                  </p>
                                )}
                              </td>
                              <td className="py-3.5 px-4 align-top">
                                {o.items.map((it) => (
                                  <div key={it.id} className="font-medium text-slate-800">
                                    {it.product.name} ({it.variant.size_label} × {it.quantity})
                                  </div>
                                ))}
                              </td>
                              <td className="py-3.5 px-4 align-top font-mono font-black text-emerald-700">
                                {o.total_amount.toLocaleString('vi-VN')} ₫
                              </td>
                              <td className="py-3.5 px-4 align-top">
                                <select
                                  value={o.status}
                                  onChange={(e) => handleUpdateOrder(o.id, e.target.value as OrderStatus)}
                                  className="h-8 px-2.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold cursor-pointer"
                                >
                                  <option value="pending">Chờ xác nhận</option>
                                  <option value="confirmed">Đã xác nhận</option>
                                  <option value="tailoring">Đang chuẩn bị hàng</option>
                                  <option value="shipping">Đang giao hàng</option>
                                  <option value="completed">Hoàn thành</option>
                                  <option value="cancelled">Hủy đơn</option>
                                </select>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
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
