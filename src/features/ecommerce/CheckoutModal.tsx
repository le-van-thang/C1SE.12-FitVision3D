import React, { useState, useEffect } from 'react';
import {
  X,
  ShoppingBag,
  MapPin,
  Phone,
  User,
  CreditCard,
  Banknote,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Truck,
  Tag,
} from 'lucide-react';
import type { CartItem, PaymentMethod, UserBodyProfile, Order, OrderMeasurementSnapshot } from './types';
import { useAuth } from '@/context/AuthContext';
import { useOrders } from '@/context/OrderContext';
import { useI18n } from '@/i18n';
import { loadPlatformConfig } from '@/services/platformConfig';
import { commerceApi } from '@/services/commerceApi';
import { loadFullScanSnapshot } from '@/utils/bodyProfileStorage';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onClearCart: () => void;
  userBody?: UserBodyProfile;
  hasBodyProfile?: boolean;
  onOpenMyOrders?: () => void;
  onBackToCart?: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  onClearCart,
  userBody,
  hasBodyProfile = false,
  onOpenMyOrders,
  onBackToCart,
}) => {
  const { currentUser, isAuthenticated, getUserProfileDetails, openSignIn } = useAuth();
  const { createOrder, refreshOrders } = useOrders();
  const { t, locale } = useI18n();

  const [step, setStep] = useState<'checkout' | 'success'>('checkout');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [createdOrders, setCreatedOrders] = useState<Order[]>([]);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentCheckMessage, setPaymentCheckMessage] = useState<string | null>(null);

  const savedDetails = getUserProfileDetails(currentUser?.id);

  // Form Fields (zero hardcoded PII — populated only from authenticated user's own profile)
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [phone, setPhone] = useState(savedDetails?.phone || '');
  const [city, setCity] = useState(savedDetails?.city || '');
  const [address, setAddress] = useState(savedDetails?.address || '');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('vietqr_sepay');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [qrImgFailed, setQrImgFailed] = useState(false);

  // Coupon code
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  // Copy states
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [hasConfirmedTransfer, setHasConfirmedTransfer] = useState(false);

  // Sync recipient PII strictly per signed-in user & clear stale voucher/discount when opening or closing
  useEffect(() => {
    if (isOpen) {
      const details = getUserProfileDetails(currentUser?.id);
      setFullName(currentUser?.full_name || '');
      setPhone(details?.phone || '');
      setCity(details?.city || '');
      setAddress(details?.address || '');
      setNote('');
      setFormError(null);
      setCouponCode('');
      setAppliedDiscount(0);
      setCouponError(null);
      setCouponSuccess(null);
      setStep('checkout');
      setCreatedOrder(null);
      setCreatedOrders([]);
      setHasConfirmedTransfer(false);
      setPaymentCheckMessage(null);
      setIsSubmitting(false);
      setQrImgFailed(false);
    } else {
      setCouponCode('');
      setAppliedDiscount(0);
      setCouponError(null);
      setCouponSuccess(null);
      setFormError(null);
      setStep('checkout');
      setCreatedOrder(null);
      setCreatedOrders([]);
      setHasConfirmedTransfer(false);
      setPaymentCheckMessage(null);
      setIsSubmitting(false);
      setQrImgFailed(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentUser?.id]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  // Real-time SePay Webhook polling when awaiting VietQR payment
  useEffect(() => {
    if (
      !isOpen ||
      step !== 'success' ||
      !createdOrder ||
      createdOrder.payment_method !== 'vietqr_sepay' ||
      createdOrder.payment_status === 'paid' ||
      hasConfirmedTransfer
    ) {
      return;
    }

    let active = true;
    const timer = setInterval(async () => {
      const res = await commerceApi.getOrders();
      if (!active || !res.success || !Array.isArray(res.data)) return;
      const fresh = res.data.find((o) => o.id === createdOrder.id);
      if (fresh && fresh.payment_status === 'paid') {
        setCreatedOrder(fresh);
        setHasConfirmedTransfer(true);
      }
    }, 3000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [isOpen, step, createdOrder, hasConfirmedTransfer]);

  if (!isOpen) return null;

  const subtotal = items.reduce(
    (sum, item) => sum + (item.product.sale_price || item.product.price) * item.quantity,
    0
  );
  const normalizedAppliedCoupon = appliedDiscount > 0 ? couponCode.trim().toUpperCase() : '';
  const isFreeShipping = subtotal >= 1_000_000 || normalizedAppliedCoupon === 'FREESHIP3D';
  const shippingFee = items.length === 0 || isFreeShipping ? 0 : 30_000;
  const totalAmount = Math.max(0, subtotal - appliedDiscount + shippingFee);

  const shopGroups = items.reduce<Record<string, { storeName: string; items: CartItem[] }>>((acc, item) => {
    const key = item.product.shop_id
      ? `id:${item.product.shop_id}`
      : `brand:${(item.product.brand_name || 'FitVision Atelier').trim().toLowerCase()}`;
    if (!acc[key]) {
      acc[key] = { storeName: item.product.brand_name || 'FitVision Atelier', items: [] };
    }
    acc[key].items.push(item);
    return acc;
  }, {});
  const shopGroupList = Object.values(shopGroups);

  const availableVouchers = loadPlatformConfig().vouchers.filter((v) => v.active);

  const applyVoucherByCode = (rawCode: string) => {
    setCouponError(null);
    setCouponSuccess(null);

    const code = rawCode.trim().toUpperCase();
    setCouponCode(code);
    if (!code) {
      setAppliedDiscount(0);
      setCouponError(locale === 'en' ? 'Please enter a coupon code.' : 'Vui lòng nhập mã giảm giá.');
      return;
    }

    const activeVouchers = loadPlatformConfig().vouchers;
    const matchedVoucher = activeVouchers.find((v) => v.code.toUpperCase() === code && v.active);

    if (matchedVoucher) {
      if (matchedVoucher.code.toUpperCase() === 'FITVISION50' && subtotal < 600_000) {
        setAppliedDiscount(0);
        setCouponError('Mã FITVISION50 chỉ áp dụng cho đơn từ 600.000₫.');
        return;
      }
      if (matchedVoucher.code.toUpperCase() === 'TAILOR100' && !items.some((it) => Boolean(it.product?.is_bespoke))) {
        setAppliedDiscount(0);
        setCouponError('Mã TAILOR100 chỉ áp dụng cho đơn có sản phẩm May đo Bespoke.');
        return;
      }
      const discount =
        matchedVoucher.discountType === 'percent'
          ? Math.min(subtotal, Math.round((subtotal * matchedVoucher.discountValue) / 100))
          : Math.min(subtotal, matchedVoucher.discountValue);
      setAppliedDiscount(discount);
      const label =
        matchedVoucher.discountType === 'percent'
          ? `-${matchedVoucher.discountValue}%`
          : `-${discount.toLocaleString('vi-VN')} ₫`;
      setCouponSuccess(
        locale === 'en'
          ? `Applied voucher ${matchedVoucher.code} (${label}: -${discount.toLocaleString('vi-VN')} ₫)`
          : `Đã áp dụng mã ${matchedVoucher.code} (${label}: -${discount.toLocaleString('vi-VN')} ₫)`
      );
    } else {
      setAppliedDiscount(0);
      setCouponError(locale === 'en' ? 'Coupon code is invalid or expired.' : 'Mã giảm giá không hợp lệ hoặc đã hết hạn.');
    }
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    applyVoucherByCode(couponCode);
  };

  const handleClearCoupon = () => {
    setCouponCode('');
    setAppliedDiscount(0);
    setCouponError(null);
    setCouponSuccess(null);
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setFormError(null);

    if (!isAuthenticated || !currentUser?.id) {
      openSignIn();
      return;
    }
    if (items.length === 0) {
      setFormError(
        locale === 'en'
          ? 'No products selected for checkout.'
          : 'Không có sản phẩm nào được chọn để thanh toán.'
      );
      return;
    }
    if (!fullName.trim() || !phone.trim() || !address.trim() || !city.trim()) {
      setFormError(
        locale === 'en'
          ? 'Please enter full recipient name, phone number, city, and delivery address.'
          : 'Vui lòng điền đầy đủ họ tên, số điện thoại, tỉnh/thành phố và địa chỉ nhận hàng.'
      );
      return;
    }

    const fullScan = loadFullScanSnapshot(currentUser.id);
    let measurementSnapshot: OrderMeasurementSnapshot | null = null;

    if (fullScan) {
      measurementSnapshot = {
        stature_cm: fullScan.biometric.stature_cm,
        weight_kg: fullScan.biometric.weight_kg,
        gender: fullScan.biometric.gender,
        calculated_bmi: fullScan.biometric.calculated_bmi ?? undefined,
        chest_circ_cm: fullScan.measurement.chest_circ_cm,
        waist_circ_cm: fullScan.measurement.waist_circ_cm,
        hip_circ_cm: fullScan.measurement.hip_circ_cm,
        shoulder_breadth_cm: fullScan.measurement.shoulder_breadth_cm ?? null,
        arm_length_cm: fullScan.measurement.arm_length_cm ?? null,
        inseam_cm: fullScan.measurement.inseam_cm ?? null,
        bicep_circ_cm: fullScan.measurement.bicep_circ_cm ?? null,
        wrist_circ_cm: fullScan.measurement.wrist_circ_cm ?? null,
        thigh_circ_cm: fullScan.measurement.thigh_circ_cm ?? null,
        calf_circ_cm: fullScan.measurement.calf_circ_cm ?? null,
        ankle_circ_cm: fullScan.measurement.ankle_circ_cm ?? null,
        source: 'scan',
        captured_at: fullScan.updatedAt,
      };
    } else if (hasBodyProfile && userBody && userBody.height_cm > 0 && userBody.chest_cm > 0) {
      const hM = userBody.height_cm / 100;
      measurementSnapshot = {
        stature_cm: userBody.height_cm,
        weight_kg: userBody.weight_kg,
        gender: userBody.gender,
        calculated_bmi: hM > 0 ? Math.round((userBody.weight_kg / (hM * hM)) * 100) / 100 : undefined,
        chest_circ_cm: userBody.chest_cm,
        waist_circ_cm: userBody.waist_cm,
        hip_circ_cm: userBody.hip_cm,
        shoulder_breadth_cm: userBody.shoulder_cm ?? null,
        arm_length_cm: userBody.arm_length_cm ?? null,
        inseam_cm: userBody.inseam_cm ?? null,
        source: userBody.source || 'manual',
        captured_at: userBody.updated_at || new Date().toISOString(),
      };
    }

    setIsSubmitting(true);
    try {
      const placedOrders: Order[] = [];
      let lastResult: { success: boolean; order?: Order; error?: string } = {
        success: false,
      };
      for (let idx = 0; idx < shopGroupList.length; idx++) {
        const group = shopGroupList[idx];
        const groupSubtotal = group.items.reduce(
          (sum, item) => sum + (item.product.sale_price || item.product.price) * item.quantity,
          0
        );
        const groupHasBespoke = group.items.some((it) => Boolean(it.product?.is_bespoke));
        const applyCouponHere = idx === 0 && normalizedAppliedCoupon ? normalizedAppliedCoupon : undefined;
        const groupShipping = groupSubtotal >= 1_000_000 || applyCouponHere === 'FREESHIP3D' ? 0 : 30_000;
        const groupDiscount = idx === 0 ? Math.min(groupSubtotal, appliedDiscount) : 0;

        const result = await createOrder({
          customer_id: currentUser.id,
          customer_name: fullName.trim(),
          recipient: {
            full_name: fullName.trim(),
            phone: phone.trim(),
            address: address.trim(),
            city: city.trim(),
            note: note.trim(),
          },
          items: [...group.items],
          coupon_code: applyCouponHere,
          subtotal: groupSubtotal,
          shipping_fee: groupShipping,
          discount_amount: groupDiscount,
          total_amount: Math.max(0, groupSubtotal - groupDiscount + groupShipping),
          payment_method: paymentMethod,
          store_name: group.storeName,
          has_bespoke_items: groupHasBespoke,
          measurement_snapshot: groupHasBespoke ? measurementSnapshot : null,
        });

        lastResult = result;
        if (!result.success || !result.order) {
          setFormError(
            result.error ||
              (locale === 'en'
                ? 'Could not place order. Please review stock availability and try again.'
                : 'Đặt hàng thất bại. Vui lòng kiểm tra tồn kho hoặc thông tin thanh toán.')
          );
          return;
        }
        placedOrders.push(result.order);
      }

      const result = {
        success: placedOrders.length > 0 && lastResult.success,
        order: placedOrders[0],
      };
      if (result.success && result.order) {
        setCreatedOrders(placedOrders);
        setCreatedOrder(result.order);
        onClearCart();
        setStep('success');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmTransfer = async () => {
    if (!createdOrder) return;
    setCheckingPayment(true);
    setPaymentCheckMessage(null);
    try {
      const freshList = await refreshOrders();
      const fresh = freshList.find((o) => o.id === createdOrder.id);
      if (fresh && fresh.payment_status === 'paid') {
        setCreatedOrder(fresh);
        setHasConfirmedTransfer(true);
        setPaymentCheckMessage('Hệ thống đã ghi nhận thanh toán thành công!');
      } else {
        setPaymentCheckMessage(
          'Chưa thấy giao dịch SePay về hệ thống. Hệ thống tự kiểm tra mỗi 3 giây hoặc bạn có thể xem trạng thái trong Lịch sử đơn hàng.'
        );
      }
    } finally {
      setCheckingPayment(false);
    }
  };

  const handleCloseAll = () => {
    setStep('checkout');
    setCreatedOrder(null);
    setHasConfirmedTransfer(false);
    setCouponCode('');
    setAppliedDiscount(0);
    setCouponError(null);
    setCouponSuccess(null);
    setFormError(null);
    onClose();
  };

  const bankAccount = {
    bankName: locale === 'en' ? 'MB Bank (Merchant Escrow)' : 'MB Bank (Tài khoản Thu Hộ FitVision)',
    accountNumber: import.meta.env.VITE_SEPAY_ACCOUNT_NO || '33822222622222',
    accountHolder: import.meta.env.VITE_SEPAY_ACCOUNT_NAME || 'FITVISION 3D ATELIER',
    transferContent: createdOrder ? `FV3D ${createdOrder.id.replace('FV3D-', '')}` : 'FV3D DH',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/75 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={handleCloseAll}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border-2 border-slate-300 overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh] my-auto">
        
        {/* Top Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shadow-xs">
              <ShoppingBag size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">
                {step === 'checkout' ? t('ecommerce.checkout.modalTitleCheckout', 'Quy Trình Thanh Toán & Đặt May Đo') : t('ecommerce.checkout.modalTitleSuccess', 'Đặt Hàng & Thanh Toán Thành Công')}
              </h2>
              <p className="text-[11px] text-blue-100 font-medium">
                {step === 'checkout'
                  ? t('ecommerce.checkout.modalSubCheckout', 'Chuẩn hóa số đo nhân trắc học ISO 8559 & Giao hàng tận nơi')
                  : `${t('ecommerce.checkout.orderCode', 'Mã đơn:')} ${createdOrder?.id || ''} · FitVision 3D`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCloseAll}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* STEP 1: CHECKOUT FORM */}
          {step === 'checkout' && (
            <form onSubmit={handleSubmitOrder} className="space-y-6">
              {shopGroupList.length > 1 && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold">
                  Giỏ hàng gồm {shopGroupList.length} gian hàng khác nhau — hệ thống sẽ tự tách thành {shopGroupList.length} mã đơn riêng để mỗi Shop xử lý độc lập.
                </div>
              )}
              
              {/* 1. Tóm tắt sản phẩm trong đơn */}
              <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-800 tracking-wider">
                    {t('ecommerce.checkout.orderSummary', 'Sản Phẩm Trong Đơn')} ({items.length})
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles size={11} /> {t('ecommerce.checkout.fitMatched', 'Đã so khớp số đo vừa vặn')}
                  </span>
                </div>

                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-2.5"
                    >
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-12 h-14 object-cover rounded-lg border border-slate-100 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {locale === 'en' && item.product.name_en ? item.product.name_en : item.product.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          <span className="font-semibold text-blue-700">{t('ecommerce.checkout.sizePrefix', 'Cỡ:')} {item.variant.size_label}</span>
                          <span>·</span>
                          <span>{t('ecommerce.orders.qtyPrefix', 'SL:')} {item.quantity}</span>
                          <span>·</span>
                          <span className="text-amber-800 font-medium">{item.product.brand_name}</span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-slate-900 font-mono flex-shrink-0">
                        {((item.product.sale_price || item.product.price) * item.quantity).toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Thông tin người nhận hàng */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-900 tracking-wider">
                  <MapPin size={15} className="text-blue-600" />
                  <span>{t('ecommerce.checkout.deliveryInfo', 'Địa Chỉ Giao Hàng & Liên Hệ')}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {t('ecommerce.checkout.recipientName', 'Họ và tên người nhận')} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t('ecommerce.profileModal.namePlaceholder', 'Nguyễn Văn A')}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border-2 border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none font-medium bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {t('ecommerce.checkout.recipientPhone', 'Số điện thoại nhận hàng')} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t('ecommerce.profileModal.phonePlaceholder', '09xx xxx xxx')}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border-2 border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none font-medium bg-white font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {t('ecommerce.checkout.city', 'Tỉnh / Thành phố')} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder={locale === 'en' ? 'Da Nang, Hanoi, Ho Chi Minh...' : 'Đà Nẵng, Hà Nội, TP.HCM...'}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border-2 border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none font-medium bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {t('ecommerce.checkout.detailedAddress', 'Địa chỉ nhận hàng chi tiết (Số nhà, ngõ, đường, phường/xã)')} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={t('ecommerce.profileModal.addressPlaceholder', 'Số 123 Đường Bách Khoa, P. Hòa Khánh...')}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border-2 border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none font-medium bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {t('ecommerce.checkout.note', 'Ghi chú may đo / Giao hàng (Tùy chọn)')}
                    </label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder={locale === 'en' ? 'Tailored to 3D measurements, call 15 mins before delivery...' : 'May chuẩn theo độ cử động form vừa, gọi trước 15 phút...'}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border-2 border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none font-medium bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Phương thức thanh toán */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-900 tracking-wider">
                  <CreditCard size={15} className="text-blue-600" />
                  <span>{t('ecommerce.checkout.paymentMethod', 'Phương Thức Thanh Toán')}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* VietQR SePay */}
                  <div
                    onClick={() => setPaymentMethod('vietqr_sepay')}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                      paymentMethod === 'vietqr_sepay'
                        ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                        : 'border-slate-300 bg-white hover:border-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      checked={paymentMethod === 'vietqr_sepay'}
                      onChange={() => setPaymentMethod('vietqr_sepay')}
                      className="mt-1"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <QrCode size={16} className="text-blue-700" />
                        <strong className="text-xs font-black text-slate-900">
                          {t('ecommerce.checkout.vietqrTitle', 'Chuyển Khoản VietQR / SePay')}
                        </strong>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                        {t('ecommerce.checkout.vietqrDesc', 'Quét mã QR tự động điền số tiền & nội dung qua App Ngân Hàng.')}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                        {t('ecommerce.checkout.vietqrBadge', '⚡ Khuyên dùng · Miễn phí giao dịch')}
                      </span>
                    </div>
                  </div>

                  {/* COD */}
                  <div
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                      paymentMethod === 'cod'
                        ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                        : 'border-slate-300 bg-white hover:border-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="mt-1"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Banknote size={16} className="text-emerald-700" />
                        <strong className="text-xs font-black text-slate-900">
                          {t('ecommerce.checkout.codTitle', 'Thanh Toán Khi Nhận Hàng (COD)')}
                        </strong>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                        {t('ecommerce.checkout.codDesc', 'Thanh toán tiền mặt cho shipper khi nhận được trang phục.')}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                        {t('ecommerce.checkout.codBadge', '✓ Kiểm tra hàng trước khi thanh toán')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Mã giảm giá */}
              <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Tag size={14} className="text-indigo-600" />
                  <span>{t('ecommerce.checkout.couponTitle', 'Mã Ưu Đãi / Khuyến Mãi (Phiếu Giảm Giá)')}</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder={t('ecommerce.checkout.couponPlaceholder', 'Nhập mã (VD: FITVISION10, CAPSTONE2026)')}
                    className="flex-1 text-xs px-3.5 py-2 rounded-xl border-2 border-slate-300 outline-none uppercase font-mono font-bold bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black transition-colors cursor-pointer"
                  >
                    {t('ecommerce.checkout.couponApply', 'Áp Dụng')}
                  </button>
                  {appliedDiscount > 0 && (
                    <button
                      type="button"
                      onClick={handleClearCoupon}
                      className="px-3 py-2 bg-white hover:bg-rose-50 text-rose-600 border-2 border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      {locale === 'en' ? 'Remove' : 'Gỡ mã'}
                    </button>
                  )}
                </div>

                {availableVouchers.length > 0 && (
                  <div className="pt-1 flex flex-wrap gap-1.5">
                    {availableVouchers.map((v) => {
                      const isSelected = couponCode.trim().toUpperCase() === v.code.toUpperCase() && appliedDiscount > 0;
                      const discountTag =
                        v.discountType === 'percent'
                          ? `-${v.discountValue}%`
                          : `-${v.discountValue.toLocaleString('vi-VN')}₫`;
                      return (
                        <button
                          key={v.code}
                          type="button"
                          onClick={() => applyVoucherByCode(v.code)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-400'
                              : 'bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border-slate-300 hover:border-indigo-300'
                          }`}
                        >
                          <span className="font-mono">{v.code}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 font-black">
                            {discountTag}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {couponSuccess && (
                  <p className="text-[11px] font-bold text-emerald-700 mt-1">{couponSuccess}</p>
                )}
                {couponError && (
                  <p className="text-[11px] font-bold text-rose-600 mt-1">{couponError}</p>
                )}
              </div>

              {/* 5. Tổng kết chi phí & Nút Đặt hàng */}
              <div className="p-4 rounded-2xl bg-slate-100 border-2 border-slate-300 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>{t('ecommerce.checkout.subtotal', 'Tạm tính tiền hàng:')}</span>
                  <span className="font-mono">{subtotal.toLocaleString('vi-VN')} ₫</span>
                </div>
                {appliedDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>{t('ecommerce.checkout.discount', 'Mã giảm giá đã áp dụng:')}</span>
                    <span className="font-mono">-{appliedDiscount.toLocaleString('vi-VN')} ₫</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>{t('ecommerce.checkout.shipping', 'Phí vận chuyển toàn quốc:')}</span>
                  <span className="font-bold text-emerald-700">
                    {shippingFee === 0
                      ? t('ecommerce.checkout.freeShipping', 'Miễn phí (Freeship từ 1.000.000₫)')
                      : `${shippingFee.toLocaleString('vi-VN')} ₫`}
                  </span>
                </div>
                <div className="pt-2 border-t-2 border-slate-300 flex justify-between items-center text-sm font-black text-slate-900">
                  <span>{t('ecommerce.checkout.total', 'Tổng tiền thanh toán:')}</span>
                  <span className="text-xl text-blue-700 font-mono font-black">
                    {totalAmount.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 text-left">
                  {formError}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    handleCloseAll();
                    if (onBackToCart) onBackToCart();
                  }}
                  className="flex-1 py-3 px-4 rounded-xl border-2 border-slate-300 hover:bg-slate-100 text-slate-700 font-black text-xs transition-colors cursor-pointer"
                >
                  {t('ecommerce.checkout.backToCart', 'Quay Lại Giỏ Hàng')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || items.length === 0}
                  className="flex-2 py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                >
                  <span>
                    {isSubmitting
                      ? locale === 'en'
                        ? 'Processing Order...'
                        : 'Đang Tạo Đơn Hàng...'
                      : t('ecommerce.checkout.confirmOrder', 'Xác Nhận Đặt Hàng Ngay')}
                  </span>
                  <ArrowRight size={16} />
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
                <ShieldCheck size={13} className="text-emerald-600" />
                <span>{t('ecommerce.checkout.guarantee', 'Bảo chứng độ vừa vặn AI 100% · Đổi trả miễn phí trong 14 ngày')}</span>
              </div>
            </form>
          )}

          {/* STEP 2: ORDER PLACED SUCCESSFULLY & VIETQR PAYMENT */}
          {step === 'success' && createdOrder && (
            <div className="space-y-6 text-center animate-in fade-in">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm border-2 border-emerald-300">
                <CheckCircle2 size={36} />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  {t('ecommerce.checkout.successTitle', 'Đặt Hàng Thành Công!')}
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                  {t('ecommerce.checkout.successMessage', 'Cảm ơn bạn đã đặt may tại {store}. Đơn hàng đã được lưu trữ trên hệ thống FitVision 3D.').replace('{store}', createdOrder.store_name || 'FitVision Atelier')}
                </p>
              </div>

              {/* Order Quick Details Card */}
              {createdOrders.length > 1 && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-left text-xs text-blue-900">
                  <b>Đã tách thành {createdOrders.length} đơn theo từng gian hàng:</b>{' '}
                  {createdOrders.map((o) => `${o.id} (${o.store_name})`).join(' · ')}
                </div>
              )}
              <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-left space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-600">{t('ecommerce.checkout.orderCode', 'Mã đơn hàng:')}</span>
                  <div className="flex items-center gap-1.5 font-mono font-black text-blue-700 text-sm">
                    <span>{createdOrder.id}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(createdOrder.id, 'orderId')}
                      className="p-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 cursor-pointer"
                      title={t('ecommerce.checkout.copySuccess', 'Sao chép mã đơn')}
                    >
                      {copiedField === 'orderId' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>{t('ecommerce.checkout.recipient', 'Người nhận:')}</span>
                  <span className="font-bold text-slate-900">{createdOrder.recipient.full_name} ({createdOrder.recipient.phone})</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>{t('ecommerce.checkout.deliveryTo', 'Địa chỉ giao hàng:')}</span>
                  <span className="font-bold text-slate-900 text-right max-w-xs">{createdOrder.recipient.address}, {createdOrder.recipient.city}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>{t('ecommerce.checkout.estDelivery', 'Dự kiến giao hàng:')}</span>
                  <span className="font-bold text-emerald-700">{createdOrder.estimated_delivery}</span>
                </div>
                <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-200">
                  <span>{t('ecommerce.checkout.paymentType', 'Hình thức thanh toán:')}</span>
                  <span className="font-bold text-slate-900">
                    {createdOrder.payment_method === 'vietqr_sepay' ? t('ecommerce.checkout.paymentVietqr', 'Chuyển khoản VietQR / SePay') : t('ecommerce.checkout.paymentCod', 'Thanh toán tiền mặt khi nhận hàng (COD)')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-900 font-black text-sm pt-1">
                  <span>{t('ecommerce.checkout.totalPayment', 'Tổng thanh toán:')}</span>
                  <span className="text-blue-700 font-mono font-black text-base">
                    {createdOrder.total_amount.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              </div>

              {/* IF VIETQR / SEPAY: Show Bank Transfer Details & QR Code */}
              {createdOrder.payment_method === 'vietqr_sepay' && (
                <div className="bg-gradient-to-b from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-3xl p-5 space-y-4 text-left shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                        MB
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 uppercase">
                          {t('ecommerce.checkout.vietqrScanTitle', 'Thanh Toán Qua Quét Mã VietQR')}
                        </h4>
                        <span className="text-[10px] text-blue-700 font-semibold">{t('ecommerce.checkout.vietqrAutoDetect', 'Tự động nhận diện giao dịch')}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      hasConfirmedTransfer || createdOrder.payment_status === 'paid'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}>
                      {hasConfirmedTransfer || createdOrder.payment_status === 'paid' ? t('ecommerce.checkout.vietqrPaid', '✓ Đã xác nhận chuyển khoản') : t('ecommerce.checkout.vietqrPending', '⏳ Chờ thanh toán')}
                    </span>
                  </div>

                  {/* QR Image and Bank Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    {/* QR Code */}
                    <div className="bg-white p-3 rounded-2xl border-2 border-blue-200 text-center shadow-xs flex flex-col items-center">
                      {qrImgFailed ? (
                        <div className="w-48 h-48 rounded-xl border border-amber-200 bg-amber-50 flex flex-col items-center justify-center p-3 text-center gap-1.5">
                          <QrCode size={28} className="text-amber-600" />
                          <span className="text-[11px] font-bold text-amber-900">
                            {locale === 'en' ? 'Could not load VietQR image' : 'Không tải được ảnh VietQR'}
                          </span>
                          <span className="text-[10px] text-amber-700">
                            {locale === 'en'
                              ? 'Please copy the account number & transfer memo on the right.'
                              : 'Vui lòng sao chép STK & nội dung chuyển khoản bên cạnh.'}
                          </span>
                        </div>
                      ) : (
                        <img
                          src={`https://img.vietqr.io/image/MB-${encodeURIComponent(bankAccount.accountNumber)}-compact2.png?amount=${createdOrder.total_amount}&addInfo=${encodeURIComponent(bankAccount.transferContent)}&accountName=${encodeURIComponent(bankAccount.accountHolder)}`}
                          alt={t('ecommerce.checkout.vietqrScanTitle', 'Mã QR Chuyển Khoản Ngân Hàng VietQR')}
                          className="w-48 h-48 object-contain rounded-xl border border-slate-100"
                          onError={() => setQrImgFailed(true)}
                        />
                      )}
                      <span className="text-[10px] text-slate-500 font-mono mt-2 block">
                        {t('ecommerce.checkout.vietqrScanInstruction', 'Quét bằng app ngân hàng bất kỳ (Vietcombank, MB, Techcombank...)')}
                      </span>
                    </div>

                    {/* Bank Info Fields */}
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block font-bold uppercase">{t('ecommerce.checkout.bankBeneficiary', 'Ngân hàng thụ hưởng')}</span>
                        <strong className="text-xs text-slate-900 font-extrabold">{bankAccount.bankName}</strong>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 block font-bold uppercase">{t('ecommerce.checkout.accountNumber', 'Số tài khoản')}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <strong className="text-sm font-mono font-black text-blue-700">{bankAccount.accountNumber}</strong>
                          <button
                            type="button"
                            onClick={() => handleCopy(bankAccount.accountNumber, 'accountNumber')}
                            className="p-1 rounded bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 cursor-pointer"
                            title={t('ecommerce.checkout.accountNumber', 'Sao chép STK')}
                          >
                            {copiedField === 'accountNumber' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 block font-bold uppercase">{t('ecommerce.checkout.accountName', 'Chủ tài khoản')}</span>
                        <strong className="text-xs text-slate-900 font-extrabold">{bankAccount.accountHolder}</strong>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 block font-bold uppercase">{t('ecommerce.checkout.transferMemo', 'Nội dung chuyển khoản (Bắt buộc)')}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <strong className="text-sm font-mono font-black text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                            {bankAccount.transferContent}
                          </strong>
                          <button
                            type="button"
                            onClick={() => handleCopy(bankAccount.transferContent, 'content')}
                            className="p-1 rounded bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 cursor-pointer"
                            title={t('ecommerce.checkout.transferMemo', 'Sao chép nội dung')}
                          >
                            {copiedField === 'content' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </div>

                      <div className="pt-2 space-y-1.5">
                        <button
                          type="button"
                          onClick={handleConfirmTransfer}
                          disabled={hasConfirmedTransfer || checkingPayment}
                          className={`w-full py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            hasConfirmedTransfer
                              ? 'bg-emerald-600 text-white cursor-default'
                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs disabled:opacity-60'
                          }`}
                        >
                          {hasConfirmedTransfer ? (
                            <>
                              <Check size={14} />
                              <span>{t('ecommerce.checkout.iHavePaid', 'Đã Ghi Nhận Thanh Toán')}</span>
                            </>
                          ) : (
                            <>
                              <QrCode size={14} />
                              <span>
                                {checkingPayment
                                  ? 'Đang kiểm tra SePay...'
                                  : t('ecommerce.checkout.confirmPaid', 'Tôi Đã Chuyển Khoản — Kiểm Tra Giao Dịch')}
                              </span>
                            </>
                          )}
                        </button>
                        {paymentCheckMessage && (
                          <p className="text-[10px] text-slate-600 leading-snug">{paymentCheckMessage}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    handleCloseAll();
                    if (onOpenMyOrders) onOpenMyOrders();
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <ShoppingBag size={15} />
                  <span>{t('ecommerce.checkout.viewOrderHistory', 'Xem Lịch Sử Đơn Hàng')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCloseAll}
                  className="flex-1 py-3 px-4 rounded-xl border-2 border-slate-300 hover:bg-slate-100 text-slate-800 font-black text-xs transition-colors cursor-pointer"
                >
                  <span>{t('ecommerce.checkout.continueShopping', 'Tiếp Tục Mua Sắm')}</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
export default CheckoutModal;

