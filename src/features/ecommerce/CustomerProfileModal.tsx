import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  Ruler,
  Store,
  Clock,
  CheckCircle2,
  LogOut,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Camera,
  ShoppingBag,
  Package,
  Truck,
  RotateCcw,
  Edit3,
  Save,
  Check,
  Upload,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useOrders } from '@/context/OrderContext';
import { useI18n } from '@/i18n';
import { UserBodyProfile } from './types';

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userBody: UserBodyProfile;
  onOpenBiometrics: () => void;
  initialTab?: 'profile' | 'measurements' | 'orders' | 'merchant';
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  isOpen,
  onClose,
  userBody,
  onOpenBiometrics,
  initialTab = 'profile',
}) => {
  const { t, locale } = useI18n();
  const {
    currentUser,
    currentStore,
    userRole,
    signOut,
    openOnboarding,
    openStatusModal,
    updateUserProfile,
    getUserProfileDetails,
  } = useAuth();
  const { getUserOrders, cancelOrder } = useOrders();

  const [activeTab, setActiveTab] = useState<'profile' | 'measurements' | 'orders' | 'merchant'>(initialTab);
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<string | null>(null);

  // Edit Profile Form State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    city: '',
    address: '',
    gender: 'male' as 'male' | 'female' | 'other',
    notes: '',
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Bộ sưu tập avatar mẫu thời trang may đo sắc nét
  const PRESET_AVATARS = [
    { id: 'suit-male', label: t('ecommerce.profileModal.preset1', 'Quý Ông Suit'), url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' },
    { id: 'chic-female', label: t('ecommerce.profileModal.preset2', 'Quý Cô Silk'), url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' },
    { id: 'bespoke-tailor', label: t('ecommerce.profileModal.preset3', 'Bespoke Master'), url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80' },
    { id: 'blazer-female', label: t('ecommerce.profileModal.preset4', 'Nữ Doanh Nhân'), url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80' },
    { id: 'minimal-man', label: t('ecommerce.profileModal.preset5', 'Minimalist'), url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80' },
  ];

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert(t('ecommerce.profileModal.avatarSizeLimit', 'Vui lòng chọn ảnh có dung lượng dưới 3MB'));
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      await updateUserProfile({ avatar_url: base64 });
      setSaveSuccessMsg(t('ecommerce.profileModal.avatarSuccess', 'Đã cập nhật ảnh đại diện thành công!'));
      setShowAvatarPicker(false);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPresetAvatar = async (url: string) => {
    await updateUserProfile({ avatar_url: url });
    setSaveSuccessMsg(t('ecommerce.profileModal.avatarSuccess', 'Đã cập nhật ảnh đại diện mới!'));
    setShowAvatarPicker(false);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const userOrders = getUserOrders(currentUser?.id);

  // Load details whenever modal opens or currentUser changes
  useEffect(() => {
    if (isOpen && currentUser) {
      setActiveTab(initialTab);
      setIsEditing(false);
      setSaveSuccessMsg(null);
      const details = getUserProfileDetails(currentUser.id);
      setFormData({
        fullName: currentUser.full_name || '',
        phone: details.phone || '0988 123 456',
        city: details.city || 'Đà Nẵng',
        address: details.address || '123 Nguyễn Văn Linh, P. Hải Châu',
        gender: details.gender || 'male',
        notes: details.notes || 'May đo phom dáng chuẩn, vải tự nhiên',
      });
    }
  }, [isOpen, currentUser, initialTab, getUserProfileDetails]);

  if (!isOpen || !currentUser) return null;

  const isPendingStore = currentStore?.status === 'PENDING';
  const isApprovedStore = userRole === 'store' || currentStore?.status === 'APPROVED';

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveSuccessMsg(null);
    try {
      const res = await updateUserProfile({
        full_name: formData.fullName,
        phone: formData.phone,
        city: formData.city,
        address: formData.address,
        gender: formData.gender,
        notes: formData.notes,
      });
      if (res.success) {
        setSaveSuccessMsg(t('ecommerce.profileModal.saveSuccess', 'Đã cập nhật hồ sơ cá nhân thành công!'));
        setIsEditing(false);
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Dialog Box - High-Contrast Luxury Atelier Styling */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border-[2.5px] border-black overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        
        {/* Header Profile Hero - Deep Slate Midnight High-Contrast: Bấm vào đổi avatar */}
        <div className="p-5 sm:p-6 bg-slate-900 border-b-2 border-black text-white flex-shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              {/* Avatar Tương Tác: Bấm đổi ảnh hoặc chọn avatar mẫu */}
              <div className="relative group shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl shadow-md border-2 border-white overflow-hidden cursor-pointer relative transition-transform group-hover:scale-105 active:scale-95"
                  title={t('ecommerce.profileModal.changeAvatarTooltip', 'Bấm vào để đổi ảnh đại diện (Upload từ máy hoặc chọn ảnh mẫu)')}
                >
                  {currentUser.avatar_url ? (
                    <img
                      src={currentUser.avatar_url}
                      alt={currentUser.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{(currentUser.full_name || 'U').charAt(0).toUpperCase()}</span>
                  )}
                  {/* Overlay hover đổi avatar */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
                    <Camera size={16} />
                    <span className="text-[8px] font-bold mt-0.5">{t('ecommerce.profileModal.changePhoto', 'Đổi ảnh')}</span>
                  </div>
                </button>

                {/* Badge camera nhỏ ở góc */}
                <div
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-500 border-2 border-slate-900 flex items-center justify-center text-white shadow-xs cursor-pointer hover:bg-blue-400"
                  title={t('ecommerce.profileModal.changeAvatar', 'Đổi Avatar')}
                >
                  <Camera size={10} />
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-black tracking-tight text-white leading-tight truncate">
                    {currentUser.full_name || t('ecommerce.sidebar.customerDefault', 'Khách Hàng')}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                    className="text-[10px] text-blue-300 hover:text-white font-bold underline cursor-pointer"
                  >
                    {t('ecommerce.profileModal.changeAvatar', 'Đổi avatar')}
                  </button>
                </div>

                <p className="text-xs text-blue-300 font-mono font-bold mt-0.5 truncate">
                  {currentUser.email}
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border shadow-2xs ${
                    isApprovedStore
                      ? 'bg-amber-400 text-amber-950 border-amber-300'
                      : isPendingStore
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                      : 'bg-blue-600/30 text-blue-200 border-blue-400/40'
                  }`}>
                    {isApprovedStore
                      ? t('ecommerce.profileModal.roleStore', '✂️ Đối Tác Nhà May B2B')
                      : isPendingStore
                      ? t('ecommerce.profileModal.rolePending', '⏳ Chờ Admin Duyệt Mở Shop')
                      : t('ecommerce.profileModal.roleCustomer', '👤 Khách Hàng')}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white flex items-center justify-center cursor-pointer transition-colors border border-slate-700 shrink-0"
              title={t('ecommerce.profileModal.close', 'Đóng')}
            >
              <X size={18} />
            </button>
          </div>

          {/* Panel Chọn & Đổi Avatar khi người dùng bấm vào */}
          {showAvatarPicker && (
            <div className="mt-4 p-3.5 bg-slate-800 rounded-2xl border-2 border-black space-y-2.5 animate-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-slate-200 uppercase tracking-wider text-[11px]">
                  {t('ecommerce.profileModal.changeAvatarTitle', '📷 Đổi Ảnh Đại Diện (Avatar)')}
                </span>
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  {t('ecommerce.profileModal.close', 'Đóng')}
                </button>
              </div>

              {/* Lựa chọn 1: Upload file từ máy */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm border-2 border-black cursor-pointer"
              >
                <Upload size={14} />
                <span>{t('ecommerce.profileModal.uploadFromDevice', 'Tải ảnh từ máy tính / điện thoại')}</span>
              </button>

              {/* Lựa chọn 2: Bộ avatar mẫu phong cách thời trang May Đo */}
              <div>
                <span className="text-[10px] text-slate-400 block mb-1.5 font-bold">
                  {t('ecommerce.profileModal.orChoosePreset', 'Hoặc chọn nhanh avatar mẫu:')}
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {PRESET_AVATARS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => handleSelectPresetAvatar(av.url)}
                      className="group/av flex flex-col items-center gap-1 shrink-0 cursor-pointer"
                      title={av.label}
                    >
                      <img
                        src={av.url}
                        alt={av.label}
                        className="w-10 h-10 rounded-xl object-cover border-2 border-black hover:border-blue-400 group-hover/av:scale-105 transition-all shadow-xs"
                      />
                      <span className="text-[9px] text-slate-400 group-hover/av:text-white truncate max-w-[50px]">
                        {av.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tab Selector - Viền đen 2px sắc nét, từng tab là một nút độc lập */}
        <div className="flex border-b-2 border-black bg-slate-200 p-2 gap-2 flex-shrink-0 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 px-2.5 text-xs font-black rounded-xl border-2 flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
              activeTab === 'profile'
                ? 'border-black bg-blue-600 text-white shadow-xs'
                : 'border-black bg-white text-slate-950 hover:bg-slate-100'
            }`}
          >
            <User size={14} />
            <span>{t('ecommerce.profileModal.tabPersonal', 'Cá Nhân')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('measurements')}
            className={`flex-1 py-2 px-2.5 text-xs font-black rounded-xl border-2 flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
              activeTab === 'measurements'
                ? 'border-black bg-blue-600 text-white shadow-xs'
                : 'border-black bg-white text-slate-950 hover:bg-slate-100'
            }`}
          >
            <Ruler size={14} />
            <span>{t('ecommerce.profileModal.tabMeasurements', 'Số Đo 3D')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-2 px-2.5 text-xs font-black rounded-xl border-2 flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
              activeTab === 'orders'
                ? 'border-black bg-blue-600 text-white shadow-xs'
                : 'border-black bg-white text-slate-950 hover:bg-slate-100'
            }`}
          >
            <ShoppingBag size={14} />
            <span>{t('ecommerce.profileModal.tabOrders', 'Đơn Hàng')} ({userOrders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('merchant')}
            className={`flex-1 py-2 px-2.5 text-xs font-black rounded-xl border-2 flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
              activeTab === 'merchant'
                ? 'border-black bg-amber-600 text-white shadow-xs'
                : 'border-black bg-white text-slate-950 hover:bg-slate-100'
            }`}
          >
            <Store size={14} />
            <span>{t('ecommerce.profileModal.tabRegisterShop', 'Đăng Ký Shop')}</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* TAB 1: THÔNG TIN CÁ NHÂN & CHỈNH SỬA PROFILE ĐẦY ĐỦ */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              
              {/* Alert thông báo lưu thành công */}
              {saveSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 text-xs font-black flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              {/* Header Box thông tin kèm nút bật/tắt Chỉnh Sửa */}
              <div className="flex items-center justify-between pb-1 border-b-2 border-slate-200">
                <div>
                  <h4 className="font-black text-sm text-slate-900 uppercase tracking-wide">
                    {t('ecommerce.profileModal.customerProfileTitle', 'Hồ Sơ Khách Hàng')}
                  </h4>
                  <p className="text-[11px] text-slate-600 font-medium">
                    {isEditing ? t('ecommerce.profileModal.editSubtitle', 'Nhập thông tin mới và nhấn Lưu để cập nhật') : t('ecommerce.profileModal.viewSubtitle', 'Thông tin dùng để giao nhận trang phục may đo & liên hệ')}
                  </p>
                </div>

                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white border-2 border-black text-xs font-black transition-all cursor-pointer shadow-xs hover:scale-102 active:scale-98"
                  >
                    <Edit3 size={14} />
                    <span>{t('ecommerce.profileModal.editProfile', 'Chỉnh Sửa Hồ Sơ')}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 border-2 border-black text-xs font-bold transition-all cursor-pointer"
                  >
                    {t('ecommerce.profileModal.cancel', 'Hủy Bỏ')}
                  </button>
                )}
              </div>

              {/* Chế độ 1: FORM CHỈNH SỬA PROFILE ĐẦY ĐỦ */}
              {isEditing ? (
                <form onSubmit={handleSaveProfile} className="p-4 rounded-2xl bg-slate-50 border-2 border-black space-y-3.5 animate-in fade-in">
                  {/* Họ và Tên */}
                  <div>
                    <label className="text-[11px] font-black uppercase text-slate-700 block mb-1">
                      {t('ecommerce.profileModal.fullName', 'Họ và Tên')} <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white border-2 border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs font-black text-slate-900 outline-none transition-all"
                      placeholder={t('ecommerce.profileModal.namePlaceholder', 'Nhập họ và tên đầy đủ...')}
                    />
                  </div>

                  {/* Email (Readonly) */}
                  <div>
                    <label className="text-[11px] font-black uppercase text-slate-500 block mb-1">
                      {t('ecommerce.profileModal.emailFixed', 'Email Tài Khoản (Cố Định)')}
                    </label>
                    <input
                      type="email"
                      disabled
                      value={currentUser.email}
                      className="w-full px-3 py-2 rounded-xl bg-slate-200/80 border-2 border-slate-300 text-xs font-mono font-bold text-slate-600 cursor-not-allowed"
                    />
                  </div>

                  {/* Số điện thoại */}
                  <div>
                    <label className="text-[11px] font-black uppercase text-slate-700 block mb-1">
                      {t('ecommerce.profileModal.phoneNumber', 'Số Điện Thoại Nhận Hàng')} <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white border-2 border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs font-mono font-black text-slate-900 outline-none transition-all"
                      placeholder={t('ecommerce.profileModal.phonePlaceholder', 'Ví dụ: 0988 123 456')}
                    />
                  </div>

                  {/* Tỉnh / Thành Phố */}
                  <div>
                    <label className="text-[11px] font-black uppercase text-slate-700 block mb-1">
                      {t('ecommerce.profileModal.city', 'Tỉnh / Thành Phố')} <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white border-2 border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs font-black text-slate-900 outline-none transition-all cursor-pointer"
                    >
                      <option value="Đà Nẵng">Đà Nẵng</option>
                      <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                      <option value="Hà Nội">Hà Nội</option>
                      <option value="Cần Thơ">Cần Thơ</option>
                      <option value="Hải Phòng">Hải Phòng</option>
                      <option value="Huế">Thừa Thiên Huế</option>
                      <option value="Quảng Nam">Quảng Nam</option>
                      <option value="Khác">{t('ecommerce.profileModal.cityOther', 'Tỉnh / Thành khác')}</option>
                    </select>
                  </div>

                  {/* Địa chỉ chi tiết */}
                  <div>
                    <label className="text-[11px] font-black uppercase text-slate-700 block mb-1">
                      {t('ecommerce.profileModal.detailedAddress', 'Địa Chỉ Chi Tiết (Số Nhà, Đường, Phường)')} <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white border-2 border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs font-bold text-slate-900 outline-none transition-all"
                      placeholder={t('ecommerce.profileModal.addressPlaceholder', 'Ví dụ: 123 Nguyễn Văn Linh, P. Nam Dương, Q. Hải Châu')}
                    />
                  </div>

                  {/* Nút Submit Form */}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold text-xs transition-colors cursor-pointer"
                    >
                      {t('ecommerce.profileModal.cancel', 'Hủy')}
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-black text-xs shadow-md border-2 border-blue-500 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Save size={15} />
                      <span>{isSaving ? t('ecommerce.profileModal.saving', 'Đang Lưu...') : t('ecommerce.profileModal.saveChanges', 'Lưu Thay Đổi')}</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Chế độ 2: XEM HỒ SƠ TƯƠNG PHẢN CAO, RÕ RÀNG */
                <div className="p-4 rounded-2xl bg-white border-2 border-black space-y-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0 border border-blue-200">
                      <User size={18} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-600 font-black uppercase tracking-wider block">
                        {t('ecommerce.profileModal.fullName', 'Họ và Tên')}
                      </span>
                      <span className="text-sm font-black text-slate-900 block truncate">
                        {currentUser.full_name || formData.fullName || t('ecommerce.sidebar.customerDefault', 'Khách Hàng')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 border-t-2 border-slate-100 pt-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0 border border-indigo-200">
                      <Mail size={18} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-600 font-black uppercase tracking-wider block">
                        {t('ecommerce.profileModal.email', 'Email Tài Khoản')}
                      </span>
                      <span className="text-xs font-mono font-black text-slate-900 block truncate">{currentUser.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 border-t-2 border-slate-100 pt-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200">
                      <Phone size={18} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-600 font-black uppercase tracking-wider block">
                        {t('ecommerce.profileModal.phone', 'Số Điện Thoại')}
                      </span>
                      <span className="text-xs font-mono font-black text-slate-900 block">{formData.phone}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 border-t-2 border-slate-100 pt-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
                      <MapPin size={18} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-600 font-black uppercase tracking-wider block">
                        {t('ecommerce.profileModal.deliveryAddress', 'Địa Chỉ Nhận Hàng May Đo')}
                      </span>
                      <span className="text-xs font-black text-slate-900 block leading-tight">{formData.address}, {formData.city}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tùy chọn tài khoản & bảo mật */}
              <div className="p-4 rounded-2xl bg-slate-50 border-2 border-black space-y-3">
                <span className="text-[11px] font-black uppercase text-slate-900 tracking-wider block">
                  {t('ecommerce.profileModal.settingsTitle', '⚙️ Cài Đặt & Tùy Chọn Tài Khoản')}
                </span>
                
                <div className="space-y-2 text-xs">
                  <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 cursor-pointer transition-colors">
                    <span className="font-extrabold text-slate-900">
                      {t('ecommerce.profileModal.optEase', 'Tự động so khớp Ease Allowance (Độ cử động 3D)')}
                    </span>
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded cursor-pointer" />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 cursor-pointer transition-colors">
                    <span className="font-extrabold text-slate-900">
                      {t('ecommerce.profileModal.optEmail', 'Nhận thông báo tiến độ may đo qua Email')}
                    </span>
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded cursor-pointer" />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 cursor-pointer transition-colors">
                    <span className="font-extrabold text-slate-900">
                      {t('ecommerce.profileModal.optBadge', 'Hiển thị huy hiệu khách hàng Bespoke')}
                    </span>
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded cursor-pointer" />
                  </label>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50 border-2 border-blue-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-blue-700" />
                  <span className="text-xs text-blue-950 font-black">
                    {t('ecommerce.profileModal.securityTitle', 'Bảo Mật Dữ Liệu Nhân Trắc Học')}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-200 text-blue-900 font-black">
                  ISO 8559-1
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: HỒ SƠ SỐ ĐO 3D */}
          {activeTab === 'measurements' && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl bg-sky-50 border-2 border-sky-300">
                  <span className="text-[10px] font-bold text-sky-800 block">{t('ecommerce.sidebar.height', 'CHIỀU CAO')}</span>
                  <span className="text-lg font-black text-sky-950">{userBody.height_cm} cm</span>
                </div>
                <div className="p-3 rounded-2xl bg-purple-50 border-2 border-purple-300">
                  <span className="text-[10px] font-bold text-purple-800 block">{t('ecommerce.sidebar.weight', 'CÂN NẶNG')}</span>
                  <span className="text-lg font-black text-purple-950">{userBody.weight_kg} kg</span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50 border-2 border-emerald-300">
                  <span className="text-[10px] font-bold text-emerald-800 block">{t('ecommerce.sidebar.chest', 'VÒNG NGỰC')}</span>
                  <span className="text-lg font-black text-emerald-950">{userBody.chest_cm} cm</span>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50 border-2 border-amber-300">
                  <span className="text-[10px] font-bold text-amber-800 block">{t('ecommerce.sidebar.waist', 'VÒNG EO')}</span>
                  <span className="text-lg font-black text-amber-950">{userBody.waist_cm} cm</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <span className="text-[11px] font-bold text-stone-800 block">
                  {t('ecommerce.profileModal.easePref', 'Độ Cử Động May Đo Yêu Thích (Ease Allowance)')}
                </span>
                <div className="flex gap-2">
                  <span className="flex-1 py-1.5 px-2 rounded-lg bg-blue-600 text-white text-[11px] font-bold text-center">
                    {t('ecommerce.profileModal.easeStandard', 'Tiêu Chuẩn (+5cm)')}
                  </span>
                  <span className="flex-1 py-1.5 px-2 rounded-lg bg-white border border-stone-300 text-stone-700 text-[11px] font-medium text-center">
                    {t('ecommerce.profileModal.easeSlim', 'Ôm Sát (+3cm)')}
                  </span>
                  <span className="flex-1 py-1.5 px-2 rounded-lg bg-white border border-stone-300 text-stone-700 text-[11px] font-medium text-center">
                    {t('ecommerce.profileModal.easeLoose', 'Thoải Mái (+7cm)')}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenBiometrics();
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Ruler size={14} />
                  <span>{t('ecommerce.profileModal.updateMeasurements', 'Cập Nhật Số Đo')}</span>
                </button>
                <a
                  href="/dashboard"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-900 border border-stone-300 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer text-center"
                >
                  <Camera size={14} />
                  <span>{t('ecommerce.profileModal.rescan3D', 'Quét 3D Lại')}</span>
                </a>
              </div>
            </div>
          )}

          {/* TAB 3: ĐƠN HÀNG CỦA TÔI (THEO LUỒNG ĐỒ ÁN TMĐT CHUẨN) */}
          {activeTab === 'orders' && (
            <div className="space-y-3.5">
              {/* Filter Pills */}
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
                {[
                  { id: 'all', label: t('ecommerce.orders.filterAll', 'Tất cả') },
                  { id: 'pending', label: t('ecommerce.orders.filterPending', 'Chờ duyệt') },
                  { id: 'tailoring', label: t('ecommerce.orders.filterTailoring', 'Đang may đo') },
                  { id: 'shipping', label: t('ecommerce.orders.filterShipping', 'Đang giao') },
                  { id: 'completed', label: t('ecommerce.orders.filterCompleted', 'Hoàn thành') },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setOrderFilter(f.id)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer whitespace-nowrap ${
                      orderFilter === f.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Order List */}
              {userOrders.filter((o) => orderFilter === 'all' || o.status === orderFilter).length === 0 ? (
                <div className="p-8 text-center bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200 space-y-2">
                  <Package size={28} className="text-stone-400 mx-auto" />
                  <p className="text-xs font-bold text-stone-700">{t('ecommerce.orders.emptyTitle', 'Chưa có đơn hàng nào trong mục này')}</p>
                  <p className="text-[11px] text-stone-500">{t('ecommerce.orders.emptyDesc', 'Các trang phục bạn đặt may đo sẽ hiển thị tiến độ tại đây.')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userOrders
                    .filter((o) => orderFilter === 'all' || o.status === orderFilter)
                    .map((order) => {
                      const isExpanded = selectedOrderDetails === order.id;

                      const getStatusBadge = () => {
                        switch (order.status) {
                          case 'pending':
                            return { label: t('ecommerce.orders.statusPending', '⏳ Chờ xử lý'), cls: 'bg-amber-100 text-amber-900 border-amber-300' };
                          case 'confirmed':
                            return { label: t('ecommerce.orders.statusConfirmed', '✓ Đã xác nhận'), cls: 'bg-blue-100 text-blue-900 border-blue-300' };
                          case 'tailoring':
                            return { label: t('ecommerce.orders.statusTailoring', '✂️ Đang may đo'), cls: 'bg-indigo-100 text-indigo-900 border-indigo-300' };
                          case 'shipping':
                            return { label: t('ecommerce.orders.statusShipping', '🚚 Đang giao hàng'), cls: 'bg-purple-100 text-purple-900 border-purple-300' };
                          case 'completed':
                            return { label: t('ecommerce.orders.statusCompleted', '✓ Đã nhận hàng'), cls: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
                          case 'cancelled':
                            return { label: t('ecommerce.orders.statusCancelled', '✕ Đã hủy'), cls: 'bg-rose-100 text-rose-900 border-rose-300' };
                          default:
                            return { label: order.status, cls: 'bg-stone-100 text-stone-800 border-stone-300' };
                        }
                      };

                      const badge = getStatusBadge();

                      return (
                        <div
                          key={order.id}
                          className="bg-white border-2 border-stone-200 rounded-2xl p-4 shadow-xs space-y-3 hover:border-slate-300 transition-all"
                        >
                          {/* Order Header */}
                          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-xs text-blue-700">{order.id}</span>
                                <span className="text-[10px] text-stone-400">·</span>
                                <span className="text-[10px] font-bold text-amber-800">{order.store_name}</span>
                              </div>
                              <span className="text-[10px] text-stone-400 block mt-0.5">
                                {new Date(order.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'vi-VN')} {new Date(order.created_at).toLocaleTimeString(locale === 'en' ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs ${badge.cls}`}>
                              {badge.label}
                            </span>
                          </div>

                          {/* Items Preview */}
                          <div className="space-y-2">
                            {order.items.map((it) => (
                              <div key={it.id} className="flex items-center justify-between gap-2.5 text-xs">
                                <img
                                  src={it.product.image_url}
                                  alt={it.product.name}
                                  className="w-9 h-11 object-cover rounded-lg border border-stone-200 flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-bold text-stone-900 truncate">
                                    {locale === 'en' && it.product.name_en ? it.product.name_en : it.product.name}
                                  </h5>
                                  <div className="flex items-center gap-1.5 text-[10px] text-stone-500">
                                    <span className="font-semibold text-blue-700">{t('ecommerce.orders.sizePrefix', 'Cỡ:')} {it.variant.size_label}</span>
                                    <span>·</span>
                                    <span>{t('ecommerce.orders.qtyPrefix', 'SL:')} {it.quantity}</span>
                                    {it.is_ai_recommended && (
                                      <span className="text-emerald-700 font-bold">{t('ecommerce.orders.aiFit', '✓ Vừa vặn AI')}</span>
                                    )}
                                  </div>
                                </div>
                                <span className="font-mono font-bold text-stone-800">
                                  {((it.product.sale_price || it.product.price) * it.quantity).toLocaleString('vi-VN')} ₫
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Expanded Details */}
                          {isExpanded && (
                            <div className="pt-2.5 border-t border-dashed border-stone-200 space-y-2 text-xs bg-stone-50/80 -mx-4 -mb-3 p-4 rounded-b-2xl">
                              <div className="grid grid-cols-2 gap-2 text-[11px]">
                                <div>
                                  <span className="text-stone-500 block">{t('ecommerce.orders.recipient', 'Người nhận:')}</span>
                                  <strong className="text-stone-900 font-bold">{order.recipient.full_name} ({order.recipient.phone})</strong>
                                </div>
                                <div>
                                  <span className="text-stone-500 block">{t('ecommerce.orders.payment', 'Thanh toán:')}</span>
                                  <strong className="text-stone-900 font-bold">
                                    {order.payment_method === 'vietqr_sepay' ? '💳 VietQR / SePay' : '💵 COD'}
                                  </strong>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-stone-500 block">{t('ecommerce.orders.deliveryAddress', 'Địa chỉ giao:')}</span>
                                  <strong className="text-stone-900 font-bold">{order.recipient.address}, {order.recipient.city}</strong>
                                </div>
                                {order.recipient.note && (
                                  <div className="col-span-2">
                                    <span className="text-stone-500 block">{t('ecommerce.orders.note', 'Ghi chú:')}</span>
                                    <span className="text-stone-700 italic">{order.recipient.note}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Order Footer & Actions */}
                          <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                            <div>
                              <span className="text-[10px] text-stone-500 block">{t('ecommerce.orders.totalAmount', 'Tổng tiền đơn')}</span>
                              <strong className="text-sm font-mono font-black text-blue-700">
                                {order.total_amount.toLocaleString('vi-VN')} ₫
                              </strong>
                            </div>

                            <div className="flex gap-2">
                              {order.status === 'pending' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(t('ecommerce.orders.confirmCancel', 'Bạn có chắc muốn hủy đơn hàng này không?'))) {
                                      cancelOrder(order.id);
                                    }
                                  }}
                                  className="px-2.5 py-1 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50 text-[11px] font-bold cursor-pointer"
                                >
                                  {t('ecommerce.orders.cancelOrder', 'Hủy Đơn')}
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setSelectedOrderDetails(isExpanded ? null : order.id)}
                                className="px-3 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-bold cursor-pointer transition-colors"
                              >
                                {isExpanded ? t('ecommerce.orders.collapseDetails', 'Thu gọn') : t('ecommerce.orders.viewDetails', 'Xem chi tiết')}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ĐĂNG KÝ GIAN HÀNG SHOP (QUY TRÌNH DUYỆT QUA ADMIN) */}
          {activeTab === 'merchant' && (
            <div className="space-y-3.5">
              {isApprovedStore ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 space-y-3 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-emerald-950">
                      {t('ecommerce.merchant.approvedTitle', 'Gian Hàng Đã Được Admin Phê Duyệt!')}
                    </h4>
                    <p className="text-xs text-emerald-800 mt-1">
                      {t('ecommerce.merchant.brandLabel', 'Thương hiệu:')} <strong>{currentStore?.brand_name || 'Nhà May Sartoria'}</strong>
                    </p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      {t('ecommerce.merchant.approvedDesc', 'Bạn có toàn quyền tải rập may và cấu hình bảng số đo cử động.')}
                    </p>
                  </div>
                  <a
                    href="/tailor"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
                  >
                    <Store size={15} />
                    <span>{t('ecommerce.merchant.enterStudio', 'Vào Studio Nhà May (/tailor)')}</span>
                    <ChevronRight size={14} />
                  </a>
                </div>
              ) : isPendingStore ? (
                <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 space-y-3 text-center">
                  <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center mx-auto shadow-sm">
                    <Clock size={24} className="animate-spin" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-amber-950">
                      {t('ecommerce.merchant.pendingTitle', 'Hồ Sơ Đang Chờ Ban Quản Trị (Admin) Phê Duyệt')}
                    </h4>
                    <p className="text-xs text-amber-800 mt-1">
                      {t('ecommerce.merchant.shopLabel', 'Gian hàng:')} <strong>{currentStore?.brand_name || 'Nhà May Đang Chờ'}</strong>
                    </p>
                    <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                      {t('ecommerce.merchant.pendingDesc', 'Admin đang kiểm tra hồ sơ tay nghề may đo và xác thực thông tin. Sau khi Admin duyệt, bạn sẽ nhận được thông báo để vào Studio.')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      openStatusModal();
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-amber-300 text-amber-900 font-extrabold text-xs hover:bg-amber-100 cursor-pointer"
                  >
                    <span>{t('ecommerce.merchant.viewPending', 'Xem Chi Tiết Hồ Sơ Đang Chờ')}</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50/70 border-2 border-amber-200 space-y-3 text-left">
                  <div className="flex items-center gap-2">
                    <Store size={20} className="text-amber-700" />
                    <h4 className="font-black text-sm text-amber-950">
                      {t('ecommerce.merchant.registerTitle', 'Đăng Ký Trở Thành Đối Tác Nhà May B2B')}
                    </h4>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    {t('ecommerce.merchant.registerDesc', 'Bạn là nhà may đo, xưởng thiết kế hay thợ may bespoke? Hãy nộp hồ sơ gian hàng để bán sản phẩm trực tiếp trên FitVision 3D.')}
                  </p>
                  <div className="p-3 rounded-xl bg-white border border-amber-200 text-[11px] text-stone-700 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900">
                      <Sparkles size={13} className="text-amber-600" />
                      <span>{t('ecommerce.merchant.processHeading', 'Quy trình duyệt qua Ban Quản Trị (Admin):')}</span>
                    </div>
                    <p className="text-stone-600 pl-4">
                      {t('ecommerce.merchant.step1', '1. Gửi hồ sơ tên nhà may, SĐT và tài liệu kinh nghiệm.')}<br />
                      {t('ecommerce.merchant.step2', '2. Ban Quản Trị (Admin) kiểm duyệt năng lực may đo.')}<br />
                      {t('ecommerce.merchant.step3', '3. Kích hoạt tài khoản Chủ Shop & mở Studio Nhà May.')}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      openOnboarding();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Store size={15} />
                    <span>{t('ecommerce.merchant.submitCta', 'Nộp Đơn Đăng Ký Mở Gian Hàng May Đo')}</span>
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Logout Action - Nút có viền 2px dày, ngăn cách rõ ràng */}
        <div className="p-4 bg-slate-200 border-t-2 border-black flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              signOut();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border-2 border-black font-black text-xs flex items-center gap-2 transition-all cursor-pointer shadow-2xs hover:scale-102 active:scale-98"
          >
            <LogOut size={15} />
            <span>{t('ecommerce.profileModal.signOut', 'Đăng Xuất Tài Khoản')}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-black text-xs border-2 border-black transition-all cursor-pointer shadow-xs hover:scale-102 active:scale-98"
          >
            {t('ecommerce.profileModal.close', 'Đóng')}
          </button>
        </div>

      </div>
    </div>
  );
};

