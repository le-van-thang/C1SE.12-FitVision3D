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
  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'Tất Cả Sản Phẩm', count: categoryCounts['all'] || 6 },
    { id: 'shirt', label: 'Áo Sơ Mi Nam', count: categoryCounts['shirt'] || 1 },
    { id: 'polo', label: 'Áo Polo Lụa', count: categoryCounts['polo'] || 1 },
    { id: 'pants', label: 'Quần Tây & Chino', count: categoryCounts['pants'] || 2 },
    { id: 'dress', label: 'Đầm Lụa Nữ', count: categoryCounts['dress'] || 1 },
    { id: 'tailored', label: 'May Đo Bespoke', count: categoryCounts['tailored'] || 1 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Vertical Sidebar Panel (Thanh Dọc Chuyên Nghiệp) */}
      <div className="relative w-80 max-w-[85vw] bg-white text-stone-900 h-full shadow-2xl flex flex-col z-10 border-r-2 border-black animate-in slide-in-from-left duration-300">
        
        {/* Top Header & Brand */}
        <div className="h-16 px-5 border-b-2 border-black flex items-center justify-between flex-shrink-0 bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm border border-black">
              <Scissors size={16} />
            </div>
            <div>
              <span className="font-black text-base tracking-tight text-stone-900 block leading-tight">
                FitVision <span className="text-blue-600">3D</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider block">
                Thanh Điều Hướng Dọc
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-700 flex items-center justify-center cursor-pointer transition-colors border border-black"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* ── SECTION 1: CÔNG NGHỆ 3D & MAY ĐO ĐỘC BẢN ── */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-800 px-2 block">
              CÔNG NGHỆ MAY ĐO & 3D STUDIO
            </span>

            <button
              type="button"
              onClick={() => {
                onSelectCategory('all');
                onClose();
              }}
              className="w-full p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-950 font-black text-xs flex items-center justify-between transition-colors border-2 border-black shadow-2xs cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs border border-black">
                  <ShoppingBag size={14} />
                </div>
                <div className="text-left">
                  <span className="block font-black text-slate-900 group-hover:text-blue-700">Sàn Thời Trang (Bộ Sưu Tập)</span>
                  <span className="text-[10px] text-slate-500 font-mono">Toàn bộ trang phục may đo chuẩn phom</span>
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
              className="w-full p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-950 font-black text-xs flex items-center justify-between transition-colors border-2 border-black shadow-2xs cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-700 text-white flex items-center justify-center shadow-xs border border-black">
                  <Sparkles size={14} className="text-amber-300" />
                </div>
                <div className="text-left">
                  <span className="block font-black text-slate-900 group-hover:text-purple-700">Phòng Thử Đồ Ảo 3D</span>
                  <span className="text-[10px] text-slate-500 font-mono">Ướm thử trang phục với công nghệ AI</span>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <a
              href="/dashboard"
              className="w-full p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-xs flex items-center justify-between transition-colors border-2 border-black shadow-2xs cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-700 text-white flex items-center justify-center shadow-xs border border-black">
                  <Camera size={14} />
                </div>
                <div className="text-left">
                  <span className="block font-black text-slate-900 group-hover:text-blue-700">Phòng Đo Nhân Trắc Học 3D</span>
                  <span className="text-[10px] text-slate-500 font-mono">Trích xuất 13 số đo chuẩn ISO 8559-1</span>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>

          <div className="border-t-2 border-black my-3" />

          {/* ── SECTION 2: DANH MỤC SẢN PHẨM (CATALOG CATEGORIES) ── */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-800 px-2 block">
              DANH MỤC THỜI TRANG MAY ĐO
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
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-black flex items-center justify-between transition-all cursor-pointer border-2 ${
                    isActive
                      ? 'bg-black text-white border-black shadow-sm scale-[1.01]'
                      : 'bg-white hover:bg-slate-100 text-slate-950 border-black shadow-2xs'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-black border ${
                      isActive ? 'bg-white/20 text-white border-white/30' : 'bg-slate-100 text-slate-950 border-black'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="border-t-2 border-black my-3" />

          {/* ── SECTION 3: HỒ SƠ VÓC DÁNG 3D (ĐẬM NÉT, RÕ RÀNG TRÊN NỀN TRẮNG) ── */}
          <div className="rounded-2xl border-[2.5px] border-black shadow-sm overflow-hidden bg-white space-y-0">
            <div className="bg-slate-200 border-b-2 border-black px-3.5 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-300 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-950">
                  HỒ SƠ VÓC DÁNG 3D
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBiometrics();
                }}
                className="text-[11px] font-black text-blue-700 hover:text-blue-900 hover:underline cursor-pointer transition-colors"
              >
                Đổi số đo
              </button>
            </div>

            <div className="p-3 bg-white space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-sky-50 p-2.5 rounded-xl border-2 border-black shadow-2xs">
                  <span className="text-sky-900 text-[10px] block font-black uppercase">CHIỀU CAO</span>
                  <span className="font-black text-sky-950 text-sm">{userBody.height_cm} cm</span>
                </div>
                <div className="bg-purple-50 p-2.5 rounded-xl border-2 border-black shadow-2xs">
                  <span className="text-purple-900 text-[10px] block font-black uppercase">CÂN NẶNG</span>
                  <span className="font-black text-purple-950 text-sm">{userBody.weight_kg} kg</span>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-xl border-2 border-black shadow-2xs">
                  <span className="text-emerald-900 text-[10px] block font-black uppercase">VÒNG NGỰC</span>
                  <span className="font-black text-emerald-950 text-sm">{userBody.chest_cm} cm</span>
                </div>
                <div className="bg-amber-50 p-2.5 rounded-xl border-2 border-black shadow-2xs">
                  <span className="text-amber-900 text-[10px] block font-black uppercase">VÒNG EO</span>
                  <span className="font-black text-amber-950 text-sm">{userBody.waist_cm} cm</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Role & Auth (USER PILL THU GỌN - NỀN XÁM SẬM TÁCH BIỆT RÕ RỆT) */}
        <div className="p-3 border-t-2 border-black bg-slate-200 flex-shrink-0">
          {!isAuthenticated ? (
            <div>
              <button
                type="button"
                onClick={() => {
                  onOpenSignIn();
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-black text-xs shadow-md border-2 border-black flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <LogIn size={15} strokeWidth={2.5} />
                <span>Đăng Nhập / Đăng Ký</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* User Pill Button: Viền đen 2px rõ nét, không bị hòa màu */}
              <div 
                onClick={() => {
                  onClose();
                  if (onOpenProfileModal) onOpenProfileModal();
                }}
                className="p-2 rounded-xl bg-white border-2 border-black hover:border-black shadow-sm hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
                title="Bấm để xem hồ sơ và cài đặt"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-2xs border border-black overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{userName?.charAt(0) || 'T'}</span>
                    )}
                  </div>
                  <div className="min-w-0 text-left">
                    <span className="font-black text-xs text-slate-950 block leading-tight truncate group-hover:text-blue-700">
                      {userName || 'Thắng Lê'}
                    </span>
                    <span className="text-[10px] text-blue-700 font-black block truncate">
                      {userRole === 'store' ? '✂️ Chủ Shop May Đo' : '👤 Khách Hàng'}
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
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-black transition-colors cursor-pointer"
                      title="Đăng Xuất Tài Khoản"
                    >
                      <LogOut size={13} />
                    </button>
                  )}
                  <ChevronRight size={14} className="text-slate-500 group-hover:translate-x-0.5 transition-transform" />
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
                className="w-full py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 border-2 border-black text-blue-900 text-xs font-black flex items-center justify-between transition-colors cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag size={13} className="text-blue-700" />
                  <span>Đơn Hàng Của Tôi</span>
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
