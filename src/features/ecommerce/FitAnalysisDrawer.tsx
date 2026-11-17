import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Star,
  Copy,
  Check,
  ShieldCheck,
  RotateCcw,
  Plus,
  MessageSquare,
  Send,
  BadgeCheck,
} from 'lucide-react';
import type { FashionProduct, UserBodyProfile, FitMatchResult, ProductVariant } from './types';
import { MOCK_PRODUCTS } from './mockProducts';
import { useI18n } from '@/i18n';
import { useAuth } from '@/context/AuthContext';
import { commerceApi, type DbProductReview } from '@/services/commerceApi';
import { showGlobalToast } from '@/components/common/GlobalToastHost';

interface FitAnalysisDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  product: FashionProduct | null;
  selectedVariant: ProductVariant | null;
  userBody: UserBodyProfile;
  fitResult: FitMatchResult | null;
  onSelectSize: (variant: ProductVariant) => void;
  onAddToCart: () => void;
  onAddSuggestedToCart?: (product: FashionProduct, variant?: ProductVariant) => void;
  onOpenVirtualStudio?: () => void;
}

export const FitAnalysisDrawer: React.FC<FitAnalysisDrawerProps> = ({
  isOpen,
  onClose,
  product,
  selectedVariant,
  userBody,
  fitResult,
  onSelectSize,
  onAddToCart,
  onAddSuggestedToCart,
  onOpenVirtualStudio,
}) => {
  const { t, locale } = useI18n();
  const { isAuthenticated, currentUser, userRole, openSignIn } = useAuth();
  const [activeImage, setActiveImage] = useState<string>('');
  const [copiedVoucher, setCopiedVoucher] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [reviews, setReviews] = useState<DbProductReview[]>([]);
  const [liveRating, setLiveRating] = useState<number | null>(null);
  const [liveReviewsCount, setLiveReviewsCount] = useState<number | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyDraft, setReplyDraft] = useState<string>('');

  useEffect(() => {
    if (product) {
      setActiveImage(product.image_url);
      setOpenFaqIndex(0);
      setLiveRating(product.rating);
      setLiveReviewsCount(product.reviews_count);
      setReviewComment('');
      setReviewRating(5);
      commerceApi.getProductReviews(product.id).then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setReviews(res.data);
        }
      });
    }
  }, [product?.id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!isAuthenticated) {
      openSignIn();
      return;
    }
    if (reviewComment.trim().length < 3) {
      showGlobalToast({
        type: 'warning',
        title: 'Bình luận quá ngắn',
        message: 'Vui lòng nhập tối thiểu 3 ký tự nhận xét.',
      });
      return;
    }
    setIsSubmittingReview(true);
    const res = await commerceApi.createProductReview(product.id, {
      rating: reviewRating,
      comment: reviewComment.trim(),
      userName: currentUser?.full_name || currentUser?.email || 'Khách hàng',
    });
    setIsSubmittingReview(false);
    if (res.success && res.data) {
      setReviews((prev) => [res.data!.review, ...prev]);
      setLiveRating(res.data.rating);
      setLiveReviewsCount(res.data.reviews_count);
      setReviewComment('');
      showGlobalToast({
        type: 'success',
        title: 'Cảm ơn bạn đã đánh giá!',
        message: 'Đánh giá sao & bình luận đã được lưu vào PostgreSQL.',
      });
    } else {
      showGlobalToast({
        type: 'error',
        title: 'Không thể gửi đánh giá',
        message: res.error?.message || 'Vui lòng thử lại.',
      });
    }
  };

  const handleSendShopReply = async (reviewId: number) => {
    if (replyDraft.trim().length < 2) return;
    const res = await commerceApi.replyProductReview(reviewId, replyDraft.trim());
    if (res.success && res.data) {
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? res.data! : r)));
      setReplyingId(null);
      setReplyDraft('');
      showGlobalToast({
        type: 'success',
        title: 'Đã phản hồi khách hàng!',
        message: 'Phản hồi của Shop đã được lưu công khai.',
      });
    }
  };

  if (!isOpen || !product || !selectedVariant || !fitResult) return null;

  const spec = selectedVariant.spec;
  const isPants = product.category === 'pants';
  const isEn = locale === 'en';

  const verdictLabel = isEn && fitResult.verdict_label_en ? fitResult.verdict_label_en : fitResult.verdict_label_vi;
  const advisorAdvice = isEn && fitResult.advisor_advice_en ? fitResult.advisor_advice_en : fitResult.advisor_advice_vi;

  const galleryImages = [
    product.image_url,
    ...(product.secondary_image_url ? [product.secondary_image_url] : []),
  ];

  // Pick 2 complementary items for Mix & Match cross-sell
  const complementaryProducts = MOCK_PRODUCTS.filter((p) => {
    if (p.id === product.id) return false;
    if (product.category === 'pants') return ['shirt', 'polo', 'tailored'].includes(p.category);
    if (['shirt', 'polo', 'tailored'].includes(product.category)) return p.category === 'pants' || p.category === 'tailored';
    return true;
  }).slice(0, 2);

  const handleCopyVoucher = (code: string) => {
    navigator.clipboard?.writeText(code).catch(() => undefined);
    setCopiedVoucher(code);
    setTimeout(() => setCopiedVoucher(null), 1800);
  };

  const faqItems = [
    {
      q: isEn ? 'How does ISO 8559 3D Ease Allowance work?' : 'Độ cử động may đo 3D (Ease Allowance) hoạt động thế nào?',
      a: isEn
        ? 'Instead of raw tight body measurements, FitVision computes the difference between garment dimensions and your body contour (+3cm to +6cm) so the fabric drapes cleanly and moves naturally.'
        : 'Hệ thống so sánh từng thông số rập áo (ngực, vai, eo) với kích thước cơ thể bạn để giữ độ chùng lý tưởng (+3cm đến +6cm), đảm bảo vừa phom nhưng vẫn thoải mái cử động.',
    },
    {
      q: isEn ? 'Free 14-day size exchange guarantee?' : 'Chính sách đổi trả & chỉnh sửa size trong 14 ngày?',
      a: isEn
        ? 'Every item purchased using an AI Fit recommendation includes complimentary courier exchange or local tailor adjustment within 14 days.'
        : 'Mọi sản phẩm chọn theo size AI gợi ý đều được miễn phí đổi size tận nhà hoặc hỗ trợ chỉnh sửa số đo trong vòng 14 ngày.',
    },
    {
      q: isEn ? 'Fabric care instructions' : 'Hướng dẫn bảo quản chất liệu cao cấp',
      a: isEn
        ? `Material: ${product.fabric_material_en || product.fabric_material}. Wash cold on gentle cycle, steam iron on low, and dry in shade.`
        : `Chất liệu: ${product.fabric_material}. Giặt nước lạnh chế độ nhẹ, không sấy nhiệt cao và là hơi ở nhiệt độ vừa phải để giữ bền sợi vải.`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-xl bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          
          {/* Editorial Dark Header */}
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#14171C] text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm sm:text-base">
                  {t('ecommerce.drawer.fitTitle', 'Đối Chiếu Độ Vừa Vặn 3D')}
                </h3>
                <p className="text-[11px] text-slate-300">
                  {t('ecommerce.drawer.fitSubtitle', 'Chuẩn nhân trắc học may mặc ISO 8559-1')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              aria-label="Close product fit drawer"
            >
              <X size={17} />
            </button>
          </div>

          {/* Scrollable Body Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-[#FAFAFB]">
            
            {/* 1. Product Gallery & Editorial Header (PDP Style) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
              <div className="flex gap-4">
                {/* Thumbnail strip + Primary photo */}
                <div className="flex gap-2 flex-shrink-0">
                  {galleryImages.length > 1 && (
                    <div className="flex flex-col gap-2">
                      {galleryImages.map((imgUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveImage(imgUrl)}
                          className={`w-11 h-14 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                            activeImage === imgUrl ? 'border-blue-600' : 'border-slate-200 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                  <img
                    src={activeImage || product.image_url}
                    alt={product.name}
                    className="w-24 sm:w-28 h-32 sm:h-36 object-cover object-top rounded-xl border border-slate-200 flex-shrink-0"
                  />
                </div>

                {/* Title, Rating, Price & Freeship */}
                <div className="min-w-0 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {product.is_mall && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider">
                            <BadgeCheck size={10} />
                            <span>MALL</span>
                          </span>
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                          {product.brand_name}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700">
                        <Star size={11} className="fill-amber-400 text-amber-400" />
                        <span>{(liveRating ?? product.rating).toFixed(1)}</span>
                        <span className="text-slate-400 font-normal">({liveReviewsCount ?? product.reviews_count})</span>
                      </span>
                    </div>

                    <h4 className="font-display text-base sm:text-lg font-bold text-slate-950 leading-snug mt-0.5">
                      {isEn && product.name_en ? product.name_en : product.name}
                    </h4>

                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                      {isEn && product.fabric_material_en ? product.fabric_material_en : product.fabric_material}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap mt-2">
                    <span className="font-black text-base text-rose-600">
                      {(product.sale_price || product.price).toLocaleString('vi-VN')} ₫
                    </span>
                    {product.sale_price && (
                      <span className="text-xs text-slate-400 line-through">
                        {product.price.toLocaleString('vi-VN')} ₫
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Freeship
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 leading-relaxed mt-3 pt-3 border-t border-slate-100">
                {isEn && product.description_en ? product.description_en : product.description}
              </p>

              {/* Copyable Voucher Chips */}
              <div className="flex items-center justify-between gap-2 flex-wrap mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1">
                    {isEn ? 'Vouchers:' : 'Mã ưu đãi:'}
                  </span>
                  {['FITVISION50', 'TAILOR100'].map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => handleCopyVoucher(code)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F5EBD8]/70 hover:bg-[#F5EBD8] border border-dashed border-[#C8963E] text-[10px] font-mono font-bold text-slate-900 cursor-pointer transition-colors"
                    >
                      <span>{code}</span>
                      {copiedVoucher === code ? <Check size={11} className="text-emerald-600" /> : <Copy size={10} className="text-slate-500" />}
                    </button>
                  ))}
                </div>

                {onOpenVirtualStudio && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenVirtualStudio();
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[11px] font-bold cursor-pointer"
                  >
                    <Sparkles size={11} />
                    <span>{isEn ? 'Try in 3D' : 'Thử đồ 3D'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* 2. Match Score Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-white border border-emerald-500/25 shadow-2xs">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <span className="font-bold text-emerald-900 text-sm">
                    {verdictLabel}
                  </span>
                </div>
                <span className="font-mono text-xl font-black text-emerald-700">
                  {fitResult.match_percentage}%
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {advisorAdvice}
              </p>
            </div>

            {/* 3. Size Selector */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {t('ecommerce.drawer.selectSize', 'Chọn kích cỡ đối chiếu:')}
                </label>
                <span className="text-[11px] font-semibold text-slate-500">
                  {selectedVariant.color_name.split('(')[0].trim()}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {product.variants.map((v) => {
                  const isSelected = v.id === selectedVariant.id || v.size_label === selectedVariant.size_label;
                  const isRecommended = v.size_label === fitResult.recommended_size;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => onSelectSize(v)}
                      className={`relative py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#14171C] text-white border-[#14171C] shadow-sm'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-blue-400 hover:text-blue-700'
                      }`}
                    >
                      {v.size_label}
                      {isRecommended && (
                        <span className="absolute -top-2 -right-1 px-1.5 py-0.5 bg-emerald-600 text-white text-[9px] font-extrabold rounded-full shadow-2xs">
                          AI
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Detailed Delta Metrics Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                <span>{t('ecommerce.drawer.metricsTitle', 'So Sánh Chi Tiết Chỉ Số (cm)')}</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {t('ecommerce.drawer.metricsSub', 'Cơ thể vs Áo thực tế')}
                </span>
              </h4>

              {!isPants && (
                <>
                  <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">
                        {t('ecommerce.drawer.chest', 'Vòng ngực (Bust/Chest)')}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {t('ecommerce.drawer.bodyLabel', 'Cơ thể:')} <b className="font-mono text-slate-800">{userBody.chest_cm}cm</b> ➔ {t('ecommerce.drawer.garmentLabel', 'Áo:')}{' '}
                        <b className="font-mono text-slate-800">{spec.chest_cm}cm</b>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800">
                        {spec.chest_cm - userBody.chest_cm >= 0 ? '+' : ''}{spec.chest_cm - userBody.chest_cm} cm
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">
                        {t('ecommerce.drawer.easeSmooth', 'Độ cử động êm')}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">
                        {t('ecommerce.drawer.shoulder', 'Rộng vai (Shoulder)')}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {t('ecommerce.drawer.bodyLabel', 'Cơ thể:')} <b className="font-mono text-slate-800">{userBody.shoulder_cm}cm</b> ➔ {t('ecommerce.drawer.garmentLabel', 'Áo:')}{' '}
                        <b className="font-mono text-slate-800">{spec.shoulder_cm}cm</b>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-100 text-blue-800">
                        {spec.shoulder_cm - userBody.shoulder_cm >= 0 ? '+' : ''}{(spec.shoulder_cm - userBody.shoulder_cm).toFixed(1)} cm
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">
                        {t('ecommerce.drawer.shoulderFit', 'Vừa khít cầu vai')}
                      </span>
                    </div>
                  </div>
                </>
              )}

              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">
                    {t('ecommerce.drawer.waist', 'Vòng eo (Waist)')}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {t('ecommerce.drawer.bodyLabel', 'Cơ thể:')} <b className="font-mono text-slate-800">{userBody.waist_cm}cm</b> ➔ {t('ecommerce.drawer.pantWaistLabel', 'Phom:')}{' '}
                    <b className="font-mono text-slate-800">{spec.waist_cm}cm</b>
                  </span>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800">
                    {spec.waist_cm - userBody.waist_cm >= 0 ? '+' : ''}{spec.waist_cm - userBody.waist_cm} cm
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">
                    {t('ecommerce.drawer.waistComfort', 'Thoải mái khi ngồi')}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">
                    {t('ecommerce.drawer.length', 'Chiều dài trang phục')}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {t('ecommerce.drawer.lengthSub', 'Chuẩn may đo thiết kế')}
                  </span>
                </div>
                <span className="font-mono font-bold text-slate-800 text-xs">
                  {spec.length_cm} cm
                </span>
              </div>
            </div>

            {/* 5. Mix & Match Cross-Sell Suggestions (Torano-style Cross-Sell) */}
            {onAddSuggestedToCart && complementaryProducts.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                    {isEn ? 'Complete the 3D Look' : 'Mua Kèm Phối Bộ Chuẩn Phom'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                    {isEn ? 'Combo Savings' : 'Phối đồ gợi ý'}
                  </span>
                </div>
                <div className="space-y-2">
                  {complementaryProducts.map((comp) => (
                    <div
                      key={comp.id}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={comp.image_url}
                          alt={comp.name}
                          className="w-11 h-14 object-cover rounded-lg border border-slate-200 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-slate-900 truncate">
                            {isEn && comp.name_en ? comp.name_en : comp.name}
                          </h5>
                          <p className="text-[11px] font-bold text-rose-600 mt-0.5">
                            {(comp.sale_price || comp.price).toLocaleString('vi-VN')} ₫
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onAddSuggestedToCart(comp, comp.variants[1] || comp.variants[0])}
                        className="px-2.5 py-1.5 rounded-lg bg-[#14171C] hover:bg-blue-600 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer flex-shrink-0 transition-colors"
                      >
                        <Plus size={12} />
                        <span>{isEn ? 'Add' : 'Thêm'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. FAQ Accordion */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
              {faqItems.map((faq, idx) => {
                const isOpenItem = openFaqIndex === idx;
                return (
                  <div key={idx}>
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpenItem ? null : idx)}
                      className="w-full px-4 py-3 text-left flex items-center justify-between gap-2 text-xs font-bold text-slate-900 hover:bg-slate-50 cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        size={14}
                        className={`text-slate-400 transition-transform flex-shrink-0 ${isOpenItem ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {isOpenItem && (
                      <div className="px-4 pb-3 text-[11px] text-slate-600 leading-relaxed">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 7. Customer Star Ratings & Product Comments (PostgreSQL) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3.5">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <MessageSquare size={15} className="text-blue-600" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                    {isEn ? 'Customer Reviews & Comments' : 'Đánh Giá & Bình Luận Sản Phẩm'}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-slate-800">
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                  <span>{(liveRating ?? product.rating).toFixed(1)}</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    ({reviews.length} {isEn ? 'comments' : 'bình luận'})
                  </span>
                </div>
              </div>

              {/* Submit Review Form */}
              <form onSubmit={handleSubmitReview} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-700">
                    {isEn ? 'Your Rating:' : 'Chọn số sao đánh giá:'}
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="p-0.5 bg-transparent border-0 cursor-pointer"
                        aria-label={`${star} sao`}
                      >
                        <Star
                          size={15}
                          className={star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder={
                      isAuthenticated
                        ? isEn
                          ? 'Write your comment about fabric, fit & size...'
                          : 'Chia sẻ cảm nhận về chất vải, phom dáng & độ vừa...'
                        : isEn
                        ? 'Sign in to write a review...'
                        : 'Đăng nhập để viết đánh giá & bình luận...'
                    }
                    className="flex-1 h-9 px-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="px-3.5 h-9 rounded-lg bg-[#14171C] hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 transition disabled:opacity-50"
                  >
                    <Send size={12} />
                    <span>{isAuthenticated ? (isEn ? 'Post' : 'Gửi') : (isEn ? 'Sign In' : 'Đăng nhập')}</span>
                  </button>
                </div>
              </form>

              {/* Review List */}
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {reviews.length === 0 ? (
                  <p className="text-[11px] text-slate-500 text-center py-3">
                    {isEn ? 'No reviews yet. Be the first to review!' : 'Chưa có bình luận nào. Hãy là người đầu tiên đánh giá sản phẩm này!'}
                  </p>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev.id} className="p-3 rounded-xl bg-[#F7F7F5] border border-slate-200/70 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-900">{rev.user_name}</span>
                          {rev.is_verified_purchase && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9.5px] font-bold">
                              <CheckCircle2 size={10} />
                              <span>{isEn ? 'Verified Purchase' : 'Đã mua hàng'}</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={10}
                              className={s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{rev.comment}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>{new Date(rev.created_at).toLocaleDateString('vi-VN')}</span>
                        {(userRole === 'store' || userRole === 'admin') && !rev.shop_reply && (
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingId(rev.id);
                              setReplyDraft('');
                            }}
                            className="text-blue-600 font-bold hover:underline cursor-pointer bg-transparent border-0"
                          >
                            Phản hồi của Shop
                          </button>
                        )}
                      </div>

                      {rev.shop_reply && (
                        <div className="mt-1.5 p-2 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-700">
                          <span className="font-bold text-blue-700">Phản hồi của Shop: </span>
                          <span>{rev.shop_reply}</span>
                        </div>
                      )}

                      {replyingId === rev.id && (
                        <div className="flex gap-1.5 pt-1">
                          <input
                            type="text"
                            value={replyDraft}
                            onChange={(e) => setReplyDraft(e.target.value)}
                            placeholder="Nhập phản hồi tới khách hàng..."
                            className="flex-1 h-7 px-2 rounded bg-white border border-slate-300 text-[11px]"
                          />
                          <button
                            type="button"
                            onClick={() => handleSendShopReply(rev.id)}
                            className="px-2.5 h-7 rounded bg-blue-600 text-white text-[11px] font-bold cursor-pointer"
                          >
                            Gửi
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Footer Actions + Compact Trust Strip */}
          <div className="p-5 border-t border-slate-200 bg-white space-y-2.5">
            <button
              type="button"
              onClick={() => {
                onAddToCart();
                onClose();
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-[#14171C] hover:bg-blue-600 active:scale-[0.98] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>
                {t('ecommerce.drawer.addToCartSize', 'Thêm Size {size} Vào Giỏ Hàng').replace('{size}', selectedVariant.size_label)}
              </span>
              <ChevronRight size={16} />
            </button>
            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <ShieldCheck size={13} className="text-emerald-600" />
                <span>{isEn ? 'ISO 8559 Calibrated' : 'Chuẩn ISO 8559-1'}</span>
              </span>
              <span className="flex items-center gap-1">
                <RotateCcw size={12} className="text-blue-600" />
                <span>{isEn ? '14-Day Free Fit Swap' : 'Đổi size 14 ngày miễn phí'}</span>
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

