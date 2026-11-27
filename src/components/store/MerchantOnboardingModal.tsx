import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Store as StoreIcon,
  Phone,
  MapPin,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Mail,
  Lock,
  UserCheck,
  Wallet,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/services/authApi';
import { showGlobalToast } from '@/components/common/GlobalToastHost';

export const MerchantOnboardingModal: React.FC = () => {
  const { isOnboardingModalOpen, closeOnboarding, openSignIn } = useAuth();

  const [businessEmail, setBusinessEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [tagline, setTagline] = useState('');
  const [paypalPayoutEmail, setPaypalPayoutEmail] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<{
    email: string;
    shopName: string;
    paypalEmail?: string;
  } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOnboardingModalOpen) {
      setErrorMessage(null);
      setSubmittedResult(null);
      return;
    }
    setBusinessEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setBrandName('');
    setPhone('');
    setAddress('');
    setTagline('');
    setPaypalPayoutEmail('');
    setErrorMessage(null);
    setLoading(false);
    setSubmittedResult(null);
  }, [isOnboardingModalOpen]);

  if (!isOnboardingModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessEmail.trim())) {
      setErrorMessage('Vui lòng nhập Email đăng nhập Shop hợp lệ.');
      return;
    }
    if (!/^(?=.*[!@#$%^&*()_+\-=[\]{}|;:,.<>?]).{6,32}$/.test(password)) {
      setErrorMessage('Mật khẩu cần 6–32 ký tự và có ít nhất 1 ký tự đặc biệt (!@#$%^&*...).');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (fullName.trim().length < 2) {
      setErrorMessage('Vui lòng nhập họ và tên chủ shop.');
      return;
    }
    if (brandName.trim().length < 3) {
      setErrorMessage('Tên thương hiệu / cửa hàng phải có ít nhất 3 ký tự.');
      return;
    }
    if (!/^(84|0)[35789][0-9]{8}$/.test(phone.trim())) {
      setErrorMessage('Số điện thoại Việt Nam không hợp lệ.');
      return;
    }
    if (address.trim().length < 10) {
      setErrorMessage('Vui lòng nhập địa chỉ cửa hàng/xưởng may rõ ràng (tối thiểu 10 ký tự).');
      return;
    }
    if (paypalPayoutEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paypalPayoutEmail.trim())) {
      setErrorMessage('Email PayPal nhận giải ngân không đúng định dạng.');
      return;
    }

    setLoading(true);
    const res = await authApi.registerShop({
      email: businessEmail.trim().toLowerCase(),
      password,
      confirmPassword,
      fullName: fullName.trim(),
      shopName: brandName.trim(),
      phoneNumber: phone.trim(),
      shopAddress: address.trim(),
      paypalPayoutEmail: paypalPayoutEmail.trim().toLowerCase() || undefined,
      tagline: tagline.trim() || undefined,
    });
    setLoading(false);

    if (!res.success || !res.data) {
      setErrorMessage(res.error?.message || 'Đăng ký mở cửa hàng thất bại. Vui lòng thử lại.');
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmittedResult({
      email: res.data.email,
      shopName: brandName.trim(),
      paypalEmail: paypalPayoutEmail.trim() || undefined,
    });
    showGlobalToast({
      type: 'success',
      title: 'Đã gửi hồ sơ mở Shop!',
      message: 'Hồ sơ gian hàng đã được chuyển tới Quản trị viên phê duyệt.',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-6 py-5 bg-gradient-to-r from-[#14171C] via-slate-900 to-blue-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
              <StoreIcon size={20} className="text-blue-300" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">Đăng Ký Mở Gian Hàng FitVision 3D</h2>
              <p className="text-[11px] text-slate-300">
                Thiết lập gian hàng nhanh trong 1 bước · Nhận giải ngân tự động qua PayPal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeOnboarding}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
          {submittedResult ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 size={30} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Đã Gửi Hồ Sơ Mở Shop Thành Công!</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Gian hàng <b>{submittedResult.shopName}</b> ({submittedResult.email}) đang chờ Admin xét duyệt.
                </p>
              </div>
              {submittedResult.paypalEmail && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
                  Ví PayPal nhận giải ngân đã gắn: <b className="font-mono">{submittedResult.paypalEmail}</b>
                </div>
              )}
              <div className="flex gap-2 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    closeOnboarding();
                    openSignIn();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black cursor-pointer"
                >
                  Đăng Nhập Kênh Người Bán
                </button>
                <button
                  type="button"
                  onClick={closeOnboarding}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email đăng nhập Shop <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={businessEmail}
                      onChange={(e) => setBusinessEmail(e.target.value)}
                      placeholder="shop@thuonghieu.com"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-blue-600 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mật khẩu <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="VD: Shop@2026"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-blue-600 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Xác nhận mật khẩu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-blue-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Họ tên chủ shop <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <UserCheck size={14} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-blue-600 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số điện thoại liên hệ <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0901234567"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-blue-600 outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên Thương Hiệu / Cửa Hàng <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="VD: Maison Atelier Saigon"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-blue-600 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Địa chỉ cửa hàng / xưởng may <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-blue-600 outline-none"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email PayPal nhận tiền giải ngân (Có thể nhập sau tại /shop)
                  </label>
                  <div className="relative">
                    <Wallet size={14} className="absolute left-3 top-3 text-blue-500" />
                    <input
                      type="email"
                      value={paypalPayoutEmail}
                      onChange={(e) => setPaypalPayoutEmail(e.target.value)}
                      placeholder="sb-shop@personal.example.com"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-blue-200 bg-blue-50/40 focus:border-blue-600 outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mô tả ngắn / Khẩu hiệu gian hàng (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="Chuyên vest & sơ mi may đo chuẩn 3D ISO 8559"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-blue-600 outline-none"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                <ShieldCheck size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Chính sách Sàn FitVision 3D: Hoa hồng Sàn <b>5%</b> + Phí cổng PayPal thực tế. Tiền hàng được tạm giữ bảo chứng đến khi đơn <b>Hoàn tất</b> và giải ngân tự động qua <b>PayPal Payouts</b>.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#14171C] hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-black cursor-pointer transition-colors"
              >
                {loading ? 'Đang gửi hồ sơ...' : 'Đăng Ký Mở Gian Hàng Ngay'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default MerchantOnboardingModal;
