import React, { useState } from 'react';
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
import type { CartItem, PaymentMethod, UserBodyProfile, Order } from './types';
import { useAuth } from '@/context/AuthContext';
import { useOrders } from '@/context/OrderContext';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onClearCart: () => void;
  userBody?: UserBodyProfile;
  onOpenMyOrders?: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  onClearCart,
  userBody,
  onOpenMyOrders,
}) => {
  const { currentUser } = useAuth();
  const { createOrder, markPaymentCompleted } = useOrders();

  const [step, setStep] = useState<'checkout' | 'success'>('checkout');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState(currentUser?.full_name || 'Lê Văn Thắng');
  const [phone, setPhone] = useState('0979 307 635');
  const [city, setCity] = useState('Đà Nẵng');
  const [address, setAddress] = useState('Ký Túc Xá Đại Học Bách Khoa, 54 Nguyễn Lương Bằng, Hòa Khánh Bắc');
  const [note, setNote] = useState('May chuẩn theo số đo vóc dáng 3D, giao giờ hành chính.');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('vietqr_sepay');

  // Coupon code
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  // Copy states
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [hasConfirmedTransfer, setHasConfirmedTransfer] = useState(false);

  if (!isOpen) return null;

  const subtotal = items.reduce(
    (sum, item) => sum + (item.product.sale_price || item.product.price) * item.quantity,
    0
  );
  const shippingFee = 0; // Miễn phí giao hàng ưu đãi
  const totalAmount = Math.max(0, subtotal - appliedDiscount + shippingFee);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    setCouponSuccess(null);

    const code = couponCode.trim().toUpperCase();
    if (code === 'FITVISION10') {
      const discount = Math.round(subtotal * 0.1);
      setAppliedDiscount(discount);
      setCouponSuccess(`Đã áp dụng mã FITVISION10 (-10%: -${discount.toLocaleString('vi-VN')} ₫)`);
    } else if (code === 'CAPSTONE2026') {
      const discount = Math.min(subtotal, 100000);
      setAppliedDiscount(discount);
      setCouponSuccess(`Đã áp dụng mã CAPSTONE2026 (-${discount.toLocaleString('vi-VN')} ₫)`);
    } else {
      setCouponError('Mã giảm giá không hợp lệ hoặc đã hết hạn.');
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !address.trim() || !city.trim()) {
      alert('Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ nhận hàng!');
      return;
    }

    const order = createOrder({
      customer_id: currentUser?.id || 'usr-101',
      customer_name: fullName.trim(),
      recipient: {
        full_name: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        note: note.trim(),
      },
      items: [...items],
      subtotal,
      shipping_fee: shippingFee,
      discount_amount: appliedDiscount,
      total_amount: totalAmount,
      payment_method: paymentMethod,
      store_name: items[0]?.product.brand_name || 'FitVision Atelier',
    });

    setCreatedOrder(order);
    onClearCart();
    setStep('success');
  };

  const handleConfirmTransfer = () => {
    if (createdOrder) {
      markPaymentCompleted(createdOrder.id);
      setHasConfirmedTransfer(true);
    }
  };

  const handleCloseAll = () => {
    setStep('checkout');
    setCreatedOrder(null);
    setHasConfirmedTransfer(false);
    onClose();
  };

  const bankAccount = {
    bankName: 'MB Bank (Ngân hàng Quân Đội)',
    accountNumber: '33822222622222',
    accountHolder: 'LE VAN THANG',
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
                {step === 'checkout' ? 'Quy Trình Thanh Toán & Đặt May Đo' : 'Đặt Hàng & Thanh Toán Thành Công'}
              </h2>
              <p className="text-[11px] text-blue-100 font-medium">
                {step === 'checkout'
                  ? 'Chuẩn hóa số đo nhân trắc học ISO 8559 & Giao hàng tận nơi'
                  : `Mã đơn: ${createdOrder?.id || ''} · Hệ thống FitVision 3D`}
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
              
              {/* 1. Tóm tắt sản phẩm trong đơn */}
              <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-800 tracking-wider">
                    Sản Phẩm Trong Đơn ({items.length})
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles size={11} /> Đã so khớp số đo vừa vặn
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
                        <h4 className="text-xs font-bold text-slate-900 truncate">{item.product.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          <span className="font-semibold text-blue-700">Cỡ: {item.variant.size_label}</span>
                          <span>·</span>
                          <span>SL: {item.quantity}</span>
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
                  <span>Địa Chỉ Giao Hàng & Liên Hệ</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Họ và tên người nhận <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border-2 border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none font-medium bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Số điện thoại nhận hàng <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="09xx xxx xxx"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border-2 border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none font-medium bg-white font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Tỉnh / Thành phố <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Đà Nẵng, Hà Nội, TP.HCM..."
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border-2 border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none font-medium bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Địa chỉ nhận hàng chi tiết (Số nhà, ngõ, đường, phường/xã) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Số 123 Đường Bách Khoa, P. Hòa Khánh..."
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border-2 border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none font-medium bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Ghi chú may đo / Giao hàng (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="May chuẩn theo độ cử động form vừa, gọi trước 15 phút..."
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border-2 border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none font-medium bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Phương thức thanh toán */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-900 tracking-wider">
                  <CreditCard size={15} className="text-blue-600" />
                  <span>Phương Thức Thanh Toán</span>
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
                          Chuyển Khoản VietQR / SePay
                        </strong>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                        Quét mã QR tự động điền số tiền & nội dung qua App Ngân Hàng.
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                        ⚡ Khuyên dùng · Miễn phí giao dịch
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
                          Thanh Toán Khi Nhận Hàng (COD)
                        </strong>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                        Thanh toán tiền mặt cho shipper khi nhận được trang phục.
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                        ✓ Kiểm tra hàng trước khi thanh toán
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Mã giảm giá */}
              <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Tag size={14} className="text-indigo-600" />
                  <span>Mã Ưu Đãi / Khuyến Mãi (Phiếu Giảm Giá)</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Nhập mã (VD: FITVISION10, CAPSTONE2026)"
                    className="flex-1 text-xs px-3.5 py-2 rounded-xl border-2 border-slate-300 outline-none uppercase font-mono font-bold bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black transition-colors cursor-pointer"
                  >
                    Áp Dụng
                  </button>
                </div>

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
                  <span>Tạm tính tiền hàng:</span>
                  <span className="font-mono">{subtotal.toLocaleString('vi-VN')} ₫</span>
                </div>
                {appliedDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Mã giảm giá đã áp dụng:</span>
                    <span className="font-mono">-{appliedDiscount.toLocaleString('vi-VN')} ₫</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Phí vận chuyển toàn quốc:</span>
                  <span className="font-bold text-emerald-700">Miễn phí (Ưu đãi Capstone)</span>
                </div>
                <div className="pt-2 border-t-2 border-slate-300 flex justify-between items-center text-sm font-black text-slate-900">
                  <span>Tổng tiền thanh toán:</span>
                  <span className="text-xl text-blue-700 font-mono font-black">
                    {totalAmount.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseAll}
                  className="flex-1 py-3 px-4 rounded-xl border-2 border-slate-300 hover:bg-slate-100 text-slate-700 font-black text-xs transition-colors cursor-pointer"
                >
                  Quay Lại Giỏ Hàng
                </button>
                <button
                  type="submit"
                  className="flex-2 py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                >
                  <span>Xác Nhận Đặt Hàng Ngay</span>
                  <ArrowRight size={16} />
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
                <ShieldCheck size={13} className="text-emerald-600" />
                <span>Bảo chứng độ vừa vặn AI 100% · Đổi trả miễn phí trong 7 ngày</span>
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
                  Đặt Hàng Thành Công!
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                  Cảm ơn bạn đã đặt may tại <strong className="text-slate-900">{createdOrder.store_name}</strong>.
                  Đơn hàng đã được lưu trữ trên hệ thống FitVision 3D.
                </p>
              </div>

              {/* Order Quick Details Card */}
              <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-left space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-600">Mã đơn hàng:</span>
                  <div className="flex items-center gap-1.5 font-mono font-black text-blue-700 text-sm">
                    <span>{createdOrder.id}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(createdOrder.id, 'orderId')}
                      className="p-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 cursor-pointer"
                      title="Sao chép mã đơn"
                    >
                      {copiedField === 'orderId' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Người nhận:</span>
                  <span className="font-bold text-slate-900">{createdOrder.recipient.full_name} ({createdOrder.recipient.phone})</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Địa chỉ giao hàng:</span>
                  <span className="font-bold text-slate-900 text-right max-w-xs">{createdOrder.recipient.address}, {createdOrder.recipient.city}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Dự kiến giao hàng:</span>
                  <span className="font-bold text-emerald-700">{createdOrder.estimated_delivery}</span>
                </div>
                <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-200">
                  <span>Hình thức thanh toán:</span>
                  <span className="font-bold text-slate-900">
                    {createdOrder.payment_method === 'vietqr_sepay' ? 'Chuyển khoản VietQR / SePay' : 'Thanh toán tiền mặt khi nhận hàng (COD)'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-900 font-black text-sm pt-1">
                  <span>Tổng thanh toán:</span>
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
                          Thanh Toán Qua Quét Mã VietQR
                        </h4>
                        <span className="text-[10px] text-blue-700 font-semibold">Tự động nhận diện giao dịch</span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      hasConfirmedTransfer || createdOrder.payment_status === 'paid'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}>
                      {hasConfirmedTransfer || createdOrder.payment_status === 'paid' ? '✓ Đã xác nhận chuyển khoản' : '⏳ Chờ thanh toán'}
                    </span>
                  </div>

                  {/* QR Image and Bank Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    {/* QR Code */}
                    <div className="bg-white p-3 rounded-2xl border-2 border-blue-200 text-center shadow-xs flex flex-col items-center">
                      <img
                        src={`https://img.vietqr.io/image/MB-33822222622222-compact2.png?amount=${createdOrder.total_amount}&addInfo=${encodeURIComponent(bankAccount.transferContent)}&accountName=LE%20VAN%20THANG`}
                        alt="Mã QR Chuyển Khoản Ngân Hàng VietQR"
                        className="w-48 h-48 object-contain rounded-xl border border-slate-100"
                        onError={(e) => {
                          // Fallback if image fails to load
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <span className="text-[10px] text-slate-500 font-mono mt-2 block">
                        Quét bằng app ngân hàng bất kỳ (Vietcombank, MB, Techcombank...)
                      </span>
                    </div>

                    {/* Bank Info Fields */}
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block font-bold uppercase">Ngân hàng thụ hưởng</span>
                        <strong className="text-xs text-slate-900 font-extrabold">{bankAccount.bankName}</strong>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 block font-bold uppercase">Số tài khoản</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <strong className="text-sm font-mono font-black text-blue-700">{bankAccount.accountNumber}</strong>
                          <button
                            type="button"
                            onClick={() => handleCopy(bankAccount.accountNumber, 'accountNumber')}
                            className="p-1 rounded bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 cursor-pointer"
                            title="Sao chép STK"
                          >
                            {copiedField === 'accountNumber' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 block font-bold uppercase">Chủ tài khoản</span>
                        <strong className="text-xs text-slate-900 font-extrabold">{bankAccount.accountHolder}</strong>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 block font-bold uppercase">Nội dung chuyển khoản (Bắt buộc)</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <strong className="text-sm font-mono font-black text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                            {bankAccount.transferContent}
                          </strong>
                          <button
                            type="button"
                            onClick={() => handleCopy(bankAccount.transferContent, 'content')}
                            className="p-1 rounded bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 cursor-pointer"
                            title="Sao chép nội dung"
                          >
                            {copiedField === 'content' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleConfirmTransfer}
                          disabled={hasConfirmedTransfer}
                          className={`w-full py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            hasConfirmedTransfer
                              ? 'bg-emerald-600 text-white cursor-default'
                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                          }`}
                        >
                          {hasConfirmedTransfer ? (
                            <>
                              <Check size={14} />
                              <span>Tôi Đã Chuyển Khoản Xong</span>
                            </>
                          ) : (
                            <>
                              <QrCode size={14} />
                              <span>Xác Nhận Tôi Đã Chuyển Khoản</span>
                            </>
                          )}
                        </button>
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
                  <span>Xem Lịch Sử Đơn Hàng</span>
                </button>

                <button
                  type="button"
                  onClick={handleCloseAll}
                  className="flex-1 py-3 px-4 rounded-xl border-2 border-slate-300 hover:bg-slate-100 text-slate-800 font-black text-xs transition-colors cursor-pointer"
                >
                  <span>Tiếp Tục Mua Sắm</span>
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

