import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  RotateCcw,
  Undo2,
  Redo2,
  SlidersHorizontal,
  Bookmark,
  ShoppingBag,
  Check,
  ChevronRight,
  Info,
  Layers,
  Ruler,
  User,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import { useI18n } from '@/i18n';
import type { FashionProduct, UserBodyProfile } from './types';

export interface VellVirtualStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  userBody: UserBodyProfile;
  initialProduct?: FashionProduct | null;
  onAddToCart?: (product: FashionProduct, size: string) => void;
}

// 8 Verified Cut-outs from HERO PROMPT (VELL)
const VELL_LOOKS = [
  {
    id: 0,
    name: 'Denim Maxi Couture',
    category: 'everyday',
    tag: 'Casual Atelier',
    price: 850000,
    chest_ease: 5.5,
    waist_ease: 6.0,
    recommended_size: 'L',
    match_percentage: 98,
    img: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034542_a6430ecf-9862-412c-8ef6-5745115bd78c.png&w=1000&q=85',
    thumb: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034542_a6430ecf-9862-412c-8ef6-5745115bd78c.png&w=360&q=85',
    fabric: 'Denim Cotton 13.5oz Wash Mềm',
  },
  {
    id: 1,
    name: 'Cloud Set Minimalist',
    category: 'everyday',
    tag: 'Daily Luxe',
    price: 690000,
    chest_ease: 4.5,
    waist_ease: 5.0,
    recommended_size: 'M',
    match_percentage: 96,
    img: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034738_73282737-acc8-41e9-a822-96c663e27b6c.png&w=1000&q=85',
    thumb: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034738_73282737-acc8-41e9-a822-96c663e27b6c.png&w=360&q=85',
    fabric: 'Sợi Cotton Dệt Kim Mịn Không Nhăn',
  },
  {
    id: 2,
    name: 'Library Knit Tailored',
    category: 'everyday',
    tag: 'Classic Knit',
    price: 920000,
    chest_ease: 6.0,
    waist_ease: 6.5,
    recommended_size: 'L',
    match_percentage: 99,
    img: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034742_9a8a92fd-79ae-4163-9ffa-14ae2a68717f.png&w=1000&q=85',
    thumb: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034742_9a8a92fd-79ae-4163-9ffa-14ae2a68717f.png&w=360&q=85',
    fabric: 'Len Lông Cừu Merino Blend 100%',
  },
  {
    id: 3,
    name: 'Lilac Run Athletic',
    category: 'athletic',
    tag: 'Sporty Chic',
    price: 580000,
    chest_ease: 3.5,
    waist_ease: 4.0,
    recommended_size: 'M',
    match_percentage: 94,
    img: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034735_4e352e03-ad2b-44d1-9fcf-4b5b9454dc55.png&w=1000&q=85',
    thumb: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034735_4e352e03-ad2b-44d1-9fcf-4b5b9454dc55.png&w=360&q=85',
    fabric: 'Spandex Co Giãn 4 Chiều Kháng Khuẩn',
  },
  {
    id: 4,
    name: 'Satin Night Slip',
    category: 'sleep',
    tag: 'Silk Luxury',
    price: 1150000,
    chest_ease: 4.0,
    waist_ease: 5.5,
    recommended_size: 'M',
    match_percentage: 97,
    img: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034738_aeb8ea57-6399-4f3c-b54a-4a57d0bd971e.png&w=1000&q=85',
    thumb: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034738_aeb8ea57-6399-4f3c-b54a-4a57d0bd971e.png&w=360&q=85',
    fabric: 'Lụa Tơ Tằm Bảo Lộc Dệt Satin 19 Momme',
  },
  {
    id: 5,
    name: 'Night Suit Bespoke Tuxedo',
    category: 'formal',
    tag: 'Bespoke Evening',
    price: 2450000,
    chest_ease: 5.0,
    waist_ease: 4.5,
    recommended_size: 'L',
    match_percentage: 99,
    img: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034736_aace5c5f-8c14-4b00-83ba-744dbad2e337.png&w=1000&q=85',
    thumb: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034736_aace5c5f-8c14-4b00-83ba-744dbad2e337.png&w=360&q=85',
    fabric: 'Wool Ý Super 150s Lót Lụa Bemberg',
  },
  {
    id: 6,
    name: 'Sage Slip Cocktail',
    category: 'party',
    tag: 'Party Elegance',
    price: 1350000,
    chest_ease: 4.0,
    waist_ease: 5.0,
    recommended_size: 'S',
    match_percentage: 95,
    img: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034735_3d9fb69e-b4e0-49f7-a2d4-e592bd616c27.png&w=1000&q=85',
    thumb: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034735_3d9fb69e-b4e0-49f7-a2d4-e592bd616c27.png&w=360&q=85',
    fabric: 'Lụa Habotai Nhuộm Thủ Công Tự Nhiên',
  },
  {
    id: 7,
    name: 'Bomber Cargo Streetwear',
    category: 'street',
    tag: 'High-End Street',
    price: 1250000,
    chest_ease: 7.0,
    waist_ease: 8.0,
    recommended_size: 'XL',
    match_percentage: 97,
    img: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034740_3e3c5ad7-689b-46a2-8e09-c7d36a569b9c.png&w=1000&q=85',
    thumb: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034740_3e3c5ad7-689b-46a2-8e09-c7d36a569b9c.png&w=360&q=85',
    fabric: 'Nylon Twill Chống Nước Phối Rib Len Dày',
  },
];

