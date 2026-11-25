import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  Store as StoreIcon,
  Phone,
  MapPin,
  FileCheck2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  UploadCloud,
  CheckCircle2,
  Building2,
  CreditCard,
  Mail,
  Lock,
  UserCheck,
  QrCode,
  Search,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/services/authApi';
import { adminApi } from '@/services/adminApi';
import { showGlobalToast } from '@/components/common/GlobalToastHost';
import {
  compareVietnameseAccountNames,
  decodeCccdQrFromDataUrl,
  validateVietnamCCCD,
  validateVietnamTaxCode,
  VIETNAM_BANKS,
  type CccdQrParsedPayload,
  type ShopEntityType,
} from '@/utils/shopKycValidation';

export const MerchantOnboardingModal: React.FC = () => {
  const { isOnboardingModalOpen, closeOnboarding, isAuthenticated, currentUser, openSignIn } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  // Step 1: Separated Seller Account + Entity Type + Brand Info
  const [businessEmail, setBusinessEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [tagline, setTagline] = useState('');
  const [entityType, setEntityType] = useState<ShopEntityType>('INDIVIDUAL');

  // Step 2: CCCD 12-digit + Front QR + Tax Code + Business License
  const [nationalId, setNationalId] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [businessLicenseNo, setBusinessLicenseNo] = useState('');
  const [cccdFrontUrl, setCccdFrontUrl] = useState('');
  const [cccdFrontName, setCccdFrontName] = useState('');
  const [cccdFrontQr, setCccdFrontQr] = useState<CccdQrParsedPayload | null>(null);
  const [cccdBackUrl, setCccdBackUrl] = useState('');
  const [cccdBackName, setCccdBackName] = useState('');
  const [licenseDocUrl, setLicenseDocUrl] = useState('');
  const [licenseDocName, setLicenseDocName] = useState('');
  const [taxLookupResult, setTaxLookupResult] = useState<{
    status: string;
    message: string;
    businessName?: string;
    address?: string;
  } | null>(null);
  const [lookingUpTax, setLookingUpTax] = useState(false);

  // Step 3: Payout Bank Account (matched to CCCD/GPKD)
  const [bankCode, setBankCode] = useState('VCB');
  const [bankName, setBankName] = useState('Vietcombank');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<{
    email: string;
    shopName: string;
    taxStatus: string;
    bankStatus: string;
    qrNotes?: string;
  } | null>(null);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const licenseInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOnboardingModalOpen) {
      setStep(1);
      setErrorMessage(null);
      setSubmittedResult(null);
      return;
    }
    // Clear sensitive onboarding & KYC fields when modal closes
    setStep(1);
    setBusinessEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setBrandName('');
    setPhone('');
    setAddress('');
    setTagline('');
    setEntityType('INDIVIDUAL');
    setNationalId('');
    setTaxCode('');
    setBusinessLicenseNo('');
    setCccdFrontUrl('');
    setCccdFrontName('');
    setCccdFrontQr(null);
    setCccdBackUrl('');
    setCccdBackName('');
    setLicenseDocUrl('');
    setLicenseDocName('');
    setTaxLookupResult(null);
    setLookingUpTax(false);
    setBankCode('VCB');
    setBankName('Vietcombank');
    setBankAccountNumber('');
    setBankAccountHolder('');
    setErrorMessage(null);
    setLoading(false);
    setSubmittedResult(null);
  }, [isOnboardingModalOpen]);

  const cccdValidation = useMemo(
    () => (nationalId.trim() ? validateVietnamCCCD(nationalId) : null),
    [nationalId]
  );

  const taxValidation = useMemo(
    () => (taxCode.trim() ? validateVietnamTaxCode(taxCode) : null),
    [taxCode]
  );

  const bankMatch = useMemo(() => {
    const expected =
      entityType === 'ENTERPRISE' && taxLookupResult?.businessName
        ? taxLookupResult.businessName
        : fullName;
    if (!bankAccountHolder.trim() || !expected.trim()) return null;
    return compareVietnameseAccountNames(bankAccountHolder, expected);
  }, [bankAccountHolder, fullName, entityType, taxLookupResult]);

  if (!isOnboardingModalOpen) return null;

  const readImageFile = (
    file: File,
    onDone: (dataUrl: string, name: string) => void
  ) => {
    if (file.size > 3 * 1024 * 1024) {
      setErrorMessage('Dung lượng ảnh giấy tờ tối đa 3MB để đảm bảo tốc độ tải.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onDone(reader.result, file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFrontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMessage(null);
    readImageFile(file, async (dataUrl, name) => {
      setCccdFrontUrl(dataUrl);
      setCccdFrontName(name);
      const qr = await decodeCccdQrFromDataUrl(dataUrl);
      setCccdFrontQr(qr);
      if (qr?.cccd) {
        if (!nationalId.trim()) setNationalId(qr.cccd);
        if (qr.fullName && !fullName.trim()) setFullName(qr.fullName);
        showGlobalToast({
          type: 'success',
          title: 'Đã giải mã QR trên CCCD gắn chip!',
          message: `Phát hiện số ${qr.cccd} (${qr.fullName || 'Hợp lệ'}).`,
        });
      }
    });
  };

  const handleTaxLookup = async () => {
    const check = validateVietnamTaxCode(taxCode);
    if (!check.valid) {
      setErrorMessage(check.reason || 'Mã số thuế chưa hợp lệ để tra cứu.');
      return;
    }
    setLookingUpTax(true);
    setErrorMessage(null);
    const res = await adminApi.lookupTaxCode(check.normalized, entityType);
    setLookingUpTax(false);
    if (res.success && res.data) {
      setTaxLookupResult({
        status: res.data.lookupStatus,
        message: res.data.message,
        businessName: res.data.businessName,
        address: res.data.address,
      });
    } else {
      setTaxLookupResult({
        status: 'ERROR',
        message: res.error?.message || 'Chưa thể tra cứu trực tuyến lúc này.',
      });
    }
  };

  const goStep2 = () => {
    setErrorMessage(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessEmail.trim())) {
      setErrorMessage('Vui lòng nhập Email kinh doanh hợp lệ cho tài khoản Chủ Shop.');
      return;
    }
    if (isAuthenticated && currentUser && businessEmail.trim().toLowerCase() === currentUser.email.toLowerCase()) {
      setErrorMessage(
        'Vui lòng dùng Email riêng (khác email mua sắm hiện tại) cho tài khoản Chủ Shop để tách bạch doanh thu & thuế.'
      );
      return;
    }
    if (password.length < 6 || !/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password)) {
      setErrorMessage('Mật khẩu tài khoản Shop phải từ 6–32 ký tự và có ít nhất 1 ký tự đặc biệt.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (fullName.trim().length < 2) {
      setErrorMessage('Vui lòng nhập họ tên Người đại diện hợp lệ.');
      return;
    }
    if (brandName.trim().length < 3) {
      setErrorMessage('Tên thương hiệu cửa hàng cần từ 3 ký tự trở lên.');
      return;
    }
    if (!/^(84|0)[35789][0-9]{8}$/.test(phone.trim())) {
      setErrorMessage('Số điện thoại liên hệ Shop không đúng định dạng Việt Nam.');
      return;
    }
    if (address.trim().length < 10) {
      setErrorMessage('Vui lòng nhập địa chỉ xưởng may / cửa hàng chi tiết (tối thiểu 10 ký tự).');
      return;
    }
    setStep(2);
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goStep3 = () => {
    setErrorMessage(null);
    const cccdCheck = validateVietnamCCCD(nationalId);
    if (!cccdCheck.valid) {
      setErrorMessage(cccdCheck.reason || 'Vui lòng nhập đúng số CCCD 12 chữ số.');
      return;
    }
    if (!cccdFrontUrl || !cccdBackUrl) {
      setErrorMessage('Vui lòng tải đủ ảnh mặt trước và mặt sau CCCD.');
      return;
    }
    if (entityType !== 'INDIVIDUAL' && !taxCode.trim()) {
      setErrorMessage('Hộ kinh doanh và Doanh nghiệp bắt buộc nhập Mã số thuế.');
      return;
    }
    if (taxCode.trim()) {
      const taxCheck = validateVietnamTaxCode(taxCode);
      if (!taxCheck.valid) {
        setErrorMessage(taxCheck.reason || 'Mã số thuế không hợp lệ.');
        return;
      }
    }
    if (entityType !== 'INDIVIDUAL' && (businessLicenseNo.trim().length < 5 || !licenseDocUrl)) {
      setErrorMessage('Vui lòng nhập số Giấy phép kinh doanh và tải ảnh minh chứng GPKD.');
      return;
    }
    setStep(3);
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!/^[0-9]{6,25}$/.test(bankAccountNumber.replace(/\s+/g, ''))) {
      setErrorMessage('Số tài khoản ngân hàng nhận tiền phải gồm 6–25 chữ số.');
      return;
    }
    if (bankAccountHolder.trim().length < 3) {
      setErrorMessage('Vui lòng nhập tên chủ tài khoản ngân hàng.');
      return;
    }

    const docs: Array<{
      docType: 'CCCD_FRONT' | 'CCCD_BACK' | 'BUSINESS_LICENSE';
      fileUrl: string;
      fileName?: string;
      qrParsedPayload?: Record<string, any> | null;
    }> = [
      { docType: 'CCCD_FRONT', fileUrl: cccdFrontUrl, fileName: cccdFrontName, qrParsedPayload: cccdFrontQr },
      { docType: 'CCCD_BACK', fileUrl: cccdBackUrl, fileName: cccdBackName },
    ];
    if (licenseDocUrl) {
      docs.push({ docType: 'BUSINESS_LICENSE', fileUrl: licenseDocUrl, fileName: licenseDocName });
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
      tagline: tagline.trim(),
      entityType,
      nationalId: nationalId.replace(/\s+/g, ''),
      taxCode: taxCode.trim(),
      businessLicenseNo: businessLicenseNo.trim(),
      bankCode,
      bankName,
      bankAccountNumber: bankAccountNumber.replace(/\s+/g, ''),
      bankAccountHolder: bankAccountHolder.trim(),
      kycDocuments: docs,
    });
    setLoading(false);

    if (!res.success || !res.data) {
      setErrorMessage(res.error?.message || 'Đăng ký mở gian hàng thất bại. Vui lòng kiểm tra lại hồ sơ.');
      return;
    }

    setSubmittedResult({
      email: res.data.email,
      shopName: brandName.trim(),
      taxStatus: res.data.taxStatus,
      bankStatus: res.data.bankVerificationStatus,
      qrNotes: res.data.qrConsistency?.notes,
    });
    showGlobalToast({
      type: 'success',
      title: 'Đã tạo tài khoản Chủ Shop & Nộp hồ sơ KYC!',
      message: 'Bạn có thể đăng nhập vào /shop bằng email kinh doanh vừa tạo để theo dõi kết quả duyệt.',
    });
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={closeOnboarding}
    >
      <div
        ref={scrollRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white text-slate-900 shadow-2xl border border-slate-200 p-6 sm:p-7"
      >
        <button
          type="button"
          onClick={closeOnboarding}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
        >
          <X size={16} />
        </button>

        {submittedResult ? (
          <div className="py-6 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 size={34} />
            </div>
            <div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                ĐÃ TẠO TÀI KHOẢN SELLER ĐỘC LẬP
              </span>
              <h2 className="text-xl font-black text-slate-950 mt-3">
                Hồ sơ Gian hàng &amp; Thuế đã được tiếp nhận!
              </h2>
              <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto leading-relaxed">
                Tài khoản kinh doanh <b>{submittedResult.email}</b> cho thương hiệu{' '}
                <b>{submittedResult.shopName}</b> đang chờ Quản trị viên thẩm định KYC trong 24h.
              </p>
            </div>

            <div className="max-w-md mx-auto bg-slate-50 rounded-2xl border border-slate-200 p-4 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Trạng thái Thuế / MST:</span>
                <span className="font-bold text-slate-900">{submittedResult.taxStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Khớp tên TK Ngân hàng:</span>
                <span className="font-bold text-slate-900">{submittedResult.bankStatus}</span>
              </div>
              {submittedResult.qrNotes && (
                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600">
                  <b>QR CCCD:</b> {submittedResult.qrNotes}
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  closeOnboarding();
                  openSignIn();
                }}
                className="px-5 py-2.5 rounded-xl bg-[#14171C] hover:bg-blue-600 text-white text-xs font-bold cursor-pointer"
              >
                Đăng nhập vào /shop theo dõi hồ sơ
              </button>
              <button
                type="button"
                onClick={closeOnboarding}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-extrabold uppercase tracking-wider">
                <ShieldCheck size={12} /> FitVision Seller Center • KYC &amp; Tuân thủ Thuế
              </div>
              <h2 className="text-xl font-black text-slate-950 mt-2">
                Đăng Ký Tài Khoản Chủ Shop Độc Lập
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tách riêng tài khoản kinh doanh khỏi tài khoản mua sắm cá nhân để chuẩn hóa Mã số thuế, GPKD và đối soát thanh toán.
              </p>
            </div>

            {/* 3-Step Indicator */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { num: 1, title: '1. Tài khoản & Loại hình' },
                { num: 2, title: '2. CCCD, QR & Mã số thuế' },
                { num: 3, title: '3. Ngân hàng nhận tiền' },
              ].map((item) => (
                <div
                  key={item.num}
                  className={`px-3 py-2 rounded-xl border text-[11px] font-bold text-center ${
                    step === item.num
                      ? 'bg-[#14171C] text-white border-[#14171C]'
                      : step > item.num
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}
                >
                  {item.title}
                </div>
              ))}
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* STEP 1 */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                    Loại hình kinh doanh (Theo quy định Thuế TMĐT) *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      {
                        id: 'INDIVIDUAL' as const,
                        title: 'Cá nhân / Thợ may',
                        desc: 'CCCD 12 số + MST cá nhân (hoặc bổ sung sau)',
                      },
                      {
                        id: 'HOUSEHOLD' as const,
                        title: 'Hộ kinh doanh',
                        desc: 'CCCD + Giấy ĐK Hộ KD + MST 10 số / -888',
                      },
                      {
                        id: 'ENTERPRISE' as const,
                        title: 'Doanh nghiệp / Mall',
                        desc: 'Bắt buộc GPKD + MST DN (đủ điều kiện Mall)',
                      },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setEntityType(opt.id)}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          entityType === opt.id
                            ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-600/15'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="text-xs font-black text-slate-900">{opt.title}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      <Mail size={11} className="inline mr-1" /> Email Kinh Doanh (Đăng nhập Shop) *
                    </label>
                    <input
                      type="email"
                      value={businessEmail}
                      onChange={(e) => setBusinessEmail(e.target.value)}
                      placeholder="shop.atelier@domain.com"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      <UserCheck size={11} className="inline mr-1" /> Họ tên Người đại diện (Theo CCCD) *
                    </label>
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="VD: Nguyễn Văn An"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      <Lock size={11} className="inline mr-1" /> Mật khẩu Tài khoản Shop *
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Tối thiểu 6 ký tự + 1 ký tự đặc biệt"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Xác nhận Mật khẩu *
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      <StoreIcon size={11} className="inline mr-1" /> Tên Thương Hiệu / Gian Hàng *
                    </label>
                    <input
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="VD: Maison Sartoria Hà Nội"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      <Phone size={11} className="inline mr-1" /> SĐT Kinh Doanh *
                    </label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0901234567"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    <MapPin size={11} className="inline mr-1" /> Địa chỉ Xưởng / Cửa Hàng *
                  </label>
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Số nhà, Đường, Phường/Xã, Quận/Huyện, Tỉnh/TP"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Khẩu hiệu Thương hiệu (Hiển thị trên Trang Gian Hàng riêng)
                  </label>
                  <input
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="VD: Chuyên Vest & Sơ Mi Bespoke chuẩn số đo AI 3D"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-slate-900"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={goStep2}
                    className="px-5 py-2.5 rounded-xl bg-[#14171C] hover:bg-blue-600 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    Tiếp tục: Định danh &amp; Thuế <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Số CCCD gắn chip (12 chữ số — Kiểm tra mã 63 tỉnh &amp; tuổi) *
                  </label>
                  <input
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    placeholder="VD: 079095001234"
                    maxLength={12}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono outline-none focus:border-slate-900"
                  />
                  {cccdValidation && (
                    <p
                      className={`text-[11px] mt-1 font-semibold ${
                        cccdValidation.valid ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {cccdValidation.valid
                        ? `✓ Cấu trúc hợp lệ: ${cccdValidation.provinceName} • Năm sinh ${cccdValidation.birthYear}`
                        : `✕ ${cccdValidation.reason}`}
                    </p>
                  )}
                </div>

                {/* CCCD Front & Back Upload */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <input
                      ref={frontInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFrontUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => frontInputRef.current?.click()}
                      className={`w-full p-3.5 rounded-xl border-2 border-dashed text-left cursor-pointer ${
                        cccdFrontUrl ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-300 hover:border-slate-900'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <UploadCloud size={15} className="text-blue-600" />
                        {cccdFrontUrl ? cccdFrontName : 'Tải ảnh CCCD Mặt Trước *'}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Hệ thống tự quét QR trên mặt trước CCCD để chống số giả.
                      </p>
                      {cccdFrontQr?.cccd && (
                        <div className="mt-1.5 px-2 py-1 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                          <QrCode size={11} /> QR: {cccdFrontQr.cccd} — {cccdFrontQr.fullName}
                        </div>
                      )}
                    </button>
                  </div>

                  <div>
                    <input
                      ref={backInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) readImageFile(f, (url, n) => { setCccdBackUrl(url); setCccdBackName(n); });
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => backInputRef.current?.click()}
                      className={`w-full p-3.5 rounded-xl border-2 border-dashed text-left cursor-pointer ${
                        cccdBackUrl ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-300 hover:border-slate-900'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <UploadCloud size={15} className="text-blue-600" />
                        {cccdBackUrl ? cccdBackName : 'Tải ảnh CCCD Mặt Sau *'}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Rõ ngày cấp, nơi cấp &amp; chip/dấu mộc (tối đa 3MB).
                      </p>
                    </button>
                  </div>
                </div>

                {/* Tax Code + Checksum + Casso Lookup */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Mã số thuế {entityType === 'INDIVIDUAL' ? '(Tùy chọn tạm thời — dùng CCCD 12 số hoặc MST -888)' : '*'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={taxCode}
                      onChange={(e) => {
                        setTaxCode(e.target.value);
                        setTaxLookupResult(null);
                      }}
                      placeholder="VD: 0108928374, 0108928374-888 hoặc 079095001234"
                      className="flex-1 px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono outline-none focus:border-slate-900"
                    />
                    <button
                      type="button"
                      disabled={lookingUpTax || !taxCode.trim()}
                      onClick={() => void handleTaxLookup()}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Search size={13} /> {lookingUpTax ? 'Đang tra...' : 'Kiểm tra MST'}
                    </button>
                  </div>
                  {taxValidation && (
                    <p className={`text-[11px] mt-1 font-semibold ${taxValidation.valid ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {taxValidation.valid
                        ? `✓ Đạt chuẩn ${taxValidation.kind} (Checksum Mod-11 / CCCD hợp lệ)`
                        : `✕ ${taxValidation.reason}`}
                    </p>
                  )}
                  {taxLookupResult && (
                    <div className="mt-1.5 p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-[11px] text-blue-900">
                      <b>Kết quả đối soát Casso/Thuế:</b> {taxLookupResult.message}
                      {taxLookupResult.businessName && <div>Tên ĐKKD: <b>{taxLookupResult.businessName}</b></div>}
                      {taxLookupResult.address && <div>Địa chỉ: {taxLookupResult.address}</div>}
                    </div>
                  )}
                </div>

                {/* GPKD for Household / Enterprise */}
                {entityType !== 'INDIVIDUAL' && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <Building2 size={14} className="text-blue-600" /> Hồ Sơ Giấy Phép Kinh Doanh (Bắt buộc)
                    </div>
                    <input
                      value={businessLicenseNo}
                      onChange={(e) => setBusinessLicenseNo(e.target.value)}
                      placeholder="Số Giấy chứng nhận ĐK Hộ KD / Doanh nghiệp (VD: 0108928374)"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-mono outline-none"
                    />
                    <input
                      ref={licenseInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) readImageFile(f, (url, n) => { setLicenseDocUrl(url); setLicenseDocName(n); });
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => licenseInputRef.current?.click()}
                      className="w-full p-3 rounded-xl border border-dashed border-slate-400 bg-white text-xs font-bold text-slate-700 hover:border-slate-900 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <FileCheck2 size={14} /> {licenseDocUrl ? `Đã chọn: ${licenseDocName}` : 'Tải ảnh Giấy phép Kinh doanh *'}
                    </button>
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft size={14} /> Quay lại
                  </button>
                  <button
                    type="button"
                    onClick={goStep3}
                    className="px-5 py-2.5 rounded-xl bg-[#14171C] hover:bg-blue-600 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    Tiếp tục: Tài khoản Ngân hàng <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <form onSubmit={handleSubmitAll} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  <b>Quy tắc chống rửa tiền &amp; đối soát thuế:</b> Tên chủ tài khoản ngân hàng phải khớp với họ tên trên CCCD (hoặc tên Doanh nghiệp trên GPKD).
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      <CreditCard size={11} className="inline mr-1" /> Ngân hàng nhận tiền *
                    </label>
                    <select
                      value={bankCode}
                      onChange={(e) => {
                        const code = e.target.value;
                        const found = VIETNAM_BANKS.find((b) => b.code === code);
                        setBankCode(code);
                        setBankName(found?.name || code);
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold outline-none"
                    >
                      {VIETNAM_BANKS.map((b) => (
                        <option key={b.code} value={b.code}>
                          {b.code} — {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Số tài khoản ngân hàng *
                    </label>
                    <input
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      placeholder="VD: 1029384756"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Tên chủ tài khoản (Không dấu hoặc có dấu) *
                  </label>
                  <input
                    value={bankAccountHolder}
                    onChange={(e) => setBankAccountHolder(e.target.value)}
                    placeholder={`VD: ${fullName || 'NGUYEN VAN AN'}`}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs uppercase outline-none focus:border-slate-900"
                  />
                  {bankMatch && (
                    <p className={`text-[11px] mt-1 font-semibold ${bankMatch.matched ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {bankMatch.matched
                        ? `✓ Khớp tên người đại diện (${bankMatch.score}%)`
                        : `⚠ Độ khớp tên thấp (${bankMatch.score}%) — Admin sẽ kiểm tra kỹ chứng từ liên quan.`}
                    </p>
                  )}
                </div>

                <div className="flex justify-between pt-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft size={14} /> Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-black inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    {loading ? 'Đang gửi hồ sơ KYC...' : 'Hoàn tất & Nộp Hồ Sơ Chủ Shop'} <ArrowRight size={14} />
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
