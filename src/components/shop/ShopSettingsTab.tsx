import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Store,
  Image as ImageIcon,
  Upload,
  Trash2,
  Phone,
  Mail,
  PauseCircle,
  Calendar,
  Clock,
  MapPin,
  Truck,
  Landmark,
  ShieldCheck,
  Lock,
  KeyRound,
  LogOut,
  Bell,
  MessageSquare,
  Save,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import {
  commerceApi,
  type DbShopBankAccount,
  type DbShopProfile,
  type ShopReputationSummary,
} from '@/services/commerceApi';
import { authApi } from '@/services/authApi';
import { VIETNAM_BANKS } from '@/utils/shopKycValidation';
import { showGlobalToast } from '@/components/common/GlobalToastHost';
import { useI18n } from '@/i18n';

type SettingsSection =
  | 'profile'
  | 'operations'
  | 'shipping'
  | 'payment'
  | 'security'
  | 'notifications';

interface ShopSettingsTabProps {
  shop: DbShopProfile;
  bankAccount: DbShopBankAccount | null;
  reputation: ShopReputationSummary | null;
  userEmail?: string;
  authProvider?: 'google' | 'password';
  onShopUpdated: (updated: DbShopProfile) => void;
  onBankUpdated: (updated: DbShopBankAccount) => void;
  onReloadDashboard: () => Promise<void> | void;
  onSignedOutAll: () => Promise<void> | void;
}

const PREP_TIME_OPTIONS = [
  { value: 'Trong ngày (24h)', en: 'Same day (24h)' },
  { value: '1–2 ngày làm việc', en: '1–2 business days' },
  { value: '2–3 ngày làm việc', en: '2–3 business days' },
  { value: '3–5 ngày (Hàng đặt trước)', en: '3–5 days (Pre-order)' },
];

const QUICK_REPLY_PRESETS_VI = [
  'Cảm ơn bạn đã tin tưởng và lựa chọn sản phẩm của Shop! Chúc bạn luôn mặc đẹp và tự tin với phom dáng chuẩn AI 3D.',
  'Cảm ơn đánh giá 5 sao của bạn! Nếu cần tư vấn thêm về size hoặc đổi chỉnh phom trong 14 ngày, cứ nhắn Shop ngay nhé.',
  'Shop rất trân trọng phản hồi của bạn và sẽ tiếp tục cải thiện chất lượng vải cũng như dịch vụ đóng gói tốt hơn nữa.',
];

const QUICK_REPLY_PRESETS_EN = [
  'Thank you for choosing our shop! We hope you enjoy your AI 3D precision fit.',
  'Thank you for the 5-star review! Reach out anytime if you need size advice or our 14-day fit adjustment.',
  'We truly appreciate your feedback and will keep improving our fabric quality and packaging.',
];

function compressImageToDataUrl(file: File, maxWidth: number, maxHeight: number, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc tệp ảnh.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Tệp ảnh không hợp lệ.'));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width, maxHeight / img.height);
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result || ''));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}