type StudioTab = 'outfits' | 'body' | 'dna' | 'atelier';

export const VellVirtualStudioModal: React.FC<VellVirtualStudioModalProps> = ({
  isOpen,
  onClose,
  userBody,
  onAddToCart,
}) => {
  const { t } = useI18n();
  const [activeLookIndex, setActiveLookIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<StudioTab>('outfits');
  const [isWiping, setIsWiping] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [history, setHistory] = useState<number[]>([0]);
  const [historyPointer, setHistoryPointer] = useState<number>(0);
  const [savedToLibrary, setSavedToLibrary] = useState<boolean>(false);

  const currentLook = VELL_LOOKS[activeLookIndex];

  // Signature Scan Wipe Animation
  const handleSelectLook = (idx: number) => {
    if (idx === activeLookIndex) return;
    setIsWiping(true);
    setActiveLookIndex(idx);

    // Record history
    const nextHistory = history.slice(0, historyPointer + 1);
    nextHistory.push(idx);
    setHistory(nextHistory);
    setHistoryPointer(nextHistory.length - 1);

    setTimeout(() => {
      setIsWiping(false);
    }, 1050);
  };

  const handleUndo = () => {
    if (historyPointer > 0) {
      const prev = historyPointer - 1;
      setHistoryPointer(prev);
      setActiveLookIndex(history[prev]);
      setIsWiping(true);
      setTimeout(() => setIsWiping(false), 800);
    }
  };

  const handleRedo = () => {
    if (historyPointer < history.length - 1) {
      const next = historyPointer + 1;
      setHistoryPointer(next);
      setActiveLookIndex(history[next]);
      setIsWiping(true);
      setTimeout(() => setIsWiping(false), 800);
    }
  };

  const filteredLooks = activeCategory === 'all'
    ? VELL_LOOKS
    : VELL_LOOKS.filter(l => l.category === activeCategory);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      
      {/* Studio Canvas Window */}
      <div className="relative w-full h-full max-w-7xl max-h-[96vh] m-2 sm:m-4 rounded-3xl overflow-hidden bg-stone-950 border border-white/15 shadow-2xl flex flex-col font-sans text-white select-none">
        
        {/* Background Loft Texture */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 pointer-events-none"
          style={{
            backgroundImage: `url('https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_034551_6394b127-5366-40a8-9c82-3c416f1161f1.png&w=2400&q=85')`,
          }}
        />

        {/* ── TOP FROSTED GLASS CONTROL BAR ── */}
        <header className="relative z-20 h-16 px-6 border-b border-white/10 bg-black/40 backdrop-blur-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-wider uppercase text-white">
                  FitVision <span className="text-blue-400">VELL</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Virtual Fitting 3D
                </span>
              </div>
              <p className="text-[10px] text-stone-400 font-medium hidden sm:block">
                Studio Thử Đồ Nhân Trắc Học & Dự Đoán Size Tự Động
              </p>
            </div>
          </div>

          {/* Center Step Tabs */}
          <nav className="flex items-center gap-1 p-1 bg-white/5 rounded-full border border-white/10 text-xs font-semibold">
            {[
              { id: 'outfits', label: 'BỘ SƯU TẬP (OUTFITS)' },
              { id: 'body', label: 'SỐ ĐO (BODY ISO)' },
              { id: 'dna', label: 'TỈ LỆ (DNA)' },
              { id: 'atelier', label: 'NHÀ MAY (ATELIER)' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as StudioTab)}
                className={`px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white font-extrabold shadow-md'
                    : 'text-stone-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Close Studio Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </header>

        {/* ── MAIN STUDIO STAGE (3 COLUMNS: PROFILE | 3D FIGURE WITH WIPE | CONTROLS) ── */}
        <div className="relative flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* Left Column (lg:col-span-3): Biometric Profile Floating Card */}
          <div className="hidden lg:flex lg:col-span-3 p-6 flex-col justify-between z-10 pointer-events-auto">
            
            {/* User Fit Capsule Card */}
            <div className="p-5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-blue-400" />
                  <span className="font-extrabold text-xs uppercase tracking-wider text-stone-200">
                    Hồ Sơ Vóc Dáng Của Bạn
                  </span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              {/* 4 Core Dimensions */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[10px] text-stone-400 block">Chiều cao</span>
                  <span className="font-mono font-extrabold text-emerald-400 text-sm">{userBody.height_cm} cm</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[10px] text-stone-400 block">Cân nặng</span>
                  <span className="font-mono font-extrabold text-emerald-400 text-sm">{userBody.weight_kg} kg</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[10px] text-stone-400 block">Vòng ngực (V1)</span>
                  <span className="font-mono font-extrabold text-white text-sm">{userBody.chest_cm} cm</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[10px] text-stone-400 block">Vòng eo (V2)</span>
                  <span className="font-mono font-extrabold text-white text-sm">{userBody.waist_cm} cm</span>
                </div>
              </div>

              {/* Ramanujan 3D Fit Prediction */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-500/30 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-blue-300 font-bold">Khuyên dùng bộ này:</span>
                  <span className="px-2 py-0.5 rounded font-mono font-black bg-blue-500 text-white text-xs">
                    Size {currentLook.recommended_size}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-stone-300">
                  <span>Độ vừa vặn AI:</span>
                  <span className="font-bold text-emerald-400 font-mono">{currentLook.match_percentage}% Match</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-stone-300">
                  <span>Độ cử động may đo:</span>
                  <span className="font-bold text-blue-300 font-mono">+{currentLook.chest_ease} cm (Êm ái)</span>
                </div>
              </div>

              {/* Fabric Spec */}
              <div className="text-[11px] text-stone-400">
                <span className="font-bold text-stone-300 block mb-0.5">Chất liệu vải:</span>
                <p className="leading-snug">{currentLook.fabric}</p>
              </div>
            </div>

            {/* Bottom Undo / Redo / Reset Floating Capsule */}
            <div className="p-2 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-around shadow-xl">
              <button
                type="button"
                onClick={handleUndo}
                disabled={historyPointer <= 0}
                className="p-2 rounded-xl text-stone-300 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all cursor-pointer"
                title="Quay lại bộ trước"
              >
                <Undo2 size={16} />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={historyPointer >= history.length - 1}
                className="p-2 rounded-xl text-stone-300 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all cursor-pointer"
                title="Tiếp theo"
              >
                <Redo2 size={16} />
              </button>
              <button
                type="button"
                onClick={() => handleSelectLook(0)}
                className="p-2 rounded-xl text-stone-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                title="Khôi phục mặc định"
              >
                <RotateCcw size={16} />
              </button>
            </div>

          </div>

          {/* Center Column (lg:col-span-5): 3D Model Viewport with Signature Scan Line Wipe */}
          <div className="lg:col-span-5 relative flex items-center justify-center overflow-hidden">
            
            {/* The Model Container */}
            <div className="relative w-full h-[75vh] max-h-[800px] flex items-center justify-center">
              
              {/* Ground Shadow */}
              <div className="absolute bottom-6 w-48 h-8 rounded-full bg-black/60 blur-md pointer-events-none" />

              {/* The Photoreal Cutout Image */}
              <div className="relative h-full w-auto aspect-[1360/2048] flex items-center justify-center overflow-hidden">
                <img
                  src={currentLook.img}
                  alt={currentLook.name}
                  className="w-full h-full object-contain object-bottom pointer-events-none transition-all duration-300 select-none"
                  style={{
                    filter: isWiping ? 'brightness(1.08)' : 'none',
                  }}
                />

                {/* ── SIGNATURE SCAN LINE WIPE OVERLAY ── */}
                {isWiping && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {/* Glowing White Scan Beam Riding Downwards */}
                    <div
                      className="absolute left-[-15%] right-[-15%] h-1 bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_25px_8px_rgba(255,255,255,0.8),0_0_60px_18px_rgba(59,130,246,0.5)] animate-scan-wipe"
                    />
                  </div>
                )}

                {/* Hotspot 1: Chest Ease Allowance Dot */}
                <div className="absolute top-[34%] left-[58%] group/hotspot cursor-pointer">
                  <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-white/20 backdrop-blur-md border border-white/60 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-white" />
                    <span className="animate-ping absolute inset-0 rounded-full bg-blue-400 opacity-60" />
                  </div>
                  {/* Tooltip */}
                  <div className="absolute left-8 top-1/2 -translate-y-1/2 hidden group-hover/hotspot:block whitespace-nowrap px-3 py-1.5 rounded-xl bg-black/85 backdrop-blur-md border border-white/20 text-[11px] shadow-xl z-30">
                    <span className="font-extrabold text-blue-300">Vòng Ngực Áo:</span> {userBody.chest_cm + currentLook.chest_ease}cm (+{currentLook.chest_ease}cm Ease)
                  </div>
                </div>

                {/* Hotspot 2: Waist Ease Allowance Dot */}
                <div className="absolute top-[48%] left-[42%] group/hotspot cursor-pointer">
                  <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-white/20 backdrop-blur-md border border-white/60 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="animate-ping absolute inset-0 rounded-full bg-emerald-400 opacity-60" />
                  </div>
                  <div className="absolute left-8 top-1/2 -translate-y-1/2 hidden group-hover/hotspot:block whitespace-nowrap px-3 py-1.5 rounded-xl bg-black/85 backdrop-blur-md border border-white/20 text-[11px] shadow-xl z-30">
                    <span className="font-extrabold text-emerald-300">Vòng Eo Áo:</span> {userBody.waist_cm + currentLook.waist_ease}cm
                  </div>
                </div>

              </div>

              {/* Active Look Name Pill Floating Bottom */}
              <div className="absolute bottom-4 inset-x-8 flex items-center justify-between px-4 py-2.5 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15">
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5">
                    <span>{currentLook.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 text-stone-300">
                      {currentLook.tag}
                    </span>
                  </h3>
                  <span className="text-xs font-bold text-amber-300 font-mono">
                    {currentLook.price.toLocaleString('vi-VN')} ₫
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSavedToLibrary(true);
                      setTimeout(() => setSavedToLibrary(false), 2000);
                    }}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-stone-200 transition-colors cursor-pointer"
                    title="Lưu vào tủ đồ"
                  >
                    {savedToLibrary ? <Check size={16} className="text-emerald-400" /> : <Bookmark size={16} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onAddToCart) {
                        const fakeProd: any = {
                          id: `vell-${currentLook.id}`,
                          name: currentLook.name,
                          price: currentLook.price,
                          image_url: currentLook.img,
                          brand_name: 'VELL Atelier',
                          fabric_material: currentLook.fabric,
                          category: currentLook.category,
                        };
                        onAddToCart(fakeProd, currentLook.recommended_size);
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/30 transition-all cursor-pointer"
                  >
                    <ShoppingBag size={14} />
                    <span>Mua Size {currentLook.recommended_size}</span>
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* Right Column (lg:col-span-4): Outfits Selector / Studio Tabs Panel */}
          <div className="lg:col-span-4 p-4 sm:p-6 overflow-y-auto space-y-4 z-10 pointer-events-auto">
            
            {activeTab === 'outfits' && (
              <div className="space-y-4">
                
                {/* Outfits Category Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                  {[
                    { id: 'all', label: 'Tất Cả (8)' },
                    { id: 'everyday', label: 'Hàng Ngày' },
                    { id: 'formal', label: 'Dạ Hội / Vest' },
                    { id: 'athletic', label: 'Thể Thao' },
                    { id: 'sleep', label: 'Lụa Mềm' },
                    { id: 'street', label: 'Streetwear' },
                  ].map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setActiveCategory(c.id)}
                      className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all cursor-pointer ${
                        activeCategory === c.id
                          ? 'bg-white text-stone-950 shadow-md'
                          : 'bg-white/10 hover:bg-white/20 text-stone-300'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                {/* 4x2 Looks Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  {filteredLooks.map((look) => {
                    const isSelected = look.id === activeLookIndex;
                    return (
                      <div
                        key={look.id}
                        onClick={() => handleSelectLook(look.id)}
                        className={`group relative p-2 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-400 shadow-lg shadow-blue-500/20 ring-2 ring-blue-500'
                            : 'bg-white/5 hover:bg-white/10 border-white/10'
                        }`}
                      >
                        <div className="relative aspect-[3/4] rounded-xl bg-black/40 overflow-hidden mb-2">
                          <img
                            src={look.thumb}
                            alt={look.name}
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute top-1.5 right-1.5">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-black/70 text-emerald-400 backdrop-blur">
                              {look.match_percentage}%
                            </span>
                          </div>
                        </div>

                        <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-blue-300 transition-colors">
                          {look.name}
                        </h4>
                        <div className="flex items-center justify-between text-[11px] mt-0.5">
                          <span className="font-mono text-amber-300 font-bold">{look.price.toLocaleString('vi-VN')} ₫</span>
                          <span className="text-[10px] text-stone-400 font-mono">Size {look.recommended_size}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            )}

            {activeTab === 'body' && (
              <div className="p-5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 space-y-4">
                <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                  <Ruler size={16} className="text-blue-400" />
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-white">
                    Trích Xuất Nhân Trắc Học ISO 8559-1
                  </h3>
                </div>
                <p className="text-xs text-stone-300 leading-relaxed">
                  Hệ thống sử dụng tích phân Ramanujan bậc hai để trích xuất các đường bao chu vi từ ảnh chụp dáng chuẩn của bạn:
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
                    <span className="text-stone-300">Chu vi ngực (Bust/Chest):</span>
                    <span className="font-mono font-bold text-emerald-400">{userBody.chest_cm} cm</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
                    <span className="text-stone-300">Chu vi eo tự nhiên (Waist):</span>
                    <span className="font-mono font-bold text-emerald-400">{userBody.waist_cm} cm</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
                    <span className="text-stone-300">Chu vi mông (Hip):</span>
                    <span className="font-mono font-bold text-emerald-400">{userBody.hip_cm} cm</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
                    <span className="text-stone-300">Rộng vai (Bi-acromial):</span>
                    <span className="font-mono font-bold text-emerald-400">{userBody.shoulder_cm || 43} cm</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'dna' && (
              <div className="p-5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 space-y-4 text-xs">
                <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                  <Sparkles size={16} className="text-purple-400" />
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-white">
                    Tỉ Lệ Vóc Dáng & Phân Tích Hình Thể
                  </h3>
                </div>
                <div className="space-y-3 text-stone-300 leading-relaxed">
                  <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-400/20">
                    <span className="font-bold text-purple-300 block mb-1">Dáng Người: V-Shape (Thước Đo Nam Giới Cân Đối)</span>
                    <span>Tỉ lệ Vai/Eo đạt 1.25. Phù hợp nhất với các thiết kế Regular Slim hoặc Tuxedo tôn bờ vai vững chãi.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-400/20">
                    <span className="font-bold text-blue-300 block mb-1">Khuyến Nghị Cổ Áo:</span>
                    <span>Cổ bẻ Semi-spread hoặc Cổ bấm cổ điển tôn đường nét khuôn mặt góc cạnh.</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'atelier' && (
              <div className="p-5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 space-y-4 text-xs">
                <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                  <ShieldCheck size={16} className="text-amber-400" />
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-white">
                    Quy Trình Cắt May Nhà May (Bespoke Specs)
                  </h3>
                </div>
                <p className="text-stone-300 leading-relaxed">
                  Khi đặt may, số đo của bạn sẽ được mã hóa và chuyển thẳng đến tay thợ may trưởng. Không cần đến tiệm đo dây thủ công.
                </p>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-400/20 space-y-1">
                  <span className="font-bold text-amber-300 block">Cam Kết Vừa Vặn 100%:</span>
                  <p className="text-[11px] text-stone-300">Nếu áo không vừa như dự đoán 3D, xưởng may chỉnh sửa hoàn toàn miễn phí trong 14 ngày.</p>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};

export default VellVirtualStudioModal;

