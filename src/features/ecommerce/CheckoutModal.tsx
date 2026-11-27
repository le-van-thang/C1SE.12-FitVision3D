import React, { useState, useEffect } from 'react';
import {
  X,
  ShoppingBag,
  MapPin,
  Phone,
  User,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  Truck,
  Tag,
  Globe,
} from 'lucide-react';
import type { CartItem, UserBodyProfile, Order, OrderMeasurementSnapshot } from './types';
import { useAuth } from '@/context/AuthContext';
import { useOrders } from '@/context/OrderContext';
import { useI18n } from '@/i18n';
import { loadPlatformConfig } from '@/services/platformConfig';
import { commerceApi, type PayPalPublicConfig } from '@/services/commerceApi';
import { loadFullScanSnapshot } from '@/utils/bodyProfileStorage';
import { PayPalSmartButton } from './PayPalSmartButton';

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
  const { recordCapturedOrders } = useOrders();
  const { t, locale } = useI18n();

  const [step, setStep] = useState<'checkout' | 'success'>('checkout');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [createdOrders, setCreatedOrders] = useState<Order[]>([]);
  const [paypalConfig, setPaypalConfig] = useState<PayPalPublicConfig | null>(null);
  const [captureMeta, setCaptureMeta] = useState<{
    paypalOrderId?: string;
    captureId?: string;
    totalUsd?: number;
    exchangeRateVnd?: number;
    payerEmail?: string | null;
  } | null>(null);

  const savedDetails = getUserProfileDetails(currentUser?.id);

  // Form Fields (zero hardcoded PII — populated only from authenticated user's own profile)
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [phone, setPhone] = useState(savedDetails?.phone || '');
  const [city, setCity] = useState(savedDetails?.city || '');
  const [address, setAddress] = useState(savedDetails?.address || '');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Coupon code
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  // Copy states
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Sync recipient PII strictly per signed-in user & load PayPal gateway config
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
      setCaptureMeta(null);
      setIsSubmitting(false);

      let active = true;
      void commerceApi.getPayPalConfig().then((res) => {
        if (!active) return;
        const envClientId = (import.meta.env.VITE_PAYPAL_CLIENT_ID as string | undefined) || '';
        if (res.success && res.data) {
          setPaypalConfig({
            ...res.data,
            clientId: res.data.clientId || envClientId,
          });
        } else {
          setPaypalConfig({
            configured: Boolean(envClientId),
            mode: 'sandbox',
            clientId: envClientId,
            vndRate: 25400,
            platformFeeRate: 0.05,
            holdDays: 0,
          });
        }
      });
      return () => {
        active = false;
      };
    } else {
      setCouponCode('');
      setAppliedDiscount(0);
      setCouponError(null);
      setCouponSuccess(null);
      setFormError(null);
      setStep('checkout');
      setCreatedOrder(null);
      setCreatedOrders([]);
      setCaptureMeta(null);
      setIsSubmitting(false);
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

  if (!isOpen) return null;

  const subtotal = items.reduce(
    (sum, item) => sum + (item.product.sale_price || item.product.price) * item.quantity,
    0
  );
  const normalizedAppliedCoupon = appliedDiscount > 0 ? couponCode.trim().toUpperCase() : '';

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

  // Match backend per-sub-order shipping rule so UI VND/USD matches PayPal Popup 100%
  const shippingFee =
    items.length === 0
      ? 0
      : shopGroupList.reduce((totalShip, group) => {
          const groupSubtotal = group.items.reduce(
            (sum, item) => sum + (item.product.sale_price || item.product.price) * item.quantity,
            0
          );
          const groupFreeShip = groupSubtotal >= 1_000_000 || normalizedAppliedCoupon === 'FREESHIP3D';
          return totalShip + (groupFreeShip ? 0 : 30_000);
        }, 0);
  const totalAmount = Math.max(0, subtotal - appliedDiscount + shippingFee);

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

  const vndRate = paypalConfig?.vndRate || 25400;
  const estimatedUsd = Math.max(0.01, Math.round((totalAmount / vndRate) * 100) / 100);
  const resolvedPayPalClientId =
    paypalConfig?.clientId || (import.meta.env.VITE_PAYPAL_CLIENT_ID as string | undefined) || '';

  const buildMeasurementSnapshot = (): OrderMeasurementSnapshot | null => {
    if (!currentUser?.id) return null;
    const fullScan = loadFullScanSnapshot(currentUser.id);
    if (fullScan) {
      return {
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
    }
    if (hasBodyProfile && userBody && userBody.height_cm > 0 && userBody.chest_cm > 0) {
      const hM = userBody.height_cm / 100;
      return {
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
    return null;
  };

  const validateCheckoutBeforePayPal = (): string | null => {
    setFormError(null);
    if (!isAuthenticated || !currentUser?.id) {
      openSignIn();
      return locale === 'en' ? 'Please sign in before paying with PayPal.' : 'Vui lòng đăng nhập trước khi thanh toán PayPal.';
    }
    if (items.length === 0) {
      const msg = locale === 'en' ? 'No products selected for checkout.' : 'Không có sản phẩm nào được chọn để thanh toán.';
      setFormError(msg);
      return msg;
    }
    if (!fullName.trim() || !phone.trim() || !address.trim() || !city.trim()) {
      const msg =
        locale === 'en'
          ? 'Please enter full recipient name, phone number, city, and delivery address.'
          : 'Vui lòng điền đầy đủ họ tên, số điện thoại, tỉnh/thành phố và địa chỉ nhận hàng.';
      setFormError(msg);
      return msg;
    }
    return null;
  };

  const handleCreatePayPalServerOrder = async (): Promise<string | null> => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      const hasBespoke = items.some((it) => Boolean(it.product?.is_bespoke));
      const estimatedDelivery = hasBespoke
        ? locale === 'en'
          ? '5 - 7 days (Bespoke 3D Tailoring)'
          : '5 - 7 ngày (May đo 3D)'
        : locale === 'en'
        ? '2 - 4 days'
        : '2 - 4 ngày';

      const res = await commerceApi.createPayPalOrder({
        customer_name: fullName.trim(),
        recipient: {
          full_name: fullName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          city: city.trim(),
          note: note.trim(),
        },
        items: items.map((item) => ({
          product_id: item.product.id,
          size_label: item.variant.size_label,
          quantity: item.quantity,
        })),
        coupon_code: normalizedAppliedCoupon || undefined,
        estimated_delivery: estimatedDelivery,
        measurement_snapshot: buildMeasurementSnapshot(),
      });

      if (!res.success || !res.data?.paypalOrderId) {
        const msg =
          res.error?.message ||
          (locale === 'en' ? 'Unable to create PayPal payment session.' : 'Không thể khởi tạo phiên thanh toán PayPal.');
        setFormError(msg);
        setIsSubmitting(false);
        throw new Error(msg);
      }

      setCaptureMeta({
        paypalOrderId: res.data.paypalOrderId,
        totalUsd: res.data.totalUsd,
        exchangeRateVnd: res.data.exchangeRateVnd,
      });
      return res.data.paypalOrderId;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'PayPal create order error';
      setFormError(msg);
      setIsSubmitting(false);
      throw err instanceof Error ? err : new Error(msg);
    }
  };

  const handleApprovePayPalCapture = async (paypalOrderId: string) => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      const res = await commerceApi.capturePayPalOrder(paypalOrderId);
      if (!res.success || !res.data?.orders?.length) {
        setFormError(
          res.error?.message ||
            (locale === 'en' ? 'PayPal capture failed. Please check your account balance.' : 'Xác nhận trừ tiền PayPal thất bại.')
        );
        return;
      }
      setCaptureMeta((prev) => ({
        ...prev,
        paypalOrderId: res.data!.paypalOrderId,
        captureId: res.data!.captureId,
        totalUsd: res.data!.grossUsd || prev?.totalUsd,
        payerEmail: res.data!.payerEmail,
      }));
      recordCapturedOrders(res.data.orders);
      setCreatedOrders(res.data.orders);
      setCreatedOrder(res.data.orders[0]);
      onClearCart();
      setStep('success');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayPalCancelOrError = (paypalOrderId: string | null, reason?: string) => {
    setIsSubmitting(false);
    if (paypalOrderId) {
      void commerceApi.cancelPendingPayPalOrder(paypalOrderId);
    }
    if (reason) {
      setFormError(reason);
    }
  };

  const handleCloseAll = () => {
    setStep('checkout');
    setCreatedOrder(null);
    setCreatedOrders([]);
    setCaptureMeta(null);
    setCouponCode('');
    setAppliedDiscount(0);
    setCouponError(null);
    setCouponSuccess(null);
    setFormError(null);
    onClose();
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
            <div className="space-y-6">
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

              {/* 3. Phương thức thanh toán (PayPal-Only Marketplace Escrow) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-900 tracking-wider">
                    <CreditCard size={15} className="text-blue-600" />
                    <span>{t('ecommerce.checkout.paymentMethod', 'Cổng Thanh Toán Trực Tuyến PayPal')}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[10px] font-bold text-blue-800">
                    <Globe size={11} /> {paypalConfig?.mode === 'live' ? 'PayPal Live' : 'PayPal Sandbox'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl border-2 border-blue-600 bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/70 space-y-2.5 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-[#003087] text-white font-black text-xs tracking-wide">
                        PayPal
                      </span>
                      <strong className="text-xs font-black text-slate-900">
                        Thanh toán quốc tế qua PayPal (Ví PayPal / Visa / Mastercard)
                      </strong>
                    </div>
                    <span className="font-mono text-xs font-black text-blue-800 bg-blue-100/80 px-2.5 py-1 rounded-lg">
                      ≈ ${estimatedUsd.toFixed(2)} USD
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Tiền của bạn được thanh toán trực tiếp qua PayPal Checkout bằng USD theo tỷ giá cố định trên server (
                    <b className="font-mono text-slate-800">1 USD = {vndRate.toLocaleString('vi-VN')} ₫</b>). Tiền được{' '}
                    <b>Tài khoản Sàn FitVision giữ hộ (Escrow)</b> và chỉ giải ngân cho Shop sau khi đơn hàng được giao thành công.
                  </p>
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

              {/* Action Buttons & PayPal Smart Checkout */}
              <div className="space-y-3 pt-2">
                {!isAuthenticated ? (
                  <button
                    type="button"
                    onClick={openSignIn}
                    className="w-full py-3 px-5 rounded-xl bg-[#003087] hover:bg-[#002366] text-white font-black text-xs cursor-pointer"
                  >
                    Đăng Nhập Để Thanh Toán Với PayPal
                  </button>
                ) : !resolvedPayPalClientId ? (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold">
                    Chưa cấu hình <code>PAYPAL_CLIENT_ID</code> / <code>VITE_PAYPAL_CLIENT_ID</code>. Vui lòng cập nhật file <code>.env</code> và khởi động lại server.
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-600 font-semibold">
                      <span>Tổng thanh toán quy đổi:</span>
                      <span className="font-mono font-black text-slate-900">
                        {totalAmount.toLocaleString('vi-VN')} ₫ ≈ ${estimatedUsd.toFixed(2)} USD
                      </span>
                    </div>
                    <PayPalSmartButton
                      clientId={resolvedPayPalClientId}
                      disabled={isSubmitting || items.length === 0}
                      onValidateBeforeCreate={validateCheckoutBeforePayPal}
                      onCreateServerOrder={handleCreatePayPalServerOrder}
                      onApproveServerCapture={handleApprovePayPalCapture}
                      onCancelOrError={handlePayPalCancelOrError}
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    handleCloseAll();
                    if (onBackToCart) onBackToCart();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl border-2 border-slate-300 hover:bg-slate-100 text-slate-700 font-black text-xs transition-colors cursor-pointer"
                >
                  {t('ecommerce.checkout.backToCart', 'Quay Lại Giỏ Hàng')}
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
                <ShieldCheck size={13} className="text-emerald-600" />
                <span>{t('ecommerce.checkout.guarantee', 'Bảo chứng độ vừa vặn AI 100% · Thanh toán bảo vệ bởi PayPal Escrow')}</span>
              </div>
            </div>
          )}

          {/* STEP 2: PAYPAL CAPTURED SUCCESSFULLY */}
          {step === 'success' && createdOrder && (
            <div className="space-y-6 text-center animate-in fade-in">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm border-2 border-emerald-300">
                <CheckCircle2 size={36} />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Thanh Toán PayPal Thành Công!
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                  Giao dịch đã được PayPal xác nhận (Captured). Tiền được giữ an toàn trên hệ thống FitVision 3D và đã gửi đơn hàng tới từng Shop.
                </p>
              </div>

              {/* PayPal Receipt Details */}
              <div className="bg-gradient-to-br from-emerald-50/80 to-blue-50/80 border-2 border-emerald-200 rounded-2xl p-4 text-left space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-emerald-200/70">
                  <span className="font-bold text-slate-700">PayPal Capture ID:</span>
                  <div className="flex items-center gap-1.5 font-mono font-black text-emerald-800">
                    <span>{captureMeta?.captureId || createdOrder.paypal_capture_id || 'CAPTURED'}</span>
                    {(captureMeta?.captureId || createdOrder.paypal_capture_id) && (
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(captureMeta?.captureId || createdOrder.paypal_capture_id || '', 'captureId')
                        }
                        className="p-1 rounded bg-white border border-emerald-200 text-slate-700 cursor-pointer"
                      >
                        {copiedField === 'captureId' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Số tiền đã thanh toán (USD):</span>
                  <span className="font-mono font-black text-blue-800">
                    ${(captureMeta?.totalUsd ?? createdOrders.reduce((s, o) => s + Number(o.paid_amount_usd || 0), 0)).toFixed(2)} USD
                  </span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Tổng quy đổi (VND):</span>
                  <span className="font-mono font-black text-slate-900">
                    {createdOrders.reduce((s, o) => s + o.total_amount, 0).toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                {captureMeta?.payerEmail && (
                  <div className="flex justify-between text-slate-600">
                    <span>Tài khoản PayPal người mua:</span>
                    <span className="font-mono font-semibold text-slate-900">{captureMeta.payerEmail}</span>
                  </div>
                )}
              </div>

              {/* Sub-orders breakdown (multi-shop support) */}
              <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-left space-y-2.5 text-xs">
                <div className="font-black text-slate-800 uppercase text-[11px] tracking-wider">
                  {createdOrders.length > 1
                    ? `Đã tách thành ${createdOrders.length} đơn theo từng Shop:`
                    : 'Thông Tin Đơn Hàng:'}
                </div>
                {createdOrders.map((sub) => (
                  <div key={sub.id} className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-blue-700">{sub.id}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(sub.id, `order-${sub.id}`)}
                          className="p-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                        >
                          {copiedField === `order-${sub.id}` ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-600 truncate">
                        Shop: <b>{sub.store_name}</b> · Giao dự kiến: {sub.estimated_delivery}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-black text-slate-900">{sub.total_amount.toLocaleString('vi-VN')} ₫</div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        ✓ Đã thanh toán
                      </span>
                    </div>
                  </div>
                ))}

                <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                  <span>{t('ecommerce.checkout.recipient', 'Người nhận:')}</span>
                  <span className="font-bold text-slate-900">{createdOrder.recipient.full_name} ({createdOrder.recipient.phone})</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>{t('ecommerce.checkout.deliveryTo', 'Địa chỉ giao hàng:')}</span>
                  <span className="font-bold text-slate-900 text-right max-w-xs">{createdOrder.recipient.address}, {createdOrder.recipient.city}</span>
                </div>
              </div>

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

