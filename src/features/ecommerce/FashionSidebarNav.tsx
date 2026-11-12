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
  onSwitchRole?: (role: 'user' | 'store' | 'admin') => void;
  onOpenVellStudio: () => void;
  onOpenMaisonRunway: () => void;
  onOpenThermalSlip?: () => void;
  onOpenBiometrics: () => void;
  onOpenOnboarding: () => void;
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
  onSwitchRole,
  onOpenVellStudio,
  onOpenMaisonRunway,
  onOpenThermalSlip,
  onOpenBiometrics,
  onOpenOnboarding,
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
      <div className="relative w-80 max-w-[85vw] bg-white text-stone-900 h-full shadow-2xl flex flex-col z-10 border-r-2 border-stone-800 animate-in slide-in-from-left duration-300">
        
        {/* Top Header & Brand */}
        <div className="h-16 px-5 border-b-2 border-stone-800 flex items-center justify-between flex-shrink-0 bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
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
            className="w-8 h-8 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-700 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* ── SECTION 1: CÔNG NGHỆ 3D & MAY ĐO ĐỘC BẢN ── */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono font-black uppercase tracking-wider text-stone-400 px-2 block">
              CÔNG NGHỆ MAY ĐO & 3D STUDIO
            </span>

            <button
              type="button"
              onClick={() => {
                onSelectCategory('all');
                onClose();
              }}
              className="w-full p-2.5 rounded-xl bg-blue-50/70 hover:bg-blue-100/90 text-blue-950 font-bold text-xs flex items-center justify-between transition-colors border border-blue-200 cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <ShoppingBag size={14} />
                </div>
                <div className="text-left">
                  <span className="block font-black text-stone-900 group-hover:text-blue-700">Sàn Thời Trang (Bộ Sưu Tập)</span>
                  <span className="text-[10px] text-stone-500 font-mono">Toàn bộ trang phục may đo chuẩn phom</span>
                </div>
              </div>
              <ChevronRight size={14} className="text-stone-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => {
                onOpenVellStudio();
                onClose();
              }}
              className="w-full p-2.5 rounded-xl bg-purple-50/70 hover:bg-purple-100/90 text-purple-950 font-bold text-xs flex items-center justify-between transition-colors border border-purple-200 cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-700 text-white flex items-center justify-center shadow-xs">
                  <Sparkles size={14} className="text-amber-300" />
                </div>
                <div className="text-left">
                  <span className="block font-black text-stone-900 group-hover:text-purple-700">Phòng Thử Đồ Ảo 3D</span>
                  <span className="text-[10px] text-stone-500 font-mono">Ướm thử trang phục với công nghệ AI</span>
                </div>
              </div>
              <ChevronRight size={14} className="text-stone-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <a
              href="/dashboard"
              className="w-full p-2.5 rounded-xl bg-blue-50/70 hover:bg-blue-100/90 text-blue-950 font-bold text-xs flex items-center justify-between transition-colors border border-blue-200 cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Camera size={14} />
                </div>
                <div className="text-left">
                  <span className="block font-black text-stone-900 group-hover:text-blue-700">Phòng Đo Nhân Trắc Học 3D</span>
                  <span className="text-[10px] text-stone-500 font-mono">Trích xuất 13 số đo chuẩn ISO 8559-1</span>
                </div>
              </div>
              <ChevronRight size={14} className="text-stone-400 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>

          {/* ── SECTION 2: DANH MỤC SẢN PHẨM (CATALOG CATEGORIES) ── */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-black uppercase tracking-wider text-stone-400 px-2 block">
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
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-stone-700 hover:bg-stone-100 hover:text-stone-950'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-white/20 text-white font-bold' : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── SECTION 3: HỒ SƠ VÓC DÁNG 3D ── */}
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-black uppercase tracking-wider text-stone-500">
                HỒ SƠ NHÂN TRẮC HỌC
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-white p-2 rounded-lg border border-stone-200 shadow-xs">
                <span className="text-stone-400 text-[9px] block">CHIỀU CAO</span>
                <span className="font-bold text-stone-900">{userBody.height_cm} cm</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-stone-200 shadow-xs">
                <span className="text-stone-400 text-[9px] block">CÂN NẶNG</span>
                <span className="font-bold text-stone-900">{userBody.weight_kg} kg</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-stone-200 shadow-xs">
                <span className="text-stone-400 text-[9px] block">VÒNG NGỰC</span>
                <span className="font-bold text-blue-700">{userBody.chest_cm} cm</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-stone-200 shadow-xs">
                <span className="text-stone-400 text-[9px] block">VÒNG EO</span>
                <span className="font-bold text-blue-700">{userBody.waist_cm} cm</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onOpenBiometrics();
                onClose();
              }}
              className="w-full py-2 px-3 rounded-lg bg-stone-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Ruler size={13} />
              <span>Cập Nhật Số Đo</span>
            </button>
          </div>

          {/* ── SECTION 4: KÊNH NHÀ MAY B2B ── */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
              <Store size={14} className="text-amber-700" />
              <span>Dành Cho Chủ Shop & Nhà May</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Tải lên rập may áo, blazer và cấu hình bảng thông số cử động (Ease Allowance).
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onOpenOnboarding();
                  onClose();
                }}
                className="flex-1 py-1.5 px-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs cursor-pointer text-center transition-colors"
              >
                Mở Gian Hàng B2B
              </button>
              <a
                href="/tailor"
                className="py-1.5 px-2.5 rounded-lg bg-white border border-amber-300 text-amber-900 font-bold text-xs hover:bg-amber-100 cursor-pointer"
              >
                Studio
              </a>
            </div>
          </div>

        </div>

        {/* Footer Role & Auth (XÁC THỰC THỰC TẾ: ĐĂNG NHẬP / ĐĂNG XUẤT RÕ RÀNG) */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 space-y-2.5 flex-shrink-0">
          {!isAuthenticated ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  onOpenSignIn();
                  onClose();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <LogIn size={15} />
                <span>Đăng Nhập / Đăng Ký Tài Khoản</span>
              </button>
              <p className="text-[10px] text-stone-500 text-center font-medium">
                Đăng nhập để đồng bộ hồ sơ số đo 3D và đơn hàng
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                  {userName?.charAt(0) || 'T'}
                </div>
                <div>
                  <span className="font-bold text-xs text-stone-900 block leading-tight">
                    {userName || 'Thắng Lê'}
                  </span>
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded-full inline-block mt-0.5">
                    {userRole === 'admin' ? 'Quản Trị Viên' : userRole === 'store' ? 'Chủ Shop May Đo' : 'Khách Hàng May Đo'}
                  </span>
                </div>
              </div>

              {onSignOut && (
                <button
                  type="button"
                  onClick={() => {
                    onSignOut();
                    onClose();
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-stone-600 hover:text-rose-600 border border-stone-200 hover:border-rose-200 transition-colors cursor-pointer flex items-center gap-1.5 text-[11px] font-bold shadow-xs"
                  title="Đăng Xuất Tài Khoản"
                >
                  <LogOut size={13} />
                  <span>Thoát</span>
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
