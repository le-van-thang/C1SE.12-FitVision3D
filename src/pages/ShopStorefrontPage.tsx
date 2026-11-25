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
  X,
  ExternalLink,
  Ruler,
  Pencil,
} from 'lucide-react';
import { commerceApi, type DbProduct, type PublicStorefrontResponse } from '@/services/commerceApi';
import { useI18n } from '@/i18n';
import { useAuth } from '@/context/AuthContext';
import { formatPrepTimeLabel, isValidShopImageUrl } from '@/components/shop/settings/shopSettingsHelpers';

const TIER_BADGES: Record<'MALL' | 'PREFERRED' | 'REGULAR', { key: string; cls: string }> = {
  MALL: {
    key: 'shopStorefront.tierMall',
    cls: 'bg-rose-600 text-white border-rose-600',
  },
  PREFERRED: {
    key: 'shopStorefront.tierPreferred',
    cls: 'bg-amber-500 text-slate-950 border-amber-500',
  },
  REGULAR: {
    key: 'shopStorefront.tierRegular',
    cls: 'bg-emerald-600 text-white border-emerald-600',
  },
};

export const ShopStorefrontPage: React.FC = () => {
  const { t, locale, setLocale } = useI18n();
  const { currentUser, currentStore } = useAuth();
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<PublicStorefrontResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'ALL' | 'BESPOKE' | 'READY'>('ALL');
  const [selectedProduct, setSelectedProduct] = useState<DbProduct | null>(null);
  const [selectedColorHex, setSelectedColorHex] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');

  const openProductDetail = (p: DbProduct) => {
    setSelectedProduct(p);
    const firstVar = (p.variants || [])[0];
    setSelectedColorHex(firstVar?.color_hex || '');
    setSelectedSize(firstVar?.size_label || '');
  };

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
        {t('shopStorefront.loading')}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4">
          <Store size={36} className="mx-auto text-slate-400" />
          <h1 className="text-lg font-black text-slate-900">{t('shopStorefront.notFoundTitle')}</h1>
          <p className="text-xs text-slate-500">{error || t('shopStorefront.notFoundFallback')}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#14171C] text-white text-xs font-bold"
          >
            <ArrowLeft size={14} /> {t('shopStorefront.backMarketplace')}
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-950"
          >
            <ArrowLeft size={15} /> {t('shopStorefront.backToMall')}
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-[11px] font-mono text-slate-400">
              /stores/{shop.brand_slug || slug}
            </span>
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
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Vacation Alert Banner */}
        {isVacation && (
          <div className="rounded-2xl bg-amber-50 border border-amber-300 p-4 flex items-start gap-3">
            <PauseCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-amber-950">{t('shopStorefront.vacationTitle')}</p>
              <p className="text-xs text-amber-800 mt-0.5">
                {shop.vacation_note || t('shopStorefront.vacationDefaultNote')}
                {shop.vacation_until &&
                  ` · ${t('shopStorefront.vacationReopen')}: ${new Date(shop.vacation_until).toLocaleDateString(
                    locale === 'en' ? 'en-US' : 'vi-VN'
                  )}`}
              </p>
            </div>
          </div>
        )}

        {/* Brand Hero & Shop Reputation Banner (Safe <img> instead of CSS backgroundImage) */}
        <section className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="h-36 sm:h-44 w-full bg-[#14171C] relative overflow-hidden">
            {shop.banner_url && isValidShopImageUrl(shop.banner_url) && (
              <img
                src={shop.banner_url}
                alt={shop.shop_name}
                className="w-full h-full object-cover"
              />
            )}
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
                      <BadgeCheck size={12} /> {t(tierMeta.key)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isVacation ? 'bg-amber-400 text-slate-950' : 'bg-emerald-500/90 text-white'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isVacation ? 'bg-slate-900' : 'bg-white'}`} />
                      {isVacation ? t('shopStorefront.statusVacation') : t('shopStorefront.statusActive')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 mt-1">
                    {shop.tagline || t('shopStorefront.taglineFallback')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4-Metric Shop Reputation Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 bg-white">
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Star size={18} className="fill-amber-400 text-amber-500" />
              </div>
              <div>
                <div className="text-base font-black text-slate-950 font-mono tabular-nums">
                  {reputation.ratingAvg.toFixed(1)} <span className="text-xs font-semibold text-slate-400">/ 5.0</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {t('shopStorefront.metricRating')} ({reputation.ratingCount} {t('shopStorefront.metricReviewsUnit')})
                </div>
              </div>
            </div>

            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <MessageSquare size={18} />
              </div>
              <div>
                <div className="text-base font-black text-slate-950 font-mono tabular-nums">{reputation.responseRate}%</div>
                <div className="text-[11px] text-slate-500">{t('shopStorefront.metricResponse')}</div>
              </div>
            </div>

            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Package size={18} />
              </div>
              <div>
                <div className="text-base font-black text-slate-950 font-mono tabular-nums">{reputation.activeProductsCount}</div>
                <div className="text-[11px] text-slate-500">{t('shopStorefront.metricProducts')}</div>
              </div>
            </div>

            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div>
                <div className="text-xs font-black text-slate-950 flex items-center gap-1">
                  <CheckCircle2 size={13} className="text-emerald-600" /> {t('shopStorefront.metricKyc')}
                </div>
                <div className="text-[11px] text-slate-500 truncate max-w-[180px]" title={shop.shop_address}>
                  <MapPin size={10} className="inline mr-0.5" /> {shop.shop_address}
                </div>
                {shop.prep_time_days && (
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    <Clock size={10} className="inline mr-0.5" /> {t('shopStorefront.prepLabel')}:{' '}
                    {formatPrepTimeLabel(shop.prep_time_days, locale)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {(shop.description || shop.phone_number || shop.contact_email) && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 text-xs text-slate-600 leading-relaxed flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <p className="max-w-3xl">{shop.description || t('shopStorefront.taglineFallback')}</p>
              <div className="flex items-center gap-3 shrink-0 font-mono text-[11px] text-slate-700">
                {shop.phone_number && (
                  <span className="font-bold inline-flex items-center gap-1">
                    <Phone size={12} /> {shop.phone_number}
                  </span>
                )}
                {shop.contact_email && (
                  <span>
                    {t('shopStorefront.supportLabel')}: {shop.contact_email}
                  </span>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Product Filter & Grid */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-black text-slate-950">
              {t('shopStorefront.catalogTitle')} ({filteredProducts.length})
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
                  {m === 'ALL'
                    ? t('shopStorefront.filterAll')
                    : m === 'READY'
                      ? t('shopStorefront.filterReady')
                      : t('shopStorefront.filterBespoke')}
                </button>
              ))}
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-xs text-slate-500">
              {t('shopStorefront.emptyProducts')}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((p) => {
                const uniqueColors = Array.from(
                  new Map(
                    (p.variants || [])
                      .filter((v) => v.color_name || v.color_hex)
                      .map((v) => [
                        `${(v.color_hex || '').toLowerCase()}|${(v.color_name || '').toLowerCase()}`,
                        { name: v.color_name || '', hex: v.color_hex || '#CBD5E1' },
                      ])
                  ).values()
                );
                return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => openProductDetail(p)}
                  className="text-left bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md hover:border-slate-300 transition group flex flex-col cursor-pointer"
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
                      <div className="flex items-center gap-1 text-[11px] text-slate-600 mt-1 font-mono tabular-nums">
                        <Star
                          size={11}
                          className={
                            (p.reviews_count || 0) > 0
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }
                        />
                        <span className="font-bold">
                          {(p.reviews_count || 0) > 0 ? Number(p.rating ?? 0).toFixed(1) : '0.0'}
                        </span>
                        <span className="text-slate-400">({p.reviews_count || 0})</span>
                      </div>
                      {uniqueColors.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap mt-2">
                          {uniqueColors.slice(0, 6).map((col, ci) => (
                            <span
                              key={`${col.hex}-${ci}`}
                              title={col.name}
                              className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"
                              style={{ backgroundColor: col.hex }}
                            />
                          ))}
                          <span className="text-[10px] text-slate-500 ml-0.5 truncate max-w-[110px]">
                            {uniqueColors.length === 1
                              ? uniqueColors[0].name
                              : `${uniqueColors.length} ${locale === 'en' ? 'colors' : 'màu'}`}
                          </span>
                        </div>
                      )}
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
                </button>
                );
              })}
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

      {/* In-Page Product Detail Modal */}
      {selectedProduct && (() => {
        const variants = selectedProduct.variants || [];
        const uniqueColors = Array.from(
          new Map(
            variants
              .filter((v) => v.color_name || v.color_hex)
              .map((v) => [
                `${(v.color_hex || '').toLowerCase()}|${(v.color_name || '').toLowerCase()}`,
                {
                  name: v.color_name || (locale === 'en' ? 'Default' : 'Mặc định'),
                  hex: v.color_hex || '#14171C',
                  imageUrl: (v as any).image_url || selectedProduct.image_url,
                },
              ])
          ).values()
        );
        const activeColor =
          uniqueColors.find((c) => c.hex.toLowerCase() === selectedColorHex.toLowerCase()) ||
          uniqueColors[0];
        const uniqueSizes = Array.from(new Set(variants.map((v) => v.size_label).filter(Boolean)));
        const activeVariant = variants.find(
          (v) =>
            (!activeColor || (v.color_hex || '').toLowerCase() === activeColor.hex.toLowerCase()) &&
            (!selectedSize || v.size_label === selectedSize)
        );
        const displayImg = activeColor?.imageUrl || selectedProduct.image_url;

        return (
          <div
            className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4"
            onClick={() => setSelectedProduct(null)}
          >
            <div
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-slate-100 relative min-h-[280px]">
                <img
                  src={displayImg}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="md:hidden absolute top-3 right-3 p-2 rounded-full bg-white/90 text-slate-800 shadow cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {shop.shop_name} • {selectedProduct.category}
                      </span>
                      <h3 className="text-lg font-black text-slate-950 mt-0.5">{selectedProduct.name}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(null)}
                      className="hidden md:flex p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xl font-black font-mono text-slate-950">
                      {Number(selectedProduct.sale_price || selectedProduct.price).toLocaleString('vi-VN')} ₫
                    </span>
                    {selectedProduct.sale_price && (
                      <span className="text-xs font-mono text-slate-400 line-through">
                        {Number(selectedProduct.price).toLocaleString('vi-VN')} ₫
                      </span>
                    )}
                    <span className="ml-auto inline-flex items-center gap-1 text-xs font-mono text-slate-600">
                      <Star
                        size={12}
                        className={(selectedProduct.reviews_count || 0) > 0 ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                      />
                      {(selectedProduct.reviews_count || 0) > 0
                        ? Number(selectedProduct.rating ?? 0).toFixed(1)
                        : '0.0'}{' '}
                      ({selectedProduct.reviews_count || 0})
                    </span>
                  </div>

                  {uniqueColors.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <p className="text-xs font-bold text-slate-800">
                        {locale === 'en' ? 'Color' : 'Màu sắc'}:{' '}
                        <span className="font-semibold text-slate-600">{activeColor?.name}</span>
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {uniqueColors.map((col, idx) => {
                          const isSelected = activeColor?.hex.toLowerCase() === col.hex.toLowerCase();
                          return (
                            <button
                              key={`${col.hex}-${idx}`}
                              type="button"
                              onClick={() => setSelectedColorHex(col.hex)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border cursor-pointer ${
                                isSelected
                                  ? 'bg-[#14171C] text-white border-[#14171C]'
                                  : 'bg-white text-slate-700 border-slate-300 hover:border-slate-900'
                              }`}
                            >
                              <span
                                className="w-3 h-3 rounded-full border border-slate-300"
                                style={{ backgroundColor: col.hex }}
                              />
                              {col.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {uniqueSizes.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">Size</span>
                        {activeVariant && (
                          <span className="text-[11px] font-mono text-emerald-700 font-semibold">
                            {locale === 'en' ? `In stock: ${activeVariant.stock}` : `Còn hàng: ${activeVariant.stock} chiếc`}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {uniqueSizes.map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setSelectedSize(sz)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border cursor-pointer ${
                              selectedSize === sz
                                ? 'bg-[#14171C] text-white border-[#14171C]'
                                : 'bg-white text-slate-700 border-slate-300 hover:border-slate-900'
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                      {activeVariant?.spec && (
                        <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                          <p className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                            <Ruler size={11} />
                            {locale === 'en'
                              ? `Garment Specs — Size ${activeVariant.size_label}`
                              : `Thông số kích cỡ Size ${activeVariant.size_label} của Shop`}
                          </p>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-mono text-slate-800">
                            {Number(activeVariant.spec.chest_cm) > 0 && (
                              <span>
                                {locale === 'en' ? 'Chest' : 'Ngực'}: <b>{activeVariant.spec.chest_cm}cm</b>
                              </span>
                            )}
                            {Number(activeVariant.spec.waist_cm) > 0 && (
                              <span>
                                {locale === 'en' ? 'Waist' : 'Eo'}: <b>{activeVariant.spec.waist_cm}cm</b>
                              </span>
                            )}
                            {Number(activeVariant.spec.shoulder_cm) > 0 && (
                              <span>
                                {locale === 'en' ? 'Shoulder' : 'Vai'}: <b>{activeVariant.spec.shoulder_cm}cm</b>
                              </span>
                            )}
                            {Number((activeVariant.spec as any).hip_cm) > 0 && (
                              <span>
                                {locale === 'en' ? 'Hip' : 'Hông'}: <b>{(activeVariant.spec as any).hip_cm}cm</b>
                              </span>
                            )}
                            {Number(activeVariant.spec.length_cm) > 0 && (
                              <span>
                                {locale === 'en' ? 'Length' : 'Dài'}: <b>{activeVariant.spec.length_cm}cm</b>
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedProduct.fabric_material && (
                    <p className="text-xs text-slate-600">
                      <b>{locale === 'en' ? 'Fabric' : 'Chất liệu'}:</b> {selectedProduct.fabric_material}
                    </p>
                  )}

                  {selectedProduct.description && (
                    <p className="text-xs text-slate-600 leading-relaxed pt-1 border-t border-slate-100">
                      {selectedProduct.description}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 pt-3 border-t border-slate-100">
                  {Boolean(
                    (currentUser && shop.owner_id && currentUser.id === shop.owner_id) ||
                      (currentStore &&
                        (currentStore.id === shop.id ||
                          currentStore.brand_name?.toLowerCase() === shop.shop_name?.toLowerCase()))
                  ) ? (
                    <>
                      <Link
                        to="/shop"
                        className="w-full py-2.5 px-4 rounded-xl bg-[#14171C] hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Pencil size={13} />
                        {locale === 'en'
                          ? 'Manage / Edit Product in Seller Center'
                          : 'Quản Lý & Chỉnh Sửa tại Kênh Người Bán'}
                      </Link>
                      <p className="text-[10px] text-center text-slate-400">
                        {locale === 'en'
                          ? 'You are previewing your own shop storefront.'
                          : 'Bạn đang xem trước gian hàng công khai của chính mình.'}
                      </p>
                    </>
                  ) : (
                    <>
                      <Link
                        to={`/?product=${encodeURIComponent(selectedProduct.id)}`}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#14171C] hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <ExternalLink size={13} />
                        {locale === 'en'
                          ? 'Match Size with 3D Profile & Order'
                          : 'So Khớp Size Theo Số Đo 3D & Đặt Mua'}
                      </Link>
                      <p className="text-[10px] text-center text-slate-400">
                        {locale === 'en'
                          ? 'Compares these garment specs against your 3D body measurements on the marketplace.'
                          : 'Đối chiếu trực tiếp thông số áo ở trên với hồ sơ 3D của bạn tại Sàn.'}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

