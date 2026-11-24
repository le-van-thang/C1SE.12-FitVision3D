import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Store,
  BadgeCheck,
  Star,
  MapPin,
  Phone,
  Mail,
  Sparkles,
  MessageSquare,
  ShieldCheck,
  Scissors,
  ShoppingBag,
  Copy,
  Check,
  Ruler,
} from 'lucide-react';
import type { FashionProduct, FitMatchResult, ProductVariant } from './types';
import { commerceApi, type DbProductReview, type PublicShopProfile } from '@/services/commerceApi';
import { useI18n } from '@/i18n';
import { showGlobalToast } from '@/components/common/GlobalToastHost';

export type ShopCatalogProduct = FashionProduct & {
  fitResult: FitMatchResult;
  recommendedVariant: ProductVariant;
};

interface ShopStorefrontModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopName: string;
  shopProfile?: PublicShopProfile | null;
  products: ShopCatalogProduct[];
  isAuthenticated: boolean;
  hasBodyProfile: boolean;
  onOpenProduct: (product: FashionProduct) => void;
  onOpenVirtualStudio: (product?: FashionProduct) => void;
}

type ShopModalTab = 'PRODUCTS' | 'REVIEWS' | 'ABOUT';

export const ShopStorefrontModal: React.FC<ShopStorefrontModalProps> = ({
  isOpen,
  onClose,
  shopName,
  shopProfile,
  products,
  isAuthenticated,
  hasBodyProfile,
  onOpenProduct,
  onOpenVirtualStudio,
}) => {
  const { locale } = useI18n();
  const isEn = locale === 'en';

  const [activeTab, setActiveTab] = useState<ShopModalTab>('PRODUCTS');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [shopReviews, setShopReviews] = useState<(DbProductReview & { productName: string })[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const shopProducts = useMemo(() => {
    const targetLower = shopName.trim().toLowerCase();
    return products.filter(
      (p) =>
        (shopProfile?.id && p.shop_id === shopProfile.id) ||
        p.brand_name.trim().toLowerCase() === targetLower
    );
  }, [products, shopName, shopProfile?.id]);

  const filteredShopProducts = useMemo(() => {
    if (catFilter === 'all') return shopProducts;
    return shopProducts.filter((p) => p.category === catFilter);
  }, [shopProducts, catFilter]);

  const stats = useMemo(() => {
    const count = shopProducts.length || shopProfile?.product_count || 0;
    const totalRev =
      shopProducts.reduce((acc, p) => acc + (p.reviews_count || 0), 0) ||
      shopProfile?.total_reviews ||
      0;
    const avgFromProducts =
      shopProducts.length > 0
        ? Math.round(
            (shopProducts.reduce((acc, p) => acc + (p.rating || 5), 0) / shopProducts.length) * 10
          ) / 10
        : shopProfile?.avg_rating ?? 5.0;
    const bespokeCount =
      shopProducts.filter((p) => p.is_bespoke || p.category === 'tailored').length ||
      shopProfile?.bespoke_count ||
      0;
    const isMall = Boolean(shopProfile?.is_mall || shopProducts.some((p) => p.is_mall));
    return { count, totalRev, avgRating: avgFromProducts, bespokeCount, isMall };
  }, [shopProducts, shopProfile]);

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab('PRODUCTS');
    setCatFilter('all');
    setCopiedPhone(false);
    const sampleIds = shopProducts.slice(0, 6);
    if (sampleIds.length === 0) {
      setShopReviews([]);
      return;
    }
    setIsLoadingReviews(true);
    Promise.all(
      sampleIds.map(async (p) => {
        const res = await commerceApi.getProductReviews(p.id);
        const list = res.success && Array.isArray(res.data) ? res.data : [];
        return list.map((r) => ({ ...r, productName: p.name }));
      })
    )
      .then((nested) => {
        const flat = nested
          .flat()
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setShopReviews(flat);
      })
      .finally(() => setIsLoadingReviews(false));
  }, [isOpen, shopName]);

  if (!isOpen || !shopName) return null;

  const displayPhone = shopProfile?.phone_number || '1900 8559';
  const displayAddress = shopProfile?.shop_address || 'Đà Nẵng · Việt Nam';
  const displayCity = shopProfile?.city || 'Việt Nam';
  const displayEmail = shopProfile?.contact_email || 'cskh@fitvision3d.com';
  const displayDesc =
    shopProfile?.description ||
    `Thương hiệu thời trang ${shopName} cam kết chất liệu tuyển chọn, hỗ trợ chọn size theo 13 số đo 3D chuẩn ISO 8559-1 và đổi size miễn phí 14 ngày.`;

  const handleCopyPhone = () => {
    navigator.clipboard?.writeText(displayPhone).catch(() => undefined);
    setCopiedPhone(true);
    showGlobalToast({
      type: 'success',
      title: isEn ? 'Copied Shop Hotline' : 'Đã sao chép SĐT Shop',
      message: `${shopName}: ${displayPhone}`,
    });
    setTimeout(() => setCopiedPhone(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-5xl max-h-[92vh] bg-[#F7F7F5] rounded-3xl border border-slate-300 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* 1. Shop Brand Hero Banner */}
        <div className="bg-gradient-to-r from-[#14171C] via-slate-900 to-[#1B2232] text-white px-5 sm:px-7 py-5 border-b border-white/10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-700 border-2 border-white/25 shadow-lg flex items-center justify-center font-black text-xl tracking-tight shrink-0">
                {shopName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-display text-lg sm:text-2xl font-black text-white truncate">
                    {shopProfile?.shop_name || shopName}
                  </h2>
                  {stats.isMall && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider">
                      <BadgeCheck size={11} /> FitVision Mall
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-[10px] font-bold">
                    <ShieldCheck size={11} /> {isEn ? 'Verified Store' : 'Shop Uy Tín · Đã Xác Minh'}
                  </span>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 max-w-2xl">{displayDesc}</p>

                <div className="flex items-center gap-3 flex-wrap text-[11px] text-slate-300 pt-0.5">
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={12} className="text-amber-300" />
                    <span>{displayAddress}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPhone}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold cursor-pointer transition-colors"
                  >
                    <Phone size={11} className="text-emerald-300" />
                    <span>{displayPhone}</span>
                    {copiedPhone ? <Check size={11} className="text-emerald-300" /> : <Copy size={10} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Shop Storefront"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer shrink-0 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Shop Trust Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
            <div className="p-2.5 rounded-2xl bg-white/10 border border-white/10 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                <Star size={16} className="fill-amber-300" />
              </div>
              <div>
                <span className="text-[10px] text-slate-300 block">
                  {isEn ? 'Shop Rating' : 'Đánh giá Shop'}
                </span>
                <span className="font-mono font-black text-sm text-white">
                  {stats.avgRating.toFixed(1)} / 5.0
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-white/10 border border-white/10 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0">
                <ShoppingBag size={16} />
              </div>
              <div>
                <span className="text-[10px] text-slate-300 block">
                  {isEn ? 'Products' : 'Sản phẩm đang bán'}
                </span>
                <span className="font-mono font-black text-sm text-white">{stats.count} mẫu</span>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-white/10 border border-white/10 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <MessageSquare size={16} />
              </div>
              <div>
                <span className="text-[10px] text-slate-300 block">
                  {isEn ? 'Customer Reviews' : 'Lượt đánh giá'}
                </span>
                <span className="font-mono font-black text-sm text-white">{stats.totalRev}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenVirtualStudio(shopProducts[0]);
              }}
              className="p-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border border-blue-400/40 flex items-center justify-center gap-2 text-xs font-extrabold text-white shadow-md cursor-pointer transition-all"
            >
              <Sparkles size={15} />
              <span>{isEn ? 'Shop 3D Fitting Room' : 'Phòng Thử Đồ 3D Shop'}</span>
            </button>
          </div>
        </div>

        {/* 2. Shop Navigation Tabs */}
        <div className="bg-white border-b border-slate-200 px-5 sm:px-7 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            {[
              { id: 'PRODUCTS', label: isEn ? `Products (${shopProducts.length})` : `Sản phẩm của Shop (${shopProducts.length})` },
              { id: 'REVIEWS', label: isEn ? `Shop Reviews (${shopReviews.length})` : `Đánh giá & Uy tín Shop` },
              { id: 'ABOUT', label: isEn ? 'Brand & Contact' : 'Hồ sơ & Liên hệ Shop' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as ShopModalTab)}
                className={`px-4 py-3 text-xs font-extrabold border-b-2 transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-[#14171C] text-[#14171C]'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'PRODUCTS' && (
            <div className="flex items-center gap-1.5 py-2 overflow-x-auto">
              {[
                { id: 'all', label: isEn ? 'All' : 'Tất cả' },
                { id: 'shirt', label: isEn ? 'Shirts' : 'Áo Sơ Mi' },
                { id: 'polo', label: 'Polo' },
                { id: 'pants', label: isEn ? 'Pants' : 'Quần' },
                { id: 'dress', label: isEn ? 'Dresses' : 'Đầm' },
                { id: 'tailored', label: 'May Đo' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCatFilter(c.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                    catFilter === c.id
                      ? 'bg-[#14171C] text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 3. Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7">
          {activeTab === 'PRODUCTS' && (
            <>
              {filteredShopProducts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-xs text-slate-500">
                  {isEn ? 'No products match this category in this shop.' : 'Chưa có sản phẩm nào trong danh mục này của Shop.'}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredShopProducts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        onClose();
                        onOpenProduct(p);
                      }}
                      className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-400 overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div className="relative aspect-[3/4] bg-slate-100 overflow-hidden">
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                        />
                        {isAuthenticated && hasBodyProfile ? (
                          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-mono font-bold shadow">
                            {p.fitResult.match_percentage}% Vừa
                          </span>
                        ) : (
                          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-slate-900/80 text-white text-[9px] font-bold flex items-center gap-1">
                            <Ruler size={9} /> ISO 8559
                          </span>
                        )}
                      </div>
                      <div className="p-3 space-y-1">
                        <h4 className="font-bold text-xs text-slate-900 line-clamp-2 group-hover:text-blue-600">
                          {isEn && p.name_en ? p.name_en : p.name}
                        </h4>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-black text-rose-600">
                            {(p.sale_price || p.price).toLocaleString('vi-VN')} ₫
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-slate-600 font-semibold">
                            <Star size={10} className="fill-amber-400 text-amber-400" />
                            {(p.rating || 5).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'REVIEWS' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-center px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200">
                    <span className="font-mono text-3xl font-black text-amber-600 block">
                      {stats.avgRating.toFixed(1)}
                    </span>
                    <span className="text-[10px] font-bold text-amber-800 uppercase">
                      trên 5.0 sao
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-900">
                      Độ Uy Tín Thương Hiệu {shopName}
                    </h4>
                    <p className="text-xs text-slate-600">
                      Tổng hợp từ {stats.totalRev} lượt đánh giá trên {stats.count} sản phẩm của cửa hàng.
                    </p>
                  </div>
                </div>
              </div>

              {isLoadingReviews ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
                  Đang tải đánh giá thực tế từ khách hàng...
                </div>
              ) : shopReviews.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
                  Chưa có bình luận chi tiết nào được ghi nhận cho các mẫu đang mở. Bạn có thể xem từng sản phẩm để để lại đánh giá đầu tiên!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {shopReviews.map((rev) => (
                    <div key={rev.id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="text-xs font-black text-slate-900 block">{rev.user_name}</span>
                          <span className="text-[10px] text-blue-600 font-semibold">{rev.productName}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={11}
                              className={s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{rev.comment}</p>
                      {rev.shop_reply && (
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700">
                          <span className="font-bold text-blue-700">Phản hồi của {shopName}: </span>
                          {rev.shop_reply}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'ABOUT' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Store size={14} className="text-blue-600" />
                  <span>Giới Thiệu Thương Hiệu</span>
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">{displayDesc}</p>
                <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <BadgeCheck size={14} className="text-emerald-600 shrink-0" />
                    <span>Trạng thái pháp lý: Đã xác minh hồ sơ cửa hàng tại FitVision Mall</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Scissors size={14} className="text-amber-600 shrink-0" />
                    <span>Hỗ trợ may đo 3D: {stats.bespokeCount} sản phẩm đạt chuẩn rập ISO 8559</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Phone size={14} className="text-emerald-600" />
                  <span>Thông Tin Liên Hệ Trực Tiếp</span>
                </h4>
                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Phone size={14} className="text-emerald-600" />
                      <span>Hotline / Zalo Shop:</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyPhone}
                      className="font-mono font-black text-slate-950 hover:text-blue-600 cursor-pointer bg-transparent border-0"
                    >
                      {displayPhone}
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Mail size={14} className="text-blue-600" />
                      <span>Email hỗ trợ:</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">{displayEmail}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-slate-700 shrink-0">
                      <MapPin size={14} className="text-rose-600" />
                      <span>Địa chỉ:</span>
                    </div>
                    <span className="font-semibold text-slate-900 text-right">
                      {displayAddress} ({displayCity})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopStorefrontModal;
