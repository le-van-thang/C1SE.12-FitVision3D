import React, { useState } from 'react';
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
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UserBodyProfile } from './types';

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userBody: UserBodyProfile;
  onOpenBiometrics: () => void;
  initialTab?: 'profile' | 'measurements' | 'merchant';
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  isOpen,
  onClose,
  userBody,
  onOpenBiometrics,
  initialTab = 'profile',
}) => {
  const {
    currentUser,
    currentStore,
    userRole,
    signOut,
    openOnboarding,
    openStatusModal,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'measurements' | 'merchant'>(initialTab);

  // Sync initial tab when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen || !currentUser) return null;

  const isPendingStore = currentStore?.status === 'PENDING';
  const isApprovedStore = userRole === 'store' || currentStore?.status === 'APPROVED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Dialog Box */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border-2 border-stone-200 overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header Profile Hero */}
        <div className="p-6 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-white text-blue-700 flex items-center justify-center font-black text-2xl shadow-md border-2 border-white/40">
                {(currentUser.full_name || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight leading-tight">
                  {currentUser.full_name || 'Khách Hàng May Đo'}
                </h3>
                <p className="text-xs text-blue-100 font-mono mt-0.5">
                  {currentUser.email}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-xs ${
                    isApprovedStore
                      ? 'bg-amber-400 text-amber-950 border-amber-300'
                      : isPendingStore
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-white/20 text-white border-white/30'
                  }`}>
                    {isApprovedStore
                      ? '✂️ Đối Tác Nhà May B2B'
                      : isPendingStore
                      ? '⏳ Chờ Admin Duyệt Mở Shop'
                      : '👤 Khách Hàng FitVision 3D'}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-4 pt-2 gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2.5 text-xs font-black border-b-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-xl'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <User size={14} />
            <span>Thông Tin Cá Nhân</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('measurements')}
            className={`flex-1 py-2.5 text-xs font-black border-b-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'measurements'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-xl'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Ruler size={14} />
            <span>Hồ Sơ Số Đo 3D</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('merchant')}
            className={`flex-1 py-2.5 text-xs font-black border-b-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'merchant'
                ? 'border-amber-600 text-amber-800 bg-white rounded-t-xl'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Store size={14} />
            <span>Đăng Ký Shop</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* TAB 1: THÔNG TIN CÁ NHÂN */}
          {activeTab === 'profile' && (
            <div className="space-y-3.5">
              <div className="p-4 rounded-2xl bg-stone-50 border-2 border-stone-200 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <User size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 font-bold uppercase block">Họ và Tên</span>
                    <span className="text-xs font-black text-stone-900">{currentUser.full_name || 'Lê Văn Thắng'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 border-t border-stone-200/80 pt-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Mail size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 font-bold uppercase block">Email Tài Khoản</span>
                    <span className="text-xs font-mono font-bold text-stone-900">{currentUser.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 border-t border-stone-200/80 pt-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Phone size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 font-bold uppercase block">Số Điện Thoại</span>
                    <span className="text-xs font-mono font-bold text-stone-900">0988 123 456</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 border-t border-stone-200/80 pt-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 font-bold uppercase block">Địa Chỉ Nhận Hàng May Đo</span>
                    <span className="text-xs font-medium text-stone-800">Đà Nẵng / TP. Hồ Chí Minh, Việt Nam</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border-2 border-stone-200 space-y-3">
                <span className="text-[11px] font-black uppercase text-stone-900 tracking-wider block">
                  ⚙️ Cài Đặt & Tùy Chọn Tài Khoản
                </span>
                
                <div className="space-y-2 text-xs">
                  <label className="flex items-center justify-between p-2 rounded-xl bg-stone-50 hover:bg-stone-100 cursor-pointer transition-colors">
                    <span className="font-bold text-stone-800">Tự động so khớp Ease Allowance (Độ cử động 3D)</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded cursor-pointer" />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl bg-stone-50 hover:bg-stone-100 cursor-pointer transition-colors">
                    <span className="font-bold text-stone-800">Nhận thông báo tiến độ may đo qua Email</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded cursor-pointer" />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl bg-stone-50 hover:bg-stone-100 cursor-pointer transition-colors">
                    <span className="font-bold text-stone-800">Hiển thị huy hiệu khách hàng Bespoke</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded cursor-pointer" />
                  </label>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-blue-700" />
                  <span className="text-xs text-blue-950 font-bold">Bảo Mật Dữ Liệu Nhân Trắc Học</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-200 text-blue-900 font-bold">
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
                  <span className="text-[10px] font-bold text-sky-800 block">CHIỀU CAO</span>
                  <span className="text-lg font-black text-sky-950">{userBody.height_cm} cm</span>
                </div>
                <div className="p-3 rounded-2xl bg-purple-50 border-2 border-purple-300">
                  <span className="text-[10px] font-bold text-purple-800 block">CÂN NẶNG</span>
                  <span className="text-lg font-black text-purple-950">{userBody.weight_kg} kg</span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50 border-2 border-emerald-300">
                  <span className="text-[10px] font-bold text-emerald-800 block">VÒNG NGỰC</span>
                  <span className="text-lg font-black text-emerald-950">{userBody.chest_cm} cm</span>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50 border-2 border-amber-300">
                  <span className="text-[10px] font-bold text-amber-800 block">VÒNG EO</span>
                  <span className="text-lg font-black text-amber-950">{userBody.waist_cm} cm</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <span className="text-[11px] font-bold text-stone-800 block">
                  Độ Cử Động May Đo Yêu Thích (Ease Allowance)
                </span>
                <div className="flex gap-2">
                  <span className="flex-1 py-1.5 px-2 rounded-lg bg-blue-600 text-white text-[11px] font-bold text-center">
                    Tiêu Chuẩn (+5cm)
                  </span>
                  <span className="flex-1 py-1.5 px-2 rounded-lg bg-white border border-stone-300 text-stone-700 text-[11px] font-medium text-center">
                    Ôm Sát (+3cm)
                  </span>
                  <span className="flex-1 py-1.5 px-2 rounded-lg bg-white border border-stone-300 text-stone-700 text-[11px] font-medium text-center">
                    Thoải Mái (+7cm)
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
                  <span>Cập Nhật Số Đo</span>
                </button>
                <a
                  href="/dashboard"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-900 border border-stone-300 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer text-center"
                >
                  <Camera size={14} />
                  <span>Quét 3D Lại</span>
                </a>
              </div>
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
                      Gian Hàng Đã Được Admin Phê Duyệt!
                    </h4>
                    <p className="text-xs text-emerald-800 mt-1">
                      Thương hiệu: <strong>{currentStore?.brand_name || 'Nhà May Sartoria'}</strong>
                    </p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Bạn có toàn quyền tải rập may và cấu hình bảng số đo cử động.
                    </p>
                  </div>
                  <a
                    href="/tailor"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
                  >
                    <Store size={15} />
                    <span>Vào Studio Nhà May (/tailor)</span>
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
                      Hồ Sơ Đang Chờ Ban Quản Trị (Admin) Phê Duyệt
                    </h4>
                    <p className="text-xs text-amber-800 mt-1">
                      Gian hàng: <strong>{currentStore?.brand_name || 'Nhà May Đang Chờ'}</strong>
                    </p>
                    <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                      Admin đang kiểm tra hồ sơ tay nghề may đo và xác thực thông tin. Sau khi Admin duyệt, bạn sẽ nhận được thông báo để vào Studio.
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
                    <span>Xem Chi Tiết Hồ Sơ Đang Chờ</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50/70 border-2 border-amber-200 space-y-3 text-left">
                  <div className="flex items-center gap-2">
                    <Store size={20} className="text-amber-700" />
                    <h4 className="font-black text-sm text-amber-950">
                      Đăng Ký Trở Thành Đối Tác Nhà May B2B
                    </h4>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Bạn là nhà may đo, xưởng thiết kế hay thợ may bespoke? Hãy nộp hồ sơ gian hàng để bán sản phẩm trực tiếp trên FitVision 3D.
                  </p>
                  <div className="p-3 rounded-xl bg-white border border-amber-200 text-[11px] text-stone-700 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900">
                      <Sparkles size={13} className="text-amber-600" />
                      <span>Quy trình duyệt qua Ban Quản Trị (Admin):</span>
                    </div>
                    <p className="text-stone-600 pl-4">
                      1. Gửi hồ sơ tên nhà may, SĐT và tài liệu kinh nghiệm.<br />
                      2. Ban Quản Trị (Admin) kiểm duyệt năng lực may đo.<br />
                      3. Kích hoạt tài khoản Chủ Shop & mở Studio Nhà May.
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
                    <span>Nộp Đơn Đăng Ký Mở Gian Hàng May Đo</span>
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Logout Action */}
        <div className="p-4 bg-stone-100 border-t border-stone-200 flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              signOut();
              onClose();
            }}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-stone-300 hover:border-rose-300 font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <LogOut size={14} />
            <span>Đăng Xuất Tài Khoản</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white font-extrabold text-xs transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};

