import React, { useEffect, useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Clock,
  MapPin,
  MessageSquare,
  Package,
  PauseCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
} from 'lucide-react';
import { commerceApi, type PublicStorefrontResponse } from '@/services/commerceApi';

const TIER_BADGES: Record<'MALL' | 'PREFERRED' | 'REGULAR', { label: string; cls: string }> = {
  MALL: {
    label: 'FitVision Mall Chính Hãng',
    cls: 'bg-rose-600 text-white border-rose-600',
  },
  PREFERRED: {
    label: 'Shop Yêu Thích',
    cls: 'bg-amber-500 text-slate-950 border-amber-500',
  },
  REGULAR: {
    label: 'Đối Tác Đã Xác Minh KYC',
    cls: 'bg-emerald-600 text-white border-emerald-600',
  },
};

export const ShopStorefrontPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<PublicStorefrontResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'ALL' | 'BESPOKE' | 'READY'>('ALL');

  useEffect(() => {
    let active = true;
    async function load() {
      if (!slug) return;
      setLoading(true);
      setError(null);
      const res = await commerceApi.getPublicStorefront(slug);
      if (!active) return;
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error?.message || 'Không tìm thấy gian hàng này trên sàn FitVision 3D.');
      }
      setLoading(false);
    }
    void load();
    return () => {
      active = false;
    };
  }, [slug]);

  const filteredProducts = useMemo(() => {
    const list = data?.products || [];
    if (filterMode === 'BESPOKE') return list.filter((p) => Boolean(p.is_bespoke || p.category === 'tailored'));
    if (filterMode === 'READY') return list.filter((p) => !p.is_bespoke && p.category !== 'tailored');
    return list;
  }, [data, filterMode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center text-sm text-slate-500">
        Đang tải thông tin gian hàng thương hiệu...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4">
          <Store size={36} className="mx-auto text-slate-400" />
          <h1 className="text-lg font-black text-slate-900">Không tìm thấy Gian hàng</h1>
          <p className="text-xs text-slate-500">{error}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#14171C] text-white text-xs font-bold"
          >
            <ArrowLeft size={14} /> Về Sàn Thương Mại
          </Link>
        </div>
      </div>
    );
  }

  const { shop, reputation, products, reviews } = data;
  const tierMeta = TIER_BADGES[reputation.tier || 'REGULAR'];
  const isVacation = shop.operational_mode === 'VACATION';

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-950"
          >
            <ArrowLeft size={15} /> Quay lại Sàn Thời Trang FitVision 3D
          </Link>
          <span className="text-[11px] font-mono text-slate-400">/stores/{shop.brand_slug || slug}</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Vacation Alert Banner (Shopee/Lazada Holiday Mode) */}
        {isVacation && (
          <div className="rounded-2xl bg-amber-50 border border-amber-300 p-4 flex items-start gap-3">
            <PauseCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-amber-950">
                Gian hàng hiện đang ở chế độ Tạm nghỉ (Vacation Mode)
              </p>
              <p className="text-xs text-amber-800 mt-0.5">
                {shop.vacation_note ||
                  'Chủ shop đang tạm ngừng nhận đơn mới để xử lý đơn may đo tồn đọng hoặc nghỉ phép. Bạn vẫn có thể xem sản phẩm bên dưới.'}
                {shop.vacation_until && ` · Dự kiến mở lại: ${new Date(shop.vacation_until).toLocaleDateString('vi-VN')}`}
              </p>
            </div>
          </div>
        )}

        {/* Brand Hero & Shop Reputation Banner */}
        <section className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div
            className="h-36 sm:h-44 w-full bg-gradient-to-r from-[#14171C] via-slate-800 to-slate-900 relative"
            style={
              shop.banner_url
                ? { backgroundImage: `url(${shop.banner_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : undefined
            }
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
            <div className="absolute bottom-4 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border-2 border-white shadow-lg flex items-center justify-center text-slate-900 font-black text-2xl overflow-hidden">
                  {shop.logo_url ? (
                    <img src={shop.logo_url} alt={shop.shop_name} className="w-full h-full object-cover" />
                  ) : (
                    shop.shop_name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="text-white">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight">{shop.shop_name}</h1>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${tierMeta.cls}`}>
                      <BadgeCheck size={12} /> {tierMeta.label}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isVacation ? 'bg-amber-400 text-slate-950' : 'bg-emerald-500/90 text-white'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isVacation ? 'bg-slate-900' : 'bg-white'}`} />
                      {isVacation ? 'Tạm nghỉ' : 'Đang hoạt động'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 mt-1">
                    {shop.tagline || 'Thương hiệu thời trang & may đo AI 3D chuẩn số đo trên FitVision 3D'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4-Metric Shop Reputation Strip (Shopee/Lazada style) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 bg-white">
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Star size={18} className="fill-amber-400 text-amber-500" />
              </div>
              <div>
                <div className="text-base font-black text-slate-950">
                  {reputation.ratingAvg.toFixed(1)} <span className="text-xs font-semibold text-slate-400">/ 5.0</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Đánh giá tổng quan ({reputation.ratingCount} lượt)
                </div>
              </div>
            </div>

            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <MessageSquare size={18} />
              </div>
              <div>
                <div className="text-base font-black text-slate-950">{reputation.responseRate}%</div>
                <div className="text-[11px] text-slate-500">Tỷ lệ phản hồi đánh giá</div>
              </div>
            </div>

            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Package size={18} />
              </div>
              <div>
                <div className="text-base font-black text-slate-950">{reputation.activeProductsCount}</div>
                <div className="text-[11px] text-slate-500">Sản phẩm đang mở bán</div>
              </div>
            </div>

            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div>
                <div className="text-xs font-black text-slate-950 flex items-center gap-1">
                  <CheckCircle2 size={13} className="text-emerald-600" /> Đã Xác Thực KYC
                </div>
                <div className="text-[11px] text-slate-500 truncate max-w-[180px]" title={shop.shop_address}>
                  <MapPin size={10} className="inline mr-0.5" /> {shop.shop_address}
                </div>
              </div>
            </div>
          </div>

          {(shop.description || shop.phone_number) && (
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
              <span>{shop.description || 'Cung cấp sản phẩm thời trang chuẩn nhân trắc học 3D.'}</span>
              {shop.phone_number && (
                <span className="font-mono font-bold text-slate-800 inline-flex items-center gap-1">
                  <Phone size={12} /> {shop.phone_number}
                </span>
              )}
            </div>
          )}
        </section>

        {/* Product Filter & Grid */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-black text-slate-950">
              Bộ Sưu Tập Của {shop.shop_name} ({filteredProducts.length})
            </h2>
            <div className="flex items-center gap-2">
              {(['ALL', 'READY', 'BESPOKE'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setFilterMode(m)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition ${
                    filterMode === m ? 'bg-[#14171C] text-white' : 'bg-white border border-slate-200 text-slate-700'
                  }`}
                >
                  {m === 'ALL' ? 'Tất cả' : m === 'READY' ? 'May sẵn' : 'May đo 3D Bespoke'}
                </button>
              ))}
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-xs text-slate-500">
              Gian hàng chưa có sản phẩm phù hợp bộ lọc này.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((p) => (
                <Link
                  key={p.id}
                  to={`/?product=${encodeURIComponent(p.id)}`}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition group flex flex-col"
                >
                  <div className="aspect-[4/5] bg-slate-100 relative overflow-hidden">
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                    />
                    {p.is_bespoke && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-[9px] font-black uppercase">
                        <Sparkles size={9} className="inline mr-0.5" /> Bespoke
                      </span>
                    )}
                  </div>
                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 line-clamp-2">{p.name}</h3>
                      <div className="flex items-center gap-1 text-[11px] text-slate-600 mt-1">
                        <Star size={11} className="fill-amber-400 text-amber-400" />
                        <span className="font-bold">{Number(p.rating || 5).toFixed(1)}</span>
                        <span className="text-slate-400">({p.reviews_count || 0})</span>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-black text-slate-950">
                        {Number(p.sale_price || p.price).toLocaleString('vi-VN')} ₫
                      </span>
                      {p.sale_price && (
                        <span className="text-[11px] text-slate-400 line-through">
                          {Number(p.price).toLocaleString('vi-VN')} ₫
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Recent Shop Reviews */}
        {reviews.length > 0 && (
          <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-sm font-black text-slate-950 flex items-center gap-2">
              <Clock size={16} className="text-blue-600" /> Đánh Giá Gần Đây Về {shop.shop_name}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reviews.slice(0, 6).map((rev) => (
                <div key={rev.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">{rev.user_name}</span>
                    <span className="text-amber-500 font-bold">★ {rev.rating}.0</span>
                  </div>
                  {rev.product_name && (
                    <div className="text-[10px] font-semibold text-blue-700">{rev.product_name}</div>
                  )}
                  <p className="text-xs text-slate-700">{rev.comment}</p>
                  {rev.shop_reply && (
                    <p className="text-[11px] text-slate-600 bg-white rounded-lg p-2 border border-slate-200">
                      <b>Phản hồi Shop:</b> {rev.shop_reply}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

