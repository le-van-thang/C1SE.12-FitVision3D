import React from 'react';
import {
  X,
  ShoppingBag,
  Sparkles,
  Eye,
  Ruler,
  Scissors,
  Store,
  Layers,
  Shirt,
  User,
  ShieldCheck,
  ChevronRight,
  LogIn,
  LogOut,
  Camera,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { useI18n } from '@/i18n';
import { UserBodyProfile } from './types';

interface FashionSidebarNavProps {
  isOpen: boolean;
  onClose: () => void;
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
  categoryCounts: Record<string, number>;
  userBody: UserBodyProfile;
  userRole?: string;
  userName?: string;
  avatarUrl?: string | null;
  onOpenVellStudio: () => void;
  onOpenMaisonRunway: () => void;
  onOpenThermalSlip?: () => void;
  onOpenBiometrics: () => void;
  onOpenOnboarding: () => void;
  onOpenProfileModal?: () => void;
  onOpenOrders?: () => void;
  isAuthenticated: boolean;
  onOpenSignIn: () => void;
  onSignOut?: () => void;
}

export const FashionSidebarNav: React.FC<FashionSidebarNavProps> = ({
  isOpen,
  onClose,
  activeCategory,
  onSelectCategory,
  categoryCounts,
  userBody,
  userRole = 'user',
  userName = 'Thắng Lê',
  avatarUrl,
  onOpenVellStudio,
  onOpenMaisonRunway,
  onOpenThermalSlip,
  onOpenBiometrics,
  onOpenOnboarding,
  onOpenProfileModal,
  onOpenOrders,
  isAuthenticated,
  onOpenSignIn,
  onSignOut,
}) => {
  const { t } = useI18n();

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: t('ecommerce.categories.all', 'Tất Cả Sản Phẩm'), count: categoryCounts['all'] || 6 },
    { id: 'shirt', label: t('ecommerce.categories.shirt', 'Áo Sơ Mi May Đo'), count: categoryCounts['shirt'] || 1 },
    { id: 'polo', label: t('ecommerce.categories.polo', 'Áo Polo Cao Cấp'), count: categoryCounts['polo'] || 1 },
    { id: 'pants', label: t('ecommerce.categories.pants', 'Quần Tây & Chino Ý'), count: categoryCounts['pants'] || 2 },
    { id: 'dress', label: t('ecommerce.categories.dress', 'Đầm & Váy Lụa Tự Nhiên'), count: categoryCounts['dress'] || 1 },
    { id: 'tailored', label: t('ecommerce.categories.tailored', 'Thiết Kế May Đo Riêng'), count: categoryCounts['tailored'] || 1 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Vertical Sidebar Panel (Thanh Dọc Chuyên Nghiệp) */}
      <div className="relative w-80 max-w-[85vw] bg-white text-stone-900 h-full shadow-2xl flex flex-col z-10 border-r border-slate-200 animate-in slide-in-from-left duration-300">
        
        {/* Top Header & Brand */}
        <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Scissors size={16} />
            </div>
            <div>
              <span className="font-black text-base tracking-tight text-stone-900 block leading-tight">
                FitVision <span className="text-blue-600">3D</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider block">
                {t('ecommerce.sidebar.verticalNav', 'Thanh Điều Hướng Dọc')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher compact variant="light" />
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors border border-slate-200"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          
          {/* ── SECTION 1: CÔNG NGHỆ 3D & MAY ĐO ĐỘC BẢN ── */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 px-2 block">
              {t('ecommerce.sidebar.featuresTitle', 'CÔNG NGHỆ MAY ĐO & 3D STUDIO')}
            </span>

            <button
              type="button"
              onClick={() => {
                onSelectCategory('all');
                onClose();
              }}
              className="w-full p-2.5 rounded-xl bg-blue-50/80 hover:bg-blue-100/80 text-blue-950 font-bold text-xs flex items-center justify-between transition-colors border border-blue-200 cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-2xs">
                  <ShoppingBag size={14} />
                </div>
                <div className="text-left">
                  <span className="block font-bold text-slate-900 group-hover:text-blue-700">
                    {t('ecommerce.sidebar.collection', 'Sàn Thời Trang (Bộ Sưu Tập)')}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {t('ecommerce.sidebar.collectionSub', 'Toàn bộ trang phục may đo chuẩn phom')}
                  </span>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => {
                onOpenVellStudio();
                onClose();
              }}
              className="w-full p-2.5 rounded-xl bg-purple-50/80 hover:bg-purple-100/80 text-purple-950 font-bold text-xs flex items-center justify-between transition-colors border border-purple-200 cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-2xs">
                  <Sparkles size={14} className="text-amber-300" />
                </div>
                <div className="text-left">
                  <span className="block font-bold text-slate-900 group-hover:text-purple-700">
                    {t('ecommerce.sidebar.virtualTryOn', 'Phòng Thử Đồ Ảo 3D')}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {t('ecommerce.sidebar.virtualTryOnSub', 'Ướm thử trang phục với công nghệ AI')}
                  </span>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <a
              href="/dashboard"
              className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-between transition-colors border border-slate-200 cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-700 text-white flex items-center justify-center shadow-2xs">
                  <Camera size={14} />
                </div>
                <div className="text-left">
                  <span className="block font-bold text-slate-900 group-hover:text-blue-700">
                    {t('ecommerce.sidebar.measurementLab', 'Phòng Đo Nhân Trắc Học 3D')}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {t('ecommerce.sidebar.measurementLabSub', 'Trích xuất 13 số đo chuẩn ISO 8559-1')}
                  </span>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>

          <div className="border-t border-slate-200 my-3" />

          {/* ── SECTION 2: DANH MỤC SẢN PHẨM (CATALOG CATEGORIES) ── */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 px-2 block">
              {t('ecommerce.sidebar.categoriesTitle', 'DANH MỤC THỜI TRANG MAY ĐO')}
            </span>

            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    onSelectCategory(cat.id);
                    onClose();
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border ${
                      isActive ? 'bg-white/20 text-white border-white/20' : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-slate-200 my-3" />

          {/* ── SECTION 3: HỒ SƠ VÓC DÁNG 3D ── */}
          <div className="rounded-2xl border border-slate-300 shadow-2xs overflow-hidden bg-white space-y-0">
            <div className="bg-slate-100/90 border-b border-slate-200 px-3.5 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200 animate-pulse" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800">
                  {t('ecommerce.sidebar.bodyProfileTitle', 'HỒ SƠ VÓC DÁNG 3D')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBiometrics();
                }}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
              >
                {t('ecommerce.sidebar.editMeasurements', 'Đổi số đo')}
              </button>
            </div>

            <div className="p-3 bg-white space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-sky-50/70 p-2.5 rounded-xl border border-sky-200">
                  <span className="text-sky-700 text-[10px] block font-bold uppercase">{t('ecommerce.sidebar.height', 'CHIỀU CAO')}</span>
                  <span className="font-extrabold text-sky-950 text-sm">{userBody.height_cm} cm</span>
                </div>
                <div className="bg-purple-50/70 p-2.5 rounded-xl border border-purple-200">
                  <span className="text-purple-700 text-[10px] block font-bold uppercase">{t('ecommerce.sidebar.weight', 'CÂN NẶNG')}</span>
                  <span className="font-extrabold text-purple-950 text-sm">{userBody.weight_kg} kg</span>
                </div>
                <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200">
                  <span className="text-emerald-700 text-[10px] block font-bold uppercase">{t('ecommerce.sidebar.chest', 'VÒNG NGỰC')}</span>
                  <span className="font-extrabold text-emerald-950 text-sm">{userBody.chest_cm} cm</span>
                </div>
                <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200">
                  <span className="text-amber-700 text-[10px] block font-bold uppercase">{t('ecommerce.sidebar.waist', 'VÒNG EO')}</span>
                  <span className="font-extrabold text-amber-950 text-sm">{userBody.waist_cm} cm</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Role & Auth */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/80 flex-shrink-0">
          {!isAuthenticated ? (
            <div>
              <button
                type="button"
                onClick={() => {
                  onOpenSignIn();
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs shadow-xs border border-blue-700 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <LogIn size={15} strokeWidth={2.2} />
                <span>{t('ecommerce.sidebar.signInSignUp', 'Đăng Nhập / Đăng Ký')}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div 
                onClick={() => {
                  onClose();
                  if (onOpenProfileModal) onOpenProfileModal();
                }}
                className="p-2 rounded-xl bg-white border border-slate-300 hover:border-blue-400 shadow-2xs transition-all cursor-pointer group flex items-center justify-between"
                title={t('ecommerce.sidebar.userPillTooltip', 'Bấm để xem hồ sơ và cài đặt')}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{userName?.charAt(0) || 'T'}</span>
                    )}
                  </div>
                  <div className="min-w-0 text-left">
                    <span className="font-bold text-xs text-slate-900 block leading-tight truncate group-hover:text-blue-600">
                      {userName || 'Thắng Lê'}
                    </span>
                    <span className="text-[10px] text-blue-600 font-semibold block truncate">
                      {userRole === 'store' ? t('ecommerce.sidebar.roleStore', '✂️ Chủ Shop May Đo') : t('ecommerce.sidebar.roleCustomer', '👤 Khách Hàng')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {onSignOut && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSignOut();
                        onClose();
                      }}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 transition-colors cursor-pointer"
                      title={t('ecommerce.sidebar.menuSignOut', 'Đăng Xuất Tài Khoản')}
                    >
                      <LogOut size={13} />
                    </button>
                  )}
                  <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Lối tắt xem Lịch Sử Đơn Hàng Của Tôi */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenOrders) onOpenOrders();
                  else if (onOpenProfileModal) onOpenProfileModal();
                }}
                className="w-full py-2 px-3 rounded-xl bg-blue-50/80 hover:bg-blue-100 border border-blue-200 text-blue-900 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag size={13} className="text-blue-600" />
                  <span>{t('ecommerce.sidebar.menuOrders', 'Đơn Hàng Của Tôi')}</span>
                </div>
                <ChevronRight size={13} className="text-blue-600" />
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
