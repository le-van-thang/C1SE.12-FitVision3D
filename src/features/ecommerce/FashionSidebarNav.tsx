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
import { useNavigate } from 'react-router-dom';
import { UserBodyProfile } from './types';

interface FashionSidebarNavProps {
  isOpen: boolean;
  onClose: () => void;
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
  categoryCounts: Record<string, number>;
  userBody: UserBodyProfile;
  hasBodyProfile?: boolean;
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
  hasBodyProfile = false,
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
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const isEn = locale === 'en';

  if (!isOpen) return null;

  const categoryGroups = [
    {
      id: 'all',
      label: t('ecommerce.categories.all', 'Tất Cả Sản Phẩm'),
      count: categoryCounts['all'] || 6,
      children: [],
    },
    {
      id: 'shirt',
      label: isEn ? 'Tops & Bespoke Jackets' : 'Áo & May Đo Cao Cấp',
      count: (categoryCounts['shirt'] || 0) + (categoryCounts['polo'] || 0) + (categoryCounts['tailored'] || 0),
      children: [
        { id: 'shirt', label: t('ecommerce.categories.shirt', 'Áo Sơ Mi May Đo'), count: categoryCounts['shirt'] || 1 },
        { id: 'polo', label: t('ecommerce.categories.polo', 'Áo Polo Lụa Piqué'), count: categoryCounts['polo'] || 1 },
        { id: 'tailored', label: t('ecommerce.categories.tailored', 'Áo Blazer Bespoke'), count: categoryCounts['tailored'] || 1 },
      ],
    },
    {
      id: 'pants',
      label: isEn ? 'Trousers & Silk Dresses' : 'Quần Tây & Đầm Lụa',
      count: (categoryCounts['pants'] || 0) + (categoryCounts['dress'] || 0),
      children: [
        { id: 'pants', label: t('ecommerce.categories.pants', 'Quần Tây & Chino Ý'), count: categoryCounts['pants'] || 2 },
        { id: 'dress', label: t('ecommerce.categories.dress', 'Đầm Lụa Tự Nhiên'), count: categoryCounts['dress'] || 1 },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Minimalist Editorial Drawer (Dark Obsidian Header + Hairline Categories) */}
      <div className="relative w-80 max-w-[85vw] bg-white text-slate-900 h-full shadow-2xl flex flex-col z-10 border-r border-slate-200 animate-in slide-in-from-left duration-200">
        
        {/* Top Header */}
        <div className="h-16 px-4 flex items-center justify-between flex-shrink-0 bg-[#14171C] text-white border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Scissors size={16} />
            </div>
            <div>
              <span className="font-black text-base tracking-tight text-white block leading-tight">
                FitVision <span className="text-blue-400">3D</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                {t('ecommerce.sidebar.verticalNav', 'DANH MỤC')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher compact variant="dark" />
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
              aria-label="Close navigation"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto">
          
          {/* ── SECTION 1: DANH MỤC THỜI TRANG (TORANO HAIRLINE + INDENTED SUB-ROWS) ── */}
          <div className="border-b border-slate-200">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">
                {t('ecommerce.sidebar.categoriesTitle', 'DANH MỤC SẢN PHẨM')}
              </span>
              <span className="text-[10px] font-mono text-slate-400">ISO 8559</span>
            </div>

            {categoryGroups.map((group) => {
              const isGroupActive = activeCategory === group.id && group.children.length === 0;
              return (
                <div key={group.id} className="border-b border-slate-200 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectCategory(group.id);
                      onClose();
                    }}
                    className={`w-full px-4 py-3 text-xs font-extrabold uppercase tracking-wider flex items-center justify-between transition-colors cursor-pointer ${
                      isGroupActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-white hover:bg-slate-50 text-slate-900'
                    }`}
                  >
                    <span>{group.label}</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {group.count}
                    </span>
                  </button>

                  {group.children.length > 0 && (
                    <div className="bg-[#F4F5F7] divide-y divide-slate-200/70 border-t border-slate-200/80">
                      {group.children.map((sub) => {
                        const isSubActive = activeCategory === sub.id;
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => {
                              onSelectCategory(sub.id);
                              onClose();
                            }}
                            className={`w-full pl-6 pr-4 py-2.5 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                              isSubActive
                                ? 'bg-blue-600 text-white font-bold'
                                : 'text-slate-700 hover:bg-slate-200/60 font-medium'
                            }`}
                          >
                            <span className="truncate">— {sub.label}</span>
                            <span className={`text-[10px] font-mono ${isSubActive ? 'text-blue-100' : 'text-slate-500'}`}>
                              {sub.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── SECTION 2: CÔNG NGHỆ 3D & MAY ĐO ĐỘC BẢN ── */}
          <div className="p-4 space-y-2 border-b border-slate-200">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 block mb-1">
              {t('ecommerce.sidebar.featuresTitle', 'CÔNG NGHỆ MAY ĐO & 3D STUDIO')}
            </span>

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
                <div className="w-7 h-7 rounded-lg bg-[#14171C] text-white flex items-center justify-center shadow-2xs">
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

            {onOpenThermalSlip && (
              <button
                type="button"
                onClick={() => {
                  onOpenThermalSlip();
                  onClose();
                }}
                className="w-full p-2.5 rounded-xl bg-amber-50/70 hover:bg-amber-100/70 text-slate-900 font-bold text-xs flex items-center justify-between transition-colors border border-amber-200 cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-2xs">
                    <Ruler size={14} />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold text-slate-900 group-hover:text-amber-800">
                      {isEn ? 'Bespoke Fit Receipt' : 'Phiếu Số Đo May Đo 3D'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      ISO 8559-1 Blueprint
                    </span>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>

          {/* ── SECTION 3: HỒ SƠ VÓC DÁNG 3D ── */}
          <div className="p-4">
            <div className="rounded-xl border border-slate-200 shadow-2xs overflow-hidden bg-white">
              <div className="bg-slate-50 border-b border-slate-200 px-3.5 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isAuthenticated && hasBodyProfile ? 'bg-emerald-500 ring-2 ring-emerald-200 animate-pulse' : 'bg-slate-400'}`} />
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800">
                    {t('ecommerce.sidebar.bodyProfileTitle', 'HỒ SƠ VÓC DÁNG 3D')}
                  </span>
                </div>
                {isAuthenticated && (
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
                )}
              </div>

              <div className="p-3 bg-white">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                    <span className="text-slate-500 text-[10px] block font-bold uppercase">{t('ecommerce.sidebar.height', 'CHIỀU CAO')}</span>
                    <span className="font-mono font-extrabold text-slate-900 text-sm">{isAuthenticated && hasBodyProfile ? `${userBody.height_cm} cm` : '— cm'}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                    <span className="text-slate-500 text-[10px] block font-bold uppercase">{t('ecommerce.sidebar.weight', 'CÂN NẶNG')}</span>
                    <span className="font-mono font-extrabold text-slate-900 text-sm">{isAuthenticated && hasBodyProfile ? `${userBody.weight_kg} kg` : '— kg'}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                    <span className="text-slate-500 text-[10px] block font-bold uppercase">{t('ecommerce.sidebar.chest', 'VÒNG NGỰC')}</span>
                    <span className="font-mono font-extrabold text-slate-900 text-sm">{isAuthenticated && hasBodyProfile ? `${userBody.chest_cm} cm` : '— cm'}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                    <span className="text-slate-500 text-[10px] block font-bold uppercase">{t('ecommerce.sidebar.waist', 'VÒNG EO')}</span>
                    <span className="font-mono font-extrabold text-slate-900 text-sm">{isAuthenticated && hasBodyProfile ? `${userBody.waist_cm} cm` : '— cm'}</span>
                  </div>
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
                      {userRole === 'admin'
                        ? '🛡️ Super Admin'
                        : userRole === 'store'
                        ? t('ecommerce.sidebar.roleStore', '✂️ Chủ Shop May Đo')
                        : t('ecommerce.sidebar.roleCustomer', '👤 Khách Hàng')}
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

              {/* Lối tắt Cài Đặt Tài Khoản — chỉ hiển thị cho khách hàng */}
              {userRole === 'user' && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/settings');
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200/70 border border-slate-300 text-slate-800 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal size={13} className="text-slate-600" />
                    <span>{isEn ? 'Account Settings' : 'Cài Đặt Tài Khoản'}</span>
                  </div>
                  <ChevronRight size={13} className="text-slate-400" />
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
