// =============================================================================
// FITVISION 3D - USER ACCOUNT SETTINGS (CHUẨN SHOPEE CÔNG NGHIỆP)
// Thiết kế Atelier Editorial Hiện đại · Đầy đủ 5 phân hệ theo yêu cầu P0 & P1
// =============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  User,
  ShieldCheck,
  MapPin,
  CreditCard,
  Bell,
  Trash2,
  Lock,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Edit2,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  Mail,
  Camera,
  Eye,
  EyeOff,
  LogOut,
  Sliders,
  Check,
  Building2,
  Home,
  Briefcase,
  AlertCircle,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';
import {
  UserAddress,
  RefundBankAccount,
  EaseAllowanceType,
  VIETNAM_BANKS,
  AddressType,
} from '@/types/settings.types';
import { validatePhoneNumber, validatePassword } from '@/lib/validationRules';

type TabKey = 'profile' | 'security' | 'addresses' | 'bank' | 'privacy';

export const UserSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, locale } = useI18n();
  const isEn = locale === 'en';

  const {
    currentUser,
    updateUserProfile,
    getUserProfileDetails,
    userAddresses,
    defaultAddress,
    saveAddress,
    deleteAddress,
    setDefaultAddress,
    refundBank,
    saveRefundBank,
    deleteRefundBank,
    userPreferences,
    updateUserPreferences,
    changePassword,
    revokeAllSessions,
    deleteMy3DData,
    requestAccountLock,
    signOut,
  } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab') as TabKey;
    return ['profile', 'security', 'addresses', 'bank', 'privacy'].includes(tabParam)
      ? tabParam
      : 'profile';
  });

  // Profile Form State
  const initialDetails = getUserProfileDetails(currentUser?.id);
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [phone, setPhone] = useState(initialDetails.phone || '');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(
    initialDetails.gender || 'male'
  );
  const [birthDate, setBirthDate] = useState(initialDetails.birth_date || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar_url || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Sync profile when currentUser loads
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.full_name || '');
      setAvatarUrl(currentUser.avatar_url || '');
      const d = getUserProfileDetails(currentUser.id);
      setPhone(d.phone || '');
      setGender(d.gender || 'male');
      setBirthDate(d.birth_date || '');
    }
  }, [currentUser]);

  // Security & Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const confirmMismatch = confirmPassword.length > 0 && confirmPassword !== newPassword;
  const confirmMatch = confirmPassword.length > 0 && confirmPassword === newPassword;
  const [isSubmittingPass, setIsSubmittingPass] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState(false);

  // Address Modal State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [addrName, setAddrName] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrDistrict, setAddrDistrict] = useState('');
  const [addrDetail, setAddrDetail] = useState('');
  const [addrLabel, setAddrLabel] = useState<AddressType>('home');
  const [addrIsDefault, setAddrIsDefault] = useState(false);
  const [addrError, setAddrError] = useState<string | null>(null);

  // Bank Modal State
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [bankCode, setBankCode] = useState('VCB');
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [bankError, setBankError] = useState<string | null>(null);

  // Dangerous Action Modals
  const [isConfirmDelete3DOpen, setIsConfirmDelete3DOpen] = useState(false);
  const [isConfirmLockAccountOpen, setIsConfirmLockAccountOpen] = useState(false);
  const [lockReason, setLockReason] = useState('');
  const [isConfirmRevokeSessionsOpen, setIsConfirmRevokeSessionsOpen] = useState(false);

  // Password Strength Calculation
  const passStrength = React.useMemo(() => {
    if (!newPassword) return { score: 0, text: isEn ? 'Empty' : 'Trống', color: 'bg-slate-200' };
    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;

    if (score <= 1) return { score: 1, text: isEn ? 'Weak' : 'Yếu', color: 'bg-rose-500' };
    if (score === 2) return { score: 2, text: isEn ? 'Fair' : 'Trung bình', color: 'bg-amber-500' };
    if (score === 3) return { score: 3, text: isEn ? 'Good' : 'Khá mạnh', color: 'bg-[#26356B]/100' };
    return { score: 4, text: isEn ? 'Strong' : 'Rất mạnh', color: 'bg-emerald-500' };
  }, [newPassword, isEn]);

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);

    if (!fullName.trim()) {
      setProfileError(isEn ? 'Please enter your full name' : 'Vui lòng nhập họ và tên');
      return;
    }

    if (phone.trim() && !validatePhoneNumber(phone.trim())) {
      setProfileError(
        isEn
          ? 'Invalid Vietnam phone number (10 digits starting with 0)'
          : 'Số điện thoại không hợp lệ (gồm 10 số, bắt đầu bằng 03, 05, 07, 08, 09)'
      );
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await updateUserProfile({
        full_name: fullName.trim(),
        avatar_url: avatarUrl,
        phone: phone.trim(),
        gender,
        birth_date: birthDate,
      });

      if (res.success) {
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
      } else {
        setProfileError(res.error || (isEn ? 'Update failed' : 'Cập nhật thất bại'));
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(false);

    if (!newPassword || newPassword.length < 8) {
      setPassError(
        isEn ? 'New password must be at least 8 characters' : 'Mật khẩu mới phải có ít nhất 8 ký tự'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError(isEn ? 'Passwords do not match' : 'Mật khẩu xác nhận không trùng khớp');
      return;
    }

    setIsSubmittingPass(true);
    try {
      const res = await changePassword(oldPassword || undefined, newPassword);
      if (res.success) {
        setPassSuccess(true);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPassSuccess(false), 3500);
      } else {
        setPassError(res.error || (isEn ? 'Failed to update password' : 'Đổi mật khẩu thất bại'));
      }
    } finally {
      setIsSubmittingPass(false);
    }
  };

  // Open Address Modal
  const handleOpenAddAddress = () => {
    setEditingAddress(null);
    setAddrName(currentUser?.full_name || '');
    setAddrPhone(initialDetails.phone || '');
    setAddrCity(initialDetails.city || 'Đà Nẵng');
    setAddrDistrict('');
    setAddrDetail('');
    setAddrLabel('home');
    setAddrIsDefault(userAddresses.length === 0);
    setAddrError(null);
    setIsAddressModalOpen(true);
  };

  const handleOpenEditAddress = (addr: UserAddress) => {
    setEditingAddress(addr);
    setAddrName(addr.recipientName);
    setAddrPhone(addr.phone);
    setAddrCity(addr.city);
    setAddrDistrict(addr.district || '');
    setAddrDetail(addr.detailedAddress);
    setAddrLabel(addr.label);
    setAddrIsDefault(addr.isDefault);
    setAddrError(null);
    setIsAddressModalOpen(true);
  };

  const handleSaveAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddrError(null);

    if (!addrName.trim()) {
      setAddrError(isEn ? 'Recipient name is required' : 'Vui lòng nhập họ tên người nhận');
      return;
    }
    if (!addrPhone.trim() || !validatePhoneNumber(addrPhone.trim())) {
      setAddrError(
        isEn ? 'Please enter a valid phone number' : 'Vui lòng nhập số điện thoại hợp lệ'
      );
      return;
    }
    if (!addrCity.trim()) {
      setAddrError(isEn ? 'City is required' : 'Vui lòng nhập Tỉnh / Thành phố');
      return;
    }
    if (!addrDetail.trim()) {
      setAddrError(isEn ? 'Detailed address is required' : 'Vui lòng nhập địa chỉ chi tiết (số nhà, tên đường)');
      return;
    }

    saveAddress({
      id: editingAddress?.id,
      recipientName: addrName.trim(),
      phone: addrPhone.trim(),
      city: addrCity.trim(),
      district: addrDistrict.trim() || undefined,
      detailedAddress: addrDetail.trim(),
      label: addrLabel,
      isDefault: addrIsDefault,
    });

    setIsAddressModalOpen(false);
  };

  // Open Bank Modal
  const handleOpenBankModal = () => {
    if (refundBank) {
      setBankCode(refundBank.bankCode);
      setBankAccountNo(refundBank.accountNumber);
      setBankAccountHolder(refundBank.accountHolderName);
    } else {
      setBankCode('VCB');
      setBankAccountNo('');
      setBankAccountHolder(currentUser?.full_name?.toUpperCase() || '');
    }
    setBankError(null);
    setIsBankModalOpen(true);
  };

  const handleSaveBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBankError(null);

    if (!bankAccountNo.trim() || bankAccountNo.trim().length < 6) {
      setBankError(isEn ? 'Invalid bank account number' : 'Số tài khoản ngân hàng không hợp lệ (tối thiểu 6 chữ số)');
      return;
    }

    if (!bankAccountHolder.trim()) {
      setBankError(isEn ? 'Account holder name is required' : 'Vui lòng nhập tên chủ tài khoản');
      return;
    }

    const selectedBank = VIETNAM_BANKS.find((b) => b.code === bankCode) || VIETNAM_BANKS[0];

    saveRefundBank({
      bankCode: selectedBank.code,
      bankName: selectedBank.name,
      accountNumber: bankAccountNo.trim(),
      accountHolderName: bankAccountHolder.trim().toUpperCase(),
      isVerified: true,
      linkedAt: new Date().toISOString(),
    });

    setIsBankModalOpen(false);
  };

  const presetAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  ];

  return (
    <div className="min-h-screen bg-[#F1ECE2] text-[#17150F] font-sans antialiased pb-16">
      {/* Top Banner Navigation */}
      <header className="sticky top-0 z-40 bg-[#F1ECE2]/95 border-b border-[#D8CBB1]/70">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-control text-slate-500 hover:text-[#17150F] hover:bg-[#E8E1D3]/60 transition-colors"
              title={isEn ? 'Back to storefront' : 'Về trang mua sắm'}
            >
              <ArrowLeft size={18} />
            </button>
            <div className="h-5 w-px bg-slate-200" />
            <div>
              <h1 className="font-sans text-xl font-bold text-[#17150F] tracking-tight">
                {isEn ? 'Account Settings' : 'Cài Đặt Tài Khoản'}
              </h1>
              <p className="text-[11px] font-medium text-[#4A463C] hidden sm:block">
                {isEn
                  ? 'Manage your profile, security and 3D privacy'
                  : 'Quản lý hồ sơ, bảo mật và quyền riêng tư dữ liệu 3D'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden md:inline">
              {currentUser?.email}
            </span>
            <button
              onClick={() => navigate('/')}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {isEn ? 'Storefront' : 'Trang chủ'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================= LEFT SIDEBAR (SHOPEE STYLE) ================= */}
          <aside className="lg:col-span-3 bg-white rounded-card border border-[#D8CBB1]/70 p-4 shadow-card">
            {/* User Avatar & Mini Header */}
            <div className="flex items-center gap-3 pb-4 mb-3 border-b border-[#D8CBB1]/40">
              <div className="relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={currentUser?.full_name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-[#26356B]"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#26356B] text-white font-bold text-lg flex items-center justify-center">
                    {(currentUser?.full_name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="overflow-hidden">
                <div className="font-bold text-sm text-[#17150F] truncate">
                  {currentUser?.full_name || (isEn ? 'Customer' : 'Khách hàng')}
                </div>
                <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {currentUser?.email}
                </div>
              </div>
            </div>

            {/* Shopee-style Navigation Items */}
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-control text-xs font-semibold transition-colors text-left ${
                  activeTab === 'profile'
                    ? 'bg-[#26356B]/10 text-[#26356B] font-bold ring-1 ring-inset ring-[#26356B]/20'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-[#17150F]'
                }`}
              >
                <User size={16} className={activeTab === 'profile' ? 'text-[#26356B]' : 'text-slate-400'} />
                <span>{isEn ? 'My Profile' : 'Hồ sơ của tôi'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-control text-xs font-semibold transition-colors text-left ${
                  activeTab === 'security'
                    ? 'bg-[#26356B]/10 text-[#26356B] font-bold ring-1 ring-inset ring-[#26356B]/20'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-[#17150F]'
                }`}
              >
                <Lock size={16} className={activeTab === 'security' ? 'text-[#26356B]' : 'text-slate-400'} />
                <span>{isEn ? 'Security & Password' : 'Bảo mật & Mật khẩu'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('addresses')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-control text-xs font-semibold transition-colors text-left ${
                  activeTab === 'addresses'
                    ? 'bg-[#26356B]/10 text-[#26356B] font-bold ring-1 ring-inset ring-[#26356B]/20'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-[#17150F]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <MapPin size={16} className={activeTab === 'addresses' ? 'text-[#26356B]' : 'text-slate-400'} />
                  <span>{isEn ? 'Address Book' : 'Địa chỉ nhận hàng'}</span>
                </div>
                {userAddresses.length > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[#E8E1D3]/60 text-slate-600 font-bold">
                    {userAddresses.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('bank')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-control text-xs font-semibold transition-colors text-left ${
                  activeTab === 'bank'
                    ? 'bg-[#26356B]/10 text-[#26356B] font-bold ring-1 ring-inset ring-[#26356B]/20'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-[#17150F]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CreditCard size={16} className={activeTab === 'bank' ? 'text-[#26356B]' : 'text-slate-400'} />
                  <span>{isEn ? 'Refund Bank' : 'Ngân hàng nhận hoàn tiền'}</span>
                </div>
                {refundBank && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title={isEn ? 'Linked' : 'Đã liên kết'} />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('privacy')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-control text-xs font-semibold transition-colors text-left ${
                  activeTab === 'privacy'
                    ? 'bg-[#26356B]/10 text-[#26356B] font-bold ring-1 ring-inset ring-[#26356B]/20'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-[#17150F]'
                }`}
              >
                <Bell size={16} className={activeTab === 'privacy' ? 'text-[#26356B]' : 'text-slate-400'} />
                <span>{isEn ? 'Notifications & 3D Privacy' : 'Thông báo & Quyền riêng tư'}</span>
              </button>
            </nav>

            <div className="pt-4 mt-4 border-t border-[#D8CBB1]/40 space-y-2">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-control text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-[#17150F]"
              >
                <div className="flex items-center gap-2.5">
                  <Sliders size={14} className="text-slate-400" />
                  <span>{isEn ? '3D Body Studio' : 'Phòng Quét 3D'}</span>
                </div>
                <ExternalLink size={12} className="text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => signOut()}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-control text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut size={14} />
                <span>{isEn ? 'Sign Out' : 'Đăng xuất tài khoản'}</span>
              </button>
            </div>
          </aside>

          {/* ================= RIGHT CONTENT AREA ================= */}
          <section className="lg:col-span-9 bg-white rounded-card border border-[#D8CBB1]/70 p-6 sm:p-8 shadow-card">
            {/* ------------------ TAB 1: MY PROFILE (P0) ------------------ */}
            {activeTab === 'profile' && (
              <div>
                <div className="border-b border-[#D8CBB1]/40 pb-4 mb-6">
                  <h2 className="text-xl font-bold text-[#17150F] tracking-tight">
                    {isEn ? 'My Profile' : 'Hồ Sơ Của Tôi'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isEn
                      ? 'Manage your personal profile and display information across FitVision 3D'
                      : 'Quản lý thông tin hồ sơ cá nhân và hiển thị mua sắm tại FitVision 3D'}
                  </p>
                </div>

                {profileSuccess && (
                  <div className="mb-4 p-3 rounded-control bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>{isEn ? 'Profile updated successfully!' : 'Đã cập nhật hồ sơ cá nhân thành công!'}</span>
                  </div>
                )}

                {profileError && (
                  <div className="mb-4 p-3 rounded-control bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle size={16} className="text-rose-600 shrink-0" />
                    <span>{profileError}</span>
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Left Form Controls */}
                    <div className="md:col-span-8 space-y-4">
                      {/* Email Read-only */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {isEn ? 'Email Address' : 'Địa chỉ Email'}
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            value={currentUser?.email || ''}
                            disabled
                            className="w-full text-xs px-3.5 py-2.5 rounded-control bg-[#E8E1D3]/60/80 border border-slate-200 text-slate-500 font-mono cursor-not-allowed select-none"
                          />
                          <div className="absolute right-3 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <ShieldCheck size={12} className="text-emerald-600" />
                            <span>{isEn ? 'Verified' : 'Đã xác thực'}</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {isEn
                            ? 'Email is fixed to protect order history and digital tailor passports'
                            : 'Email là định danh bất biến để bảo vệ lịch sử đơn hàng và hồ sơ may đo'}
                        </p>
                      </div>

                      {/* Full Name */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {isEn ? 'Full Name' : 'Họ và tên'} <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder={isEn ? 'John Smith' : 'Nguyễn Văn A'}
                          className="w-full text-xs px-3.5 py-2.5 rounded-control border border-slate-300 focus:border-[#26356B] focus:ring-1 focus:ring-[#26356B] outline-none transition-all font-medium"
                          required
                        />
                      </div>

                      {/* Phone Number */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {isEn ? 'Phone Number' : 'Số điện thoại nhận hàng'}
                        </label>
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="0988 123 456"
                          className="w-full text-xs px-3.5 py-2.5 rounded-control border border-slate-300 focus:border-[#26356B] focus:ring-1 focus:ring-[#26356B] outline-none transition-all font-medium"
                        />
                      </div>

                      {/* Gender Radio */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          {isEn ? 'Gender' : 'Giới tính'}
                        </label>
                        <div className="flex items-center gap-6 text-xs text-slate-700 h-[38px]">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="gender"
                              value="male"
                              checked={gender === 'male'}
                              onChange={() => setGender('male')}
                              className="text-[#26356B] focus:ring-[#26356B]"
                            />
                            <span>{isEn ? 'Male' : 'Nam'}</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="gender"
                              value="female"
                              checked={gender === 'female'}
                              onChange={() => setGender('female')}
                              className="text-[#26356B] focus:ring-[#26356B]"
                            />
                            <span>{isEn ? 'Female' : 'Nữ'}</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="gender"
                              value="other"
                              checked={gender === 'other'}
                              onChange={() => setGender('other')}
                              className="text-[#26356B] focus:ring-[#26356B]"
                            />
                            <span>{isEn ? 'Other' : 'Khác'}</span>
                          </label>
                        </div>
                      </div>

                      {/* Date of Birth */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          {isEn ? 'Date of Birth (Optional)' : 'Ngày sinh (Tùy chọn)'}
                        </label>
                        <input
                          type="date"
                          value={birthDate}
                          onChange={(e) => setBirthDate(e.target.value)}
                          className="w-full text-xs px-3.5 py-2 rounded-control border border-slate-300 focus:border-[#26356B] focus:ring-1 focus:ring-[#26356B] outline-none"
                        />
                      </div>
                      </div>
                    </div>

                    {/* Right Avatar Selector */}
                    <div className="md:col-span-4 flex flex-col items-center justify-start p-4 rounded-control bg-slate-50 border border-slate-200/80">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-300 shadow-sm mb-3">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 font-bold text-2xl">
                            <User size={36} />
                          </div>
                        )}
                      </div>

                      <div className="text-[11px] font-bold text-slate-700 mb-2">
                        {isEn ? 'Choose Avatar' : 'Chọn ảnh đại diện'}
                      </div>

                      {/* Quick presets */}
                      <div className="grid grid-cols-3 gap-1.5 mb-3">
                        {presetAvatars.map((url, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setAvatarUrl(url)}
                            className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all ${
                              avatarUrl === url
                                ? 'border-[#26356B] scale-105 shadow-xs'
                                : 'border-transparent hover:opacity-80'
                            }`}
                          >
                            <img src={url} alt={`preset ${i}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        {avatarUrl && (
                          <button
                            type="button"
                            onClick={() => setAvatarUrl('')}
                            className="text-[10px] text-slate-500 hover:text-rose-600 underline"
                          >
                            {isEn ? 'Remove image' : 'Gỡ ảnh'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#D8CBB1]/40 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="px-6 py-2.5 rounded-control bg-[#26356B] hover:bg-[#1B274F] text-white font-bold text-xs transition-all disabled:opacity-50"
                    >
                      {isSavingProfile
                        ? isEn
                          ? 'Saving...'
                          : 'Đang lưu...'
                        : isEn
                        ? 'Save Changes'
                        : 'Lưu Thay Đổi'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ------------------ TAB 2: SECURITY & SESSIONS (P0) ------------------ */}
            {activeTab === 'security' && (
              <div className="space-y-8">
                {/* Header */}
                <div className="border-b border-[#D8CBB1]/40 pb-4">
                  <h2 className="text-xl font-bold text-[#17150F] tracking-tight">
                    {isEn ? 'Security & Sessions' : 'Bảo Mật & Quản Lý Phiên'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isEn
                      ? 'Change login password and manage active browser sessions on all devices'
                      : 'Cập nhật mật khẩu đăng nhập và quản lý các thiết bị đang kết nối'}
                  </p>
                </div>

                {/* Password Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Lock size={16} className="text-[#26356B]" />
                    <h3 className="text-sm font-bold text-[#17150F]">
                      {isEn ? 'Password Settings' : 'Đổi Mật Khẩu'}
                    </h3>
                  </div>

                  {passSuccess && (
                    <div className="p-3 rounded-control bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <span>
                        {isEn
                          ? 'Password updated successfully!'
                          : 'Đã đổi mật khẩu bảo vệ tài khoản thành công!'}
                      </span>
                    </div>
                  )}

                  {passError && (
                    <div className="p-3 rounded-control bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                      <AlertCircle size={16} className="text-rose-600 shrink-0" />
                      <span>{passError}</span>
                    </div>
                  )}

                  <form onSubmit={handleChangePassword} className="space-y-3.5 max-w-lg">
                    {/* Current Password */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isEn ? 'Current Password' : 'Mật khẩu hiện tại'}
                      </label>
                      <div className="relative">
                        <input
                          type={showOldPass ? 'text' : 'password'}
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full text-xs px-3.5 py-2.5 rounded-control border border-slate-300 focus:border-[#26356B] focus:ring-1 focus:ring-[#26356B] outline-none font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOldPass(!showOldPass)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                        >
                          {showOldPass ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {isEn
                          ? 'Leave blank if your account was created directly with Google OAuth'
                          : 'Bỏ trống nếu bạn đăng ký bằng Google và chưa từng tạo mật khẩu'}
                      </span>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isEn ? 'New Password' : 'Mật khẩu mới'} <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPass ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder={isEn ? 'At least 8 characters...' : 'Tối thiểu 8 ký tự...'}
                          className="w-full text-xs px-3.5 py-2.5 rounded-control border border-slate-300 focus:border-[#26356B] focus:ring-1 focus:ring-[#26356B] outline-none font-mono"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                        >
                          {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>

                      {/* Password strength bar */}
                      {newPassword && (
                        <div className="mt-1.5 space-y-1">
                          <div className="h-1.5 w-full bg-[#E8E1D3]/60 rounded-full overflow-hidden flex gap-1">
                            {[1, 2, 3, 4].map((step) => (
                              <div
                                key={step}
                                className={`h-full flex-1 transition-all ${
                                  step <= passStrength.score ? passStrength.color : 'bg-slate-200'
                                }`}
                              />
                            ))}
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-500">
                            <span>
                              {isEn ? 'Strength:' : 'Độ an toàn:'}{' '}
                              <strong className="text-slate-800">{passStrength.text}</strong>
                            </span>
                            <span>{newPassword.length}/32 {isEn ? 'characters' : 'ký tự'}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Confirm New Password */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isEn ? 'Confirm New Password' : 'Xác nhận mật khẩu mới'} <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPass ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder={isEn ? 'Re-enter new password...' : 'Nhập lại mật khẩu mới...'}
                          aria-invalid={confirmMismatch}
                          className={`w-full text-xs pl-3.5 pr-10 py-2.5 rounded-control border-2 outline-none font-mono transition-all ${
                            confirmMismatch
                              ? 'border-[#D8452A] bg-[#D8452A]/5 focus:ring-2 focus:ring-[#D8452A]/20'
                              : confirmMatch
                              ? 'border-[#3F6B4E] bg-[#3F6B4E]/5 focus:ring-2 focus:ring-[#3F6B4E]/20'
                              : 'border-slate-300 focus:border-[#26356B] focus:ring-1 focus:ring-[#26356B]'
                          }`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPass(!showConfirmPass)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                        >
                          {showConfirmPass ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>

                      {/* Match indicator bar */}
                      {confirmPassword && (
                        <div className="mt-2 space-y-1.5" role="status" aria-live="polite">
                          <div className="h-1.5 w-full rounded-full bg-[#E8E1D3] overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                confirmMatch ? 'bg-[#3F6B4E] w-full' : 'bg-[#D8452A] w-full animate-pulse'
                              }`}
                            />
                          </div>
                          <div
                            className={`flex items-center gap-1.5 text-[11px] font-semibold ${
                              confirmMatch ? 'text-[#3F6B4E]' : 'text-[#D8452A]'
                            }`}
                          >
                            {confirmMatch ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                            <span>
                              {confirmMatch
                                ? isEn ? 'Passwords match' : 'Mật khẩu xác nhận trùng khớp'
                                : isEn ? 'Passwords do not match' : 'Mật khẩu xác nhận không trùng khớp'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingPass || confirmMismatch}
                      className="px-5 py-2.5 rounded-control bg-[#17150F] hover:bg-[#26356B] text-white font-bold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmittingPass
                        ? isEn
                          ? 'Updating...'
                          : 'Đang cập nhật...'
                        : isEn
                        ? 'Update Password'
                        : 'Xác Nhận Đổi Mật Khẩu'}
                    </button>
                  </form>
                </div>

                <div className="h-px bg-[#E8E1D3]/60" />

                {/* Active Sessions Management */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Laptop size={16} className="text-[#26356B]" />
                      <div>
                        <h3 className="text-sm font-bold text-[#17150F]">
                          {isEn ? 'Active Sessions' : 'Quản Lý Phiên Đăng Nhập'}
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          {isEn
                            ? 'Devices currently authorized to access your FitVision 3D account'
                            : 'Các thiết bị hiện đang duy trì phiên đăng nhập vào tài khoản'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsConfirmRevokeSessionsOpen(true)}
                      className="px-3.5 py-1.5 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors"
                    >
                      {isEn ? 'Log out all devices' : 'Đăng xuất khỏi tất cả thiết bị'}
                    </button>
                  </div>

                  {/* Device List */}
                  <div className="space-y-2.5">
                    {/* Current device */}
                    <div className="p-3.5 rounded-control border border-[#26356B]/25 bg-[#26356B]/10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#26356B]/10 text-[#26356B] flex items-center justify-center shrink-0">
                          <Laptop size={18} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#17150F] flex items-center gap-1.5">
                            <span>{isEn ? 'Chrome on Windows (This device)' : 'Chrome trên Windows (Thiết bị này)'}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                              {isEn ? 'Current session' : 'Phiên hiện tại'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {isEn ? 'IP: 118.69.182.*** · Da Nang, Vietnam · Active now' : 'IP: 118.69.182.*** · Đà Nẵng, Việt Nam · Đang hoạt động'}
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* ------------------ TAB 3: ADDRESS BOOK (P1) ------------------ */}
            {activeTab === 'addresses' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-[#D8CBB1]/40 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#17150F] tracking-tight">
                      {isEn ? 'Address Book' : 'Sổ Địa Chỉ Nhận Hàng'}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isEn
                        ? 'Saved delivery destinations for seamless 1-click checkout'
                        : 'Lưu nhiều địa chỉ để tự động điền nhanh khi đặt hàng may đo & mua sắm'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAddAddress}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-control bg-[#26356B] hover:bg-[#1B274F] text-white font-bold text-xs shadow-sm transition-all"
                  >
                    <Plus size={14} />
                    <span>{isEn ? 'Add New Address' : 'Thêm Địa Chỉ Mới'}</span>
                  </button>
                </div>

                {userAddresses.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-card border border-dashed border-slate-300">
                    <MapPin size={32} className="mx-auto text-slate-400 mb-2" />
                    <p className="text-xs font-bold text-slate-700">
                      {isEn ? 'No addresses saved yet' : 'Chưa có địa chỉ nhận hàng nào'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 mb-3">
                      {isEn
                        ? 'Add an address to speed up your checkout process'
                        : 'Thêm địa chỉ để hệ thống tự động điền khi thanh toán'}
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenAddAddress}
                      className="px-4 py-1.5 rounded-lg bg-[#26356B] text-white text-xs font-bold shadow-xs hover:bg-[#1B274F]"
                    >
                      {isEn ? 'Add now' : 'Thêm ngay'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userAddresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`p-4 rounded-control border transition-all ${
                          addr.isDefault
                            ? 'border-[#26356B]/30 bg-[#26356B]/10 shadow-2xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-[#17150F]">
                                {addr.recipientName}
                              </span>
                              <span className="text-slate-300">|</span>
                              <span className="text-xs font-mono font-medium text-slate-600">
                                {addr.phone}
                              </span>

                              {/* Label badge */}
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md border border-slate-200 bg-[#E8E1D3]/60 text-slate-700 flex items-center gap-1">
                                {addr.label === 'home' ? (
                                  <>
                                    <Home size={10} /> {isEn ? 'Home' : 'Nhà riêng'}
                                  </>
                                ) : addr.label === 'office' ? (
                                  <>
                                    <Briefcase size={10} /> {isEn ? 'Office' : 'Văn phòng'}
                                  </>
                                ) : (
                                  <>
                                    <MapPin size={10} /> {isEn ? 'Other' : 'Khác'}
                                  </>
                                )}
                              </span>

                              {/* Default Badge */}
                              {addr.isDefault && (
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-rose-300 bg-rose-50 text-rose-700">
                                  {isEn ? 'Default' : 'Mặc định'}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-600 font-medium">
                              {addr.detailedAddress}
                              {addr.district ? `, ${addr.district}` : ''}, {addr.city}
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenEditAddress(addr)}
                              className="text-xs text-[#26356B] hover:text-[#1B274F] font-semibold"
                            >
                              {isEn ? 'Edit' : 'Cập nhật'}
                            </button>

                            {!addr.isDefault && (
                              <>
                                <span className="text-slate-300">|</span>
                                <button
                                  type="button"
                                  onClick={() => setDefaultAddress(addr.id)}
                                  className="text-xs text-slate-600 hover:text-[#17150F] font-medium"
                                >
                                  {isEn ? 'Set Default' : 'Thiết lập mặc định'}
                                </button>
                                <span className="text-slate-300">|</span>
                                <button
                                  type="button"
                                  onClick={() => deleteAddress(addr.id)}
                                  className="text-xs text-rose-600 hover:text-rose-800"
                                  title={isEn ? 'Delete address' : 'Xóa địa chỉ'}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ------------------ TAB 4: REFUND BANK ACCOUNT (P1) ------------------ */}
            {activeTab === 'bank' && (
              <div className="space-y-6">
                <div className="border-b border-[#D8CBB1]/40 pb-4">
                  <h2 className="text-xl font-bold text-[#17150F] tracking-tight">
                    {isEn ? 'Refund Bank Account' : 'Tài Khoản Ngân Hàng Nhận Hoàn Tiền'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isEn
                      ? 'Registered bank account for automatic VietQR refund reconciliation if an order is cancelled'
                      : 'Tài khoản ngân hàng dùng để nhận tiền hoàn trả khi hủy đơn hàng đã thanh toán qua VietQR'}
                  </p>
                </div>

                {/* Information Card */}
                <div className="p-3.5 rounded-control bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                  <AlertCircle size={16} className="text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    {isEn ? 'Automatic VietQR refund policy' : 'Quy định hoàn tiền VietQR tự động'}
                    <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                      {isEn ? 'For accurate automatic reconciliation, the bank account holder name must match the name of the person who placed the order. Refunds are transferred automatically within 1-2 business days after the cancellation is approved.' : 'Để đối soát tự động chính xác, tên chủ tài khoản ngân hàng phải trùng khớp với họ tên người đặt hàng. Tiền hoàn sẽ được chuyển tự động trong vòng 1-2 ngày làm việc sau khi đơn hủy được phê duyệt.'}
                    </p>
                  </div>
                </div>

                {/* Current Bank Account Display */}
                {refundBank ? (
                  <div className="max-w-md">
                    {/* Bank Card Graphic */}
                    <div className="p-5 rounded-card bg-[#26356B] text-white shadow-card space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 size={18} className="text-[#C9D2F5]" />
                          <span className="font-bold text-sm tracking-wide">
                            {refundBank.bankName || refundBank.bankCode}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                          {isEn ? 'LINKED' : 'ĐÃ LIÊN KẾT'}
                        </span>
                      </div>

                      <div className="py-2">
                        <span className="text-[10px] uppercase text-slate-400 tracking-wider block">
                          {isEn ? 'Account number' : 'Số tài khoản'}
                        </span>
                        <div className="font-mono text-lg font-bold tracking-widest text-slate-100">
                          {refundBank.accountNumber.length > 4
                            ? '•••• •••• ' + refundBank.accountNumber.slice(-4)
                            : refundBank.accountNumber}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                        <div>
                          <span className="text-[9px] uppercase text-slate-400 block">
                            {isEn ? 'Account holder' : 'Chủ tài khoản'}
                          </span>
                          <span className="font-bold font-mono tracking-wider">
                            {refundBank.accountHolderName}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          NAPAS 24/7
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-4">
                      <button
                        type="button"
                        onClick={handleOpenBankModal}
                        className="px-4 py-2 rounded-control border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        {isEn ? 'Update Account' : 'Cập nhật tài khoản'}
                      </button>
                      <button
                        type="button"
                        onClick={deleteRefundBank}
                        className="px-4 py-2 rounded-control border border-rose-200 text-xs font-bold text-rose-600 hover:bg-rose-50"
                      >
                        {isEn ? 'Unlink' : 'Gỡ liên kết'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 bg-slate-50 rounded-card border border-dashed border-slate-300 max-w-md">
                    <CreditCard size={32} className="mx-auto text-slate-400 mb-2" />
                    <p className="text-xs font-bold text-slate-700">
                      {isEn ? 'No bank account linked' : 'Chưa liên kết tài khoản nhận hoàn tiền'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 mb-3">
                      {isEn ? 'Link now to be ready for refunds if a tailored order needs adjusting' : 'Liên kết ngay để sẵn sàng nhận hoàn tiền nếu đơn hàng may đo cần điều chỉnh'}
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenBankModal}
                      className="px-4 py-2 rounded-control bg-[#26356B] hover:bg-[#1B274F] text-white font-bold text-xs shadow-xs"
                    >
                      {isEn ? 'Link Bank Account' : 'Liên kết tài khoản ngân hàng'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ------------------ TAB 5: PRIVACY & NOTIFICATIONS (P1) ------------------ */}
            {activeTab === 'privacy' && (
              <div className="space-y-8">
                <div className="border-b border-[#D8CBB1]/40 pb-4">
                  <h2 className="text-xl font-bold text-[#17150F] tracking-tight">
                    {isEn ? 'Notifications & 3D Privacy' : 'Thông Báo & Quyền Riêng Tư 3D'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isEn
                      ? 'Configure order notification channels, 3D ease preferences, and GDPR zero-retention controls'
                      : 'Thiết lập nhận thông báo, độ cử động gợi ý size và quyền kiểm soát dữ liệu cá nhân'}
                  </p>
                </div>

                {/* 1. Notification Preferences */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Bell size={16} className="text-[#26356B]" />
                    <h3 className="text-sm font-bold text-[#17150F]">
                      {isEn ? 'Email Notifications' : 'Thông Báo Qua Email'}
                    </h3>
                  </div>

                  <div className="space-y-2 max-w-xl">
                    <label className="flex items-center justify-between p-3 rounded-control border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                      <div>
                        <div className="text-xs font-bold text-[#17150F]">
                          {isEn ? 'Order status updates' : 'Cập nhật trạng thái đơn hàng'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {isEn ? 'Get emails when a tailored order is approved, starts tailoring or ships' : 'Nhận email khi đơn may đo được duyệt, bắt đầu may hoặc gửi hàng'}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={userPreferences.emailOrderUpdates}
                        onChange={(e) =>
                          updateUserPreferences({ emailOrderUpdates: e.target.checked })
                        }
                        className="w-4 h-4 text-[#26356B] rounded focus:ring-[#26356B]"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-control border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                      <div>
                        <div className="text-xs font-bold text-[#17150F]">
                          {isEn ? 'Promotions & exclusive drops' : 'Ưu đãi & sự kiện độc quyền'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {isEn ? 'Receive vouchers and periodic bespoke fashion collections' : 'Nhận mã giảm giá và bộ sưu tập thời trang may đo định kỳ'}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={userPreferences.emailPromotions}
                        onChange={(e) =>
                          updateUserPreferences({ emailPromotions: e.target.checked })
                        }
                        className="w-4 h-4 text-[#26356B] rounded focus:ring-[#26356B]"
                      />
                    </label>
                  </div>
                </div>

                <div className="h-px bg-[#E8E1D3]/60" />

                {/* 2. 3D Ease Allowance Preference */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sliders size={16} className="text-[#26356B]" />
                    <h3 className="text-sm font-bold text-[#17150F]">
                      {isEn ? '3D Garment Ease Allowance' : 'Độ Cử Động May Đo Ưa Thích'}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 max-w-xl">
                    {isEn ? 'Choose the extra room added when FitVision 3D matches your body measurements against a brand size chart:' : 'Tùy chọn độ rộng cộng thêm khi thuật toán FitVision 3D đối chiếu số đo cơ thể với bảng size của thương hiệu:'}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
                    {[
                      {
                        key: 'slim' as EaseAllowanceType,
                        title: isEn ? 'Slim Fit' : 'Ôm Sát',
                        desc: isEn ? 'Close to body (+0 to 2cm)' : 'Ôm sát cơ thể (+0 đến 2cm)',
                        color: 'hover:border-blue-400',
                      },
                      {
                        key: 'regular' as EaseAllowanceType,
                        title: isEn ? 'Regular Fit' : 'Vừa Vặn',
                        desc: isEn ? 'Standard comfort (+3 to 5cm)' : 'Vừa vặn chuẩn mực (+3 đến 5cm)',
                        color: 'hover:border-blue-400',
                      },
                      {
                        key: 'relaxed' as EaseAllowanceType,
                        title: isEn ? 'Relaxed Fit' : 'Rộng Rãi',
                        desc: isEn ? 'Loose and relaxed (+6 to 8cm)' : 'Rộng rãi thoải mái (+6 đến 8cm)',
                        color: 'hover:border-blue-400',
                      },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() =>
                          updateUserPreferences({ easeAllowancePreference: item.key })
                        }
                        className={`p-3.5 rounded-control border text-left transition-all ${
                          userPreferences.easeAllowancePreference === item.key
                            ? 'border-[#26356B] bg-[#26356B]/10 shadow-xs ring-1 ring-[#26356B]'
                            : 'border-slate-200 bg-white ' + item.color
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-[#17150F]">{item.title}</span>
                          {userPreferences.easeAllowancePreference === item.key && (
                            <CheckCircle2 size={14} className="text-[#26356B]" />
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-[#E8E1D3]/60" />

                {/* 3. Strict Zero-Retention & GDPR Controls */}
                <div className="p-4 rounded-card bg-rose-50/60 border border-rose-200 space-y-3 max-w-2xl">
                  <div className="flex items-center gap-2 text-rose-800">
                    <ShieldCheck size={18} className="text-rose-600" />
                    <h3 className="text-sm font-bold">
                      {isEn ? 'GDPR & Zero-Image Retention Controls' : 'Vùng Kiểm Soát Quyền Riêng Tư (Zero-Retention)'}
                    </h3>
                  </div>

                  <p className="text-xs text-rose-900/80 leading-relaxed">
                    {isEn ? 'FitVision 3D strictly follows a zero personal-image retention standard. You can delete all your anthropometric data and 3D model at any time:' : 'FitVision 3D tuân thủ nghiêm ngặt tiêu chuẩn không lưu trữ hình ảnh cá nhân. Bạn có toàn quyền xóa toàn bộ các chỉ số nhân trắc học và mô hình 3D bất kỳ lúc nào:'}
                  </p>

                  <div className="pt-2 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setIsConfirmDelete3DOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-control bg-white border border-rose-300 text-rose-700 hover:bg-rose-100/60 text-xs font-bold transition-colors"
                    >
                      <Trash2 size={14} />
                      <span>{isEn ? 'Delete my 3D measurement data' : 'Xóa toàn bộ dữ liệu số đo 3D của tôi'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsConfirmLockAccountOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-control bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-xs"
                    >
                      <Lock size={14} />
                      <span>{isEn ? 'Request account lock' : 'Yêu cầu khóa tài khoản'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* ================= MODAL: THÊM / SỬA ĐỊA CHỈ (CHUẨN SHOPEE) ================= */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#17150F]/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-card border border-slate-200 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#D8CBB1]/40">
              <h3 className="text-sm font-bold text-[#17150F]">
                {editingAddress
                  ? isEn
                    ? 'Edit Delivery Address'
                    : 'Cập Nhật Địa Chỉ Nhận Hàng'
                  : isEn
                  ? 'Add Delivery Address'
                  : 'Địa Chỉ Nhận Hàng Mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            </div>

            {addrError && (
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium">
                {addrError}
              </div>
            )}

            <form onSubmit={handleSaveAddressSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isEn ? 'Recipient Name' : 'Họ và tên'} *
                  </label>
                  <input
                    type="text"
                    value={addrName}
                    onChange={(e) => setAddrName(e.target.value)}
                    placeholder={isEn ? 'John Smith' : 'Nguyễn Văn A'}
                    className="w-full px-3 py-2 rounded-control border border-slate-300 focus:border-[#26356B] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isEn ? 'Phone Number' : 'Số điện thoại'} *
                  </label>
                  <input
                    type="text"
                    value={addrPhone}
                    onChange={(e) => setAddrPhone(e.target.value)}
                    placeholder="0988 123 456"
                    className="w-full px-3 py-2 rounded-control border border-slate-300 focus:border-[#26356B] outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isEn ? 'City / Province' : 'Tỉnh / Thành phố'} *
                  </label>
                  <input
                    type="text"
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    placeholder={isEn ? 'Da Nang, Hanoi...' : 'Đà Nẵng, Hà Nội...'}
                    className="w-full px-3 py-2 rounded-control border border-slate-300 focus:border-[#26356B] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isEn ? 'District' : 'Quận / Huyện'}
                  </label>
                  <input
                    type="text"
                    value={addrDistrict}
                    onChange={(e) => setAddrDistrict(e.target.value)}
                    placeholder={isEn ? 'Hai Chau, Cau Giay...' : 'Hải Châu, Cầu Giấy...'}
                    className="w-full px-3 py-2 rounded-control border border-slate-300 focus:border-[#26356B] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isEn ? 'Detailed Address (House No, Street)' : 'Địa chỉ chi tiết (Số nhà, ngõ, tên đường)'} *
                </label>
                <textarea
                  value={addrDetail}
                  onChange={(e) => setAddrDetail(e.target.value)}
                  placeholder={isEn ? 'e.g. 123 Nguyen Van Linh Street, Nam Duong Ward...' : 'Ví dụ: 123 Nguyễn Văn Linh, Phường Nam Dương...'}
                  rows={2}
                  className="w-full px-3 py-2 rounded-control border border-slate-300 focus:border-[#26356B] outline-none resize-none"
                  required
                />
              </div>

              {/* Address Label */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isEn ? 'Address Type' : 'Loại địa chỉ'}
                </label>
                <div className="flex gap-2">
                  {[
                    { id: 'home', label: isEn ? 'Home' : 'Nhà riêng', icon: Home },
                    { id: 'office', label: isEn ? 'Office' : 'Văn phòng', icon: Briefcase },
                    { id: 'other', label: isEn ? 'Other' : 'Khác', icon: MapPin },
                  ].map((lbl) => {
                    const Icon = lbl.icon;
                    return (
                      <button
                        key={lbl.id}
                        type="button"
                        onClick={() => setAddrLabel(lbl.id as AddressType)}
                        className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                          addrLabel === lbl.id
                            ? 'border-[#26356B] bg-[#26356B]/10 text-[#26356B] font-bold ring-1 ring-inset ring-[#26356B]/20'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Icon size={12} />
                        <span>{lbl.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Set default checkbox */}
              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addrIsDefault}
                  onChange={(e) => setAddrIsDefault(e.target.checked)}
                  className="w-4 h-4 text-[#26356B] rounded focus:ring-[#26356B]"
                />
                <span className="text-xs font-medium text-slate-700">
                  {isEn ? 'Set as default address' : 'Đặt làm địa chỉ mặc định'}
                </span>
              </label>

              <div className="pt-3 border-t border-[#D8CBB1]/40 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-4 py-2 rounded-control border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
                >
                  {isEn ? 'Cancel' : 'Trở lại'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-control bg-[#26356B] hover:bg-[#1B274F] text-white font-bold shadow-xs"
                >
                  {isEn ? 'Save' : 'Hoàn thành'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: LIÊN KẾT TÀI KHOẢN NGÂN HÀNG ================= */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#17150F]/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-card border border-slate-200 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#D8CBB1]/40">
              <h3 className="text-sm font-bold text-[#17150F]">
                {isEn ? 'Link Refund Bank Account' : 'Liên Kết Tài Khoản Ngân Hàng Hoàn Tiền'}
              </h3>
              <button
                type="button"
                onClick={() => setIsBankModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            </div>

            {bankError && (
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium">
                {bankError}
              </div>
            )}

            <form onSubmit={handleSaveBankSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isEn ? 'Select Bank' : 'Ngân hàng'} *
                </label>
                <select
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-control border border-slate-300 focus:border-[#26356B] outline-none bg-white font-medium"
                >
                  {VIETNAM_BANKS.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.shortName} - {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isEn ? 'Account Number' : 'Số tài khoản ngân hàng'} *
                </label>
                <input
                  type="text"
                  value={bankAccountNo}
                  onChange={(e) => setBankAccountNo(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder={isEn ? 'e.g. 1029384756...' : 'Ví dụ: 1029384756...'}
                  className="w-full px-3 py-2.5 rounded-control border border-slate-300 focus:border-[#26356B] outline-none font-mono text-sm"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isEn ? 'Account Holder Name (Uppercase)' : 'Tên chủ tài khoản (In hoa không dấu)'} *
                </label>
                <input
                  type="text"
                  value={bankAccountHolder}
                  onChange={(e) => setBankAccountHolder(e.target.value.toUpperCase())}
                  placeholder="NGUYEN VAN A"
                  className="w-full px-3 py-2.5 rounded-control border border-slate-300 focus:border-[#26356B] outline-none font-mono font-bold"
                  required
                />
              </div>

              <div className="pt-3 border-t border-[#D8CBB1]/40 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBankModalOpen(false)}
                  className="px-4 py-2 rounded-control border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
                >
                  {isEn ? 'Cancel' : 'Hủy'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-control bg-[#26356B] hover:bg-[#1B274F] text-white font-bold shadow-xs"
                >
                  {isEn ? 'Save Account' : 'Xác nhận liên kết'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: XÁC NHẬN XÓA DỮ LIỆU 3D ================= */}
      {isConfirmDelete3DOpen && (
        <div className="fixed inset-0 z-50 bg-[#17150F]/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-card border border-rose-200 shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-[#17150F] tracking-tight">
                {isEn ? 'Delete your 3D measurement data?' : 'Xác Nhận Xóa Dữ Liệu Số Đo 3D?'}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {isEn ? (
                  <>This will <strong>permanently delete</strong> all 13 anthropometric measurements and your 3D mannequin model from our system under the Zero-Retention standard. This action cannot be undone.</>
                ) : (
                  <>Hành động này sẽ <strong>xóa vĩnh viễn</strong> toàn bộ 13 chỉ số nhân trắc học và mô hình 3D Mannequin của bạn trên hệ thống theo chuẩn Zero-Retention. Hành động này không thể hoàn tác.</>
                )}
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmDelete3DOpen(false)}
                className="flex-1 py-2.5 rounded-control border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                {isEn ? 'Keep my measurements' : 'Giữ lại số đo'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  await deleteMy3DData();
                  setIsConfirmDelete3DOpen(false);
                }}
                className="flex-1 py-2.5 rounded-control bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
              >
                {isEn ? 'Delete permanently' : 'Xóa vĩnh viễn'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: XÁC NHẬN KHÓA TÀI KHOẢN ================= */}
      {isConfirmLockAccountOpen && (
        <div className="fixed inset-0 z-50 bg-[#17150F]/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-card border border-rose-200 shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-[#17150F] tracking-tight">
                {isEn ? 'Request account lock?' : 'Yêu Cầu Khóa Tài Khoản?'}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {isEn ? 'After locking, you will be signed out immediately and cannot sign in again until you contact an administrator to unlock it.' : 'Sau khi khóa, bạn sẽ bị đăng xuất ngay lập tức và không thể đăng nhập lại cho đến khi liên hệ Quản trị viên để mở khóa.'}
              </p>
            </div>

            <textarea
              value={lockReason}
              onChange={(e) => setLockReason(e.target.value)}
              placeholder={isEn ? 'Reason for locking your account (optional)...' : 'Nhập lý do muốn khóa tài khoản (không bắt buộc)...'}
              rows={2}
              className="w-full text-xs p-3 rounded-control border border-slate-300 outline-none resize-none"
            />

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmLockAccountOpen(false)}
                className="flex-1 py-2.5 rounded-control border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                {isEn ? 'Cancel' : 'Hủy bỏ'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  await requestAccountLock(lockReason);
                  setIsConfirmLockAccountOpen(false);
                  navigate('/');
                }}
                className="flex-1 py-2.5 rounded-control bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
              >
                {isEn ? 'Confirm lock' : 'Xác nhận khóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ĐĂNG XUẤT TẤT CẢ THIẾT BỊ ================= */}
      {isConfirmRevokeSessionsOpen && (
        <div className="fixed inset-0 z-50 bg-[#17150F]/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-card border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <LogOut size={24} />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-[#17150F] tracking-tight">
                {isEn ? 'Log out of all devices?' : 'Đăng Xuất Khỏi Tất Cả Thiết Bị?'}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {isEn ? 'All sessions on other phones and computers will be revoked immediately. You will also need to sign in again on this device.' : 'Tất cả phiên đăng nhập trên điện thoại, máy tính khác sẽ bị vô hiệu hóa ngay lập tức. Bạn cũng sẽ cần đăng nhập lại trên thiết bị này.'}
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmRevokeSessionsOpen(false)}
                className="flex-1 py-2.5 rounded-control border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                {isEn ? 'Cancel' : 'Hủy'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  await revokeAllSessions();
                  setIsConfirmRevokeSessionsOpen(false);
                  navigate('/');
                }}
                className="flex-1 py-2.5 rounded-control bg-[#17150F] hover:bg-[#26356B] text-white text-xs font-bold shadow-xs"
              >
                {isEn ? 'Log out all' : 'Đăng xuất tất cả'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSettingsPage;