function toDateInputValue(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export const ShopSettingsTab: React.FC<ShopSettingsTabProps> = ({
  shop,
  bankAccount,
  reputation,
  userEmail,
  authProvider = 'password',
  onShopUpdated,
  onBankUpdated,
  onReloadDashboard,
  onSignedOutAll,
}) => {
  const { t, locale } = useI18n();
  const isEn = locale === 'en';
  const isGoogleAccount = authProvider === 'google';
  const [section, setSection] = useState<SettingsSection>('profile');

  const [shopName, setShopName] = useState(shop.shop_name || '');
  const [tagline, setTagline] = useState(shop.tagline || '');
  const [description, setDescription] = useState(shop.description || '');
  const [logoUrl, setLogoUrl] = useState(shop.logo_url || '');
  const [bannerUrl, setBannerUrl] = useState(shop.banner_url || '');
  const [phoneNumber, setPhoneNumber] = useState(shop.phone_number || '');
  const [contactEmail, setContactEmail] = useState(shop.contact_email || userEmail || '');

  const [operationalMode, setOperationalMode] = useState<'ACTIVE' | 'VACATION'>(
    shop.operational_mode === 'VACATION' ? 'VACATION' : 'ACTIVE'
  );
  const [vacationNote, setVacationNote] = useState(shop.vacation_note || '');
  const [vacationUntil, setVacationUntil] = useState(toDateInputValue(shop.vacation_until));
  const [prepTimeDays, setPrepTimeDays] = useState(shop.prep_time_days || '1–2 ngày làm việc');

  const [pickupAddress, setPickupAddress] = useState(shop.pickup_address || shop.shop_address || '');
  const [returnSameAsPickup, setReturnSameAsPickup] = useState(shop.return_same_as_pickup ?? true);
  const [returnAddress, setReturnAddress] = useState(shop.return_address || shop.shop_address || '');

  const [bankCode, setBankCode] = useState(bankAccount?.bank_code || VIETNAM_BANKS[0].code);
  const [bankName, setBankName] = useState(bankAccount?.bank_name || VIETNAM_BANKS[0].name);
  const [bankAccountNumber, setBankAccountNumber] = useState(bankAccount?.account_number || '');
  const [bankAccountHolder, setBankAccountHolder] = useState(
    bankAccount?.account_holder_name || shop.legal_representative_name || ''
  );
  const [bankVerifyPassword, setBankVerifyPassword] = useState('');
  const [isSavingBank, setIsSavingBank] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

  const [quickReplyTemplate, setQuickReplyTemplate] = useState(shop.quick_reply_template || '');
  const [notifyNewOrderEmail, setNotifyNewOrderEmail] = useState(shop.notify_new_order_email ?? true);
  const [notifyLowStockEmail, setNotifyLowStockEmail] = useState(shop.notify_low_stock_email ?? true);

  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setShopName(shop.shop_name || '');
    setTagline(shop.tagline || '');
    setDescription(shop.description || '');
    setLogoUrl(shop.logo_url || '');
    setBannerUrl(shop.banner_url || '');
    setPhoneNumber(shop.phone_number || '');
    setContactEmail(shop.contact_email || userEmail || '');
    setOperationalMode(shop.operational_mode === 'VACATION' ? 'VACATION' : 'ACTIVE');
    setVacationNote(shop.vacation_note || '');
    setVacationUntil(toDateInputValue(shop.vacation_until));
    setPrepTimeDays(shop.prep_time_days || '1–2 ngày làm việc');
    setPickupAddress(shop.pickup_address || shop.shop_address || '');
    setReturnSameAsPickup(shop.return_same_as_pickup ?? true);
    setReturnAddress(shop.return_address || shop.shop_address || '');
    setQuickReplyTemplate(shop.quick_reply_template || '');
    setNotifyNewOrderEmail(shop.notify_new_order_email ?? true);
    setNotifyLowStockEmail(shop.notify_low_stock_email ?? true);
  }, [shop, userEmail]);

  useEffect(() => {
    if (bankAccount) {
      setBankCode(bankAccount.bank_code || VIETNAM_BANKS[0].code);
      setBankName(bankAccount.bank_name || VIETNAM_BANKS[0].name);
      setBankAccountNumber(bankAccount.account_number || '');
      setBankAccountHolder(bankAccount.account_holder_name || '');
    }
  }, [bankAccount]);

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    kind: 'logo' | 'banner'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showGlobalToast({
        type: 'warning',
        title: isEn ? 'Unsupported file format' : 'Định dạng không hỗ trợ',
        message: isEn ? 'Please choose a JPG, PNG, or WebP image.' : 'Vui lòng chọn tệp ảnh JPG, PNG hoặc WebP.',
      });
      return;
    }
    try {
      const dataUrl =
        kind === 'logo'
          ? await compressImageToDataUrl(file, 400, 400, 0.85)
          : await compressImageToDataUrl(file, 1280, 420, 0.82);
      if (kind === 'logo') {
        setLogoUrl(dataUrl);
      } else {
        setBannerUrl(dataUrl);
      }
      showGlobalToast({
        type: 'success',
        title:
          kind === 'logo'
            ? isEn ? 'Logo uploaded' : 'Đã tải ảnh Logo'
            : isEn ? 'Banner uploaded' : 'Đã tải ảnh bìa',
        message: isEn ? 'Click Save to publish changes.' : 'Nhấn "Lưu" để cập nhật lên gian hàng công khai.',
      });
    } catch (err: any) {
      showGlobalToast({
        type: 'error',
        title: isEn ? 'Image processing error' : 'Lỗi xử lý ảnh',
        message: err?.message || (isEn ? 'Could not read image.' : 'Không thể nén và đọc ảnh đã chọn.'),
      });
    } finally {
      e.target.value = '';
    }
  };

  const handleSaveShopSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (shopName.trim().length < 2) {
      showGlobalToast({
        type: 'warning',
        title: isEn ? 'Shop name too short' : 'Tên thương hiệu quá ngắn',
        message: isEn ? 'Please enter at least 2 characters.' : 'Vui lòng nhập tên Shop từ 2 ký tự trở lên.',
      });
      return;
    }
    if (phoneNumber.trim().length < 8) {
      showGlobalToast({
        type: 'warning',
        title: isEn ? 'Invalid phone number' : 'Số điện thoại không hợp lệ',
        message: isEn ? 'Please enter a valid hotline (min 8 digits).' : 'Vui lòng nhập số điện thoại CSKH hợp lệ (tối thiểu 8 ký tự).',
      });
      return;
    }

    setIsSavingSettings(true);
    const res = await commerceApi.updateShopProfile({
      shopName: shopName.trim(),
      tagline: tagline.trim(),
      description: description.trim(),
      logoUrl: logoUrl.trim() || null,
      bannerUrl: bannerUrl.trim() || null,
      phoneNumber: phoneNumber.trim(),
      contactEmail: contactEmail.trim() || null,
      shopAddress: pickupAddress.trim() || shop.shop_address,
      pickupAddress: pickupAddress.trim() || shop.shop_address,
      returnSameAsPickup,
      returnAddress: returnSameAsPickup
        ? pickupAddress.trim() || shop.shop_address
        : returnAddress.trim() || pickupAddress.trim() || shop.shop_address,
      operationalMode,
      vacationNote: operationalMode === 'VACATION' ? vacationNote.trim() : '',
      vacationUntil: operationalMode === 'VACATION' && vacationUntil ? vacationUntil : null,
      prepTimeDays,
      quickReplyTemplate: quickReplyTemplate.trim() || null,
      notifyNewOrderEmail,
      notifyLowStockEmail,
    });
    setIsSavingSettings(false);

    if (res.success && res.data) {
      onShopUpdated(res.data);
      showGlobalToast({
        type: 'success',
        title: isEn ? 'Shop settings saved!' : 'Đã lưu Cài Đặt Gian Hàng!',
        message: isEn ? 'Changes are synced to your public storefront.' : 'Thông tin mới đã được đồng bộ lên trang công khai và hệ thống.',
      });
      void onReloadDashboard();
    } else {
      showGlobalToast({
        type: 'error',
        title: isEn ? 'Update failed' : 'Cập nhật thất bại',
        message: res.error?.message || (isEn ? 'Could not save shop settings.' : 'Không thể lưu cài đặt gian hàng.'),
      });
    }
  };

  const handleSaveBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankVerifyPassword.trim()) {
      showGlobalToast({
        type: 'warning',
        title: isEn ? 'Password required' : 'Thiếu mật khẩu xác thực',
        message: isEn
          ? 'Please enter your current password to verify payout bank updates.'
          : 'Bắt buộc nhập mật khẩu tài khoản để xác thực thay đổi ngân hàng chi trả.',
      });
      return;
    }
    setIsSavingBank(true);
    const res = await commerceApi.updateShopBankAccount({
      bankCode,
      bankName,
      accountNumber: bankAccountNumber.trim(),
      accountHolderName: bankAccountHolder.trim(),
      currentPassword: bankVerifyPassword,
    });
    setIsSavingBank(false);

    if (res.success && res.data) {
      onBankUpdated(res.data);
      setBankVerifyPassword('');
      showGlobalToast({
        type: 'success',
        title: isEn ? 'Bank account updated!' : 'Đã cập nhật tài khoản Ngân hàng!',
        message: isEn
          ? `KYC name match verified (${Math.round(res.data.name_match_score)}%).`
          : `Đã đối chiếu khớp KYC (${Math.round(res.data.name_match_score)}%) với tên chủ Shop.`,
      });
      void onReloadDashboard();
    } else {
      showGlobalToast({
        type: 'error',
        title: isEn ? 'Bank update failed' : 'Không thể cập nhật ngân hàng',
        message: res.error?.message || (isEn ? 'Check your password and account holder name.' : 'Vui lòng kiểm tra lại mật khẩu và tên chủ tài khoản.'),
      });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      showGlobalToast({
        type: 'warning',
        title: isEn ? 'Passwords do not match' : 'Mật khẩu xác nhận không khớp',
        message: isEn ? 'Please enter the same new password in both fields.' : 'Vui lòng nhập lại mật khẩu mới giống nhau ở cả 2 ô.',
      });
      return;
    }
    setIsChangingPassword(true);
    const res = await authApi.changePassword({
      currentPassword,
      newPassword,
      confirmNewPassword,
    });
    setIsChangingPassword(false);

    if (res.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      showGlobalToast({
        type: 'success',
        title: isEn ? 'Password updated' : 'Cập nhật mật khẩu thành công',
        message: res.data?.message || (isEn ? 'Your shop password has been updated.' : 'Mật khẩu tài khoản Shop đã được thay đổi.'),
      });
    } else {
      showGlobalToast({
        type: 'error',
        title: isEn ? 'Password update failed' : 'Đổi mật khẩu thất bại',
        message: res.error?.message || (isEn ? 'Check your current password and password rules.' : 'Vui lòng kiểm tra lại mật khẩu hiện tại và quy tắc mật khẩu.'),
      });
    }
  };

  const handleLogoutAllDevices = async () => {
    setIsLoggingOutAll(true);
    const res = await authApi.logoutAll();
    setIsLoggingOutAll(false);

    if (res.success) {
      showGlobalToast({
        type: 'success',
        title: isEn ? 'Signed out of all devices' : 'Đã đăng xuất toàn bộ thiết bị',
        message: res.data?.message || (isEn ? 'All active sessions have been revoked.' : 'Tất cả phiên đăng nhập trước đó đã bị thu hồi.'),
      });
      await onSignedOutAll();
    } else {
      showGlobalToast({
        type: 'error',
        title: isEn ? 'Action failed' : 'Thao tác thất bại',
        message: res.error?.message || (isEn ? 'Could not revoke sessions right now.' : 'Không thể thu hồi phiên đăng nhập lúc này.'),
      });
    }
  };

  const navItems: Array<{
    id: SettingsSection;
    label: string;
    desc: string;
    icon: React.ReactNode;
    badge?: string;
  }> = [
    {
      id: 'profile',
      label: t('shopSettings.navProfile'),
      desc: t('shopSettings.navProfileDesc'),
      icon: <Store size={15} />,
    },
    {
      id: 'operations',
      label: t('shopSettings.navOperations'),
      desc: t('shopSettings.navOperationsDesc'),
      icon: <PauseCircle size={15} />,
      badge: operationalMode === 'VACATION' ? t('shopSettings.badgeVacation') : undefined,
    },
    {
      id: 'shipping',
      label: t('shopSettings.navShipping'),
      desc: t('shopSettings.navShippingDesc'),
      icon: <Truck size={15} />,
    },
    {
      id: 'payment',
      label: t('shopSettings.navPayment'),
      desc: t('shopSettings.navPaymentDesc'),
      icon: <Landmark size={15} />,
    },
    {
      id: 'security',
      label: t('shopSettings.navSecurity'),
      desc: t('shopSettings.navSecurityDesc'),
      icon: <Lock size={15} />,
    },
    {
      id: 'notifications',
      label: t('shopSettings.navNotifications'),
      desc: t('shopSettings.navNotificationsDesc'),
      icon: <Bell size={15} />,
    },
  ];

  const isApproved = shop.status === 'APPROVED';
  const presets = isEn ? QUICK_REPLY_PRESETS_EN : QUICK_REPLY_PRESETS_VI;

  return (
    <div className="space-y-5 pb-20">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-slate-950 flex items-center gap-2">
            {t('shopSettings.title')}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{t('shopSettings.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {reputation && (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full font-mono tabular-nums border ${
                reputation.ratingCount > 0
                  ? 'text-amber-800 bg-amber-50 border-amber-200'
                  : 'text-slate-600 bg-slate-50 border-slate-200'
              }`}
            >
              ★ {reputation.ratingCount > 0 ? reputation.ratingAvg.toFixed(1) : '0.0'}/5 ({reputation.ratingCount})
            </span>
          )}
          <Link
            to={`/stores/${encodeURIComponent(shop.brand_slug || shop.shop_name)}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3.5 py-2 rounded-xl transition-colors"
          >
            <ExternalLink size={13} /> {t('shopSettings.viewPublicStore')}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <aside className="lg:col-span-4 xl:col-span-3 bg-white rounded-2xl border border-slate-200 p-2.5 space-y-1">
          {navItems.map((item) => {
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all cursor-pointer flex items-start gap-2.5 ${
                  active ? 'bg-[#14171C] text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className={`mt-0.5 shrink-0 ${active ? 'text-amber-300' : 'text-slate-500'}`}>
                  {item.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold truncate">{item.label}</span>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-400 text-slate-950 whitespace-nowrap shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] truncate mt-0.5 ${active ? 'text-slate-300' : 'text-slate-400'}`}>
                    {item.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </aside>

        <div className="lg:col-span-8 xl:col-span-9 space-y-5">
          {section === 'profile' && (
            <form
              onSubmit={handleSaveShopSettings}
              className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6"
            >
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-sm font-black text-slate-950">{t('shopSettings.sec1Title')}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('shopSettings.sec1Desc')}{' '}
                  <span className="font-mono text-slate-700">/stores/{shop.brand_slug || shop.shop_name}</span>.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-900">
                <div
                  className="h-32 sm:h-40 w-full relative bg-slate-800"
                  style={
                    bannerUrl
                      ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                      : undefined
                  }
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/50 text-white text-[10px] font-bold">
                    {t('shopSettings.previewBadge')}
                  </div>
                  <div className="absolute bottom-3 left-4 right-4 flex items-end gap-3.5">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border-2 border-white shadow-sm flex items-center justify-center text-slate-900 font-black text-xl overflow-hidden shrink-0">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo preview" className="w-full h-full object-cover" />
                      ) : (
                        (shopName || 'FV').slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 text-white pb-0.5">
                      <p className="text-sm sm:text-base font-black truncate">
                        {shopName || t('shopSettings.previewNameFallback')}
                      </p>
                      <p className="text-[11px] text-slate-200 truncate">
                        {tagline || t('shopSettings.previewTaglineFallback')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <ImageIcon size={14} /> {t('shopSettings.logoLabel')}
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => void handleImageUpload(e, 'logo')}
                      />
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:border-slate-900 text-[11px] font-bold text-slate-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Upload size={12} /> {t('shopSettings.uploadImage')}
                      </button>
                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title={t('shopSettings.removeImage')}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    value={logoUrl.startsWith('data:') ? '' : logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder={
                      logoUrl.startsWith('data:')
                        ? t('shopSettings.logoDataPlaceholder')
                        : t('shopSettings.logoUrlPlaceholder')
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 outline-none focus:border-slate-900"
                  />
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <ImageIcon size={14} /> {t('shopSettings.bannerLabel')}
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        ref={bannerInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => void handleImageUpload(e, 'banner')}
                      />
                      <button
                        type="button"
                        onClick={() => bannerInputRef.current?.click()}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:border-slate-900 text-[11px] font-bold text-slate-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Upload size={12} /> {t('shopSettings.uploadImage')}
                      </button>
                      {bannerUrl && (
                        <button
                          type="button"
                          onClick={() => setBannerUrl('')}
                          className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title={t('shopSettings.removeImage')}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    value={bannerUrl.startsWith('data:') ? '' : bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    placeholder={
                      bannerUrl.startsWith('data:')
                        ? t('shopSettings.bannerDataPlaceholder')
                        : t('shopSettings.bannerUrlPlaceholder')
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                    <Store size={13} /> {t('shopSettings.shopNameLabel')}
                  </label>
                  <input
                    required
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder={t('shopSettings.shopNamePlaceholder')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-950 outline-none focus:border-slate-950"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1.5">
                    {t('shopSettings.taglineLabel')}
                  </label>
                  <input
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder={t('shopSettings.taglinePlaceholder')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-950 outline-none focus:border-slate-950"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                    <Phone size={13} /> {t('shopSettings.phoneLabel')}
                  </label>
                  <input
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder={t('shopSettings.phonePlaceholder')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-mono text-slate-950 outline-none focus:border-slate-950"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                    <Mail size={13} /> {t('shopSettings.emailLabel')}
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder={t('shopSettings.emailPlaceholder')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-950 outline-none focus:border-slate-950"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  {t('shopSettings.descLabel')}
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('shopSettings.descPlaceholder')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 leading-relaxed outline-none focus:border-slate-950"
                />
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSavingSettings || !isApproved}
                  className="px-5 py-2.5 rounded-xl bg-[#14171C] hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Save size={14} /> {isSavingSettings ? t('shopSettings.saving') : t('shopSettings.saveProfileBtn')}
                </button>
              </div>
            </form>
          )}

          {section === 'operations' && (
            <form
              onSubmit={handleSaveShopSettings}
              className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6"
            >
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-sm font-black text-slate-950">{t('shopSettings.sec2Title')}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{t('shopSettings.sec2Desc')}</p>
              </div>

              <div
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  operationalMode === 'VACATION'
                    ? 'bg-amber-50/80 border-amber-300'
                    : 'bg-emerald-50/70 border-emerald-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      operationalMode === 'VACATION'
                        ? 'bg-amber-200/80 text-amber-900'
                        : 'bg-emerald-200/70 text-emerald-900'
                    }`}
                  >
                    <PauseCircle size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-950">
                      {operationalMode === 'VACATION'
                        ? t('shopSettings.vacationOnTitle')
                        : t('shopSettings.vacationOffTitle')}
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {operationalMode === 'VACATION'
                        ? t('shopSettings.vacationOnDesc')
                        : t('shopSettings.vacationOffDesc')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={operationalMode === 'VACATION'}
                  onClick={() =>
                    setOperationalMode((prev) => (prev === 'VACATION' ? 'ACTIVE' : 'VACATION'))
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                    operationalMode === 'VACATION' ? 'bg-amber-500' : 'bg-emerald-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
                      operationalMode === 'VACATION' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                    <Calendar size={13} /> {t('shopSettings.vacationUntilLabel')}
                  </label>
                  <input
                    type="date"
                    disabled={operationalMode !== 'VACATION'}
                    value={vacationUntil}
                    onChange={(e) => setVacationUntil(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 disabled:bg-slate-100 disabled:text-slate-400 text-xs font-mono outline-none focus:border-slate-950"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">{t('shopSettings.vacationUntilHint')}</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                    <Clock size={13} /> {t('shopSettings.prepTimeLabel')}
                  </label>
                  <select
                    value={prepTimeDays}
                    onChange={(e) => setPrepTimeDays(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 outline-none focus:border-slate-950"
                  >
                    {PREP_TIME_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {isEn ? opt.en : opt.value}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">{t('shopSettings.prepTimeHint')}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  {t('shopSettings.vacationNoteLabel')}
                </label>
                <textarea
                  rows={3}
                  disabled={operationalMode !== 'VACATION'}
                  value={vacationNote}
                  onChange={(e) => setVacationNote(e.target.value)}
                  placeholder={t('shopSettings.vacationNotePlaceholder')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 disabled:bg-slate-100 disabled:text-slate-400 text-xs outline-none focus:border-slate-950"
                />
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSavingSettings || !isApproved}
                  className="px-5 py-2.5 rounded-xl bg-[#14171C] hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Save size={14} /> {isSavingSettings ? t('shopSettings.saving') : t('shopSettings.saveOperationsBtn')}
                </button>
              </div>
            </form>
          )}

          {section === 'shipping' && (
            <form
              onSubmit={handleSaveShopSettings}
              className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6"
            >
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-sm font-black text-slate-950">{t('shopSettings.sec3Title')}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{t('shopSettings.sec3Desc')}</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2.5">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin size={14} className="text-slate-700" /> {t('shopSettings.pickupLabel')}
                  </label>
                  <input
                    required
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    placeholder={t('shopSettings.pickupPlaceholder')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-950 outline-none focus:border-slate-950"
                  />
                  <p className="text-[11px] text-slate-500">{t('shopSettings.pickupHint')}</p>
                </div>

                <label className="flex items-center gap-2.5 px-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={returnSameAsPickup}
                    onChange={(e) => setReturnSameAsPickup(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 accent-[#14171C] cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800">{t('shopSettings.returnSameLabel')}</span>
                </label>

                <div
                  className={`p-4 rounded-2xl border space-y-2.5 transition-opacity ${
                    returnSameAsPickup
                      ? 'border-slate-200 bg-slate-100/70 opacity-65'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Truck size={14} className="text-slate-700" /> {t('shopSettings.returnLabel')}
                  </label>
                  <input
                    disabled={returnSameAsPickup}
                    value={returnSameAsPickup ? pickupAddress : returnAddress}
                    onChange={(e) => setReturnAddress(e.target.value)}
                    placeholder={t('shopSettings.returnPlaceholder')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white disabled:bg-slate-100 text-xs font-semibold text-slate-950 outline-none focus:border-slate-950"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSavingSettings || !isApproved}
                  className="px-5 py-2.5 rounded-xl bg-[#14171C] hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Save size={14} /> {isSavingSettings ? t('shopSettings.saving') : t('shopSettings.saveShippingBtn')}
                </button>
              </div>
            </form>
          )}

          {section === 'payment' && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                  <div>
                    <h3 className="text-sm font-black text-slate-950 flex items-center gap-1.5">
                      <ShieldCheck size={16} className="text-emerald-600" /> {t('shopSettings.sec4TaxTitle')}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{t('shopSettings.sec4TaxDesc')}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                    {shop.tax_status || 'VERIFIED'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-[11px] text-slate-500">{t('shopSettings.entityTypeLabel')}</p>
                    <p className="font-bold text-slate-900 mt-0.5">{shop.entity_type || 'INDIVIDUAL'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-[11px] text-slate-500">{t('shopSettings.taxCodeLabel')}</p>
                    <p className="font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                      {shop.tax_code || t('shopSettings.taxCodeFallback')}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-[11px] text-slate-500">{t('shopSettings.legalRepLabel')}</p>
                    <p className="font-bold text-slate-900 mt-0.5">
                      {shop.legal_representative_name || t('shopSettings.notUpdated')}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-[11px] text-slate-500">{t('shopSettings.cccdLabel')}</p>
                    <p className="font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                      {shop.national_id_last4 ? `••••••••${shop.national_id_last4}` : t('shopSettings.notSaved')}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 sm:col-span-2">
                    <p className="text-[11px] text-slate-500">{t('shopSettings.licenseLabel')}</p>
                    <p className="font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                      {shop.business_license_no || t('shopSettings.licenseFallback')}
                    </p>
                  </div>
                </div>
              </div>

              <form
                onSubmit={handleSaveBankAccount}
                className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5"
              >
                <div className="border-b border-slate-100 pb-3.5">
                  <h3 className="text-sm font-black text-slate-950 flex items-center gap-1.5">
                    <Landmark size={16} /> {t('shopSettings.sec4BankTitle')}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{t('shopSettings.sec4BankDesc')}</p>
                </div>

                {bankAccount && (
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-950">
                      <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                      <span>
                        {t('shopSettings.bankCurrentPrefix')} <b>{bankAccount.bank_name}</b> • {t('shopSettings.bankAccShort')}{' '}
                        <b className="font-mono tabular-nums">{bankAccount.account_number}</b> —{' '}
                        <b>{bankAccount.account_holder_name}</b>
                      </span>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-emerald-800">
                      {bankAccount.verification_status} ({Math.round(bankAccount.name_match_score || 0)}%)
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1.5">
                      {t('shopSettings.bankSelectLabel')}
                    </label>
                    <select
                      value={bankCode}
                      onChange={(e) => {
                        const code = e.target.value;
                        setBankCode(code);
                        const found = VIETNAM_BANKS.find((b) => b.code === code);
                        if (found) setBankName(found.name);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 outline-none focus:border-slate-950"
                    >
                      {VIETNAM_BANKS.map((b) => (
                        <option key={b.code} value={b.code}>
                          {b.code} — {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1.5">
                      {t('shopSettings.bankNumberLabel')}
                    </label>
                    <input
                      required
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      placeholder="19036888999011"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-mono tabular-nums text-slate-950 outline-none focus:border-slate-950"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1.5">
                      {t('shopSettings.bankHolderLabel')}
                    </label>
                    <input
                      required
                      value={bankAccountHolder}
                      onChange={(e) => setBankAccountHolder(e.target.value)}
                      placeholder="NGUYEN VAN A"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold uppercase text-slate-950 outline-none focus:border-slate-950"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                      <KeyRound size={13} className="text-amber-600" /> {t('shopSettings.bankPasswordLabel')}
                    </label>
                    <input
                      required
                      type="password"
                      autoComplete="current-password"
                      value={bankVerifyPassword}
                      onChange={(e) => setBankVerifyPassword(e.target.value)}
                      placeholder={t('shopSettings.bankPasswordPlaceholder')}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 bg-amber-50/40 text-xs text-slate-950 outline-none focus:border-slate-950"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={isSavingBank || !isApproved}
                    className="px-5 py-2.5 rounded-xl bg-[#14171C] hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Save size={14} /> {isSavingBank ? t('shopSettings.savingBankBtn') : t('shopSettings.saveBankBtn')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {section === 'security' && (
            <div className="space-y-5">
              <form
                onSubmit={(e) => {
                  if (isGoogleAccount) {
                    e.preventDefault();
                    return;
                  }
                  void handleChangePassword(e);
                }}
                className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5"
              >
                <div className="border-b border-slate-100 pb-3.5">
                  <h3 className="text-sm font-black text-slate-950 flex items-center gap-1.5">
                    <KeyRound size={16} /> {t('shopSettings.sec5PassTitle')}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{t('shopSettings.sec5PassDesc')}</p>
                </div>

                {isGoogleAccount && (
                  <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 flex items-start gap-2.5 text-xs text-blue-950">
                    <ShieldCheck size={16} className="text-blue-600 shrink-0 mt-0.5" />
                    <p className="leading-relaxed font-medium">{t('shopSettings.googlePassDisabledNotice')}</p>
                  </div>
                )}

                <div
                  className={`grid grid-cols-1 md:grid-cols-3 gap-4 transition-opacity ${
                    isGoogleAccount ? 'opacity-45 pointer-events-none select-none' : ''
                  }`}
                >
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1.5">
                      {t('shopSettings.curPassLabel')}
                    </label>
                    <input
                      required={!isGoogleAccount}
                      disabled={isGoogleAccount}
                      type="password"
                      autoComplete="current-password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder={t('shopSettings.curPassPlaceholder')}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white disabled:bg-slate-100 text-xs text-slate-950 outline-none focus:border-slate-950"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1.5">
                      {t('shopSettings.newPassLabel')}
                    </label>
                    <input
                      required={!isGoogleAccount}
                      disabled={isGoogleAccount}
                      type="password"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t('shopSettings.newPassPlaceholder')}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white disabled:bg-slate-100 text-xs text-slate-950 outline-none focus:border-slate-950"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1.5">
                      {t('shopSettings.confirmPassLabel')}
                    </label>
                    <input
                      required={!isGoogleAccount}
                      disabled={isGoogleAccount}
                      type="password"
                      autoComplete="new-password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder={t('shopSettings.confirmPassPlaceholder')}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white disabled:bg-slate-100 text-xs text-slate-950 outline-none focus:border-slate-950"
                    />
                  </div>
                </div>

                <div
                  className={`flex justify-end pt-2 border-t border-slate-100 ${
                    isGoogleAccount ? 'opacity-45 pointer-events-none select-none' : ''
                  }`}
                >
                  <button
                    type="submit"
                    disabled={isChangingPassword || isGoogleAccount}
                    className="px-5 py-2.5 rounded-xl bg-[#14171C] hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed transition-colors"
                  >
                    <Lock size={14} /> {isChangingPassword ? t('shopSettings.updatingPassBtn') : t('shopSettings.updatePassBtn')}
                  </button>
                </div>
              </form>

              <div className="bg-white rounded-2xl border border-rose-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-rose-950 flex items-center gap-1.5">
                    <AlertTriangle size={15} className="text-rose-600" /> {t('shopSettings.logoutAllTitle')}
                  </h4>
                  <p className="text-xs text-slate-600 max-w-xl">{t('shopSettings.logoutAllDesc')}</p>
                </div>

                {!confirmLogoutAll ? (
                  <button
                    type="button"
                    onClick={() => setConfirmLogoutAll(true)}
                    className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                  >
                    <LogOut size={14} /> {t('shopSettings.logoutAllBtn')}
                  </button>
                ) : (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setConfirmLogoutAll(false)}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold cursor-pointer"
                    >
                      {t('shopSettings.logoutAllCancel')}
                    </button>
                    <button
                      type="button"
                      disabled={isLoggingOutAll}
                      onClick={() => void handleLogoutAllDevices()}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
                    >
                      {isLoggingOutAll ? t('shopSettings.logoutAllBusy') : t('shopSettings.logoutAllConfirm')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {section === 'notifications' && (
            <form
              onSubmit={handleSaveShopSettings}
              className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6"
            >
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-sm font-black text-slate-950 flex items-center gap-1.5">
                  <MessageSquare size={16} /> {t('shopSettings.sec6Title')}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{t('shopSettings.sec6Desc')}</p>
              </div>

              <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-800 block">
                  {t('shopSettings.quickReplyLabel')}
                </label>
                <textarea
                  rows={3}
                  value={quickReplyTemplate}
                  onChange={(e) => setQuickReplyTemplate(e.target.value)}
                  placeholder={t('shopSettings.quickReplyPlaceholder')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 leading-relaxed outline-none focus:border-slate-950"
                />
                <div className="flex flex-wrap gap-2 pt-1">
                  {presets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setQuickReplyTemplate(preset)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Sparkles size={11} className="text-amber-600" /> {t('shopSettings.usePreset')} #{idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{t('shopSettings.notifyOrderTitle')}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{t('shopSettings.notifyOrderDesc')}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifyNewOrderEmail}
                    onClick={() => setNotifyNewOrderEmail((v) => !v)}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                      notifyNewOrderEmail ? 'bg-[#14171C]' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifyNewOrderEmail ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{t('shopSettings.notifyStockTitle')}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{t('shopSettings.notifyStockDesc')}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifyLowStockEmail}
                    onClick={() => setNotifyLowStockEmail((v) => !v)}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                      notifyLowStockEmail ? 'bg-[#14171C]' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifyLowStockEmail ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSavingSettings || !isApproved}
                  className="px-5 py-2.5 rounded-xl bg-[#14171C] hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Save size={14} /> {isSavingSettings ? t('shopSettings.saving') : t('shopSettings.saveNotifyBtn')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
